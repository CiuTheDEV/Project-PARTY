import assert from "node:assert/strict";
import test from "node:test";

import { createBrowserRuntimeStorage } from "./storage.ts";

test("createBrowserRuntimeStorage persists values in localStorage when available", () => {
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

  const firstStorage = createBrowserRuntimeStorage("kalambury");
  firstStorage.set("draft", { rounds: 3 });

  const secondStorage = createBrowserRuntimeStorage("kalambury");

  assert.deepEqual(secondStorage.get("draft"), { rounds: 3 });

  secondStorage.remove("draft");

  assert.equal(firstStorage.get("draft"), null);

  globalThis.localStorage = undefined;
});

test("createBrowserRuntimeStorage falls back to in-memory storage without localStorage", () => {
  const storage = createBrowserRuntimeStorage("kalambury");

  storage.set("draft", "value");

  assert.equal(storage.get("draft"), "value");
  storage.remove("draft");
  assert.equal(storage.get("draft"), null);
});
