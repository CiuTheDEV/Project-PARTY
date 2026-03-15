import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "..");
const packageJsonPaths = [
  "package.json",
  "apps/web/package.json",
  "apps/worker/package.json",
  "games/kalambury/package.json",
];

for (const packageJsonPath of packageJsonPaths) {
  test(`${packageJsonPath} scripts use a local repo entrypoint`, () => {
    const packageJson = JSON.parse(
      readFileSync(path.resolve(repoRoot, packageJsonPath), "utf8"),
    );

    for (const [scriptName, scriptCommand] of Object.entries(packageJson.scripts)) {
      assert.equal(
        /scripts\/node\b/.test(scriptCommand),
        false,
        `Script "${scriptName}" in ${packageJsonPath} still depends on the removed WSL node wrapper: ${scriptCommand}`,
      );

      assert.match(
        scriptCommand,
        /^node\b|scripts\/run-tool\.mjs|scripts\/run-node-test\.mjs|scripts\/playwright-local\.mjs/,
        `Script "${scriptName}" in ${packageJsonPath} should use native node or a repo script entrypoint: ${scriptCommand}`,
      );
    }
  });
}
