import type {
  CatalogGame,
  SessionCreateRequest,
  SessionCreateResponse,
  SessionJoinRequest,
  SessionJoinResponse,
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

export async function fetchSessionViaApi(sessionCode: string): Promise<
  SessionCreateResponse & {
    gameId: string;
    config: Record<string, unknown>;
    createdAt: string;
  }
> {
  const response = await fetch(`/api/sessions/${sessionCode}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch session: ${response.status}`);
  }

  return (await response.json()) as SessionCreateResponse & {
    gameId: string;
    config: Record<string, unknown>;
    createdAt: string;
  };
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
