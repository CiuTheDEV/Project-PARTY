# TECH_STACK.md

## Cel stacku

Stack ma być:
- tani na start,
- prosty dla Codexa,
- modularny,
- przyszłościowy,
- dobry pod frontend + lekki backend + gry przeglądarkowe.

## Rekomendowany stack bazowy

### Monorepo
- `pnpm workspaces`
- `turbo`

### Frontend platformy (`apps/web`)
- React
- TypeScript
- Vite
- React Router
- deploy na Cloudflare Pages

### Backend / session infra (`apps/worker`)
- Cloudflare Workers
- Hono
- Durable Objects dla stateful session coordination i realtime w produkcji

### Współdzielony kod
- TypeScript packages w `packages/*`

### Styling
- design tokens w `packages/design-system`
- współdzielone komponenty w `packages/ui`
- konkretna biblioteka stylowania może zostać dopięta później, ale architektura ma najpierw oddzielić odpowiedzialności

### Validation
- Zod do schematów konfiguracji i payloadów

### Testy
- testy jednostkowe i integracyjne na poziomie workspace'ów
- Playwright dla krytycznych flow platformy i wejścia do gry

## Session i realtime model

Docelowo produkcja opiera się o Cloudflare Workers + Durable Objects.

To oznacza:
- API sesji działa w `apps/worker`,
- stan współdzielony sesji może być utrzymywany przez Durable Objects,
- realtime i koordynacja uczestników nie muszą być trzymane w stateless HTTP.

Jednocześnie lokalny development nie powinien zależeć wyłącznie od Durable Objects.

Dlatego:
- `BroadcastChannel` pozostaje do lokalnych testów i dev flow,
- lokalny transport może być prostszy niż produkcyjny,
- runtime contract nie może zakładać tylko jednego backend transportu.

## Strategia testów

Repo powinno testować trzy warstwy:

### Platforma
- testy dla `apps/web` obejmują routing, launcher, runtime integration i helpery platformowe,
- testy dla `apps/worker` obejmują HTTP API, session lifecycle i lekkie kontrakty backendowe.

Przykłady z repo:
- `apps/web/src/platform/catalog.test.mjs`
- `apps/web/src/runtime/mountRuntime.test.mjs`
- `apps/web/src/game-launch-parity.test.mjs`
- `apps/worker/src/http.test.ts`

### Shared packages
- `packages/*` powinny mieć testy tylko tam, gdzie logika jest naprawdę współdzielona,
- nie przenoś semantyki jednej gry do shared tylko po to, aby "mieć wspólne testy".

Przykłady z repo:
- `packages/shared/src/catalog.test.ts`
- `packages/shared/src/session.test.ts`

### Game modules
- każda gra testuje własne metadata, settings, runtime state i helpery specyficzne dla gry,
- testy game module powinny skupiać się na kontrakcie integracyjnym oraz na logice samej gry,
- wspólny layout wejścia do gry nie zastępuje testów gameplayu.

Przykłady z repo:
- `games/kalambury/src/meta.test.ts`
- `games/kalambury/src/runtime/state-machine.test.ts`
- `games/kalambury/src/host/setup-parity.test.js`
- `games/kalambury/src/shared/setup-storage.test.ts`

## Running tests

Najczęściej używane komendy:

```powershell
pnpm test
pnpm --filter @project-party/web test
pnpm --filter @project-party/worker test
pnpm --filter @project-party/game-kalambury test
pnpm --filter @project-party/game-tajniacy test
```

### Przykładowe scenariusze testowe

Tylko platforma web:

```powershell
pnpm --filter @project-party/web test
```

Tylko worker:

```powershell
pnpm --filter @project-party/worker test
```

Tylko jedna gra:

```powershell
pnpm --filter @project-party/game-kalambury test
```

Całe repo po zmianie wspólnego kontraktu:

```powershell
pnpm test
pnpm typecheck
```

E2E / smoke flow:
- Playwright uruchamiaj dla krytycznych przepływów platformy i najbardziej ryzykownych flow wejścia do gry,
- nie zastępuj nim unit i integration testów modułów.

## Dlaczego ten stack

### React + Vite + Pages
Daje szybki development po stronie frontendu i prosty deploy na edge-hosting Cloudflare bez mieszania hostingu UI z backendowym session infra.

### Workers + Durable Objects
Na MVP i dalszy rozwój daje sensowny backend pod:
- tworzenie sesji,
- join codes,
- lekkie API,
- realtime / session coordination,
- stan per sesja lub per pokój tam, gdzie jest to potrzebne.

### BroadcastChannel w local/dev
Pozwala zachować szybki lokalny development i testowanie bez uzależniania każdej iteracji od pełnego środowiska produkcyjnego Cloudflare.

### pnpm + turbo
Daje porządek przy:
- wielu grach,
- shared packages,
- osobnych buildach,
- prostym skalowaniu repo.

## Zasada architektoniczna

Stack nie może wymuszać jednej prawdy gameplayowej.

To znaczy:
- framework platformy nie może narzucić struktury każdej grze,
- backend nie może zakładać jednego modelu roli,
- runtime nie może zakładać, że każda gra ma hosta i kontrolery,
- Durable Objects nie mogą wymusić jednego modelu rozgrywki wszystkim grom.
