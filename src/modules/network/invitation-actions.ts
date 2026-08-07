import { postSduiAction } from "../../core/sdui";
import type { SendConnectionArgs, WithdrawInvitationArgs } from "./types";
import {
  pickVanity,
  resolveMemberId,
  resolveFirstLast,
  resolveMemberIds,
} from "./network-helpers";
import { fetchDataApi } from "../../core/config";
import { findProfileEntry } from "../user/user-entry-parsers";

const SDUI_ID_ADD_CONNECTION =
  "com.linkedin.sdui.requests.mynetwork.addaAddConnection";
const SDUI_ID_WITHDRAW_INVITATION =
  "com.linkedin.sdui.requests.mynetwork.addaWithdrawInvitation";

const PROFILE_DECORATION_FULL =
  "com.linkedin.voyager.dash.deco.identity.profile.FullProfileWithEntities-93";

const randomTrackingId = () => {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
};

const loadBasicProfile = async (identifier: string) => {
  const full = `/identity/dash/profiles?q=memberIdentity&memberIdentity=${encodeURIComponent(identifier)}&decorationId=${encodeURIComponent(PROFILE_DECORATION_FULL)}`;
  let raw;
  try {
    raw = await fetchDataApi(full);
  } catch {
    return null;
  }
  return findProfileEntry(raw, identifier) as
    | {
        firstName?: string;
        lastName?: string;
        publicIdentifier?: string;
        entityUrn?: string;
      }
    | null;
};

const slugifyName = (first?: string, last?: string, vanity?: string) => {
  const parts: string[] = [];
  if (first) parts.push(first.toLowerCase());
  if (last) parts.push(last.toLowerCase().replace(/\s+/g, "-"));
  if (parts.length === 0) return vanity ?? "profile";
  return parts.join("-");
};

export const sendConnectionRequest = async (args: SendConnectionArgs) => {
  const vanity = pickVanity([args.vanityName]);
  const { fsdMemberId, legacyNumericMemberId } = await resolveMemberIds({
    vanityName: vanity,
    memberId: args.inviteeMemberId,
    legacyNumericMemberId: args.legacyNumericMemberId,
  });
  if (!legacyNumericMemberId) {
    throw new Error(
      "Could not resolve legacy numeric member id required for SDUI connection request. " +
        "Try passing legacyNumericMemberId explicitly.",
    );
  }
  let profile = { firstName: args.firstName, lastName: args.lastName };
  if (vanity && (!profile.firstName || !profile.lastName)) {
    const loaded = await loadBasicProfile(vanity);
    if (loaded) profile = resolveFirstLast({ ...profile, ...loaded });
  }
  const canonicalUrl =
    args.profileCanonicalUrl ??
    (vanity ? `https://www.linkedin.com/in/${vanity}/` : undefined);
  const slug = slugifyName(profile.firstName, profile.lastName, vanity);
  const payload: Record<string, unknown> = {
    inviteeUrn: { memberId: legacyNumericMemberId },
    nonIterableProfileId: fsdMemberId,
    renderMode: "IconAndText",
    origin: "PROFILE_TOP_CARD_SECONDARY_ACTION_BUTTON",
    clientContext: "ProfileView",
    isDisabled: {
      key: `connect-button-disabled-${slug}-${legacyNumericMemberId}`,
      namespace: "MemoryNamespace",
    },
    connectionState: {
      key: `state:invitation:urn:li:member:${legacyNumericMemberId}`,
      namespace: "MemoryNamespace",
    },
    postActionSentConfigs: [],
  };
  if (profile.firstName) payload.firstName = profile.firstName;
  if (profile.lastName) payload.lastName = profile.lastName;
  if (canonicalUrl) payload.profileCanonicalUrl = canonicalUrl;
  if (args.message) payload.message = args.message;
  return postSduiAction({
    sduiid: SDUI_ID_ADD_CONNECTION,
    payload,
    refererUrl: canonicalUrl,
    anchorPageKey: "d_flagship3_profile_view_base",
    screenId: "com.linkedin.sdui.flagshipnav.profile.Profile",
  });
};

export const cancelSentInvitation = async (args: WithdrawInvitationArgs) => {
  const inviteeMemberId = args.inviteeMemberId
    ? args.inviteeMemberId
    : args.inviteeVanityName
      ? await resolveMemberId({ vanityName: args.inviteeVanityName })
      : undefined;
  const payload: Record<string, unknown> = {
    $type:
      "com.linkedin.mynetwork.adda.domain.action.request.AddaWithdrawInvitationRequest",
    inviterActionType: args.inviterActionType ?? "InviterActionType_WITHDRAW",
    invitationType: args.invitationType ?? "GenericInvitationType_CONNECTION",
    invitationUrn: `urn:li:fsd_invitation:${args.invitationId}`,
  };
  if (inviteeMemberId) {
    payload.inviteeUrn = `urn:li:fsd_member:${inviteeMemberId}`;
  }
  const inviteeVanityName = pickVanity([args.inviteeVanityName]);
  if (inviteeVanityName) payload.inviteeVanityName = inviteeVanityName;
  return postSduiAction({
    sduiid: SDUI_ID_WITHDRAW_INVITATION,
    payload,
    refererUrl: inviteeVanityName
      ? `https://www.linkedin.com/in/${inviteeVanityName}/`
      : undefined,
  });
};
