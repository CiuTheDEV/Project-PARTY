export type SessionCreateRequest = {
  gameId: string;
  config: Record<string, unknown>;
};

export type SessionParticipant = {
  playerId: string;
  playerName: string;
  joinedAt: string;
  isConnected: boolean;
};

export type SessionTransportEvent = {
  offset: number;
  id: string;
  event: string;
  payload?: unknown;
  sourceClientId: string;
  createdAt: string;
};

export type SessionRecord = SessionCreateResponse & {
  gameId: string;
  config: Record<string, unknown>;
  createdAt: string;
  participants: SessionParticipant[];
};

export type SessionCreateResponse = {
  sessionId: string;
  sessionCode: string;
};

export type SessionJoinRequest = {
  sessionCode: string;
  playerName: string;
};

export type SessionJoinResponse = {
  sessionId: string;
  sessionCode: string;
  gameId: string;
  playerId: string;
  playerName: string;
};
