import { getNestedValue } from "./utils";

export interface MiniUserProfileLinkedin {
  id_urn: string;
  publicIdentifier: string;
  firstName: string;
  lastName: string;
  fullName: string;
  headline: string;
  about: string;
  birthDate: { month: number; day: number };
  profilePicture: string | null;
  backgroundPicture: string | null;
}

const PROFILE_TYPE = "com.linkedin.voyager.dash.identity.profile.Profile";
const VECTOR_IMAGE_PATHS = [
  "displayImageReferenceResolutionResult.vectorImage",
  "displayImageResolutionResult.vectorImage",
  "vectorImage",
];
const TEXT_KEYS = ["text", "plainText", "accessibilityText"];

const extractText = (field: any): string => {
  if (!field) return "";
  if (typeof field === "string") return field;
  for (const k of TEXT_KEYS)
    if (typeof field?.[k] === "string") return field[k];
  for (const v of Object.values(field || {}))
    if (typeof v === "string" && v.trim()) return v;
  return "";
};

const buildImageUrl = (container: any): string | null => {
  const rootUrl = container?.displayImageReference?.vectorImage?.rootUrl;
  const artifact =
    container?.displayImageReference?.vectorImage?.artifacts.find(
      (a: any) => a?.width === 800,
    );

  const imageUrl = `${rootUrl}${artifact?.fileIdentifyingUrlPathSegment}`;

  if (!rootUrl || !artifact) return null;

  return imageUrl;
};

export const findProfileEntry = (raw: any, vanityName?: string): any | null => {
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
    (e) => typeof e?.entityUrn === "string" && /fsd_profile:/.test(e.entityUrn),
  );
  return firstDashElement ?? dash[0] ?? included[0] ?? null;
};

export const mapMiniProfile = (
  profile: any,
): MiniUserProfileLinkedin | null => {
  if (!profile) return null;
  // console.log("profile: ", JSON.stringify(profile, null, 2));

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
