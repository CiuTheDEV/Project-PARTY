// ──────────────────────────────────────────────
// Tajniacy – generator planszy 5×5
// ──────────────────────────────────────────────

import type { Board, Card, CardIdentity, TeamId } from "./types.ts";
import { getWordPool } from "./words.ts";

const BOARD_SIZE = 25;
const STARTING_TEAM_CARDS = 9;
const OTHER_TEAM_CARDS = 8;

/**
 * Fisher–Yates shuffle (in-place).
 */
function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Losuje drużynę startującą 50/50.
 */
export function pickStartingTeam(): TeamId {
  return Math.random() < 0.5 ? "red" : "blue";
}

/**
 * Generuje rozkład tożsamości kart.
 *
 * - Drużyna startująca: 9 kart
 * - Druga drużyna: 8 kart
 * - Zabójcy: assassinCount (1–5)
 * - Reszta: neutralni
 */
export function generateIdentities(
  startingTeam: TeamId,
  assassinCount: number,
): CardIdentity[] {
  const clampedAssassins = Math.max(1, Math.min(5, assassinCount));
  const neutralCount =
    BOARD_SIZE - STARTING_TEAM_CARDS - OTHER_TEAM_CARDS - clampedAssassins;

  const startingId: CardIdentity = startingTeam;
  const otherTeam: CardIdentity = startingTeam === "red" ? "blue" : "red";

  const identities: CardIdentity[] = [
    ...Array(STARTING_TEAM_CARDS).fill(startingId),
    ...Array(OTHER_TEAM_CARDS).fill(otherTeam),
    ...Array(clampedAssassins).fill("assassin" as CardIdentity),
    ...Array(neutralCount).fill("neutral" as CardIdentity),
  ];

  return shuffle(identities);
}

/**
 * Generuje pełną planszę:
 * 1. losuje 25 unikalnych haseł z puli,
 * 2. losuje drużynę startującą,
 * 3. generuje rozkład tożsamości,
 * 4. łączy w tablicę Card[].
 */
export function generateBoard(
  category: "standard" | "uncensored",
  assassinCount: number,
  startingTeam: TeamId,
): Board {
  const pool = getWordPool(category);
  const words = shuffle(pool).slice(0, BOARD_SIZE);
  const identities = generateIdentities(startingTeam, assassinCount);

  return words.map((word, index): Card => ({
    word,
    identity: identities[index],
    revealed: false,
  }));
}

/**
 * Liczy pozostałe (nieodkryte) karty danej tożsamości.
 */
export function countRemaining(board: Board, identity: CardIdentity): number {
  return board.filter(
    (card) => card.identity === identity && !card.revealed,
  ).length;
}
