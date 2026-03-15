import {
  existsSync,
  lstatSync,
  mkdirSync,
  readlinkSync,
  symlinkSync,
  unlinkSync,
} from "node:fs";
import path from "node:path";

const defaultRepoRoot = path.resolve(import.meta.dirname, "..");

const defaultWorkspacePackages = [
  ["@project-party/design-system", "packages/design-system"],
  ["@project-party/game-kalambury", "games/kalambury"],
  ["@project-party/game-tajniacy", "games/tajniacy"],
  ["@project-party/game-runtime", "packages/game-runtime"],
  ["@project-party/game-sdk", "packages/game-sdk"],
  ["@project-party/shared", "packages/shared"],
  ["@project-party/types", "packages/types"],
  ["@project-party/ui", "packages/ui"],
];

const defaultWorkspaceRoots = [
  "apps/web",
  "apps/worker",
  "games/kalambury",
  "games/tajniacy",
  "packages/design-system",
  "packages/game-runtime",
  "packages/game-sdk",
  "packages/shared",
  "packages/types",
  "packages/ui",
];

export function ensureWorkspacePackageLinks({
  repoRoot = defaultRepoRoot,
  workspacePackages = defaultWorkspacePackages,
  workspaceRoots = defaultWorkspaceRoots,
} = {}) {
  const linkType = process.platform === "win32" ? "junction" : "dir";

  for (const workspaceRoot of workspaceRoots) {
    const scopeDir = path.resolve(
      repoRoot,
      workspaceRoot,
      "node_modules/@project-party",
    );
    mkdirSync(scopeDir, { recursive: true });

    for (const [packageName, relativeTarget] of workspacePackages) {
      const packageDirName = packageName.split("/")[1];
      const targetPath = path.resolve(repoRoot, relativeTarget);
      const linkPath = path.resolve(scopeDir, packageDirName);
      const linkTarget =
        linkType === "junction"
          ? targetPath
          : path.relative(path.dirname(linkPath), targetPath);

      if (!existsSync(linkPath)) {
        try {
          symlinkSync(linkTarget, linkPath, linkType);
        } catch (error) {
          if (
            !(error instanceof Error) ||
            !("code" in error) ||
            error.code !== "EEXIST"
          ) {
            throw error;
          }
        }
        continue;
      }

      const stats = lstatSync(linkPath);
      if (!stats.isSymbolicLink()) {
        continue;
      }

      if (readlinkSync(linkPath) !== linkTarget) {
        unlinkSync(linkPath);
        symlinkSync(linkTarget, linkPath, linkType);
      }
    }
  }
}
