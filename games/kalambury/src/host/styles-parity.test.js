import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const stylesPath = new URL("../styles.css", import.meta.url);

test("kalambury module ships its own game-specific stylesheet", () => {
  assert.equal(existsSync(stylesPath), true);

  const stylesSource = readFileSync(stylesPath, "utf8");

  assert.equal(stylesSource.includes(".kal-hub-shell"), true);
  assert.equal(stylesSource.includes(".kalambury-setup__panel"), true);
  assert.equal(
    stylesSource.includes(".kalambury-stage-shell--fullstage"),
    true,
  );
  assert.equal(stylesSource.includes(".kal-hub-sidebar__exit"), true);
  assert.equal(stylesSource.includes(".kal-hub-sidebar__exit-link"), true);
  assert.equal(
    stylesSource.includes(".kalambury-order-card__name,\n.kalambury-presenter-hero__name"),
    true,
  );
  assert.equal(stylesSource.includes(".kalambury-order-grid--orphan"), true);
  assert.equal(stylesSource.includes(".kalambury-persona-card"), true);
  assert.equal(stylesSource.includes(".kalambury-persona-card__avatar"), true);
  assert.equal(stylesSource.includes(".kalambury-persona-card__nameplate"), true);
  assert.equal(stylesSource.includes(".kalambury-persona-card__badge"), true);
  assert.equal(stylesSource.includes(".kalambury-player-name-input--female"), true);
  assert.equal(stylesSource.includes(".kalambury-player-name-input--male"), true);
  assert.equal(
    stylesSource.includes(".kalambury-play__timer.kalambury-play__timer--act"),
    true,
  );
  assert.equal(
    stylesSource.includes(
      ".kalambury-verdict-player-card.kalambury-verdict-player-card--active",
    ),
    true,
  );
  assert.equal(
    stylesSource.includes(
      '.kalambury-verdict-player-card[data-gender="female"].kalambury-verdict-player-card--active',
    ),
    true,
  );
  assert.equal(
    stylesSource.includes(
      '.kalambury-verdict-player-card[data-gender="male"].kalambury-verdict-player-card--active',
    ),
    true,
  );
  assert.equal(stylesSource.includes(".kalambury-setup__footer--single"), true);
  assert.equal(stylesSource.includes(".app-shell.app-shell--embedded"), true);
  assert.equal(stylesSource.includes("margin: auto;"), true);
  assert.equal(
    stylesSource.includes(".kalambury-stage-panel--order {\n  width: min(100%, 1500px);\n  min-height: 0;\n  height: 100%;\n  display: grid;\n  background: transparent;\n  border: 0;\n  box-shadow: none;\n}"),
    true,
  );
});
