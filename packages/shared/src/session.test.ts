import assert from "node:assert/strict";
import test from "node:test";

import { createSessionCode, normalizeSessionCode } from "./session.ts";

test("normalizeSessionCode strips separators and uppercases the code", () => {
  assert.equal(normalizeSessionCode(" ab-c 12 "), "ABC12");
});

test("createSessionCode returns a six-character uppercase code", () => {
  const code = createSessionCode(() => 0.123456789);

  assert.equal(code.length, 6);
  assert.match(code, /^[A-Z0-9]{6}$/);
});
