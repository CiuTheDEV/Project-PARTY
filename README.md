# Project Party

To repo jest **aktywnym monorepo produktu** dla Project Party.

Nie jest to „jedna aplikacja z katalogiem `src/games/*`”.
To jest **monorepo** z jasnym podziałem na:
- `apps/` — aplikacje platformowe,
- `games/` — autonomiczne moduły gier,
- `packages/` — współdzielone biblioteki,
- `docs/` — dokumenty graniczne dla ludzi i agentów.

## Główna zasada

**Hub zna grę tylko przez kontrakt integracyjny.**

Hub może:
- wyświetlić metadata gry,
- zbudować ekran konfiguracji,
- uruchomić moduł gry,
- przekazać `sessionId`, `config`, `role`, `device`.

Hub nie powinien:
- znać logiki rund konkretnej gry,
- znać scoringu konkretnej gry,
- znać stage flow konkretnej gry,
- wymuszać jednego modelu urządzeń dla wszystkich gier.

## Start czytania

1. `AGENTS.md`
2. `docs/PROJECT_CONTEXT.md`
3. `docs/REPO_ARCHITECTURE.md`
4. `docs/TECH_STACK.md`
5. `docs/GAME_MODULE_STANDARD.md`
6. `docs/RUNTIME_CONTRACT.md`
7. `docs/CODEX_WORKFLOW.md`

## Status

Aktualny stan repo:
- `apps/web` dostarcza hub, routing platformy, join flow i launcher runtime,
- `apps/worker` udostępnia katalog gier oraz session API dla create/join flow,
- `games/kalambury` działa jako wydzielony moduł gry z host/controller runtime,
- `packages/*` zawierają tylko realnie współdzielone kontrakty i utility.

`_legacy/old-repo` pozostaje archiwum referencyjnym, ale nie jest częścią aktywnej ścieżki produktu.

## Repo Hygiene

Po migracji aktywna ścieżka pracy wygląda tak:
- rozwój produktu odbywa się wyłącznie w `apps/*`, `games/*`, `packages/*` i aktywnych docs,
- `_legacy/old-repo` służy wyłącznie jako archiwum referencyjne,
- `docs/plans/*` przechowuje historyczne decyzje i plany wykonania, nie bieżące źródło architektury.
