import type {
  CollectionType,
  NetworkPaginationArgs,
  ProfileListItem,
} from "./types";

export const SEARCH_CLUSTERS_QUERY_ID =
  "voyagerSearchDashClusters.bb967969ef89137e6dec45d038310505";

export const mapClusterItem = (
  raw: Record<string, unknown>,
): ProfileListItem => {
  const e = raw as unknown as {
    entityUrn?: string;
    title?: { text?: string };
    primarySubtitle?: { text?: string };
    secondarySubtitle?: { text?: string };
    image?: {
      attributes?: Array<{
        detailData?: {
          vectorImage?: {
            rootUrl?: string;
            artifacts?: Array<{ fileIdentifyingUrlPathSegment?: string }>;
          };
        };
      }>;
    };
    trackingUrn?: string;
  };
  const match = /urn:li:fsd_(?:profile|member):([^,)]+)/.exec(
    e.entityUrn ?? e.trackingUrn ?? "",
  );
  const memberId = match?.[1];
  const vimg = e.image?.attributes?.[0]?.detailData?.vectorImage;
  const photoUrl = vimg
    ? `${vimg.rootUrl}${vimg.artifacts?.[0]?.fileIdentifyingUrlPathSegment ?? ""}`
    : undefined;
  const names = (e.title?.text ?? "").split(" ");
  return {
    memberId,
    firstName: names[0] ?? undefined,
    lastName: names.slice(1).join(" ") || undefined,
    headline: e.primarySubtitle?.text,
    location: e.secondarySubtitle?.text,
    entityUrn: e.entityUrn,
    photoUrl,
  };
};

export const buildSearchVars = (
  profileMemberId: string,
  collectionType: CollectionType,
  p: NetworkPaginationArgs,
) => {
  const start = p.start ?? 0;
  const count = p.count ?? 10;
  const collectionKey =
    collectionType === "CONNECTIONS"
      ? "COLLECTION_TYPE_CONNECTIONS"
      : collectionType === "FOLLOWERS"
        ? "COLLECTION_TYPE_FOLLOWERS"
        : "COLLECTION_TYPE_FOLLOWING";
  return JSON.stringify({
    requestId: collectionKey,
    includeWebMetadata: true,
    query: "",
    start,
    count,
    filters: [
      { filterType: "PEOPLE", values: [collectionKey], valuesList: [collectionKey] },
      { filterType: "CURRENT_COMPANY", values: [], valuesList: [] },
      { filterType: "PAST_COMPANY", values: [], valuesList: [] },
      { filterType: "SCHOOL", values: [], valuesList: [] },
      {
        filterType: "NETWORK",
        values: [collectionKey],
        valuesList: [collectionKey],
        params: {
          facetNetwork: [collectionKey],
          connectionOf: [`urn:li:fsd_member:${profileMemberId}`],
        },
      },
      { filterType: "FIRST_NAME", values: [], valuesList: [] },
      { filterType: "LAST_NAME", values: [], valuesList: [] },
    ],
    queryContext: { start, count },
  }).replace(/"/g, "\\'");
};
