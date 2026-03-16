import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";

const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
};
(globalThis as any).localStorage = mockLocalStorage;

const { getTransportMode, setTransportMode } = await import("./transport-storage.ts");

describe("transport-storage", () => {
  before(() => { delete store["kalambury:transport-mode"]; });

  it("returns do-ws as default when nothing is stored", () => {
    assert.equal(getTransportMode(), "do-ws");
  });

  it("returns stored mode after setTransportMode", () => {
    setTransportMode("firebase");
    assert.equal(getTransportMode(), "firebase");
  });

  it("returns do-ws for unknown stored value", () => {
    store["kalambury:transport-mode"] = "invalid-value";
    assert.equal(getTransportMode(), "do-ws");
  });

  after(() => { delete store["kalambury:transport-mode"]; });
});
