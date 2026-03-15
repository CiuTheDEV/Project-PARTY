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
  assert.deepEqual(payload.participants, []);
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

test("POST /api/sessions/join updates session participants", async () => {
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

  await handleRequest(
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

  const sessionResponse = await handleRequest(
    new Request(
      `https://project-party.local/api/sessions/${created.sessionCode}`,
    ),
  );
  const payload = await sessionResponse.json();

  assert.equal(sessionResponse.status, 200);
  assert.equal(payload.participants.length, 1);
  assert.equal(payload.participants[0]?.playerName, "Mateo");
  assert.equal(payload.participants[0]?.isConnected, true);
});

test("session event endpoints publish and read ordered events", async () => {
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

  const publishResponse = await handleRequest(
    new Request(
      `https://project-party.local/api/sessions/${created.sessionCode}/events`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          event: "kalambury.presenter",
          payload: { type: "controller-ready", deviceId: "dev-1" },
          sourceClientId: "client-1",
        }),
      },
    ),
  );
  const published = await publishResponse.json();

  assert.equal(publishResponse.status, 201);
  assert.equal(published.offset, 1);
  assert.equal(published.event, "kalambury.presenter");

  const eventsResponse = await handleRequest(
    new Request(
      `https://project-party.local/api/sessions/${created.sessionCode}/events?after=0`,
    ),
  );
  const payload = await eventsResponse.json();

  assert.equal(eventsResponse.status, 200);
  assert.equal(payload.events.length, 1);
  assert.equal(payload.events[0]?.sourceClientId, "client-1");
  assert.equal(payload.nextOffset, 1);
});
