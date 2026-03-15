import kalambury from "@project-party/game-kalambury";
import tajniacy from "@project-party/game-tajniacy";

export const gameRegistry = {
  kalambury,
  tajniacy,
} as const;

export function getGameDefinition(gameId: string) {
  return gameRegistry[gameId as keyof typeof gameRegistry] ?? null;
}
