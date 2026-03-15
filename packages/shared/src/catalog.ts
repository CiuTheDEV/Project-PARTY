import type { CatalogGame } from "../../types/src/catalog.ts";

const catalogGames: CatalogGame[] = [
  {
    id: "kalambury",
    slug: "kalambury",
    name: "Kalambury",
    shortDescription:
      "Rysowanie i zgadywanie hasel na czas przed wspolnym ekranem.",
    playMode: "tv_plus_phones",
    status: "active",
    minPlayers: 2,
    maxPlayers: 12,
    thumbnailUrl: null,
    accentColor: "#00f0ff",
    sortOrder: 1,
    isFeatured: true,
    requirementsText: "Wspolny ekran oraz telefony graczy.",
    setupNote: "Tryb druzynowy pozostaje poza zakresem tej iteracji.",
    availabilityNote: null,
    createdAt: "2026-03-13T00:00:00.000Z",
    updatedAt: "2026-03-13T00:00:00.000Z",
  },
  {
    id: "tajniacy",
    slug: "tajniacy",
    name: "Tajniacy",
    shortDescription:
      "Druzynowa gra skojarzen z osobnym ekranem dla prowadzacego.",
    playMode: "tv_plus_presenter_phone",
    status: "active",
    minPlayers: 4,
    maxPlayers: 10,
    thumbnailUrl: null,
    accentColor: "#E74C3C",
    sortOrder: 2,
    isFeatured: false,
    requirementsText: "Wspolny ekran i telefony kapitanow.",
    setupNote: null,
    availabilityNote: null,
    createdAt: "2026-03-13T00:00:00.000Z",
    updatedAt: "2026-03-14T00:00:00.000Z",
  },
  {
    id: "5-sekund",
    slug: "5-sekund",
    name: "5 Sekund",
    shortDescription: "Szybkie pytania i odpowiedzi pod presja czasu.",
    playMode: "tv_only",
    status: "coming_soon",
    minPlayers: 2,
    maxPlayers: 8,
    thumbnailUrl: null,
    accentColor: "#fb923c",
    sortOrder: 3,
    isFeatured: false,
    requirementsText: "Wystarczy wspolny ekran.",
    setupNote: null,
    availabilityNote: null,
    createdAt: "2026-03-13T00:00:00.000Z",
    updatedAt: "2026-03-13T00:00:00.000Z",
  },
  {
    id: "mamy-szpiega",
    slug: "mamy-szpiega",
    name: "Mamy szpiega",
    shortDescription:
      "Jedna osoba blefuje, reszta probuje odkryc, kto nie zna miejsca.",
    playMode: "tv_plus_phones",
    status: "coming_soon",
    minPlayers: 3,
    maxPlayers: 10,
    thumbnailUrl: null,
    accentColor: "#06b6d4",
    sortOrder: 4,
    isFeatured: false,
    requirementsText: "Wspolny ekran oraz telefony graczy.",
    setupNote: null,
    availabilityNote: null,
    createdAt: "2026-03-13T00:00:00.000Z",
    updatedAt: "2026-03-13T00:00:00.000Z",
  },
  {
    id: "panstwa-miasta",
    slug: "panstwa-miasta",
    name: "Panstwa Miasta",
    shortDescription: "Kategorie, litery i refleks calej ekipy.",
    playMode: "tv_plus_phones",
    status: "coming_soon",
    minPlayers: 2,
    maxPlayers: 12,
    thumbnailUrl: null,
    accentColor: "#22c55e",
    sortOrder: 5,
    isFeatured: false,
    requirementsText: "Wspolny ekran oraz telefony graczy.",
    setupNote: null,
    availabilityNote: null,
    createdAt: "2026-03-13T00:00:00.000Z",
    updatedAt: "2026-03-13T00:00:00.000Z",
  },
];

export function getVisibleCatalogGames(): CatalogGame[] {
  return catalogGames
    .filter((game) => game.status !== "hidden")
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

export function getCatalogGameById(gameId: string): CatalogGame | null {
  return getVisibleCatalogGames().find((game) => game.id === gameId) ?? null;
}

export function isCatalogGameLaunchable(gameId: string): boolean {
  return getCatalogGameById(gameId)?.status === "active";
}
