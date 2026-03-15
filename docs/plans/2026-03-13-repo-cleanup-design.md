# Repo Cleanup Design

## Goal

Domknąć repo po migracji huba i Kalamburow tak, aby aktywna część projektu była czytelna, wolna od wygenerowanych artefaktów i opisana jako finalne monorepo produktu, bez usuwania `_legacy/old-repo`.

## Scope

- usunięcie wygenerowanych artefaktów i lokalnego szumu z repo
- aktualizacja kluczowych docs do stanu po migracji
- oznaczenie `_legacy/old-repo` jako archiwum referencyjnego
- pozostawienie dokumentów planistycznych i PRD jako archiwum wiedzy, nie aktywnego guidance

## Out of Scope

- usuwanie `_legacy/old-repo`
- zmiany produktowe w hubie lub Kalamburach
- przebudowa toolchainu ponad to, co jest potrzebne do utrzymania czystości repo
- kasowanie dokumentów produktowych lub PRD tylko dlatego, że są stare

## Approach Options

### 1. Conservative cleanup

Usunąć tylko artefakty, poprawić aktywne docs i zostawić historyczne plany/PRD jako archiwum.

Plusy:
- niskie ryzyko
- repo staje się czytelniejsze bez utraty kontekstu
- zgodne z rolą `_legacy` jako archiwum

Minusy:
- zostaje trochę historycznego materiału w `docs/`

### 2. Aggressive pruning

Poza cleanupem usunąć większość planów migracyjnych i starszych docs.

Plusy:
- najbardziej czyste repo

Minusy:
- wysokie ryzyko usunięcia przydatnego kontekstu
- niepotrzebnie trudny review

## Chosen Design

Wybór: **Conservative cleanup**.

Repo po cleanupie ma:
- aktywne docs opisujące finalny stan monorepo,
- brak wygenerowanych katalogów build/dev w workspace,
- brak windowsowych `:Zone.Identifier` w aktywnej części repo,
- zachowane `_legacy/old-repo` i dokumenty planistyczne jako archiwum.
