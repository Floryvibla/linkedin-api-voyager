import { PROFILE_TYPE, MiniUserProfileLinkedin } from "./user-types";
import { buildImageUrl, extractText } from "./user-core-parsers";

export const findProfileEntry = (
  raw: any,
  vanityName?: string,
): any | null => {
  const included: any[] = Array.isArray(raw?.included) ? raw.included : [];
  const dataElements: any[] = Array.isArray(raw?.data?.elements)
    ? raw.data.elements
    : [];
  const searchPool = [...included, ...dataElements];
  if (vanityName) {
    const direct = searchPool.find((i) => i?.publicIdentifier === vanityName);
    if (direct) return direct;
  }
  const dash = searchPool.filter((i) => i?.$type === PROFILE_TYPE);
  if (dash.length === 1) return dash[0];
  const rootRef = raw?.data?.identityDashProfileByPublicIdentifier;
  if (rootRef) {
    if (typeof rootRef === "string") {
      const match = included.find((i) => i.entityUrn === rootRef);
      if (match) return match;
    } else if (rootRef?.$type || rootRef?.publicIdentifier) return rootRef;
  }
  const firstDashElement = dataElements.find(
    (e) =>
      typeof e?.entityUrn === "string" && /fsd_profile:/.test(e.entityUrn),
  );
  return firstDashElement ?? dash[0] ?? included[0] ?? null;
};

export const getStarredCollectionUrn = (
  raw: any,
  key: string,
): string | null => {
  const direct = raw?.[key] ?? raw?.[`*${key}`];
  if (typeof direct === "string") return direct;
  return direct?.entityUrn ?? null;
};

export const mapMiniProfile = (
  profile: any,
): MiniUserProfileLinkedin | null => {
  if (!profile) return null;
  const urn = profile.entityUrn ?? "";
  const firstName = profile.firstName ?? "";
  const lastName = profile.lastName ?? "";
  return {
    id_urn: urn.replace(/^urn:li:fsd_profile:/, ""),
    publicIdentifier: profile.publicIdentifier ?? "",
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(" ").trim(),
    headline: extractText(profile.headline) || "N/A",
    about: profile.summary,
    birthDate: {
      month: profile.birthDateOn?.month ?? profile.birthDate?.month ?? null,
      day: profile.birthDateOn?.day ?? profile.birthDate?.day ?? null,
    },
    profilePicture: buildImageUrl(profile.profilePicture),
    backgroundPicture: buildImageUrl(profile.backgroundPicture),
  };
};
