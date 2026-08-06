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

export interface ProfilePaged<T> {
  paging: { start: number; count: number; total: number };
  items: T[];
}

export const PROFILE_TYPE =
  "com.linkedin.voyager.dash.identity.profile.Profile";

export const VECTOR_IMAGE_PATHS = [
  "displayImageReferenceResolutionResult.vectorImage",
  "displayImageResolutionResult.vectorImage",
  "vectorImage",
];

export const TEXT_KEYS = ["text", "plainText", "accessibilityText"];

export type SectionType =
  | "experience"
  | "education"
  | "skills"
  | "certifications"
  | "projects"
  | "volunteer"
  | "honors"
  | "courses"
  | "languages"
  | "organizations"
  | "publications"
  | "patents"
  | "testScores"
  | "recommendations";
