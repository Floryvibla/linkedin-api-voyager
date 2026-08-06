import { extractSectionFromCache, applyPage } from "./user-included-cache";
import { ProfilePaged } from "./user-types";
import { mapDirectLanguage } from "./user-direct-mappers";
import {
  mapDirectVolunteer,
  mapDirectHonor,
  mapDirectCourse,
  mapDirectOrganization,
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

export const getLinkedinVolunteer = (
  identifier: string,
  opts?: PageOpts,
) => directPage(identifier, "profileVolunteerExperiences", mapDirectVolunteer, opts);

export const getLinkedinHonors = (identifier: string, opts?: PageOpts) =>
  directPage(identifier, "profileHonors", mapDirectHonor, opts);

export const getLinkedinCourses = (identifier: string, opts?: PageOpts) =>
  directPage(identifier, "profileCourses", mapDirectCourse, opts);

export const getLinkedinLanguagesDirect = (
  identifier: string,
  opts?: PageOpts,
) => directPage(identifier, "profileLanguages", mapDirectLanguage, opts);

export const getLinkedinOrganizations = (
  identifier: string,
  opts?: PageOpts,
) =>
  directPage(identifier, "profileOrganizations", mapDirectOrganization, opts);
