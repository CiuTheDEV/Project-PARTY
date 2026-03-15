# REPO_MAP.md

Szybka mapa aktywnego repo Project Party po migracji huba i Kalamburow.

## Root

- [`/home/mateo/projects/project-party/AGENTS.md`](/home/mateo/projects/project-party/AGENTS.md) — zasady pracy agentów i workflow migracyjnego
- [`/home/mateo/projects/project-party/README.md`](/home/mateo/projects/project-party/README.md) — szybki opis repo i punkt startowy
- [`/home/mateo/projects/project-party/docs`](/home/mateo/projects/project-party/docs) — aktywna dokumentacja architektoniczna, produktowa i workflow
- [`/home/mateo/projects/project-party/apps`](/home/mateo/projects/project-party/apps) — aplikacje platformowe
- [`/home/mateo/projects/project-party/games`](/home/mateo/projects/project-party/games) — autonomiczne moduły gier
- [`/home/mateo/projects/project-party/packages`](/home/mateo/projects/project-party/packages) — realnie współdzielone biblioteki
- [`/home/mateo/projects/project-party/_legacy/old-repo`](/home/mateo/projects/project-party/_legacy/old-repo) — archiwum referencyjne, nie aktywna część produktu

## apps/

- [`/home/mateo/projects/project-party/apps/web`](/home/mateo/projects/project-party/apps/web) — hub, routing platformy, join flow, entrypoint runtime gier
- [`/home/mateo/projects/project-party/apps/worker`](/home/mateo/projects/project-party/apps/worker) — katalog gier, create-session, join flow, session lookup

## games/

- [`/home/mateo/projects/project-party/games/kalambury`](/home/mateo/projects/project-party/games/kalambury) — w pełni wydzielony moduł referencyjny gry
- [`/home/mateo/projects/project-party/games/tajniacy`](/home/mateo/projects/project-party/games/tajniacy) — placeholder kolejnej gry

## packages/

- [`/home/mateo/projects/project-party/packages/types`](/home/mateo/projects/project-party/packages/types) — wspólne typy domenowe
- [`/home/mateo/projects/project-party/packages/shared`](/home/mateo/projects/project-party/packages/shared) — lekkie helpery bez semantyki jednej gry
- [`/home/mateo/projects/project-party/packages/ui`](/home/mateo/projects/project-party/packages/ui) — współdzielone komponenty UI
- [`/home/mateo/projects/project-party/packages/design-system`](/home/mateo/projects/project-party/packages/design-system) — tokeny i podstawy design systemu
- [`/home/mateo/projects/project-party/packages/game-runtime`](/home/mateo/projects/project-party/packages/game-runtime) — runtime contract gry
- [`/home/mateo/projects/project-party/packages/game-sdk`](/home/mateo/projects/project-party/packages/game-sdk) — helpery do definiowania modułów gier

## docs/

Najważniejsze aktywne dokumenty:

- [`/home/mateo/projects/project-party/docs/PROJECT_CONTEXT.md`](/home/mateo/projects/project-party/docs/PROJECT_CONTEXT.md)
- [`/home/mateo/projects/project-party/docs/REPO_ARCHITECTURE.md`](/home/mateo/projects/project-party/docs/REPO_ARCHITECTURE.md)
- [`/home/mateo/projects/project-party/docs/TECH_STACK.md`](/home/mateo/projects/project-party/docs/TECH_STACK.md)
- [`/home/mateo/projects/project-party/docs/GAME_MODULE_STANDARD.md`](/home/mateo/projects/project-party/docs/GAME_MODULE_STANDARD.md)
- [`/home/mateo/projects/project-party/docs/RUNTIME_CONTRACT.md`](/home/mateo/projects/project-party/docs/RUNTIME_CONTRACT.md)
- [`/home/mateo/projects/project-party/docs/CODE_BOUNDARIES.md`](/home/mateo/projects/project-party/docs/CODE_BOUNDARIES.md)
- [`/home/mateo/projects/project-party/docs/CODEX_WORKFLOW.md`](/home/mateo/projects/project-party/docs/CODEX_WORKFLOW.md)

Historyczne materiały planistyczne i parity notes zostają w [`/home/mateo/projects/project-party/docs/plans`](/home/mateo/projects/project-party/docs/plans) jako archiwum decyzji i przebiegu migracji.
