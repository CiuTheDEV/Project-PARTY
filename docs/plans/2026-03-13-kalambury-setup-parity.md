# Kalambury Setup Parity Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring the Kalambury setup flow in the new monorepo to 1:1 product parity with the legacy setup screen while keeping all game-specific logic inside `games/kalambury`.

**Architecture:** Keep the runtime boundary unchanged: `apps/web` launches the game module, while `games/kalambury` owns setup UI, setup persistence, and start-round payload creation. Port only the legacy setup UI structure, interactions, and copy that still differ; do not move any game logic back to platform code.

**Tech Stack:** React, TypeScript, Vite, Turbo, Biome, node:test

---

### Task 1: Lock in parity gaps with failing tests

**Files:**
- Create/Modify: `/home/mateo/projects/project-party/games/kalambury/src/host/setup-parity.test.tsx`
- Test: `/home/mateo/projects/project-party/games/kalambury/src/host/setup-parity.test.tsx`

**Step 1: Write the failing test**
- Add assertions for legacy-visible setup behaviors and markers that are still missing or simplified in the current module:
  - player action toggle renders legacy icon-style controls instead of textual placeholders
  - add-player modal exposes gender chips and avatar picker labels in the same shape as legacy
  - embedded setup footer keeps the single-action variant while non-embedded keeps the back action

**Step 2: Run test to verify it fails**
- Run: `node ./scripts/run-tool.mjs turbo run test --filter=@project-party/game-kalambury --continue=never`

**Step 3: Write minimal implementation**
- Update only `SetupScreen`, `setup-sections`, and `setup-modals` until the new tests pass.

**Step 4: Run test to verify it passes**
- Re-run the targeted game tests and confirm green.

### Task 2: Port setup sections to legacy parity

**Files:**
- Modify: `/home/mateo/projects/project-party/games/kalambury/src/host/setup-sections.tsx`
- Reference: `/home/mateo/projects/project-party/_legacy/old-repo/Project-Party/.worktrees/lobby-frontend/apps/web/src/pages/kalambury-setup-sections.tsx`

**Step 1: Match player card interactions**
- Restore legacy-like action toggles and action buttons for edit/remove.

**Step 2: Match footer ownership**
- Keep embedded/non-embedded footer behavior equivalent to legacy without reintroducing route ownership into `apps/web`.

**Step 3: Verify**
- Re-run targeted tests for setup behavior.

### Task 3: Port setup modals to legacy parity

**Files:**
- Modify: `/home/mateo/projects/project-party/games/kalambury/src/host/setup-modals.tsx`
- Reference: `/home/mateo/projects/project-party/_legacy/old-repo/Project-Party/.worktrees/lobby-frontend/apps/web/src/pages/kalambury-setup-modals.tsx`

**Step 1: Match add-player modal**
- Restore legacy iconography and control layout for gender and avatar selection.

**Step 2: Match mode settings modal**
- Keep current runtime-safe dialog handling, but align visible controls and copy with legacy.

**Step 3: Verify**
- Re-run targeted tests and lint/typecheck.

### Task 4: Port top-level setup screen parity and validate in app

**Files:**
- Modify: `/home/mateo/projects/project-party/games/kalambury/src/host/SetupScreen.tsx`
- Reference: `/home/mateo/projects/project-party/_legacy/old-repo/Project-Party/.worktrees/lobby-frontend/apps/web/src/pages/GameSetupPage.tsx`

**Step 1: Align screen-level copy and feedback**
- Bring visible headers, close button, and feedback flow into parity without changing start-round payload semantics.

**Step 2: Verify in module + app**
- Run:
  - `node ./scripts/run-tool.mjs turbo run lint --filter=@project-party/game-kalambury --continue=never`
  - `node ./scripts/run-tool.mjs turbo run typecheck --filter=@project-party/game-kalambury --continue=never`
  - `node ./scripts/run-tool.mjs turbo run test --filter=@project-party/game-kalambury --continue=never`
- Smoke check through `apps/web` dev server on the active port.
