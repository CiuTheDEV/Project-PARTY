import type {
  SessionCreateRequest,
  SessionJoinRequest,
  SessionJoinResponse,
  SessionRecord,
} from "@project-party/types";

const sessionsByCode = new Map<string, SessionRecord>();

export function saveSession(record: SessionRecord): SessionRecord {
  sessionsByCode.set(record.sessionCode, record);
  return record;
}

export function getSessionByCode(sessionCode: string): SessionRecord | null {
  return sessionsByCode.get(sessionCode) ?? null;
}

export function createSessionRecord(
  request: SessionCreateRequest,
  sessionId: string,
  sessionCode: string,
): SessionRecord {
  return saveSession({
    sessionId,
    sessionCode,
    gameId: request.gameId,
    config: request.config,
    createdAt: new Date().toISOString(),
  });
}

export function joinSession(
  request: SessionJoinRequest,
): SessionJoinResponse | null {
  const session = getSessionByCode(request.sessionCode);

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
