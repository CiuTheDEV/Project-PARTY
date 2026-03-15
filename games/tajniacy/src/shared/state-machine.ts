// ──────────────────────────────────────────────
// Tajniacy – state machine
// ──────────────────────────────────────────────

import {
  countRemaining,
  generateBoard,
  pickStartingTeam,
} from "./board-generator.ts";
import type {
  Board,
  Card,
  ConnectedDevice,
  GamePhase,
  MatchSettings,
  MatchState,
  RoundRecord,
  RoundResult,
  RoundState,
  TeamId,
  WordCategory,
} from "./types.ts";

// ─── Defaults ────────────────────────────────

export const DEFAULT_TEAM_RED = {
  id: "red" as const,
  name: "Czerwoni",
  avatar: "dragon" as const,
};

export const DEFAULT_TEAM_BLUE = {
  id: "blue" as const,
  name: "Niebiescy",
  avatar: "shark" as const,
};

export function createDefaultSettings(): MatchSettings {
  return {
    teams: [
      { ...DEFAULT_TEAM_RED },
      { ...DEFAULT_TEAM_BLUE },
    ],
    category: null,
    assassinCount: 1,
    roundsToWin: 3,
  };
}

export function createInitialMatchState(): MatchState {
  return {
    phase: "setup",
    settings: createDefaultSettings(),
    round: null,
    matchScore: { red: 0, blue: 0 },
    roundHistory: [],
    matchWinner: null,
  };
}

// ─── Setup mutations ─────────────────────────

export function updateTeamName(
  state: MatchState,
  teamId: TeamId,
  name: string,
): MatchState {
  const teams = state.settings.teams.map((t) =>
    t.id === teamId ? { ...t, name } : t,
  ) as [typeof state.settings.teams[0], typeof state.settings.teams[1]];

  return {
    ...state,
    settings: { ...state.settings, teams },
  };
}

export function updateTeamAvatar(
  state: MatchState,
  teamId: TeamId,
  avatar: MatchSettings["teams"][0]["avatar"],
): MatchState {
  const teams = state.settings.teams.map((t) =>
    t.id === teamId ? { ...t, avatar } : t,
  ) as [typeof state.settings.teams[0], typeof state.settings.teams[1]];

  return {
    ...state,
    settings: { ...state.settings, teams },
  };
}

export function updateCategory(
  state: MatchState,
  category: WordCategory | null,
): MatchState {
  return {
    ...state,
    settings: { ...state.settings, category },
  };
}

export function updateAssassinCount(
  state: MatchState,
  count: number,
): MatchState {
  return {
    ...state,
    settings: {
      ...state.settings,
      assassinCount: Math.max(1, Math.min(5, count)),
    },
  };
}

export function updateRoundsToWin(
  state: MatchState,
  rounds: number,
): MatchState {
  return {
    ...state,
    settings: {
      ...state.settings,
      roundsToWin: Math.max(1, Math.min(5, rounds)),
    },
  };
}

// ─── Validation ──────────────────────────────

export function canStartMatch(
  state: MatchState,
  captainDevices: ConnectedDevice[],
): { ok: boolean; reason?: string } {
  if (!state.settings.category) {
    return { ok: false, reason: "Nie wybrano kategorii haseł." };
  }

  const connectedCaptains = captainDevices.filter(
    (d) => d.role === "captain" && d.isConnected,
  );
  if (connectedCaptains.length < 2) {
    return { ok: false, reason: "Wymagane są dwa podłączone urządzenia kapitanów." };
  }

  if (!state.settings.teams[0].name.trim() || !state.settings.teams[1].name.trim()) {
    return { ok: false, reason: "Obie drużyny muszą mieć nazwy." };
  }

  return { ok: true };
}

// ─── Round lifecycle ─────────────────────────

export function startNewRound(
  state: MatchState,
  usedWords: string[] = [],
): MatchState {
  const startingTeam = pickStartingTeam();
  const category = state.settings.category!;
  const board = generateBoard(
    category,
    state.settings.assassinCount,
    startingTeam,
    usedWords,
  );

  const round: RoundState = {
    board,
    startingTeam,
    score: { ...state.matchScore },
    roundNumber: state.roundHistory.length + 1,
    isFinished: false,
    result: null,
    hint: { red: null, blue: null },
  };

  return {
    ...state,
    phase: "playing",
    round,
    matchWinner: null,
  };
}

/**
 * Aktualizuje hasło podane przez kapitana.
 */
export function updateHint(
  state: MatchState,
  word: string,
  count: number,
  teamId: TeamId,
): MatchState {
  if (!state.round || state.round.isFinished) return state;

  return {
    ...state,
    round: {
      ...state.round,
      hint: {
        ...state.round.hint,
        [teamId]: { word, count },
      },
    },
  };
}

export function clearHint(
  state: MatchState,
  teamId: TeamId,
): MatchState {
  if (!state.round) return state;

  return {
    ...state,
    round: {
      ...state.round,
      hint: {
        ...state.round.hint,
        [teamId]: null,
      },
    },
  };
}

/**
 * Odkrywa kartę na planszy.
 * Zwraca zaktualizowany stan po odkryciu.
 * System nie egzekwuje tur – PRD §8.
 */
export function revealCard(
  state: MatchState,
  cardIndex: number,
): MatchState {
  if (!state.round || state.round.isFinished) return state;

  const board = state.round.board;
  if (cardIndex < 0 || cardIndex >= board.length) return state;

  const card = board[cardIndex];
  if (card.revealed) return state;

  // Odkryj kartę
  const newBoard: Board = board.map((c, i) =>
    i === cardIndex ? { ...c, revealed: true } : c,
  );

  // Sprawdź warunki końca rundy
  const result = checkRoundEnd(newBoard, state);

  const newRound: RoundState = {
    ...state.round,
    board: newBoard,
    isFinished: result !== null,
    result,
  };

  if (result && result.reason === "assassin") {
    // Zabójca — potrzebujemy wskazania od hosta, ale rundę oznaczamy jako zakończoną
    // Modal zabójcy obsługiwany w UI
    return {
      ...state,
      round: newRound,
      phase: "playing", // UI pokaże modal zabójcy
    };
  }

  if (result && result.reason === "all-found") {
    return finalizeRound(state, newRound, result);
  }

  return {
    ...state,
    round: newRound,
  };
}

/**
 * Sprawdza warunki końca rundy po odkryciu karty.
 */
function checkRoundEnd(board: Board, state: MatchState): RoundResult | null {
  const redRemaining = countRemaining(board, "red");
  const blueRemaining = countRemaining(board, "blue");

  // Ostatnia karta drużyny odkryta → ta drużyna wygrywa
  if (redRemaining === 0) {
    return { winner: "red", reason: "all-found" };
  }
  if (blueRemaining === 0) {
    return { winner: "blue", reason: "all-found" };
  }

  // Zabójca odkryty — runda kończy się, ale host musi wskazać who clicked
  const lastRevealed = board.find(
    (c) => c.revealed && c.identity === "assassin",
  );
  // Sprawdzamy czy właśnie odkryto zabójcę (szukamy odkrytych zabójców)
  const assassinRevealed = board.some(
    (c) => c.identity === "assassin" && c.revealed,
  );

  if (assassinRevealed) {
    // Winner will be determined by host through assassinClickedBy
    return { winner: "red", reason: "assassin" }; // placeholder, host will override
  }

  return null;
}

/**
 * Rozstrzyga kto kliknął zabójcę — wywoływane z UI po wskazaniu hosta.
 */
export function resolveAssassin(
  state: MatchState,
  clickedBy: TeamId,
): MatchState {
  if (!state.round || !state.round.result) return state;

  const winner: TeamId = clickedBy === "red" ? "blue" : "red";
  const result: RoundResult = {
    winner,
    reason: "assassin",
    assassinClickedBy: clickedBy,
  };

  const newRound: RoundState = {
    ...state.round,
    result,
  };

  return finalizeRound(state, newRound, result);
}

/**
 * Finalizuje rundę — aktualizuje wynik meczu i sprawdza warunek zwycięstwa.
 */
function finalizeRound(
  state: MatchState,
  round: RoundState,
  result: RoundResult,
): MatchState {
  const newMatchScore = {
    ...state.matchScore,
    [result.winner]: state.matchScore[result.winner] + 1,
  };

  const roundRecord: RoundRecord = {
    roundNumber: round.roundNumber,
    winner: result.winner,
    reason: result.reason,
    scoreAfter: { ...newMatchScore },
    category: state.settings.category!,
    assassinCount: state.settings.assassinCount,
  };

  const matchWinner =
    newMatchScore[result.winner] >= state.settings.roundsToWin
      ? result.winner
      : null;

  return {
    ...state,
    phase: matchWinner ? "match-end" : "round-end",
    round: { ...round, isFinished: true, result },
    matchScore: newMatchScore,
    roundHistory: [...state.roundHistory, roundRecord],
    matchWinner,
  };
}

// ─── Match lifecycle ─────────────────────────

/**
 * Powrót do setup między rundami — zachowuje wynik meczu.
 */
export function returnToSetup(state: MatchState): MatchState {
  return {
    ...state,
    phase: "setup",
    round: null,
  };
}

/**
 * Reset meczu — zeruje wynik, historię, wraca do setup.
 */
export function resetMatch(state: MatchState): MatchState {
  return {
    ...state,
    phase: "setup",
    round: null,
    matchScore: { red: 0, blue: 0 },
    roundHistory: [],
    matchWinner: null,
  };
}

/**
 * Replay — zachowuje ustawienia, zeruje wynik.
 */
export function replayMatch(state: MatchState): MatchState {
  return resetMatch(state);
}
