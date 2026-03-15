# Kalambury Controller Minimal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the presenter phone screen into a minimal card-first layout focused on the current presenter, status badge, and card actions.

**Architecture:** Keep controller state and bridge behavior intact in `ControllerApp.tsx`, but replace the inline heavy UI shell with a minimal layout. Prefer shared module styling in `styles.css` over a large inline-style-only screen so the landscape-first layout remains maintainable.

**Tech Stack:** React, TypeScript, local CSS, Node test runner

---

### Task 1: Lock the minimal controller anatomy in tests

**Files:**
- Modify: `games/kalambury/src/controller/controller-parity.test.js`

**Step 1: Write the failing test**

Assert that the controller still contains:
- `PREZENTUJE`,
- status labels,
- `Odkryj karte`,
- `Zmien haslo`,

and no longer contains:
- `Kod sesji`,
- `Telefon prezentera`.

**Step 2: Run test to verify it fails**

Run: `node --test games/kalambury/src/controller/controller-parity.test.js`

Expected: FAIL because the old UI still includes removed chrome.

**Step 3: Write minimal implementation markers**

Update the controller markup to reflect the new anatomy and remove the old strings.

**Step 4: Run test to verify it passes**

Run: `node --test games/kalambury/src/controller/controller-parity.test.js`

Expected: PASS

**Step 5: Commit**

```bash
git add games/kalambury/src/controller/controller-parity.test.js games/kalambury/src/controller/ControllerApp.tsx
git commit -m "test: lock minimal controller anatomy"
```

### Task 2: Rebuild the controller layout around the presenter card

**Files:**
- Modify: `games/kalambury/src/controller/ControllerApp.tsx`
- Modify: `games/kalambury/src/styles.css`

**Step 1: Write the failing test**

Extend parity assertions if needed for the new class names that describe:
- controller shell,
- presenter heading,
- status badge,
- card-first layout.

**Step 2: Run test to verify it fails**

Run: `node --test games/kalambury/src/controller/controller-parity.test.js`

Expected: FAIL on the new layout markers.

**Step 3: Write minimal implementation**

In `ControllerApp.tsx`:
- remove session code UI and oversized header chrome,
- render `PREZENTUJE` + player name,
- keep a small status badge,
- render a dominant presenter card,
- keep `Odkryj karte` only in pending state,
- keep `Zmien haslo` only in preview,
- keep a simple rejected fallback.

In `styles.css`:
- add controller-specific classes,
- make landscape the preferred composition,
- add responsive single-column fallback for portrait.

**Step 4: Run test to verify it passes**

Run: `node --test games/kalambury/src/controller/controller-parity.test.js`

Expected: PASS

**Step 5: Commit**

```bash
git add games/kalambury/src/controller/ControllerApp.tsx games/kalambury/src/styles.css games/kalambury/src/controller/controller-parity.test.js
git commit -m "feat: simplify presenter phone layout"
```

### Task 3: Verify controller behavior stays intact

**Files:**
- Verify only

**Step 1: Run targeted tests**

Run: `node --test games/kalambury/src/controller/controller-parity.test.js games/kalambury/src/host/play-parity.test.js games/kalambury/src/shared/presenter-bridge.test.ts`

Expected: PASS

**Step 2: Run package typecheck**

Run: `npm run typecheck -- --filter=@project-party/game-kalambury`

Expected: PASS

**Step 3: Smoke-check both orientations**

Check:
- horizontal phone viewport,
- vertical phone viewport.

Expected:
- hierarchy remains clear in both,
- no code session UI remains,
- card is the dominant element,
- reveal flow still works.

**Step 4: Commit**

```bash
git add games/kalambury/src/controller/ControllerApp.tsx games/kalambury/src/styles.css games/kalambury/src/controller/controller-parity.test.js
git commit -m "chore: verify minimal controller layout"
```
