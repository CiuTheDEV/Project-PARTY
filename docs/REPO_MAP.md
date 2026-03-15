# REPO_MAP.md

Szybka mapa aktywnego repo Project Party.

## Root

- `AGENTS.md` - zasady pracy agentów i kolejność czytania dokumentacji
- `README.md` - szybki opis repo i punkt startowy
- `docs/` - aktywna dokumentacja architektoniczna, produktowa i workflow
- `apps/` - aplikacje platformowe
- `games/` - autonomiczne moduły gier
- `packages/` - współdzielone biblioteki
- `scripts/` - helpery uruchamiania toolingu i testów
- `tests/` - testy i helpery repo-level

## apps/

- `apps/web/` - hub, routing platformy, game details, launch flow, controller runtime
- `apps/worker/` - API katalogu gier, sesje, join flow, session lookup

## games/

- `games/kalambury/` - referencyjny moduł gry z host/controller/setup/runtime
- `games/tajniacy/` - drugi moduł gry z odmiennym contentem i wspólnym shell-em wejścia

## packages/

- `packages/types/` - wspólne typy domenowe
- `packages/shared/` - lekkie helpery bez semantyki jednej gry
- `packages/ui/` - współdzielone komponenty UI
- `packages/design-system/` - tokeny i podstawy design systemu
- `packages/game-runtime/` - runtime contract gry
- `packages/game-sdk/` - helpery do definiowania modułów gier

## docs/

Najważniejsze aktywne dokumenty:

- `docs/PROJECT_CONTEXT.md` - czym jest Project Party i gdzie przebiegają granice produktu
- `docs/REPO_ARCHITECTURE.md` - warstwy repo i odpowiedzialności
- `docs/TECH_STACK.md` - stack, strategia testów, przykłady uruchomień
- `docs/GAME_MODULE_STANDARD.md` - kontrakt modułu gry
- `docs/RUNTIME_CONTRACT.md` - wspólny mechanizm uruchamiania runtime
- `docs/CODE_BOUNDARIES.md` - safe / risky / sensitive obszary zmian
- `docs/CODEX_WORKFLOW.md` - workflow pracy w repo
- `docs/CREATING_NEW_GAME.md` - onboarding dla nowej gry
- `docs/CLOUDFLARE_GAME_DEPLOY.md` - jak prowadzić grę przez Workers, Durable Objects i remote transport
- `docs/TESTING.md` - praktyczna ściąga testów i komend
- `docs/TROUBLESHOOTING.md` - najczęstsze problemy i checklisty naprawcze
- `docs/UI_RULES.md` - wspólny shell UI i zasady wizualne

Historia decyzji i planów:

- `docs/plans/` - design docs, implementation plans i notatki z poprzednich iteracji
- `docs/PRD/` - historyczne dokumenty produktowe i eksploracyjne, nie bieżący source of truth

## Szybkie ścieżki startowe

Jeśli pracujesz nad:

- nową grą: zacznij od `docs/CREATING_NEW_GAME.md`
- nową grą z remote transportem / Cloudflare: dołóż `docs/CLOUDFLARE_GAME_DEPLOY.md`
- kontraktem gry: zacznij od `docs/GAME_MODULE_STANDARD.md`
- granicami architektury: przeczytaj `docs/PROJECT_CONTEXT.md`, `docs/REPO_ARCHITECTURE.md`, `docs/CODE_BOUNDARIES.md`
- wspólnym UI: przeczytaj `docs/UI_RULES.md`
- workflow Codexa: przeczytaj `docs/CODEX_WORKFLOW.md`
