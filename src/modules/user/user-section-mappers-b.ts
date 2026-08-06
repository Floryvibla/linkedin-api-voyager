import { extractText, parseTimePeriod } from "./user-core-parsers";

const comp = (item: any) => item?.components?.entityComponent ?? item;

export const mapVolunteer = (item: any) => {
  const c = comp(item);
  return {
    role: extractText(c.titleV2),
    organization: extractText(c.subtitle),
    cause: extractText(c.metadata) || null,
    timePeriod: parseTimePeriod(c.timePeriod),
    description: extractText(c.description) || null,
  };
};

export const mapHonor = (item: any) => {
  const c = comp(item);
  return {
    title: extractText(c.titleV2),
    issuer: extractText(c.subtitle),
    issueDate: parseTimePeriod(c.timePeriod)?.start,
    description: extractText(c.description) || null,
  };
};

export const mapCourse = (item: any) => {
  const c = comp(item);
  return {
    name: extractText(c.titleV2),
    number: c.number ?? null,
  };
};

export const mapLanguage = (item: any) => {
  const c = comp(item);
  return {
    name: extractText(c.titleV2),
    proficiency: extractText(c.subtitle) || null,
  };
};

export const mapOrganization = (item: any) => {
  const c = comp(item);
  return {
    name: extractText(c.titleV2),
    position: extractText(c.subtitle) || null,
    timePeriod: parseTimePeriod(c.timePeriod),
  };
};

export const mapPublication = (item: any) => {
  const c = comp(item);
  return {
    name: extractText(c.titleV2),
    publisher: extractText(c.subtitle),
    description: extractText(c.description) || null,
    url: c.url ?? c.textActionTarget ?? null,
    timePeriod: parseTimePeriod(c.timePeriod),
    authors: c.authors ?? null,
  };
};

export const mapPatent = (item: any) => {
  const c = comp(item);
  return {
    title: extractText(c.titleV2),
    issuer: extractText(c.subtitle),
    patentNumber: c.patentNumber ?? null,
    description: extractText(c.description) || null,
    url: c.url ?? null,
    issueDate: parseTimePeriod(c.timePeriod)?.start,
  };
};

export const mapTestScore = (item: any) => {
  const c = comp(item);
  return {
    name: extractText(c.titleV2),
    score: extractText(c.subtitle) || null,
    description: extractText(c.description) || null,
    timePeriod: parseTimePeriod(c.timePeriod),
  };
};

export const mapRecommendation = (item: any) => {
  const c = comp(item);
  return {
    recommender: {
      name: extractText(c.titleV2),
      headline: extractText(c.subtitle),
    },
    text: extractText(c.description),
    recommendationType: c.recommendationType ?? null,
    timePeriod: parseTimePeriod(c.timePeriod),
  };
};
