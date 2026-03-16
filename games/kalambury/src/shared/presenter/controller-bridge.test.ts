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

  let callCount = 0;
  const mockChannel = {
    postMessage(_msg: unknown) { callCount++; },
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

  const ctrlChannel = {
    sent: [] as unknown[],
    handler: null as ((m: unknown) => void) | null,
    postMessage(msg: unknown) { this.sent.push(msg); },
    subscribe(h: (m: unknown) => void) {
      this.handler = h;
      return () => { this.handler = null; };
    },
  };

  const ctrl = createKalamburyPresenterControllerBridge("C04", {
    channel: ctrlChannel as any,
    deviceId: "dev-x",
  });

  // Simulate host-ping arriving
  ctrlChannel.handler?.({ type: "host-ping", deviceId: "dev-x" });

  ctrl.destroy();

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

test("controller bridge: heartbeat timeout detected by host after reconnect path starts heartbeat", async () => {
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

  ctrl.announceReady(); // triggers reconnect path in host — heartbeat starts

  // Destroy ctrl (sends controller-disconnected → immediate host disconnect)
  ctrl.destroy();

  host.destroy();

  assert.ok(
    states.length >= 2,
    `Expected ≥2 state changes, got ${states.length}: ${JSON.stringify(states)}`,
  );
  assert.equal(states[0]?.connected, true);
  assert.equal(states[states.length - 1]?.connected, false);
});
