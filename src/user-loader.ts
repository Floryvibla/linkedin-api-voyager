import { fetchDataApi } from "./config";
import { findProfileEntry } from "./user-entry-parsers";

const PROFILE_DECORATION_TOP =
  "com.linkedin.voyager.dash.deco.identity.profile.FullProfile-138";
const PROFILE_DECORATION_FULL =
  "com.linkedin.voyager.dash.deco.identity.profile.FullProfileWithEntities-93";

export const PROFILE_ABOUT_QUERY_ID =
  "voyagerIdentityDashProfileCards.55af784c21dc8640b500ab5b45937064";
export const SECTIONS_QUERY_ID =
  "voyagerIdentityDashProfileComponents.c5d4db426a0f8247b8ab7bc1d660775a";
export const CONTACT_QUERY_ID =
  "voyagerIdentityDashProfiles.c7452e58fa37646d09dae4920fc5b4b9";
export const RECOMMENDATIONS_QUERY_ID =
  "voyagerIdentityDashRecommendations.d78fb6aa8d1b6c907d6061089f8a4e5b0ef11d8702d6c3a4e2f11a8bb67d5c9a";

export const slugify = (profileUrl: string) => {
  const m = profileUrl.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/);
  return m ? m[1] : profileUrl;
};

export const resolveProfileEntityUrn = (profile: any): string | null => {
  if (!profile?.entityUrn) return null;
  return profile.entityUrn.replace(/^urn:li:fsd_profile:/, "");
};

export const fetchFullProfileRaw = async (
  identifier: string,
): Promise<any> => {
  const vanityName = slugify(identifier);
  const full = `/identity/dash/profiles?q=memberIdentity&memberIdentity=${encodeURIComponent(vanityName)}&decorationId=${encodeURIComponent(PROFILE_DECORATION_FULL)}`;
  try {
    return await fetchDataApi(full);
  } catch {
    const top = `/identity/dash/profiles?q=memberIdentity&memberIdentity=${encodeURIComponent(vanityName)}&decorationId=${encodeURIComponent(PROFILE_DECORATION_TOP)}`;
    return fetchDataApi(top);
  }
};

export const extractProfileIdLinkedin = async (
  profileUrl: string,
): Promise<string | null> => {
  const vanityName = slugify(profileUrl);
  try {
    const res = await fetchFullProfileRaw(vanityName);
    const id = resolveProfileEntityUrn(findProfileEntry(res, vanityName));
    if (id) return id;
  } catch {}
  const legacy = await fetchDataApi(
    `graphql?variables=(vanityName:${encodeURIComponent(vanityName)})&queryId=voyagerIdentityDashProfiles.34ead06db82a2cc9a778fac97f69ad6a`,
  );
  return resolveProfileEntityUrn(findProfileEntry(legacy, vanityName));
};
