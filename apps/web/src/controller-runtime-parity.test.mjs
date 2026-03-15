import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("./pages/ControllerRuntimePage.tsx", import.meta.url),
  "utf8",
);

test("controller runtime page no longer wraps the game controller in technical copy", () => {
  assert.equal(source.includes("Kontroler /"), false);
});

test("controller runtime page mounts runtime through the shared web helper", () => {
  assert.equal(source.includes("mountGameRuntime"), true);
  assert.equal(source.includes("transport: {"), false);
});
