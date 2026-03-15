import assert from "node:assert/strict";
import test from "node:test";

import { createSessionTransport } from "./session-transport.ts";

class FakeBroadcastChannel {
  static channels = new Map();

  constructor(name) {
    this.name = name;
    this.onmessage = null;
    const peers = FakeBroadcastChannel.channels.get(name) ?? new Set();
    peers.add(this);
    FakeBroadcastChannel.channels.set(name, peers);
  }

  postMessage(message) {
    const peers = FakeBroadcastChannel.channels.get(this.name) ?? new Set();

    for (const peer of peers) {
      if (peer === this || typeof peer.onmessage !== "function") {
        continue;
      }

      peer.onmessage({ data: message });
    }
  }

  close() {
    const peers = FakeBroadcastChannel.channels.get(this.name) ?? new Set();
    peers.delete(this);
    if (peers.size === 0) {
      FakeBroadcastChannel.channels.delete(this.name);
    }
  }
}

test("createSessionTransport delivers local BroadcastChannel events", async () => {
  FakeBroadcastChannel.channels.clear();
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ events: [], nextOffset: 0 }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

  const sender = createSessionTransport({
    sessionCode: "ABC123",
    BroadcastChannelImpl: FakeBroadcastChannel,
    pollIntervalMs: 10000,
  });
  const receiver = createSessionTransport({
    sessionCode: "ABC123",
    BroadcastChannelImpl: FakeBroadcastChannel,
    pollIntervalMs: 10000,
  });
  const received = [];

  receiver.on("kalambury.presenter", (payload) => {
    received.push(payload);
  });

  await sender.send("kalambury.presenter", {
    type: "controller-ready",
    deviceId: "dev-1",
  });

  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.deepEqual(received, [
    { type: "controller-ready", deviceId: "dev-1" },
  ]);

  sender.destroy();
  receiver.destroy();
});

test("createSessionTransport polls remote events and ignores self echoes", async () => {
  const fetchCalls = [];
  let postedBody = null;
  let pollCount = 0;

  globalThis.fetch = async (input, init) => {
    fetchCalls.push(String(input));

    if (init?.method === "POST") {
      postedBody = JSON.parse(String(init.body));
      return new Response(JSON.stringify({ ...postedBody, offset: 1 }), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    }

    pollCount += 1;

    if (pollCount === 1) {
      return new Response(JSON.stringify({ events: [], nextOffset: 0 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        events: [
          {
            offset: 2,
            id: "event-remote-1",
            event: "kalambury.presenter",
            payload: { type: "host-paired", deviceId: "dev-2" },
            sourceClientId: "remote-client",
            createdAt: "2026-03-15T10:00:00.000Z",
          },
          {
            offset: 3,
            id: postedBody.id,
            event: postedBody.event,
            payload: postedBody.payload,
            sourceClientId: postedBody.sourceClientId,
            createdAt: postedBody.createdAt,
          },
        ],
        nextOffset: 3,
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  };

  const transport = createSessionTransport({
    sessionCode: "ABC123",
    pollIntervalMs: 5,
  });
  const received = [];

  transport.on("kalambury.presenter", (payload) => {
    received.push(payload);
  });

  await transport.send("kalambury.presenter", {
    type: "controller-ready",
    deviceId: "dev-self",
  });

  await new Promise((resolve) => setTimeout(resolve, 30));

  assert.equal(fetchCalls[0], "/api/sessions/ABC123/events?after=0");
  assert.equal(fetchCalls[1], "/api/sessions/ABC123/events");
  assert.deepEqual(received, [{ type: "host-paired", deviceId: "dev-2" }]);

  transport.destroy();
});
