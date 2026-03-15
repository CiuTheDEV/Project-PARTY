// ──────────────────────────────────────────────
// Tajniacy – game-specific types
// ──────────────────────────────────────────────

/** Identyfikator drużyny */
export type TeamId = "red" | "blue";

/** Avatar drużyny — ikona/emoji */
export type TeamAvatar = string;

/** Konfiguracja jednej drużyny */
export type TeamConfig = {
  id: TeamId;
  name: string;
  avatar: TeamAvatar;
};

/** Kategoria haseł */
export type WordCategory = "standard" | "uncensored";

/** Ustawienia meczu konfigurowane przed startem */
export type MatchSettings = {
  teams: [TeamConfig, TeamConfig];
  category: WordCategory | null;
  assassinCount: number; // 1–5
  roundsToWin: number; // 1–5
};

/** Typ karty na planszy */
export type CardIdentity = "red" | "blue" | "neutral" | "assassin";

/** Stan pojedynczej karty */
export type Card = {
  word: string;
  identity: CardIdentity;
  revealed: boolean;
};

/** Cała plansza 5×5 */
export type Board = Card[];

/** Kto wygrał rundę i dlaczego */
export type RoundResult = {
  winner: TeamId;
  reason: "all-found" | "assassin";
  assassinClickedBy?: TeamId;
};

/** Rekord jednej rozegranej rundy */
export type RoundRecord = {
  roundNumber: number;
  winner: TeamId;
  reason: RoundResult["reason"];
  scoreAfter: Record<TeamId, number>;
  category: WordCategory;
  assassinCount: number;
};

/** Stan bieżącej rundy */
export type RoundState = {
  roundNumber: number;
  board: Board;
  startingTeam: TeamId;
  score: Record<TeamId, number>; // Stan punktowy na poczatku rundy
  isFinished: boolean;
  result: RoundResult | null;
  hint: { red: { word: string; count: number } | null; blue: { word: string; count: number } | null };
};

/** Faza gry */
export type GamePhase =
  | "setup"
  | "device-pairing"
  | "playing"
  | "round-end"
  | "match-end";

/** Pełny stan meczu */
export type MatchState = {
  phase: GamePhase;
  settings: MatchSettings;
  round: RoundState | null;
  matchScore: Record<TeamId, number>;
  roundHistory: RoundRecord[];
  matchWinner: TeamId | null;
};

/** Typ urządzenia podłączonego do sesji */
export type DeviceRole = "captain" | "viewer";

/** Stan podłączonego urządzenia */
export type ConnectedDevice = {
  id: string;
  role: DeviceRole;
  isConnected: boolean;
};
