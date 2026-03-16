# Kalambury Transport & Presenter Bridge Refactor

**Date:** 2026-03-16
**Scope:** Transport layer, presenter-bridge, createRuntime, usePresenterHostBridge hook, PlayScreen, SetupScreen

---

## Problem

Warstwa komunikacji Kalambury urosła organicznie i ma kilka kategorii problemów:

1. **Błędy logiczne** — duplikaty message types, `bridge.destroy()` wysyła disconnect bez deviceId, brak heartbeatu na reconnect path (naprawiony hotfixem, teraz formalizowany)
2. **Architektura** — `presenter-bridge.ts` (544 linie) łączy dwie niezależne odpowiedzialności, logika bridge rozrzucona po PlayScreen/SetupScreen jako lokalne useEffect
3. **Robustność** — brak rate limiting na reroll, brak auto-reconnect po `host-reset`, brak error handling w firebase destroy
4. **Code smell** — zagnieżdżony `setTimeout` w `setInterval` w heartbeat, `_dropWithoutDisconnect` używane tylko w testach, redundantne `postReady()` przy `host-ping`, `playStateRef`/`presenterRevealStageRef` jako workaround na stale closures

---

## Cele

- Działać bezbłędnie (disconnect wykrywany, reconnect działa, timer pauzuje)
- Kod posprzątany i łatwy do rozszerzania
- Każdy plik ma jedną jasną odpowiedzialność
- Testy pokrywają host i controller bridge osobno

---

## Architektura po refactorze

### 1. Transport layer — bez zmian strukturalnych

`games/kalambury/src/transport/` zostaje bez zmian poza:
- `firebase.ts`: try/catch w `destroy()`, console.error na failed push

### 2. Presenter bridge → rozdzielony na 3 pliki

```
games/kalambury/src/shared/presenter/
  types.ts                  ← message types, PairState, Channel interface
  host-bridge.ts            ← createKalamburyPresenterHostBridge()
  host-bridge.test.ts       ← testy izolowane dla host bridge
  controller-bridge.ts      ← createKalamburyPresenterControllerBridge()
  controller-bridge.test.ts ← testy izolowane dla controller bridge
```

Stary `shared/presenter-bridge.ts` i `shared/presenter-bridge.test.ts` — usunięte po migracji wszystkich importów.

### 3. Nowy hook

```
games/kalambury/src/host/hooks/
  usePresenterHostBridge.ts
```

### 4. Zaktualizowane pliki

- `runtime/createRuntime.ts` — aktualizacja importów
- `host/SetupScreen.tsx` — używa `usePresenterHostBridge`
- `host/PlayScreen.tsx` — używa `usePresenterHostBridge`, cleanup refs
- `controller/ControllerApp.tsx` — aktualizacja importów

---

## Szczegóły komponentów

### `shared/presenter/types.ts`

Naprawia duplikaty przez podział na dwa union types:

```ts
export type HostToControllerMessage =
  | { type: "host-probe"; deviceId: string }
  | { type: "host-ping"; deviceId: string }
  | { type: "host-paired"; deviceId: string }
  | { type: "host-rejected"; deviceId: string }
  | { type: "host-reset" }
  | { type: "host-preview-start"; deviceId: string }
  | { type: "host-preview-finish"; deviceId: string }
  | { type: "host-preview-reset"; deviceId: string }
  | ({ type: "presenter-phrase"; deviceId: string } & KalamburyPresenterPhrasePayload)
  | { type: "presenter-clear"; deviceId: string | null };

export type ControllerToHostMessage =
  | { type: "controller-ready"; deviceId: string }
  | { type: "controller-disconnected"; deviceId: string }
  | { type: "controller-pong"; deviceId: string }
  | { type: "controller-reveal-request"; deviceId: string }
  | { type: "controller-reroll-request"; deviceId: string };

export type KalamburyPresenterMessage = HostToControllerMessage | ControllerToHostMessage;
```

Pozostałe typy z obecnego `presenter-bridge.ts` przenoszone tu bez zmian:
- `KalamburyPresenterPhrasePayload`
- `KalamburyPresenterPairState`
- `KalamburyPresenterPreviewState`
- `KalamburyPresenterChannel`
- `HostBridgeOptions`
- `ControllerBridgeOptions`

### `shared/presenter/host-bridge.ts`

Naprawy względem obecnego kodu:

**Heartbeat — uproszczona logika (usunięcie zagnieżdżonego setTimeout):**
```ts
// PRZED: setTimeout w setInterval sprawdzający timeout po PING_INTERVAL_MS/2
// PO: jeden setInterval, sprawdza timeout i pinguje w tym samym ticku
pingInterval = setInterval(() => {
  if (!pairedDeviceId) { stopHeartbeat(); return; }
  if (Date.now() - lastPongTime > PING_TIMEOUT_MS) {
    pairedDeviceId = null;
    stopHeartbeat();
    emitPairingChange(false);
    return;
  }
  void channel.postMessage({ type: "host-ping", deviceId: pairedDeviceId });
}, PING_INTERVAL_MS);
```

**`destroy()` wysyła disconnect tylko do paired device:**
```ts
destroy() {
  clearProbeTimer();
  stopHeartbeat();
  unsubscribe();
  if (pairedDeviceId) {
    void channel?.postMessage({ type: "controller-disconnected", deviceId: pairedDeviceId });
  }
  if (shouldCloseChannel) channel?.close?.();
}
```

**`startHeartbeat()` w obu ścieżkach `controller-ready`** (nowy device i reconnect) — formalizacja hotfixu.

**Error logging na failed postMessage** — Promise rejections logowane przez console.error.

**Usunięcie:** `_dropWithoutDisconnect` (używane tylko w testach, zastąpione przez `destroy()`).

### `shared/presenter/controller-bridge.ts`

**Usunięcie redundantnego `postReady()` przy `host-ping`:**
```ts
// PRZED: host-ping → pong + postReady() (niepotrzebne przy aktywnym heartbeat)
// PO: host-ping → tylko pong
if (message.type === "host-ping" && message.deviceId === deviceId) {
  void channel.postMessage({ type: "controller-pong", deviceId });
}
```

**Walidacja state transitions:**
```ts
// host-paired ignorowane jeśli nie w stanie "pending"
if (message.type === "host-paired" && message.deviceId === deviceId) {
  if (connectionState === "pending") setConnectionState("connected");
}
```

**Auto-reconnect po `host-reset`:**
```ts
// PRZED: host-reset resetuje state ale nie startuje retry → controller "stuck"
// PO: setConnectionState("pending") automatycznie startuje readyRetry
if (message.type === "host-reset") {
  setConnectionState("pending");
  onPreviewStateChange?.("pending-reveal");
  onPhraseChange?.(null);
}
```

**Usunięcie:** `_dropWithoutDisconnect`.

### `host/hooks/usePresenterHostBridge.ts`

Nowy hook wyciągający logikę bridge z komponentów:

```ts
type UsePresenterHostBridgeOptions = {
  sessionCode: string | undefined;
  enabled: boolean;
  initialPairedDeviceId: string | null;
  channel: KalamburyPresenterChannel | undefined;
  pingIntervalMs?: number;
  pingTimeoutMs?: number;
  onRevealRequest?: () => void;
  onRerollRequest?: () => void;
};

type UsePresenterHostBridgeResult = {
  pairState: KalamburyPresenterPairState;
  bridge: ReturnType<typeof createKalamburyPresenterHostBridge> | null;
};

function usePresenterHostBridge(options: UsePresenterHostBridgeOptions): UsePresenterHostBridgeResult;
```

Implementacja:
- Tworzy bridge gdy `enabled && sessionCode`, niszczy przy cleanup
- `onRevealRequest` i `onRerollRequest` trzymane w `useRef` — bez stale closures, bez restartowania bridge
- Zarządza `pairState` state wewnętrznie
- Zwraca `bridge` (stable ref) i `pairState`

### `host/PlayScreen.tsx`

**Używa `usePresenterHostBridge`:**
```ts
const { pairState: presenterPairState, bridge: presenterBridge } = usePresenterHostBridge({
  sessionCode,
  enabled: setupPayload.presenterDevice?.enabled ?? false,
  initialPairedDeviceId: setupPayload.presenterDevice?.pairedDeviceId ?? null,
  channel: transportChannel,
  pingIntervalMs: 3000,
  pingTimeoutMs: 5000,
  onRevealRequest: () => { /* reveal logic */ },
  onRerollRequest: () => { /* reroll logic z rate limiting */ },
});
```

**Usunięcie:**
- `playStateRef` i `presenterRevealStageRef` — stale closure workaround niepotrzebny
- `presenterBridgeRef` — zarządzany przez hook
- Bridge useEffect (415–467) — przeniesiony do hooka

**Rate limiting na reroll:**
```ts
const lastRerollRef = useRef(0);
onRerollRequest: () => {
  if (Date.now() - lastRerollRef.current < 1000) return;
  lastRerollRef.current = Date.now();
  setPlayState(current => current ? rerollKalamburyPhrase(current, setupPayload) : current);
}
```

**Timer effect deps — uproszczenie:**
```ts
// PRZED: [playState, presenterReconnectRequired] — rerenderuje co sekundę
// PO: [playState?.stage, presenterReconnectRequired] — tylko przy zmianie stage
}, [playState?.stage, presenterReconnectRequired]);
```

Uwaga: `setPlayState` z funkcyjnym updater wewnątrz intervalu nadal ma dostęp do aktualnego stanu — deps może używać stage zamiast całego obiektu.

### `host/SetupScreen.tsx`

**Używa `usePresenterHostBridge`** — usuwa lokalny `presenterBridgeRef` i bridge useEffect.

**Reset `pairedPresenterDeviceId` gdy disable:**
```ts
useEffect(() => {
  if (!presenterDeviceEnabled) {
    setPairedPresenterDeviceId(null);
  }
}, [presenterDeviceEnabled]);
```

**`disconnectPresenterDevice` bez async race:**
```ts
function disconnectPresenterDevice() {
  presenterBridge?.disconnectPresenterDevice();
  setPresenterDeviceConnected(false);
  setPairedPresenterDeviceId(null);
  setIsPresenterQrOpen(false);
  void clearReusableSession(); // fire-and-forget
}
```

### `controller/ControllerApp.tsx`

Aktualizacja importów z nowych ścieżek. Brak zmian logicznych poza tym że `_dropWithoutDisconnect` znika z interfejsu.

---

## Testy

### `host-bridge.test.ts`
- Parowanie nowego device
- Reconnect znane device (startuje heartbeat)
- Heartbeat timeout → disconnect
- `controller-disconnected` → natychmiastowy disconnect
- `destroy()` wysyła disconnect tylko do paired device
- `destroy()` bez paired device — brak wiadomości

### `controller-bridge.test.ts`
- `announceReady()` → readyRetry co 1.2s
- `host-paired` w stanie pending → connected, stop retry
- `host-paired` w stanie connected → ignorowane
- `host-ping` → tylko pong (bez postReady)
- `host-reset` → pending + auto-reconnect retry
- `destroy()` → wysyła controller-disconnected

---

## Kolejność implementacji

1. `shared/presenter/types.ts`
2. `shared/presenter/host-bridge.ts` + `host-bridge.test.ts`
3. `shared/presenter/controller-bridge.ts` + `controller-bridge.test.ts`
4. `host/hooks/usePresenterHostBridge.ts`
5. `host/PlayScreen.tsx` — integracja hooka, cleanup
6. `host/SetupScreen.tsx` — integracja hooka, cleanup
7. `controller/ControllerApp.tsx` — aktualizacja importów
8. `runtime/createRuntime.ts` — aktualizacja importów
9. Usunięcie `shared/presenter-bridge.ts` i `shared/presenter-bridge.test.ts`
10. `transport/firebase.ts` — error handling

---

## Czego nie zmieniamy

- Struktura `transport/` (broadcast, do-ws, index, storage, types) — czyste, nie dotykamy
- Logika game state machine (`state-machine.ts`) — poza zakresem
- UI/animacje PlayScreen — poza zakresem
- Protokół komunikacji (message types i flow) — tylko naprawiamy duplikaty
