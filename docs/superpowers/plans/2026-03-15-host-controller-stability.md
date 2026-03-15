# Host–Controller Stability Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Naprawić i ujednolicić stabilność połączenia host–kontroler w Kalamburach i Tajniakach — wykrywanie rozłączeń, re-join po utracie sieci, i właściwa obsługa stanu UI.

**Architecture:** Kalambury używa dedykowanego `presenter-bridge` (1 kontroler per host), Tajniacy używają `bridge` z multi-device presence. Oba już mają ping/pong dodany wcześniej, ale brakuje testów dla heartbeat, UI nie reaguje spójnie na reconnect, a kontroler po powrocie do sieci nie zawsze re-dołącza automatycznie.

**Tech Stack:** TypeScript, React, BroadcastChannel / WebSocket transport, `node:test` dla testów jednostkowych

---

## Aktualny stan (co już istnieje)

### Kalambury (`presenter-bridge.ts`)
- ✅ `host-ping` / `controller-pong` co 4s, timeout 8s
- ✅ `readyRetry` co 1.2s po stronie kontrolera
- ✅ `host-probe` przy rehydracji hosta
- ❌ Brak testu dla heartbeat timeout
- ❌ Brak testu dla re-join po timeoucie
- ❌ `presenterReconnectRequired` blokuje grę ale nie ma auto-retry po powrocie

### Tajniacy (`bridge.ts`)
- ✅ `presence-ping` / `presence-pong` co 4s, timeout 8s
- ✅ Re-announce po `presence-ping` jeśli `!isAssigned`
- ❌ Brak testu dla heartbeat timeout
- ❌ `isAssigned` nie resetuje się po WS reconnect — kontroler może nie re-dołączyć
- ❌ Brak UI feedbacku gdy kapitan się rozłącza w trakcie gry

---

## Chunk 1: Testy heartbeat — Kalambury

### Task 1: Test — host wykrywa timeout kontrolera przez heartbeat

**Files:**
- Modify: `games/kalambury/src/shared/presenter-bridge.test.ts`

- [ ] **Step 1: Napisz failing test**

Dodaj na końcu pliku `presenter-bridge.test.ts`:

```typescript
test("host bridge detects controller disconnect via heartbeat timeout", async () => {
  FakeBroadcastChannel.reset();

  const pairingStates: Array<{ connected: boolean; pairedDeviceId: string | null }> = [];

  const hostBridge = createKalamburyPresenterHostBridge("HB01", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    pingIntervalMs: 50,
    pingTimeoutMs: 80,
    onPairingChange: (state) => pairingStates.push(state),
  });

  const controllerBridge = createKalamburyPresenterControllerBridge("HB01", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    deviceId: "device-hb",
  });

  controllerBridge.announceReady();
  // Controller connected — teraz niszczymy bridge bez wysyłania controller-disconnected
  // (symulacja utraty sieci — nie destroy(), tylko odcinamy kanał)
  controllerBridge.destroy();

  // Czekamy na heartbeat timeout
  await new Promise((resolve) => setTimeout(resolve, 200));

  hostBridge.destroy();

  assert.deepEqual(pairingStates, [
    { connected: true, pairedDeviceId: "device-hb" },
    { connected: false, pairedDeviceId: null },
  ]);
});
```

- [ ] **Step 2: Uruchom test żeby potwierdzić że failuje**

```bash
pnpm --filter @project-party/game-kalambury test 2>&1 | grep -A5 "heartbeat"
```

Oczekiwane: FAIL — `pairingStates` ma tylko 1 element (disconnect nie został wykryty)

**Uwaga:** Test może przejść jeśli heartbeat już działa. Jeśli tak — przejdź dalej.

- [ ] **Step 3: Uruchom wszystkie testy kalambury żeby upewnić się że nic nie psujemy**

```bash
pnpm --filter @project-party/game-kalambury test
```

- [ ] **Step 4: Commit**

```bash
git add games/kalambury/src/shared/presenter-bridge.test.ts
git commit -m "test(kalambury): heartbeat timeout detection"
```

---

### Task 2: Test — kontroler re-joinuje po heartbeat timeout

**Files:**
- Modify: `games/kalambury/src/shared/presenter-bridge.test.ts`

- [ ] **Step 1: Napisz failing test**

```typescript
test("controller bridge re-pairs after host heartbeat timeout clears the slot", async () => {
  FakeBroadcastChannel.reset();

  const pairingStates: Array<{ connected: boolean; pairedDeviceId: string | null }> = [];

  const hostBridge = createKalamburyPresenterHostBridge("HB02", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    pingIntervalMs: 50,
    pingTimeoutMs: 80,
    onPairingChange: (state) => pairingStates.push(state),
  });

  // Kontroler 1 łączy się
  const controller1 = createKalamburyPresenterControllerBridge("HB02", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    deviceId: "device-hb2",
  });
  controller1.announceReady();

  // Symulujemy utratę sieci — niszczymy bez disconnect message
  controller1.destroy();

  // Czekamy na heartbeat timeout hosta
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Kontroler 2 dołącza po zwolnieniu slotu
  const controller2 = createKalamburyPresenterControllerBridge("HB02", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    deviceId: "device-hb3",
  });
  controller2.announceReady();

  await new Promise((resolve) => setTimeout(resolve, 20));

  hostBridge.destroy();
  controller2.destroy();

  assert.deepEqual(pairingStates, [
    { connected: true, pairedDeviceId: "device-hb2" },
    { connected: false, pairedDeviceId: null },
    { connected: true, pairedDeviceId: "device-hb3" },
  ]);
});
```

- [ ] **Step 2: Uruchom test**

```bash
pnpm --filter @project-party/game-kalambury test 2>&1 | grep -A5 "re-pairs"
```

- [ ] **Step 3: Uruchom wszystkie testy**

```bash
pnpm --filter @project-party/game-kalambury test
```

- [ ] **Step 4: Commit**

```bash
git add games/kalambury/src/shared/presenter-bridge.test.ts
git commit -m "test(kalambury): controller re-join after heartbeat slot release"
```

---

## Chunk 2: Naprawa heartbeat — Kalambury

### Task 3: Napraw problem z `destroy()` — powinien symulować utratę sieci w testach

**Files:**
- Modify: `games/kalambury/src/shared/presenter-bridge.ts`

Aktualny `destroy()` kontrolera wysyła `controller-disconnected` — to poprawne zachowanie przy świadomym wyjściu. Ale w teście heartbeat potrzebujemy symulować utratę sieci bez wysyłania wiadomości.

- [ ] **Step 1: Sprawdź czy testy z Chunk 1 przechodzą bez zmian**

```bash
pnpm --filter @project-party/game-kalambury test
```

Jeśli **wszystkie przechodzą** — heartbeat działa poprawnie, pomiń Task 3 i przejdź do Task 4.

Jeśli **Task 1 lub Task 2 failują** — kontynuuj poniżej.

- [ ] **Step 2: Dodaj metodę `simulateNetworkDrop()` do controller bridge (tylko dla testów)**

W `createKalamburyPresenterControllerBridge`, w obiekcie zwracanym przez funkcję, dodaj:

```typescript
/** Only for testing: drops connection without sending controller-disconnected */
_dropWithoutDisconnect() {
  if (isDestroyed) return;
  isDestroyed = true;
  stopReadyRetry();
  unsubscribe();
  if (shouldCloseChannel) {
    channel?.close?.();
  }
},
```

- [ ] **Step 3: Zaktualizuj testy z Task 1 i Task 2**

Zamień `controllerBridge.destroy()` / `controller1.destroy()` na `controllerBridge._dropWithoutDisconnect()` / `controller1._dropWithoutDisconnect()` w testach heartbeat.

- [ ] **Step 4: Uruchom wszystkie testy**

```bash
pnpm --filter @project-party/game-kalambury test
```

Oczekiwane: wszystkie PASS

- [ ] **Step 5: Commit**

```bash
git add games/kalambury/src/shared/presenter-bridge.ts games/kalambury/src/shared/presenter-bridge.test.ts
git commit -m "fix(kalambury): add _dropWithoutDisconnect for heartbeat test simulation"
```

---

### Task 4: Napraw re-join — kontroler który stracił połączenie powinien auto-retry po powrocie

**Files:**
- Modify: `games/kalambury/src/shared/presenter-bridge.ts`
- Modify: `games/kalambury/src/host/PlayScreen.tsx`

Aktualny problem: gdy host usuwa `pairedDeviceId` przez heartbeat timeout, stary kontroler (jeśli wróci do sieci) nadal ma `isDestroyed = false` i `readyRetryTimer = null` — nie będzie ponownie próbował.

Kontroler powinien zrestartować `readyRetry` gdy otrzyma `host-ping` a nie jest connected.

- [ ] **Step 1: Napisz failing test**

```typescript
test("controller bridge re-announces when it receives host-ping while not connected", async () => {
  FakeBroadcastChannel.reset();

  const controllerStates: string[] = [];
  const pairingStates: Array<{ connected: boolean }> = [];

  const hostBridge = createKalamburyPresenterHostBridge("REJOIN2", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    pingIntervalMs: 50,
    pingTimeoutMs: 80,
    onPairingChange: (state) => pairingStates.push({ connected: state.connected }),
  });

  const controllerBridge = createKalamburyPresenterControllerBridge("REJOIN2", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    deviceId: "device-rj",
    onConnectionStateChange: (state) => controllerStates.push(state),
  });

  controllerBridge.announceReady();
  await new Promise((resolve) => setTimeout(resolve, 20));

  // Host traci kontroler (symulacja timeout po stronie hosta)
  // Robimy to manualnie przez internal state — bezpośredni disconnect
  hostBridge.disconnectPresenterDevice();
  await new Promise((resolve) => setTimeout(resolve, 10));

  // Host pinguje znowu — kontroler powinien się re-announce
  await new Promise((resolve) => setTimeout(resolve, 120));

  hostBridge.destroy();
  controllerBridge.destroy();

  // Powinny być 2x connected
  const connectedCount = pairingStates.filter((s) => s.connected).length;
  assert.ok(connectedCount >= 2, `Expected >= 2 connected events, got ${connectedCount}`);
});
```

- [ ] **Step 2: Uruchom test**

```bash
pnpm --filter @project-party/game-kalambury test 2>&1 | grep -A5 "re-announces"
```

- [ ] **Step 3: Zaimplementuj re-announce po host-ping**

W `createKalamburyPresenterControllerBridge`, w obsłudze `host-ping`:

```typescript
if (message.type === "host-ping" && message.deviceId === deviceId) {
  void channel?.postMessage({
    type: "controller-pong",
    deviceId,
  } satisfies KalamburyPresenterMessage);
}
```

Zmień na:

```typescript
if (message.type === "host-ping" && message.deviceId === deviceId) {
  void channel?.postMessage({
    type: "controller-pong",
    deviceId,
  } satisfies KalamburyPresenterMessage);
  // Jeśli host pyta ale my jesteśmy w stanie pending (np. po host-reset),
  // ponów ready żeby ponownie sparować
  if (!isDestroyed) {
    postReady();
  }
}
```

**Uwaga:** `postReady()` jest idempotentne — host zignoruje jeśli już sparowany z tym samym `deviceId` (odświeży `lastPongTime`).

- [ ] **Step 4: Uruchom wszystkie testy**

```bash
pnpm --filter @project-party/game-kalambury test
```

- [ ] **Step 5: Commit**

```bash
git add games/kalambury/src/shared/presenter-bridge.ts games/kalambury/src/shared/presenter-bridge.test.ts
git commit -m "fix(kalambury): controller re-announces on host-ping when not paired"
```

---

## Chunk 3: Testy heartbeat — Tajniacy

### Task 5: Test — host wykrywa timeout kapitana przez heartbeat

**Files:**
- Modify: `games/tajniacy/src/shared/bridge.ts` (dodaj opcje konfigurowalne dla testów)
- Utwórz: `games/tajniacy/src/shared/bridge.test.ts`

Aktualnie Tajniacy nie mają pliku testowego dla bridge. Trzeba go stworzyć.

- [ ] **Step 1: Sprawdź czy istnieje plik testowy**

```bash
ls games/tajniacy/src/shared/
```

- [ ] **Step 2: Utwórz `bridge.test.ts` z FakeBroadcastChannel**

```typescript
// games/tajniacy/src/shared/bridge.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import { createTajniacyBridge } from "./bridge.ts";

class FakeBroadcastChannel {
  static channels = new Map<string, Set<FakeBroadcastChannel>>();

  static reset() {
    FakeBroadcastChannel.channels.clear();
  }

  name: string;
  onmessage: ((event: MessageEvent<unknown>) => void) | null = null;
  #closed = false;

  constructor(name: string) {
    this.name = name;
    const peers = FakeBroadcastChannel.channels.get(name) ?? new Set();
    peers.add(this);
    FakeBroadcastChannel.channels.set(name, peers);
  }

  postMessage(message: unknown) {
    if (this.#closed) return;
    const peers = FakeBroadcastChannel.channels.get(this.name) ?? new Set();
    for (const peer of peers) {
      if (peer === this || peer.#closed || !peer.onmessage) continue;
      peer.onmessage({ data: message } as MessageEvent<unknown>);
    }
  }

  close() {
    this.#closed = true;
    const peers = FakeBroadcastChannel.channels.get(this.name);
    peers?.delete(this);
    if (peers?.size === 0) FakeBroadcastChannel.channels.delete(this.name);
  }
}

function createFakeChannel(sessionCode: string) {
  const bc = new FakeBroadcastChannel(`project-party.tajniacy.${sessionCode.toUpperCase()}`);
  let handler: ((msg: unknown) => void) | null = null;
  bc.onmessage = (e) => handler?.(e.data);
  return {
    postMessage(msg: unknown) { bc.postMessage(msg); },
    subscribe(h: (msg: unknown) => void) {
      handler = h;
      return () => { handler = null; };
    },
    close() { bc.close(); },
  } as Parameters<typeof createTajniacyBridge>[2]["channel"] & {};
}
```

- [ ] **Step 3: Dodaj test podstawowego connect/disconnect**

```typescript
test("tajniacy bridge: captain connects and host sees presence", () => {
  FakeBroadcastChannel.reset();

  const presenceUpdates: Array<{ captainRed: boolean; captainBlue: boolean }> = [];

  const hostBridge = createTajniacyBridge("T01", "host", {
    channel: createFakeChannel("T01") as any,
    onPresenceUpdate: (p) => presenceUpdates.push({ captainRed: p.captainRed, captainBlue: p.captainBlue }),
  });

  const captainBridge = createTajniacyBridge("T01", "captain-red", {
    channel: createFakeChannel("T01") as any,
  });

  captainBridge?.announceReady("captain-red");

  hostBridge?.destroy();
  captainBridge?.destroy();

  assert.ok(presenceUpdates.some((p) => p.captainRed), "captainRed should be present");
});
```

**Uwaga:** `createTajniacyBridge` przyjmuje `channel` bezpośrednio w options. Jednak aktualnie nie ma sposobu przekazania `FakeBroadcastChannel` — bridge tworzy channel wewnętrznie przez `createBroadcastChannel`. Przejdź do Task 6 żeby to naprawić, potem wróć do testów.

- [ ] **Step 4: Commit pliku testowego (nawet bez przechodzących testów)**

```bash
git add games/tajniacy/src/shared/bridge.test.ts
git commit -m "test(tajniacy): add bridge test scaffold"
```

---

## Chunk 4: Naprawa testowalności i heartbeat — Tajniacy

### Task 6: Uczyń bridge testowalnym — dodaj opcję `BroadcastChannelImpl`

**Files:**
- Modify: `games/tajniacy/src/shared/bridge.ts`

Tajniacy bridge nie ma opcji `BroadcastChannelImpl` jak Kalambury — nie można go przetestować jednostkowo bez prawdziwego `BroadcastChannel`.

- [ ] **Step 1: Dodaj `BroadcastChannelImpl` i konfigurowalne timery do `BridgeOptions`**

W `bridge.ts`, zmień typ `BridgeOptions`:

```typescript
type BridgeOptions = {
  channel?: TajniacyChannel;
  BroadcastChannelImpl?: new (name: string) => {
    onmessage: ((event: MessageEvent<unknown>) => void) | null;
    postMessage: (message: unknown) => void;
    close: () => void;
  };
  pingIntervalMs?: number;
  pingTimeoutMs?: number;
  onStateSync?: (state: MatchState) => void;
  // ... reszta bez zmian
};
```

- [ ] **Step 2: Użyj `BroadcastChannelImpl` w `createBroadcastChannel`**

Zmień sygnaturę `createBroadcastChannel` żeby przyjmowała opcjonalny impl:

```typescript
function createBroadcastChannel(
  sessionCode: string,
  BroadcastChannelImpl?: BridgeOptions["BroadcastChannelImpl"]
): TajniacyChannel | null {
  const BC = BroadcastChannelImpl ?? (typeof BroadcastChannel !== "undefined" ? BroadcastChannel : null);
  if (!BC) return null;

  const bc = new BC(`project-party.tajniacy.${sessionCode.toUpperCase()}`);
  let handler: ((message: TajniacyBridgeMessage) => void) | null = null;

  (bc as any).onmessage = (event: MessageEvent<TajniacyBridgeMessage>) => {
    handler?.(event.data);
  };

  return {
    postMessage(message) { bc.postMessage(message); },
    subscribe(h) {
      handler = h;
      return () => { handler = null; };
    },
    close() { bc.close(); },
  };
}
```

- [ ] **Step 3: Przekaż `BroadcastChannelImpl` do `createBroadcastChannel`**

```typescript
const rawChannel = options.channel ?? createBroadcastChannel(sessionCode, options.BroadcastChannelImpl);
```

- [ ] **Step 4: Użyj konfigurowalnych timerów dla ping interval**

```typescript
const PING_INTERVAL_MS = options.pingIntervalMs ?? 4000;
const TIMEOUT_MS = options.pingTimeoutMs ?? 8000;
```

- [ ] **Step 5: Uruchom istniejące testy Tajniaków (jeśli są)**

```bash
pnpm --filter @project-party/game-tajniacy test
```

- [ ] **Step 6: Commit**

```bash
git add games/tajniacy/src/shared/bridge.ts
git commit -m "feat(tajniacy): add BroadcastChannelImpl and configurable ping timers for testing"
```

---

### Task 7: Napisz testy heartbeat dla Tajniaków

**Files:**
- Modify: `games/tajniacy/src/shared/bridge.test.ts`

- [ ] **Step 1: Zaktualizuj FakeBroadcastChannel w test file żeby pasował do nowej sygnatury**

Zmień `createFakeChannel` na użycie `FakeBroadcastChannel` bezpośrednio przez `BroadcastChannelImpl`:

```typescript
test("tajniacy bridge: host detects captain disconnect via heartbeat timeout", async () => {
  FakeBroadcastChannel.reset();

  const disconnects: string[] = [];
  const presenceUpdates: Array<{ captainRed: boolean }> = [];

  const hostBridge = createTajniacyBridge("HBT01", "host", {
    BroadcastChannelImpl: FakeBroadcastChannel as any,
    pingIntervalMs: 50,
    pingTimeoutMs: 80,
    onPresenceUpdate: (p) => presenceUpdates.push({ captainRed: p.captainRed }),
    onCaptainDisconnect: () => disconnects.push("captain-disconnected"),
  });

  const captainBridge = createTajniacyBridge("HBT01", "captain-red", {
    BroadcastChannelImpl: FakeBroadcastChannel as any,
  });

  captainBridge?.announceReady("captain-red");
  await new Promise((resolve) => setTimeout(resolve, 20));

  // Symuluj utratę sieci — zamknij bridge bez wysyłania wiadomości
  captainBridge?.destroy();

  // Czekaj na heartbeat timeout
  await new Promise((resolve) => setTimeout(resolve, 200));

  hostBridge?.destroy();

  assert.ok(disconnects.includes("captain-disconnected"), "host should detect captain disconnect");
  assert.ok(presenceUpdates.some((p) => !p.captainRed), "captainRed should be false after timeout");
});
```

- [ ] **Step 2: Uruchom test**

```bash
pnpm --filter @project-party/game-tajniacy test 2>&1 | grep -A5 "heartbeat"
```

- [ ] **Step 3: Test — re-join po timeoucie**

```typescript
test("tajniacy bridge: captain can re-join after heartbeat timeout frees the slot", async () => {
  FakeBroadcastChannel.reset();

  let captainRedSeenCount = 0;
  const hostBridge = createTajniacyBridge("HBT02", "host", {
    BroadcastChannelImpl: FakeBroadcastChannel as any,
    pingIntervalMs: 50,
    pingTimeoutMs: 80,
    onPresenceUpdate: (p) => {
      if (p.captainRed) captainRedSeenCount++;
    },
  });

  const captain1 = createTajniacyBridge("HBT02", "captain-red", {
    BroadcastChannelImpl: FakeBroadcastChannel as any,
  });

  captain1?.announceReady("captain-red");
  await new Promise((resolve) => setTimeout(resolve, 20));
  captain1?.destroy(); // sieć pada

  await new Promise((resolve) => setTimeout(resolve, 200)); // timeout

  const captain2 = createTajniacyBridge("HBT02", "captain-red", {
    BroadcastChannelImpl: FakeBroadcastChannel as any,
  });
  captain2?.announceReady("captain-red");
  await new Promise((resolve) => setTimeout(resolve, 20));

  hostBridge?.destroy();
  captain2?.destroy();

  assert.ok(captainRedSeenCount >= 2, `Expected >= 2 captainRed presence events, got ${captainRedSeenCount}`);
});
```

- [ ] **Step 4: Uruchom wszystkie testy**

```bash
pnpm --filter @project-party/game-tajniacy test
```

- [ ] **Step 5: Commit**

```bash
git add games/tajniacy/src/shared/bridge.test.ts
git commit -m "test(tajniacy): heartbeat timeout and captain re-join tests"
```

---

## Chunk 5: UI — Kalambury reconnect feedback

### Task 8: Pokaż status połączenia kontrolera w PlayScreen

**Files:**
- Modify: `games/kalambury/src/host/PlayScreen.tsx`

Aktualnie `presenterReconnectRequired` blokuje przejście do fazy ACT ale nie ma widocznego statusu "Czekam na ponowne połączenie z telefonem prezentera".

- [ ] **Step 1: Znajdź gdzie renderowany jest `presenterReconnectRequired` w PlayScreen**

```bash
grep -n "presenterReconnectRequired\|presenterPairState" games/kalambury/src/host/PlayScreen.tsx | head -20
```

- [ ] **Step 2: Dodaj widoczny indicator stanu połączenia w topbarze gdy kontroler jest rozłączony**

W topbarze (`kalambury-playtopbar`), obok stage pill, dodaj:

```tsx
{Boolean(setupPayload.presenterDevice?.enabled) && (
  <span
    className={
      presenterPairState.connected
        ? "kalambury-presenter-status kalambury-presenter-status--connected"
        : "kalambury-presenter-status kalambury-presenter-status--disconnected"
    }
    aria-label={
      presenterPairState.connected
        ? "Telefon prezentera połączony"
        : "Czekam na telefon prezentera..."
    }
  >
    <span className="material-symbols-outlined">
      {presenterPairState.connected ? "smartphone" : "smartphone_off"}
    </span>
  </span>
)}
```

- [ ] **Step 3: Dodaj style CSS**

W `games/kalambury/src/styles.css`:

```css
.kalambury-presenter-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.kalambury-presenter-status--connected {
  background: rgba(56, 232, 100, 0.15);
  color: rgba(56, 232, 100, 0.9);
}

.kalambury-presenter-status--disconnected {
  background: rgba(232, 56, 80, 0.15);
  color: rgba(232, 56, 80, 0.9);
  animation: kalambury-pulse 1.5s ease-in-out infinite;
}

@keyframes kalambury-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
```

- [ ] **Step 4: Uruchom dev server i sprawdź wizualnie**

```bash
pnpm dev
```

Otwórz grę Kalambury z włączonym presenterem i sprawdź czy ikona pojawia się w topbarze.

- [ ] **Step 5: Commit**

```bash
git add games/kalambury/src/host/PlayScreen.tsx games/kalambury/src/styles.css
git commit -m "feat(kalambury): show presenter connection status in topbar"
```

---

## Chunk 6: UI — Tajniacy reconnect feedback

### Task 9: Pokaż status połączenia kapitanów w HostApp

**Files:**
- Modify: `games/tajniacy/src/host/HostApp.tsx`
- Modify: `games/tajniacy/src/host/PlayScreen.tsx` (jeśli istnieje)

- [ ] **Step 1: Sprawdź jak HostApp używa presence**

```bash
grep -n "onPresenceUpdate\|presence\|captainRed\|captainBlue" games/tajniacy/src/host/HostApp.tsx | head -20
```

- [ ] **Step 2: Sprawdź czy PlayScreen Tajniaków ma status kapitanów**

```bash
grep -n "presence\|captain\|disconnect" games/tajniacy/src/host/PlayScreen.tsx | head -20
```

- [ ] **Step 3: Dodaj visual indicator rozłączenia kapitana podczas gry**

Jeśli kapitan jest rozłączony (`!presence.captainRed` lub `!presence.captainBlue`) podczas aktywnej rundy — pokaż banner z informacją "Kapitan czerwonych się rozłączył. Czekamy na powrót...".

Implementacja zależy od struktury PlayScreen — dopasuj do istniejących wzorców w kodzie.

- [ ] **Step 4: Uruchom testy**

```bash
pnpm --filter @project-party/game-tajniacy test
```

- [ ] **Step 5: Commit**

```bash
git add games/tajniacy/src/host/HostApp.tsx games/tajniacy/src/host/PlayScreen.tsx
git commit -m "feat(tajniacy): show captain disconnect status during game"
```

---

## Chunk 7: Deploy i weryfikacja

### Task 10: Uruchom wszystkie testy i zdeplojuj

- [ ] **Step 1: Uruchom testy Kalambury**

```bash
pnpm --filter @project-party/game-kalambury test
```

Oczekiwane: wszystkie PASS

- [ ] **Step 2: Uruchom testy Tajniaków**

```bash
pnpm --filter @project-party/game-tajniacy test
```

Oczekiwane: wszystkie PASS

- [ ] **Step 3: Zbuduj web**

```bash
pnpm --filter @project-party/web build
```

- [ ] **Step 4: Deploy na Cloudflare**

```bash
pnpm cf:deploy:worker
pnpm cf:deploy:web
```

- [ ] **Step 5: Ręczna weryfikacja na produkcji**

1. Otwórz grę z 2 urządzeniami (host + telefon)
2. Połącz kontroler
3. Odłącz telefon od Wi-Fi na ~10s
4. Sprawdź czy host po ~8s pokazuje rozłączenie
5. Włącz z powrotem Wi-Fi
6. Sprawdź czy kontroler auto-powraca do gry

- [ ] **Step 6: Commit końcowy**

```bash
git add -A
git commit -m "feat: host-controller stability — heartbeat tests, re-join, UI feedback"
```
