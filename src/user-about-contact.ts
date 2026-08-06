import { fetchDataApi } from "./config";
import {
  fetchFullProfileRaw,
  resolveProfileEntityUrn,
  PROFILE_ABOUT_QUERY_ID,
  CONTACT_QUERY_ID,
  slugify,
} from "./user-loader";
import { findProfileEntry } from "./user-entry-parsers";
import { getLinkedinExperiencesFlat } from "./user-sections-a";
import { extractText, parseSimpleDate } from "./user-core-parsers";

const EMPTY_CONTACT = { address: null, weChatContactInfo: null, phoneNumbers: null, emailAddress: null, websites: null, twitterHandles: null, birthDate: null, ims: null };
const findInc = (arr: any[], urn: string) => arr?.find((i) => i?.entityUrn === urn);

const resolveGeo = (entry: any, included: any[]): string | null => {
  const geo = entry?.address ?? entry?.geoLocation;
  const d = extractText(entry?.locationName ?? entry?.multiLocaleAddress ?? geo?.defaultLocalizedName);
  if (d) return d;
  const gUrn = geo?.geoUrn ?? geo?.["*geo"] ?? entry?.geoUrn;
  if (typeof gUrn === "string") {
    const g = findInc(included ?? [], gUrn);
    const n = extractText(g?.defaultLocalizedName ?? g?.localizedName ?? g?.defaultLocalizedNameWithoutCountryName);
    if (n) return n;
  }
  const cc = entry?.location?.countryCode;
  return cc ? `Country: ${cc}` : null;
};

const pickContact = (entry: any, included?: any[]) => {
  const pick = (k: string) => entry?.[k] ?? null;
  return {
    address: resolveGeo(entry, included ?? []),
    weChatContactInfo: pick("weChatContactInfo"),
    phoneNumbers: pick("phoneNumbers")?.map?.((p: any) => p?.phoneNumber?.number) ?? null,
    emailAddress: pick("emailAddress")?.emailAddress ?? pick("emailAddress"),
    websites: pick("websites")?.map?.((w: any) => ({ label: w?.label, url: w?.url })) ?? null,
    twitterHandles: pick("twitterHandles"),
    birthDate: parseSimpleDate(pick("birthDate") ?? pick("birthDateOn")),
    ims: pick("ims"),
  };
};

const contactFromGraphQL = async (vanity: string, pid: string) => {
  const res = await fetchDataApi(
    `graphql?includeWebMetadata=true&variables=(memberIdentity:${encodeURIComponent(vanity)})&queryId=${CONTACT_QUERY_ID}`,
  );
  const inc = res?.included || [];
  const d = inc.find((i: any) => i?.entityUrn === `urn:li:fsd_profile:${pid}`);
  return d ? pickContact(d, inc) : EMPTY_CONTACT;
};

export const getProfileSectionAboutById = async (pid: string) => {
  const res = await fetchDataApi(`graphql?variables=(profileUrn:urn%3Ali%3Afsd_profile%3A${pid})&queryId=${PROFILE_ABOUT_QUERY_ID}`);
  for (const item of res?.included || []) for (const c of item?.topComponents || []) {
    const t = c?.components?.textComponent?.text?.text;
    if (typeof t === "string" && t.trim()) return t;
  }
  return "N/A";
};

export const getProfileSectionAbout = async (id: string) => {
  const v = slugify(id);
  try {
    const raw = await fetchFullProfileRaw(v);
    const e = findProfileEntry(raw, v);
    const s = e?.summary ?? e?.multiLocaleSummary?.pt_BR;
    if (typeof s === "string" && s.trim()) return s;
    const pid = resolveProfileEntityUrn(e);
    if (pid) return getProfileSectionAboutById(pid);
  } catch {}
  return "N/A";
};

export const getProfissionalExperiences = async (id: string) => {
  const res = await getLinkedinExperiencesFlat(id, { autoPaginate: true, count: 50 });
  return res.items.map((p: any) => ({
    title: p.title ?? null,
    companyName: p.companyName ?? null,
    company: null,
    location: p.locationName ?? null,
    description: p.description ?? null,
    timePeriod: p.timePeriod ?? null,
  }));
};

export const getContactInfo = async (id: string) => {
  const v = slugify(id);
  try {
    const raw = await fetchFullProfileRaw(v);
    const inc = raw.included || [];
    const e = findProfileEntry(raw, v);
    const d = pickContact(e, inc);
    const hasAny = Object.values(d).some((x) => x !== null && !(Array.isArray(x) && x.length === 0));
    if (hasAny) return d;
    const pid = resolveProfileEntityUrn(e);
    if (pid) return contactFromGraphQL(v, pid);
  } catch {}
  return EMPTY_CONTACT;
};
