import {
  getCatalogGameById,
  getVisibleCatalogGames,
  normalizeSessionCode,
} from "@project-party/shared";

import { createSession } from "./index.ts";
import { getSessionByCode, joinSession } from "./session-store.ts";
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

  return Response.json({ error: "Not found" }, { status: 404 });
}
