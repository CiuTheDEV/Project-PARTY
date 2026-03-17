# Kalambury Refactor Design

**Date:** 2026-03-17
**Status:** Approved
**Goal:** Doprowadzić Kalambury do stanu "wzorcowego modułu gry" — czytelnego dla agentów i developerów, stabilnego przed dodaniem Tajniaków.

---

## Zakres

### W scope

- Podział gigantycznych plików (PlayScreen, setup-modals, setup-sections)
- Eliminacja duplikacji w presenter bridge (`createPresenterChannel`, `resolveBroadcastChannel`, `getChannelName`)
- Przeniesienie `PRESENTER_REVEAL_PREVIEW_SECONDS` do `settings/constants.ts`
- Uzupełnienie testów (state machine edge cases, firebase error handling, channel-utils)
- Drobne fixe edge case'ów (firebase error handling, setup-storage edge cases)
- Aktualizacja parity testów po podziale plików (w tym samym commicie co podział)

### Poza scope

- Nowe funkcjonalności gry
- Zmiany w platformie (`apps/web`, `apps/worker`)
- Zmiany w kontrakcie runtime
- React component testy (brak testing-library w stacku)
- E2E Playwright

---

## Struktura plików po refaktorze

```
games/kalambury/src/
├── runtime/
│   ├── createRuntime.ts          (bez zmian)
│   └── state-machine.ts          (bez zmian)
├── transport/                    (bez zmian)
├── shared/
│   ├── presenter/
│   │   ├── channel-utils.ts      (NOWY — resolveBroadcastChannel, createPresenterChannel, getChannelName)
│   │   ├── host-bridge.ts        (usunięta duplikacja, importuje z channel-utils)
│   │   ├── controller-bridge.ts  (usunięta duplikacja, importuje z channel-utils)
│   │   └── types.ts              (bez zmian)
│   ├── setup-content.ts          (bez zmian)
│   ├── setup-storage.ts          (bez zmian)
│   └── setup-ui.ts               (bez zmian)
├── host/
│   ├── HostApp.tsx               (bez zmian)
│   ├── ConnectionModePanel.tsx   (bez zmian — standalone, nie importuje z setup-modals ani setup-sections)
│   ├── SetupScreen.tsx           (aktualizacja importów z nowych katalogów modals/ i sections/)
│   ├── PlayScreen.tsx            (odchudzone — orkiestracja; aktualizacja importów)
│   ├── components/
│   │   ├── DrawSequence.tsx      (NOWY — animacja losowania + KOLEJNOSC rendering)
│   │   ├── PreparePhase.tsx      (NOWY — stage PRZYGOTOWANIE)
│   │   ├── ActPhase.tsx          (NOWY — stage ACT)
│   │   ├── ScorePhase.tsx        (NOWY — stage SCORE)
│   │   └── FinishedPhase.tsx     (NOWY — stage FINISHED)
│   ├── modals/
│   │   ├── ModeSettingsModal.tsx (wyciągnięty z setup-modals.tsx)
│   │   ├── AddPlayerModal.tsx    (wyciągnięty z setup-modals.tsx)
│   │   └── PresenterQrModal.tsx  (wyciągnięty z setup-modals.tsx)
│   ├── sections/
│   │   ├── PlayersPanel.tsx      (wyciągnięty z setup-sections.tsx)
│   │   ├── ModeSummaryPanel.tsx  (wyciągnięty z setup-sections.tsx)
│   │   ├── PresenterDevicePanel.tsx (wyciągnięty z setup-sections.tsx)
│   │   ├── CategoriesPanel.tsx   (wyciągnięty z setup-sections.tsx)
│   │   └── SetupFooter.tsx       (wyciągnięty z setup-sections.tsx)
│   ├── hooks/
│   │   └── usePresenterHostBridge.ts (bez zmian)
│   ├── play-parity.test.js       (zaktualizowany — patrz sekcja Parity testy)
│   ├── setup-parity.test.js      (zaktualizowany — patrz sekcja Parity testy)
│   └── styles-parity.test.js     (bez zmian — czyta ../styles.css, lokalizacja nie zmienia się)
├── controller/
│   └── ControllerApp.tsx         (bez zmian — 249L, OK)
└── settings/
    └── constants.ts              (NOWY)
```

**Pliki usuwane:**
- `host/setup-modals.tsx` — USUNIĘTY w kroku 3 (bez barrel re-exportu)
- `host/setup-sections.tsx` — USUNIĘTY w kroku 4 (bez barrel re-exportu)

---

## Zasady podziału

- `PlayScreen.tsx` staje się orkiestratorem — trzyma state, przekazuje props w dół, nie renderuje żadnej fazy samodzielnie
- Każdy komponent fazy (PreparePhase, ActPhase, ScorePhase, FinishedPhase) dostaje tylko to co potrzebuje przez props
- `DrawSequence.tsx` jest self-contained — zarządza stanem animacji lokalnie (drawSequenceCards, drawAnimationPhase, drawSequenceBounds, drawRouletteStep, currentDrawRevealIndex, activeDrawCardId), dostaje `players` i callbacks (`onComplete`)
- `getStageLabel` (funkcja zwracająca etykiety LOSOWANIE/PRZYGOTOWANIE/PREZENTOWANIE/WERDYKT/PODSUMOWANIE) zostaje w `PlayScreen.tsx` — używana przez topbar który jest w orkiestratorze
- Stare pliki `setup-modals.tsx` i `setup-sections.tsx` są **usuwane** w tym samym commicie co podział
- Callery (`SetupScreen.tsx`, `PlayScreen.tsx`) aktualizują importy w tym samym kroku
- Żaden komponent `host/` nie importuje z sibling `host/` komponentu (tylko z `shared/`, `runtime/`, `settings/`, własnych podkatalogów)

---

## Co trafia do `settings/constants.ts`

Tylko jedna wartość w tym cyklu:
```ts
export const PRESENTER_REVEAL_PREVIEW_SECONDS = 10;
```

`drawAnimationDurations` i `confettiPieces` pozostają lokalnie w `DrawSequence.tsx` — to animation tuning, nie konfiguracja gry.

Pozostałe stałe numeryczne w `PlayScreen.tsx` (np. `PING_INTERVAL_MS`, timeouty w bridge) nie trafiają do `constants.ts` — należą do bridge'a lub są już w osobnych modułach.

---

## Parity testy — pełne mapowanie

### `play-parity.test.js` (aktualizacja w kroku 5)

Test czyta jeden plik przez `readFileSync`. Po podziale test będzie czytać **wiele plików**. Dla każdego testu wskazujemy nowe źródło:

**Test 1: "play screen pauses presenter stages..."**
Źródło: `PlayScreen.tsx` (bez zmian)
- `KalamburyPresenterQrModal` — import zostaje w PlayScreen
- `presenterReconnectRequired` — orkiestracja zostaje w PlayScreen
- `"Gra wstrzymana do czasu ponownego podlaczenia urzadzenia prezentera"` → przenosi się do `PreparePhase.tsx`; test czyta PreparePhase dla tej asserti

**Test 2: "play screen models presenter reveal as pending and preview stages..."**
Źródło: `PreparePhase.tsx`
- `presenterRevealStage` → PreparePhase
- `"Karta czeka na odkrycie na telefonie"` → PreparePhase
- `"Prezenter zapoznaje sie z haslem"` → PreparePhase
- `includes("10")` → zastąpić: `preparePhaseSource.includes("PRESENTER_REVEAL_PREVIEW_SECONDS")` (assert true w PreparePhase) — bardziej precyzyjne niż szukanie `"10"`
- `"kalambury-prepare-presenter-column"` → PreparePhase
- `"kalambury-host-status--prepare"` → PreparePhase
- `"kalambury-play__timer--prepare"` → PreparePhase
- `"kalambury-host-status--prepare-preview"` → PreparePhase
- `"kalambury-host-status__copy--prepare"` → PreparePhase

**Test 3: "play screen marks odd two-column turn orders..."**
Źródło: `DrawSequence.tsx`
- `'"kalambury-order-grid kalambury-order-grid--orphan"'` → DrawSequence

**Test 4: "play screen uses one shared player card anatomy across gameplay variants"**
Źródła: `PreparePhase.tsx`, `ActPhase.tsx`, `DrawSequence.tsx`
- `"kalambury-persona-card"` — obecne w wielu plikach; assert w PreparePhase (pewne)
- `"kalambury-persona-card__avatar"` → PreparePhase
- `"kalambury-persona-card__nameplate"` → PreparePhase
- `"kalambury-persona-card__badge"` → ActPhase (badge na karcie aktywnego gracza)
- `"data-gender={presenter.gender}"` → PreparePhase
- `"data-gender={player.gender}"` → DrawSequence (karty kolejności)
- `"kalambury-verdict-player-card__score"` (assert FALSE) → assert false w ScorePhase (score karty nie mają tego class — weryfikacja separacji)
- `"kalambury-host-status--act"` → ActPhase
- `"kalambury-play__timer--act"` → ActPhase
- `"kalambury-hint-chips--act"` → ActPhase

**Test 5: "verdict guessed state uses a compact selection grid..."**
Źródło: `ScorePhase.tsx`
- `'className="kalambury-verdict-player-grid kalambury-verdict-player-grid--guessers"'` → ScorePhase
- `'"kalambury-persona-card kalambury-persona-card--interactive kalambury-persona-card--verdict kalambury-verdict-player-card kalambury-verdict-player-card--guesser kalambury-verdict-player-card--active"'` → ScorePhase
- `"kalambury-verdict-player-card__score"` (assert FALSE) → assert false w ScorePhase

**Test 6: "play screen exposes distinct topbar stage labels..."**
Źródło: `PlayScreen.tsx` (bez zmian)
- `getStageLabel` z returnem dla każdej fazy zostaje w PlayScreen (topbar jest w orkiestratorze)
- `'return "LOSOWANIE";'`, `'return "PRZYGOTOWANIE";'`, `'return "PREZENTOWANIE";'`, `'return "WERDYKT";'`, `'return "PODSUMOWANIE";'` — wszystkie w PlayScreen

---

### `setup-parity.test.js` (aktualizacja w kroku 3 i 4)

Test czyta `setup-sections.tsx`, `setup-modals.tsx`, `SetupScreen.tsx`, `HostApp.tsx`. Po podziale dwa pierwsze znikają. Mapowanie:

**Test: "player cards keep icon-based legacy actions..."**
Źródło: `PlayersPanel.tsx`
- `"function Pencil"`, `"function UserRoundCog"`, `"function X"`, `"<Pencil"`, `"<UserRoundCog"`, `"<X"` → PlayersPanel

**Test: "setup modals keep legacy iconography for infinity and gender chips"**
Źródło: `AddPlayerModal.tsx`
- `"function InfinityIcon"`, `"function Venus"`, `"function Mars"`, `"<InfinityIcon"`, `"icon: Venus"`, `"icon: Mars"` → AddPlayerModal

**Test: "setup screen keeps legacy shell accents and feedback copy"**
Źródło: `SetupScreen.tsx` (bez zmian — ten test czyta SetupScreen, nie sekcje)

**Test: "setup screen hydrates persisted draft before autosave runs"**
Źródło: `SetupScreen.tsx` (bez zmian)

**Test: "setup screen renders presenter device join entry with session code"**
- `setupScreenSource.includes("sessionCode={sessionCode}")` → SetupScreen (bez zmian)
- `"Kod sesji"` (assert FALSE) → `presenterDevicePanelSource.includes("Kod sesji")` false — PresenterDevicePanel
- `"Do telefonu"` (assert FALSE) → PresenterDevicePanel false
- `"Podlacz urzadzenie"` (assert TRUE) → PresenterDevicePanel true
- `'className="kalambury-addon-card__summary"'` (assert FALSE) → PresenterDevicePanel false
- `"Anuluj dodatek"` (assert FALSE) → PresenterDevicePanel false
- `"Rozlacz urzadzenie"` (assert TRUE) — pierwsze wystąpienie → PresenterDevicePanel true

**Test: "presenter device flow uses QR modal with local scan simulation"**
Źródło: `PresenterQrModal.tsx`
- `"QR"`, `"Symuluj skan"`, `"window.open"` → PresenterQrModal

**Test: "host app renders a dedicated sidebar exit..."**
Źródło: `HostApp.tsx` (bez zmian)

**Test: "setup screen keeps presenter pairing and exposes manual disconnect separately"**
- `setupScreenSource.includes("pairedPresenterDeviceId")` → SetupScreen (bez zmian)
- `setupScreenSource.includes("onDisconnectPresenterDevice")` → SetupScreen (bez zmian)
- `setupSectionsSource.includes("Rozlacz urzadzenie")` (assert TRUE) — drugie wystąpienie → `presenterDevicePanelSource.includes("Rozlacz urzadzenie")` true

**Test: "setup screen keeps the presenter host bridge stable after pairing"**
Źródło: `SetupScreen.tsx` (bez zmian)

**Test: "setup screen uses the shared player card anatomy for setup roster cards"**
- `setupSectionsSource.includes("kalambury-persona-card")` → `playersPanelSource.includes("kalambury-persona-card")` true
- `setupSectionsSource.includes("data-gender={player.gender}")` → PlayersPanel true
- `setupSectionsSource.includes("kalambury-persona-card__avatar")` → PlayersPanel true
- `setupSectionsSource.includes("kalambury-persona-card__nameplate")` → PlayersPanel true
- `setupSectionsSource.includes("kalambury-player-card__dice")` → PlayersPanel true
- `setupSectionsSource.includes("onAddRandomPlayer")` → PlayersPanel true
- `setupScreenSource.includes("addRandomKalamburySetupPlayer")` → SetupScreen (bez zmian)

**Test: "add player modal colors the name field border by selected gender"**
Źródło: `AddPlayerModal.tsx`
- Obie asserti z `setupModalsSource` → `addPlayerModalSource`

---

## Testy

### Nowe pliki testowe

| Plik | Co testuje |
|---|---|
| `shared/presenter/channel-utils.test.ts` | `resolveBroadcastChannel` (zwraca null gdy brak global BC), `getChannelName` (uppercase sessionCode) |
| `runtime/state-machine.test.ts` (uzupełnienie) | `rerollKalamburyPhrase` edge cases, `resolveKalamburyScore` z `golden-points` event, FINISHED state transitions |
| `transport/firebase.test.ts` (uzupełnienie) | error handling gdy push fails, brak sessionCode |
| `shared/setup-storage.test.ts` (uzupełnienie) | pusty draft, brak localStorage |

---

## Kolejność implementacji

Każdy krok kończy się stanem gdy `pnpm --filter @project-party/game-kalambury test` przechodzi w 100%.

1. **`shared/presenter/channel-utils.ts`** — wyciągnięcie duplikacji + aktualizacja importów w host-bridge i controller-bridge + `channel-utils.test.ts`

2. **`settings/constants.ts`** — dodanie `PRESENTER_REVEAL_PREVIEW_SECONDS` + aktualizacja importu w `PlayScreen.tsx`

3. **`host/modals/`** — podział `setup-modals.tsx` na 3 pliki + usunięcie `setup-modals.tsx` + aktualizacja importów w `SetupScreen.tsx` i `PlayScreen.tsx` + aktualizacja `setup-parity.test.js` (assertions z `setupModalsSource`)

4. **`host/sections/`** — podział `setup-sections.tsx` na 5 plików + usunięcie `setup-sections.tsx` + aktualizacja importów w `SetupScreen.tsx` + aktualizacja `setup-parity.test.js` (assertions z `setupSectionsSource`)

5. **`host/components/`** — podział `PlayScreen.tsx` na fazowe komponenty + aktualizacja `play-parity.test.js` (pełne mapowanie w sekcji Parity testy powyżej) — wszystko w jednym commicie

6. **Uzupełnienie testów** — state-machine edge cases, firebase error handling, setup-storage edge cases

---

## Ryzyka i mitygacje

| Ryzyko | Prawdopodobieństwo | Mitygacja |
|---|---|---|
| `setup-parity.test.js` crashuje po usunięciu setup-modals/sections | wysokie bez mitygacji | Kroki 3 i 4 aktualizują test w tym samym commicie |
| `play-parity.test.js` łamie się po podziale PlayScreen | wysokie bez mitygacji | Krok 5 aktualizuje test w tym samym commicie; pełne mapowanie w spec |
| Import circular po podziale modali/sekcji | niskie | Każdy plik importuje tylko z `shared/` lub `runtime/`, nigdy z `host/` sibling |
| Regresja w animacji DrawSequence | średnie | Testy przechodzą po każdym kroku; animacja self-contained z lokalnym state |
| Złamanie presenter bridge po channel-utils | niskie | Istniejące testy wychwycą natychmiast |
| `SetupScreen.tsx` nie kompiluje się po usunięciu staryh plików | wysokie bez mitygacji | Importy aktualizowane w tym samym kroku co usunięcie |

---

## Definition of Done

- `pnpm --filter @project-party/game-kalambury test` — 100% pass
- `pnpm typecheck` (pełne monorepo) — 0 nowych błędów poza istniejącym pre-existing w kalambury: `error TS2688: Cannot find type definition file for 'node'.`
- Żaden plik nie przekracza ~600 linii
- Brak duplikacji `createPresenterChannel` / `resolveBroadcastChannel` / `getChannelName`
- `PRESENTER_REVEAL_PREVIEW_SECONDS` pochodzi z `settings/constants.ts`
- `setup-modals.tsx` i `setup-sections.tsx` nie istnieją w repo
- `play-parity.test.js` i `setup-parity.test.js` przechodzą i pokrywają te same zachowania co przed refaktorem
