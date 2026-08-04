/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchDataApi } from "./config";
import { getIdFromUrn, assert, extractDataWithReferences } from "./utils";
import {
  ISearchCompanyPeopleParams,
  ISearchPeopleResponse,
  ProfileSearchResult,
} from "./types";

const MINI_COMPANY_DECORATION =
  "com.linkedin.voyager.dash.deco.organization.MiniCompany-10";
const SEARCH_CLUSTERS_QUERY_ID =
  "voyagerSearchDashClusters.a7a0567fa66c52d645b5ff2f960b92aa";

export const getCompanyEntityId = async (slug: string): Promise<string> => {
  const uri =
    `/voyagerOrganizationDashCompanies?decorationId=${MINI_COMPANY_DECORATION}` +
    `&q=universalName&universalName=${encodeURIComponent(slug)}`;
  const res = await fetchDataApi(uri);
  const els = extractDataWithReferences(
    res?.data?.["*elements"] ?? [],
    res?.included ?? [],
  );
  const urn = els?.[0]?.entityUrn;
  assert(urn, `Company not found for slug: ${slug}`);
  return urn.split(":").at(-1) as string;
};

const innerProfile = (s: string) =>
  s.match(/\((urn:li:fsd_profile:[^,)]+)/)?.[1];

const mapPerson = (vm: any): ProfileSearchResult | null => {
  const name = vm?.title?.text,
    nav = vm?.navigationUrl?.split("?")[0];
  if (!name || !nav) return null;
  const inner = vm.entityUrn ? innerProfile(vm.entityUrn) : undefined;
  const urnId =
    (inner ? getIdFromUrn(inner) : undefined) ??
    getIdFromUrn(getIdFromUrn(vm.entityUrn)) ??
    getIdFromUrn(vm.entityUrn) ??
    name;
  const vec =
    vm.image?.attributes?.[0]?.detailData?.nonEntityProfilePicture?.vectorImage;
  return {
    urnId,
    name,
    url: nav,
    distance: vm.entityCustomTrackingInfo?.memberDistance,
    headline: vm.primarySubtitle?.text,
    location: vm.secondarySubtitle?.text,
    summary: vm.summary?.text || undefined,
    image: vec?.artifacts?.[0]?.fileIdentifyingUrlPathSegment ?? null,
  };
};

const buildVars = (
  cid: string,
  p: ISearchCompanyPeopleParams,
  s: number,
  c: number,
): string => {
  const kvs: string[] = [
    `(key:${p.pastCompany ? "pastCompany" : "currentCompany"},value:List(${cid}))`,
    `(key:resultType,value:List(ORGANIZATION_ALUMNI))`,
  ];
  if (p.query)
    kvs.push(`(key:keywords,value:List(${encodeURIComponent(p.query)}))`);
  if (p.regions?.length)
    kvs.push(`(key:geoUrn,value:List(${p.regions.join(" | ")}))`);
  if (p.schools?.length)
    kvs.push(`(key:schools,value:List(${p.schools.join(" | ")}))`);
  if (p.keywordTitle) kvs.push(`(key:title,value:List(${p.keywordTitle}))`);
  const qp: string[] = [
    "flagshipSearchIntent:ORGANIZATIONS_PEOPLE_ALUMNI",
    `queryParameters:List(${kvs.join(",")})`,
    "includeFiltersInResponse:false",
  ];
  if (p.query) qp.unshift(`keywords:${encodeURIComponent(p.query)}`);
  return `(start:${s},origin:FACETED_SEARCH,query:(${qp.join(",")}),count:${c})`;
};

export const searchCompanyPeople = async (
  p: ISearchCompanyPeopleParams,
): Promise<ISearchPeopleResponse> => {
  const offset = p.offset ?? 0,
    count = Math.min(p.limit ?? 10, 49);
  let cid = p.companyId;
  if (!cid) {
    assert(p.companySlug, "Either companySlug or companyId is required");
    cid = await getCompanyEntityId(p.companySlug);
  }
  const res = await fetchDataApi(
    `/graphql?variables=${buildVars(cid, p, offset, count)}&queryId=${SEARCH_CLUSTERS_QUERY_ID}`,
  );
  const root = res?.data?.data?.searchDashClustersByAll,
    pg = root?.paging;
  const urns: string[] = [];
  for (const cl of root?.elements ?? [])
    for (const it of cl?.items ?? [])
      if (it?.item?.["*entityResult"]) urns.push(it.item["*entityResult"]);
  const vms = extractDataWithReferences(urns, res?.included ?? []);
  const results: ProfileSearchResult[] = [];
  for (const vm of vms) {
    const m = mapPerson(vm);
    if (m && (p.includePrivateProfiles || m.name !== "LinkedIn Member"))
      results.push(m);
  }
  return {
    paging: {
      offset: pg?.start ?? offset,
      count: pg?.count ?? results.length,
      total: root?.metadata?.totalResultCount ?? pg?.total ?? -1,
    },
    results,
  };
};
