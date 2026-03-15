import assert from "node:assert/strict";
import { mkdtempSync, readlinkSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { ensureWorkspacePackageLinks } from "../scripts/ensure-workspace-links.mjs";

test("ensureWorkspacePackageLinks uses junctions on Windows", () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "project-party-links-"));
  const repoRoot = path.join(tempRoot, "repo");
  const workspaceRoot = "apps/web";
  const packageTarget = "packages/design-system";

  ensureWorkspacePackageLinks({
    repoRoot,
    workspaceRoots: [workspaceRoot],
    workspacePackages: [["@project-party/design-system", packageTarget]],
  });

  const linkPath = path.join(
    repoRoot,
    workspaceRoot,
    "node_modules",
    "@project-party",
    "design-system",
  );

  assert.equal(readlinkSync(linkPath), path.resolve(repoRoot, packageTarget));
});
