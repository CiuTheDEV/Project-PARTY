import type {
  CatalogGame,
  SessionCreateRequest,
  SessionCreateResponse,
  SessionJoinRequest,
  SessionJoinResponse,
  SessionRecord,
  SessionTransportEvent,
} from "@project-party/types";

export async function fetchCatalogGamesViaApi(): Promise<CatalogGame[]> {
  const response = await fetch("/api/games");

  if (!response.ok) {
    throw new Error(`Failed to fetch catalog: ${response.status}`);
  }

  return (await response.json()) as CatalogGame[];
}

export async function fetchCatalogGameViaApi(
  gameId: string,
): Promise<CatalogGame> {
  const response = await fetch(`/api/games/${gameId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch game: ${response.status}`);
  }

  return (await response.json()) as CatalogGame;
}

export async function createSessionViaApi(
  payload: SessionCreateRequest,
): Promise<SessionCreateResponse> {
  const response = await fetch("/api/sessions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.status}`);
  }

  return (await response.json()) as SessionCreateResponse;
}

export async function fetchSessionViaApi(sessionCode: string): Promise<SessionRecord> {
  const response = await fetch(`/api/sessions/${sessionCode}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch session: ${response.status}`);
  }

  return (await response.json()) as SessionRecord;
}

export async function joinSessionViaApi(
  payload: SessionJoinRequest,
): Promise<SessionJoinResponse> {
  const response = await fetch("/api/sessions/join", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to join session: ${response.status}`);
  }

  return (await response.json()) as SessionJoinResponse;
}

export async function publishSessionEventViaApi(
  sessionCode: string,
  payload: {
    id?: string;
    event: string;
    payload?: unknown;
    sourceClientId: string;
    createdAt?: string;
  },
): Promise<SessionTransportEvent> {
  const response = await fetch(`/api/sessions/${sessionCode}/events`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to publish session event: ${response.status}`);
  }

  return (await response.json()) as SessionTransportEvent;
}

export async function fetchSessionEventsViaApi(
  sessionCode: string,
  afterOffset: number,
): Promise<{
  events: SessionTransportEvent[];
  nextOffset: number;
}> {
  const response = await fetch(
    `/api/sessions/${sessionCode}/events?after=${afterOffset}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch session events: ${response.status}`);
  }

  return (await response.json()) as {
    events: SessionTransportEvent[];
    nextOffset: number;
  };
}
