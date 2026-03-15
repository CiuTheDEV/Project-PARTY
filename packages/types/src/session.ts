export type SessionCreateRequest = {
  gameId: string;
  config: Record<string, unknown>;
};

export type SessionRecord = SessionCreateResponse & {
  gameId: string;
  config: Record<string, unknown>;
  createdAt: string;
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
