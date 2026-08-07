import { extractProfileIdLinkedin, fetchFullProfileRaw } from "../user/user-loader";
import { fetchDataApi } from "../../core/config";

const LEGACY_PROFILE_QUERY_ID =
  "voyagerIdentityDashProfiles.34ead06db82a2cc9a778fac97f69ad6a";

const extractFirstLegacyNumericId = (obj: unknown): string | null => {
  const seen = new WeakSet<object>();
  const walk = (v: unknown): string | null => {
    if (v === null || v === undefined) return null;
    if (typeof v === "string") {
      const m = /urn:li:member:(\d+)/.exec(v);
      if (m) return m[1];
      return null;
    }
    if (typeof v !== "object") return null;
    const o = v as Record<string, unknown> | unknown[];
    if (seen.has(v as object)) return null;
    seen.add(v as object);
    if (Array.isArray(o)) {
      for (const item of o) {
        const r = walk(item);
        if (r) return r;
      }
      return null;
    }
    for (const k of Object.keys(o)) {
      const r = walk((o as Record<string, unknown>)[k]);
      if (r) return r;
    }
    return null;
  };
  return walk(obj);
};

export const loadLegacyNumericMemberId = async (
  vanityName: string,
): Promise<string | null> => {
  const vanity = normalizeVanity(vanityName);
  if (!vanity) return null;
  try {
    const raw = await fetchFullProfileRaw(vanity);
    const id = extractFirstLegacyNumericId(raw);
    if (id) return id;
  } catch {}
  try {
    const legacy = await fetchDataApi(
      `graphql?variables=(vanityName:${encodeURIComponent(vanity)})&queryId=${LEGACY_PROFILE_QUERY_ID}`,
    );
    return extractFirstLegacyNumericId(legacy);
  } catch {
    return null;
  }
};

export interface ResolvedMemberIds {
  fsdMemberId: string;
  legacyNumericMemberId: string | null;
}

export const resolveMemberIds = async (input: {
  vanityName?: string;
  memberId?: string;
  legacyNumericMemberId?: string;
}): Promise<ResolvedMemberIds> => {
  const vanity = normalizeVanity(input.vanityName);
  const fsdMemberId =
    input.memberId ?? (vanity ? await extractProfileIdLinkedin(vanity) : null);
  if (!fsdMemberId) {
    throw new Error(
      "Either vanityName (identifier / in/xxx) or memberId is required.",
    );
  }
  let legacyNumericId = input.legacyNumericMemberId ?? null;
  if (!legacyNumericId && vanity) {
    legacyNumericId = await loadLegacyNumericMemberId(vanity);
  }
  return { fsdMemberId, legacyNumericMemberId: legacyNumericId };
};

const ensureArray = <T>(v: T | T[] | undefined): T[] =>
  v === undefined ? [] : Array.isArray(v) ? v : [v];

const stripUrlPrefix = (v: string) =>
  v.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "").replace(/\/$/, "");

const normalizeVanity = (v: string | undefined) =>
  v ? stripUrlPrefix(v) : undefined;

export const resolveMemberId = async (
  input: {
    vanityName?: string;
    memberId?: string;
  },
  preferMemberId = true,
): Promise<string> => {
  const memberId = preferMemberId ? input.memberId : undefined;
  if (memberId) return memberId;
  const vanity = normalizeVanity(input.vanityName);
  if (!vanity) {
    const fallback = preferMemberId ? input.vanityName : input.memberId;
    if (fallback && /^ACoA/.test(fallback)) return fallback;
    if (fallback) {
      const fromVanity = await extractProfileIdLinkedin(fallback);
      if (fromVanity) return fromVanity;
    }
    throw new Error(
      "Either vanityName (identifier / in/xxx) or memberId is required.",
    );
  }
  const resolved = await extractProfileIdLinkedin(vanity);
  if (!resolved) {
    throw new Error(
      `Could not resolve memberId for profile identifier "${vanity}"`,
    );
  }
  return resolved;
};

export const resolveFirstLast = (
  raw: { firstName?: string; lastName?: string; fullName?: string },
): { firstName: string | undefined; lastName: string | undefined } => {
  if (raw.firstName || raw.lastName) {
    return {
      firstName: raw.firstName,
      lastName: raw.lastName,
    };
  }
  if (!raw.fullName) return { firstName: undefined, lastName: undefined };
  const parts = raw.fullName.trim().split(/\s+/);
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" ") || undefined,
  };
};

export const normalizeInvitationUrn = (urn: string): string | null => {
  const m = /urn:li:fsd_invitation:([^,)]+)/.exec(urn);
  if (m) return m[1];
  if (/^\d+$/.test(urn)) return urn;
  return null;
};

export const pickVanity = (
  candidates: Array<string | undefined>,
): string | undefined => {
  for (const c of candidates) {
    const n = normalizeVanity(c);
    if (n) return n;
  }
  return undefined;
};

export { ensureArray, normalizeVanity, stripUrlPrefix };
