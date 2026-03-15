# Kalambury Verdict Grid Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the scrollable verdict player list with a compact grid that fits up to 12 players without scrolling.

**Architecture:** Keep the verdict state and scoring logic in `PlayScreen.tsx`, but change only the presentation of selectable players. The footer stays as the action bar owner; the verdict content becomes a grid of compact choice cards with avatar, name, and active state only.

**Tech Stack:** React, TypeScript, local module CSS, Node test runner

---

### Task 1: Lock the desired verdict anatomy in tests

**Files:**
- Modify: `games/kalambury/src/host/play-parity.test.js`
- Optional: `games/kalambury/src/host/styles-parity.test.js`

**Step 1: Write the failing test**

Assert that the verdict screen source contains a dedicated grid wrapper and compact verdict choice anatomy without score text on the player cards.

**Step 2: Run test to verify it fails**

Run: `node --test games/kalambury/src/host/play-parity.test.js`

Expected: FAIL because the new verdict grid markers do not exist yet.

**Step 3: Write minimal implementation markers**

Update the verdict render tree to include:
- a grid wrapper for verdict candidates,
- compact selectable verdict cards,
- no score label in the selectable card body.

**Step 4: Run test to verify it passes**

Run: `node --test games/kalambury/src/host/play-parity.test.js`

Expected: PASS

**Step 5: Commit**

```bash
git add games/kalambury/src/host/play-parity.test.js games/kalambury/src/host/PlayScreen.tsx
git commit -m "test: lock verdict grid anatomy"
```

### Task 2: Convert verdict player list into a no-scroll grid

**Files:**
- Modify: `games/kalambury/src/host/PlayScreen.tsx`
- Modify: `games/kalambury/src/styles.css`

**Step 1: Write the failing test**

If needed, extend parity coverage to assert the new class names for:
- verdict grid container,
- verdict choice card,
- active selected state.

**Step 2: Run test to verify it fails**

Run: `node --test games/kalambury/src/host/play-parity.test.js`

Expected: FAIL on the new structure assertions.

**Step 3: Write minimal implementation**

In `PlayScreen.tsx`:
- replace the current vertical verdict candidate list with a compact grid.
- keep avatar + name only inside each selectable card.
- preserve selected guesser behavior.

In `styles.css`:
- define a responsive grid that fits up to 12 players without internal scrolling,
- reduce card height and padding,
- keep active state visually obvious,
- ensure the verdict shell itself stays visually aligned with the rest of the play stages.

**Step 4: Run test to verify it passes**

Run: `node --test games/kalambury/src/host/play-parity.test.js`

Expected: PASS

**Step 5: Commit**

```bash
git add games/kalambury/src/host/PlayScreen.tsx games/kalambury/src/styles.css games/kalambury/src/host/play-parity.test.js
git commit -m "feat: redesign verdict selection as grid"
```

### Task 3: Verify layout safety and typecheck

**Files:**
- Verify only

**Step 1: Run targeted tests**

Run: `node --test games/kalambury/src/host/play-parity.test.js games/kalambury/src/host/styles-parity.test.js`

Expected: PASS

**Step 2: Run package typecheck**

Run: `npm run typecheck -- --filter=@project-party/game-kalambury`

Expected: PASS

**Step 3: Smoke-check in browser**

Check verdict with:
- small roster,
- medium roster,
- 12 players.

Expected:
- no scroll needed to find a player,
- active selected card clearly visible,
- footer still aligned correctly.

**Step 4: Commit**

```bash
git add games/kalambury/src/host/PlayScreen.tsx games/kalambury/src/styles.css games/kalambury/src/host/play-parity.test.js games/kalambury/src/host/styles-parity.test.js
git commit -m "chore: verify verdict grid layout"
```
