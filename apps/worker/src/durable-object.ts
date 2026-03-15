import type {
  SessionJoinRequest,
  SessionJoinResponse,
  SessionParticipant,
  SessionRecord,
  SessionTransportEvent,
} from "@project-party/types";

type DurableObjectStorageLike = {
  get: <T>(key: string) => Promise<T | undefined>;
  put: <T>(key: string, value: T) => Promise<void>;
};

type DurableObjectStateLike = {
  storage: DurableObjectStorageLike;
};

const SESSION_RECORD_KEY = "session-record";
const SESSION_EVENTS_KEY = "session-events";

type SessionEventPublishRequest = {
  id?: string;
  event: string;
  payload?: unknown;
  sourceClientId: string;
  createdAt?: string;
};

type SessionEventsResponse = {
  events: SessionTransportEvent[];
  nextOffset: number;
};

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
      const participant: SessionParticipant = {
        playerId: `player-${Math.random().toString(36).slice(2, 10)}`,
        playerName: payload.playerName.trim(),
        joinedAt: new Date().toISOString(),
        isConnected: true,
      };
      const nextRecord: SessionRecord = {
        ...record,
        participants: [...record.participants, participant],
      };

      await this.state.storage.put(SESSION_RECORD_KEY, nextRecord);

      const joined: SessionJoinResponse = {
        sessionId: record.sessionId,
        sessionCode: record.sessionCode,
        gameId: record.gameId,
        playerId: participant.playerId,
        playerName: participant.playerName,
      };

      return Response.json(joined);
    }

    if (request.method === "GET" && url.pathname === "/events") {
      const record = await this.state.storage.get<SessionRecord>(
        SESSION_RECORD_KEY,
      );

      if (!record) {
        return Response.json({ error: "Session not found" }, { status: 404 });
      }

      const afterOffset = Number(url.searchParams.get("after") ?? "0");
      const events =
        (await this.state.storage.get<SessionTransportEvent[]>(
          SESSION_EVENTS_KEY,
        )) ?? [];

      const response: SessionEventsResponse = {
        events: events.filter((eventRecord) => eventRecord.offset > afterOffset),
        nextOffset: events.length,
      };

      return Response.json(response);
    }

    if (request.method === "POST" && url.pathname === "/events") {
      const record = await this.state.storage.get<SessionRecord>(
        SESSION_RECORD_KEY,
      );

      if (!record) {
        return Response.json({ error: "Session not found" }, { status: 404 });
      }

      const payload = (await request.json()) as SessionEventPublishRequest;
      const events =
        (await this.state.storage.get<SessionTransportEvent[]>(
          SESSION_EVENTS_KEY,
        )) ?? [];
      const eventRecord: SessionTransportEvent = {
        offset: events.length + 1,
        id: payload.id ?? crypto.randomUUID(),
        event: payload.event,
        payload: payload.payload,
        sourceClientId: payload.sourceClientId,
        createdAt: payload.createdAt ?? new Date().toISOString(),
      };

      await this.state.storage.put(SESSION_EVENTS_KEY, [...events, eventRecord]);

      return Response.json(eventRecord);
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  }
}
