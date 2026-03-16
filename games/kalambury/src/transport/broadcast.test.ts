import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

class MockBroadcastChannel {
  static channels: Map<string, MockBroadcastChannel[]> = new Map();
  name: string;
  onmessage: ((event: { data: unknown }) => void) | null = null;

  constructor(name: string) {
    this.name = name;
    const list = MockBroadcastChannel.channels.get(name) ?? [];
    list.push(this);
    MockBroadcastChannel.channels.set(name, list);
  }

  postMessage(data: unknown) {
    const list = MockBroadcastChannel.channels.get(this.name) ?? [];
    for (const ch of list) {
      if (ch !== this) ch.onmessage?.({ data });
    }
  }

  close() {
    const list = MockBroadcastChannel.channels.get(this.name) ?? [];
    MockBroadcastChannel.channels.set(this.name, list.filter((ch) => ch !== this));
  }
}

(globalThis as any).BroadcastChannel = MockBroadcastChannel;

const { createBroadcastAdapter } = await import("./broadcast.ts");

describe("broadcast adapter", () => {
  before(() => MockBroadcastChannel.channels.clear());

  it("sends and receives a message on the same channel name", async () => {
    const a = createBroadcastAdapter("test-session");
    const b = createBroadcastAdapter("test-session");
    const received: unknown[] = [];
    b.on("test.event", (payload) => received.push(payload));
    a.send("test.event", { value: 42 });
    await new Promise((r) => setTimeout(r, 0));
    assert.deepEqual(received, [{ value: 42 }]);
    a.destroy();
    b.destroy();
  });

  it("does not receive messages on different channel names", async () => {
    const a = createBroadcastAdapter("session-1");
    const b = createBroadcastAdapter("session-2");
    const received: unknown[] = [];
    b.on("test.event", (payload) => received.push(payload));
    a.send("test.event", { value: 1 });
    await new Promise((r) => setTimeout(r, 0));
    assert.deepEqual(received, []);
    a.destroy();
    b.destroy();
  });

  it("unsubscribes handler when returned function is called", async () => {
    const a = createBroadcastAdapter("unsub-session");
    const b = createBroadcastAdapter("unsub-session");
    const received: unknown[] = [];
    const unsub = b.on("test.event", (payload) => received.push(payload));
    unsub();
    a.send("test.event", { value: 99 });
    await new Promise((r) => setTimeout(r, 0));
    assert.deepEqual(received, []);
    a.destroy();
    b.destroy();
  });
});
