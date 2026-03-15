import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("./pages/GameLaunchPage.tsx", import.meta.url),
  "utf8",
);

test("game launch page no longer exposes the technical runtime launcher copy", () => {
  assert.equal(source.includes("Runtime launcher"), false);
  assert.equal(source.includes("Mounted Runtime"), false);
  assert.equal(source.includes("Hub czyta metadata"), false);
  assert.equal(source.includes("Konfiguracja sesji"), false);
});

test("game launch page creates the session automatically for the module entry", () => {
  assert.equal(source.includes("setSession(createdSession);"), true);
  assert.equal(source.includes("Uruchamianie gry"), false);
  assert.equal(source.includes("Kod sesji"), false);
  assert.equal(
    source.includes("Uruchamianie Kalamburow. Zaczekaj chwile."),
    false,
  );
  assert.equal(source.includes("Project PARTY"), false);
  assert.equal(source.includes("launchWordmarkStyle"), false);
  assert.equal(source.includes("Ladowanie menu gry..."), true);
});

test("game launch page mounts runtime through the shared web helper", () => {
  assert.equal(source.includes("mountGameRuntime"), true);
  assert.equal(source.includes("sessionOverlayStyle"), false);
});

test("game launch page reuses a persisted session before creating a new one", () => {
  assert.equal(source.includes("getReusableRuntimeSession"), true);
  assert.equal(source.includes("fetchSessionViaApi"), true);
  assert.equal(source.includes("saveReusableRuntimeSession"), true);
  assert.equal(source.includes("clearReusableRuntimeSession"), true);
});

test("game launch page cleans up the exact runtime instance instead of the latest ref", () => {
  assert.equal(source.includes("void runtimeHandleRef.current?.destroy?.();"), false);
  assert.match(source, /const runtime = runtimeHandleRef\.current;/);
  assert.match(source, /void runtime\.destroy\?\.\(\);/);
});
