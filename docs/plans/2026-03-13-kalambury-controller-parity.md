# Kalambury Controller Parity Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the generic Kalambury phone/controller placeholder with a presenter-phone screen that matches the actual legacy maturity level and visual language of Kalambury, without inventing full multi-device gameplay beyond legacy.

**Architecture:** Keep controller ownership fully inside `games/kalambury`. `apps/web` continues to launch the module through the runtime contract and does not learn any Kalambury-specific phone logic. The controller screen may use existing session metadata and migrated Kalambury assets, but must not require new worker/runtime contracts for this slice.

**Tech Stack:** React, TypeScript, Vite, Turbo, Biome, node:test

---

### Task 1: Lock in placeholder gaps with failing tests

**Files:**
- Modify: `/home/mateo/projects/project-party/games/kalambury/package.json`
- Create: `/home/mateo/projects/project-party/games/kalambury/src/controller/controller-parity.test.js`
- Reference: `/home/mateo/projects/project-party/games/kalambury/src/controller/ControllerApp.tsx`

**Step 1: Write the failing test**
- Assert that the controller screen is no longer allowed to contain generic migration copy such as “kolejne iteracje realtime”.
- Assert that the controller source exposes Kalambury-specific presenter-phone copy, brand markers, and session code UI.

**Step 2: Run test to verify it fails**
- Run: `node ./scripts/run-tool.mjs turbo run test --filter=@project-party/game-kalambury --continue=never`

**Step 3: Write minimal implementation**
- Update only the controller module and, if needed, the game asset folder.

**Step 4: Run test to verify it passes**
- Re-run targeted game tests and confirm green.

### Task 2: Port the controller shell into Kalambury

**Files:**
- Modify: `/home/mateo/projects/project-party/games/kalambury/src/controller/ControllerApp.tsx`
- Create/Migrate: `/home/mateo/projects/project-party/games/kalambury/src/assets/kalambury-classic-performer.png`
- Reference: `/home/mateo/projects/project-party/_legacy/old-repo/Project-Party/.worktrees/lobby-frontend/apps/web/public/art/kalambury-classic-performer.png`

**Step 1: Replace generic copy**
- Remove product-internal wording and replace it with presenter-phone wording consistent with legacy setup/play messaging.

**Step 2: Match Kalambury visual language**
- Reuse existing Kalambury colors, typography, and branding.
- Prefer an existing migrated asset over creating a new visual.

**Step 3: Keep contract unchanged**
- Do not require additional worker fields or transport events for this slice.

### Task 3: Verify runtime integration stays clean

**Files:**
- Reference only unless required: `/home/mateo/projects/project-party/games/kalambury/src/runtime/createRuntime.ts`
- Reference only unless required: `/home/mateo/projects/project-party/apps/web/src/pages/ControllerRuntimePage.tsx`

**Step 1: Confirm integration assumptions**
- Controller still mounts from the game runtime for `controller` and `player` roles.
- No Kalambury-specific logic leaks into `apps/web`.

**Step 2: Verify**
- Run:
  - `node ./scripts/run-tool.mjs turbo run lint --filter=@project-party/game-kalambury --continue=never`
  - `node ./scripts/run-tool.mjs turbo run typecheck --filter=@project-party/game-kalambury --continue=never`
  - `node ./scripts/run-tool.mjs turbo run test --filter=@project-party/game-kalambury --continue=never`
- Smoke check through the active dev server port.
