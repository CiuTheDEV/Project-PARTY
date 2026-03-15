import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const stylesSource = readFileSync(
  new URL("../../../games/kalambury/src/styles.css", import.meta.url),
  "utf8",
);

test("kalambury hub shell fills its app-shell container instead of adding another viewport height", () => {
  assert.match(
    stylesSource,
    /\.app-shell--kalambury-hub-shell\s*\{[^}]*height:\s*100dvh;[^}]*padding:\s*0\s*!important;[^}]*overflow:\s*hidden;/s,
  );
  assert.match(
    stylesSource,
    /\.kal-hub-shell\s*\{[^}]*height:\s*100%;[^}]*min-height:\s*100%;/s,
  );
  assert.equal(stylesSource.includes("height: 100vh;"), false);
  assert.equal(stylesSource.includes("min-height: 100vh;"), false);
});

test("kalambury play shell overrides global app-shell padding and locks gameplay to viewport height", () => {
  assert.match(
    stylesSource,
    /\.app-shell\.app-shell--kalambury-play\s*\{[^}]*min-height:\s*100dvh;[^}]*height:\s*100dvh;[^}]*padding:\s*0(?:\s*!important)?;[^}]*overflow:\s*hidden;/s,
  );
  assert.match(
    stylesSource,
    /\.hero--kalambury-play\.hero--kalambury-playwide\s*\{[^}]*height:\s*calc\(100dvh\s*-\s*20px\);[^}]*overflow:\s*hidden;/s,
  );
});
