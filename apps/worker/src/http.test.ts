import assert from "node:assert/strict";
import test from "node:test";

import { handleRequest } from "./http.ts";

test("GET /api/games returns the visible catalog", async () => {
  const response = await handleRequest(
    new Request("https://project-party.local/api/games"),
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(Array.isArray(payload), true);
  assert.equal(payload[0]?.slug, "kalambury");
});

test("GET /api/games/:slug returns a single catalog game", async () => {
  const response = await handleRequest(
    new Request("https://project-party.local/api/games/kalambury"),
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.slug, "kalambury");
});

test("POST /api/sessions creates a session code", async () => {
  const response = await handleRequest(
    new Request("https://project-party.local/api/sessions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        gameId: "kalambury",
        config: { mode: "classic" },
      }),
    }),
  );
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.match(payload.sessionCode, /^[A-Z0-9]{6}$/);
});

test("GET /api/sessions/:code returns the created session", async () => {
  const createResponse = await handleRequest(
    new Request("https://project-party.local/api/sessions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        gameId: "kalambury",
        config: { mode: "classic" },
      }),
    }),
  );
  const created = await createResponse.json();

  const response = await handleRequest(
    new Request(
      `https://project-party.local/api/sessions/${created.sessionCode}`,
    ),
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.sessionCode, created.sessionCode);
  assert.equal(payload.gameId, "kalambury");
});

test("POST /api/sessions/join joins an existing session", async () => {
  const createResponse = await handleRequest(
    new Request("https://project-party.local/api/sessions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        gameId: "kalambury",
        config: { mode: "classic" },
      }),
    }),
  );
  const created = await createResponse.json();

  const response = await handleRequest(
    new Request("https://project-party.local/api/sessions/join", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sessionCode: created.sessionCode,
        playerName: "Mateo",
      }),
    }),
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.sessionCode, created.sessionCode);
  assert.equal(payload.gameId, "kalambury");
  assert.equal(payload.playerName, "Mateo");
});
