import { postSduiAction } from "../../core/sdui";
import type { FollowStateArgs } from "./types";
import { pickVanity, resolveMemberIds } from "./network-helpers";

const SDUI_ID_UPDATE_FOLLOW =
  "com.linkedin.sdui.requests.mynetwork.addaUpdateFollowState";

const buildFollowPayload = async (args: FollowStateArgs) => {
  const targetVanityName = pickVanity([
    args.targetVanityName,
    args.vanityName,
  ]);
  const { legacyNumericMemberId } = await resolveMemberIds({
    vanityName: targetVanityName,
    memberId: args.targetMemberId,
    legacyNumericMemberId: args.legacyNumericMemberId,
  });
  if (!legacyNumericMemberId) {
    throw new Error(
      "Could not resolve legacy numeric memberId for follow action. Try providing legacyNumericMemberId explicitly.",
    );
  }
  const followStateType = args.followState
    ? "FollowStateType_FOLLOW_ACTIVE"
    : "FollowStateType_FOLLOW_INACTIVE";
  const memberUrn = `urn:li:member:${legacyNumericMemberId}`;
  const payload: Record<string, unknown> = {
    followStateType,
    memberUrn: { memberId: legacyNumericMemberId },
    postActionSentConfigs: [],
    followStateBinding: {
      key: `urn:li:fsd_followingState:${memberUrn}`,
      namespace: null,
    },
  };
  if (targetVanityName) payload.vanityName = targetVanityName;
  return payload;
};

export const followProfile = async (
  args: Omit<FollowStateArgs, "followState">,
) =>
  postSduiAction({
    sduiid: SDUI_ID_UPDATE_FOLLOW,
    payload: await buildFollowPayload({ ...args, followState: true }),
    refererUrl: args.profileCanonicalUrl,
  });

export const unfollowProfile = async (
  args: Omit<FollowStateArgs, "followState">,
) =>
  postSduiAction({
    sduiid: SDUI_ID_UPDATE_FOLLOW,
    payload: await buildFollowPayload({ ...args, followState: false }),
    refererUrl: args.profileCanonicalUrl,
  });
