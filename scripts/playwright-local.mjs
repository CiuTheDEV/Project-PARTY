import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const nodeBin = process.execPath;
const npmBin = process.platform === "win32" ? "npm.cmd" : "npm";
const toolsDir = path.join(repoRoot, ".playwright-tools");
const browsersDir = path.join(repoRoot, ".playwright-browsers");
const npmCacheDir = path.join(repoRoot, ".npm-cache");
const tempDir = path.join(repoRoot, ".playwright-tmp");

function run(command, args, extraEnv = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    cwd: repoRoot,
    env: {
      ...process.env,
      PATH: `${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH ?? ""}`,
      npm_config_cache: npmCacheDir,
      PLAYWRIGHT_BROWSERS_PATH: browsersDir,
      TMPDIR: tempDir,
      TMP: tempDir,
      TEMP: tempDir,
      ...extraEnv,
    },
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function ensureToolsPackage() {
  mkdirSync(toolsDir, { recursive: true });
  mkdirSync(browsersDir, { recursive: true });
  mkdirSync(npmCacheDir, { recursive: true });
  mkdirSync(tempDir, { recursive: true });

  const packageJsonPath = path.join(toolsDir, "package.json");

  if (!existsSync(packageJsonPath)) {
    writeFileSync(
      packageJsonPath,
      JSON.stringify(
        {
          private: true,
          name: "project-party-playwright-tools",
        },
        null,
        2,
      ),
    );
  }
}

function install() {
  ensureToolsPackage();
  run(npmBin, ["install", "--prefix", toolsDir, "playwright"]);
}

function installBrowser() {
  ensureToolsPackage();

  if (!existsSync(path.join(toolsDir, "node_modules", "playwright"))) {
    install();
  }

  run(nodeBin, [
    path.join(toolsDir, "node_modules", "playwright", "cli.js"),
    "install",
    "chromium",
  ]);
}

function debugLaunch(url) {
  ensureToolsPackage();

  if (!existsSync(path.join(toolsDir, "node_modules", "playwright"))) {
    install();
  }

  run(nodeBin, [path.join(repoRoot, "tests", "playwright", "debug-launch.mjs"), url]);
}

const command = process.argv[2];

if (command === "install") {
  install();
} else if (command === "install-browser") {
  installBrowser();
} else if (command === "debug-launch") {
  debugLaunch(process.argv[3] ?? "http://127.0.0.1:5174");
} else {
  console.error(
    "Usage: node scripts/playwright-local.mjs <install|install-browser|debug-launch> [url]",
  );
  process.exit(1);
}
