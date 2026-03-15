import assert from "node:assert/strict";
import test from "node:test";

import {
  createKalamburyPresenterControllerBridge,
  createKalamburyPresenterHostBridge,
} from "./presenter-bridge.ts";

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
    if (this.#closed) {
      return;
    }

    const peers = FakeBroadcastChannel.channels.get(this.name) ?? new Set();
    for (const peer of peers) {
      if (peer === this || peer.#closed || !peer.onmessage) {
        continue;
      }

      peer.onmessage({ data: message } as MessageEvent<unknown>);
    }
  }

  close() {
    this.#closed = true;
    const peers = FakeBroadcastChannel.channels.get(this.name);
    peers?.delete(this);
    if (peers && peers.size === 0) {
      FakeBroadcastChannel.channels.delete(this.name);
    }
  }
}

test("host bridge flips connection state when controller joins and leaves", () => {
  FakeBroadcastChannel.reset();

  const connectionStates: Array<{ connected: boolean; pairedDeviceId: string | null }> = [];
  const hostBridge = createKalamburyPresenterHostBridge("ABC123", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    onPairingChange: (state) => connectionStates.push(state),
  });

  const controllerBridge = createKalamburyPresenterControllerBridge("ABC123", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    deviceId: "device-a",
  });

  controllerBridge.announceReady();
  controllerBridge.destroy();
  hostBridge.destroy();

  assert.deepEqual(connectionStates, [
    { connected: true, pairedDeviceId: "device-a" },
    { connected: false, pairedDeviceId: null },
  ]);
});

test("controller bridge receives phrase payloads published by the host", () => {
  FakeBroadcastChannel.reset();

  let lastPhrasePayload: unknown = null;
  const hostBridge = createKalamburyPresenterHostBridge("XYZ789", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    initialPairedDeviceId: "device-a",
  });
  const controllerBridge = createKalamburyPresenterControllerBridge("XYZ789", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    deviceId: "device-a",
    onPhraseChange: (payload) => {
      lastPhrasePayload = payload;
    },
  });

  hostBridge.publishPhrase({
    phrase: "Robot kuchenny",
    categoryLabel: "Klasyczne",
    wordCount: 2,
    presenterName: "Mateo",
    phraseChangeAllowed: true,
    phraseChangeRemaining: "infinite",
  });

  hostBridge.destroy();
  controllerBridge.destroy();

  assert.deepEqual(lastPhrasePayload, {
    phrase: "Robot kuchenny",
    categoryLabel: "Klasyczne",
    wordCount: 2,
    presenterName: "Mateo",
    phraseChangeAllowed: true,
    phraseChangeRemaining: "infinite",
  });
});

test("controller bridge clears the private phrase when the host resets the turn", () => {
  FakeBroadcastChannel.reset();

  const phraseStates: Array<unknown> = [];
  const hostBridge = createKalamburyPresenterHostBridge("RESET1", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    initialPairedDeviceId: "device-a",
  });
  const controllerBridge = createKalamburyPresenterControllerBridge("RESET1", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    deviceId: "device-a",
    onPhraseChange: (payload) => {
      phraseStates.push(payload);
    },
  });

  hostBridge.publishPhrase({
    phrase: "Matrix",
    categoryLabel: "Filmy i seriale",
    wordCount: 1,
    presenterName: "Ewka",
    phraseChangeAllowed: true,
    phraseChangeRemaining: 2,
  });
  hostBridge.clearPhrase();

  hostBridge.destroy();
  controllerBridge.destroy();

  assert.deepEqual(phraseStates, [
    {
      phrase: "Matrix",
      categoryLabel: "Filmy i seriale",
      wordCount: 1,
      presenterName: "Ewka",
      phraseChangeAllowed: true,
      phraseChangeRemaining: 2,
    },
    null,
  ]);
});

test("host bridge rejects a second presenter device while keeping the original pair", () => {
  FakeBroadcastChannel.reset();

  const pairingStates: Array<{ connected: boolean; pairedDeviceId: string | null }> = [];
  let rejectionReason: string | null = null;

  const hostBridge = createKalamburyPresenterHostBridge("LOCK01", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    onPairingChange: (state) => pairingStates.push(state),
  });

  const firstController = createKalamburyPresenterControllerBridge("LOCK01", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    deviceId: "device-a",
  });
  const secondController = createKalamburyPresenterControllerBridge("LOCK01", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    deviceId: "device-b",
    onConnectionStateChange: (state) => {
      if (state === "rejected") {
        rejectionReason = state;
      }
    },
  });

  firstController.announceReady();
  secondController.announceReady();

  hostBridge.destroy();
  firstController.destroy();
  secondController.destroy();

  assert.deepEqual(pairingStates, [
    { connected: true, pairedDeviceId: "device-a" },
  ]);
  assert.equal(rejectionReason, "rejected");
});

test("host bridge manual disconnect clears the pair and lets a new device connect", () => {
  FakeBroadcastChannel.reset();

  const pairingStates: Array<{ connected: boolean; pairedDeviceId: string | null }> = [];
  const hostBridge = createKalamburyPresenterHostBridge("RESET02", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    onPairingChange: (state) => pairingStates.push(state),
  });

  const firstController = createKalamburyPresenterControllerBridge("RESET02", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    deviceId: "device-a",
  });
  const secondController = createKalamburyPresenterControllerBridge("RESET02", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    deviceId: "device-b",
  });

  firstController.announceReady();
  hostBridge.disconnectPresenterDevice();
  secondController.announceReady();

  hostBridge.destroy();
  firstController.destroy();
  secondController.destroy();

  assert.deepEqual(pairingStates, [
    { connected: true, pairedDeviceId: "device-a" },
    { connected: false, pairedDeviceId: null },
    { connected: true, pairedDeviceId: "device-b" },
  ]);
});

test("host bridge releases the presenter slot after disconnect so another device can reconnect", () => {
  FakeBroadcastChannel.reset();

  const pairingStates: Array<{ connected: boolean; pairedDeviceId: string | null }> = [];
  const hostBridge = createKalamburyPresenterHostBridge("REJOIN1", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    onPairingChange: (state) => pairingStates.push(state),
  });

  const firstController = createKalamburyPresenterControllerBridge("REJOIN1", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    deviceId: "device-a",
  });
  const secondController = createKalamburyPresenterControllerBridge("REJOIN1", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    deviceId: "device-b",
  });

  firstController.announceReady();
  firstController.destroy();
  secondController.announceReady();

  hostBridge.destroy();
  secondController.destroy();

  assert.deepEqual(pairingStates, [
    { connected: true, pairedDeviceId: "device-a" },
    { connected: false, pairedDeviceId: null },
    { connected: true, pairedDeviceId: "device-b" },
  ]);
});

test("host bridge rehydrates an already-open presenter device for the same session code", () => {
  FakeBroadcastChannel.reset();

  const initialHostBridge = createKalamburyPresenterHostBridge("REUSE1", {
    BroadcastChannelImpl: FakeBroadcastChannel,
  });
  const controllerBridge = createKalamburyPresenterControllerBridge("REUSE1", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    deviceId: "device-a",
  });

  controllerBridge.announceReady();
  initialHostBridge.destroy();

  const pairingStates: Array<{ connected: boolean; pairedDeviceId: string | null }> = [];
  const resumedHostBridge = createKalamburyPresenterHostBridge("REUSE1", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    initialPairedDeviceId: "device-a",
    onPairingChange: (state) => pairingStates.push(state),
  });

  resumedHostBridge.destroy();
  controllerBridge.destroy();

  assert.deepEqual(pairingStates, [
    { connected: true, pairedDeviceId: "device-a" },
  ]);
});

test("controller reveal event is forwarded to the host bridge", () => {
  FakeBroadcastChannel.reset();

  let revealDeviceId: string | null = null;
  const hostBridge = createKalamburyPresenterHostBridge("REVEAL1", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    onPairingChange: () => undefined,
    onRevealRequest: (state) => {
      revealDeviceId = state.deviceId;
    },
  });
  const controllerBridge = createKalamburyPresenterControllerBridge("REVEAL1", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    deviceId: "device-a",
  });

  controllerBridge.announceReady();
  controllerBridge.revealPhrase();

  hostBridge.destroy();
  controllerBridge.destroy();

  assert.equal(revealDeviceId, "device-a");
});

test("host bridge can force the presenter preview to end and hide the phrase again", () => {
  FakeBroadcastChannel.reset();

  const previewStates: string[] = [];
  const controllerBridge = createKalamburyPresenterControllerBridge("REVEAL2", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    deviceId: "device-a",
    onPreviewStateChange: (state) => {
      previewStates.push(state);
    },
  });
  const hostBridge = createKalamburyPresenterHostBridge("REVEAL2", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    initialPairedDeviceId: "device-a",
  });

  hostBridge.startPreviewWindow();
  hostBridge.finishPreviewWindow();

  hostBridge.destroy();
  controllerBridge.destroy();

  assert.deepEqual(previewStates, ["preview", "hidden-live"]);
});

test("host bridge can reset the presenter back to pending reveal for the next turn", () => {
  FakeBroadcastChannel.reset();

  const previewStates: string[] = [];
  const controllerBridge = createKalamburyPresenterControllerBridge("REVEAL3", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    deviceId: "device-a",
    onPreviewStateChange: (state) => {
      previewStates.push(state);
    },
  });
  const hostBridge = createKalamburyPresenterHostBridge("REVEAL3", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    initialPairedDeviceId: "device-a",
  });

  hostBridge.finishPreviewWindow();
  hostBridge.resetPreviewWindow();

  hostBridge.destroy();
  controllerBridge.destroy();

  assert.deepEqual(previewStates, ["hidden-live", "pending-reveal"]);
});

test("controller bridge retries ready handshake until a late host subscribes", async () => {
  FakeBroadcastChannel.reset();

  const controllerStates: Array<string> = [];
  const controllerBridge = createKalamburyPresenterControllerBridge("LATE01", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    deviceId: "device-a",
    readyRetryMs: 10,
    onConnectionStateChange: (state) => {
      controllerStates.push(state);
    },
  });

  controllerBridge.announceReady();

  await new Promise((resolve) => setTimeout(resolve, 25));

  const pairingStates: Array<{ connected: boolean; pairedDeviceId: string | null }> = [];
  const hostBridge = createKalamburyPresenterHostBridge("LATE01", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    onPairingChange: (state) => {
      pairingStates.push(state);
    },
  });

  await new Promise((resolve) => setTimeout(resolve, 30));

  hostBridge.destroy();
  controllerBridge.destroy();

  assert.deepEqual(pairingStates, [
    { connected: true, pairedDeviceId: "device-a" },
  ]);
  assert.equal(controllerStates.includes("connected"), true);
});

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

  // Symulujemy utratę sieci — niszczymy bez wysyłania controller-disconnected
  (controllerBridge as any)._dropWithoutDisconnect();

  // Czekamy na heartbeat timeout (ponad pingTimeoutMs)
  await new Promise((resolve) => setTimeout(resolve, 200));

  hostBridge.destroy();

  // Powinny być: connected=true, następnie connected=false
  assert.ok(pairingStates.length >= 2, `Expected >= 2 pairing state changes, got ${pairingStates.length}`);
  assert.equal(pairingStates[0].connected, true);
  assert.equal(pairingStates[pairingStates.length - 1].connected, false);
});

test("controller bridge re-pairs after host heartbeat timeout clears the slot", async () => {
  FakeBroadcastChannel.reset();

  const pairingStates: Array<{ connected: boolean; pairedDeviceId: string | null }> = [];

  const hostBridge = createKalamburyPresenterHostBridge("HB02", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    pingIntervalMs: 50,
    pingTimeoutMs: 80,
    onPairingChange: (state) => pairingStates.push(state),
  });

  const controller1 = createKalamburyPresenterControllerBridge("HB02", {
    BroadcastChannelImpl: FakeBroadcastChannel,
    deviceId: "device-hb2",
  });
  controller1.announceReady();
  (controller1 as any)._dropWithoutDisconnect();

  await new Promise((resolve) => setTimeout(resolve, 200));

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
