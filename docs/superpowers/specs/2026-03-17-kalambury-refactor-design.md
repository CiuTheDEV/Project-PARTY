# Kalambury Refactor Design

**Date:** 2026-03-17
**Status:** Approved
**Goal:** Doprowadzić Kalambury do stanu "wzorcowego modułu gry" — czytelnego dla agentów i developerów, stabilnego przed dodaniem Tajniaków.

---

## Zakres

### W scope

- Podział gigantycznych plików (PlayScreen, setup-modals, setup-sections)
- Eliminacja duplikacji w presenter bridge (`createPresenterChannel`, `resolveBroadcastChannel`, `getChannelName`)
- Przeniesienie hardcoded wartości do `settings/constants.ts`
- Uzupełnienie testów (state machine edge cases, firebase error handling, channel-utils)
- Drobne fixe edge case'ów (firebase error handling, setup-storage edge cases)

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
│   ├── SetupScreen.tsx           (bez zmian)
│   ├── PlayScreen.tsx            (odchudzone — orkiestracja, ~400L)
│   ├── components/
│   │   ├── DrawSequence.tsx      (NOWY — cała animacja losowania, ~300L)
│   │   ├── PreparePhase.tsx      (NOWY — stage PRZYGOTOWANIE, ~120L)
│   │   ├── ActPhase.tsx          (NOWY — stage ACT, ~150L)
│   │   ├── ScorePhase.tsx        (NOWY — stage SCORE, ~200L)
│   │   └── FinishedPhase.tsx     (NOWY — stage FINISHED, ~100L)
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
│   └── hooks/
│       └── usePresenterHostBridge.ts (bez zmian)
├── controller/
│   └── ControllerApp.tsx         (bez zmian — 249L, OK)
└── settings/
    └── constants.ts              (NOWY — PRESENTER_REVEAL_PREVIEW_SECONDS i inne hardcoded wartości)
```

---

## Zasady podziału

- `PlayScreen.tsx` staje się orkiestratorem — trzyma state, przekazuje props w dół, nie renderuje samodzielnie żadnej fazy
- Każdy komponent fazy (PreparePhase, ActPhase, ScorePhase, FinishedPhase) dostaje tylko to co potrzebuje przez props
- `DrawSequence.tsx` jest self-contained — dostaje players i callbacks, zarządza własną animacją
- Modale i sekcje importowane bezpośrednio — brak cyrkulacji importów
- Żaden komponent host/ nie importuje z sibling host/ komponentu (tylko z shared/, runtime/, settings/)

---

## Testy

### Nowe pliki testowe

| Plik | Co testuje |
|---|---|
| `shared/presenter/channel-utils.test.ts` | resolveBroadcastChannel (null gdy brak global BC), getChannelName (uppercase) |
| `runtime/state-machine.test.ts` (uzupełnienie) | rerollKalamburyPhrase edge cases, resolveKalamburyScore z golden-points, FINISHED transitions |
| `transport/firebase.test.ts` (uzupełnienie) | error handling gdy push fails, brak sessionCode |
| `shared/setup-storage.test.ts` (uzupełnienie) | pusty draft, brak localStorage |

### Poza scope testów

- React komponenty (brak testing-library)
- E2E Playwright

---

## Kolejność implementacji

1. `shared/presenter/channel-utils.ts` — wyciągnięcie duplikacji + testy
2. `settings/constants.ts` — przeniesienie hardcoded wartości
3. `host/modals/` — podział setup-modals.tsx na 3 pliki
4. `host/sections/` — podział setup-sections.tsx na 5 plików
5. `host/components/` — podział PlayScreen.tsx na fazowe komponenty
6. Uzupełnienie testów (state-machine, firebase, setup-storage)

---

## Ryzyka i mitygacje

| Ryzyko | Prawdopodobieństwo | Mitygacja |
|---|---|---|
| Import circular po podziale modali/sekcji | niskie | Każdy plik importuje tylko z shared/ lub runtime/, nigdy z host/ sibling |
| Regresja w animacji DrawSequence po wyciągnięciu | średnie | Testy przechodzą po każdym kroku; animacja self-contained |
| Złamanie presenter bridge po channel-utils | niskie | Istniejące testy host-bridge i controller-bridge wychwycą natychmiast |

---

## Definition of Done

- `pnpm --filter @project-party/game-kalambury test` — 100% pass
- `pnpm --filter @project-party/game-kalambury typecheck` — 0 errors (poza istniejącym błędem `node` types w tsconfig)
- Żaden plik nie przekracza ~600 linii
- Brak duplikacji `createPresenterChannel` / `resolveBroadcastChannel` / `getChannelName`
- Wszystkie hardcoded stałe w `settings/constants.ts`
