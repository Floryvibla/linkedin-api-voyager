import { launchBrowserLocal } from "./browser";

export interface LinkedInCredentialsLogin {
  email: string;
  password: string;
}

export async function loginLinkedin(params?: LinkedInCredentialsLogin) {
  const result = await launchBrowserLocal(
    params || {
      email: "fmignon243@gmail.com",
      password: "jujuba2016",
    },
  );

  // Fechar o browser após o login
  if (result?.browser) {
    await result.browser.close();
  }
}
