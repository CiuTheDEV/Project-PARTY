# REPO_ARCHITECTURE.md

## Docelowa struktura repo

```text
project-party/
|- apps/
|  |- web/
|  `- worker/
|- games/
|  |- kalambury/
|  `- ...kolejne gry
|- packages/
|  |- ui/
|  |- shared/
|  |- types/
|  |- design-system/
|  |- game-runtime/
|  `- game-sdk/
|- docs/
|- scripts/
|- tests/
|- AGENTS.md
|- package.json
|- pnpm-workspace.yaml
|- turbo.json
`- tsconfig.base.json
```

## Warstwy

### `apps/web`
Odpowiada za:
- hub,
- routing platformy,
- pobieranie katalogu gier z worker API,
- konfigurację i tworzenie sesji,
- join flow,
- uruchomienie gry,
- ekrany platformowe,
- frontend hostowany docelowo jako Cloudflare Worker serwujący static assets.

Nie trzyma:
- gameplay logiki gier,
- setup flow specyficznego dla gry,
- state machine konkretnej gry.

### `apps/worker`
Odpowiada za:
- katalog gier,
- tworzenie sesji,
- join codes i join flow,
- lekkie HTTP API dla web,
- Durable Objects dla stateful session coordination i realtime,
- backend niezależny od konkretnej gry.

### `games/*`
Każdy katalog to osobna gra.

Gra posiada:
- metadata,
- settings schema,
- runtime entrypoint,
- własne widoki,
- własną logikę,
- własne zasady sesji tam, gdzie trzeba.

### `packages/ui`
Komponenty współdzielone między platformą a grami.

### `packages/design-system`
Design tokens, zasady kolorów, spacing, typography, motion.

### `packages/shared`
Utilities i helpery bez semantyki jednej gry.

### `packages/types`
Wspólne typy domenowe.

### `packages/game-runtime`
Minimalny runtime contract i lifecycle potrzebny, by platforma mogła uruchamiać gry.

### `packages/game-sdk`
Helpery dla autorów gier. Cieńsza, wygodniejsza warstwa nad runtime contractem.

## Twarda reguła

Platforma może znać tylko kontrakt gry.

Platforma nie może znać:
- rund kalamburów,
- scoringu tajniaków,
- logiki prezentera,
- niestandardowych stage flow konkretnej gry.

## Status referencyjny

Po domknięciu migracji:
- `apps/web` uruchamia gry wyłącznie przez kontrakt runtime,
- `apps/worker` obsługuje katalog i lifecycle sesji,
- Cloudflare Worker hostuje frontend platformy i proxyuje `/api/*` do backendu,
- Cloudflare Workers + Durable Objects zapewniają docelowe session infra,
- `games/kalambury` jest wzorcowym modułem gry dla dalszych implementacji,
- `_legacy/old-repo` pozostaje poza aktywną ścieżką produktu.
