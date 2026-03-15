import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("./pages/ControllerRuntimePage.tsx", import.meta.url),
  "utf8",
);

test("controller runtime page cleans up the exact runtime instance instead of the latest ref", () => {
  assert.equal(source.includes("void runtimeHandleRef.current?.destroy?.();"), false);
  assert.match(source, /const runtime = runtimeHandleRef\.current;/);
  assert.match(source, /void runtime\.destroy\?\.\(\);/);
});
