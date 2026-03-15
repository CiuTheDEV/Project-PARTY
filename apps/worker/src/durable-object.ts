import type {
  SessionJoinRequest,
  SessionJoinResponse,
  SessionRecord,
} from "@project-party/types";

type DurableObjectStorageLike = {
  get: <T>(key: string) => Promise<T | undefined>;
  put: <T>(key: string, value: T) => Promise<void>;
};

type DurableObjectStateLike = {
  storage: DurableObjectStorageLike;
};

const SESSION_RECORD_KEY = "session-record";

export class SessionDurableObject {
  constructor(private readonly state: DurableObjectStateLike) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/record") {
      const record = await this.state.storage.get<SessionRecord>(
        SESSION_RECORD_KEY,
      );

      if (!record) {
        return Response.json({ error: "Session not found" }, { status: 404 });
      }

      return Response.json(record);
    }

    if (request.method === "POST" && url.pathname === "/record") {
      const record = (await request.json()) as SessionRecord;
      await this.state.storage.put(SESSION_RECORD_KEY, record);
      return Response.json(record);
    }

    if (request.method === "POST" && url.pathname === "/join") {
      const record = await this.state.storage.get<SessionRecord>(
        SESSION_RECORD_KEY,
      );

      if (!record) {
        return Response.json({ error: "Session not found" }, { status: 404 });
      }

      const payload = (await request.json()) as SessionJoinRequest;
      const joined: SessionJoinResponse = {
        sessionId: record.sessionId,
        sessionCode: record.sessionCode,
        gameId: record.gameId,
        playerId: `player-${Math.random().toString(36).slice(2, 10)}`,
        playerName: payload.playerName.trim(),
      };

      return Response.json(joined);
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  }
}
