# UI Rules Shared Shell Design

**Goal:** Doprecyzować `UI_RULES.md` tak, aby wspólny shell UI dla wejścia do gry miał zarówno zasady wizualne, jak i sugerowaną anatomię ekranów.

## Decision

- `UI_RULES.md` pozostaje dokumentem zasad UI wysokiego poziomu.
- Dokument dostaje nową sekcję dla shared game UI shell.
- Sekcja zawiera sugerowaną anatomię `main menu` i `setup screen`, ale nie zamienia się w sztywny kontrakt gameplayowy.
- Obowiązkowa pozostaje spójność layoutu i jakości UX, a nie identyczny zestaw bloków dla każdej gry.

## Scope

- Dodać do `docs/UI_RULES.md` sekcję opisującą wspólny shell UI.
- Dodać sugerowane bloki dla `main menu`.
- Dodać sugerowane bloki dla `setup screen`.
- Jasno opisać, które elementy są wspólne, a które zależą od gry.

## Guardrails

- Nie wprowadzać do `UI_RULES.md` zasad gameplayu.
- Nie opisywać tego jako kopiowania Kalambur / Tajniaków 1:1.
- Zachować zgodność z `docs/GAME_MODULE_STANDARD.md` i `docs/CREATING_NEW_GAME.md`.
