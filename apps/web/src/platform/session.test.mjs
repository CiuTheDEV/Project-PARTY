import assert from "node:assert/strict";
import test from "node:test";

import { normalizeSessionCode } from "@project-party/shared";
import { getJoinFlowState } from "./session.ts";

test("normalizeSessionCode trims separators and uppercases the code", () => {
  assert.equal(normalizeSessionCode(" ab-c 12 "), "ABC12");
});

test("getJoinFlowState distinguishes empty, incomplete and ready states", () => {
  assert.equal(getJoinFlowState({ code: "", playerName: "" }), "idle");
  assert.equal(
    getJoinFlowState({ code: "AB12", playerName: "" }),
    "incomplete",
  );
  assert.equal(
    getJoinFlowState({ code: "AB12", playerName: "Mateo" }),
    "ready",
  );
});
