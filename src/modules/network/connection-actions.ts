import { postSduiAction } from "../../core/sdui";
import type { RemoveConnectionArgs } from "./types";
import { pickVanity } from "./network-helpers";

const SDUI_ID_REMOVE_CONNECTION =
  "com.linkedin.sdui.mynetwork.RemoveConnectionVanityName";

export const removeConnection = async (args: RemoveConnectionArgs) => {
  const disconnectVanityName = pickVanity([
    args.disconnectVanityName,
    args.vanityName,
  ]);
  if (!disconnectVanityName) {
    throw new Error(
      "vanityName (profile identifier like /in/xxx) is required to remove a connection.",
    );
  }
  const payload = {
    $type: "com.linkedin.flagship.platform.rpc.vanity.RemoveConnectionVanityNameRequest",
    disconnectVanityName,
  };
  return postSduiAction({
    sduiid: SDUI_ID_REMOVE_CONNECTION,
    payload,
    refererUrl: `https://www.linkedin.com/in/${disconnectVanityName}/`,
  });
};
