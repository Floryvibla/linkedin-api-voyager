import { getUserMiniProfile } from "./user";

getUserMiniProfile("florymignon")
  .then((profile) => {
    console.log("profile: ", profile);
  })
  .catch((error) => {
    console.log("error: ", error);
  });
