import type {
  SessionCreateRequest,
  SessionJoinRequest,
  SessionJoinResponse,
  SessionParticipant,
  SessionRecord,
  SessionTransportEvent,
} from "@project-party/types";

const sessionsByCode = new Map<string, SessionRecord>();
const sessionEventsByCode = new Map<string, SessionTransportEvent[]>();

export type DurableObjectStubLike = {
  fetch: (input: Request | URL | string, init?: RequestInit) => Promise<Response>;
};

export type DurableObjectNamespaceLike = {
  idFromName: (name: string) => unknown;
  get: (id: unknown) => DurableObjectStubLike;
};

export type SessionStoreEnv = {
  SESSIONS?: DurableObjectNamespaceLike;
};

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

export function getSessionStub(
  sessionCode: string,
  env?: SessionStoreEnv,
): DurableObjectStubLike | null {
  if (!env?.SESSIONS) {
    return null;
  }

  const id = env.SESSIONS.idFromName(sessionCode);
  return env.SESSIONS.get(id);
}

export function saveSession(record: SessionRecord): SessionRecord {
  sessionsByCode.set(record.sessionCode, record);
  return record;
}

function getSessionEvents(sessionCode: string) {
  return sessionEventsByCode.get(sessionCode) ?? [];
}

function saveSessionEvents(sessionCode: string, events: SessionTransportEvent[]) {
  sessionEventsByCode.set(sessionCode, events);
}

export async function getSessionByCode(
  sessionCode: string,
  env?: SessionStoreEnv,
): Promise<SessionRecord | null> {
  const stub = getSessionStub(sessionCode, env);

  if (stub) {
    const response = await stub.fetch("https://session.internal/record");

    if (response.status === 404) {
      return null;
    }

    return (await response.json()) as SessionRecord;
  }

  return sessionsByCode.get(sessionCode) ?? null;
}

export async function createSessionRecord(
  request: SessionCreateRequest,
  sessionId: string,
  sessionCode: string,
  env?: SessionStoreEnv,
): Promise<SessionRecord> {
  const record: SessionRecord = {
    sessionId,
    sessionCode,
    gameId: request.gameId,
    config: request.config,
    createdAt: new Date().toISOString(),
    participants: [],
  };
  const stub = getSessionStub(sessionCode, env);

  if (stub) {
    const response = await stub.fetch("https://session.internal/record", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(record),
    });

    return (await response.json()) as SessionRecord;
  }

  return saveSession(record);
}

export async function joinSession(
  request: SessionJoinRequest,
  env?: SessionStoreEnv,
): Promise<SessionJoinResponse | null> {
  const stub = getSessionStub(request.sessionCode, env);

  if (stub) {
    const response = await stub.fetch("https://session.internal/join", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (response.status === 404) {
      return null;
    }

    return (await response.json()) as SessionJoinResponse;
  }

  const session = await getSessionByCode(request.sessionCode);

  if (!session) {
    return null;
  }

  const participant: SessionParticipant = {
    playerId: `player-${Math.random().toString(36).slice(2, 10)}`,
    playerName: request.playerName.trim(),
    joinedAt: new Date().toISOString(),
    isConnected: true,
  };

  saveSession({
    ...session,
    participants: [...session.participants, participant],
  });

  return {
    sessionId: session.sessionId,
    sessionCode: session.sessionCode,
    gameId: session.gameId,
    playerId: participant.playerId,
    playerName: participant.playerName,
  };
}

export async function publishSessionEvent(
  sessionCode: string,
  request: SessionEventPublishRequest,
  env?: SessionStoreEnv,
): Promise<SessionTransportEvent | null> {
  const stub = getSessionStub(sessionCode, env);

  if (stub) {
    const response = await stub.fetch("https://session.internal/events", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (response.status === 404) {
      return null;
    }

    return (await response.json()) as SessionTransportEvent;
  }

  const session = await getSessionByCode(sessionCode);

  if (!session) {
    return null;
  }

  const events = getSessionEvents(sessionCode);
  const eventRecord: SessionTransportEvent = {
    offset: events.length + 1,
    id: request.id ?? crypto.randomUUID(),
    event: request.event,
    payload: request.payload,
    sourceClientId: request.sourceClientId,
    createdAt: request.createdAt ?? new Date().toISOString(),
  };

  saveSessionEvents(sessionCode, [...events, eventRecord]);
  return eventRecord;
}

export async function getSessionEventsAfter(
  sessionCode: string,
  afterOffset: number,
  env?: SessionStoreEnv,
): Promise<SessionEventsResponse | null> {
  const stub = getSessionStub(sessionCode, env);

  if (stub) {
    const response = await stub.fetch(
      `https://session.internal/events?after=${afterOffset}`,
    );

    if (response.status === 404) {
      return null;
    }

    return (await response.json()) as SessionEventsResponse;
  }

  const session = await getSessionByCode(sessionCode);

  if (!session) {
    return null;
  }

  const events = getSessionEvents(sessionCode);
  return {
    events: events.filter((eventRecord) => eventRecord.offset > afterOffset),
    nextOffset: events.length,
  };
}
