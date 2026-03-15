const fs = require("node:fs");
const path = require("node:path");

const repoRoot = process.argv[2];
const baseUrl = process.argv[3] || "http://127.0.0.1:5174";
const outputDir = process.argv[4];

if (!repoRoot || !outputDir) {
  throw new Error("Usage: node smoke-main.windows.cjs <repoRoot> <baseUrl> <outputDir>");
}

const { chromium } = require(
  path.join(repoRoot, ".playwright-tools", "node_modules", "playwright"),
);

fs.mkdirSync(outputDir, { recursive: true });

async function capture(page, name) {
  const filePath = path.join(outputDir, `${name}.png`);

  await page.screenshot({
    path: filePath,
    fullPage: true,
  });

  return filePath;
}

(async () => {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  const consoleMessages = [];
  const pageErrors = [];
  const failedRequests = [];

  page.on("console", (message) => {
    consoleMessages.push({
      type: message.type(),
      text: message.text(),
    });
  });

  page.on("pageerror", (error) => {
    pageErrors.push(String(error));
  });

  page.on("requestfailed", (request) => {
    failedRequests.push({
      url: request.url(),
      failure: request.failure(),
    });
  });

  try {
    const report = {
      baseUrl,
      steps: [],
      consoleMessages,
      pageErrors,
      failedRequests,
    };

    await page.goto(baseUrl, { waitUntil: "networkidle" });
    report.steps.push({
      name: "home",
      url: page.url(),
      screenshot: await capture(page, "home"),
      bodyText: await page.locator("body").innerText(),
    });

    await page.getByRole("link", { name: /Dołącz po kodzie/i }).click();
    await page.waitForLoadState("networkidle");
    report.steps.push({
      name: "join",
      url: page.url(),
      screenshot: await capture(page, "join"),
      bodyText: await page.locator("body").innerText(),
    });

    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: /^Graj$/i }).first().click();
    await page.waitForURL(/\/kalambury$/, { timeout: 10000 });
    await page.waitForLoadState("networkidle");
    report.steps.push({
      name: "kalambury-menu",
      url: page.url(),
      screenshot: await capture(page, "kalambury-menu"),
      bodyText: await page.locator("body").innerText(),
    });

    await page.getByRole("button", { name: /Ustawienia/i }).click();
    await page.waitForTimeout(500);
    report.steps.push({
      name: "kalambury-settings",
      url: page.url(),
      screenshot: await capture(page, "kalambury-settings"),
      bodyText: await page.locator("body").innerText(),
    });

    await page.getByRole("button", { name: /Graj teraz/i }).click();
    await page.waitForTimeout(500);
    report.steps.push({
      name: "kalambury-menu-return",
      url: page.url(),
      screenshot: await capture(page, "kalambury-menu-return"),
      bodyText: await page.locator("body").innerText(),
    });

    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
