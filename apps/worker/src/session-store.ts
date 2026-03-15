import type {
  SessionCreateRequest,
  SessionJoinRequest,
  SessionJoinResponse,
  SessionRecord,
} from "@project-party/types";

const sessionsByCode = new Map<string, SessionRecord>();

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

function getSessionStub(
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

  return {
    sessionId: session.sessionId,
    sessionCode: session.sessionCode,
    gameId: session.gameId,
    playerId: `player-${Math.random().toString(36).slice(2, 10)}`,
    playerName: request.playerName.trim(),
  };
}
