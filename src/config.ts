import axios, { AxiosInstance } from "axios";

export const API_BASE_URL = "https://www.linkedin.com";

export let apiInstance: AxiosInstance | null = null;

export const Client = (providedCookies: {
  JSESSIONID: string;
  li_at: string;
}) => {
  apiInstance = axios.create({
    baseURL: API_BASE_URL,
    maxRedirects: 3, // Limitar redirecionamentos a 3
    timeout: 10000,
    headers: {
      "accept-language":
        "pt-BR,pt;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
      accept: "application/vnd.linkedin.normalized+json+2.1",
      // cookie: `li_at=${providedCookies.li_at}; JSESSIONID="ajax:${providedCookies.JSESSIONID}"`,
      "csrf-token": `ajax:${providedCookies.JSESSIONID}`,
      priority: "u=1, i",
      referer: "https://www.linkedin.com/preload/?_bprMode=vanilla",
      "sec-ch-prefers-color-scheme": "light",
      "sec-ch-ua": `"Not=A?Brand";v="99", "Google Chrome";v="151", "Chromium";v="151"`,
      "sec-ch-ua-mobile": `"macOS"`,
      "sec-fetch-dest": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
      "x-li-lang": "pt_BR",
      "x-li-track": `{"clientVersion":"1.13.45589","mpVersion":"1.13.45589","osName":"web","timezoneOffset":-3,"timezone":"America/Sao_Paulo","deviceFormFactor":"DESKTOP","mpName":"voyager-web","displayDensity":2,"displayWidth":2880,"displayHeight":1800}`,
      "x-restli-protocol-version": `2.0.0`,
      cookie: `bcookie="v=2&6da70f95-8c0f-4f89-87ea-cd5c05db113f"; li_sugr=18e3923d-4069-4fa4-ba8d-7e85b530c0cf; AMCVS_14215E3D5995C57C0A495C55%40AdobeOrg=1; aam_uuid=82747993298147248643936819618798286713; g_state={"i_l":0};li_at=${providedCookies.li_at};JSESSIONID="ajax:${providedCookies.JSESSIONID}"; timezone=America/Sao_Paulo; lang=v=2&lang=pt-br; AnalyticsSyncHistory=AQIRAlnCC420MAAAAZ_JrDo8MMTQtPGFx6fQwWziucvQtceOWMutMzcbaHXbBkNIv1oD1m7uASzoAWhXVCmIJg; _guid=11cdfbc0-ee95-481c-bda4-743fc3789825; lms_ads=AQE1tcXhzhStdgAAAZ_JrDsM4BsAGOOkQUfZHxHyi1nWoARuUHA8wAcR0VtRmaqyJlMKLJvO_WdG0aVaL_N3UgpYEVur8Uxz; lms_analytics=AQE1tcXhzhStdgAAAZ_JrDsM4BsAGOOkQUfZHxHyi1nWoARuUHA8wAcR0VtRmaqyJlMKLJvO_WdG0aVaL_N3UgpYEVur8Uxz; li_theme=light; li_theme_set=app; AMCV_14215E3D5995C57C0A495C55%40AdobeOrg=-637568504%7CMCIDTS%7C20669%7CMCMID%7C82221139822335556593921874041739166898%7CMCAAMLH-1786399740%7C4%7CMCAAMB-1786399740%7C6G1ynYcLPuiQxYZrsz_pkqfLG9yMXBpb2zX5dvJdYQJzPXImdj0y%7CMCOPTOUT-1785802140s%7CNONE%7CvVersion%7C5.1.1%7CMCCIDH%7C797998552; sdui_ver=sdui-flagship:0.1.47636+SduiFlagshipGuest; lidc="b=TB71:s=T:r=T:a=T:p=T:g=4080:u=3:x=1:i=1785807193:t=1785885456:v=2:sig=AQHo7B006D6B_rmWdaL2MS_NmamrSCy8"`,
    },
  });
  return apiInstance;
};

export const fetchDataApi = async (
  endpoint: string,
  options?: { headers?: Record<string, string> },
) => {
  if (!apiInstance) {
    throw new Error(
      "Client not initialized. Please call Client({ JSESSIONID, li_at }) first.",
    );
  }
  const response = await apiInstance.get(`/voyager/api${endpoint}`, {
    headers: options?.headers,
  });
  return response.data;
};

export const fetchDataClient = async (
  endpoint: string,
  options?: { headers?: Record<string, string> },
) => {
  if (!apiInstance) {
    throw new Error(
      "Client not initialized. Please call Client({ JSESSIONID, li_at }) first.",
    );
  }
  const response = await apiInstance.get(endpoint, {
    headers: options?.headers,
    maxRedirects: 0,
    validateStatus: (status) => status >= 200 && status < 400,
  });
  console.log(response.status); // 302
  console.log(response.headers);
  return response.headers.location;
};
