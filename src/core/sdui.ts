import { apiInstance } from "./config";
import {
  LinkedInAuthRedirectError,
  LinkedInUnexpectedHtmlError,
} from "./errors";

export const SDUI_BASE_PATH = "/flagship-web/rsc-action/actions/server-request";

const SDUI_APP_VERSION = "0.2.6676";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const randomBase64TrackingId = () => {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  let bin = "";
  for (let i = 0; i < a.length; i++) bin += String.fromCharCode(a[i]);
  return btoa(bin);
};

export const DEFAULT_ANCHOR_PAGE_KEY = "d_flagship3_profile_view_base";
export const DEFAULT_SCREEN_ID =
  "com.linkedin.sdui.flagshipnav.profile.Profile";

export interface SduiActionOptions {
  sduiid: string;
  payload: Record<string, unknown>;
  parentSpanId?: string;
  extraQuery?: Record<string, string>;
  anchorPageKey?: string;
  screenId?: string;
  refererUrl?: string;
}

const asJson = (v: Record<string, unknown>): Record<string, JsonValue> =>
  v as Record<string, JsonValue>;

export const postSduiAction = async ({
  sduiid,
  payload,
  parentSpanId,
  extraQuery,
  anchorPageKey = DEFAULT_ANCHOR_PAGE_KEY,
  screenId = DEFAULT_SCREEN_ID,
  refererUrl,
}: SduiActionOptions) => {
  if (!apiInstance) {
    throw new Error(
      "Client not initialized. Please call Client({ JSESSIONID, li_at }) first.",
    );
  }
  const pageInstanceTrackingId = randomBase64TrackingId();
  const params = new URLSearchParams({ sduiid });
  params.set("_v", SDUI_APP_VERSION);
  if (parentSpanId) params.set("parentSpanId", parentSpanId);
  if (extraQuery) {
    Object.entries(extraQuery).forEach(([k, v]) => params.set(k, v));
  }
  const jsonPayload = asJson(payload);
  const EMPTY_ARRAY: JsonValue[] = [];
  const sharedRequestedArguments: Record<string, JsonValue> = {
    $type: "proto.sdui.actions.requests.RequestedArguments" as const,
    requestedStateKeys: EMPTY_ARRAY,
    payload: jsonPayload,
    requestMetadata: {
      $type: "proto.sdui.common.RequestMetadata" as const,
    },
  };
  const body: Record<string, JsonValue> = {
    requestId: sduiid,
    serverRequest: {
      requestId: sduiid,
      requestedArguments: sharedRequestedArguments,
      onClientRequestFailureAction: {
        actions: EMPTY_ARRAY,
      },
      isApfcEnabled: false,
      isStreaming: false,
      rumPageKey: "",
    },
    states: EMPTY_ARRAY,
    requestedArguments: {
      ...sharedRequestedArguments,
      states: EMPTY_ARRAY,
      screenId,
      knownTemplateIds: EMPTY_ARRAY,
    },
  };
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-li-rsc-stream": "true",
    "x-li-application-version": SDUI_APP_VERSION,
    "x-li-page-instance-tracking-id": pageInstanceTrackingId,
    "x-li-application-instance": "undefined",
    "x-li-anchor-page-key": anchorPageKey,
    "x-li-page-instance": `urn:li:page:${anchorPageKey};${pageInstanceTrackingId}`,
    "x-li-track": JSON.stringify({
      clientVersion: SDUI_APP_VERSION,
      mpVersion: SDUI_APP_VERSION,
      osName: "web",
      timezoneOffset: -3,
      timezone: "America/Sao_Paulo",
      deviceFormFactor: "DESKTOP",
      mpName: "web",
      displayDensity: 2,
      displayWidth: 2880,
      displayHeight: 1800,
    }),
  };
  if (refererUrl) headers.referer = refererUrl;
  const res = await apiInstance.post(`${SDUI_BASE_PATH}?${params.toString()}`, body, { headers });
  if (res.status >= 300) {
    throw new LinkedInAuthRedirectError({
      status: res.status,
      location: (res.headers?.location as string) ?? null,
    });
  }
  if (typeof res.data === "string") {
    if (/<(!DOCTYPE|html)/i.test(res.data.trim())) {
      throw new LinkedInUnexpectedHtmlError({
        length: res.data.length,
        location: (res.headers?.location as string) ?? null,
      });
    }
  }
  return res.data;
};
