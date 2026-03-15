import assert from "node:assert/strict";
import test from "node:test";

import {
  addRandomKalamburySetupPlayer,
  clearKalamburyCategories,
  createInitialKalamburyPlayerDraft,
  createInitialKalamburySetupState,
  getKalamburyModeSettingSummaries,
  getKalamburySetupModeContent,
  kalamburyAvatarOptions,
  randomizeKalamburyCategories,
  selectAllKalamburyCategories,
  toggleKalamburyCategoryDifficulty,
} from "./setup-content.ts";

test("creates the initial Kalambury setup state", () => {
  const state = createInitialKalamburySetupState();

  assert.equal(state.playerLimit.min, 2);
  assert.equal(state.playerLimit.max, 12);
  assert.equal(state.players.length, 2);
  assert.equal(state.categories.length, 10);
  assert.equal(state.activeCategoryId, "");
});

test("exposes avatar tabs and creates an empty player draft", () => {
  const draft = createInitialKalamburyPlayerDraft();

  assert.equal(draft.name, "");
  assert.equal(draft.avatarId, null);
  assert.deepEqual(Object.keys(kalamburyAvatarOptions), [
    "ludzie",
    "zwierzeta",
    "inne",
  ]);
});

test("supports category mass actions", () => {
  const initialState = createInitialKalamburySetupState();
  const cleared = clearKalamburyCategories(initialState.categories);
  const randomized = randomizeKalamburyCategories(
    initialState.categories,
    () => 0.2,
  );
  const allSelected = selectAllKalamburyCategories(randomized);

  assert.equal(
    cleared.every((category) => category.isSelected === false),
    true,
  );
  assert.equal(
    allSelected.every((category) => category.isSelected),
    true,
  );
});

test("adds one random setup player without exceeding the player limit", () => {
  const initialState = createInitialKalamburySetupState();
  const nextPlayers = addRandomKalamburySetupPlayer(
    initialState.players,
    initialState.playerLimit.max,
    () => 0.42,
  );
  const randomPlayer = nextPlayers.at(-1);

  assert.equal(nextPlayers.length, initialState.players.length + 1);
  assert.notEqual(randomPlayer, undefined);
  assert.equal((randomPlayer?.name.length ?? 0) > 0, true);
  assert.equal((randomPlayer?.avatar.length ?? 0) > 0, true);
  assert.equal(
    addRandomKalamburySetupPlayer(nextPlayers, nextPlayers.length, () => 0.2),
    nextPlayers,
  );
});

test("builds the mode setting summaries shown on the setup screen", () => {
  const { modeSettings } = createInitialKalamburySetupState();

  assert.deepEqual(getKalamburyModeSettingSummaries(modeSettings), [
    { id: "rounds", label: "Rozgrywka", value: "Rundy - 15s" },
    { id: "hints", label: "Podpowiedzi", value: "Slowa + kategoria" },
    { id: "phrase", label: "Zmiana hasla", value: "INFx +kat +anty" },
  ]);
});

test("returns setup copy and storage key for the selected mode entry", () => {
  assert.equal(
    getKalamburySetupModeContent("classic").storageKey,
    "project-party.kalambury.classic-setup",
  );
  assert.equal(
    toggleKalamburyCategoryDifficulty(
      createInitialKalamburySetupState().categories,
      "muzyka",
      "easy",
    ).find((category) => category.id === "muzyka")?.isSelected,
    true,
  );
});
