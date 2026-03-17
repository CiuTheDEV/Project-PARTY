import assert from "node:assert/strict";
import test from "node:test";

import {
  createPresenterChannel,
  getChannelName,
  resolveBroadcastChannel,
} from "./channel-utils.ts";

test("getChannelName returns uppercased session code", () => {
  assert.equal(
    getChannelName("abc123"),
    "project-party.kalambury.presenter.ABC123",
  );
  assert.equal(
    getChannelName("XYZ"),
    "project-party.kalambury.presenter.XYZ",
  );
});

test("resolveBroadcastChannel returns provided impl when given", () => {
  class FakeBC {
    onmessage = null;
    postMessage() {}
    close() {}
  }
  const resolved = resolveBroadcastChannel(FakeBC as never);
  assert.equal(resolved, FakeBC);
});

test("resolveBroadcastChannel returns global BroadcastChannel when no impl provided and global exists", () => {
  // Node.js v18+ provides BroadcastChannel globally
  if (typeof BroadcastChannel === "undefined") {
    const resolved = resolveBroadcastChannel(undefined);
    assert.equal(resolved, null);
  } else {
    const resolved = resolveBroadcastChannel(undefined);
    assert.equal(resolved, BroadcastChannel);
  }
});

test("createPresenterChannel returns null when sessionCode is empty", () => {
  const channel = createPresenterChannel("");
  assert.equal(channel, null);
});

test("createPresenterChannel returns a channel object when BroadcastChannel is available", () => {
  // Node.js v18+ provides BroadcastChannel globally
  if (typeof BroadcastChannel === "undefined") {
    const channel = createPresenterChannel("ABC123");
    assert.equal(channel, null);
  } else {
    const channel = createPresenterChannel("ABC123");
    assert.notEqual(channel, null);
    assert.equal(typeof channel?.postMessage, "function");
    assert.equal(typeof channel?.subscribe, "function");
    assert.equal(typeof channel?.close, "function");
    channel?.close();
  }
});
