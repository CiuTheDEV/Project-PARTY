import {
  getCatalogGameById as getSharedCatalogGameById,
  getVisibleCatalogGames as getSharedVisibleCatalogGames,
  isCatalogGameLaunchable,
} from "@project-party/shared";
import type { CatalogGame, CatalogGamePlayMode } from "@project-party/types";

export type { CatalogGame } from "@project-party/types";

export function getVisibleCatalogGames(): CatalogGame[] {
  return getSharedVisibleCatalogGames();
}

export function getCatalogGameById(gameId: string): CatalogGame | null {
  return getSharedCatalogGameById(gameId);
}

export function isGameLaunchable(gameId: string): boolean {
  return isCatalogGameLaunchable(gameId);
}

export function getCatalogGameDeviceLabel(
  playMode: CatalogGamePlayMode,
): string {
  switch (playMode) {
    case "tv_only":
      return "Tylko TV";
    case "tv_plus_phones":
      return "TV + telefony";
    case "tv_plus_presenter_phone":
      return "TV + telefon prezentera";
  }
}

export function getCatalogGameLaunchLabel(game: CatalogGame): string {
  return game.status === "active" ? "Uruchom sesje" : "W przygotowaniu";
}
