import { getCompany } from "./company";
import { fetchDataApi } from "./config";
import { extractExperiences, getDataIncludedForEntity } from "./utils";
import { findProfileEntry } from "./user-parsers";

const PROFILE_ABOUT_QUERY_ID =
  "voyagerIdentityDashProfileCards.55af784c21dc8640b500ab5b45937064";
const SECTIONS_QUERY_ID =
  "voyagerIdentityDashProfileComponents.c5d4db426a0f8247b8ab7bc1d660775a";
const CONTACT_QUERY_ID =
  "voyagerIdentityDashProfiles.c7452e58fa37646d09dae4920fc5b4b9";
const PROFILE_DECORATION_TOP =
  "com.linkedin.voyager.dash.deco.identity.profile.FullProfile-138";

export const resolveProfileEntityUrn = (profile: any): string | null => {
  if (!profile?.entityUrn) return null;
  return profile.entityUrn.replace(/^urn:li:fsd_profile:/, "");
};

export const extractProfileIdLinkedin = async (
  profileUrl: string,
): Promise<string | null> => {
  const match = profileUrl.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/);
  const vanityName = match ? match[1] : profileUrl;
  if (!vanityName) return null;
  const endpoint = `/identity/dash/profiles?q=memberIdentity&memberIdentity=${encodeURIComponent(vanityName)}&decorationId=${encodeURIComponent(PROFILE_DECORATION_TOP)}`;
  try {
    const response = await fetchDataApi(endpoint);
    return resolveProfileEntityUrn(findProfileEntry(response, vanityName));
  } catch {
    const legacy = await fetchDataApi(
      `graphql?variables=(vanityName:${encodeURIComponent(vanityName)})&queryId=voyagerIdentityDashProfiles.34ead06db82a2cc9a778fac97f69ad6a`,
    );
    return resolveProfileEntityUrn(findProfileEntry(legacy, vanityName));
  }
};

export const getProfileSectionAboutById = async (profileId: string) => {
  const response = await fetchDataApi(
    `graphql?variables=(profileUrn:urn%3Ali%3Afsd_profile%3A${profileId})&queryId=${PROFILE_ABOUT_QUERY_ID}`,
  );
  const data = getDataIncludedForEntity(response, `about`) as {
    topComponents: any[];
  };
  const about = data?.topComponents.find(
    (c) => c.components?.textComponent !== null,
  );
  return about?.components?.textComponent?.text?.text ?? "N/A";
};

export const getProfileSectionAbout = async (identifier: string) => {
  const profileId = await extractProfileIdLinkedin(identifier);
  if (!profileId) return "N/A";
  return getProfileSectionAboutById(profileId);
};

export const getProfissionalExperiences = async (identifier: string) => {
  const profileId = await extractProfileIdLinkedin(identifier);
  if (!profileId) throw new Error("Profile not found");
  const response = await fetchDataApi(
    `graphql?variables=(profileUrn:urn%3Ali%3Afsd_profile%3A${profileId},sectionType:experience,locale:en_US)&queryId=${SECTIONS_QUERY_ID}`,
  );
  const items = extractExperiences(response);
  return Promise.all(
    items.map(async (item: any) => {
      const slug = item.idCompany;
      const company = slug ? await getCompany(slug).catch(() => null) : null;
      const cleaned = { ...item };
      if (slug) delete (cleaned as any).idCompany;
      return { ...cleaned, company };
    }),
  );
};

export const getContactInfo = async (identifier: string) => {
  const profileId = await extractProfileIdLinkedin(identifier);
  if (!profileId) return [];
  const response = await fetchDataApi(
    `graphql?includeWebMetadata=true&variables=(memberIdentity:${identifier})&queryId=${CONTACT_QUERY_ID}`,
  );
  const included = response?.included || [];
  const data = included.find(
    (item: any) => item?.entityUrn === `urn:li:fsd_profile:${profileId}`,
  );
  return {
    address: data?.address ?? null,
    weChatContactInfo: data?.weChatContactInfo ?? null,
    phoneNumbers:
      data?.phoneNumbers?.map(
        (item: any) => item?.phoneNumber?.number,
      ) ?? null,
    emailAddress: data?.emailAddress?.emailAddress ?? null,
    websites:
      data?.websites?.map((item: any) => ({
        label: item?.label,
        url: item?.url,
      })) ?? null,
  };
};
