import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { PlatformTransport } from "./types";

class MockBroadcastChannel {
  name: string;
  constructor(name: string) { this.name = name; }
  onmessage = null;
  postMessage() {}
  close() {}
}
(globalThis as any).BroadcastChannel = MockBroadcastChannel;

const mockTransport: PlatformTransport = {
  send: () => {},
  on: () => () => {},
};

const { createKalamburyTransportAsync } = await import("./index.ts");

describe("createKalamburyTransportAsync factory", () => {
  it("returns a transport with send, on, destroy for broadcast mode", async () => {
    const t = await createKalamburyTransportAsync("broadcast", "test-session", mockTransport);
    assert.ok(typeof t.send === "function");
    assert.ok(typeof t.on === "function");
    assert.ok(typeof t.destroy === "function");
    t.destroy();
  });

  it("returns a transport with send, on, destroy for do-ws mode", async () => {
    const t = await createKalamburyTransportAsync("do-ws", "test-session", mockTransport);
    assert.ok(typeof t.send === "function");
    assert.ok(typeof t.on === "function");
    assert.ok(typeof t.destroy === "function");
  });

  it("rejects when mode is firebase and sessionCode is empty", async () => {
    await assert.rejects(
      () => createKalamburyTransportAsync("firebase", "", mockTransport),
      /Firebase wymaga aktywnej sesji/,
    );
  });

  it("rejects when mode is firebase and sessionCode is undefined", async () => {
    await assert.rejects(
      () => createKalamburyTransportAsync("firebase", undefined, mockTransport),
      /Firebase wymaga aktywnej sesji/,
    );
  });
});
