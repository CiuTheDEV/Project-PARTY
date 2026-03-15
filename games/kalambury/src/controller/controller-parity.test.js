import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const controllerSource = readFileSync(
  new URL("./ControllerApp.tsx", import.meta.url),
  "utf8",
);

test("controller app is no longer a generic migration placeholder", () => {
  assert.equal(controllerSource.includes("kolejne iteracje realtime"), false);
  assert.equal(
    controllerSource.includes("Sesja jest podpieta do nowej architektury"),
    false,
  );
});

test("controller app uses Kalambury-specific presenter phone shell", () => {
  assert.equal(controllerSource.includes("Telefon prezentera"), false);
  assert.equal(controllerSource.includes("Kod sesji"), false);
  assert.equal(controllerSource.includes("PREZENTUJE"), true);
  assert.equal(controllerSource.includes("Odkryj karte"), true);
  assert.equal(controllerSource.includes("Karta czeka na odkrycie"), true);
  assert.equal(controllerSource.includes("Zapamietaj haslo"), true);
  assert.equal(controllerSource.includes("Zmien haslo"), true);
  assert.equal(controllerSource.includes("Tura trwa"), true);
  assert.equal(controllerSource.includes("kalambury-controller-shell"), true);
  assert.equal(controllerSource.includes("kalambury-controller-card"), true);
  assert.equal(controllerSource.includes("kalambury-controller-card__countdown"), true);
  assert.equal(controllerSource.includes("presenterName"), true);
  assert.equal(controllerSource.includes("phraseChangeRemaining"), true);
});
