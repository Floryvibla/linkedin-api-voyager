import * as path from "path";

// Configurações do Browserless
export const tokenBrowserless = "HUWOg5DErL8n82XtP0QcCbEpBpgUS6XG";
export const endpointBrowserless = "https://browser.flory.dev";

export const LINKEDIN_URLS = {
  LOGIN: "https://www.linkedin.com/login",
  FEED: "https://www.linkedin.com/feed/",
  HOME: "https://www.linkedin.com/",
};

// Caminhos de arquivos
export const COOKIES_FILE_PATH = path.join(
  process.cwd(),
  "linkedin_cookies.json",
);

// Configurações anti-detecção
export const STEALTH_CONFIG = {
  headless: false, // Melhor para debugging e evitar detecção
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-accelerated-2d-canvas",
    "--no-first-run",
    "--no-zygote",
    "--disable-gpu",
    "--disable-web-security",
    "--disable-features=VizDisplayCompositor",
    "--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  ],
  defaultViewport: {
    width: 1366,
    height: 768,
  },
};

// Timeouts e delays
export const TIMEOUTS = {
  NAVIGATION: 60000,
  ELEMENT_WAIT: 15000,
  HUMAN_DELAY: { min: 1000, max: 3000 },
};
