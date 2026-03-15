# Project Party - Quick Reference

## Architektura w 30 sekund

- `apps/web` - hub, routing, launcher, platformowy UI
- `apps/worker` - API, sesje, katalog gier
- `games/*` - autonomiczne moduły gier
- `packages/*` - shared tylko gdy naprawdę wspólne

## Złota zasada

Hub zna grę tylko przez kontrakt.

- hub nie zna rund, scoringu ani stage flow gry
- gra pozostaje autonomiczna
- runtime contract jest w `@project-party/game-runtime`

## Quick Start

```powershell
pnpm install
pnpm dev

# test konkretnej gry
pnpm --filter @project-party/game-kalambury test
```

Dodawanie nowej gry:
- patrz `docs/CREATING_NEW_GAME.md`

## Najważniejsze pliki

1. `AGENTS.md` - workflow i kolejność czytania
2. `docs/PROJECT_CONTEXT.md` - granice produktu
3. `docs/REPO_ARCHITECTURE.md` - warstwy repo
4. `docs/GAME_MODULE_STANDARD.md` - kontrakt gry
5. `docs/CREATING_NEW_GAME.md` - jak dodać nową grę
6. `docs/UI_RULES.md` - shared game UI shell
7. `docs/CODE_BOUNDARIES.md` - safe vs risky obszary

## Zasady

- wspólny layout dla menu i setupu: tak
- gameplay zostaje w `games/<id>/`: tak
- no gameplay in platform: tak
- shared tylko gdy realnie używają tego 2+ miejsca: tak
