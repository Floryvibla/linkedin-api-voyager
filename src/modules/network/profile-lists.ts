import { fetchDataApi } from "../../core/config";
import type {
  NetworkPaginationArgs,
  ProfileListItem,
  ProfileListResponse,
} from "./types";
import {
  SEARCH_CLUSTERS_QUERY_ID,
  buildSearchVars,
  mapClusterItem,
} from "./profile-lists-shared";
import { resolveMemberId } from "./network-helpers";

type SearchRes = { data?: Record<string, unknown> } & Record<string, unknown>;

type Clusters = {
  searchDashClustersByAll?: {
    elements?: Array<{
      items?: Array<{ item?: { entityResult?: unknown } }>;
    }>;
    paging?: { start?: number; count?: number; total?: number };
    metadata?: { totalResultCount?: number };
  };
};

const mapRawItem = (raw: unknown): ProfileListItem =>
  mapClusterItem(raw as Record<string, unknown>);

const fetchProfileCollection = async (
  profileIdentifier: string,
  collectionType: "CONNECTIONS" | "FOLLOWERS" | "FOLLOWING",
  opts: NetworkPaginationArgs,
): Promise<ProfileListResponse> => {
  const looksLikeMemberId = /^ACoA/.test(profileIdentifier);
  const profileMemberId = looksLikeMemberId
    ? profileIdentifier
    : await resolveMemberId({ vanityName: profileIdentifier });
  const variables = buildSearchVars(profileMemberId, collectionType, opts);
  const res = (await fetchDataApi(
    `/graphql?variables=${variables}&queryId=${SEARCH_CLUSTERS_QUERY_ID}`,
  )) as SearchRes;
  const data = (res.data ?? res) as unknown as Clusters;
  const clusters = data.searchDashClustersByAll;
  const items =
    clusters?.elements?.flatMap((el) =>
      (el.items ?? [])
        .map((i) => i.item?.entityResult)
        .filter(Boolean)
        .map(mapRawItem),
    ) ?? [];
  return {
    start: opts.start ?? 0,
    count: opts.count ?? 10,
    total:
      clusters?.metadata?.totalResultCount ??
      clusters?.paging?.total ??
      items.length,
    items,
  };
};

export const getProfileConnections = (
  profileIdentifier: string,
  opts: NetworkPaginationArgs = {},
) => fetchProfileCollection(profileIdentifier, "CONNECTIONS", opts);

export const getProfileFollowers = (
  profileIdentifier: string,
  opts: NetworkPaginationArgs = {},
) => fetchProfileCollection(profileIdentifier, "FOLLOWERS", opts);

export const getProfileFollowing = (
  profileIdentifier: string,
  opts: NetworkPaginationArgs = {},
) => fetchProfileCollection(profileIdentifier, "FOLLOWING", opts);
