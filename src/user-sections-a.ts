import { extractSectionFromCache, applyPage } from "./user-included-cache";
import { ProfilePaged } from "./user-types";
import {
  mapDirectSkill,
  mapDirectEducation,
  mapDirectCertification,
  mapDirectPositionGroup,
  mapDirectPosition,
  mapDirectProject,
  mapDirectLanguage,
} from "./user-direct-mappers";
import { findEntryIncluded } from "./user-section-fetcher";

type PageOpts = { start?: number; count?: number; autoPaginate?: boolean };

const directPage = async <T>(
  id: string,
  key: string,
  mapper: (el: any, ctx?: any) => T,
  opts?: PageOpts & { ctx?: (included: any[], elements: any[]) => any },
): Promise<ProfilePaged<T>> => {
  const { elements, paging, included } = await extractSectionFromCache(id, key);
  const ctx = opts?.ctx ? opts.ctx(included, elements) : undefined;
  const mapped = elements.map((e) => mapper(e, ctx)).filter(Boolean) as T[];
  return applyPage(mapped, paging.total, opts);
};

export const getLinkedinSkills = (
  identifier: string,
  opts?: PageOpts,
) => directPage(identifier, "profileSkills", mapDirectSkill, opts);

export const getLinkedinEducation = (
  identifier: string,
  opts?: PageOpts,
) => directPage(identifier, "profileEducations", mapDirectEducation, opts);

export const getLinkedinCertifications = (
  identifier: string,
  opts?: PageOpts,
) =>
  directPage(identifier, "profileCertifications", mapDirectCertification, opts);

export const getLinkedinProjects = (
  identifier: string,
  opts?: PageOpts,
) => directPage(identifier, "profileProjects", mapDirectProject, opts);

export const getLinkedinLanguages = (
  identifier: string,
  opts?: PageOpts,
) => directPage(identifier, "profileLanguages", mapDirectLanguage, opts);

export const getLinkedinExperiences = async (
  identifier: string,
  opts?: PageOpts,
): Promise<ProfilePaged<any>> => {
  const { elements, paging, included } = await extractSectionFromCache(
    identifier,
    "profilePositionGroups",
  );
  const mapped = elements.map((grp) => {
    const nestedCol = grp?.["*profilePositionInPositionGroup"];
    const nestedShell = nestedCol ? findEntryIncluded(included, nestedCol) : null;
    const nestedUrns = nestedShell?.["*elements"] ?? nestedShell?.elements ?? [];
    const positions = Array.isArray(nestedUrns)
      ? nestedUrns
          .map((u: any) => findEntryIncluded(included, u))
          .filter(Boolean)
      : [];
    return mapDirectPositionGroup(grp, positions);
  });
  return applyPage(mapped, paging.total, opts);
};

export const getLinkedinExperiencesFlat = async (
  identifier: string,
  opts?: PageOpts,
): Promise<ProfilePaged<any>> => {
  const raw = await getLinkedinExperiences(identifier, opts);
  const flat = raw.items.flatMap((grp) =>
    grp.positions && grp.positions.length
      ? grp.positions.map((p: any) => ({
          ...p,
          companyName: p.companyName || grp.companyName,
          companyUrn: p.companyUrn || grp.companyUrn,
          groupEntityUrn: grp.entityUrn,
        }))
      : {
          title: null,
          companyName: grp.companyName,
          companyUrn: grp.companyUrn,
          entityUrn: grp.entityUrn,
          timePeriod: grp.timePeriod,
          groupEntityUrn: grp.entityUrn,
          positions: null,
        },
  );
  return applyPage(flat, raw.paging.total, opts);
};
