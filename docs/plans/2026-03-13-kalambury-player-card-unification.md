# Kalambury Player Card Unification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ujednolicic wszystkie karty graczy w module Kalambury do jednego wspolnego wzorca wizualnego i layoutowego.

**Architecture:** Zmiana zostaje calkowicie lokalna dla `games/kalambury`. Wspolny pattern kart powstaje jako lokalny zestaw klas CSS i lekkie, lokalne dopasowania JSX w ekranach hosta zamiast przenoszenia semantyki do platformy lub `packages/*`.

**Tech Stack:** React, TypeScript, lokalne CSS, node:test parity tests

---

### Task 1: Zinwentaryzowac miejsca z kartami graczy i dodac czerwone testy parity

**Files:**
- Modify: `games/kalambury/src/host/play-parity.test.js`
- Modify: `games/kalambury/src/host/setup-parity.test.js`
- Modify: `games/kalambury/src/host/styles-parity.test.js`

**Step 1: Write the failing test**

- Dolicz asercje dla wspolnego patternu kart graczy.
- Upewnij sie, ze test pilnuje:
  - badge kolejnosci tylko w `order`,
  - wspolny nameplate pattern,
  - wspolne klasy/layout dla kart w pozostalych ekranach.

**Step 2: Run test to verify it fails**

Run: `node --test games/kalambury/src/host/play-parity.test.js games/kalambury/src/host/setup-parity.test.js games/kalambury/src/host/styles-parity.test.js`

Expected: FAIL na brakujacych wspolnych klasach/wzorcu.

**Step 3: Write minimal implementation**

- Jeszcze bez pelnego polishu, tylko tyle test scaffoldu, by opisac oczekiwany rezultat.

**Step 4: Run test to verify it passes or still fails for the intended reason**

Run: `node --test games/kalambury/src/host/play-parity.test.js games/kalambury/src/host/setup-parity.test.js games/kalambury/src/host/styles-parity.test.js`

Expected: Red tests wskazuja tylko brak wdrozenia wzorca.

**Step 5: Commit**

```bash
git add games/kalambury/src/host/play-parity.test.js games/kalambury/src/host/setup-parity.test.js games/kalambury/src/host/styles-parity.test.js
git commit -m "test: describe unified kalambury player cards"
```

### Task 2: Wyciagnac wspolny visual pattern kart graczy w CSS

**Files:**
- Modify: `games/kalambury/src/styles.css`

**Step 1: Write the failing test**

- Upewnij sie, ze parity testy oczekuja bazowego patternu kart oraz wariantow `order`, `setup`, `interactive`, `summary`.

**Step 2: Run test to verify it fails**

Run: `node --test games/kalambury/src/host/styles-parity.test.js`

Expected: FAIL na brakujacych wspolnych klasach.

**Step 3: Write minimal implementation**

- Dodaj wspolne lokalne klasy pod anatomie: shell, avatar, nameplate, optional badge.
- Przepnij obecne reguly `order`, `presenter`, `verdict`, `summary`, `setup` tak, by dziedziczyly po wspolnym wzorcu.
- Zachowaj roznice wielkosci przez modyfikatory.

**Step 4: Run test to verify it passes**

Run: `node --test games/kalambury/src/host/styles-parity.test.js`

Expected: PASS

**Step 5: Commit**

```bash
git add games/kalambury/src/styles.css games/kalambury/src/host/styles-parity.test.js
git commit -m "feat: unify kalambury player card styles"
```

### Task 3: Przepiac gameplay hosta na wspolny pattern

**Files:**
- Modify: `games/kalambury/src/host/PlayScreen.tsx`
- Modify: `games/kalambury/src/host/play-parity.test.js`

**Step 1: Write the failing test**

- Dopisz oczekiwania dla:
  - `order` cards,
  - presenter card,
  - guesser cards,
  - summary ranks.

**Step 2: Run test to verify it fails**

Run: `node --test games/kalambury/src/host/play-parity.test.js`

Expected: FAIL na brakujacym wspolnym JSX/class structure.

**Step 3: Write minimal implementation**

- Ujednolic markup kart graczy w `PlayScreen.tsx`.
- Zostaw badge numeru tylko dla `order`.
- Zachowaj wszystkie obecne akcje i stany.

**Step 4: Run test to verify it passes**

Run: `node --test games/kalambury/src/host/play-parity.test.js`

Expected: PASS

**Step 5: Commit**

```bash
git add games/kalambury/src/host/PlayScreen.tsx games/kalambury/src/host/play-parity.test.js
git commit -m "feat: unify kalambury gameplay player cards"
```

### Task 4: Przepiac setup na wspolny pattern

**Files:**
- Modify: `games/kalambury/src/host/setup-sections.tsx`
- Modify: `games/kalambury/src/host/setup-parity.test.js`

**Step 1: Write the failing test**

- Dodaj oczekiwania dla wspolnego layoutu kart graczy w setupie.

**Step 2: Run test to verify it fails**

Run: `node --test games/kalambury/src/host/setup-parity.test.js`

Expected: FAIL na starym układzie setup cards.

**Step 3: Write minimal implementation**

- Zmien markup setup cards tak, by wpisywal sie w ten sam player-card pattern.
- Zachowaj akcje edycji/usuwania i limity graczy.

**Step 4: Run test to verify it passes**

Run: `node --test games/kalambury/src/host/setup-parity.test.js`

Expected: PASS

**Step 5: Commit**

```bash
git add games/kalambury/src/host/setup-sections.tsx games/kalambury/src/host/setup-parity.test.js
git commit -m "feat: unify kalambury setup player cards"
```

### Task 5: Zweryfikowac modul i zamknac scope

**Files:**
- Verify only: `games/kalambury/src/**`

**Step 1: Run focused tests**

Run: `node --test games/kalambury/src/host/play-parity.test.js games/kalambury/src/host/setup-parity.test.js games/kalambury/src/host/styles-parity.test.js`

Expected: PASS

**Step 2: Run typecheck**

Run: `npm run typecheck -- --filter=@project-party/game-kalambury`

Expected: PASS

**Step 3: Manual smoke check**

Run local app and verify:
- setup players
- order/draw cards
- presenter card
- verdict/guesser cards
- summary ranks

Expected: wszystkie karty wygladaja jak jedna rodzina komponentow.

**Step 4: Commit**

```bash
git add games/kalambury/src
git commit -m "feat: unify kalambury player card language"
```
