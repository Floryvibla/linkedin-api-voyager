import { extractSectionFromCache, applyPage } from "./user-included-cache";
import { ProfilePaged } from "./user-types";
import {
  mapDirectPublication,
  mapDirectPatent,
  mapDirectTestScore,
} from "./user-direct-mappers-b";

type PageOpts = { start?: number; count?: number; autoPaginate?: boolean };

const directPage = async <T>(
  id: string,
  key: string,
  mapper: (el: any) => T,
  opts?: PageOpts,
): Promise<ProfilePaged<T>> => {
  const { elements, paging } = await extractSectionFromCache(id, key);
  const mapped = elements.map(mapper).filter(Boolean) as T[];
  return applyPage(mapped, paging.total, opts);
};

export const getLinkedinPublications = (
  identifier: string,
  opts?: PageOpts,
) => directPage(identifier, "profilePublications", mapDirectPublication, opts);

export const getLinkedinPatents = (identifier: string, opts?: PageOpts) =>
  directPage(identifier, "profilePatents", mapDirectPatent, opts);

export const getLinkedinTestScores = (identifier: string, opts?: PageOpts) =>
  directPage(identifier, "profileTestScores", mapDirectTestScore, opts);
