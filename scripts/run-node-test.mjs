import { spawn } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { ensureWorkspacePackageLinks } from "./ensure-workspace-links.mjs";

const preload = pathToFileURL(
  path.resolve(import.meta.dirname, "register-workspace-hooks.mjs"),
).href;
ensureWorkspacePackageLinks();

const child = spawn(
  process.execPath,
  ["--import", preload, "--test", ...process.argv.slice(2)],
  {
  cwd: process.cwd(),
  stdio: "inherit",
  env: process.env,
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
