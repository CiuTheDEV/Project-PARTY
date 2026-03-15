import assert from "node:assert/strict";
import test from "node:test";

import { createSession } from "./index.ts";

test("createSession returns a session id and normalized join code", async () => {
  const session = await createSession({
    gameId: "kalambury",
    config: { rounds: 2 },
  });

  assert.equal(typeof session.sessionId, "string");
  assert.equal(session.sessionId.length > 0, true);
  assert.match(session.sessionCode, /^[A-Z0-9]{6}$/);
});
