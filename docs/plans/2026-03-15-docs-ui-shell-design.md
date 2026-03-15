# Shared Game UI Shell Docs Design

**Goal:** Ujednolicić dokumentację wokół wspólnego layoutu menu głównego i setupu gry oraz dodać bardziej praktyczne wskazówki dla autorów kolejnych modułów.

## Context

Project Party zachowuje granicę: platforma zna kontrakt uruchomienia gry, a gra zachowuje własną logikę runtime. Jednocześnie dla UX i onboardingu chcemy ustalić wspólny shell UI dla ekranu wejściowego gry i ekranu setupu.

## Decision

- `main menu` i `game setup` są wspólnym shell-em UI dla wszystkich gier.
- Wspólne są: layout, rytm sekcji, podstawowa struktura ekranu i oczekiwany poziom spójności z istniejącym wzorcem Kalambury/Tajniacy.
- Zmienna per gra jest: treść, copy, ustawienia, grafiki i paleta kolorystyczna.
- Gameplay, stage flow, scoring i runtime pozostają autonomiczne po stronie modułu gry.

## Planned Documentation Changes

- Rozszerzyć `docs/GAME_MODULE_STANDARD.md` o praktyczny przykład modułu gry i o sekcję opisującą wspólny shell UI.
- Rozszerzyć `docs/CODEX_WORKFLOW.md` o konkretne komendy PowerShell dla codziennej pracy.
- Rozszerzyć `docs/TECH_STACK.md` o prostą, repo-specyficzną strategię testów.
- Dodać `docs/CREATING_NEW_GAME.md` jako przewodnik onboardingowy dla nowej gry, z wyraźnym wymaganiem wspólnego layoutu menu i setupu.

## Risks

- Zbyt twarde opisanie wspólnego UI mogłoby zostać odebrane jako próba centralizacji gameplayu. Dlatego dokumenty muszą rozróżniać shell UI od logiki gry.
- Odwołanie do Kalambur i Tajniaków powinno być opisane jako wzorzec layoutu i UX, nie jako zależność implementacyjna od konkretnych plików tych gier.
