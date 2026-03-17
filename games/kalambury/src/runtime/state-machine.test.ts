import assert from "node:assert/strict";
import test from "node:test";

import { createInitialKalamburySetupState } from "../shared/setup-content.ts";
import type { KalamburySetupPayload } from "./state-machine.ts";
import {
  createKalamburyPlayState,
  drawKalamburyTurnOrder,
  enterKalamburyPreparation,
  enterKalamburyScore,
  rerollKalamburyPhrase,
  resolveKalamburyScore,
  startKalamburyTurn,
} from "./state-machine.ts";

function createPayload(): KalamburySetupPayload {
  const state = createInitialKalamburySetupState();
  return {
    gameSlug: "kalambury",
    mode: "classic",
    players: state.players,
    modeSettings: state.modeSettings,
    categories: state.categories.filter((category) => category.isSelected),
  };
}

test("starts in LOSOWANIE before drawing order for the round", () => {
  const payload = createPayload();
  const state = createKalamburyPlayState(payload);

  assert.equal(state.stage, "LOSOWANIE");
  assert.equal(state.roundNumber, 1);
  assert.equal(state.turnOrderIds.length, 0);
});

test("draws player order and enters preparation for the first presenter", () => {
  const payload = createPayload();
  const initial = createKalamburyPlayState(payload);
  const drawn = drawKalamburyTurnOrder(initial, payload, () => 0);
  const prepared = enterKalamburyPreparation(drawn, payload, () => 0);

  assert.equal(drawn.stage, "KOLEJNOSC");
  assert.equal(prepared.stage, "PRZYGOTOWANIE");
  assert.equal(prepared.currentPresenterId, drawn.turnOrderIds[0]);
});

test("resolves guessed turn and advances to next preparation", () => {
  const payload = createPayload();
  const initial = createKalamburyPlayState(payload);
  const drawn = drawKalamburyTurnOrder(initial, payload, () => 0);
  const prepared = enterKalamburyPreparation(drawn, payload, () => 0);
  const acting = startKalamburyTurn(prepared);
  const scoring = enterKalamburyScore(acting);
  const guesserId = drawn.turnOrderIds[1];
  const next = resolveKalamburyScore(
    scoring,
    payload,
    { guessedByPlayerId: guesserId, presenterBonus: false },
    () => 0,
  );

  assert.equal(next.stage, "PRZYGOTOWANIE");
  assert.equal(next.scores[drawn.turnOrderIds[0]], 1);
  assert.equal(next.scores[guesserId], 1);
});

test("rerolling a phrase respects per-presenter change limits", () => {
  const payload = createPayload();
  assert.ok(payload.modeSettings.phraseChange);
  payload.modeSettings.phraseChange.enabled = true;
  payload.modeSettings.phraseChange.changesPerPlayer = 1;

  const initial = createKalamburyPlayState(payload);
  const drawn = drawKalamburyTurnOrder(initial, payload, () => 0);
  const prepared = enterKalamburyPreparation(drawn, payload, () => 0);
  const rerolled = rerollKalamburyPhrase(prepared, payload);
  const blocked = rerollKalamburyPhrase(rerolled, payload);
  const presenterId = rerolled.currentPresenterId;

  assert.notEqual(presenterId, null);
  assert.equal(
    rerolled.phraseChangeRemainingByPlayerId[presenterId as string],
    0,
  );
  assert.equal(blocked.phrase, rerolled.phrase);
  assert.equal(
    blocked.phraseChangeRemainingByPlayerId[presenterId as string],
    0,
  );
});

test("resolveKalamburyScore doubles points when activeEvent is golden-points", () => {
  const payload = createPayload();
  const initial = createKalamburyPlayState(payload);
  const drawn = drawKalamburyTurnOrder(initial, payload, () => 0);
  const prepared = enterKalamburyPreparation(drawn, payload, () => 0);
  const acting = startKalamburyTurn(prepared);
  const scoring = enterKalamburyScore(acting);

  // Force golden-points event
  const stateWithEvent = { ...scoring, activeEvent: "golden-points" as const };
  const presenterId = scoring.turnOrderIds[0]!;
  const guesserId = scoring.turnOrderIds[1]!;

  const resolved = resolveKalamburyScore(stateWithEvent, payload, {
    guessedByPlayerId: guesserId,
    presenterBonus: false,
  }, () => 0);

  // With golden-points multiplier 2: presenter gets 2, guesser gets 2
  assert.equal(resolved.scores[presenterId], 2);
  assert.equal(resolved.scores[guesserId], 2);
});

test("resolveKalamburyScore transitions to FINISHED when last turn of last round completes", () => {
  const payload = createPayload();
  const initial = createKalamburyPlayState(payload);
  const drawn = drawKalamburyTurnOrder(initial, payload, () => 0);
  const prepared = enterKalamburyPreparation(drawn, payload, () => 0);
  const acting = startKalamburyTurn(prepared);
  const scoring = enterKalamburyScore(acting);

  // Force to last round, last turn in round
  const lastRoundState = {
    ...scoring,
    roundNumber: payload.modeSettings.rounds.roundCount,
    turnInRound: payload.players.length - 1,
  };

  const resolved = resolveKalamburyScore(lastRoundState, payload, {
    guessedByPlayerId: null,
    presenterBonus: false,
  }, () => 0);

  assert.equal(resolved.stage, "FINISHED");
});

test("rerollKalamburyPhrase returns same state when phraseChange is disabled", () => {
  const payload = createPayload();
  const payloadNoReroll: typeof payload = {
    ...payload,
    modeSettings: {
      ...payload.modeSettings,
      phraseChange: { enabled: false, changesPerPlayer: 1, rerollWordOnly: true, rerollWordAndCategory: false, antiCategoryStreak: false },
    },
  };

  const initial = createKalamburyPlayState(payloadNoReroll);
  const drawn = drawKalamburyTurnOrder(initial, payloadNoReroll, () => 0);
  const prepared = enterKalamburyPreparation(drawn, payloadNoReroll, () => 0);

  const rerolled = rerollKalamburyPhrase(prepared, payloadNoReroll);
  assert.equal(rerolled, prepared); // same reference — no change
});

test("rerollKalamburyPhrase decrements remaining count", () => {
  const payload = createPayload();
  const payloadWithReroll: typeof payload = {
    ...payload,
    modeSettings: {
      ...payload.modeSettings,
      phraseChange: { enabled: true, changesPerPlayer: 2, rerollWordOnly: true, rerollWordAndCategory: false, antiCategoryStreak: false },
    },
  };

  const initial = createKalamburyPlayState(payloadWithReroll);
  const drawn = drawKalamburyTurnOrder(initial, payloadWithReroll, () => 0);
  const prepared = enterKalamburyPreparation(drawn, payloadWithReroll, () => 0);

  const presenterId = prepared.turnOrderIds[0]!;
  const before = prepared.phraseChangeRemainingByPlayerId[presenterId];
  const rerolled = rerollKalamburyPhrase(prepared, payloadWithReroll);
  const after = rerolled.phraseChangeRemainingByPlayerId[presenterId];

  assert.equal(typeof before, "number");
  assert.equal(typeof after, "number");
  assert.equal((after as number), (before as number) - 1);
});
