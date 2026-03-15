import assert from "node:assert/strict";
import test from "node:test";

import {
  createSessionViaApi,
  fetchCatalogGameViaApi,
  fetchCatalogGamesViaApi,
  fetchSessionViaApi,
  joinSessionViaApi,
} from "./platform.ts";

test("fetchCatalogGamesViaApi returns parsed catalog payload", async () => {
  globalThis.fetch = async () =>
    new Response(JSON.stringify([{ id: "kalambury", slug: "kalambury" }]), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

  const payload = await fetchCatalogGamesViaApi();

  assert.equal(payload[0]?.slug, "kalambury");
});

test("fetchCatalogGameViaApi requests a single game by slug", async () => {
  let receivedUrl = null;
  globalThis.fetch = async (input) => {
    receivedUrl = String(input);

    return new Response(
      JSON.stringify({ id: "kalambury", slug: "kalambury" }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  };

  const payload = await fetchCatalogGameViaApi("kalambury");

  assert.equal(receivedUrl, "/api/games/kalambury");
  assert.equal(payload.slug, "kalambury");
});

test("createSessionViaApi posts create-session payload", async () => {
  let receivedBody = null;
  globalThis.fetch = async (_input, init) => {
    receivedBody = init?.body ? JSON.parse(String(init.body)) : null;

    return new Response(
      JSON.stringify({ sessionId: "session-1", sessionCode: "ABC123" }),
      {
        status: 201,
        headers: { "content-type": "application/json" },
      },
    );
  };

  const payload = await createSessionViaApi({
    gameId: "kalambury",
    config: { mode: "classic" },
  });

  assert.deepEqual(receivedBody, {
    gameId: "kalambury",
    config: { mode: "classic" },
  });
  assert.equal(payload.sessionCode, "ABC123");
});

test("fetchSessionViaApi requests a single session by code", async () => {
  let receivedUrl = null;
  globalThis.fetch = async (input) => {
    receivedUrl = String(input);

    return new Response(
      JSON.stringify({
        sessionId: "session-1",
        sessionCode: "ABC123",
        gameId: "kalambury",
        config: { mode: "classic" },
        createdAt: "2026-03-13T00:00:00.000Z",
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  };

  const payload = await fetchSessionViaApi("ABC123");

  assert.equal(receivedUrl, "/api/sessions/ABC123");
  assert.equal(payload.gameId, "kalambury");
});

test("joinSessionViaApi posts join payload", async () => {
  let receivedBody = null;
  globalThis.fetch = async (_input, init) => {
    receivedBody = init?.body ? JSON.parse(String(init.body)) : null;

    return new Response(
      JSON.stringify({
        sessionId: "session-1",
        sessionCode: "ABC123",
        gameId: "kalambury",
        playerId: "player-1",
        playerName: "Mateo",
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  };

  const payload = await joinSessionViaApi({
    sessionCode: "ABC123",
    playerName: "Mateo",
  });

  assert.deepEqual(receivedBody, {
    sessionCode: "ABC123",
    playerName: "Mateo",
  });
  assert.equal(payload.gameId, "kalambury");
});
