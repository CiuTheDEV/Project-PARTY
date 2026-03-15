import path from "node:path";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";

const repoRoot = path.resolve(import.meta.dirname, "..");

const workspaceEntrypoints = new Map([
  ["@project-party/design-system", "packages/design-system/src/index.ts"],
  ["@project-party/game-kalambury", "games/kalambury/src/index.ts"],
  ["@project-party/game-runtime", "packages/game-runtime/src/index.ts"],
  ["@project-party/game-sdk", "packages/game-sdk/src/index.ts"],
  ["@project-party/shared", "packages/shared/src/index.ts"],
  ["@project-party/types", "packages/types/src/index.ts"],
  ["@project-party/ui", "packages/ui/src/index.tsx"],
]);

registerHooks({
  resolve(specifier, context, nextResolve) {
    const entrypoint = workspaceEntrypoints.get(specifier);

    if (!entrypoint) {
      return nextResolve(specifier, context);
    }

    return {
      shortCircuit: true,
      url: pathToFileURL(path.resolve(repoRoot, entrypoint)).href,
    };
  },
});
