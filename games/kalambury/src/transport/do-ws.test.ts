import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { PlatformTransport } from "./types";

const { createDoWsAdapter } = await import("./do-ws.ts");

function createMockPlatformTransport(): PlatformTransport & {
  sentEvents: Array<{ event: string; payload: unknown }>;
  simulateIncoming: (event: string, payload: unknown) => void;
} {
  const sentEvents: Array<{ event: string; payload: unknown }> = [];
  const listeners = new Map<string, Set<(payload: unknown) => void>>();

  return {
    sentEvents,
    send(event, payload) {
      sentEvents.push({ event, payload });
    },
    on(event, handler) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(handler);
      return () => listeners.get(event)?.delete(handler);
    },
    simulateIncoming(event, payload) {
      listeners.get(event)?.forEach((h) => h(payload));
    },
  };
}

describe("do-ws adapter", () => {
  it("delegates send to platform transport", () => {
    const mock = createMockPlatformTransport();
    const adapter = createDoWsAdapter(mock);
    adapter.send("test.event", { x: 1 });
    assert.deepEqual(mock.sentEvents, [{ event: "test.event", payload: { x: 1 } }]);
  });

  it("delegates on to platform transport and returns unsubscribe", () => {
    const mock = createMockPlatformTransport();
    const adapter = createDoWsAdapter(mock);
    const received: unknown[] = [];
    const unsub = adapter.on("test.event", (p) => received.push(p));
    mock.simulateIncoming("test.event", { y: 2 });
    assert.deepEqual(received, [{ y: 2 }]);
    unsub();
    mock.simulateIncoming("test.event", { y: 3 });
    assert.deepEqual(received, [{ y: 2 }]);
  });
});
