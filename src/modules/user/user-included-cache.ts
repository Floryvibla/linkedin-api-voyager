import { fetchFullProfileRaw } from "./user-loader";
import { findProfileEntry, getStarredCollectionUrn } from "./user-entry-parsers";
import { slugify } from "./user-loader";
import { ProfilePaged } from "./user-types";

const payloadCache = new Map<string, Promise<any>>();

const getCachedRaw = async (identifier: string) => {
  const key = slugify(identifier);
  if (!payloadCache.has(key)) {
    payloadCache.set(key, fetchFullProfileRaw(key));
  }
  return payloadCache.get(key)!;
};

const resolveItem = (included: any[], urnOrItem: any): any => {
  if (!urnOrItem) return null;
  if (typeof urnOrItem !== "string") return urnOrItem;
  return included.find((i) => i.entityUrn === urnOrItem) ?? urnOrItem;
};

const resolveItems = (included: any[], arr: any[] | string): any[] => {
  if (!arr) return [];
  if (typeof arr === "string") {
    const resolved = resolveItem(included, arr);
    const nested = resolved?.["*elements"] ?? resolved?.elements;
    return Array.isArray(nested) ? resolveItems(included, nested) : [];
  }
  return arr.map((u) => resolveItem(included, u)).filter(Boolean);
};

export const extractSectionFromCache = async (
  identifier: string,
  starredKey: string,
): Promise<{
  shell: any;
  elements: any[];
  paging: { start: number; count: number; total: number };
  profileEntry: any;
  included: any[];
}> => {
  const raw = await getCachedRaw(identifier);
  const included = raw.included || [];
  const profileEntry = findProfileEntry(raw, slugify(identifier));
  const urn = getStarredCollectionUrn(profileEntry, starredKey);
  const shell = resolveItem(included, urn);
  const elementsUrns = shell?.["*elements"] ?? shell?.elements ?? [];
  const elements = resolveItems(included, elementsUrns);
  const paging = shell?.paging ?? {
    start: 0,
    count: elements.length,
    total: elements.length,
  };
  return {
    shell,
    elements,
    paging: {
      start: Number(paging.start ?? 0) || 0,
      count: Number(paging.count ?? elements.length) || elements.length,
      total: Number(paging.total ?? elements.length) || elements.length,
    },
    profileEntry,
    included,
  };
};

export const applyPage = <T>(
  elements: T[],
  pagingTotal: number,
  opts?: { start?: number; count?: number; autoPaginate?: boolean },
): ProfilePaged<T> => {
  const start = opts?.start ?? 0;
  const count = opts?.count ?? elements.length;
  const sliced =
    !opts?.start && !opts?.count
      ? elements
      : elements.slice(start, start + count);
  return {
    paging: { start, count: sliced.length, total: pagingTotal || elements.length },
    items: sliced,
  };
};
