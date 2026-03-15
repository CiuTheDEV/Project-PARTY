# Boundary-First Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Usunąć deep importy do `packages/*/src`, ustabilizować toolchain pod publiczne pakiety i zlikwidować oczywistą duplikację runtime wrappera w `apps/web`.

**Architecture:** Implementacja pozostaje mała i lokalna. Pakiety stają się jedynym publicznym wejściem dla współdzielonego kodu, a `apps/web` korzysta z jednego helpera do montowania runtime bez przenoszenia logiki gry do platformy.

**Tech Stack:** TypeScript, React 19, Vite 6, Node test runner, Turbo, Biome.

---

### Task 1: Add failing coverage for public package imports

**Files:**
- Modify: `/home/mateo/projects/project-party/apps/web/src/api/platform.test.mjs`
- Modify: `/home/mateo/projects/project-party/apps/worker/src/http.test.ts`

**Step 1: Write the failing test**
- Add assertions that consume public package exports through the existing module surface.

**Step 2: Run test to verify it fails**
- Run only the touched tests and confirm current imports/resolution are the failure point.

**Step 3: Write minimal implementation**
- Replace deep imports with `@project-party/*` imports and add only the minimal config needed for tests to resolve them.

**Step 4: Run test to verify it passes**
- Re-run touched tests.

### Task 2: Add failing coverage for shared runtime mount helper

**Files:**
- Create: `/home/mateo/projects/project-party/apps/web/src/runtime/mountRuntime.test.mjs`
- Create: `/home/mateo/projects/project-party/apps/web/src/runtime/mountRuntime.ts`
- Modify: `/home/mateo/projects/project-party/apps/web/src/pages/GameLaunchPage.tsx`
- Modify: `/home/mateo/projects/project-party/apps/web/src/pages/ControllerRuntimePage.tsx`

**Step 1: Write the failing test**
- Add a focused test for mounting runtime with storage, transport, and lifecycle cleanup.

**Step 2: Run test to verify it fails**
- Confirm the helper does not exist yet.

**Step 3: Write minimal implementation**
- Add a small helper and wire both pages to use it.

**Step 4: Run test to verify it passes**
- Re-run the new helper test and affected page tests.

### Task 3: Verify package and repo checks

**Files:**
- Modify only if verification exposes real config gaps.

**Step 1: Run package checks**
- `apps/web`: `test`, `typecheck`, `lint`, `build`
- `apps/worker`: `test`, `typecheck`, `lint`
- `games/kalambury`: `test`, `typecheck`, `lint`

**Step 2: Fix only failing integration points**
- Keep fixes minimal and scoped to import resolution or wrapper cleanup.

**Step 3: Re-run verification**
- Confirm fresh green output before reporting completion.
