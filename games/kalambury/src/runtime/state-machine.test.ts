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
