import {
  getCatalogGameById,
  getVisibleCatalogGames,
  normalizeSessionCode,
} from "@project-party/shared";

import { createSession } from "./index.ts";
import {
  getSessionByCode,
  getSessionEventsAfter,
  getSessionStub,
  joinSession,
  publishSessionEvent,
} from "./session-store.ts";
import type { WorkerEnv } from "./cloudflare-entry.ts";

export async function handleRequest(
  request: Request,
  env?: WorkerEnv,
): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/api/games") {
    return Response.json(getVisibleCatalogGames());
  }

  if (request.method === "GET" && url.pathname.startsWith("/api/games/")) {
    const gameId = url.pathname.replace("/api/games/", "");
    const game = getCatalogGameById(gameId);

    if (!game) {
      return Response.json({ error: "Game not found" }, { status: 404 });
    }

    return Response.json(game);
  }

  if (request.method === "POST" && url.pathname === "/api/sessions") {
    const body = (await request.json()) as {
      gameId: string;
      config?: Record<string, unknown>;
    };

    const session = await createSession({
      gameId: body.gameId,
      config: body.config ?? {},
    }, env);

    return Response.json(session, { status: 201 });
  }

  if (request.method === "POST" && url.pathname === "/api/sessions/join") {
    const body = (await request.json()) as {
      sessionCode: string;
      playerName: string;
    };
    const joined = await joinSession({
      sessionCode: normalizeSessionCode(body.sessionCode),
      playerName: body.playerName,
    }, env);

    if (!joined) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    return Response.json(joined);
  }

  if (
    request.method === "GET" &&
    url.pathname.startsWith("/api/sessions/") &&
    url.pathname.endsWith("/events")
  ) {
    const sessionCode = normalizeSessionCode(
      url.pathname.replace("/api/sessions/", "").replace("/events", ""),
    );
    const after = Number(url.searchParams.get("after") ?? "0");
    const events = await getSessionEventsAfter(sessionCode, after, env);

    if (!events) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    return Response.json(events);
  }

  if (
    request.method === "POST" &&
    url.pathname.startsWith("/api/sessions/") &&
    url.pathname.endsWith("/events")
  ) {
    const sessionCode = normalizeSessionCode(
      url.pathname.replace("/api/sessions/", "").replace("/events", ""),
    );
    const body = (await request.json()) as {
      id?: string;
      event: string;
      payload?: unknown;
      sourceClientId: string;
      createdAt?: string;
    };
    const eventRecord = await publishSessionEvent(sessionCode, body, env);

    if (!eventRecord) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    return Response.json(eventRecord, { status: 201 });
  }

  if (
    request.method === "GET" &&
    url.pathname.startsWith("/api/sessions/") &&
    url.pathname.endsWith("/ws")
  ) {
    const sessionCode = normalizeSessionCode(
      url.pathname.replace("/api/sessions/", "").replace("/ws", ""),
    );
    const stub = getSessionStub(sessionCode, env);

    if (!stub) {
      return Response.json({ error: "WebSocket requires Durable Objects" }, { status: 501 });
    }

    return stub.fetch(new Request("https://session.internal/ws", {
      method: "GET",
      headers: request.headers,
    }));
  }

  if (request.method === "GET" && url.pathname.startsWith("/api/sessions/")) {
    const sessionCode = normalizeSessionCode(
      url.pathname.replace("/api/sessions/", ""),
    );
    const session = await getSessionByCode(sessionCode, env);

    if (!session) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    return Response.json(session);
  }

  return Response.json({ error: "Not found" }, { status: 404 });
}
