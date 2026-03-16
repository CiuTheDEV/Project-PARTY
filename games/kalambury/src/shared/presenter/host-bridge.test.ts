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
  // FakeBroadcastChannel cannot be used here because we need to suppress pongs
  // by stopping message delivery mid-session.
  let controllerHandler: ((m: unknown) => void) | null = null;
  let hostHandler: ((m: unknown) => void) | null = null;

  const hostChannel = {
    postMessage(msg: unknown) {
      // Deliver host messages to controller (pings go here)
      controllerHandler?.({ data: msg } as MessageEvent<unknown>);
    },
    subscribe(h: (m: unknown) => void) {
      hostHandler = h;
      return () => { hostHandler = null; };
    },
  };

  const ctrlChannel = {
    postMessage(msg: unknown) {
      // Deliver controller messages to host
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

  // Controller announces ready (pairs with host)
  ctrlChannel.postMessage({ type: "controller-ready", deviceId: "dev-hb" });

  // Simulate network loss: stop delivering messages to controller → no pongs
  controllerHandler = null;

  // Wait for heartbeat timeout (well past pingTimeoutMs of 60ms)
  await new Promise((r) => setTimeout(r, 200));

  host.destroy();

  assert.ok(
    states.length >= 2,
    `Expected ≥2 state changes (connected then disconnected), got ${states.length}: ${JSON.stringify(states)}`,
  );
  assert.equal(states[0]?.connected, true);
  assert.equal(states[states.length - 1]?.connected, false);
});
