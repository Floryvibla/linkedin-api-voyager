import { Browser, Page } from "puppeteer";
import { launchBrowserWithBrowserless, launchBrowserLocal } from "./index";

interface LinkedInCredentials {
  email: string;
  password: string;
}

export class LinkedInAutomation {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private credentials: LinkedInCredentials | null = null;

  constructor(credentials?: LinkedInCredentials) {
    this.credentials = credentials || null;
  }

  // Inicializar automação (tenta Browserless primeiro, depois local)
  async initialize(): Promise<boolean> {
    try {
      // Tentar Browserless primeiro
      console.log("🔄 Tentando conectar via Browserless...");
      const result = await launchBrowserWithBrowserless(
        this.credentials || undefined,
      );

      //   if (!result) {
      //     console.log("🔄 Browserless falhou, tentando browser local...");
      //     result = await launchBrowserLocal(this.credentials || undefined);
      //   }

      if (result) {
        this.browser = result.browser;
        this.page = result.page;
        console.log("✅ Automação inicializada com sucesso!");
        return true;
      }

      console.log("❌ Falha ao inicializar automação");
      return false;
    } catch (error) {
      console.log("❌ Erro na inicialização:", error);
      return false;
    }
  }

  // Definir credenciais
  setCredentials(credentials: LinkedInCredentials): void {
    this.credentials = credentials;
  }

  // Obter página atual
  getPage(): Page | null {
    return this.page;
  }

  // Obter browser atual
  getBrowser(): Browser | null {
    return this.browser;
  }

  // Verificar se está logado
  async isLoggedIn(): Promise<boolean> {
    if (!this.page) return false;

    try {
      const currentUrl = this.page.url();
      return (
        currentUrl.includes("/feed/") ||
        currentUrl.includes("/in/") ||
        (currentUrl.includes("linkedin.com") && !currentUrl.includes("/login"))
      );
    } catch {
      return false;
    }
  }

  // Navegar para uma URL específica do LinkedIn
  async navigateTo(url: string): Promise<boolean> {
    if (!this.page) {
      console.log("❌ Página não inicializada");
      return false;
    }

    try {
      await this.page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });
      return true;
    } catch (error) {
      console.log("❌ Erro ao navegar:", error);
      return false;
    }
  }

  // Fechar browser
  async close(): Promise<void> {
    try {
      if (this.browser) {
        await this.browser.close();
        console.log("✅ Browser fechado");
      }
    } catch (error) {
      console.log("❌ Erro ao fechar browser:", error);
    } finally {
      this.browser = null;
      this.page = null;
    }
  }

  // Método para aguardar elemento
  async waitForElement(
    selector: string,
    timeout: number = 10000,
  ): Promise<boolean> {
    if (!this.page) return false;

    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch {
      return false;
    }
  }

  // Método para extrair texto de elemento
  async getElementText(selector: string): Promise<string | null> {
    if (!this.page) return null;

    try {
      const element = await this.page.$(selector);
      if (element) {
        return await this.page.evaluate(
          (el) => el.textContent?.trim() || null,
          element,
        );
      }
    } catch (error) {
      console.log("❌ Erro ao extrair texto:", error);
    }
    return null;
  }

  // Método para clicar em elemento
  async clickElement(selector: string): Promise<boolean> {
    if (!this.page) return false;

    try {
      await this.page.click(selector);
      return true;
    } catch (error) {
      console.log("❌ Erro ao clicar:", error);
      return false;
    }
  }
}
