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

test("tajniacy bridge: captain connects and host sees presence", () => {
  FakeBroadcastChannel.reset();

  const presenceUpdates: Array<{ captainRed: boolean }> = [];

  const hostBridge = createTajniacyBridge("T01", "host", {
    BroadcastChannelImpl: FakeBroadcastChannel as any,
    onPresenceUpdate: (p) => presenceUpdates.push({ captainRed: p.captainRed }),
  });

  const captainBridge = createTajniacyBridge("T01", "captain-red", {
    BroadcastChannelImpl: FakeBroadcastChannel as any,
  });

  captainBridge?.announceReady("captain-red");

  hostBridge?.destroy();
  captainBridge?.destroy();

  assert.ok(presenceUpdates.some((p) => p.captainRed), "captainRed should be present after announce");
});

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
    pingIntervalMs: 50,
    pingTimeoutMs: 80,
  });

  captainBridge?.announceReady("captain-red");
  await new Promise((resolve) => setTimeout(resolve, 20));

  captainBridge?.destroy();

  await new Promise((resolve) => setTimeout(resolve, 200));

  hostBridge?.destroy();

  assert.ok(disconnects.includes("captain-disconnected"), "host should detect captain disconnect via heartbeat");
  assert.ok(presenceUpdates.some((p) => !p.captainRed), "captainRed should be false after timeout");
});

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
    pingIntervalMs: 50,
    pingTimeoutMs: 80,
  });

  captain1?.announceReady("captain-red");
  await new Promise((resolve) => setTimeout(resolve, 20));
  captain1?.destroy();

  await new Promise((resolve) => setTimeout(resolve, 200));

  const captain2 = createTajniacyBridge("HBT02", "captain-red", {
    BroadcastChannelImpl: FakeBroadcastChannel as any,
    pingIntervalMs: 50,
    pingTimeoutMs: 80,
  });
  captain2?.announceReady("captain-red");
  await new Promise((resolve) => setTimeout(resolve, 20));

  hostBridge?.destroy();
  captain2?.destroy();

  assert.ok(captainRedSeenCount >= 2, `Expected >= 2 captainRed presence events, got ${captainRedSeenCount}`);
});
