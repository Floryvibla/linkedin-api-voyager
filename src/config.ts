import * as path from "path";
import * as os from "os";
import * as fs from "fs-extra";
import axios from "axios";

export const COOKIE_FILE_PATH = "linkedin_cookies.json";

export const API_BASE_URL = "https://www.linkedin.com/voyager/api";
export const AUTH_BASE_URL = "https://www.linkedin.com";

// Interface para os cookies
interface LinkedInCookies {
  JSESSIONID: string;
  li_at: string;
  timestamp: number;
}

// Função para salvar cookies no arquivo JSON
export const saveCookies = async (
  JSESSIONID: string,
  li_at: string
): Promise<void> => {
  try {
    const cookies: LinkedInCookies = {
      JSESSIONID,
      li_at,
      timestamp: Date.now(),
    };

    await fs.ensureFile(COOKIE_FILE_PATH);
    await fs.writeJson(COOKIE_FILE_PATH, cookies, { spaces: 2 });
    console.log(`Cookies salvos em: ${COOKIE_FILE_PATH}`);
  } catch (error) {
    console.error("Erro ao salvar cookies:", error);
    throw error;
  }
};

// Função para carregar cookies do arquivo JSON
export const loadCookies = async (): Promise<LinkedInCookies | null> => {
  try {
    const exists = await fs.pathExists(COOKIE_FILE_PATH);
    if (!exists) {
      console.log("Arquivo de cookies não encontrado");
      return null;
    }

    const cookies = await fs.readJson(COOKIE_FILE_PATH);

    // Verificar se os cookies têm a estrutura esperada
    if (!cookies.JSESSIONID || !cookies.li_at) {
      console.log("Cookies inválidos encontrados no arquivo");
      return null;
    }

    console.log(`Cookies carregados de: ${COOKIE_FILE_PATH}`);
    return cookies;
  } catch (error) {
    console.error("Erro ao carregar cookies:", error);
    return null;
  }
};

// Função para criar cliente com cookies automáticos
export const Client = async (providedCookies?: {
  JSESSIONID: string;
  li_at: string;
}): Promise<ReturnType<typeof api>> => {
  let cookiesToUse: { JSESSIONID: string; li_at: string };
  const savedCookies = await loadCookies();

  if (savedCookies) {
    cookiesToUse = {
      JSESSIONID: savedCookies.JSESSIONID,
      li_at: savedCookies.li_at,
    };
  } else {
    if (providedCookies) {
      await saveCookies(providedCookies.JSESSIONID, providedCookies.li_at);
      cookiesToUse = providedCookies;
    } else {
      throw new Error("Nenhum cookie válido fornecido");
    }
  }

  return api({
    JSESSIONID: parseInt(cookiesToUse.JSESSIONID),
    li_at: cookiesToUse.li_at,
  });
};

const api = ({ JSESSIONID, li_at }: { li_at: string; JSESSIONID: number }) => {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "accept-language":
        "pt-BR,pt;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
      accept: "application/vnd.linkedin.normalized+json+2.1",
      cookie: `li_at=${li_at}; JSESSIONID="ajax:${JSESSIONID}"`,
      "csrf-token": `ajax:${JSESSIONID}`,
    },
  });
};

export const fetchData = async (endpoint: string) => {
  const api = await Client();
  const response = await api.get(endpoint);
  return response.data;
};
