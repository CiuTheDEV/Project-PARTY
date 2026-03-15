import assert from "node:assert/strict";
import test from "node:test";

import {
  getCatalogGameById,
  getVisibleCatalogGames,
  isCatalogGameLaunchable,
} from "./catalog.ts";

test("getVisibleCatalogGames returns only non-hidden games in stable order", () => {
  const games = getVisibleCatalogGames();

  assert.deepEqual(
    games.map((game) => game.slug),
    ["kalambury", "tajniacy", "5-sekund", "mamy-szpiega", "panstwa-miasta"],
  );
});

test("getCatalogGameById returns known catalog metadata", () => {
  const game = getCatalogGameById("kalambury");

  assert.ok(game);
  assert.equal(game?.slug, "kalambury");
  assert.equal(game?.status, "active");
  assert.equal(game?.playMode, "tv_plus_phones");
});

test("isCatalogGameLaunchable only allows active games", () => {
  assert.equal(isCatalogGameLaunchable("kalambury"), true);
  assert.equal(isCatalogGameLaunchable("tajniacy"), false);
  assert.equal(isCatalogGameLaunchable("missing"), false);
});
