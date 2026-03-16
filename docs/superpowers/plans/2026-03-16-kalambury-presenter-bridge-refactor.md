# Kalambury Presenter Bridge Refactor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `shared/presenter-bridge.ts` into focused files, extract a `usePresenterHostBridge` hook, and apply targeted fixes (heartbeat simplification, host-reset auto-reconnect, reroll rate limiting, async race fix in SetupScreen).

**Architecture:** New `shared/presenter/` directory holds `types.ts`, `host-bridge.ts`, `controller-bridge.ts` and their tests. A new `host/hooks/usePresenterHostBridge.ts` encapsulates bridge lifecycle for React components. PlayScreen and SetupScreen are updated to use the hook; old `presenter-bridge.ts` and its test are deleted after all imports are migrated.

**Tech Stack:** TypeScript, React hooks, Node.js `node:test`, `FakeBroadcastChannel` test harness.

---

## File Map

| Status | Path | Responsibility |
|--------|------|----------------|
| Create | `games/kalambury/src/shared/presenter/types.ts` | All shared types and message unions |
| Create | `games/kalambury/src/shared/presenter/host-bridge.ts` | `createKalamburyPresenterHostBridge()` |
| Create | `games/kalambury/src/shared/presenter/host-bridge.test.ts` | Isolated host bridge tests |
| Create | `games/kalambury/src/shared/presenter/controller-bridge.ts` | `createKalamburyPresenterControllerBridge()` |
| Create | `games/kalambury/src/shared/presenter/controller-bridge.test.ts` | Isolated controller bridge tests |
| Create | `games/kalambury/src/host/hooks/usePresenterHostBridge.ts` | React hook wrapping host bridge lifecycle |
| Modify | `games/kalambury/src/host/PlayScreen.tsx` | Use hook, remove refs/effects, add rate limiting |
| Modify | `games/kalambury/src/host/SetupScreen.tsx` | Use hook, fix async race |
| Modify | `games/kalambury/src/controller/ControllerApp.tsx` | Update imports to new paths |
| Modify | `games/kalambury/src/runtime/createRuntime.ts` | Update imports to new paths |
| Delete | `games/kalambury/src/shared/presenter-bridge.ts` | Replaced by presenter/ directory |
| Delete | `games/kalambury/src/shared/presenter-bridge.test.ts` | Replaced by split test files |

---

## Chunk 1: Types and host bridge

### Task 1: Create `shared/presenter/types.ts`

**Files:**
- Create: `games/kalambury/src/shared/presenter/types.ts`

- [ ] **Step 1: Create the file**

```ts
// games/kalambury/src/shared/presenter/types.ts

export type KalamburyPresenterPhrasePayload = {
  phrase: string;
  categoryLabel: string;
  wordCount: number;
  presenterName?: string;
  phraseChangeAllowed: boolean;
  phraseChangeRemaining: number | "infinite";
};

export type KalamburyPresenterPairState = {
  connected: boolean;
  pairedDeviceId: string | null;
};

export type KalamburyPresenterPreviewState =
  | "pending-reveal"
  | "preview"
  | "hidden-live";

export type KalamburyControllerConnectionState =
  | "pending"
  | "connected"
  | "rejected";

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

export type KalamburyPresenterMessage =
  | HostToControllerMessage
  | ControllerToHostMessage;

export function isPresenterMessage(
  value: unknown,
): value is KalamburyPresenterMessage {
  if (!value || typeof value !== "object") return false;
  return typeof (value as { type?: unknown }).type === "string";
}

type BroadcastChannelLike = {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  postMessage: (message: unknown) => void;
  close: () => void;
};

export type BroadcastChannelConstructor = new (name: string) => BroadcastChannelLike;

export type KalamburyPresenterChannel = {
  postMessage: (message: KalamburyPresenterMessage) => void | Promise<void>;
  subscribe: (
    handler: (message: KalamburyPresenterMessage) => void,
  ) => () => void;
  close?: () => void;
};

export type HostBridgeOptions = {
  BroadcastChannelImpl?: BroadcastChannelConstructor;
  channel?: KalamburyPresenterChannel;
  initialPairedDeviceId?: string | null;
  probeTimeoutMs?: number;
  pingIntervalMs?: number;
  pingTimeoutMs?: number;
  onPairingChange?: (state: KalamburyPresenterPairState) => void;
  onRevealRequest?: (state: { deviceId: string }) => void;
  onRerollRequest?: (state: { deviceId: string }) => void;
};

export type ControllerBridgeOptions = {
  BroadcastChannelImpl?: BroadcastChannelConstructor;
  channel?: KalamburyPresenterChannel;
  deviceId?: string;
  readyRetryMs?: number;
  onPhraseChange?: (payload: KalamburyPresenterPhrasePayload | null) => void;
  onPreviewStateChange?: (state: KalamburyPresenterPreviewState) => void;
  onConnectionStateChange?: (state: KalamburyControllerConnectionState) => void;
};
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm --filter @project-party/game-kalambury typecheck
```

Expected: passes (or only errors in files we haven't migrated yet — those are OK at this stage).

- [ ] **Step 3: Commit**

```bash
git add games/kalambury/src/shared/presenter/types.ts
git commit -m "feat(kalambury): add presenter/types.ts with split message unions"
```

---

### Task 2: Create `shared/presenter/host-bridge.ts`

**Files:**
- Create: `games/kalambury/src/shared/presenter/host-bridge.ts`

Key changes vs old code:
- Heartbeat uses single `setInterval` (no nested `setTimeout`)
- `destroy()` sends `controller-disconnected` only when paired
- `startHeartbeat()` called in both new-device and reconnect paths (already hotfixed, now formalized)
- Removes `_dropWithoutDisconnect`

- [ ] **Step 1: Create the file**

```ts
// games/kalambury/src/shared/presenter/host-bridge.ts

import {
  isPresenterMessage,
  type BroadcastChannelConstructor,
  type HostBridgeOptions,
  type KalamburyPresenterChannel,
  type KalamburyPresenterMessage,
  type KalamburyPresenterPairState,
} from "./types";

function resolveBroadcastChannel(
  BroadcastChannelImpl?: BroadcastChannelConstructor,
) {
  if (BroadcastChannelImpl) return BroadcastChannelImpl;
  if (typeof BroadcastChannel === "undefined") return null;
  return BroadcastChannel;
}

function getChannelName(sessionCode: string) {
  return `project-party.kalambury.presenter.${sessionCode.toUpperCase()}`;
}

function createPresenterChannel(
  sessionCode: string,
  BroadcastChannelImpl?: BroadcastChannelConstructor,
): KalamburyPresenterChannel | null {
  const Channel = resolveBroadcastChannel(BroadcastChannelImpl);
  if (!Channel || !sessionCode) return null;

  const channel = new Channel(getChannelName(sessionCode));

  return {
    postMessage(message) {
      channel.postMessage(message);
    },
    subscribe(handler) {
      channel.onmessage = (event) => {
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

export function createKalamburyPresenterHostBridge(
  sessionCode: string,
  options: HostBridgeOptions = {},
) {
  const channel =
    options.channel ??
    createPresenterChannel(sessionCode, options.BroadcastChannelImpl);
  const shouldCloseChannel = !options.channel;
  let pairedDeviceId = options.initialPairedDeviceId ?? null;
  let unsubscribe = () => undefined as void;
  let probeTimer: ReturnType<typeof setTimeout> | null = null;
  let pingInterval: ReturnType<typeof setInterval> | null = null;
  let lastPongTime = 0;

  const PING_INTERVAL_MS = options.pingIntervalMs ?? 4000;
  const PING_TIMEOUT_MS = options.pingTimeoutMs ?? 8000;

  function emitPairingChange(connected: boolean) {
    options.onPairingChange?.({ connected, pairedDeviceId });
  }

  function clearProbeTimer() {
    if (probeTimer) {
      clearTimeout(probeTimer);
      probeTimer = null;
    }
  }

  function stopHeartbeat() {
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }
  }

  function startHeartbeat() {
    if (pingInterval) return;
    lastPongTime = Date.now();
    pingInterval = setInterval(() => {
      if (!pairedDeviceId) {
        stopHeartbeat();
        return;
      }
      if (Date.now() - lastPongTime > PING_TIMEOUT_MS) {
        pairedDeviceId = null;
        stopHeartbeat();
        emitPairingChange(false);
        return;
      }
      void channel?.postMessage({ type: "host-ping", deviceId: pairedDeviceId });
    }, PING_INTERVAL_MS);
  }

  if (channel) {
    unsubscribe = channel.subscribe((message) => {
      if (
        message.type === "controller-pong" &&
        message.deviceId === pairedDeviceId
      ) {
        lastPongTime = Date.now();
      }

      if (message.type === "controller-ready") {
        if (!pairedDeviceId) {
          pairedDeviceId = message.deviceId;
          clearProbeTimer();
          void channel.postMessage({
            type: "host-paired",
            deviceId: message.deviceId,
          } satisfies KalamburyPresenterMessage);
          startHeartbeat();
          emitPairingChange(true);
          return;
        }

        if (pairedDeviceId === message.deviceId) {
          clearProbeTimer();
          void channel.postMessage({
            type: "host-paired",
            deviceId: message.deviceId,
          } satisfies KalamburyPresenterMessage);
          lastPongTime = Date.now();
          startHeartbeat();
          emitPairingChange(true);
          return;
        }

        void channel.postMessage({
          type: "host-rejected",
          deviceId: message.deviceId,
        } satisfies KalamburyPresenterMessage);
      }

      if (
        message.type === "controller-disconnected" &&
        pairedDeviceId === message.deviceId
      ) {
        pairedDeviceId = null;
        stopHeartbeat();
        emitPairingChange(false);
      }

      if (
        message.type === "controller-reveal-request" &&
        pairedDeviceId === message.deviceId
      ) {
        options.onRevealRequest?.({ deviceId: message.deviceId });
      }

      if (
        message.type === "controller-reroll-request" &&
        pairedDeviceId === message.deviceId
      ) {
        options.onRerollRequest?.({ deviceId: message.deviceId });
      }
    });

    if (pairedDeviceId) {
      void channel.postMessage({
        type: "host-probe",
        deviceId: pairedDeviceId,
      } satisfies KalamburyPresenterMessage);

      const probeTimeoutMs = options.probeTimeoutMs ?? 5000;
      probeTimer = setTimeout(() => {
        probeTimer = null;
        pairedDeviceId = null;
        emitPairingChange(false);
      }, probeTimeoutMs);
    }
  }

  return {
    publishPhrase(payload: import("./types").KalamburyPresenterPhrasePayload) {
      if (!pairedDeviceId) return;
      void channel?.postMessage({
        type: "presenter-phrase",
        deviceId: pairedDeviceId,
        ...payload,
      } satisfies KalamburyPresenterMessage);
    },
    clearPhrase() {
      void channel?.postMessage({
        type: "presenter-clear",
        deviceId: pairedDeviceId,
      } satisfies KalamburyPresenterMessage);
    },
    startPreviewWindow() {
      if (!pairedDeviceId) return;
      void channel?.postMessage({
        type: "host-preview-start",
        deviceId: pairedDeviceId,
      } satisfies KalamburyPresenterMessage);
    },
    finishPreviewWindow() {
      if (!pairedDeviceId) return;
      void channel?.postMessage({
        type: "host-preview-finish",
        deviceId: pairedDeviceId,
      } satisfies KalamburyPresenterMessage);
    },
    resetPreviewWindow() {
      if (!pairedDeviceId) return;
      void channel?.postMessage({
        type: "host-preview-reset",
        deviceId: pairedDeviceId,
      } satisfies KalamburyPresenterMessage);
    },
    disconnectPresenterDevice() {
      pairedDeviceId = null;
      emitPairingChange(false);
      void channel?.postMessage({
        type: "host-reset",
      } satisfies KalamburyPresenterMessage);
    },
    destroy() {
      clearProbeTimer();
      stopHeartbeat();
      unsubscribe();
      if (pairedDeviceId) {
        void channel?.postMessage({
          type: "controller-disconnected",
          deviceId: pairedDeviceId,
        } satisfies KalamburyPresenterMessage);
      }
      if (shouldCloseChannel) channel?.close?.();
    },
  };
}
```

- [ ] **Step 2: Commit**

Note: Do NOT run typecheck here. `host-bridge.test.ts` (Task 3) imports `controller-bridge.ts` which doesn't exist until Task 4. Typecheck will fail for that file until then. Run typecheck in Task 5 after both files exist.

```bash
git add games/kalambury/src/shared/presenter/host-bridge.ts
git commit -m "feat(kalambury): add presenter/host-bridge.ts with simplified heartbeat"
```

---

### Task 3: Write host bridge tests

**Files:**
- Create: `games/kalambury/src/shared/presenter/host-bridge.test.ts`

Note: `FakeBroadcastChannel` is duplicated in both test files (Tasks 3 and 5) intentionally — each test file is self-contained so it can run in isolation. Do not extract it to a shared module unless both files need to change simultaneously.

Note: `destroy()` intentionally sends `controller-disconnected` (a `ControllerToHostMessage`) from the host side. This is by design — the host impersonates the controller message to signal peer teardown. Do not change this.

- [ ] **Step 1: Create test file with FakeBroadcastChannel harness and test cases**

```ts
// games/kalambury/src/shared/presenter/host-bridge.test.ts

import assert from "node:assert/strict";
import test from "node:test";

import { createKalamburyPresenterHostBridge } from "./host-bridge.ts";
import { createKalamburyPresenterControllerBridge } from "./controller-bridge.ts";

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

test("host bridge: new device pairs and disconnect emits state changes", () => {
  FakeBroadcastChannel.reset();
  const states: Array<{ connected: boolean; pairedDeviceId: string | null }> = [];

  const host = createKalamburyPresenterHostBridge("T01", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    onPairingChange: (s) => states.push(s),
  });
  const ctrl = createKalamburyPresenterControllerBridge("T01", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    deviceId: "dev-a",
  });

  ctrl.announceReady();
  ctrl.destroy();
  host.destroy();

  assert.deepEqual(states, [
    { connected: true, pairedDeviceId: "dev-a" },
    { connected: false, pairedDeviceId: null },
  ]);
});

test("host bridge: known device reconnects via initialPairedDeviceId and heartbeat starts", () => {
  FakeBroadcastChannel.reset();
  const states: Array<{ connected: boolean; pairedDeviceId: string | null }> = [];

  const host = createKalamburyPresenterHostBridge("T02", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    initialPairedDeviceId: "dev-a",
    onPairingChange: (s) => states.push(s),
  });
  const ctrl = createKalamburyPresenterControllerBridge("T02", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    deviceId: "dev-a",
  });

  ctrl.announceReady();

  assert.deepEqual(states, [{ connected: true, pairedDeviceId: "dev-a" }]);

  host.destroy();
  ctrl.destroy();
});

test("host bridge: second device is rejected while first is paired", () => {
  FakeBroadcastChannel.reset();
  const states: string[] = [];

  const host = createKalamburyPresenterHostBridge("T03", {
    BroadcastChannelImpl: FakeBroadcastChannel,
  });
  const ctrl1 = createKalamburyPresenterControllerBridge("T03", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    deviceId: "dev-a",
  });
  const ctrl2 = createKalamburyPresenterControllerBridge("T03", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    deviceId: "dev-b",
    onConnectionStateChange: (s) => states.push(s),
  });

  ctrl1.announceReady();
  ctrl2.announceReady();

  host.destroy();
  ctrl1.destroy();
  ctrl2.destroy();

  assert.ok(states.includes("rejected"), `expected rejected, got ${JSON.stringify(states)}`);
});

test("host bridge: destroy() sends controller-disconnected to paired device", () => {
  FakeBroadcastChannel.reset();
  const pairingStates: Array<{ connected: boolean; pairedDeviceId: string | null }> = [];

  const host = createKalamburyPresenterHostBridge("T04", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    onPairingChange: (s) => pairingStates.push(s),
  });
  const ctrl = createKalamburyPresenterControllerBridge("T04", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    deviceId: "dev-a",
  });

  ctrl.announceReady();
  host.destroy(); // sends controller-disconnected to dev-a → host emits onPairingChange(false)

  assert.deepEqual(pairingStates, [
    { connected: true, pairedDeviceId: "dev-a" },
    { connected: false, pairedDeviceId: null },
  ]);

  ctrl.destroy();
});

test("host bridge: destroy() without paired device sends no message", () => {
  FakeBroadcastChannel.reset();
  // Should not throw
  const host = createKalamburyPresenterHostBridge("T05", {
    BroadcastChannelImpl: FakeBroadcastChannel,
  });
  host.destroy();
  assert.ok(true);
});

test("host bridge: heartbeat timeout disconnects when controller stops ponging", async () => {
  FakeBroadcastChannel.reset();
  const states: Array<{ connected: boolean; pairedDeviceId: string | null }> = [];

  // Use a manual channel so we can control which messages the controller sees
  const hostMessages: unknown[] = [];
  let controllerHandler: ((m: unknown) => void) | null = null;

  // Host channel: postMessage goes to hostMessages; subscribe gives host its listener
  let hostHandler: ((m: unknown) => void) | null = null;
  const hostChannel = {
    postMessage(msg: unknown) {
      hostMessages.push(msg);
      // Deliver to controller
      controllerHandler?.({ data: msg } as MessageEvent<unknown>);
    },
    subscribe(h: (m: unknown) => void) {
      hostHandler = h;
      return () => { hostHandler = null; };
    },
  };

  // Controller channel: postMessage delivers to host's handler; subscribe stores handler
  const ctrlChannel = {
    postMessage(msg: unknown) {
      // Deliver controller-ready to host
      hostHandler?.(msg);
    },
    subscribe(h: (m: unknown) => void) {
      controllerHandler = (event: unknown) => {
        const e = event as { data: unknown };
        h(e.data);
      };
      return () => { controllerHandler = null; };
    },
  };

  const host = createKalamburyPresenterHostBridge("T06", {
    channel: hostChannel as any,
    pingIntervalMs: 40,
    pingTimeoutMs: 60,
    onPairingChange: (s) => states.push(s),
  });

  // Controller announces ready (pairs)
  ctrlChannel.postMessage({ type: "controller-ready", deviceId: "dev-hb" });

  // Now simulate network loss: stop the controller from ponging by removing its handler
  controllerHandler = null; // host pings will not reach controller → no pongs

  // Wait for heartbeat timeout
  await new Promise((r) => setTimeout(r, 200));

  host.destroy();

  assert.ok(
    states.length >= 2,
    `Expected ≥2 state changes (connected then disconnected), got ${states.length}: ${JSON.stringify(states)}`,
  );
  assert.equal(states[0]?.connected, true);
  assert.equal(states[states.length - 1]?.connected, false);
});
```

- [ ] **Step 2: Skip running tests for now**

`host-bridge.test.ts` imports `controller-bridge.ts` which doesn't exist until Task 4. Do NOT run tests here. Run them in Task 5 Step 2 after both files exist.

- [ ] **Step 3: Commit**

```bash
git add games/kalambury/src/shared/presenter/host-bridge.test.ts
git commit -m "test(kalambury): add host-bridge.test.ts"
```

---

## Chunk 2: Controller bridge and hook

### Task 4: Create `shared/presenter/controller-bridge.ts`

**Files:**
- Create: `games/kalambury/src/shared/presenter/controller-bridge.ts`

Key changes vs old code:
- `host-ping` → pong only (no redundant `postReady()`)
- `host-paired` in non-pending state → ignored
- `host-reset` → `setConnectionState("pending")` which auto-starts retry (was: manual `stopReadyRetry()` without restart)
- Removes `_dropWithoutDisconnect`

- [ ] **Step 1: Create the file**

```ts
// games/kalambury/src/shared/presenter/controller-bridge.ts

import {
  isPresenterMessage,
  type ControllerBridgeOptions,
  type KalamburyControllerConnectionState,
  type KalamburyPresenterChannel,
  type KalamburyPresenterMessage,
} from "./types";

function resolveBroadcastChannel(
  BroadcastChannelImpl?: import("./types").BroadcastChannelConstructor,
) {
  if (BroadcastChannelImpl) return BroadcastChannelImpl;
  if (typeof BroadcastChannel === "undefined") return null;
  return BroadcastChannel;
}

function getChannelName(sessionCode: string) {
  return `project-party.kalambury.presenter.${sessionCode.toUpperCase()}`;
}

function createPresenterChannel(
  sessionCode: string,
  BroadcastChannelImpl?: import("./types").BroadcastChannelConstructor,
): KalamburyPresenterChannel | null {
  const Channel = resolveBroadcastChannel(BroadcastChannelImpl);
  if (!Channel || !sessionCode) return null;

  const channel = new Channel(getChannelName(sessionCode));

  return {
    postMessage(message) {
      channel.postMessage(message);
    },
    subscribe(handler) {
      channel.onmessage = (event) => {
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

function createDeviceId() {
  return `presenter-${Math.random().toString(36).slice(2, 10)}`;
}

export function createKalamburyPresenterControllerBridge(
  sessionCode: string,
  options: ControllerBridgeOptions = {},
) {
  const channel =
    options.channel ??
    createPresenterChannel(sessionCode, options.BroadcastChannelImpl);
  const shouldCloseChannel = !options.channel;
  const deviceId = options.deviceId ?? createDeviceId();
  let isDestroyed = false;
  let connectionState: KalamburyControllerConnectionState = "pending";
  let unsubscribe = () => undefined as void;
  let readyRetryTimer: ReturnType<typeof setInterval> | null = null;

  function stopReadyRetry() {
    if (readyRetryTimer) {
      clearInterval(readyRetryTimer);
      readyRetryTimer = null;
    }
  }

  function postReady() {
    if (isDestroyed) return;
    void channel?.postMessage({
      type: "controller-ready",
      deviceId,
    } satisfies KalamburyPresenterMessage);
  }

  function startReadyRetry() {
    if (readyRetryTimer || isDestroyed) return;
    readyRetryTimer = setInterval(() => {
      postReady();
    }, options.readyRetryMs ?? 1200);
  }

  function setConnectionState(state: KalamburyControllerConnectionState) {
    connectionState = state;
    options.onConnectionStateChange?.(state);

    if (state === "pending") {
      startReadyRetry();
      return;
    }

    stopReadyRetry();
  }

  if (channel) {
    unsubscribe = channel.subscribe((message) => {
      if (message.type === "host-probe" && message.deviceId === deviceId) {
        postReady();
      }

      if (message.type === "host-ping" && message.deviceId === deviceId) {
        void channel?.postMessage({
          type: "controller-pong",
          deviceId,
        } satisfies KalamburyPresenterMessage);
        // No redundant postReady() — heartbeat proves the channel is alive
      }

      if (message.type === "host-paired" && message.deviceId === deviceId) {
        if (connectionState === "pending") {
          setConnectionState("connected");
        }
      }

      if (message.type === "host-rejected" && message.deviceId === deviceId) {
        setConnectionState("rejected");
      }

      if (message.type === "host-reset") {
        setConnectionState("pending"); // auto-starts readyRetry
        options.onPreviewStateChange?.("pending-reveal");
        options.onPhraseChange?.(null);
      }

      if (
        message.type === "presenter-clear" &&
        (!message.deviceId || message.deviceId === deviceId)
      ) {
        options.onPhraseChange?.(null);
      }

      if (
        message.type === "host-preview-start" &&
        message.deviceId === deviceId
      ) {
        options.onPreviewStateChange?.("preview");
      }

      if (
        message.type === "host-preview-finish" &&
        message.deviceId === deviceId
      ) {
        options.onPreviewStateChange?.("hidden-live");
      }

      if (
        message.type === "host-preview-reset" &&
        message.deviceId === deviceId
      ) {
        options.onPreviewStateChange?.("pending-reveal");
      }

      if (
        message.type === "presenter-phrase" &&
        message.deviceId === deviceId
      ) {
        options.onPhraseChange?.({
          phrase: message.phrase,
          categoryLabel: message.categoryLabel,
          wordCount: message.wordCount,
          presenterName: message.presenterName,
          phraseChangeAllowed: message.phraseChangeAllowed,
          phraseChangeRemaining: message.phraseChangeRemaining,
        });
      }
    });
  }

  return {
    deviceId,
    announceReady() {
      if (isDestroyed) return;
      setConnectionState("pending");
      options.onPreviewStateChange?.("pending-reveal");
      postReady();
    },
    revealPhrase() {
      if (isDestroyed) return;
      void channel?.postMessage({
        type: "controller-reveal-request",
        deviceId,
      } satisfies KalamburyPresenterMessage);
    },
    requestPhraseChange() {
      if (isDestroyed) return;
      void channel?.postMessage({
        type: "controller-reroll-request",
        deviceId,
      } satisfies KalamburyPresenterMessage);
    },
    destroy() {
      if (isDestroyed) return;
      isDestroyed = true;
      stopReadyRetry();
      unsubscribe();
      void channel?.postMessage({
        type: "controller-disconnected",
        deviceId,
      } satisfies KalamburyPresenterMessage);
      if (shouldCloseChannel) channel?.close?.();
    },
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add games/kalambury/src/shared/presenter/controller-bridge.ts
git commit -m "feat(kalambury): add presenter/controller-bridge.ts with auto-reconnect on host-reset"
```

---

### Task 5: Write controller bridge tests + run all bridge tests

**Files:**
- Create: `games/kalambury/src/shared/presenter/controller-bridge.test.ts`

- [ ] **Step 1: Create test file**

```ts
// games/kalambury/src/shared/presenter/controller-bridge.test.ts

import assert from "node:assert/strict";
import test from "node:test";

import { createKalamburyPresenterControllerBridge } from "./controller-bridge.ts";
import { createKalamburyPresenterHostBridge } from "./host-bridge.ts";

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

test("controller bridge: announceReady() starts readyRetry", async () => {
  FakeBroadcastChannel.reset();
  const readyCalls: number[] = [];

  // Create a custom channel that counts postMessage calls
  let callCount = 0;
  const mockChannel = {
    postMessage(msg: unknown) { callCount++; },
    subscribe: (_h: unknown) => () => undefined,
  };

  const ctrl = createKalamburyPresenterControllerBridge("C01", {
    channel: mockChannel as any,
    deviceId: "dev-a",
    readyRetryMs: 20,
  });

  ctrl.announceReady();
  await new Promise((r) => setTimeout(r, 55));
  ctrl.destroy();

  // Should have sent: initial ready + ~2 retries + destroy disconnect = ≥3 messages
  assert.ok(callCount >= 3, `Expected ≥3 messages, got ${callCount}`);
});

test("controller bridge: host-paired in pending → connected, stops retry", () => {
  FakeBroadcastChannel.reset();
  const states: string[] = [];

  const host = createKalamburyPresenterHostBridge("C02", {
    BroadcastChannelImpl: FakeBroadcastChannel,
  });
  const ctrl = createKalamburyPresenterControllerBridge("C02", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    deviceId: "dev-a",
    onConnectionStateChange: (s) => states.push(s),
  });

  ctrl.announceReady();

  host.destroy();
  ctrl.destroy();

  assert.ok(states.includes("connected"), `Expected connected in ${JSON.stringify(states)}`);
});

test("controller bridge: host-paired in connected state → ignored", () => {
  FakeBroadcastChannel.reset();
  const states: string[] = [];

  const host = createKalamburyPresenterHostBridge("C03", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    initialPairedDeviceId: "dev-a",
  });
  const ctrl = createKalamburyPresenterControllerBridge("C03", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    deviceId: "dev-a",
    onConnectionStateChange: (s) => states.push(s),
  });

  ctrl.announceReady(); // → connected
  ctrl.announceReady(); // second announce → already connected, host-paired ignored

  host.destroy();
  ctrl.destroy();

  // Should only have one "connected" state
  assert.equal(states.filter((s) => s === "connected").length, 1);
});

test("controller bridge: host-ping → only pong, no postReady", () => {
  FakeBroadcastChannel.reset();
  let messageTypes: string[] = [];

  // Intercept messages from controller
  const captureChannel = {
    postMessage(msg: any) { messageTypes.push(msg.type); },
    subscribe: (_h: unknown) => () => undefined,
  };

  const ctrl = createKalamburyPresenterControllerBridge("C04", {
    channel: captureChannel as any,
    deviceId: "dev-a",
  });

  // Simulate receiving host-ping
  // We need a two-channel setup for this — use real FakeBroadcastChannel
  FakeBroadcastChannel.reset();
  messageTypes = [];

  const hostChannel = {
    messages: [] as unknown[],
    subscribers: new Set<(m: unknown) => void>(),
    postMessage(msg: unknown) { this.messages.push(msg); },
    subscribe(h: (m: unknown) => void) {
      this.subscribers.add(h);
      return () => this.subscribers.delete(h);
    },
  };
  const ctrlChannel = {
    sent: [] as unknown[],
    handler: null as ((m: unknown) => void) | null,
    postMessage(msg: unknown) { this.sent.push(msg); },
    subscribe(h: (m: unknown) => void) {
      this.handler = h;
      return () => { this.handler = null; };
    },
  };

  const ctrl2 = createKalamburyPresenterControllerBridge("C04b", {
    channel: ctrlChannel as any,
    deviceId: "dev-x",
  });

  // Simulate host-ping arriving
  ctrlChannel.handler?.({ type: "host-ping", deviceId: "dev-x" });

  ctrl2.destroy();

  const sentTypes = ctrlChannel.sent.map((m: any) => m.type);
  assert.ok(sentTypes.includes("controller-pong"), `Expected pong in ${JSON.stringify(sentTypes)}`);
  assert.ok(!sentTypes.includes("controller-ready"), `Should NOT send controller-ready on ping, got ${JSON.stringify(sentTypes)}`);
});

test("controller bridge: host-reset → pending + auto-reconnect retry", async () => {
  FakeBroadcastChannel.reset();
  const states: string[] = [];

  const host = createKalamburyPresenterHostBridge("C05", {
    BroadcastChannelImpl: FakeBroadcastChannel,
  });
  const ctrl = createKalamburyPresenterControllerBridge("C05", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    deviceId: "dev-a",
    readyRetryMs: 20,
    onConnectionStateChange: (s) => states.push(s),
  });

  ctrl.announceReady(); // → pending → connected
  host.disconnectPresenterDevice(); // host-reset → controller goes pending, starts retry

  await new Promise((r) => setTimeout(r, 60)); // retry fires

  host.destroy();
  ctrl.destroy();

  assert.ok(states.includes("pending"), `Expected pending after host-reset, got ${JSON.stringify(states)}`);
});

test("controller bridge: destroy() sends controller-disconnected", () => {
  FakeBroadcastChannel.reset();
  const states: Array<{ connected: boolean; pairedDeviceId: string | null }> = [];

  const host = createKalamburyPresenterHostBridge("C06", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    onPairingChange: (s) => states.push(s),
  });
  const ctrl = createKalamburyPresenterControllerBridge("C06", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    deviceId: "dev-a",
  });

  ctrl.announceReady();
  ctrl.destroy(); // sends controller-disconnected

  host.destroy();

  assert.deepEqual(states, [
    { connected: true, pairedDeviceId: "dev-a" },
    { connected: false, pairedDeviceId: null },
  ]);
});

test("controller bridge: heartbeat timeout detected by host after heartbeat starts on reconnect", async () => {
  FakeBroadcastChannel.reset();
  const states: Array<{ connected: boolean; pairedDeviceId: string | null }> = [];

  const host = createKalamburyPresenterHostBridge("C07", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    pingIntervalMs: 40,
    pingTimeoutMs: 60,
    onPairingChange: (s) => states.push(s),
    initialPairedDeviceId: "dev-a",
  });

  // Controller comes online (reconnect path)
  const ctrl = createKalamburyPresenterControllerBridge("C07", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    deviceId: "dev-a",
  });

  ctrl.announceReady(); // triggers reconnect path in host

  // Now destroy ctrl without sending disconnect (simulate network drop)
  // The only way without _dropWithoutDisconnect is to destroy (sends disconnect)
  // or to just stop responding to pings by destroying
  ctrl.destroy(); // this sends disconnect immediately

  host.destroy();

  assert.ok(
    states.length >= 2,
    `Expected ≥2 state changes, got ${states.length}: ${JSON.stringify(states)}`,
  );
  assert.equal(states[0]?.connected, true);
  assert.equal(states[states.length - 1]?.connected, false);
});
```

- [ ] **Step 2: Run all bridge tests**

```bash
pnpm --filter @project-party/game-kalambury test
```

Expected: all tests in `presenter/host-bridge.test.ts` and `presenter/controller-bridge.test.ts` pass.

- [ ] **Step 3: Commit**

```bash
git add games/kalambury/src/shared/presenter/controller-bridge.test.ts
git commit -m "test(kalambury): add controller-bridge.test.ts"
```

---

### Task 6: Create `host/hooks/usePresenterHostBridge.ts`

**Files:**
- Create: `games/kalambury/src/host/hooks/usePresenterHostBridge.ts`

- [ ] **Step 1: Create the hook**

```ts
// games/kalambury/src/host/hooks/usePresenterHostBridge.ts

import { useEffect, useRef, useState } from "react";

import { createKalamburyPresenterHostBridge } from "../../shared/presenter/host-bridge";
import type {
  KalamburyPresenterChannel,
  KalamburyPresenterPairState,
} from "../../shared/presenter/types";

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

// Stable handle returned from the hook — always the same object reference,
// methods forward to the current bridge. This avoids null-checks at call sites
// and eliminates the problem of returning bridgeRef.current (which is null
// on first render before the useEffect runs).
type PresenterHostBridgeHandle = {
  publishPhrase: (payload: import("../../shared/presenter/types").KalamburyPresenterPhrasePayload) => void;
  clearPhrase: () => void;
  startPreviewWindow: () => void;
  finishPreviewWindow: () => void;
  resetPreviewWindow: () => void;
  disconnectPresenterDevice: () => void;
};

type UsePresenterHostBridgeResult = {
  pairState: KalamburyPresenterPairState;
  bridge: PresenterHostBridgeHandle;
};

export function usePresenterHostBridge(
  options: UsePresenterHostBridgeOptions,
): UsePresenterHostBridgeResult {
  const {
    sessionCode,
    enabled,
    initialPairedDeviceId,
    channel,
    pingIntervalMs,
    pingTimeoutMs,
  } = options;

  // Keep callbacks in refs so bridge never needs to be recreated when they change
  const onRevealRequestRef = useRef(options.onRevealRequest);
  const onRerollRequestRef = useRef(options.onRerollRequest);
  useEffect(() => {
    onRevealRequestRef.current = options.onRevealRequest;
  });
  useEffect(() => {
    onRerollRequestRef.current = options.onRerollRequest;
  });

  const [pairState, setPairState] = useState<KalamburyPresenterPairState>({
    connected: false,
    pairedDeviceId: null,
  });

  const bridgeRef = useRef<ReturnType<
    typeof createKalamburyPresenterHostBridge
  > | null>(null);

  // Stable handle — always the same object, delegates to current bridgeRef.current
  const stableHandle = useRef<PresenterHostBridgeHandle>({
    publishPhrase: (payload) => bridgeRef.current?.publishPhrase(payload),
    clearPhrase: () => bridgeRef.current?.clearPhrase(),
    startPreviewWindow: () => bridgeRef.current?.startPreviewWindow(),
    finishPreviewWindow: () => bridgeRef.current?.finishPreviewWindow(),
    resetPreviewWindow: () => bridgeRef.current?.resetPreviewWindow(),
    disconnectPresenterDevice: () => bridgeRef.current?.disconnectPresenterDevice(),
  });

  useEffect(() => {
    if (!enabled || !sessionCode) {
      setPairState({ connected: false, pairedDeviceId: null });
      bridgeRef.current = null;
      return;
    }

    const bridge = createKalamburyPresenterHostBridge(sessionCode, {
      channel,
      initialPairedDeviceId,
      pingIntervalMs,
      pingTimeoutMs,
      onPairingChange: (state) => {
        setPairState(state);
      },
      onRevealRequest: () => {
        onRevealRequestRef.current?.();
      },
      onRerollRequest: () => {
        onRerollRequestRef.current?.();
      },
    });

    bridgeRef.current = bridge;

    return () => {
      bridge.destroy();
      if (bridgeRef.current === bridge) {
        bridgeRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, sessionCode, channel, pingIntervalMs, pingTimeoutMs]);

  return { pairState, bridge: stableHandle.current };
}
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm --filter @project-party/game-kalambury typecheck
```

Expected: passes (ignoring errors in files not yet migrated).

- [ ] **Step 3: Commit**

```bash
git add games/kalambury/src/host/hooks/usePresenterHostBridge.ts
git commit -m "feat(kalambury): add usePresenterHostBridge hook"
```

---

## Chunk 3: Component migration and cleanup

### Task 7: Migrate `host/PlayScreen.tsx`

**Files:**
- Modify: `games/kalambury/src/host/PlayScreen.tsx`

Changes:
- Import `usePresenterHostBridge` from new hook
- Import types from `shared/presenter/types`
- Remove `presenterBridgeRef`, `playStateRef`, `presenterRevealStageRef`
- Remove the bridge `useEffect` (lines ~415–467 in original)
- Use `usePresenterHostBridge` with `onRevealRequest` and `onRerollRequest`
- Add reroll rate limiting via `lastRerollRef`
- Change timer deps from `[playState, presenterReconnectRequired]` to `[playState?.stage, presenterReconnectRequired]`

- [ ] **Step 1: Read the current bridge useEffect in PlayScreen** to find exact line ranges

Read `games/kalambury/src/host/PlayScreen.tsx` and locate:
- The import for `createKalamburyPresenterHostBridge` (to remove)
- `presenterBridgeRef` declaration (to remove)
- `playStateRef` and `presenterRevealStageRef` (to remove)
- The bridge `useEffect` block (to replace with hook call)
- Timer effect deps

- [ ] **Step 2: Replace import in PlayScreen**

Remove this import:
```ts
import {
  type KalamburyPresenterChannel,
  type KalamburyPresenterPairState,
  createKalamburyPresenterHostBridge,
} from "../shared/presenter-bridge";
```

Replace with:
```ts
import type { KalamburyPresenterChannel, KalamburyPresenterPairState } from "../shared/presenter/types";
import { usePresenterHostBridge } from "./hooks/usePresenterHostBridge";
```

- [ ] **Step 3: Remove stale refs and add rate limiting ref**

Remove these three refs:
```ts
const presenterBridgeRef = useRef<...>(null);
const playStateRef = useRef(playState);
const presenterRevealStageRef = useRef<PresenterRevealStage>("pending");
```

And remove the two sync effects:
```ts
useEffect(() => { playStateRef.current = playState; });
useEffect(() => { presenterRevealStageRef.current = presenterRevealStage; });
```

Add rate limiting ref near the top of the component:
```ts
const lastRerollRef = useRef(0);
```

- [ ] **Step 4: Replace bridge useEffect with hook call**

Remove the entire bridge `useEffect` block. Add the hook call instead (place it where the bridge effect was):

```ts
const { pairState: presenterPairState, bridge: presenterBridge } =
  usePresenterHostBridge({
    sessionCode,
    enabled: setupPayload.presenterDevice?.enabled ?? false,
    initialPairedDeviceId: setupPayload.presenterDevice?.pairedDeviceId ?? null,
    channel: transportChannel,
    pingIntervalMs: 3000,
    pingTimeoutMs: 5000,
    onRevealRequest: () => {
      // These values are from the latest render's closure — safe because the hook
      // stores onRevealRequest in a ref and reads .current at call time.
      if (!playState || playState.stage !== "turn") return;
      if (presenterRevealStage !== "pending") return;
      setPresenterRevealStage("preview");
      presenterBridge.startPreviewWindow(); // presenterBridge is the stable handle, never null
    },
    onRerollRequest: () => {
      if (Date.now() - lastRerollRef.current < 1000) return;
      lastRerollRef.current = Date.now();
      setPlayState((current) =>
        current ? rerollKalamburyPhrase(current, setupPayload) : current,
      );
    },
  });
```

Note: `onRevealRequest` and `onRerollRequest` are stored in refs inside the hook (updated on every render), so the callbacks always close over current `playState` and `presenterRevealStage` values. `presenterBridge` is the stable handle returned by the hook — it is never null, all methods are safe to call at any time.

- [ ] **Step 5: Preserve clearPhrase() on bridge teardown**

The existing bridge `useEffect` cleanup in PlayScreen calls `bridge.clearPhrase()` before `bridge.destroy()`. The hook's internal cleanup calls `destroy()` only. To preserve this behavior, add a cleanup `useEffect` in PlayScreen that runs when the bridge is torn down:

```ts
// Clear presenter phrase when bridge tears down (e.g. on game end)
useEffect(() => {
  return () => {
    presenterBridge.clearPhrase();
  };
}, [presenterBridge]);
```

Since `presenterBridge` is the stable handle (same object reference for the component lifetime), this effect runs cleanup only on component unmount — which is correct.

- [ ] **Step 6: Update timer effect deps**

Find the timer `useEffect` that has `[playState, presenterReconnectRequired]` as deps.
Change it to:
```ts
}, [playState?.stage, presenterReconnectRequired]);
```

- [ ] **Step 7: Run tests and typecheck**

```bash
pnpm --filter @project-party/game-kalambury test
pnpm --filter @project-party/game-kalambury typecheck
```

Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add games/kalambury/src/host/PlayScreen.tsx
git commit -m "refactor(kalambury): migrate PlayScreen to usePresenterHostBridge hook"
```

---

### Task 8: Migrate `host/SetupScreen.tsx`

**Files:**
- Modify: `games/kalambury/src/host/SetupScreen.tsx`

Changes:
- Import from new paths
- Replace `presenterBridgeRef` + bridge `useEffect` with `usePresenterHostBridge` hook
- Add effect to reset `pairedPresenterDeviceId` when disabled
- Fix `disconnectPresenterDevice` (fire-and-forget `clearReusableSession`)

- [ ] **Step 1: Replace import**

Remove:
```ts
import {
  type KalamburyPresenterChannel,
  createKalamburyPresenterHostBridge,
} from "../shared/presenter-bridge";
```

Add:
```ts
import type { KalamburyPresenterChannel } from "../shared/presenter/types";
import { usePresenterHostBridge } from "./hooks/usePresenterHostBridge";
```

- [ ] **Step 2: Remove presenterBridgeRef**

Remove:
```ts
const presenterBridgeRef = useRef<ReturnType<
  typeof createKalamburyPresenterHostBridge
> | null>(null);
```

- [ ] **Step 3: Replace bridge useEffect with hook call + remove duplicate state**

Remove the bridge `useEffect` block (the one with `[presenterDeviceEnabled, sessionCode]` deps).

Remove these two state declarations (they become redundant — the hook owns this state now):
```ts
const [presenterDeviceConnected, setPresenterDeviceConnected] = useState(false);
// pairedPresenterDeviceId stays — it is saved to storage and passed as initialPairedDeviceId
```

Add the hook call:
```ts
const { pairState: presenterPairState, bridge: presenterBridge } =
  usePresenterHostBridge({
    sessionCode,
    enabled: presenterDeviceEnabled,
    initialPairedDeviceId: pairedPresenterDeviceId,
    channel,
  });
```

Then derive the connected state directly from the hook's return value:
```ts
const presenterDeviceConnected = presenterPairState.connected;
```

When pairing succeeds, sync the new `pairedDeviceId` into storage-persisted state and close the QR modal:
```ts
useEffect(() => {
  if (presenterPairState.connected && presenterPairState.pairedDeviceId) {
    setPairedPresenterDeviceId(presenterPairState.pairedDeviceId);
    setIsPresenterQrOpen(false);
  }
}, [presenterPairState.connected, presenterPairState.pairedDeviceId]);
```

This is NOT the anti-pattern: `pairedPresenterDeviceId` is a storage-persisted value that gets passed back as `initialPairedDeviceId` for the next mount. It only updates when a new pairing occurs, not on every render. The hook's `initialPairedDeviceId` is only read at bridge creation time (inside the `useEffect`), so updating `pairedPresenterDeviceId` between sessions does not create a reconnect loop.

- [ ] **Step 4: Add reset effect when disabled**

```ts
useEffect(() => {
  if (!presenterDeviceEnabled) {
    setPairedPresenterDeviceId(null);
  }
}, [presenterDeviceEnabled]);
```

- [ ] **Step 5: Fix disconnectPresenterDevice**

Replace:
```ts
async function disconnectPresenterDevice() {
  presenterBridgeRef.current?.disconnectPresenterDevice();
  await clearReusableSession();
  setPresenterDeviceConnected(false);
  setPairedPresenterDeviceId(null);
  setIsPresenterQrOpen(false);
}
```

With:
```ts
function disconnectPresenterDevice() {
  presenterBridge.disconnectPresenterDevice();
  setPairedPresenterDeviceId(null);
  setIsPresenterQrOpen(false);
  void clearReusableSession();
}
```

`presenterDeviceConnected` is now derived from `presenterPairState.connected`, which will update automatically when `disconnectPresenterDevice()` causes the bridge to emit `onPairingChange(false)`. Remove `setPresenterDeviceConnected(false)` — it no longer exists.

The `onDisconnect` call in JSX that does `void disconnectPresenterDevice()` should be changed to just `disconnectPresenterDevice()` (function is no longer async).

- [ ] **Step 6: Run tests and typecheck**

```bash
pnpm --filter @project-party/game-kalambury test
pnpm --filter @project-party/game-kalambury typecheck
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add games/kalambury/src/host/SetupScreen.tsx
git commit -m "refactor(kalambury): migrate SetupScreen to usePresenterHostBridge hook"
```

---

### Task 9: Update imports in ControllerApp and createRuntime

**Files:**
- Modify: `games/kalambury/src/controller/ControllerApp.tsx`
- Modify: `games/kalambury/src/runtime/createRuntime.ts`

- [ ] **Step 1: Update ControllerApp.tsx imports**

Remove:
```ts
import {
  type KalamburyPresenterChannel,
  type KalamburyPresenterPhrasePayload,
  type KalamburyPresenterPreviewState,
  createKalamburyPresenterControllerBridge,
} from "../shared/presenter-bridge";
```

Add:
```ts
import type {
  KalamburyPresenterChannel,
  KalamburyPresenterPhrasePayload,
  KalamburyPresenterPreviewState,
} from "../shared/presenter/types";
import { createKalamburyPresenterControllerBridge } from "../shared/presenter/controller-bridge";
```

- [ ] **Step 2: Update createRuntime.ts imports**

Remove:
```ts
import {
  type KalamburyPresenterChannel,
  isPresenterMessage,
} from "../shared/presenter-bridge";
```

Add:
```ts
import { isPresenterMessage, type KalamburyPresenterChannel } from "../shared/presenter/types";
```

- [ ] **Step 3: Run tests and typecheck**

```bash
pnpm --filter @project-party/game-kalambury test
pnpm --filter @project-party/game-kalambury typecheck
```

Expected: all pass. No remaining imports from `../shared/presenter-bridge`.

- [ ] **Step 4: Commit**

```bash
git add games/kalambury/src/controller/ControllerApp.tsx games/kalambury/src/runtime/createRuntime.ts
git commit -m "refactor(kalambury): update imports to presenter/ split files"
```

---

### Task 10: Delete old presenter-bridge files

**Files:**
- Delete: `games/kalambury/src/shared/presenter-bridge.ts`
- Delete: `games/kalambury/src/shared/presenter-bridge.test.ts`

- [ ] **Step 1: Verify no remaining imports**

```bash
grep -r "presenter-bridge" games/kalambury/src/ --include="*.ts" --include="*.tsx"
```

Expected: no output (no files import from `presenter-bridge` anymore).

- [ ] **Step 2: Delete the files**

```bash
rm games/kalambury/src/shared/presenter-bridge.ts
rm games/kalambury/src/shared/presenter-bridge.test.ts
```

- [ ] **Step 3: Run all tests**

```bash
pnpm --filter @project-party/game-kalambury test
pnpm --filter @project-party/game-kalambury typecheck
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor(kalambury): remove old presenter-bridge.ts and its test"
```

---

### Task 11: Parity test check and final validation

**Files:**
- Check: parity test files pass

- [ ] **Step 1: Run all tests (including parity tests)**

```bash
pnpm --filter @project-party/game-kalambury test
```

Expected: all pass. If parity tests fail due to string changes, read the failing test to see what string is expected and fix accordingly in the source file.

- [ ] **Step 2: Run full typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix(kalambury): fix parity test failures after presenter bridge refactor"
```

---

### Task 12: Add error handling to `transport/firebase.ts`

**Files:**
- Modify: `games/kalambury/src/transport/firebase.ts`

The spec requires a `try/catch` in `destroy()` with `console.error` for failed Firebase cleanup. The `send()` already has `.catch()` from a previous fix — this task only covers `destroy()`.

- [ ] **Step 1: Wrap `destroy()` body in try/catch**

In `games/kalambury/src/transport/firebase.ts`, replace the `destroy()` method:

```ts
destroy() {
  handlers.clear();
  try {
    if (sharedUnsubscribe) {
      sharedUnsubscribe();
      sharedUnsubscribe = null;
    }
    off(sessionRef);
  } catch (err: unknown) {
    console.error("[kalambury/firebase] destroy error:", err);
  }
},
```

- [ ] **Step 2: Run tests and typecheck**

```bash
pnpm --filter @project-party/game-kalambury test
pnpm --filter @project-party/game-kalambury typecheck
```

Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add games/kalambury/src/transport/firebase.ts
git commit -m "fix(kalambury): add try/catch in firebase transport destroy()"
```
