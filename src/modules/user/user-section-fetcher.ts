import { fetchDataApi } from "../../core/config";
import {
  resolveProfileEntityUrn,
  SECTIONS_QUERY_ID,
  slugify,
  fetchFullProfileRaw,
  extractProfileIdLinkedin,
} from "./user-loader";
import { findProfileEntry, getStarredCollectionUrn } from "./user-entry-parsers";
import { SectionType } from "./user-types";

const buildGraphqlSectionEndpoint = (
  profileId: string,
  section: SectionType,
  start: number,
  count: number,
) =>
  `graphql?includeWebMetadata=true&variables=(profileUrn:urn%3Ali%3Afsd_profile%3A${profileId},sectionType:${section},locale:pt_BR,start:${start},count:${count})&queryId=${SECTIONS_QUERY_ID}`;

export const findEntryIncluded = (
  included: any[],
  urn: string | null,
): any | null => {
  if (!urn || !Array.isArray(included)) return null;
  return included.find((i) => i.entityUrn === urn) ?? null;
};

const extractCollectionElementsAndPaging = (collection: any) => {
  if (!collection) return null;
  const paging =
    collection.paging ??
    collection.components?.paging ?? { start: 0, count: 0, total: 0 };
  const elements =
    collection.elements ??
    collection.components?.elements ??
    collection.subComponents?.components ??
    [];
  return Array.isArray(elements) ? { elements, paging } : null;
};

const flattenTetrisElements = (raw: any) => {
  const included: any[] = Array.isArray(raw?.included) ? raw.included : [];
  const pagedLists = included.filter(
    (i) =>
      i?.$type ===
      "com.linkedin.voyager.dash.identity.profile.tetris.PagedListComponent",
  );
  const all: any[] = [];
  let paging = { start: 0, count: 0, total: 0 };
  for (const p of pagedLists) {
    const e = extractCollectionElementsAndPaging(p);
    if (e) {
      all.push(...e.elements);
      paging = e.paging;
    }
  }
  return { elements: all, paging };
};

export const fetchSectionByStarredUrn = async (
  profileEntry: any,
  collectionKey: string,
  start: number,
  count: number,
) => {
  const urn = getStarredCollectionUrn(profileEntry, collectionKey);
  if (!urn) return null;
  const profileId = resolveProfileEntityUrn(profileEntry);
  if (!profileId) return null;
  try {
    const endpoint = `/identity/dash/profileSectionCollections/${encodeURIComponent(urn.replace(/^urn:li:collectionResponse:/, ""))}?start=${start}&count=${count}&profileUrn=urn%3Ali%3Afsd_profile%3A${encodeURIComponent(profileId)}`;
    const resp = await fetchDataApi(endpoint);
    const included: any[] = Array.isArray(resp?.included) ? resp.included : [];
    const entry = findEntryIncluded(included, urn);
    const parsed = entry
      ? extractCollectionElementsAndPaging(entry)
      : extractCollectionElementsAndPaging(resp?.data);
    if (parsed) return parsed;
  } catch {}
  return null;
};

export const fetchSectionGraphqlFallback = async (
  profileId: string,
  section: SectionType,
  start: number,
  count: number,
) =>
  flattenTetrisElements(
    await fetchDataApi(buildGraphqlSectionEndpoint(profileId, section, start, count)),
  );
