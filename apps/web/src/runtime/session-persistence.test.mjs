import assert from "node:assert/strict";
import test from "node:test";

import {
  clearReusableRuntimeSession,
  getReusableRuntimeSession,
  saveReusableRuntimeSession,
} from "./session-persistence.ts";
import { createBrowserRuntimeStorage } from "./storage.ts";

test("reusable runtime session can be saved, restored and cleared", () => {
  const store = new Map();

  globalThis.localStorage = {
    getItem(key) {
      return store.get(key) ?? null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
    removeItem(key) {
      store.delete(key);
    },
  };

  const storage = createBrowserRuntimeStorage("kalambury");

  saveReusableRuntimeSession(storage, {
    sessionId: "session-1",
    sessionCode: "ABC123",
    gameId: "kalambury",
  });

  assert.deepEqual(getReusableRuntimeSession(storage), {
    sessionId: "session-1",
    sessionCode: "ABC123",
    gameId: "kalambury",
  });

  clearReusableRuntimeSession(storage);

  assert.equal(getReusableRuntimeSession(storage), null);

  globalThis.localStorage = undefined;
});

test("reusable runtime session ignores malformed payloads", () => {
  const store = new Map();

  globalThis.localStorage = {
    getItem(key) {
      return store.get(key) ?? null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
    removeItem(key) {
      store.delete(key);
    },
  };

  const storage = createBrowserRuntimeStorage("kalambury");
  storage.set("reusable-session", { sessionId: "bad" });

  assert.equal(getReusableRuntimeSession(storage), null);

  globalThis.localStorage = undefined;
});
