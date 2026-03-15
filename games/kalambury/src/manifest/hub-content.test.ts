import assert from "node:assert/strict";
import test from "node:test";

import {
  getKalamburyHubContent,
  getKalamburyHubNextModeId,
  isKalamburyHubModePlayable,
} from "./hub-content.ts";

test("returns the Kalambury shell model with selectable game modes", () => {
  const content = getKalamburyHubContent();

  assert.equal(content.heading, "Wybierz tryb gry");
  assert.equal(content.description.includes("pokazywac hasla"), true);
  assert.equal(content.primaryActionLabel, "Graj");
  assert.equal(content.modePicker.activeModeId, "classic");
  assert.equal(content.modePicker.modes.length, 2);
  assert.equal(content.settingsPanel.activeTabId, "sound");
});

test("resolves the next mode id for selector navigation", () => {
  const { modePicker } = getKalamburyHubContent();

  assert.equal(
    getKalamburyHubNextModeId(modePicker.modes, "classic", 1),
    "team",
  );
  assert.equal(
    getKalamburyHubNextModeId(modePicker.modes, "team", 1),
    "classic",
  );
  assert.equal(
    getKalamburyHubNextModeId(modePicker.modes, "classic", -1),
    "team",
  );
});

test("marks only available modes as playable entry points to setup", () => {
  const { modePicker } = getKalamburyHubContent();

  assert.equal(isKalamburyHubModePlayable(modePicker.modes[0]), true);
  assert.equal(isKalamburyHubModePlayable(modePicker.modes[1]), false);
});

test("hub content no longer exposes migration or roadmap copy", () => {
  const content = getKalamburyHubContent();
  const serialized = JSON.stringify(content);

  assert.equal(serialized.includes("MVP"), false);
  assert.equal(serialized.includes("roadmap"), false);
  assert.equal(serialized.includes("shell"), false);
  assert.equal(serialized.includes("KrĂłtki"), false);
});
