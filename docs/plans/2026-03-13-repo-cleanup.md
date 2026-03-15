# Repo Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Clean the repository after migration so the active monorepo is easier to navigate, generated artifacts are removed, and docs describe the post-migration state.

**Architecture:** Treat cleanup as a repository-boundary task, not a product refactor. Update only active docs and repo metadata, remove generated artifacts and Windows metadata noise, and keep `_legacy/old-repo` plus historical plans as archive-only references.

**Tech Stack:** Markdown docs, shell cleanup, TypeScript package checks, Biome.

---

### Task 1: Document the final active repo shape

**Files:**
- Modify: `/home/mateo/projects/project-party/README.md`
- Modify: `/home/mateo/projects/project-party/docs/REPO_MAP.md`
- Modify: `/home/mateo/projects/project-party/docs/PROJECT_CONTEXT.md`
- Modify: `/home/mateo/projects/project-party/docs/REPO_ARCHITECTURE.md`

**Step 1: Write the minimal doc updates**

- Replace stale starter/migration framing with final monorepo wording.
- Make `_legacy/old-repo` explicitly archive-only.
- Remove outdated folder references from `docs/REPO_MAP.md`.

**Step 2: Run doc formatting sanity through Biome if needed**

Run:

```bash
'/mnt/c/Program Files/nodejs/node.exe' scripts/run-tool.mjs biome check README.md docs
```

**Step 3: Keep only active guidance in active docs**

- Active docs should point to current folders only.
- Historical plans remain under `docs/plans/`.

### Task 2: Remove generated artifacts and repo noise

**Files:**
- Modify: `/home/mateo/projects/project-party/.gitignore`
- Delete generated directories under repo root and app/package subtrees

**Step 1: Expand ignore rules only where they are missing**

- Ensure repo ignores local caches and generated artifacts such as `output/` and `.npm-cache/`.

**Step 2: Remove generated artifacts**

- Delete:
  - `/home/mateo/projects/project-party/.turbo`
  - `/home/mateo/projects/project-party/output`
  - `/home/mateo/projects/project-party/.npm-cache`
  - `/home/mateo/projects/project-party/apps/web/.turbo`
  - `/home/mateo/projects/project-party/apps/web/dist`
  - `/home/mateo/projects/project-party/apps/worker/.turbo`
  - `/home/mateo/projects/project-party/games/kalambury/.turbo`

**Step 3: Remove `:Zone.Identifier` noise from active repo**

- Delete `*:Zone.Identifier` files outside `_legacy/old-repo`.
- Leave `_legacy/old-repo` untouched.

### Task 3: Verify repo after cleanup

**Files:**
- Test current package checks only; no product code changes required unless cleanup broke imports

**Step 1: Run active checks**

Run:

```bash
'/mnt/c/Program Files/nodejs/node.exe' --test src/*.test.mjs src/platform/*.test.mjs src/api/*.test.mjs
```

in `/home/mateo/projects/project-party/apps/web`

Run:

```bash
'/mnt/c/Program Files/nodejs/node.exe' ../../scripts/run-tool.mjs tsc --noEmit
'/mnt/c/Program Files/nodejs/node.exe' ../../scripts/run-tool.mjs biome check src vite.config.ts
```

in `/home/mateo/projects/project-party/apps/web`

Run:

```bash
'/mnt/c/Program Files/nodejs/node.exe' --test src/*.test.ts src/manifest/*.test.ts src/shared/*.test.ts src/runtime/*.test.ts src/host/*.test.js src/controller/*.test.js
```

in `/home/mateo/projects/project-party/games/kalambury`

Run:

```bash
'/mnt/c/Program Files/nodejs/node.exe' ../../scripts/run-tool.mjs tsc --noEmit
'/mnt/c/Program Files/nodejs/node.exe' ../../scripts/run-tool.mjs biome check .
```

in `/home/mateo/projects/project-party/games/kalambury`

**Step 2: Summarize intentional leftovers**

- `_legacy/old-repo` stays
- PRD and historical plans stay
- `node_modules/` and `.pnpm-store/` remain local dependencies, ignored rather than deleted
