import axios, { AxiosInstance } from "axios";

export const API_BASE_URL = "https://www.linkedin.com/voyager/api";

let apiInstance: AxiosInstance | null = null;

export const Client = (providedCookies: {
  JSESSIONID: string;
  li_at: string;
}) => {
  apiInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "accept-language":
        "pt-BR,pt;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
      accept: "application/vnd.linkedin.normalized+json+2.1",
      cookie: `li_at=${providedCookies.li_at}; JSESSIONID="ajax:${providedCookies.JSESSIONID}"`,
      "csrf-token": `ajax:${providedCookies.JSESSIONID}`,
    },
  });
  return apiInstance;
};

export const fetchData = async (endpoint: string) => {
  if (!apiInstance) {
    throw new Error(
      "Client not initialized. Please call Client({ JSESSIONID, li_at }) first.",
    );
  }
  const response = await apiInstance.get(endpoint);
  return response.data;
};
