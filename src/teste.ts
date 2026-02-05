import { getUserMiniProfile } from "./user";

getUserMiniProfile("wesbush")
  .then((profile) => {
    console.log("profile: ", profile);
  })
  .catch((error) => {
    console.log("error: ", error);
  });
