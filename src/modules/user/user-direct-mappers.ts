import { parseTimePeriod, extractText } from "./user-core-parsers";

const loc = (obj: any) => obj?.locationName ?? obj?.geoLocationName ?? null;

export const mapDirectSkill = (it: any) => ({
  name: extractText(it.name ?? it.multiLocaleName),
  entityUrn: it?.entityUrn,
  endorsementCount: it.endorsementCount ?? it.numEndorsements ?? null,
});

export const mapDirectEducation = (it: any) => ({
  schoolName: extractText(it.schoolName ?? it.multiLocaleSchoolName),
  degreeName: extractText(it.degreeName ?? it.multiLocaleDegreeName),
  fieldOfStudy: extractText(it.fieldOfStudy ?? it.multiLocaleFieldOfStudy) || null,
  grade: extractText(it.grade ?? it.multiLocaleGrade) || null,
  activities: extractText(it.activities ?? it.multiLocaleActivities) || null,
  description: extractText(it.description ?? it.multiLocaleDescription) || null,
  schoolUrn: it.schoolUrn ?? null,
  timePeriod: parseTimePeriod(it.dateRange),
});

export const mapDirectCertification = (it: any) => ({
  name: extractText(it.name ?? it.multiLocaleName),
  authority: extractText(it.authority ?? it.multiLocaleAuthority) || null,
  licenseNumber: it.licenseNumber ?? null,
  displaySource: it.displaySource ?? null,
  url: it.url ?? null,
  companyUrn: it.companyUrn ?? null,
  timePeriod: parseTimePeriod(it.dateRange),
});

export const mapDirectPosition = (pos: any) => ({
  title: extractText(pos.title ?? pos.multiLocaleTitle),
  companyName: extractText(pos.companyName ?? pos.multiLocaleCompanyName),
  companyUrn: pos.companyUrn ?? null,
  locationName: loc(pos),
  geoUrn: pos.geoUrn ?? null,
  employmentTypeUrn: pos.employmentTypeUrn ?? null,
  entityUrn: pos.entityUrn ?? null,
  description: extractText(pos.description ?? pos.multiLocaleDescription) || null,
  timePeriod: parseTimePeriod(pos.dateRange),
});

export const mapDirectPositionGroup = (
  grp: any,
  nestedPositions: any[] = [],
) => ({
  companyName: extractText(grp.companyName ?? grp.multiLocaleCompanyName),
  companyUrn: grp.companyUrn ?? null,
  entityUrn: grp.entityUrn ?? null,
  timePeriod: parseTimePeriod(grp.dateRange),
  positions: nestedPositions.map(mapDirectPosition),
});

export const mapDirectProject = (it: any) => ({
  title: extractText(it.title ?? it.multiLocaleTitle),
  description: extractText(it.description ?? it.multiLocaleDescription) || null,
  timePeriod: parseTimePeriod(it.dateRange),
  url: it.url ?? null,
  contributors: it.contributors ?? null,
  entityUrn: it.entityUrn ?? null,
});

export const mapDirectLanguage = (it: any) => ({
  name: extractText(it.name ?? it.multiLocaleName),
  proficiency: it.proficiency ?? null,
  entityUrn: it.entityUrn ?? null,
});
