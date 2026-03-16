import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const playScreenSource = readFileSync(
  resolve(import.meta.dirname, "./PlayScreen.tsx"),
  "utf8",
);

test("play screen pauses presenter stages and reuses the presenter connect modal after disconnect", () => {
  assert.equal(playScreenSource.includes("KalamburyPresenterQrModal"), true);
  assert.equal(playScreenSource.includes("presenterReconnectRequired"), true);
  assert.equal(
    playScreenSource.includes(
      "Gra wstrzymana do czasu ponownego podlaczenia urzadzenia prezentera",
    ),
    true,
  );
});

test("play screen models presenter reveal as pending and preview stages before the live turn", () => {
  assert.equal(playScreenSource.includes("presenterRevealStage"), true);
  assert.equal(
    playScreenSource.includes("Karta czeka na odkrycie na telefonie"),
    true,
  );
  assert.equal(
    playScreenSource.includes("Prezenter zapoznaje sie z haslem"),
    true,
  );
  assert.equal(playScreenSource.includes("10"), true);
  assert.equal(
    playScreenSource.includes("kalambury-prepare-presenter-column"),
    true,
  );
  assert.equal(
    playScreenSource.includes("kalambury-host-status--prepare"),
    true,
  );
  assert.equal(
    playScreenSource.includes("kalambury-play__timer--prepare"),
    true,
  );
  assert.equal(
    playScreenSource.includes("kalambury-host-status--prepare-preview"),
    true,
  );
  assert.equal(
    playScreenSource.includes("kalambury-host-status__copy--prepare"),
    true,
  );
});

test("play screen marks odd two-column turn orders so the orphan card can span the full row", () => {
  assert.equal(
    playScreenSource.includes(
      '"kalambury-order-grid kalambury-order-grid--orphan"',
    ),
    true,
  );
});

test("play screen uses one shared player card anatomy across gameplay variants", () => {
  assert.equal(playScreenSource.includes("kalambury-persona-card"), true);
  assert.equal(
    playScreenSource.includes("kalambury-persona-card__avatar"),
    true,
  );
  assert.equal(
    playScreenSource.includes("kalambury-persona-card__nameplate"),
    true,
  );
  assert.equal(
    playScreenSource.includes("kalambury-persona-card__badge"),
    true,
  );
  assert.equal(
    playScreenSource.includes("data-gender={presenter.gender}"),
    true,
  );
  assert.equal(playScreenSource.includes("data-gender={player.gender}"), true);
  assert.equal(
    playScreenSource.includes("kalambury-verdict-player-card__score"),
    false,
  );
  assert.equal(playScreenSource.includes("kalambury-host-status--act"), true);
  assert.equal(playScreenSource.includes("kalambury-play__timer--act"), true);
  assert.equal(playScreenSource.includes("kalambury-hint-chips--act"), true);
});

test("verdict guessed state uses a compact selection grid without score labels on cards", () => {
  assert.equal(
    playScreenSource.includes(
      'className="kalambury-verdict-player-grid kalambury-verdict-player-grid--guessers"',
    ),
    true,
  );
  assert.equal(
    playScreenSource.includes(
      '"kalambury-persona-card kalambury-persona-card--interactive kalambury-persona-card--verdict kalambury-verdict-player-card kalambury-verdict-player-card--guesser kalambury-verdict-player-card--active"',
    ),
    true,
  );
  assert.equal(
    playScreenSource.includes("kalambury-verdict-player-card__score"),
    false,
  );
});

test("play screen exposes distinct topbar stage labels for each major phase", () => {
  assert.equal(playScreenSource.includes('return "LOSOWANIE";'), true);
  assert.equal(playScreenSource.includes('return "PRZYGOTOWANIE";'), true);
  assert.equal(playScreenSource.includes('return "PREZENTOWANIE";'), true);
  assert.equal(playScreenSource.includes('return "WERDYKT";'), true);
  assert.equal(playScreenSource.includes('return "PODSUMOWANIE";'), true);
});
