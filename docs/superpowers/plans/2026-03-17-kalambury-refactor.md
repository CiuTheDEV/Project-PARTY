# Kalambury Refactor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Podzielić gigantyczne pliki Kalamburów, usunąć duplikacje kodu i uzupełnić testy — doprowadzając grę do stanu wzorcowego modułu przed dodaniem Tajniaków.

**Architecture:** Czysto mechaniczny podział plików bez zmiany logiki. Każdy krok kończy się w stanie gdy testy przechodzą 100%. Parity testy (readFileSync-based) są aktualizowane w tym samym commicie co podział pliku który czytają.

**Tech Stack:** TypeScript, React, Node.js native `node:test` (brak testing-library), pnpm workspaces

---

## Kontekst i zasady

Repozytorium: `C:\Users\Mateo\Desktop\PROJECT PARTY`
Gra: `games/kalambury/src/`

**Przed każdym krokiem:** uruchom `pnpm --filter @project-party/game-kalambury test` — powinno przejść 100%.
**Po każdym kroku:** uruchom `pnpm --filter @project-party/game-kalambury test` — powinno nadal przejść 100%.

**Zasady importów:**
- Żaden plik `host/` nie importuje z sibling `host/` (tylko z `shared/`, `runtime/`, `settings/`, własnych podkatalogów `host/components/`, `host/modals/`, `host/sections/`, `host/hooks/`)
- Stare pliki są **usuwane** (nie zamieniamy na barrel re-exports)
- Wszystkie callery aktualizują importy w tym samym commicie co usunięcie

---

## Task 1: channel-utils — eliminacja duplikacji w presenter bridge

**Files:**
- Create: `games/kalambury/src/shared/presenter/channel-utils.ts`
- Create: `games/kalambury/src/shared/presenter/channel-utils.test.ts`
- Modify: `games/kalambury/src/shared/presenter/host-bridge.ts`
- Modify: `games/kalambury/src/shared/presenter/controller-bridge.ts`

### Tło

Funkcje `resolveBroadcastChannel`, `getChannelName`, `createPresenterChannel` są identycznie skopiowane w `host-bridge.ts` i `controller-bridge.ts`. Wyciągamy je do wspólnego pliku.

### Kroki

- [ ] **Step 1: Napisz test dla channel-utils**

Utwórz plik `games/kalambury/src/shared/presenter/channel-utils.test.ts`:

```typescript
import assert from "node:assert/strict";
import test from "node:test";

import {
  createPresenterChannel,
  getChannelName,
  resolveBroadcastChannel,
} from "./channel-utils.ts";

test("getChannelName returns uppercased session code", () => {
  assert.equal(
    getChannelName("abc123"),
    "project-party.kalambury.presenter.ABC123",
  );
  assert.equal(
    getChannelName("XYZ"),
    "project-party.kalambury.presenter.XYZ",
  );
});

test("resolveBroadcastChannel returns provided impl when given", () => {
  class FakeBC {
    onmessage = null;
    postMessage() {}
    close() {}
  }
  const resolved = resolveBroadcastChannel(FakeBC as never);
  assert.equal(resolved, FakeBC);
});

test("resolveBroadcastChannel returns null when global BroadcastChannel is undefined", () => {
  const resolved = resolveBroadcastChannel(undefined);
  // In Node.js test env, global BroadcastChannel is undefined
  assert.equal(resolved, null);
});

test("createPresenterChannel returns null when sessionCode is empty", () => {
  const channel = createPresenterChannel("");
  assert.equal(channel, null);
});

test("createPresenterChannel returns null when BroadcastChannel unavailable and no impl provided", () => {
  const channel = createPresenterChannel("ABC123");
  // In Node.js test env without global BroadcastChannel, returns null
  assert.equal(channel, null);
});
```

- [ ] **Step 2: Uruchom test — powinien FAIL (plik nie istnieje)**

```bash
pnpm --filter @project-party/game-kalambury test 2>&1 | tail -10
```

Oczekiwane: błąd importu `channel-utils.ts`

- [ ] **Step 3: Utwórz channel-utils.ts**

Utwórz plik `games/kalambury/src/shared/presenter/channel-utils.ts`:

```typescript
// games/kalambury/src/shared/presenter/channel-utils.ts

import type {
  BroadcastChannelConstructor,
  KalamburyPresenterChannel,
  KalamburyPresenterMessage,
} from "./types.ts";
import { isPresenterMessage } from "./types.ts";
// isPresenterMessage is used inside createPresenterChannel's subscribe() handler

export function resolveBroadcastChannel(
  BroadcastChannelImpl?: BroadcastChannelConstructor,
): BroadcastChannelConstructor | null {
  if (BroadcastChannelImpl) return BroadcastChannelImpl;
  if (typeof BroadcastChannel === "undefined") return null;
  return BroadcastChannel as unknown as BroadcastChannelConstructor;
}

export function getChannelName(sessionCode: string): string {
  return `project-party.kalambury.presenter.${sessionCode.toUpperCase()}`;
}

export function createPresenterChannel(
  sessionCode: string,
  BroadcastChannelImpl?: BroadcastChannelConstructor,
): KalamburyPresenterChannel | null {
  const Channel = resolveBroadcastChannel(BroadcastChannelImpl);
  if (!Channel || !sessionCode) return null;

  const channel = new Channel(getChannelName(sessionCode));

  return {
    postMessage(message: KalamburyPresenterMessage) {
      channel.postMessage(message);
    },
    subscribe(handler: (message: KalamburyPresenterMessage) => void) {
      channel.onmessage = (event: MessageEvent<unknown>) => {
        if (!isPresenterMessage(event.data)) return;
        handler(event.data);
      };
      return () => {
        channel.onmessage = null;
      };
    },
    close() {
      channel.close();
    },
  };
}
```

- [ ] **Step 4: Uruchom test — powinien PASS**

```bash
pnpm --filter @project-party/game-kalambury test 2>&1 | tail -10
```

Oczekiwane: wszystkie testy pass (w tym nowe z channel-utils.test.ts)

- [ ] **Step 5: Zaktualizuj host-bridge.ts — usuń duplikację, importuj z channel-utils**

Zmień początek pliku `games/kalambury/src/shared/presenter/host-bridge.ts`:

```typescript
// games/kalambury/src/shared/presenter/host-bridge.ts

import {
  createPresenterChannel,
} from "./channel-utils.ts";
import {
  isPresenterMessage,
  type HostBridgeOptions,
  type KalamburyPresenterChannel,
  type KalamburyPresenterMessage,
  type KalamburyPresenterPairState,
} from "./types.ts";
```

Usuń z host-bridge.ts funkcje: `resolveBroadcastChannel`, `getChannelName`, `createPresenterChannel` (wszystkie trzy lokalne definicje).

W funkcji `createKalamburyPresenterHostBridge`, zamiast lokalnego `createPresenterChannel` użyj importowanego.

- [ ] **Step 6: Zaktualizuj controller-bridge.ts — usuń duplikację, importuj z channel-utils**

Zmień początek pliku `games/kalambury/src/shared/presenter/controller-bridge.ts`:

```typescript
// games/kalambury/src/shared/presenter/controller-bridge.ts

import {
  createPresenterChannel,
} from "./channel-utils.ts";
import {
  isPresenterMessage,
  type ControllerBridgeOptions,
  type KalamburyControllerConnectionState,
  type KalamburyPresenterChannel,
  type KalamburyPresenterMessage,
} from "./types.ts";
```

Usuń z controller-bridge.ts funkcje: `resolveBroadcastChannel`, `getChannelName`, `createPresenterChannel`.

- [ ] **Step 7: Uruchom wszystkie testy — powinny PASS**

```bash
pnpm --filter @project-party/game-kalambury test 2>&1 | tail -15
```

Oczekiwane: wszystkie testy pass (host-bridge.test.ts, controller-bridge.test.ts, channel-utils.test.ts — razem powinno być 63+ testów)

- [ ] **Step 8: Commit**

```bash
cd "C:/Users/Mateo/Desktop/PROJECT PARTY"
git add games/kalambury/src/shared/presenter/channel-utils.ts
git add games/kalambury/src/shared/presenter/channel-utils.test.ts
git add games/kalambury/src/shared/presenter/host-bridge.ts
git add games/kalambury/src/shared/presenter/controller-bridge.ts
git commit -m "refactor(kalambury): extract presenter channel-utils, remove duplication"
```

---

## Task 2: settings/constants.ts

**Files:**
- Create: `games/kalambury/src/settings/constants.ts`
- Modify: `games/kalambury/src/host/PlayScreen.tsx`

### Kroki

- [ ] **Step 1: Utwórz constants.ts**

Utwórz plik `games/kalambury/src/settings/constants.ts`:

```typescript
// games/kalambury/src/settings/constants.ts

/**
 * How long (in seconds) the presenter has to memorize the phrase
 * before the live turn starts automatically.
 */
export const PRESENTER_REVEAL_PREVIEW_SECONDS = 10;
```

- [ ] **Step 2: Zaktualizuj PlayScreen.tsx — usuń lokalną stałą, importuj z constants**

W `games/kalambury/src/host/PlayScreen.tsx`:

Znajdź i usuń:
```typescript
const PRESENTER_REVEAL_PREVIEW_SECONDS = 10;
```

Dodaj do importów:
```typescript
import { PRESENTER_REVEAL_PREVIEW_SECONDS } from "../settings/constants.ts";
```

- [ ] **Step 3: Uruchom testy**

```bash
pnpm --filter @project-party/game-kalambury test 2>&1 | tail -10
```

Oczekiwane: wszystkie testy pass

- [ ] **Step 4: Commit**

```bash
cd "C:/Users/Mateo/Desktop/PROJECT PARTY"
git add games/kalambury/src/settings/constants.ts
git add games/kalambury/src/host/PlayScreen.tsx
git commit -m "refactor(kalambury): move PRESENTER_REVEAL_PREVIEW_SECONDS to settings/constants"
```

---

## Task 3: host/modals/ — podział setup-modals.tsx

**Files:**
- Create: `games/kalambury/src/host/modals/ModeSettingsModal.tsx`
- Create: `games/kalambury/src/host/modals/AddPlayerModal.tsx`
- Create: `games/kalambury/src/host/modals/PresenterQrModal.tsx`
- Delete: `games/kalambury/src/host/setup-modals.tsx`
- Modify: `games/kalambury/src/host/SetupScreen.tsx`
- Modify: `games/kalambury/src/host/PlayScreen.tsx`
- Modify: `games/kalambury/src/host/setup-parity.test.js`

### Tło

`setup-modals.tsx` (1696L) zawiera trzy niezależne modale i kilka shared icon functions. Podział:

- `ModeSettingsModal.tsx` — eksportuje `KalamburyModeSettingsModal` (linie ~275-623)
- `AddPlayerModal.tsx` — eksportuje `KalamburyAddPlayerModal` (linie ~624-842), zawiera `InfinityIcon`, `Venus`, `Mars`
- `PresenterQrModal.tsx` — eksportuje `KalamburyPresenterQrModal` (linie ~843-koniec), zawiera `buildAbsoluteUrl`, `buildQrImageUrl`

Shared helper functions (`buildAbsoluteUrl`, `buildQrImageUrl`, icon components) trafiają do pliku który je używa. Jeśli icon function jest używana tylko w jednym modalu — trafia do tamtego pliku.

### Kroki

- [ ] **Step 1: Utwórz katalog modals/ i trzy pliki**

Skopiuj odpowiednie sekcje z `setup-modals.tsx` do trzech nowych plików. Każdy plik musi:
- Mieć własne importy (React, typy, etc.)
- Eksportować tylko swój komponent
- Zawierać wyłącznie swoje helper functions i icon components

Struktura `ModeSettingsModal.tsx`:
```typescript
// games/kalambury/src/host/modals/ModeSettingsModal.tsx
import { ... } from "react";
import type { ... } from "../../shared/...";
// ... tylko to co potrzebne dla KalamburyModeSettingsModal
// helper functions używane tylko przez ten modal (ToggleRow, ModeSliderCard, getModeSectionIcon)

export function KalamburyModeSettingsModal(...) { ... }
```

Struktura `AddPlayerModal.tsx`:
```typescript
// games/kalambury/src/host/modals/AddPlayerModal.tsx
import { ... } from "react";
// InfinityIcon, Venus, Mars (icon functions)

export function KalamburyAddPlayerModal(...) { ... }
```

Struktura `PresenterQrModal.tsx`:
```typescript
// games/kalambury/src/host/modals/PresenterQrModal.tsx
import { ... } from "react";
// buildAbsoluteUrl, buildQrImageUrl (helper functions)

export function KalamburyPresenterQrModal(...) { ... }
```

- [ ] **Step 2: Zaktualizuj importy w SetupScreen.tsx**

Zamień:
```typescript
import {
  KalamburyAddPlayerModal,
  KalamburyModeSettingsModal,
  KalamburyPresenterQrModal,
} from "./setup-modals";
```

Na:
```typescript
import { KalamburyModeSettingsModal } from "./modals/ModeSettingsModal";
import { KalamburyAddPlayerModal } from "./modals/AddPlayerModal";
import { KalamburyPresenterQrModal } from "./modals/PresenterQrModal";
```

- [ ] **Step 3: Zaktualizuj importy w PlayScreen.tsx**

Zamień:
```typescript
import { KalamburyPresenterQrModal } from "./setup-modals";
```

Na:
```typescript
import { KalamburyPresenterQrModal } from "./modals/PresenterQrModal";
```

- [ ] **Step 4: Usuń setup-modals.tsx**

```bash
rm "C:/Users/Mateo/Desktop/PROJECT PARTY/games/kalambury/src/host/setup-modals.tsx"
```

- [ ] **Step 5: Zaktualizuj setup-parity.test.js — sekcja setupModalsSource**

W `setup-parity.test.js` zamień **tylko** blok odczytu `setupModalsSource` (linie 9-12 w oryginale):

```javascript
// Usuń TYLKO te linie:
// const setupModalsSource = readFileSync(
//   new URL("./setup-modals.tsx", import.meta.url),
//   "utf8",
// );

// Zastąp dwoma zmiennymi (nie dodawaj nowego importu readFileSync — jest już na górze):
const addPlayerModalSource = readFileSync(
  new URL("./modals/AddPlayerModal.tsx", import.meta.url),
  "utf8",
);
const presenterQrModalSource = readFileSync(
  new URL("./modals/PresenterQrModal.tsx", import.meta.url),
  "utf8",
);
```

Zostaw `setupSectionsSource` bez zmian (to będzie zaktualizowane w Task 4).

Zaktualizuj testy używające `setupModalsSource`:

**Test "setup modals keep legacy iconography..."** → zmień źródło na `addPlayerModalSource`:
```javascript
test("setup modals keep legacy iconography for infinity and gender chips", () => {
  assert.equal(addPlayerModalSource.includes("function InfinityIcon"), true);
  assert.equal(addPlayerModalSource.includes("function Venus"), true);
  assert.equal(addPlayerModalSource.includes("function Mars"), true);
  assert.equal(addPlayerModalSource.includes("<InfinityIcon"), true);
  assert.equal(addPlayerModalSource.includes("icon: Venus"), true);
  assert.equal(addPlayerModalSource.includes("icon: Mars"), true);
});
```

**Test "presenter device flow uses QR modal..."** → zmień źródło na `presenterQrModalSource`:
```javascript
test("presenter device flow uses QR modal with local scan simulation", () => {
  assert.equal(presenterQrModalSource.includes("QR"), true);
  assert.equal(presenterQrModalSource.includes("Symuluj skan"), true);
  assert.equal(presenterQrModalSource.includes("window.open"), true);
});
```

**Test "add player modal colors the name field border..."** → zmień źródło na `addPlayerModalSource`:
```javascript
test("add player modal colors the name field border by selected gender", () => {
  assert.equal(
    addPlayerModalSource.includes(
      '? "kalambury-player-name-input kalambury-player-name-input--female"',
    ),
    true,
  );
  assert.equal(
    addPlayerModalSource.includes(
      ': playerDraft.gender === "male"\n                      ? "kalambury-player-name-input kalambury-player-name-input--male"',
    ),
    true,
  );
});
```

- [ ] **Step 6: Uruchom testy**

```bash
pnpm --filter @project-party/game-kalambury test 2>&1 | tail -15
```

Oczekiwane: wszystkie testy pass

- [ ] **Step 7: Commit**

```bash
cd "C:/Users/Mateo/Desktop/PROJECT PARTY"
git add games/kalambury/src/host/modals/
git add games/kalambury/src/host/SetupScreen.tsx
git add games/kalambury/src/host/PlayScreen.tsx
git add games/kalambury/src/host/setup-parity.test.js
git rm games/kalambury/src/host/setup-modals.tsx
git commit -m "refactor(kalambury): split setup-modals into modals/ directory"
```

---

## Task 4: host/sections/ — podział setup-sections.tsx

**Files:**
- Create: `games/kalambury/src/host/sections/PlayersPanel.tsx`
- Create: `games/kalambury/src/host/sections/ModeSummaryPanel.tsx`
- Create: `games/kalambury/src/host/sections/PresenterDevicePanel.tsx`
- Create: `games/kalambury/src/host/sections/CategoriesPanel.tsx`
- Create: `games/kalambury/src/host/sections/SetupFooter.tsx`
- Delete: `games/kalambury/src/host/setup-sections.tsx`
- Modify: `games/kalambury/src/host/SetupScreen.tsx`
- Modify: `games/kalambury/src/host/setup-parity.test.js`

### Tło

`setup-sections.tsx` (736L) zawiera 5 paneli. Każdy panel trafia do osobnego pliku w `sections/`. Shared icon components (Pencil, X, UserRoundCog, Dice) trafiają do pliku który je używa — `PlayersPanel.tsx` (jedyny który je używa).

Podział:
- `PlayersPanel.tsx` — `KalamburyPlayersPanel` + Pencil, X, UserRoundCog, Dice icons (linie ~14-287)
- `ModeSummaryPanel.tsx` — `KalamburyModeSummaryPanel` (linie ~288-323)
- `PresenterDevicePanel.tsx` — `KalamburyPresenterDevicePanel` (linie ~324-390)
- `CategoriesPanel.tsx` — `KalamburyCategoriesPanel` (linie ~391-514)
- `SetupFooter.tsx` — `KalamburySetupFooter` (linie ~515-koniec)

### Kroki

- [ ] **Step 1: Utwórz katalog sections/ i pięć plików**

Każdy plik:
- Posiada własne importy
- Eksportuje jeden komponent
- Zawiera tylko swoje helper functions i icons

Przykład `PlayersPanel.tsx`:
```typescript
// games/kalambury/src/host/sections/PlayersPanel.tsx
import { ... } from "react";
import type { KalamburySetupPayload } from "../../runtime/state-machine";
// Pencil, X, UserRoundCog, Dice — icon functions

export function KalamburyPlayersPanel(...) { ... }
```

- [ ] **Step 2: Zaktualizuj importy w SetupScreen.tsx**

Zamień:
```typescript
import {
  KalamburyCategoriesPanel,
  KalamburyModeSummaryPanel,
  KalamburyPlayersPanel,
  KalamburyPresenterDevicePanel,
  KalamburySetupFooter,
} from "./setup-sections";
```

Na:
```typescript
import { KalamburyPlayersPanel } from "./sections/PlayersPanel";
import { KalamburyModeSummaryPanel } from "./sections/ModeSummaryPanel";
import { KalamburyPresenterDevicePanel } from "./sections/PresenterDevicePanel";
import { KalamburyCategoriesPanel } from "./sections/CategoriesPanel";
import { KalamburySetupFooter } from "./sections/SetupFooter";
```

- [ ] **Step 3: Usuń setup-sections.tsx**

```bash
rm "C:/Users/Mateo/Desktop/PROJECT PARTY/games/kalambury/src/host/setup-sections.tsx"
```

- [ ] **Step 4: Zaktualizuj setup-parity.test.js — sekcja setupSectionsSource**

Zamień `setupSectionsSource` na osobne zmienne dla paneli których dotyczy:

```javascript
const playersPanelSource = readFileSync(
  new URL("./sections/PlayersPanel.tsx", import.meta.url),
  "utf8",
);
const presenterDevicePanelSource = readFileSync(
  new URL("./sections/PresenterDevicePanel.tsx", import.meta.url),
  "utf8",
);
```

Zaktualizuj testy:

**Test "player cards keep icon-based legacy actions..."** → `playersPanelSource`:
```javascript
test("player cards keep icon-based legacy actions instead of text placeholders", () => {
  assert.equal(playersPanelSource.includes("function Pencil"), true);
  assert.equal(playersPanelSource.includes("function UserRoundCog"), true);
  assert.equal(playersPanelSource.includes("function X"), true);
  assert.equal(playersPanelSource.includes("<Pencil"), true);
  assert.equal(playersPanelSource.includes("<UserRoundCog"), true);
  assert.equal(playersPanelSource.includes("<X"), true);
});
```

**Test "setup screen renders presenter device join entry..."** — zamień asserty z `setupSectionsSource` na `presenterDevicePanelSource`:
```javascript
test("setup screen renders presenter device join entry with session code", () => {
  assert.equal(setupScreenSource.includes("sessionCode={sessionCode}"), true);
  assert.equal(presenterDevicePanelSource.includes("Kod sesji"), false);
  assert.equal(presenterDevicePanelSource.includes("Do telefonu"), false);
  assert.equal(presenterDevicePanelSource.includes("Podlacz urzadzenie"), true);
  assert.equal(
    presenterDevicePanelSource.includes('className="kalambury-addon-card__summary"'),
    false,
  );
  assert.equal(presenterDevicePanelSource.includes("Anuluj dodatek"), false);
  assert.equal(presenterDevicePanelSource.includes("Rozlacz urzadzenie"), true);
});
```

**Test "setup screen keeps presenter pairing..."** — zamień drugi assert z `setupSectionsSource` na `presenterDevicePanelSource`:
```javascript
test("setup screen keeps presenter pairing and exposes manual disconnect separately from addon toggle", () => {
  assert.equal(setupScreenSource.includes("pairedPresenterDeviceId"), true);
  assert.equal(setupScreenSource.includes("onDisconnectPresenterDevice"), true);
  assert.equal(presenterDevicePanelSource.includes("Rozlacz urzadzenie"), true);
});
```

**Test "setup screen uses the shared player card anatomy..."** — zamień asserty z `setupSectionsSource` na `playersPanelSource`:
```javascript
test("setup screen uses the shared player card anatomy for setup roster cards", () => {
  assert.equal(playersPanelSource.includes("kalambury-persona-card"), true);
  assert.equal(playersPanelSource.includes("data-gender={player.gender}"), true);
  assert.equal(playersPanelSource.includes("kalambury-persona-card__avatar"), true);
  assert.equal(playersPanelSource.includes("kalambury-persona-card__nameplate"), true);
  assert.equal(playersPanelSource.includes("kalambury-player-card__dice"), true);
  assert.equal(playersPanelSource.includes("onAddRandomPlayer"), true);
  assert.equal(setupScreenSource.includes("addRandomKalamburySetupPlayer"), true);
});
```

- [ ] **Step 5: Uruchom testy**

```bash
pnpm --filter @project-party/game-kalambury test 2>&1 | tail -15
```

Oczekiwane: wszystkie testy pass

- [ ] **Step 6: Commit**

```bash
cd "C:/Users/Mateo/Desktop/PROJECT PARTY"
git add games/kalambury/src/host/sections/
git add games/kalambury/src/host/SetupScreen.tsx
git add games/kalambury/src/host/setup-parity.test.js
git rm games/kalambury/src/host/setup-sections.tsx
git commit -m "refactor(kalambury): split setup-sections into sections/ directory"
```

---

## Task 5: host/components/ — podział PlayScreen.tsx

**Files:**
- Create: `games/kalambury/src/host/components/DrawSequence.tsx`
- Create: `games/kalambury/src/host/components/PreparePhase.tsx`
- Create: `games/kalambury/src/host/components/ActPhase.tsx`
- Create: `games/kalambury/src/host/components/ScorePhase.tsx`
- Create: `games/kalambury/src/host/components/FinishedPhase.tsx`
- Modify: `games/kalambury/src/host/PlayScreen.tsx`
- Modify: `games/kalambury/src/host/play-parity.test.js`

### Tło

`PlayScreen.tsx` (1482L) jest orkiestratorem gry. Po podziale:
- Trzyma cały state (`playState`, `presenterRevealStage`, `presenterRevealCountdown`, etc.)
- Trzyma `getStageLabel` (używane przez topbar w tym samym komponencie)
- Trzyma `presenterReconnectRequired` (obliczenie z state)
- Renderuje topbar, footer i deleguje rendering faz do komponentów
- Importuje `KalamburyPresenterQrModal` z `./modals/PresenterQrModal`

**DrawSequence.tsx** jest self-contained:
- Przyjmuje props: `players`, `pendingDrawState`, `onComplete: (finalState: KalamburyPlayState) => void`
- Zarządza lokalnie: `drawSequenceCards`, `drawAnimationPhase`, `drawSequenceBounds`, `drawRouletteStep`, `currentDrawRevealIndex`, `activeDrawCardId`, `drawAnimationTimerRef`
- Zawiera lokalnie: `drawAnimationDurations`, `confettiPieces`, `formatKalamburyTimerValue` jeśli używany

**PreparePhase.tsx** przyjmuje props:
- `playState: KalamburyPlayState`
- `presenter: KalamburySetupPayload["players"][number]`
- `presenterRevealStage: "pending" | "preview"`
- `presenterRevealCountdown: number`
- `presenterReconnectRequired: boolean`

**ActPhase.tsx** przyjmuje props:
- `playState: KalamburyPlayState`
- `presenter: KalamburySetupPayload["players"][number]`
- `presenterReconnectRequired: boolean`
- `hints: { ... }`

**ScorePhase.tsx** przyjmuje props:
- `playState: KalamburyPlayState`
- `presenter: KalamburySetupPayload["players"][number] | null`
- `setup: KalamburySetupPayload`
- `scoreOutcome: ScoreOutcome`
- `selectedGuesserId: string | null`
- `presenterBonus: boolean`
- `guesserOptions: ...`
- Callbacki: `onScoreOutcomeChange`, `onGuesserSelect`, `onPresenterBonusToggle`

**FinishedPhase.tsx** przyjmuje props:
- `playState: KalamburyPlayState`
- `setup: KalamburySetupPayload`
- Callbacki: `onPlayAgain`, `onBackToHub`

### Kroki

- [ ] **Step 1: Wyciągnij DrawSequence.tsx**

Przenieś z PlayScreen.tsx do `games/kalambury/src/host/components/DrawSequence.tsx`:
- Wszystkie `useState` i `useRef` związane z animacją (`drawSequenceCards`, `drawAnimationPhase`, `drawSequenceBounds`, `drawRouletteStep`, `currentDrawRevealIndex`, `activeDrawCardId`, `drawAnimationTimerRef`)
- `useEffect` zarządzający animacją
- `drawAnimationDurations` constant
- `confettiPieces` constant
- `getCardStyle` helper function
- Rendering stage `LOSOWANIE` (draw cards grid) i `KOLEJNOSC` (order display)

Interface komponentu:
```typescript
type DrawSequenceProps = {
  players: KalamburySetupPayload["players"];
  pendingDrawState: KalamburyPlayState;
  onComplete: (finalState: KalamburyPlayState) => void;
  onSkip: () => void;
  canSkip: boolean;
};
```

W PlayScreen.tsx pozostaje tylko wywołanie `<DrawSequence ... />` gdy stage jest `LOSOWANIE` lub animacja trwa.

- [ ] **Step 2: Wyciągnij PreparePhase.tsx**

Przenieś rendering stage `PRZYGOTOWANIE` do `games/kalambury/src/host/components/PreparePhase.tsx`.

Plik musi zawierać:
- `presenterRevealStage` (jako prop)
- `"Karta czeka na odkrycie na telefonie"`
- `"Prezenter zapoznaje sie z haslem"`
- `"kalambury-prepare-presenter-column"`
- `"kalambury-host-status--prepare"`
- `"kalambury-play__timer--prepare"`
- `"kalambury-host-status--prepare-preview"`
- `"kalambury-host-status__copy--prepare"`
- Import `PRESENTER_REVEAL_PREVIEW_SECONDS` z `../../settings/constants`
- `"Gra wstrzymana do czasu ponownego podlaczenia urzadzenia prezentera"`
- `data-gender={presenter.gender}`

- [ ] **Step 3: Wyciągnij ActPhase.tsx**

Przenieś rendering stage `ACT` do `games/kalambury/src/host/components/ActPhase.tsx`.

Plik musi zawierać:
- `"kalambury-host-status--act"`
- `"kalambury-play__timer--act"`
- `"kalambury-hint-chips--act"`
- `"kalambury-persona-card__badge"`

- [ ] **Step 4: Wyciągnij ScorePhase.tsx**

Przenieś rendering stage `SCORE` do `games/kalambury/src/host/components/ScorePhase.tsx`.

Plik musi zawierać:
- `'className="kalambury-verdict-player-grid kalambury-verdict-player-grid--guessers"'`
- `'"kalambury-persona-card kalambury-persona-card--interactive kalambury-persona-card--verdict kalambury-verdict-player-card kalambury-verdict-player-card--guesser kalambury-verdict-player-card--active"'`
- NIE zawiera `"kalambury-verdict-player-card__score"` (weryfikacja separacji)

- [ ] **Step 5: Wyciągnij FinishedPhase.tsx**

Przenieś rendering stage `FINISHED` do `games/kalambury/src/host/components/FinishedPhase.tsx`.

> **Uwaga:** Żaden istniejący test parity nie assertuje na zawartość `FinishedPhase.tsx` — plik ten nie jest czytany przez `play-parity.test.js`. To jest celowe — komponent jest prosty (tylko wynik końcowy i przyciski powrotu). Nie dodawaj `finishedPhaseSource` do testu.

- [ ] **Step 6: Zaktualizuj play-parity.test.js**

Zastąp odczyt jednego pliku odczytem wielu plików:

```javascript
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const playScreenSource = readFileSync(
  resolve(import.meta.dirname, "./PlayScreen.tsx"),
  "utf8",
);
const preparePhaseSource = readFileSync(
  resolve(import.meta.dirname, "./components/PreparePhase.tsx"),
  "utf8",
);
const drawSequenceSource = readFileSync(
  resolve(import.meta.dirname, "./components/DrawSequence.tsx"),
  "utf8",
);
const actPhaseSource = readFileSync(
  resolve(import.meta.dirname, "./components/ActPhase.tsx"),
  "utf8",
);
const scorePhaseSource = readFileSync(
  resolve(import.meta.dirname, "./components/ScorePhase.tsx"),
  "utf8",
);
```

Zaktualizuj każdy test według mapowania ze spec:

**Test 1 — "play screen pauses presenter stages...":**
```javascript
test("play screen pauses presenter stages and reuses the presenter connect modal after disconnect", () => {
  assert.equal(playScreenSource.includes("KalamburyPresenterQrModal"), true);
  assert.equal(playScreenSource.includes("presenterReconnectRequired"), true);
  assert.equal(
    preparePhaseSource.includes(
      "Gra wstrzymana do czasu ponownego podlaczenia urzadzenia prezentera",
    ),
    true,
  );
});
```

**Test 2 — "play screen models presenter reveal...":**
```javascript
test("play screen models presenter reveal as pending and preview stages before the live turn", () => {
  assert.equal(preparePhaseSource.includes("presenterRevealStage"), true);
  assert.equal(
    preparePhaseSource.includes("Karta czeka na odkrycie na telefonie"),
    true,
  );
  assert.equal(
    preparePhaseSource.includes("Prezenter zapoznaje sie z haslem"),
    true,
  );
  assert.equal(
    preparePhaseSource.includes("PRESENTER_REVEAL_PREVIEW_SECONDS"),
    true,
  );
  assert.equal(
    preparePhaseSource.includes("kalambury-prepare-presenter-column"),
    true,
  );
  assert.equal(
    preparePhaseSource.includes("kalambury-host-status--prepare"),
    true,
  );
  assert.equal(
    preparePhaseSource.includes("kalambury-play__timer--prepare"),
    true,
  );
  assert.equal(
    preparePhaseSource.includes("kalambury-host-status--prepare-preview"),
    true,
  );
  assert.equal(
    preparePhaseSource.includes("kalambury-host-status__copy--prepare"),
    true,
  );
});
```

**Test 3 — "play screen marks odd two-column turn orders...":**
```javascript
test("play screen marks odd two-column turn orders so the orphan card can span the full row", () => {
  assert.equal(
    drawSequenceSource.includes(
      '"kalambury-order-grid kalambury-order-grid--orphan"',
    ),
    true,
  );
});
```

**Test 4 — "play screen uses one shared player card anatomy...":**
```javascript
test("play screen uses one shared player card anatomy across gameplay variants", () => {
  assert.equal(preparePhaseSource.includes("kalambury-persona-card"), true);
  assert.equal(
    preparePhaseSource.includes("kalambury-persona-card__avatar"),
    true,
  );
  assert.equal(
    preparePhaseSource.includes("kalambury-persona-card__nameplate"),
    true,
  );
  assert.equal(actPhaseSource.includes("kalambury-persona-card__badge"), true);
  assert.equal(
    preparePhaseSource.includes("data-gender={presenter.gender}"),
    true,
  );
  assert.equal(
    drawSequenceSource.includes("data-gender={player.gender}"),
    true,
  );
  assert.equal(
    scorePhaseSource.includes("kalambury-verdict-player-card__score"),
    false,
  );
  assert.equal(actPhaseSource.includes("kalambury-host-status--act"), true);
  assert.equal(actPhaseSource.includes("kalambury-play__timer--act"), true);
  assert.equal(actPhaseSource.includes("kalambury-hint-chips--act"), true);
});
```

**Test 5 — "verdict guessed state...":**
```javascript
test("verdict guessed state uses a compact selection grid without score labels on cards", () => {
  assert.equal(
    scorePhaseSource.includes(
      'className="kalambury-verdict-player-grid kalambury-verdict-player-grid--guessers"',
    ),
    true,
  );
  assert.equal(
    scorePhaseSource.includes(
      '"kalambury-persona-card kalambury-persona-card--interactive kalambury-persona-card--verdict kalambury-verdict-player-card kalambury-verdict-player-card--guesser kalambury-verdict-player-card--active"',
    ),
    true,
  );
  assert.equal(
    scorePhaseSource.includes("kalambury-verdict-player-card__score"),
    false,
  );
});
```

**Test 6 — "play screen exposes distinct topbar stage labels...":**
```javascript
test("play screen exposes distinct topbar stage labels for each major phase", () => {
  assert.equal(playScreenSource.includes('return "LOSOWANIE";'), true);
  assert.equal(playScreenSource.includes('return "PRZYGOTOWANIE";'), true);
  assert.equal(playScreenSource.includes('return "PREZENTOWANIE";'), true);
  assert.equal(playScreenSource.includes('return "WERDYKT";'), true);
  assert.equal(playScreenSource.includes('return "PODSUMOWANIE";'), true);
});
```

- [ ] **Step 7: Uruchom testy**

```bash
pnpm --filter @project-party/game-kalambury test 2>&1 | tail -15
```

Oczekiwane: wszystkie testy pass

- [ ] **Step 8: Commit**

```bash
cd "C:/Users/Mateo/Desktop/PROJECT PARTY"
git add games/kalambury/src/host/components/
git add games/kalambury/src/host/PlayScreen.tsx
git add games/kalambury/src/host/play-parity.test.js
git commit -m "refactor(kalambury): split PlayScreen into phase components"
```

---

## Task 6: Uzupełnienie testów

**Files:**
- Modify: `games/kalambury/src/runtime/state-machine.test.ts`
- Modify: `games/kalambury/src/transport/firebase.test.ts`
- Modify: `games/kalambury/src/shared/setup-storage.test.ts`

### 6a: state-machine edge cases

- [ ] **Step 1: Dodaj testy do state-machine.test.ts**

Dodaj na końcu pliku `games/kalambury/src/runtime/state-machine.test.ts`.

**Ważne:** Istniejące testy używają `() => 0` jako trzeciego argumentu (RNG) dla `drawKalamburyTurnOrder` i `enterKalamburyPreparation` oraz czwartego dla `resolveKalamburyScore` — rób to samo dla deterministycznych wyników.

```typescript
test("resolveKalamburyScore doubles points when activeEvent is golden-points", () => {
  const payload = createPayload();
  const initial = createKalamburyPlayState(payload);
  const drawn = drawKalamburyTurnOrder(initial, payload, () => 0);
  const prepared = enterKalamburyPreparation(drawn, payload, () => 0);
  const acting = startKalamburyTurn(prepared);
  const scoring = enterKalamburyScore(acting);

  // Force golden-points event
  const stateWithEvent = { ...scoring, activeEvent: "golden-points" as const };
  const presenterId = scoring.turnOrderIds[0]!;
  const guesserId = scoring.turnOrderIds[1]!;

  const resolved = resolveKalamburyScore(stateWithEvent, payload, {
    guessedByPlayerId: guesserId,
    presenterBonus: false,
  }, () => 0);

  // With golden-points multiplier 2: presenter gets 2, guesser gets 2
  assert.equal(resolved.scores[presenterId], 2);
  assert.equal(resolved.scores[guesserId], 2);
});

test("resolveKalamburyScore transitions to FINISHED when last turn of last round completes", () => {
  const payload = createPayload();
  const initial = createKalamburyPlayState(payload);
  const drawn = drawKalamburyTurnOrder(initial, payload, () => 0);
  const prepared = enterKalamburyPreparation(drawn, payload, () => 0);
  const acting = startKalamburyTurn(prepared);
  const scoring = enterKalamburyScore(acting);

  // Force to last round, last turn in round
  const lastRoundState = {
    ...scoring,
    roundNumber: payload.modeSettings.rounds.roundCount,
    turnInRound: payload.players.length - 1,
  };

  const resolved = resolveKalamburyScore(lastRoundState, payload, {
    guessedByPlayerId: null,
    presenterBonus: false,
  }, () => 0);

  assert.equal(resolved.stage, "FINISHED");
});

test("rerollKalamburyPhrase returns same state when phraseChange is disabled", () => {
  const payload = createPayload();
  const payloadNoReroll: typeof payload = {
    ...payload,
    modeSettings: {
      ...payload.modeSettings,
      phraseChange: { enabled: false, changesPerPlayer: 1, rerollWordOnly: true, rerollWordAndCategory: false, antiCategoryStreak: false },
    },
  };

  const initial = createKalamburyPlayState(payloadNoReroll);
  const drawn = drawKalamburyTurnOrder(initial, payloadNoReroll, () => 0);
  const prepared = enterKalamburyPreparation(drawn, payloadNoReroll, () => 0);

  const rerolled = rerollKalamburyPhrase(prepared, payloadNoReroll);
  assert.equal(rerolled, prepared); // same reference — no change
});

test("rerollKalamburyPhrase decrements remaining count", () => {
  const payload = createPayload();
  const payloadWithReroll: typeof payload = {
    ...payload,
    modeSettings: {
      ...payload.modeSettings,
      phraseChange: { enabled: true, changesPerPlayer: 2, rerollWordOnly: true, rerollWordAndCategory: false, antiCategoryStreak: false },
    },
  };

  const initial = createKalamburyPlayState(payloadWithReroll);
  const drawn = drawKalamburyTurnOrder(initial, payloadWithReroll, () => 0);
  const prepared = enterKalamburyPreparation(drawn, payloadWithReroll, () => 0);

  const presenterId = prepared.turnOrderIds[0]!;
  const before = prepared.phraseChangeRemainingByPlayerId[presenterId];
  const rerolled = rerollKalamburyPhrase(prepared, payloadWithReroll);
  const after = rerolled.phraseChangeRemainingByPlayerId[presenterId];

  assert.equal(typeof before, "number");
  assert.equal(typeof after, "number");
  assert.equal((after as number), (before as number) - 1);
});
```

- [ ] **Step 2: Uruchom testy**

```bash
pnpm --filter @project-party/game-kalambury test 2>&1 | tail -10
```

Oczekiwane: pass

### 6b: firebase error handling

- [ ] **Step 3: Sprawdź obecne testy firebase**

```bash
grep -n "error\|fail\|reject\|push" "C:/Users/Mateo/Desktop/PROJECT PARTY/games/kalambury/src/transport/firebase.test.ts" | head -10
```

- [ ] **Step 4: Dodaj testy do firebase.test.ts**

**Ważne:** Export w `firebase.ts` to `createFirebaseAdapter` (nie `createFirebaseKalamburyAdapter`). Firebase wymaga prawdziwego SDK i konfiguracji env vars — nie da się go łatwo zmockować w testach jednostkowych.

Sprawdź jak istniejące testy w `firebase.test.ts` obsługują brak Firebase SDK, a następnie dodaj test przez warstwę `index.ts` (która jest już przetestowana):

```typescript
// Dodaj do firebase.test.ts — weryfikuje że warstwa index.ts odrzuca brakujący sessionCode
// dla trybu firebase, co jest jedynym przypadkiem który możemy przetestować bez Firebase SDK
test("createKalamburyTransportAsync rejects firebase mode when sessionCode is undefined", async () => {
  const { createKalamburyTransportAsync } = await import("./index.ts");
  await assert.rejects(
    () => createKalamburyTransportAsync("firebase", undefined, {
      send: async () => {},
      on: () => () => {},
    }),
    (err: unknown) => {
      // Powinno rzucić błąd z wzmianką o sessionCode
      return err instanceof Error && err.message.toLowerCase().includes("session");
    },
  );
});

test("createKalamburyTransportAsync rejects firebase mode when sessionCode is empty string", async () => {
  const { createKalamburyTransportAsync } = await import("./index.ts");
  await assert.rejects(
    () => createKalamburyTransportAsync("firebase", "", {
      send: async () => {},
      on: () => () => {},
    }),
    (err: unknown) => {
      return err instanceof Error;
    },
  );
});
```

> Jeśli istniejące testy firebase.test.ts już pokrywają te przypadki (sprawdź przez `grep -n "undefined\|empty" firebase.test.ts`), pomiń ten krok.

- [ ] **Step 5: Uruchom testy**

```bash
pnpm --filter @project-party/game-kalambury test 2>&1 | tail -10
```

Oczekiwane: pass

### 6c: setup-storage edge cases

- [ ] **Step 6: Dodaj testy do setup-storage.test.ts**

**Ważne przed pisaniem:** Sprawdź rzeczywiste sygnatury:
- `loadKalamburySetupDraft(storage, storageKey, baseState)` — trzy argumenty, zwraca `Promise<KalamburySetupState>`
- `saveKalamburySetupDraft(storage, storageKey, state)` — trzy argumenty, zwraca `Promise<void>`
- `KalamburyStorageLike` — ma `getItem`, `setItem`, opcjonalne `removeItem`
- Typ `KalamburySetupState` — używaj `createInitialKalamburySetupState()` z `setup-content.ts`

Istniejące testy używają `createMemoryStorage()` helper — użyj tego samego wzorca.

Dodaj na końcu `games/kalambury/src/shared/setup-storage.test.ts`:

```typescript
import { createInitialKalamburySetupState } from "./setup-content.ts";

test("loadKalamburySetupDraft returns baseState when storage returns null for the key", async () => {
  const baseState = createInitialKalamburySetupState();
  const storage = createMemoryStorage(); // pusta — getItem zwróci null
  const storageKey = createKalamburySetupDraftStorageKey("test-game");

  const result = await loadKalamburySetupDraft(storage, storageKey, baseState);
  assert.deepEqual(result, baseState);
});

test("loadKalamburySetupDraft returns baseState when storage is null", async () => {
  const baseState = createInitialKalamburySetupState();
  const result = await loadKalamburySetupDraft(null, "any-key", baseState);
  assert.deepEqual(result, baseState);
});

test("saveKalamburySetupDraft does not throw when storage is null", async () => {
  const state = createInitialKalamburySetupState();
  // Should resolve without throwing
  await saveKalamburySetupDraft(null, "any-key", state);
});

test("saveKalamburySetupDraft does not propagate when setItem throws", async () => {
  const throwingStorage = {
    getItem: () => Promise.resolve(null),
    setItem: () => { throw new Error("storage full"); },
    removeItem: () => {},
  };
  const state = createInitialKalamburySetupState();
  const storageKey = createKalamburySetupDraftStorageKey("test-game");
  // saveKalamburySetupDraft catches internal errors — should not reject
  await saveKalamburySetupDraft(throwingStorage, storageKey, state);
});
```

> **Uwaga:** Jeśli `createInitialKalamburySetupState` jest już importowane na górze pliku (sprawdź istniejące importy), nie dodawaj duplikatu import. Dodaj tylko nowe testy.

- [ ] **Step 7: Uruchom testy**

```bash
pnpm --filter @project-party/game-kalambury test 2>&1 | tail -10
```

Oczekiwane: pass

- [ ] **Step 8: Commit**

```bash
cd "C:/Users/Mateo/Desktop/PROJECT PARTY"
git add games/kalambury/src/runtime/state-machine.test.ts
git add games/kalambury/src/transport/firebase.test.ts
git add games/kalambury/src/shared/setup-storage.test.ts
git commit -m "test(kalambury): add edge case tests for state-machine, firebase, setup-storage"
```

---

## Weryfikacja końcowa

- [ ] **Uruchom pełne testy gry**

```bash
pnpm --filter @project-party/game-kalambury test 2>&1
```

Oczekiwane: 100% pass, 0 fail

- [ ] **Uruchom typecheck całego monorepo**

```bash
cd "C:/Users/Mateo/Desktop/PROJECT PARTY"
pnpm typecheck 2>&1 | grep "error TS" | grep -v "TS2688"
```

Oczekiwane: 0 linii output (jedynym dopuszczalnym błędem jest pre-existing `TS2688: Cannot find type definition file for 'node'` w kalambury tsconfig)

- [ ] **Sprawdź rozmiary plików**

```bash
wc -l "C:/Users/Mateo/Desktop/PROJECT PARTY/games/kalambury/src/host/PlayScreen.tsx" \
       "C:/Users/Mateo/Desktop/PROJECT PARTY/games/kalambury/src/host/SetupScreen.tsx"
```

Oczekiwane: PlayScreen.tsx < 600L

- [ ] **Potwierdź usunięcie starych plików**

```bash
ls "C:/Users/Mateo/Desktop/PROJECT PARTY/games/kalambury/src/host/" | grep -E "setup-modals|setup-sections"
```

Oczekiwane: brak output (pliki nie istnieją)

- [ ] **Potwierdź brak duplikacji w presenter bridge**

```bash
grep -rn "function resolveBroadcastChannel\|function getChannelName\|function createPresenterChannel" \
  "C:/Users/Mateo/Desktop/PROJECT PARTY/games/kalambury/src/shared/presenter/"
```

Oczekiwane: każda funkcja pojawia się dokładnie raz (w `channel-utils.ts`)

---

## Definition of Done (reminder)

- `pnpm --filter @project-party/game-kalambury test` — 100% pass
- `pnpm typecheck` — 0 nowych błędów poza pre-existing TS2688
- Żaden plik nie przekracza ~600 linii
- `setup-modals.tsx` i `setup-sections.tsx` nie istnieją
- Brak duplikacji `createPresenterChannel` / `resolveBroadcastChannel` / `getChannelName`
- `PRESENTER_REVEAL_PREVIEW_SECONDS` pochodzi z `settings/constants.ts`
