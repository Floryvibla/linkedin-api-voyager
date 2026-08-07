export interface NetworkPaginationArgs {
  start?: number;
  count?: number;
}

export interface InvitationView {
  entityUrn?: string;
  invitationType?: string;
  invitationUrn?: string;
  invitee?: {
    firstName?: string;
    lastName?: string;
    headline?: string;
    publicIdentifier?: string;
    entityUrn?: string;
  };
  inviter?: {
    firstName?: string;
    lastName?: string;
    headline?: string;
    publicIdentifier?: string;
    entityUrn?: string;
  };
  sentTime?: number;
  receivedTime?: number;
  sharedSecret?: string;
  email?: string;
  customMessage?: string;
  toMemberId?: string;
  fromMemberId?: string;
}

export interface InvitationListResponse {
  paging?: { start?: number; count?: number; total?: number };
  elements: InvitationView[];
}

export interface SendConnectionArgs {
  vanityName?: string;
  inviteeMemberId?: string;
  legacyNumericMemberId?: string;
  firstName?: string;
  lastName?: string;
  message?: string;
  trackingId?: string;
  profileCanonicalUrl?: string;
}

export interface WithdrawInvitationArgs {
  invitationId: string;
  inviteeMemberId?: string;
  inviteeVanityName?: string;
  inviterActionType?: string;
  invitationType?: string;
}

export interface RemoveConnectionArgs {
  vanityName?: string;
  disconnectVanityName?: string;
}

export interface FollowStateArgs {
  followState: boolean;
  vanityName?: string;
  targetMemberId?: string;
  targetProfileUrn?: string;
  targetVanityName?: string;
  legacyNumericMemberId?: string;
  profileCanonicalUrl?: string;
}

export interface ProfileListItem {
  memberId?: string;
  vanityName?: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
  entityUrn?: string;
  photoUrl?: string;
  location?: string;
}

export interface ProfileListResponse {
  start?: number;
  count?: number;
  total?: number;
  items: ProfileListItem[];
}

export type CollectionType = "CONNECTIONS" | "FOLLOWERS" | "FOLLOWING";
