# CREATING_NEW_GAME.md

Ten dokument opisuje minimalny, praktyczny proces dodania nowej gry do Project Party.

## Cel

Nowa gra ma:
- pozostać autonomicznym modułem,
- wpasować się w kontrakt platformy,
- zachować spójny UX wejścia do gry,
- nie wymagać specjalnego traktowania przez hub.

## Quick Start (TL;DR)

Jeśli chcesz jak najszybciej postawić nowy moduł gry:

```powershell
# 1. Utwórz katalog gry
mkdir games/my-game

# 2. Dodaj package.json, tsconfig.json i src/index.ts

# 3. Podłącz meta, settings i createRuntime

# 4. Dodaj grę do apps/web/src/lib/gameRegistry.ts

# 5. Opcjonalnie dodaj skrót trasy w apps/web/src/App.tsx

# 6. Uruchom instalację i testy
pnpm install
pnpm --filter @project-party/game-my-game test
```

Potem wróć do szczegółów poniżej.

## Checklist krok po kroku

1. Utwórz nowy katalog `games/<game-id>/`.
2. Dodaj `package.json`, `tsconfig.json` i `src/index.ts`.
3. Przygotuj `meta`, `settings` i `createRuntime`.
4. Zarejestruj grę w launcherze i registry.
5. Dodaj testy dla metadata, settings i runtime.
6. Zweryfikuj, że gra nie wymaga platformowych wyjątków tylko dla siebie.

## Obowiązkowy wspólny layout wejścia do gry

Każda nowa gra musi zachować ten sam layout UI dla:
- menu głównego gry,
- setupu gry.

Wzorzec referencyjny to aktualny shared game UI shell znany z Kalambur i Tajniaków.

To, co ma być spójne:
- ogólny layout,
- hierarchia sekcji,
- rozmieszczenie kluczowych CTA,
- rytm wejścia w konfigurację i start gry.

To, co może się zmieniać per gra:
- teksty,
- konkretne opcje setupu,
- grafiki,
- ikony,
- paleta kolorystyczna i theme tokens.

To, co pozostaje po stronie gry:
- gameplay,
- scoring,
- stan rozgrywki,
- runtime flow po uruchomieniu sesji.

## Minimalna struktura

```text
games/<game-id>/
|- src/
|  |- index.ts               # eksport defineGame()
|  |- meta.ts                # metadata gry
|  |- settings.ts            # schema konfiguracji
|  |- runtime/
|  |  `- createRuntime.ts    # runtime entrypoint
|  |- host/                  # ekrany hosta / TV / desktop
|  |- controller/            # ekrany telefonu, jeśli gra ich potrzebuje
|  |- shared/                # helpery i logika współdzielona wewnątrz gry
|  `- assets/                # grafiki, ilustracje, ikony
|- package.json              # workspace package gry
|- tsconfig.json
`- README.md
```

Nie wszystkie foldery są obowiązkowe.
Dodawaj tylko to, czego realnie potrzebuje dana gra.

## Przykładowy package.json

Punkt startowy dla `games/<game-id>/package.json`:

```json
{
  "name": "@project-party/game-my-game",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "dependencies": {
    "@project-party/game-sdk": "workspace:*",
    "@project-party/game-runtime": "workspace:*",
    "@project-party/types": "workspace:*",
    "react": "^19.0.0"
  },
  "scripts": {
    "test": "node ../../scripts/run-node-test.mjs src/*.test.ts src/runtime/*.test.ts",
    "check": "node ../../scripts/run-tool.mjs tsc --noEmit",
    "typecheck": "node ../../scripts/run-tool.mjs tsc --noEmit",
    "lint": "node ../../scripts/run-tool.mjs biome check .",
    "build": "node ../../scripts/run-tool.mjs tsc --noEmit"
  }
}
```

Dostosuj zależności i skrypty do realnej struktury gry, ale trzymaj się istniejących konwencji workspace.

## Minimalny działający przykład

Punkt startowy dla `games/<game-id>/src/index.ts`:

```ts
import { defineGame } from "@project-party/game-sdk";

import "./styles.css";
import { myGameMeta } from "./meta";
import { createMyGameRuntime } from "./runtime/createRuntime";
import { myGameSettings } from "./settings";

export default defineGame({
  id: "my-game",
  version: "0.1.0",
  meta: myGameMeta,
  capabilities: {
    deviceProfiles: ["host-plus-phones"],
    supportedRoles: ["host", "player", "controller", "viewer"],
    supportsRemotePlay: true,
  },
  settings: myGameSettings,
  createRuntime: createMyGameRuntime,
});
```

W praktyce sprawdź istniejące przykłady:
- `games/kalambury/src/index.ts`
- `games/tajniacy/src/index.ts`

## Rejestracja gry w launcherze

Po dodaniu modułu gry trzeba go podpiąć do webowego registry.

### `apps/web/src/lib/gameRegistry.ts`

Dodaj import i wpis do `gameRegistry`:

```ts
import kalambury from "@project-party/game-kalambury";
import tajniacy from "@project-party/game-tajniacy";
import myGame from "@project-party/game-my-game";

export const gameRegistry = {
  kalambury,
  tajniacy,
  "my-game": myGame,
} as const;
```

### `apps/web/src/App.tsx`

Jeśli gra ma mieć dedykowany skrót routingu, dodaj trasę:

```tsx
<Route
  path="/my-game"
  element={<GameLaunchPage gameIdOverride="my-game" />}
/>
```

Trasy generyczne już istnieją i obsługują:
- `/games/:gameId`
- `/games/:gameId/launch`
- `/games/:gameId/controller/:sessionCode`

## Wspólny layout: szczegóły implementacyjne

Shared game UI shell nie oznacza kopiowania konkretnego pliku 1:1, tylko zachowanie tej samej struktury wejścia do gry.

### Main menu

Referencje:
- `games/kalambury/src/host/MenuScreen.tsx`
- odpowiedni ekran wejściowy w Tajniakach, jeśli dana gra używa analogicznego flow

Spójne elementy:
- sekcja hero z nazwą gry i krótkim opisem,
- główne CTA wejścia do konfiguracji lub startu,
- sekcje pomocnicze typu zasady / tryby / informacje,
- układ sekcji i czytelna hierarchia.

### Setup screen

Referencje:
- `games/kalambury/src/host/SetupScreen.tsx`
- `games/tajniacy/src/host/SetupScreen.tsx`

Spójne elementy:
- układ sekcji ustawień,
- hierarchia grup opcji,
- pozycja CTA startu / powrotu,
- wspólny rytm przewijania i czytelność formularza.

To, co może być indywidualne:
- pola formularza,
- nazwy trybów,
- opisy i pomocnicze teksty,
- ilustracje i akcenty kolorystyczne.

## Checklist przed PR

### Kod

- Czy gra eksportuje poprawny `defineGame(...)` w `src/index.ts`?
- Czy metadata zawiera wszystkie wymagane pola?
- Czy settings są zdefiniowane i gotowe do użycia przez launcher?
- Czy `createRuntime` jest podłączone do właściwego entrypointu?
- Czy gra została dodana do `apps/web/src/lib/gameRegistry.ts`?

### UI / UX

- Czy menu główne używa wspólnego shared game UI shell?
- Czy setup screen zachowuje wspólną hierarchię sekcji?
- Czy CTA są w tych samych oczekiwanych miejscach?
- Czy paleta jest indywidualna dla gry, ale układ pozostaje spójny z platformą?

### Testy

- Czy istnieje test eksportu / kontraktu dla `src/index.ts`?
- Czy są testy metadata i settings?
- Czy jest przynajmniej podstawowy test runtime lub helperów gry?

### Architektura

- Czy gameplay został w `games/<game-id>/`?
- Czy gra nie wypchnęła logiki do `apps/*` lub `packages/*` bez realnej potrzeby?
- Czy runtime używa wyłącznie kontraktu z `@project-party/game-runtime` / `@project-party/game-sdk`?

### Dokumentacja

- Czy `docs/CREATING_NEW_GAME.md` nadal opisuje aktualny flow?
- Czy definition of done dla nowej gry jest spełnione?

## Testowanie nowej gry

### Podstawowe testy kontraktu

Punkt startowy dla `games/<game-id>/src/index.test.ts`:

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

### Uruchomienie testów

```powershell
# Tylko ta gra
pnpm --filter @project-party/game-my-game test

# Typecheck
pnpm --filter @project-party/game-my-game typecheck
```

## Częste problemy

### "Module not found: @project-party/game-my-game"

- Sprawdź `package.json` w `games/<game-id>/`.
- Upewnij się, że nazwa pakietu ma poprawny workspace prefix.
- Uruchom `pnpm install`.

### "Game not showing in catalog"

- Sprawdź, czy gra została dodana do `apps/web/src/lib/gameRegistry.ts`.
- Sprawdź, czy odpowiednie metadata nie są ukryte po stronie hubu.

### "Runtime nie startuje"

- Sprawdź, czy `createRuntime` zwraca obiekt z poprawnym `teardown`, jeśli gra tego wymaga.
- Zobacz logi w konsoli przeglądarki.
- Porównaj entrypoint z `games/kalambury/src/index.ts` albo `games/tajniacy/src/index.ts`.

## Suggested next steps

Po stworzeniu minimalnej viable game:
1. Dodaj sensowny `README.md` w katalogu gry.
2. Rozbuduj testy.
3. Dopracuj copy i onboarding.
4. Dodaj indywidualne grafiki i własną paletę.
5. Zweryfikuj UX na desktopie i mobile.

## Reference games

Aktualne gry referencyjne:
- `games/kalambury/` - pełniejszy wzorzec modułu z host/controller/setup
- `games/tajniacy/` - drugi wzorzec integracji gry z platformą
