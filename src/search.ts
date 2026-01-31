/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchData } from "./config";
import { assert, getIdFromUrn, getUrnFromRawUpdate } from "./utils";
import {
  EntitySearchResult,
  ISearchParams,
  ISearchPeopleParams,
  ISearchPeopleResponse,
  SearchResponse,
} from "./types";

// Constantes
const MAX_SEARCH_COUNT = 25;

export const search = async ({
  offset = 0,
  limit = MAX_SEARCH_COUNT,
  ...opts
}: ISearchParams) => {
  const response: SearchResponse = {
    paging: {
      offset: 0,
      count: 0,
      total: -1,
    },
    results: [],
  };

  const params: any = {
    start: offset,
    count: Math.min(limit, MAX_SEARCH_COUNT),
    filters: "List()",
    origin: "GLOBAL_SEARCH_HEADER",
    ...opts,
  };

  const keywords = params.query
    ? `keywords:${encodeURIComponent(params.query)},`
    : "";

  const uri =
    `graphql?variables=(start:${params.start},origin:${params.origin},` +
    `query:(${keywords}flagshipSearchIntent:SEARCH_SRP,` +
    `queryParameters:${params.filters},includeFiltersInResponse:false))` +
    `&queryId=voyagerSearchDashClusters.bb967969ef89137e6dec45d038310505`;

  const res = await fetchData(uri);

  const dataClusters = res?.data?.data?.searchDashClustersByAll;
  if (!dataClusters) return response;

  if (dataClusters.$type !== "com.linkedin.restli.common.CollectionResponse") {
    return response;
  }

  response.paging.count = dataClusters.paging.count;
  response.paging.total = dataClusters.paging.total;

  for (const element of dataClusters.elements ?? []) {
    if (
      element.$type !==
      "com.linkedin.voyager.dash.search.SearchClusterViewModel"
    ) {
      continue;
    }

    for (const it of element.items ?? []) {
      if (it.$type !== "com.linkedin.voyager.dash.search.SearchItem") {
        continue;
      }

      const item = it?.item;
      if (!item) continue;

      let entity: EntitySearchResult | undefined = item.entityResult;
      if (!entity) {
        const linkedEntityUrn = item["*entityResult"];
        if (!linkedEntityUrn) continue;

        entity = res.included?.find(
          (e: any) => e.entityUrn === linkedEntityUrn,
        );
        if (!entity) continue;
      }

      if (
        entity.$type !==
        "com.linkedin.voyager.dash.search.EntityResultViewModel"
      ) {
        continue;
      }

      response.results.push(entity);
    }
  }

  return response;
};

export async function searchPeople(
  queryOrParams: string | ISearchPeopleParams,
): Promise<ISearchPeopleResponse> {
  const { includePrivateProfiles = true, ...params } =
    typeof queryOrParams === "string"
      ? { query: queryOrParams }
      : queryOrParams;
  const filters: string[] = ["(key:resultType,value:List(PEOPLE))"];

  if (params.connectionOf) {
    filters.push(`(key:connectionOf,value:List(${params.connectionOf}))`);
  }

  if (params.networkDepths) {
    const stringify = params.networkDepths.join(" | ");
    filters.push(`(key:network,value:List(${stringify}))`);
  } else if (params.networkDepth) {
    filters.push(`(key:network,value:List(${params.networkDepth}))`);
  }

  if (params.regions) {
    const stringify = params.regions.join(" | ");
    filters.push(`(key:geoUrn,value:List(${stringify}))`);
  }

  if (params.industries) {
    const stringify = params.industries.join(" | ");
    filters.push(`(key:industry,value:List(${stringify}))`);
  }

  if (params.currentCompany) {
    const stringify = params.currentCompany.join(" | ");
    filters.push(`(key:currentCompany,value:List(${stringify}))`);
  }

  if (params.pastCompanies) {
    const stringify = params.pastCompanies.join(" | ");
    filters.push(`(key:pastCompany,value:List(${stringify}))`);
  }

  if (params.profileLanguages) {
    const stringify = params.profileLanguages.join(" | ");
    filters.push(`(key:profileLanguage,value:List(${stringify}))`);
  }

  if (params.nonprofitInterests) {
    const stringify = params.nonprofitInterests.join(" | ");
    filters.push(`(key:nonprofitInterest,value:List(${stringify}))`);
  }

  if (params.schools) {
    const stringify = params.schools.join(" | ");
    filters.push(`(key:schools,value:List(${stringify}))`);
  }

  if (params.serviceCategories) {
    const stringify = params.serviceCategories.join(" | ");
    filters.push(`(key:serviceCategory,value:List(${stringify}))`);
  }

  // `Keywords` filter
  const keywordTitle = params.keywordTitle ?? params.title;
  if (params.keywordFirstName) {
    filters.push(`(key:firstName,value:List(${params.keywordFirstName}))`);
  }

  if (params.keywordLastName) {
    filters.push(`(key:lastName,value:List(${params.keywordLastName}))`);
  }

  if (keywordTitle) {
    filters.push(`(key:title,value:List(${keywordTitle}))`);
  }

  if (params.keywordCompany) {
    filters.push(`(key:company,value:List(${params.keywordCompany}))`);
  }

  if (params.keywordSchool) {
    filters.push(`(key:school,value:List(${params.keywordSchool}))`);
  }

  const res = await search({
    offset: params.offset,
    limit: params.limit,
    filters: `List(${filters.join(",")})`,
    ...(params.query && { query: params.query }),
  });

  const response: ISearchPeopleResponse = {
    paging: res.paging,
    results: [],
  };

  for (const result of res.results) {
    if (
      !includePrivateProfiles &&
      result.entityCustomTrackingInfo?.memberDistance === "OUT_OF_NETWORK"
    ) {
      continue;
    }

    const urnId = getIdFromUrn(getUrnFromRawUpdate(result.entityUrn));
    assert(urnId);

    const name = result.title?.text;
    assert(name);

    const url = result.navigationUrl?.split("?")[0];
    assert(url);

    response.results.push({
      urnId,
      name,
      url,
      distance: result.entityCustomTrackingInfo?.memberDistance,
      headline: result.primarySubtitle?.text,
      location: result.secondarySubtitle?.text,
      summary: result.summary?.text || undefined,
      image:
        result.image?.attributes?.[0]?.detailData?.nonEntityProfilePicture
          ?.vectorImage?.artifacts?.[0]?.fileIdentifyingUrlPathSegment || null,
    });
  }

  return response;
}
