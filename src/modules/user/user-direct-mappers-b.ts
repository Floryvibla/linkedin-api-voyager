import { parseTimePeriod, extractText } from "./user-core-parsers";

export const mapDirectVolunteer = (it: any) => ({
  role: extractText(it.role ?? it.title ?? it.multiLocaleTitle ?? it.multiLocaleRole),
  organization: extractText(
    it.organizationName ?? it.companyName ?? it.multiLocaleOrganizationName,
  ),
  cause: extractText(it.cause ?? it.multiLocaleCause) || null,
  description: extractText(
    it.description ?? it.multiLocaleDescription,
  ) || null,
  timePeriod: parseTimePeriod(it.dateRange ?? it.timePeriod),
  entityUrn: it.entityUrn ?? null,
});

export const mapDirectHonor = (it: any) => ({
  title: extractText(it.title ?? it.name ?? it.multiLocaleTitle ?? it.multiLocaleName),
  issuer: extractText(it.issuer ?? it.presenter ?? it.multiLocaleIssuer) || null,
  description: extractText(it.description ?? it.multiLocaleDescription) || null,
  issueDate: parseTimePeriod(it.dateRange ?? it.issueDate)?.start,
  entityUrn: it.entityUrn ?? null,
});

export const mapDirectCourse = (it: any) => ({
  name: extractText(it.name ?? it.title ?? it.multiLocaleName),
  number: it.number ?? it.courseNumber ?? null,
  entityUrn: it.entityUrn ?? null,
});

export const mapDirectOrganization = (it: any) => ({
  name: extractText(it.name ?? it.title ?? it.multiLocaleName),
  position: extractText(it.position ?? it.role ?? it.multiLocalePosition) || null,
  description: extractText(it.description ?? it.multiLocaleDescription) || null,
  timePeriod: parseTimePeriod(it.dateRange ?? it.timePeriod),
  entityUrn: it.entityUrn ?? null,
});

export const mapDirectPublication = (it: any) => ({
  name: extractText(it.name ?? it.title ?? it.multiLocaleName ?? it.multiLocaleTitle),
  publisher: extractText(it.publisher ?? it.multiLocalePublisher) || null,
  description: extractText(
    it.description ?? it.multiLocaleDescription,
  ) || null,
  url: it.url ?? null,
  timePeriod: parseTimePeriod(it.dateRange ?? it.publishedOn),
  authors: it.authors ?? null,
  entityUrn: it.entityUrn ?? null,
});

export const mapDirectPatent = (it: any) => ({
  title: extractText(it.title ?? it.name ?? it.multiLocaleTitle ?? it.multiLocaleName),
  issuer: extractText(it.issuingAuthority ?? it.issuer ?? it.multiLocaleIssuingAuthority) || null,
  patentNumber: it.patentNumber ?? it.number ?? null,
  description: extractText(
    it.description ?? it.multiLocaleDescription,
  ) || null,
  url: it.url ?? null,
  issueDate: parseTimePeriod(it.dateRange ?? it.issueDate)?.start,
  entityUrn: it.entityUrn ?? null,
});

export const mapDirectTestScore = (it: any) => ({
  name: extractText(it.name ?? it.title ?? it.multiLocaleName ?? it.multiLocaleTitle),
  score: extractText(it.score ?? it.multiLocaleScore) || null,
  description: extractText(
    it.description ?? it.multiLocaleDescription,
  ) || null,
  timePeriod: parseTimePeriod(it.dateRange ?? it.issuedOn),
  entityUrn: it.entityUrn ?? null,
});
