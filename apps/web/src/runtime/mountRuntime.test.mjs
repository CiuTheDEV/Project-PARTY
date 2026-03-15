import assert from "node:assert/strict";
import test from "node:test";

import { mountGameRuntime } from "./mountRuntime.ts";

test("mountGameRuntime creates runtime with storage, transport, and ui bindings", async () => {
  const mountedNodes = [];
  const transportEvents = [];
  let destroyCalls = 0;
  const store = new Map();

  const runtime = mountGameRuntime({
    definition: {
      createRuntime(context) {
        assert.equal(context.sessionId, "session-1");
        assert.equal(context.sessionCode, "ABC123");
        assert.equal(context.gameId, "kalambury");
        assert.equal(context.role, "host");
        assert.equal(context.device, "desktop");
        assert.deepEqual(context.config, { mode: "classic" });
        assert.deepEqual(context.players, []);

        context.storage.set("draft", "value");
        assert.equal(context.storage.get("draft"), "value");

        context.transport.send("runtime-started", { ok: true });
        context.ui.mount("node");
        context.ui.unmount();

        return {
          start() {
            return undefined;
          },
          destroy() {
            destroyCalls += 1;
          },
        };
      },
    },
    session: {
      sessionId: "session-1",
      sessionCode: "ABC123",
      gameId: "kalambury",
      config: { mode: "classic" },
    },
    role: "host",
    device: "desktop",
    players: [],
    storage: {
      get(key) {
        return store.get(key) ?? null;
      },
      set(key, value) {
        store.set(key, value);
      },
    },
    mount(node) {
      mountedNodes.push(node);
    },
    unmount() {
      mountedNodes.push(null);
    },
    onTransport(event, payload) {
      transportEvents.push({ event, payload });
    },
  });

  await runtime.start();
  await runtime.destroy?.();

  assert.deepEqual(mountedNodes, ["node", null, null]);
  assert.deepEqual(transportEvents, [
    { event: "runtime-started", payload: { ok: true } },
  ]);
  assert.equal(destroyCalls, 1);
});
