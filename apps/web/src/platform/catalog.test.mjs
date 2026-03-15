import assert from "node:assert/strict";
import test from "node:test";

import {
  getCatalogGameById,
  getVisibleCatalogGames,
  isGameLaunchable,
} from "./catalog.ts";

test("getVisibleCatalogGames returns only non-hidden hub entries in stable order", () => {
  const games = getVisibleCatalogGames();

  assert.deepEqual(
    games.map((game) => game.id),
    ["kalambury", "tajniacy", "5-sekund", "mamy-szpiega", "panstwa-miasta"],
  );
});

test("getCatalogGameById returns known game metadata", () => {
  const game = getCatalogGameById("kalambury");

  assert.ok(game);
  assert.equal(game?.id, "kalambury");
  assert.equal(game?.status, "active");
  assert.equal(game?.playMode, "tv_plus_phones");
});

test("isGameLaunchable only allows active games", () => {
  assert.equal(isGameLaunchable("kalambury"), true);
  assert.equal(isGameLaunchable("tajniacy"), false);
  assert.equal(isGameLaunchable("missing"), false);
});
