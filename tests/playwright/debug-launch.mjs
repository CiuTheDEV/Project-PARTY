import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const { chromium } = require(
  path.resolve(".playwright-tools/node_modules/playwright"),
);

const targetUrl = process.argv[2] ?? "http://127.0.0.1:5174";
const outputDir = path.resolve("output/playwright");
const windowsPsPath =
  "/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe";
const windowsNodePath = "C:\\Program Files\\nodejs\\node.exe";

mkdirSync(outputDir, { recursive: true });

function isWsl() {
  return Boolean(process.env.WSL_DISTRO_NAME);
}

function toWindowsPath(targetPath) {
  const result = spawnSync("wslpath", ["-w", targetPath], {
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(
      result.stderr || result.stdout || `Failed to convert path: ${targetPath}`,
    );
  }

  return result.stdout.trim();
}

function runWindowsLaunch() {
  const windowsScriptPath = toWindowsPath(
    path.resolve("tests/playwright/debug-launch.windows.cjs"),
  );
  const windowsRepoPath = toWindowsPath(path.resolve("."));
  const windowsOutputPath = toWindowsPath(outputDir);
  const command = [
    `& '${windowsNodePath}'`,
    `'${windowsScriptPath}'`,
    `'${windowsRepoPath}'`,
    `'${targetUrl}'`,
    `'${windowsOutputPath}'`,
  ].join(" ");
  const result = spawnSync(
    windowsPsPath,
    ["-NoProfile", "-Command", command],
    {
      stdio: "inherit",
    },
  );

  if (result.status !== 0) {
    throw new Error("Windows Playwright launch failed.");
  }
}

async function launchBrowser() {
  try {
    const browser = await chromium.launch({
      headless: true,
    });

    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });

    return { browser, page, cleanup: async () => browser.close() };
  } catch (error) {
    if (!isWsl()) {
      throw error;
    }

    runWindowsLaunch();
    process.exit(0);
  }
}

const { page, cleanup } = await launchBrowser();

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
  await page.screenshot({
    path: path.join(outputDir, "launch-debug.png"),
    fullPage: true,
  });

  const result = {
    url: page.url(),
    title: await page.title(),
    bodyText: await page.locator("body").innerText(),
    consoleMessages,
    pageErrors,
    failedRequests,
    screenshot: path.join(outputDir, "launch-debug.png"),
  };

  console.log(JSON.stringify(result, null, 2));
} finally {
  await cleanup();
}
