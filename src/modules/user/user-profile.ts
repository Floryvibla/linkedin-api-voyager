import { fetchDataApi } from "../../core/config";
import {
  extractProfileIdLinkedin,
  resolveProfileEntityUrn,
} from "./user-loader";
import { getProfileSectionAboutById } from "./user-about-contact";
import { findProfileEntry, mapMiniProfile } from "./user-entry-parsers";
import { MiniUserProfileLinkedin } from "./user-types";

const PROFILE_DECORATION_FULL =
  "com.linkedin.voyager.dash.deco.identity.profile.FullProfileWithEntities-93";
const PROFILE_DECORATION_TOP =
  "com.linkedin.voyager.dash.deco.identity.profile.FullProfile-138";

const buildDashProfileEndpoint = (slug: string, decorationId: string): string =>
  `/identity/dash/profiles?q=memberIdentity&memberIdentity=${encodeURIComponent(slug)}&decorationId=${encodeURIComponent(decorationId)}`;

const fetchDashProfile = async (vanityName: string): Promise<any> => {
  try {
    return await fetchDataApi(
      buildDashProfileEndpoint(vanityName, PROFILE_DECORATION_FULL),
    );
  } catch {
    return fetchDataApi(
      buildDashProfileEndpoint(vanityName, PROFILE_DECORATION_TOP),
    );
  }
};

const fetchProfileAbout = async (
  profileEntry: any,
  identifier: string,
): Promise<string> => {
  const profileId =
    resolveProfileEntityUrn(profileEntry) ??
    (await extractProfileIdLinkedin(identifier));
  if (!profileId) return "N/A";
  return getProfileSectionAboutById(profileId);
};

export const getMe = async (): Promise<MiniUserProfileLinkedin> => {
  const res = await fetchDataApi("/me");
  const included: any[] = Array.isArray(res?.included) ? res.included : [];
  const mapped = mapMiniProfile(included[0] ?? res);
  if (!mapped) throw new Error("Profile not found");
  return mapped;
};

export const getUserMiniProfile = async (
  identifier: string,
): Promise<MiniUserProfileLinkedin> => {
  const vanityMatch = identifier.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/);
  const vanityName = vanityMatch ? vanityMatch[1] : identifier;
  const res = await fetchDashProfile(vanityName);

  const entry = findProfileEntry(res, vanityName);
  if (!entry) throw new Error("Profile not found");
  const mapped = mapMiniProfile(entry);
  if (!mapped) throw new Error("Profile not found");
  return mapped;
};
