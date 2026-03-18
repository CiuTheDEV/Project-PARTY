import { phraseCatalog } from "./phrase-catalog";
import { drawPhrase } from "../shared/phrase-pool";

export type KalamburySetupPayload = {
  gameSlug: string;
  mode: "classic" | "team";
  players: Array<{
    id: string;
    name: string;
    avatar: string;
    avatarId: string;
    avatarCategory: string;
    gender: string;
  }>;
  modeSettings: {
    rounds: {
      turnDurationSeconds: number;
      winCondition: "rounds" | "points";
      roundCount: number;
      pointsTarget: number;
    };
    hints: {
      enabled: boolean;
      showWordCount: boolean;
      showCategory: boolean;
    };
    phraseChange?: {
      enabled: boolean;
      changesPerPlayer: number | "infinite";
      rerollWordOnly: boolean;
      rerollWordAndCategory: boolean;
      antiCategoryStreak: boolean;
    };
    events: {
      enabled: boolean;
      chancePercent: number;
      goldenPointsEnabled: boolean;
      rushEnabled: boolean;
      noRepeatWindow: number;
    };
  };
  presenterDevice?: {
    enabled: boolean;
    connected: boolean;
    pairedDeviceId?: string | null;
  };
  categories: Array<{
    id: string;
    label: string;
    easyCount: number;
    hardCount: number;
    easyEnabled: boolean;
    hardEnabled: boolean;
    isSelected: boolean;
  }>;
  savedAt?: string;
};

export type KalamburyRoundStage =
  | "LOSOWANIE"
  | "KOLEJNOSC"
  | "PRZYGOTOWANIE"
  | "ACT"
  | "SCORE"
  | "FINISHED";

export type KalamburyRoundEvent = "golden-points" | "rush" | null;

export type KalamburyScoreResolution = {
  guessedByPlayerId: string | null;
  presenterBonus: boolean;
};

export type KalamburyPlayState = {
  stage: KalamburyRoundStage;
  roundNumber: number;
  totalRounds: number;
  turnInRound: number;
  turnOrderIds: string[];
  currentPresenterId: string | null;
  timerSeconds: number;
  phrase: string;
  phraseCategoryId: string;
  phraseCategoryLabel: string;
  wordCount: number;
  activeEvent: KalamburyRoundEvent;
  scores: Record<string, number>;
  phraseChangeRemainingByPlayerId: Record<string, number | "infinite">;
};

function getPhrasesForCategory(
  category: KalamburySetupPayload["categories"][number],
): string[] {
  const catalog = phraseCatalog[category.id];
  if (!catalog) return ["Kalambury"];
  const easy = category.easyEnabled ? catalog.easy : [];
  const hard = category.hardEnabled ? catalog.hard : [];
  const combined = [...easy, ...hard];
  return combined.length > 0 ? combined : [...catalog.easy, ...catalog.hard];
}

function getSelectedCategories(payload: KalamburySetupPayload) {
  return payload.categories.length > 0
    ? payload.categories
    : [
        {
          id: "klasyczne",
          label: "Klasyczne",
          easyCount: 5,
          hardCount: 5,
          easyEnabled: true,
          hardEnabled: true,
          isSelected: true,
        },
      ];
}

function getPresenterIndexFromOrder(state: KalamburyPlayState) {
  return state.turnInRound % Math.max(state.turnOrderIds.length, 1);
}

function createPhraseChangeRemainingMap(payload: KalamburySetupPayload) {
  const phraseChange = payload.modeSettings.phraseChange;
  const remainingPerPlayer = phraseChange?.enabled
    ? phraseChange.changesPerPlayer
    : 0;

  return Object.fromEntries(
    payload.players.map((player) => [player.id, remainingPerPlayer]),
  ) as Record<string, number | "infinite">;
}

export function getKalamburyCurrentPresenterId(state: KalamburyPlayState) {
  return (
    state.turnOrderIds[getPresenterIndexFromOrder(state)] ??
    state.currentPresenterId
  );
}

function getWordCount(phrase: string) {
  return phrase.trim().split(/\s+/).filter(Boolean).length;
}

function getPhraseForTurn(
  payload: KalamburySetupPayload,
  roundNumber: number,
  turnInRound: number,
) {
  const categories = getSelectedCategories(payload);
  const fallbackCategory = categories[0] ?? {
    id: "klasyczne",
    label: "Klasyczne",
    easyCount: 5,
    hardCount: 5,
    easyEnabled: true,
    hardEnabled: true,
    isSelected: true,
  };
  const category =
    categories[(roundNumber - 1 + turnInRound) % categories.length] ??
    fallbackCategory;

  // Determine which difficulties are active for this category
  const difficulties: Array<"easy" | "hard"> = [];
  if (category.easyEnabled) difficulties.push("easy");
  if (category.hardEnabled) difficulties.push("hard");
  if (difficulties.length === 0) {
    difficulties.push("easy");
    difficulties.push("hard");
  }

  // Pick difficulty round-robin across turns
  const difficulty = difficulties[(roundNumber - 1 + turnInRound) % difficulties.length] ?? "easy";
  const { phrase } = drawPhrase(category.id, difficulty);

  return {
    phraseCategoryId: category.id,
    phraseCategoryLabel: category.label,
    phrase,
    wordCount: getWordCount(phrase),
  };
}

function getNextSelectedCategory(
  payload: KalamburySetupPayload,
  currentCategoryId: string,
) {
  const categories = getSelectedCategories(payload);
  const currentIndex = categories.findIndex(
    (category) => category.id === currentCategoryId,
  );
  if (currentIndex === -1 || categories.length <= 1) {
    return categories[0] ?? null;
  }

  return (
    categories[(currentIndex + 1) % categories.length] ?? categories[0] ?? null
  );
}

function getNextPhraseInCategory(
  category: KalamburySetupPayload["categories"][number],
  currentPhrase: string,
) {
  const phrases = getPhrasesForCategory(category);
  const currentIndex = phrases.findIndex((phrase) => phrase === currentPhrase);
  const nextIndex =
    currentIndex === -1 ? 0 : (currentIndex + 1) % Math.max(phrases.length, 1);

  return phrases[nextIndex] ?? phrases[0] ?? "Kalambury";
}

// TODO: round events (golden-points, rush) — feature flag, intentionally disabled
// Enable when event UI and game flow support is implemented
const KALAMBURY_ROUND_EVENTS_ENABLED = false;

function shouldTriggerEvent(chancePercent: number, random: () => number) {
  if (chancePercent >= 100) {
    return true;
  }

  return random() * 100 < chancePercent;
}

function getEventForTurn(
  payload: KalamburySetupPayload,
  turnSeed: number,
  random: () => number,
): KalamburyRoundEvent {
  if (!KALAMBURY_ROUND_EVENTS_ENABLED) {
    return null;
  }

  const { events } = payload.modeSettings;

  if (!events.enabled || events.chancePercent <= 0) {
    return null;
  }

  if (!shouldTriggerEvent(events.chancePercent, random)) {
    return null;
  }

  const availableEvents: KalamburyRoundEvent[] = [];
  if (events.goldenPointsEnabled) {
    availableEvents.push("golden-points");
  }
  if (events.rushEnabled) {
    availableEvents.push("rush");
  }

  if (availableEvents.length === 0) {
    return null;
  }

  return availableEvents[turnSeed % availableEvents.length] ?? null;
}

function shufflePlayerIds(playerIds: string[], random: () => number) {
  const result = [...playerIds];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = result[index];
    const swapped = result[swapIndex];

    if (current === undefined || swapped === undefined) {
      continue;
    }

    result[index] = swapped;
    result[swapIndex] = current;
  }

  return result;
}

function createTurnState(
  state: KalamburyPlayState,
  payload: KalamburySetupPayload,
  turnInRound: number,
  turnOrderIds: string[],
  random: () => number,
): KalamburyPlayState {
  const { phrase, phraseCategoryId, phraseCategoryLabel, wordCount } =
    getPhraseForTurn(payload, state.roundNumber, turnInRound);
  const currentPresenterId = turnOrderIds[turnInRound] ?? null;

  return {
    ...state,
    stage: "PRZYGOTOWANIE",
    turnInRound,
    turnOrderIds,
    currentPresenterId,
    timerSeconds: payload.modeSettings.rounds.turnDurationSeconds,
    phrase,
    phraseCategoryId,
    phraseCategoryLabel,
    wordCount,
    activeEvent: getEventForTurn(
      payload,
      state.roundNumber * 31 + turnInRound,
      random,
    ),
  };
}

export function createKalamburyPlayState(
  payload: KalamburySetupPayload,
): KalamburyPlayState {
  return {
    stage: "LOSOWANIE",
    roundNumber: 1,
    totalRounds: payload.modeSettings.rounds.roundCount,
    turnInRound: 0,
    turnOrderIds: [],
    currentPresenterId: null,
    timerSeconds: payload.modeSettings.rounds.turnDurationSeconds,
    phrase: "",
    phraseCategoryId: "",
    phraseCategoryLabel: "",
    wordCount: 0,
    activeEvent: null,
    scores: Object.fromEntries(payload.players.map((player) => [player.id, 0])),
    phraseChangeRemainingByPlayerId: createPhraseChangeRemainingMap(payload),
  };
}

export function drawKalamburyTurnOrder(
  state: KalamburyPlayState,
  payload: KalamburySetupPayload,
  random: () => number = Math.random,
): KalamburyPlayState {
  const turnOrderIds = shufflePlayerIds(
    payload.players.map((player) => player.id),
    random,
  );

  return {
    ...state,
    stage: "KOLEJNOSC",
    turnInRound: 0,
    turnOrderIds,
    currentPresenterId: turnOrderIds[0] ?? null,
  };
}

export function enterKalamburyPreparation(
  state: KalamburyPlayState,
  payload: KalamburySetupPayload,
  random: () => number = Math.random,
): KalamburyPlayState {
  return createTurnState(state, payload, 0, state.turnOrderIds, random);
}

export function startKalamburyTurn(
  state: KalamburyPlayState,
): KalamburyPlayState {
  return {
    ...state,
    stage: "ACT",
  };
}

export function enterKalamburyScore(
  state: KalamburyPlayState,
): KalamburyPlayState {
  return {
    ...state,
    stage: "SCORE",
  };
}

export function resolveKalamburyScore(
  state: KalamburyPlayState,
  payload: KalamburySetupPayload,
  resolution: KalamburyScoreResolution,
  random: () => number = Math.random,
): KalamburyPlayState {
  const multiplier = state.activeEvent === "golden-points" ? 2 : 1;
  const currentPresenterId = getKalamburyCurrentPresenterId(state);
  const nextScores = { ...state.scores };

  if (resolution.guessedByPlayerId && currentPresenterId) {
    nextScores[currentPresenterId] =
      (nextScores[currentPresenterId] ?? 0) + multiplier;
    if (resolution.guessedByPlayerId !== currentPresenterId) {
      nextScores[resolution.guessedByPlayerId] =
        (nextScores[resolution.guessedByPlayerId] ?? 0) + multiplier;
    }
  }

  if (resolution.presenterBonus && currentPresenterId) {
    nextScores[currentPresenterId] = (nextScores[currentPresenterId] ?? 0) + 1;
  }

  const nextTurnInRound = state.turnInRound + 1;
  if (nextTurnInRound < state.turnOrderIds.length) {
    return createTurnState(
      {
        ...state,
        scores: nextScores,
      },
      payload,
      nextTurnInRound,
      state.turnOrderIds,
      random,
    );
  }

  if (state.roundNumber >= state.totalRounds) {
    return {
      ...state,
      stage: "FINISHED",
      scores: nextScores,
    };
  }

  return {
    ...state,
    stage: "LOSOWANIE",
    scores: nextScores,
    roundNumber: state.roundNumber + 1,
    turnInRound: 0,
    turnOrderIds: [],
    currentPresenterId: null,
    phrase: "",
    phraseCategoryId: "",
    phraseCategoryLabel: "",
    wordCount: 0,
    activeEvent: null,
    timerSeconds: payload.modeSettings.rounds.turnDurationSeconds,
  };
}

export function rerollKalamburyPhrase(
  state: KalamburyPlayState,
  payload: KalamburySetupPayload,
): KalamburyPlayState {
  const phraseChange = payload.modeSettings.phraseChange;
  if (!phraseChange?.enabled) {
    return state;
  }

  const presenterId = getKalamburyCurrentPresenterId(state);
  if (!presenterId) {
    return state;
  }

  const remainingChanges =
    state.phraseChangeRemainingByPlayerId[presenterId] ?? 0;
  if (remainingChanges === 0) {
    return state;
  }

  const shouldChangeCategory = phraseChange.rerollWordAndCategory;
  const nextCategory = shouldChangeCategory
    ? getNextSelectedCategory(payload, state.phraseCategoryId)
    : (getSelectedCategories(payload).find(
        (category) => category.id === state.phraseCategoryId,
      ) ??
      getSelectedCategories(payload)[0] ??
      null);

  if (!nextCategory) {
    return state;
  }

  const rerollDifficulties: Array<"easy" | "hard"> = [];
  if (nextCategory.easyEnabled) rerollDifficulties.push("easy");
  if (nextCategory.hardEnabled) rerollDifficulties.push("hard");
  if (rerollDifficulties.length === 0) {
    rerollDifficulties.push("easy");
    rerollDifficulties.push("hard");
  }
  const rerollDifficulty = rerollDifficulties[Math.floor(Math.random() * rerollDifficulties.length)] ?? "easy";
  const { phrase: nextPhrase } = drawPhrase(nextCategory.id, rerollDifficulty);
  const nextRemainingByPlayerId = {
    ...state.phraseChangeRemainingByPlayerId,
  };

  if (remainingChanges !== "infinite") {
    nextRemainingByPlayerId[presenterId] = Math.max(remainingChanges - 1, 0);
  }

  return {
    ...state,
    phrase: nextPhrase,
    phraseCategoryId: nextCategory.id,
    phraseCategoryLabel: nextCategory.label,
    wordCount: getWordCount(nextPhrase),
    phraseChangeRemainingByPlayerId: nextRemainingByPlayerId,
  };
}
