# Kalambury Presenter Reveal Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Zmienic flow startu tury z dodatkiem prezentera tak, aby host czekal na odkrycie karty na telefonie, telefon pokazywal haslo tylko przez 10 sekund preview, a potem automatycznie przechodzil do aktywnej tury z zakrytym haslem.

**Architecture:** Zmiana zostaje lokalna dla `games/kalambury` i opiera sie na rozszerzeniu istniejacego flow host + controller + `BroadcastChannel` bridge. Zamiast dopinac lokalne flagi do obecnego ekranu, nalezy wprowadzic wyrazny etap `reveal pending` i `reveal preview`, zsynchronizowany eventami host-controller.

**Tech Stack:** React, TypeScript, lokalne CSS, node:test parity tests, lokalny dev bridge `BroadcastChannel`

---

### Task 1: Opisac nowy flow w testach hosta i controllera

**Files:**
- Modify: `games/kalambury/src/host/play-parity.test.js`
- Modify: `games/kalambury/src/shared/presenter-bridge.test.ts`

**Step 1: Write the failing test**

- Dodaj oczekiwania dla:
  - hostowego stanu `czeka na odkrycie`,
  - eventu odkrycia karty przez controller,
  - automatycznego przejscia do preview,
  - automatycznego przejscia do live po preview.

**Step 2: Run test to verify it fails**

Run: `node --test games/kalambury/src/host/play-parity.test.js games/kalambury/src/shared/presenter-bridge.test.ts`

Expected: FAIL, bo obecny flow zaklada od razu wyslane haslo.

**Step 3: Write minimal implementation**

- Tylko tyle scaffoldu testowego, by jasno opisac nowe oczekiwane sceny i eventy.

**Step 4: Run test to verify it fails for the intended reason**

Run: `node --test games/kalambury/src/host/play-parity.test.js games/kalambury/src/shared/presenter-bridge.test.ts`

Expected: FAIL wskazujacy brak nowego flow reveal.

**Step 5: Commit**

```bash
git add games/kalambury/src/host/play-parity.test.js games/kalambury/src/shared/presenter-bridge.test.ts
git commit -m "test: describe presenter reveal flow"
```

### Task 2: Rozszerzyc bridge prezentera o eventy reveal i preview

**Files:**
- Modify: `games/kalambury/src/shared/presenter-bridge.ts`
- Test: `games/kalambury/src/shared/presenter-bridge.test.ts`

**Step 1: Write the failing test**

- Opisz kontrakt eventow:
  - `reveal-requested` / odkrycie karty,
  - start preview,
  - koniec preview,
  - zmiana hasla w preview.

**Step 2: Run test to verify it fails**

Run: `node --test games/kalambury/src/shared/presenter-bridge.test.ts`

Expected: FAIL na brakujacym kontrakcie eventow.

**Step 3: Write minimal implementation**

- Dodaj brakujace eventy i payloady lokalnego bridge.
- Zachowaj obecne zasady jednego aktywnego urzadzenia i reconnectow.

**Step 4: Run test to verify it passes**

Run: `node --test games/kalambury/src/shared/presenter-bridge.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add games/kalambury/src/shared/presenter-bridge.ts games/kalambury/src/shared/presenter-bridge.test.ts
git commit -m "feat: add presenter reveal bridge events"
```

### Task 3: Wprowadzic osobne etapy reveal w hoście

**Files:**
- Modify: `games/kalambury/src/host/PlayScreen.tsx`
- Test: `games/kalambury/src/host/play-parity.test.js`

**Step 1: Write the failing test**

- Dodaj oczekiwania dla dwóch scen hosta:
  - `reveal pending`,
  - `reveal preview` z countdownem 10 s.

**Step 2: Run test to verify it fails**

Run: `node --test games/kalambury/src/host/play-parity.test.js`

Expected: FAIL na obecnym komunikacie `Haslo zostalo wyslane na telefon`.

**Step 3: Write minimal implementation**

- Rozdziel hostowy flow na:
  - oczekiwanie na odkrycie,
  - preview 10 s,
  - wejscie do live.
- Usun z tej sceny reczny przycisk startu jako trigger reveal.

**Step 4: Run test to verify it passes**

Run: `node --test games/kalambury/src/host/play-parity.test.js`

Expected: PASS

**Step 5: Commit**

```bash
git add games/kalambury/src/host/PlayScreen.tsx games/kalambury/src/host/play-parity.test.js
git commit -m "feat: add host presenter reveal stages"
```

### Task 4: Przebudowac ekran telefonu prezentera

**Files:**
- Modify: `games/kalambury/src/controller/ControllerApp.tsx`
- Modify: `games/kalambury/src/styles.css`
- Test: `games/kalambury/src/host/styles-parity.test.js`

**Step 1: Write the failing test**

- Dodaj oczekiwania dla stanów telefonu:
  - rewers karty przed odkryciem,
  - odkryta karta w preview,
  - zakryta karta po przejsciu do live.

**Step 2: Run test to verify it fails**

Run: `node --test games/kalambury/src/host/styles-parity.test.js`

Expected: FAIL na brakujacych klasach i layoutach reveal card.

**Step 3: Write minimal implementation**

- Zaimplementuj:
  - rewers karty i CTA `Odkryj haslo`,
  - front karty z haslem, kategoria i `Zmien haslo` w preview,
  - automatyczne zakrycie po przejsciu do live.

**Step 4: Run test to verify it passes**

Run: `node --test games/kalambury/src/host/styles-parity.test.js`

Expected: PASS

**Step 5: Commit**

```bash
git add games/kalambury/src/controller/ControllerApp.tsx games/kalambury/src/styles.css games/kalambury/src/host/styles-parity.test.js
git commit -m "feat: rebuild presenter phone reveal card"
```

### Task 5: Spiac preview timer 10 s i blokade podgladu po czasie

**Files:**
- Modify: `games/kalambury/src/host/PlayScreen.tsx`
- Modify: `games/kalambury/src/controller/ControllerApp.tsx`
- Modify: `games/kalambury/src/shared/presenter-bridge.ts`
- Test: `games/kalambury/src/host/play-parity.test.js`
- Test: `games/kalambury/src/shared/presenter-bridge.test.ts`

**Step 1: Write the failing test**

- Opisz, ze po 10 s:
  - host przechodzi do live,
  - controller traci podglad hasla,
  - `Zmien haslo` przestaje byc dostepne.

**Step 2: Run test to verify it fails**

Run: `node --test games/kalambury/src/host/play-parity.test.js games/kalambury/src/shared/presenter-bridge.test.ts`

Expected: FAIL na brakujacym auto-przejsciu i ukryciu hasla.

**Step 3: Write minimal implementation**

- Dodaj sztywny preview timer 10 s.
- Po jego zakonczeniu zsynchronizuj host i controller do stanu live.

**Step 4: Run test to verify it passes**

Run: `node --test games/kalambury/src/host/play-parity.test.js games/kalambury/src/shared/presenter-bridge.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add games/kalambury/src/host/PlayScreen.tsx games/kalambury/src/controller/ControllerApp.tsx games/kalambury/src/shared/presenter-bridge.ts games/kalambury/src/host/play-parity.test.js games/kalambury/src/shared/presenter-bridge.test.ts
git commit -m "feat: lock presenter preview to 10 seconds"
```

### Task 6: Zweryfikowac caly flow lokalnie

**Files:**
- Verify only: `games/kalambury/src/**`

**Step 1: Run focused tests**

Run: `node --test games/kalambury/src/host/play-parity.test.js games/kalambury/src/shared/presenter-bridge.test.ts games/kalambury/src/host/styles-parity.test.js`

Expected: PASS

**Step 2: Run typecheck**

Run: `npm run typecheck -- --filter=@project-party/game-kalambury`

Expected: PASS

**Step 3: Manual smoke check**

Run local app and verify:
- host czeka na odkrycie karty,
- telefon pokazuje rewers,
- odkrycie na telefonie przeprowadza host do preview,
- preview trwa 10 s,
- po 10 s telefon znow zakrywa karte,
- host przechodzi do aktywnej tury.

Expected: flow jest zsynchronizowany i nie ujawnia hasla poza preview.

**Step 4: Commit**

```bash
git add games/kalambury/src
git commit -m "feat: add presenter reveal flow"
```
