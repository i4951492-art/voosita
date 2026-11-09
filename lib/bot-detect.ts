/**
 * Lightweight client-side bot / automation detection.
 * Collects signals commonly used against headless browsers and scrapers.
 * Not 100% reliable alone — combine with server-side checks + CAPTCHA later.
 */

export type BotSignals = {
  webdriver: boolean;
  headlessUa: boolean;
  noPlugins: boolean;
  zeroCores: boolean;
  weirdMemory: boolean;
  noLanguages: boolean;
  canvasSuspicious: boolean;
  missingChrome: boolean;
  score: number; // 0–100, higher = more bot-like
  fingerprintHash: string;
};

function simpleHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16);
}

export async function collectBotSignals(): Promise<BotSignals> {
  if (typeof window === "undefined") {
    return {
      webdriver: false,
      headlessUa: false,
      noPlugins: false,
      zeroCores: false,
      weirdMemory: false,
      noLanguages: false,
      canvasSuspicious: false,
      missingChrome: false,
      score: 0,
      fingerprintHash: "ssr",
    };
  }

  const nav = navigator as Navigator & { webdriver?: boolean; deviceMemory?: number; userAgentData?: unknown };
  const ua = nav.userAgent || "";

  const webdriver = !!nav.webdriver;
  const headlessUa =
    /HeadlessChrome|PhantomJS|Selenium|Puppeteer|Playwright/i.test(ua) ||
    (ua.includes("Chrome") && !ua.includes("Safari"));

  const pluginsLen = nav.plugins?.length ?? 0;
  const noPlugins = pluginsLen === 0 && !/Mobile|Android|iPhone/i.test(ua);

  const cores = nav.hardwareConcurrency ?? 0;
  const zeroCores = cores === 0;

  const mem = nav.deviceMemory;
  const weirdMemory =
    mem !== undefined && ![0.25, 0.5, 1, 2, 4, 8].includes(mem);

  const langs = nav.languages || [];
  const noLanguages = langs.length === 0;

  // Canvas fingerprint (simple)
  let canvasSuspicious = false;
  let canvasData = "";
  try {
    const c = document.createElement("canvas");
    c.width = 200;
    c.height = 50;
    const ctx = c.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillStyle = "#f60";
      ctx.fillRect(0, 0, 100, 50);
      ctx.fillStyle = "#069";
      ctx.fillText("VOOSITA-fp", 2, 15);
      canvasData = c.toDataURL();
      // Headless often produces empty or identical images
      if (canvasData.length < 100) canvasSuspicious = true;
    }
  } catch {
    canvasSuspicious = true;
  }

  const missingChrome =
    /Chrome/i.test(ua) && !(window as Window & { chrome?: unknown }).chrome;

  // Score
  let score = 0;
  if (webdriver) score += 40;
  if (headlessUa) score += 25;
  if (noPlugins) score += 15;
  if (zeroCores) score += 20;
  if (weirdMemory) score += 10;
  if (noLanguages) score += 15;
  if (canvasSuspicious) score += 20;
  if (missingChrome) score += 15;
  score = Math.min(100, score);

  const fpRaw = [
    ua,
    nav.language,
    screen.width + "x" + screen.height,
    screen.colorDepth,
    cores,
    mem,
    pluginsLen,
    canvasData.slice(0, 80),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join("|");

  return {
    webdriver,
    headlessUa,
    noPlugins,
    zeroCores,
    weirdMemory,
    noLanguages,
    canvasSuspicious,
    missingChrome,
    score,
    fingerprintHash: simpleHash(fpRaw),
  };
}

export const BOT_THRESHOLD = 45; // above this → treat as suspicious
