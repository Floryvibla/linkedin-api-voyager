import { Client } from "./config";
import { getUserMiniProfile } from "./user";

Client({
  JSESSIONID: "2687703175806319775",
  li_at:
    "AQEDARgQ7uMA1d5dAAABmm_VFQcAAAGcT-gumU0Agr-WPhYEN-QPXcfx84Ct0mtL2WQqj9YrWiAR2onQlCPyIa9RWXygwj3JKVSY1elRE6DjH4y6nEE5I3NhxBpswfzbRBCIgKUYmKWeEblF1t9VeGDl",
});

getUserMiniProfile("wesbush")
  .then((profile) => {
    console.log("profile: ", profile);
  })
  .catch((error) => {
    console.log("error: ", error);
  });
