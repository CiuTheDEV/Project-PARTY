import { existsSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

import { ensureWorkspacePackageLinks } from "./ensure-workspace-links.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const [, , tool, ...args] = process.argv;

if (!tool) {
  console.error("Missing tool name.");
  process.exit(1);
}

ensureWorkspacePackageLinks();

const toolCandidates = {
  biome: [{ kind: "js", path: "node_modules/@biomejs/biome/bin/biome" }],
  tsc: [{ kind: "js", path: "node_modules/typescript/bin/tsc" }],
  vite: [{ kind: "js", path: "node_modules/vite/bin/vite.js" }],
  turbo: [{ kind: "js", path: "node_modules/turbo/bin/turbo" }],
};

const candidates = toolCandidates[tool];

if (!candidates) {
  console.error(`Unsupported tool: ${tool}`);
  process.exit(1);
}

const resolved = candidates
  .filter(
    (candidate) => !candidate.platform || candidate.platform === process.platform,
  )
  .map((candidate) => ({
    ...candidate,
    absolutePath: path.resolve(repoRoot, candidate.path),
  }))
  .find((candidate) => existsSync(candidate.absolutePath));

if (!resolved) {
  console.error(`Unable to resolve tool binary for ${tool}.`);
  process.exit(1);
}

const extraPathEntries = [
  path.resolve(repoRoot, "scripts"),
  path.resolve(repoRoot, "node_modules/.bin"),
];

const env = {
  ...process.env,
  PATH: `${extraPathEntries.join(path.delimiter)}${path.delimiter}${process.env.PATH ?? ""}`,
};

const command =
  resolved.kind === "js" ? process.execPath : resolved.absolutePath;
const commandArgs =
  resolved.kind === "js"
    ? [
        "--import",
        pathToFileURL(
          path.resolve(import.meta.dirname, "register-workspace-hooks.mjs"),
        ).href,
        resolved.absolutePath,
        ...args,
      ]
    : args;

const child = spawn(command, commandArgs, {
  cwd: process.cwd(),
  stdio: "inherit",
  env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
