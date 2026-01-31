/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from "fs-extra";
import axios from "axios";
import { Cookie } from "puppeteer";
import { loginLinkedin } from "./auth";

export const COOKIE_FILE_PATH = "linkedin_cookies.json";

export const API_BASE_URL = "https://www.linkedin.com/voyager/api";
export const AUTH_BASE_URL = "https://www.linkedin.com";

// Interface para os cookies completos (formato Puppeteer)
interface LinkedInCookiesFile {
  cookies: Cookie[];
  timestamp: number;
}

// Interface para cookies específicos do LinkedIn API
interface LinkedInApiCookies {
  JSESSIONID: string;
  li_at: string;
}

// Função para salvar todos os cookies do Puppeteer no arquivo JSON
export const saveAllCookies = async (cookies: Cookie[]): Promise<void> => {
  try {
    const cookieData: LinkedInCookiesFile = {
      cookies,
      timestamp: Date.now(),
    };

    await fs.ensureFile(COOKIE_FILE_PATH);
    await fs.writeJson(COOKIE_FILE_PATH, cookieData, { spaces: 2 });
    console.log(`Todos os cookies salvos em: ${COOKIE_FILE_PATH}`);
  } catch (error) {
    console.error("Erro ao salvar cookies:", error);
    throw error;
  }
};

// Função para carregar todos os cookies do arquivo JSON
export const loadAllCookies = async (): Promise<Cookie[] | null> => {
  try {
    const exists = await fs.pathExists(COOKIE_FILE_PATH);
    if (!exists) {
      console.log("Arquivo de cookies não encontrado");
      process.exit(1);
    }

    const cookieData: LinkedInCookiesFile = await fs.readJson(COOKIE_FILE_PATH);

    // Verificar se tem a estrutura esperada
    if (!cookieData || !Array.isArray(cookieData)) {
      console.log("Estrutura de cookies inválida no arquivo");
      return null;
    }

    console.log(
      `${cookieData.length} cookies carregados de: ${COOKIE_FILE_PATH}`,
    );
    return cookieData;
  } catch (error) {
    console.error("Erro ao carregar cookies:", error);
    return null;
  }
};

// Função para extrair cookies específicos para API do LinkedIn
export const extractApiCookies = (
  cookies: Cookie[],
): LinkedInApiCookies | null => {
  const jsessionCookie = cookies.find((c) => c.name === "JSESSIONID");
  const liAtCookie = cookies.find((c) => c.name === "li_at");

  if (!jsessionCookie || !liAtCookie) {
    console.log("Cookies JSESSIONID ou li_at não encontrados");
    return null;
  }

  // Extrair o valor do JSESSIONID (remover "ajax:" se presente)
  let jsessionValue = jsessionCookie.value.replace(/"/g, "");
  if (jsessionValue.startsWith("ajax:")) {
    jsessionValue = jsessionValue.replace("ajax:", "");
  }

  return {
    JSESSIONID: jsessionValue,
    li_at: liAtCookie.value,
  };
};

// Função para criar cliente com cookies automáticos
export const Client = async (
  providedCookies?: LinkedInApiCookies,
  baseURL?: string,
): Promise<ReturnType<typeof api>> => {
  let cookiesToUse: LinkedInApiCookies;
  const savedCookies = await loadAllCookies();

  if (savedCookies) {
    const JSESSIONID =
      savedCookies
        .find((c) => c.name === "JSESSIONID")
        ?.value.split("ajax:")[1] || "0";
    const li_at = savedCookies.find((c) => c.name === "li_at")?.value || "";
    cookiesToUse = { JSESSIONID, li_at };
  } else {
    if (providedCookies) {
      cookiesToUse = providedCookies;
      console.log("Cookies fornecidos:", cookiesToUse);
    } else {
      throw new Error("Nenhum cookie válido fornecido");
    }
  }

  return api({
    JSESSIONID: parseInt(cookiesToUse.JSESSIONID),
    li_at: cookiesToUse.li_at,
    baseURL: baseURL || API_BASE_URL,
  });
};

const api = ({
  JSESSIONID,
  li_at,
  baseURL = API_BASE_URL,
}: {
  li_at: string;
  JSESSIONID: number;
  baseURL?: string;
}) => {
  return axios.create({
    baseURL,
    maxRedirects: 3, // Limitar redirecionamentos a 3
    timeout: 10000, // Timeout de 10 segundos
    headers: {
      "accept-language":
        "pt-BR,pt;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
      accept: "application/vnd.linkedin.normalized+json+2.1",
      cookie: `li_at=${li_at}; JSESSIONID="ajax:${JSESSIONID}"`,
      "csrf-token": `ajax:${JSESSIONID}`,
    },
  });
};

export const fetchData = async (endpoint: string): Promise<any> => {
  try {
    const api = await Client();
    const response = await api.get(endpoint);
    return response.data;
  } catch (error: any) {
    console.error("Erro ao buscar dados:", error.message);
    console.error("Status do erro:", error.response?.status);
    console.error("Código do erro:", error.code);

    // Verificar se é erro de autenticação ou redirecionamento
    if (
      error.response?.status === 401 ||
      error.response?.status === 403 ||
      error.code === "ERR_FR_TOO_MANY_REDIRECTS" ||
      error.message === "Maximum number of redirects exceeded" ||
      error.message === "Nenhum cookie válido fornecido"
    ) {
      console.log("🔄 Tentando fazer login novamente...");
      await loginLinkedin();
      return fetchData(endpoint);
    }
    process.exit(1);
  }
};
