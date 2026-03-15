# TESTING.md

## Strategy

Project Party testuje trzy warstwy:
- platformę,
- shared packages,
- moduły gier.

## Platform Tests

Przykłady z repo:
- `apps/web/src/platform/catalog.test.mjs`
- `apps/web/src/runtime/mountRuntime.test.mjs`
- `apps/web/src/game-launch-parity.test.mjs`
- `apps/worker/src/http.test.ts`
- `apps/worker/src/index.test.ts`

Uruchamianie:

```powershell
pnpm --filter @project-party/web test
pnpm --filter @project-party/worker test
```

## Game Module Tests

Przykłady z repo:
- `games/kalambury/src/meta.test.ts`
- `games/kalambury/src/runtime/state-machine.test.ts`
- `games/kalambury/src/host/setup-parity.test.js`
- `games/kalambury/src/shared/setup-storage.test.ts`

Punkt startowy dla nowej gry:

```ts
import test from "node:test";
import assert from "node:assert/strict";

import gameDefinition from "./index";

test("game exports a valid defineGame contract", () => {
  assert.ok(gameDefinition.id);
  assert.ok(gameDefinition.version);
  assert.ok(gameDefinition.meta);
  assert.ok(gameDefinition.capabilities);
  assert.ok(gameDefinition.settings);
  assert.equal(typeof gameDefinition.createRuntime, "function");
});
```

Uruchamianie:

```powershell
pnpm --filter @project-party/game-kalambury test
pnpm --filter @project-party/game-tajniacy test
pnpm --filter @project-party/game-my-game test
```

## Shared Package Tests

Przykłady z repo:
- `packages/shared/src/catalog.test.ts`
- `packages/shared/src/session.test.ts`

Uruchamianie:

```powershell
pnpm test
pnpm typecheck
```

## When To Run What

- zmiana tylko w jednej grze: test tej gry + ewentualnie web launch flow
- zmiana w platformie: test `@project-party/web` albo `@project-party/worker`
- zmiana w shared: `pnpm test` i `pnpm typecheck`
- zmiana kontraktu integracyjnego: pełne `pnpm test`

## E2E / Smoke

Używaj Playwright dla:
- krytycznych flow wejścia do gry,
- sprawdzenia routingu,
- regresji UI po zmianie layoutu.

Przykładowe komendy:

```powershell
pnpm playwright:install
pnpm playwright:debug:launch
```
