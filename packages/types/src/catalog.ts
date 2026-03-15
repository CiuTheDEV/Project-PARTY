export type CatalogGameStatus = "active" | "coming_soon" | "hidden";

export type CatalogGamePlayMode =
  | "tv_only"
  | "tv_plus_phones"
  | "tv_plus_presenter_phone";

export type CatalogGame = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  playMode: CatalogGamePlayMode;
  status: CatalogGameStatus;
  minPlayers: number;
  maxPlayers: number;
  thumbnailUrl: string | null;
  accentColor: string | null;
  sortOrder: number;
  isFeatured: boolean;
  requirementsText: string;
  setupNote: string | null;
  availabilityNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CatalogGamesFilters = {
  status?: CatalogGameStatus | "all";
  playMode?: CatalogGamePlayMode | "all";
};
