import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
const cardSource = readFileSync(
  new URL("./components/GameCard.tsx", import.meta.url),
  "utf8",
);
const detailsSource = readFileSync(
  new URL("./pages/GameDetailsPage.tsx", import.meta.url),
  "utf8",
);

test("app exposes a direct /kalambury entry route", () => {
  assert.equal(appSource.includes('path="/kalambury"'), true);
});

test("active kalambury card uses Graj CTA and links directly to /kalambury", () => {
  assert.equal(cardSource.includes('"Graj"'), true);
  assert.equal(
    cardSource.includes('to={game.status === "active" ? "/kalambury"'),
    true,
  );
});

test("game details redirects active kalambury away from platform details", () => {
  assert.equal(detailsSource.includes('to="/kalambury"'), true);
});
