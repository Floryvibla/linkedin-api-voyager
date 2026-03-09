import { apiInstance } from "./config";

export enum LinkedInRealtimeTopic {
  ConversationsBroadcast = "conversationsBroadcastTopic",
  Conversations = "conversationsTopic",
  ConversationDeletesBroadcast = "conversationDeletesBroadcastTopic",
  ConversationDeletes = "conversationDeletesTopic",
  MessageReactionSummariesBroadcast = "messageReactionSummariesBroadcastTopic",
  MessageReactionSummaries = "messageReactionSummariesTopic",
  MessageSeenReceiptsBroadcast = "messageSeenReceiptsBroadcastTopic",
  MessageSeenReceipts = "messageSeenReceiptsTopic",
  MessagesBroadcast = "messagesBroadcastTopic",
  Messages = "messagesTopic",
  ReplySuggestionBroadcast = "replySuggestionBroadcastTopic",
  ReplySuggestionV2 = "replySuggestionTopicV2",
  TypingIndicatorsBroadcast = "typingIndicatorsBroadcastTopic",
  TypingIndicators = "typingIndicatorsTopic",
  MessagingSecondaryPreviewBanner = "messagingSecondaryPreviewBannerTopic",
  Reactions = "reactionsTopic",
  Comments = "commentsTopic",
  ReactionsOnComments = "reactionsOnCommentsTopic",
  SocialPermissionsPersonal = "socialPermissionsPersonalTopic",
  LiveVideoPost = "liveVideoPostTopic",
  GeneratedJobDescriptions = "generatedJobDescriptionsTopic",
  MessageDrafts = "messageDraftsTopic",
  ConversationDrafts = "conversationDraftsTopic",
  MessageDraftDeletes = "messageDraftDeletesTopic",
  ConversationDraftDeletes = "conversationDraftDeletesTopic",
  CoachStreamingResponses = "coachStreamingResponsesTopic",
  RealtimeSearchResultClusters = "realtimeSearchResultClustersTopic",
  MemberVerificationResultsPersonal = "memberVerificationResultsPersonalTopic",
}

export type LinkedInRealtimeTopicKey = keyof typeof LinkedInRealtimeTopic;
export type LinkedInRealtimeTopicsParam =
  | LinkedInRealtimeTopicKey
  | LinkedInRealtimeTopicKey[];

const LINKEDIN_QUERY_MAP_BASE64 =
  "eyAidG9waWNUb0dyYXBoUUxRdWVyeVBhcmFtcyI6IHsgImNvbnZlcnNhdGlvbnNUb3BpYyI6IHsgInF1ZXJ5SWQiOiAidm95YWdlck1lc3NhZ2luZ0Rhc2hNZXNzZW5nZXJSZWFsdGltZURlY29yYXRpb24uZjg1NTA0OGIzOTBiMjg2ZTUxM2Q3YjIzYzU5ZWZlZTMiLCAidmFyaWFibGVzIjoge30sICJleHRlbnNpb25zIjoge30gfSwgImNvbnZlcnNhdGlvbkRlbGV0ZXNUb3BpYyI6IHsgInF1ZXJ5SWQiOiAidm95YWdlck1lc3NhZ2luZ0Rhc2hNZXNzZW5nZXJSZWFsdGltZURlY29yYXRpb24uMjgyYWJlNWZhMWEyNDJjYjc2ODI1YzMyZGJiZmFlZGUiLCAidmFyaWFibGVzIjoge30sICJleHRlbnNpb25zIjoge30gfSwgIm1lc3NhZ2VSZWFjdGlvblN1bW1hcmllc1RvcGljIjogeyAicXVlcnlJZCI6ICJ2b3lhZ2VyTWVzc2FnaW5nRGFzaE1lc3NlbmdlclJlYWx0aW1lRGVjb3JhdGlvbi44NWZmNWExYWFiZjdjNTJmNDBhYTg1Y2NjODRlM2JmNSIsICJ2YXJpYWJsZXMiOiB7fSwgImV4dGVuc2lvbnMiOiB7fSB9LCAibWVzc2FnZVNlZW5SZWNlaXB0c1RvcGljIjogeyAicXVlcnlJZCI6ICJ2b3lhZ2VyTWVzc2FnaW5nRGFzaE1lc3NlbmdlclJlYWx0aW1lRGVjb3JhdGlvbi5lMjNkMzk3MWRjODNhMTE1YjAzNTg0Y2YyMzgxMjU2YyIsICJ2YXJpYWJsZXMiOiB7fSwgImV4dGVuc2lvbnMiOiB7fSB9LCAibWVzc2FnZXNUb3BpYyI6IHsgInF1ZXJ5SWQiOiAidm95YWdlck1lc3NhZ2luZ0Rhc2hNZXNzZW5nZXJSZWFsdGltZURlY29yYXRpb24uZGIwZjFkM2Y1Mzc0N2Y0OWYzZmQ4N2IxMzlkZjllZGEiLCAidmFyaWFibGVzIjoge30sICJleHRlbnNpb25zIjoge30gfSwgInJlcGx5U3VnZ2VzdGlvblRvcGljVjIiOiB7ICJxdWVyeUlkIjogInZveWFnZXJNZXNzYWdpbmdEYXNoTWVzc2VuZ2VyUmVhbHRpbWVEZWNvcmF0aW9uLjQxMjk2NGMzZjdmNWE2N2ZiMGU1NmI2YmIzYTAwMDI4IiwgInZhcmlhYmxlcyI6IHt9LCAiZXh0ZW5zaW9ucyI6IHt9IH0sICJ0eXBpbmdJbmRpY2F0b3JzVG9waWMiOiB7ICJxdWVyeUlkIjogInZveWFnZXJNZXNzYWdpbmdEYXNoTWVzc2VuZ2VyUmVhbHRpbWVEZWNvcmF0aW9uLjIzNGNlMDNjZDA2MmIyNDM4ZGFlMDYwY2E4NTRhNmQyIiwgInZhcmlhYmxlcyI6IHt9LCAiZXh0ZW5zaW9ucyI6IHt9IH0sICJyZWFjdGlvbnNUb3BpYyI6IHsgInF1ZXJ5SWQiOiAibGl2ZVZpZGVvVm95YWdlclNvY2lhbERhc2hSZWFsdGltZURlY29yYXRpb24uYjhiMzNkZWRjYTdlZmJlMzRmMWQ3ZTg0YzNiM2FhODEiLCAidmFyaWFibGVzIjoge30sICJleHRlbnNpb25zIjoge30gfSwgImNvbW1lbnRzVG9waWMiOiB7ICJxdWVyeUlkIjogImxpdmVWaWRlb1ZveWFnZXJTb2NpYWxEYXNoUmVhbHRpbWVEZWNvcmF0aW9uLjBkMjMzMzUyZDZhYWYzNWZmMDBiOGU2N2U5Y2Q0ODU5IiwgInZhcmlhYmxlcyI6IHt9LCAiZXh0ZW5zaW9ucyI6IHt9IH0sICJyZWFjdGlvbnNPbkNvbW1lbnRzVG9waWMiOiB7ICJxdWVyeUlkIjogImxpdmVWaWRlb1ZveWFnZXJTb2NpYWxEYXNoUmVhbHRpbWVEZWNvcmF0aW9uLjBhMTgxYjA1YjM3NTFmNzJhZTNlYjQ4OWI3N2UzMjQ1IiwgInZhcmlhYmxlcyI6IHt9LCAiZXh0ZW5zaW9ucyI6IHt9IH0sICJzb2NpYWxQZXJtaXNzaW9uc1BlcnNvbmFsVG9waWMiOiB7ICJxdWVyeUlkIjogImxpdmVWaWRlb1ZveWFnZXJTb2NpYWxEYXNoUmVhbHRpbWVEZWNvcmF0aW9uLjE3MGJmM2JmYmNjYTFkYTMyMmUzNGYzNGYzN2ZiOTU0IiwgInZhcmlhYmxlcyI6IHt9LCAiZXh0ZW5zaW9ucyI6IHt9IH0sICJsaXZlVmlkZW9Qb3N0VG9waWMiOiB7ICJxdWVyeUlkIjogImxpdmVWaWRlb1ZveWFnZXJGZWVkRGFzaExpdmVVcGRhdGVzUmVhbHRpbWVEZWNvcmF0aW9uLjU0ZDYzNWRhMDAwOGVjZjY4NzFmY2Y4NDA4NWU1M2RlIiwgInZhcmlhYmxlcyI6IHt9LCAiZXh0ZW5zaW9ucyI6IHt9IH0sICJtZXNzYWdlRHJhZnRzVG9waWMiOiB7ICJxdWVyeUlkIjogInZveWFnZXJNZXNzYWdpbmdEYXNoTWVzc2VuZ2VyUmVhbHRpbWVEZWNvcmF0aW9uLmZjZjdiNTRkMjU4YzI3Nzk5YTY5Mzc4NWJkNGZjYzExIiwgInZhcmlhYmxlcyI6IHt9LCAiZXh0ZW5zaW9ucyI6IHt9IH0sICJjb252ZXJzYXRpb25EcmFmdHNUb3BpYyI6IHsgInF1ZXJ5SWQiOiAidm95YWdlck1lc3NhZ2luZ0Rhc2hNZXNzZW5nZXJSZWFsdGltZURlY29yYXRpb24uYTQzY2UxNTdkNzExNGIxYTBmOGRhNWUwMmE2MGNlMzgiLCAidmFyaWFibGVzIjoge30sICJleHRlbnNpb25zIjoge30gfSwgIm1lc3NhZ2VEcmFmdERlbGV0ZXNUb3BpYyI6IHsgInF1ZXJ5SWQiOiAidm95YWdlck1lc3NhZ2luZ0Rhc2hNZXNzZW5nZXJSZWFsdGltZURlY29yYXRpb24uZTNlNGM3MTIxODM4MzIxYTQyNzUyYjU1ZjQ4N2E3M2UiLCAidmFyaWFibGVzIjoge30sICJleHRlbnNpb25zIjoge30gfSwgImNvbnZlcnNhdGlvbkRyYWZ0RGVsZXRlc1RvcGljIjogeyAicXVlcnlJZCI6ICJ2b3lhZ2VyTWVzc2FnaW5nRGFzaE1lc3NlbmdlclJlYWx0aW1lRGVjb3JhdGlvbi41Mjg4MDM2YTJjMGU2M2Y0OWQzNGVlMzJiMTM5OTc2YyIsICJ2YXJpYWJsZXMiOiB7fSwgImV4dGVuc2lvbnMiOiB7fSB9LCAicmVhbHRpbWVTZWFyY2hSZXN1bHRDbHVzdGVyc1RvcGljIjogeyAicXVlcnlJZCI6ICJ2b3lhZ2VyU2VhcmNoRGFzaFJlYWx0aW1lRGVjb3JhdGlvbi4zYzhkMmNkNzMyOTg3OTBmZWIzZDdmMzQyMWE4OGRmNCIsICJ2YXJpYWJsZXMiOiB7fSwgImV4dGVuc2lvbnMiOiB7fSB9IH0gfQ==";

export const getLinkedInRealtimeQueryMap = () =>
  Buffer.from(LINKEDIN_QUERY_MAP_BASE64, "base64").toString("utf8");

export const createLinkedInRealtimeTopicsSet = (
  topics?: LinkedInRealtimeTopicsParam,
): ReadonlySet<string> | undefined => {
  if (!topics) return undefined;
  const list = Array.isArray(topics) ? topics : [topics];
  return new Set(list.map((t) => LinkedInRealtimeTopic[t]));
};

export type ParseLinkedInSSEChunkArgs = {
  buffer: string;
  chunk: Buffer;
  topicsSet?: ReadonlySet<string>;
  onEvent: (data: unknown) => void;
  onError: (error: unknown) => void;
};

export const parseLinkedInSSEChunk = ({
  buffer,
  chunk,
  topicsSet,
  onEvent,
  onError,
}: ParseLinkedInSSEChunkArgs) => {
  let nextBuffer = buffer + chunk.toString();
  const parts = nextBuffer.split("\n\n");
  nextBuffer = parts.pop() || "";
  for (const part of parts) {
    if (!part.trim().startsWith("data:")) continue;
    try {
      const dataStr = part.replace("data:", "").trim();
      const data = JSON.parse(dataStr) as unknown;
      if (!topicsSet) {
        onEvent(data);
        continue;
      }
      const topic = (data as Record<string, unknown> | null)?.topic;
      if (typeof topic === "string" && topicsSet.has(topic)) {
        onEvent(data);
        continue;
      }
      const text = JSON.stringify(data);
      for (const t of topicsSet) if (text.includes(t)) onEvent(data);
    } catch (error) {
      onError(error);
    }
  }
  return nextBuffer;
};

export async function linkedinSSE(
  topics?: LinkedInRealtimeTopicsParam,
): Promise<void> {
  if (!apiInstance) {
    throw new Error(
      "Client not initialized. Please call Client({ JSESSIONID, li_at }) first.",
    );
  }
  const topicsSet = createLinkedInRealtimeTopicsSet(topics);

  const response = await apiInstance.get("/connect?rc=1", {
    baseURL: "https://www.linkedin.com/realtime",
    responseType: "stream",
    headers: {
      Accept: "text/event-stream",
      "x-li-accept": "application/vnd.linkedin.normalized+json+2.1",
      "x-li-page-instance":
        "urn:li:page:feed_index_index;6b2b39e4-d1c7-4afd-83a6-29297d4f436b",
      "x-li-query-accept": "application/graphql",
      "x-li-query-map": getLinkedInRealtimeQueryMap(),
      "x-li-realtime-session": "401dc8e6-3c15-49e0-aa9d-7c6dec4a3318",
      "x-li-recipe-accept": "application/vnd.linkedin.normalized+json+2.1",
      "x-li-recipe-map":
        '{"inAppAlertsTopic":"com.linkedin.voyager.dash.deco.identity.notifications.InAppAlert-52","professionalEventsTopic":"com.linkedin.voyager.dash.deco.events.ProfessionalEventDetailPage-63","tabBadgeUpdateTopic":"com.linkedin.voyager.dash.deco.notifications.RealtimeBadgingItemCountsEvent-1","topCardLiveVideoTopic":"com.linkedin.voyager.dash.deco.video.TopCardLiveVideo-10"}',
      "x-li-track":
        '{"clientVersion":"1.13.42636","mpVersion":"1.13.42636","osName":"web","timezoneOffset":-3,"timezone":"America/Sao_Paulo","deviceFormFactor":"DESKTOP","mpName":"voyager-web","displayDensity":2,"displayWidth":2880,"displayHeight":1800}',
      "x-restli-protocol-version": "2.0.0",
    },
  });

  let buffer = "";
  const onEvent = (data: unknown) => data;
  const onError = (error: unknown) =>
    console.log("error parsing part: ", error);

  response.data.on("data", (chunk: Buffer) => {
    buffer = parseLinkedInSSEChunk({
      buffer,
      chunk,
      topicsSet,
      onEvent,
      onError,
    });
  });
}
