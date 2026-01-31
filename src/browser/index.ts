/* eslint-disable @typescript-eslint/no-explicit-any */
import puppeteer, { Browser, Page, Cookie } from "puppeteer";
import {
  STEALTH_CONFIG,
  LINKEDIN_URLS,
  TIMEOUTS,
  tokenBrowserless,
  endpointBrowserless,
} from "./config";
import { saveAllCookies, loadAllCookies } from "../config";
import { LinkedInCredentialsLogin } from "../auth";

// Função para adicionar delay humano
const humanDelay = (
  min: number = TIMEOUTS.HUMAN_DELAY.min,
  max: number = TIMEOUTS.HUMAN_DELAY.max,
) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
};

const LINKEDIN_VERIFICATION_WEBHOOK_URL =
  "https://n8n.biuma.com.br/webhook/verificacao-linkedin-code";

const PROTECT_ACCOUNT_PHRASES = ["Proteja sua conta", "Protect your account"];

const getLinkedinVerificationCode = async (): Promise<number | null> => {
  try {
    const response = await fetch(LINKEDIN_VERIFICATION_WEBHOOK_URL, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      output?: { code?: number | null } | null;
    };

    const code = data?.output?.code ?? null;
    return typeof code === "number" ? code : null;
  } catch {
    return null;
  }
};

const findVerificationInputSelector = async (
  page: Page,
): Promise<string | null> => {
  const explicitSelectors = [
    'input[name="pin"]',
    "#input__email_verification_pin",
    'input[name="verificationCode"]',
    'input[name="otp"]',
    'input[type="tel"]',
    'input[inputmode="numeric"]',
  ];

  for (const selector of explicitSelectors) {
    const el = await page.$(selector);
    if (el) return selector;
  }

  const inferred = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll("input"));
    const byHint = inputs.find((input) => {
      const name = (input.getAttribute("name") || "").toLowerCase();
      const id = (input.getAttribute("id") || "").toLowerCase();
      const aria = (input.getAttribute("aria-label") || "").toLowerCase();
      const placeholder = (
        input.getAttribute("placeholder") || ""
      ).toLowerCase();
      const combined = `${name} ${id} ${aria} ${placeholder}`;
      return (
        combined.includes("pin") ||
        combined.includes("code") ||
        combined.includes("código") ||
        combined.includes("codigo") ||
        combined.includes("otp")
      );
    }) as HTMLInputElement | undefined;

    const candidate = byHint ?? (inputs[0] as HTMLInputElement | undefined);
    if (!candidate) return null;

    if (!candidate.id) candidate.id = "linkedin-verification-code-input";
    return `#${candidate.id}`;
  });

  return inferred;
};

const submitVerificationCode = async (
  page: Page,
  code: number,
): Promise<void> => {
  const selector = await findVerificationInputSelector(page);
  if (!selector) return;

  const codeStr = String(code);
  await page.focus(selector);
  await page.click(selector, { clickCount: 3 });
  await page.keyboard.press("Backspace");
  await page.type(selector, codeStr, { delay: 80 });

  const submitSelectors = [
    'button[type="submit"]',
    'button[aria-label*="Verificar"]',
    'button[aria-label*="Verify"]',
  ];

  for (const s of submitSelectors) {
    const btn = await page.$(s);
    if (btn) {
      await btn.click();
      return;
    }
  }

  await page.keyboard.press("Enter");
};

// Função para carregar cookies salvos (usando a nova função)
export const loadCookies = async (): Promise<Cookie[] | null> => {
  try {
    const cookies = await loadAllCookies();
    if (cookies) {
      console.log("✅ Cookies válidos encontrados");
      return cookies;
    } else {
      console.log("⚠️ Nenhum cookie válido encontrado");
      return null;
    }
  } catch (error) {
    console.error("❌ Erro ao carregar cookies:", error);
    return null;
  }
};

// Função para salvar cookies
const saveCookies = async (page: Page, browser: Browser): Promise<void> => {
  try {
    console.log("🍪 Salvando cookies...");

    // Aguardar 3 segundos para que o LinkedIn defina todos os cookies
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Obter cookies do browser
    const cookies = await browser.cookies();
    console.log("🔢 Total de cookies capturados:", cookies.length);

    // Verificar se li_at está presente
    const liAtCookie = cookies.find((cookie) => cookie.name === "li_at");
    console.log("🎯 li_at encontrado:", liAtCookie ? "SIM" : "NÃO");

    await saveAllCookies(cookies);
    console.log("✅ Cookies salvos com sucesso");
  } catch (error) {
    console.error("❌ Erro ao salvar cookies:", error);
    throw error;
  }
};

// Função para configurar página com medidas anti-detecção
const setupStealthPage = async (page: Page): Promise<void> => {
  // Configurar user agent
  await page.setUserAgent(
    STEALTH_CONFIG.args
      .find((arg) => arg.includes("user-agent"))
      ?.split("=")[1] ||
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  );

  // Configurar viewport
  await page.setViewport(STEALTH_CONFIG.defaultViewport);

  // Remover propriedades que indicam automação
  await page.evaluateOnNewDocument(() => {
    // Remove webdriver property
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
    });

    // Mock chrome property
    (window as any).chrome = {
      runtime: {},
    };

    // Mock permissions
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => {
      if (parameters.name === "notifications") {
        return Promise.resolve({
          state: Notification.permission,
          name: parameters.name,
          onchange: null,
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        } as PermissionStatus);
      }
      return originalQuery(parameters);
    };
  });
};

// Função para realizar login no LinkedIn
const performLogin = async (
  page: Page,
  credentials: LinkedInCredentialsLogin,
  browser: Browser,
): Promise<boolean> => {
  try {
    console.log("🔐 Iniciando processo de login...");

    // Navegar para página de login
    await page.goto(LINKEDIN_URLS.LOGIN, {
      waitUntil: "networkidle2",
      timeout: TIMEOUTS.NAVIGATION,
    });

    await humanDelay();

    // Verificar se já existe um perfil logado (member-profile-block)
    try {
      const memberProfileBlock = await page.$(".member-profile-block");
      if (memberProfileBlock) {
        console.log(
          "✅ Perfil já logado encontrado! Clicando para continuar...",
        );
        await memberProfileBlock.click();
        await humanDelay(2000, 3000);

        // Verificar se foi redirecionado com sucesso
        const currentUrl = page.url();
        const isLoggedIn =
          currentUrl.includes("/feed/") ||
          currentUrl.includes("/in/") ||
          currentUrl === LINKEDIN_URLS.HOME;

        if (isLoggedIn) {
          console.log("✅ Login automático realizado com sucesso!");
          await saveCookies(page, browser);
          return true;
        }
      }
    } catch (error) {
      console.log(
        "ℹ️ Nenhum perfil logado encontrado, continuando com login manual...",
      );
    }

    // Aguardar campos de login
    await page.waitForSelector("#username", { timeout: TIMEOUTS.ELEMENT_WAIT });
    await page.waitForSelector("#password", { timeout: TIMEOUTS.ELEMENT_WAIT });

    // Preencher credenciais com delay humano
    await page.type("#username", credentials.email, { delay: 100 });
    await humanDelay(500, 1000);

    await page.type("#password", credentials.password, { delay: 100 });
    await humanDelay(500, 1000);

    // Clicar no botão de login
    await page.click('button[type="submit"]');

    // Aguardar um pouco após o clique
    await humanDelay(2000, 3000);

    // Verificar se o login foi bem-sucedido
    const currentUrl = page.url();
    const isLoggedIn =
      currentUrl.includes("/feed/") ||
      currentUrl.includes("/in/") ||
      currentUrl === LINKEDIN_URLS.HOME;

    if (isLoggedIn) {
      console.log("✅ Login realizado com sucesso!");
      await saveCookies(page, browser);
      return true;
    }

    const isProtectAccount = await page.evaluate((phrases) => {
      const text = document.body?.innerText || "";
      return phrases.some((phrase) => text.includes(phrase));
    }, PROTECT_ACCOUNT_PHRASES);

    if (isProtectAccount) {
      const verificationCode = await getLinkedinVerificationCode();
      if (!verificationCode) {
        console.log("⚠️ Código de verificação não disponível. Encerrando.");
        return false;
      }

      await submitVerificationCode(page, verificationCode);
      await humanDelay(2000, 3000);

      const urlAfterVerification = page.url();
      const isLoggedInAfterVerification =
        urlAfterVerification.includes("/feed/") ||
        urlAfterVerification.includes("/in/") ||
        urlAfterVerification === LINKEDIN_URLS.HOME;

      if (isLoggedInAfterVerification) {
        console.log("✅ Verificação concluída e login realizado!");
        await saveCookies(page, browser);
        return true;
      }
    }

    console.log("❌ Falha no login - não foi redirecionado para o feed");
    console.log("URL atual:", currentUrl);
    return false;
  } catch (error) {
    console.log("❌ Erro durante o login:", error);
    return false;
  }
};

// Função principal para lançar browser com Browserless
export const launchBrowserWithBrowserless = async (
  credentials?: LinkedInCredentialsLogin,
): Promise<{ browser: Browser; page: Page } | null> => {
  try {
    console.log("🚀 Conectando ao Browserless...");

    // Conectar ao Browserless
    const browser = await puppeteer.connect({
      browserWSEndpoint: `${endpointBrowserless}?token=${tokenBrowserless}&--no-sandbox&--disable-web-security`,
    });

    const page = await browser.newPage();
    await setupStealthPage(page);

    // Tentar carregar cookies existentes
    const savedCookies = await loadCookies();

    if (savedCookies) {
      // Usar cookies salvos
      await browser.setCookie(...savedCookies);

      // Verificar se ainda está logado
      await page.goto(LINKEDIN_URLS.FEED, {
        waitUntil: "networkidle2",
        timeout: TIMEOUTS.NAVIGATION,
      });

      const currentUrl = page.url();
      if (currentUrl.includes("/feed") || currentUrl.includes("/in")) {
        console.log("✅ Sessão restaurada com sucesso usando cookies!");
        await browser.close();
        return { browser, page };
      } else {
        console.log("⚠️ Cookies inválidos, será necessário fazer login");
      }
    }

    // Se não há cookies válidos, fazer login
    if (credentials) {
      const loginSuccess = await performLogin(page, credentials, browser);
      if (loginSuccess) {
        return { browser, page };
      }
    } else {
      console.log("❌ Credenciais necessárias para primeiro login");
    }

    await browser.close();
    return null;
  } catch (error) {
    console.log("❌ Erro ao conectar com Browserless:", error);
    return null;
  }
};

// Função para lançar browser local (fallback)
export const launchBrowserLocal = async (
  credentials?: LinkedInCredentialsLogin,
): Promise<{ browser: Browser; page: Page } | null> => {
  try {
    const browser = await puppeteer.launch(STEALTH_CONFIG);
    const page = await browser.newPage();
    await setupStealthPage(page);

    // Tentar carregar cookies existentes
    const savedCookies = await loadCookies();

    if (savedCookies) {
      await browser.setCookie(...savedCookies);

      await page.goto(LINKEDIN_URLS.FEED, {
        waitUntil: "networkidle2",
        timeout: TIMEOUTS.NAVIGATION,
      });

      const currentUrl = page.url();
      if (currentUrl.includes("/feed/") || currentUrl.includes("/in/")) {
        console.log("✅ Sessão restaurada com sucesso usando cookies!");
        return { browser, page };
      }
    }

    // Se não há cookies válidos, fazer login
    if (credentials) {
      const loginSuccess = await performLogin(page, credentials, browser);
      if (loginSuccess) {
        return { browser, page };
      }
    } else {
      console.log("❌ Credenciais necessárias para primeiro login");
    }

    await browser.close();
    return null;
  } catch (error) {
    console.log("❌ Erro ao lançar browser local:", error);
    return null;
  }
};
