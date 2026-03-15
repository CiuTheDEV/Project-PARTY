# CONTRIBUTING.md

## Before Making Changes

Przeczytaj w tej kolejności:
1. `AGENTS.md`
2. `docs/PROJECT_CONTEXT.md`
3. `docs/REPO_ARCHITECTURE.md`
4. `docs/TECH_STACK.md`
5. `docs/GAME_MODULE_STANDARD.md`
6. `docs/RUNTIME_CONTRACT.md`
7. `docs/CODEX_WORKFLOW.md`

Potem dobierz dokumenty do scope:
- `docs/CREATING_NEW_GAME.md` - jeśli dodajesz nową grę
- `docs/UI_RULES.md` - jeśli zmieniasz UI albo layout
- `docs/CODE_BOUNDARIES.md` - jeśli dotykasz shared / platform / kontraktów

## Working Style

- trzymaj zmiany małe i lokalne
- unikaj pobocznych refactorów
- szanuj granice platforma vs gra
- dokumentuj większe decyzje, gdy zmieniasz kontrakt lub strukturę repo
- aktualizuj dokumentację, jeśli zmieniasz workflow, integrację gry lub wspólny shell UI

## Practical Workflow Examples

### Dodanie nowej gry

1. Przeczytaj `docs/CREATING_NEW_GAME.md`.
2. Utwórz `games/<game-id>/`.
3. Dodaj `src/index.ts`, `meta.ts`, `settings.ts`, `runtime/createRuntime.ts`.
4. Dodaj grę do `apps/web/src/lib/gameRegistry.ts`.
5. Jeśli potrzebujesz skrótu trasy, zaktualizuj `apps/web/src/App.tsx`.
6. Uruchom:

```powershell
pnpm install
pnpm --filter @project-party/game-my-game test
pnpm --filter @project-party/web test
```

### Zmiana w platformie

1. Przeczytaj `docs/CODE_BOUNDARIES.md`.
2. Sprawdź wpływ na routing, launcher lub session flow.
3. Weryfikuj testami z `apps/web/src/*.test.mjs` albo `apps/worker/src/*.test.ts`.

### Zmiana w shared package

1. Upewnij się, że zmiana jest realnie wspólna dla więcej niż jednej gry albo platformy.
2. Jeśli dotykasz `packages/shared/`, sprawdź istniejące testy:
   - `packages/shared/src/catalog.test.ts`
   - `packages/shared/src/session.test.ts`
3. Uruchom:

```powershell
pnpm test
pnpm typecheck
```

## Review Philosophy

Zmiany powinny być:
- scoped,
- explainable,
- easy to validate,
- zgodne z modularną filozofią repo.

Najważniejsze pytania przed merge:
- Czy platforma nie nauczyła się zbyt wiele o konkretnej grze?
- Czy logika gry pozostała w `games/<id>/`?
- Czy wspólny shell UI pozostał spójny?
- Czy dokumentacja nadal odpowiada rzeczywistym plikom i komendom repo?
