const fs = require("node:fs");
const path = require("node:path");

const repoRoot = process.argv[2];
const targetUrl = process.argv[3] || "http://127.0.0.1:5174";
const outputDir = process.argv[4];

if (!repoRoot || !outputDir) {
  throw new Error("Usage: node debug-launch.windows.cjs <repoRoot> <url> <outputDir>");
}

const { chromium } = require(
  path.join(repoRoot, ".playwright-tools", "node_modules", "playwright"),
);

fs.mkdirSync(outputDir, { recursive: true });

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
    await page.goto(targetUrl, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: /Graj/i }).click();
    await page.waitForTimeout(2500);

    const screenshotPath = path.join(outputDir, "launch-debug.png");

    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });

    const result = {
      url: page.url(),
      title: await page.title(),
      bodyText: await page.locator("body").innerText(),
      consoleMessages,
      pageErrors,
      failedRequests,
      screenshot: screenshotPath,
    };

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
