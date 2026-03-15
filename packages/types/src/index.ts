export type DeviceProfile =
  | "single-screen"
  | "host-plus-phones"
  | "phones-only";

export type PlayerRole = "host" | "player" | "controller" | "viewer";

export type RuntimeDevice = "tv" | "desktop" | "tablet" | "phone";

export type GameStatus = "draft" | "beta" | "stable" | "in-development";

export type GameMeta = {
  name: string;
  shortDescription: string;
  status: GameStatus;
  tags: string[];
  deviceProfiles: DeviceProfile[];
  playerCount?: {
    min: number;
    max: number;
  };
  coverImage?: string;
};

export type {
  SessionCreateRequest,
  SessionCreateResponse,
  SessionJoinRequest,
  SessionJoinResponse,
  SessionParticipant,
  SessionRecord,
  SessionTransportEvent,
} from "./session.ts";
export type {
  CatalogGame,
  CatalogGamePlayMode,
  CatalogGameStatus,
  CatalogGamesFilters,
} from "./catalog.ts";
