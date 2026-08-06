/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchDataApi } from "../../core/config";
import {
  EntitySearchResult,
  ISearchCompanyPeopleParams,
  ISearchPeopleResponse,
  ProfileSearchResult,
} from "./types";
import { assert, extractDataWithReferences, getIdFromUrn } from "../../core/utils";

const MINI_COMPANY_DECORATION =
  "com.linkedin.voyager.dash.deco.organization.MiniCompany-10";
const SEARCH_CLUSTERS_QUERY_ID =
  "voyagerSearchDashClusters.a7a0567fa66c52d645b5ff2f960b92aa";
const innerProfile = (s: string) =>
  s.match(/\((urn:li:fsd_profile:[^,)]+)/)?.[1];

export const getCompanyEntityId = async (slug: string): Promise<string> => {
  const uri = `/voyagerOrganizationDashCompanies?decorationId=${MINI_COMPANY_DECORATION}&q=universalName&universalName=${encodeURIComponent(slug)}`;
  const res = await fetchDataApi(uri);
  const els = extractDataWithReferences(
    res?.data?.["*elements"] ?? [],
    res?.included ?? [],
  );
  const urn = els?.[0]?.entityUrn;
  assert(urn, `Company not found for slug: ${slug}`);
  return urn.split(":").at(-1) as string;
};

const resolveEntity = (
  item: any,
  included: any[],
): EntitySearchResult | null => {
  if (item?.entityResult) return item.entityResult;
  const urn = item?.["*entityResult"];
  return (urn && included.find((entry) => entry.entityUrn === urn)) || null;
};

const mapPerson = (vm: EntitySearchResult): ProfileSearchResult | null => {
  const name = vm.title?.text,
    url = vm.navigationUrl?.split("?")[0];
  if (!name) return null;
  const inner = vm.entityUrn ? innerProfile(vm.entityUrn) : undefined;
  const urnId =
    (inner ? getIdFromUrn(inner) : undefined) ??
    getIdFromUrn(getIdFromUrn(vm.entityUrn)) ??
    getIdFromUrn(vm.entityUrn) ??
    name;
  const image =
    vm.image?.attributes?.[0]?.detailData?.nonEntityProfilePicture?.vectorImage
      ?.artifacts?.[0]?.fileIdentifyingUrlPathSegment ?? null;
  return {
    urnId,
    name,
    url,
    distance: vm.entityCustomTrackingInfo?.memberDistance,
    headline: vm.primarySubtitle?.text,
    location: vm.secondarySubtitle?.text,
    summary: vm.summary?.text || undefined,
    image,
  };
};

const buildVars = (
  cid: string,
  p: ISearchCompanyPeopleParams,
  start: number,
  count: number,
): string => {
  const params = [
    `(key:${p.pastCompany ? "pastCompany" : "currentCompany"},value:List(${cid}))`,
    "(key:resultType,value:List(ORGANIZATION_ALUMNI))",
    ...(p.query
      ? [`(key:keywords,value:List(${encodeURIComponent(p.query)}))`]
      : []),
    ...(p.regions?.length
      ? [`(key:geoUrn,value:List(${p.regions.join(" | ")}))`]
      : []),
    ...(p.schools?.length
      ? [`(key:schools,value:List(${p.schools.join(" | ")}))`]
      : []),
    ...(p.keywordTitle ? [`(key:title,value:List(${p.keywordTitle}))`] : []),
  ];
  const query = [
    "flagshipSearchIntent:ORGANIZATIONS_PEOPLE_ALUMNI",
    `queryParameters:List(${params.join(",")})`,
    "includeFiltersInResponse:false",
  ];
  if (p.query) query.unshift(`keywords:${encodeURIComponent(p.query)}`);
  return `(start:${start},origin:FACETED_SEARCH,query:(${query.join(",")}),count:${count})`;
};

export const searchCompanyPeople = async (
  p: ISearchCompanyPeopleParams,
): Promise<ISearchPeopleResponse> => {
  const offset = p.offset ?? 0,
    count = Math.min(p.limit ?? 10, 49),
    includePrivateProfiles = p.includePrivateProfiles ?? true;
  let companyId = p.companyId;
  if (!companyId) {
    assert(p.companySlug, "Either companySlug or companyId is required");
    companyId = await getCompanyEntityId(p.companySlug);
  }
  const uri = `/graphql?variables=${buildVars(companyId, p, offset, count)}&queryId=${SEARCH_CLUSTERS_QUERY_ID}`;
  const res = await fetchDataApi(uri);
  const root = res?.data?.data?.searchDashClustersByAll,
    paging = root?.paging,
    included = res?.included ?? [];
  const urns = (root?.elements ?? []).flatMap((cluster: any) =>
    (cluster?.items ?? [])
      .map((entry: any) => resolveEntity(entry?.item, included)?.entityUrn)
      .filter(Boolean),
  );
  const entities = extractDataWithReferences(
    urns,
    included,
  ) as EntitySearchResult[];
  const results = entities
    .map(mapPerson)
    .filter((item): item is ProfileSearchResult =>
      Boolean(item && (includePrivateProfiles || item.url)),
    );
  return {
    paging: {
      offset: paging?.start ?? offset,
      count: paging?.count ?? results.length,
      total: root?.metadata?.totalResultCount ?? paging?.total ?? -1,
    },
    results,
  };
};
