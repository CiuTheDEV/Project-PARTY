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

### Backend / session infra (`apps/worker`)
- Cloudflare Workers
- Hono

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

## Strategia testów

Repo powinno testować trzy warstwy:

### Platforma
- testy dla `apps/web` obejmują routing, launcher, runtime integration i helpery platformowe,
- testy dla `apps/worker` obejmują HTTP API, session lifecycle i lekkie kontrakty backendowe.

### Shared packages
- `packages/*` powinny mieć testy tylko tam, gdzie logika jest naprawdę współdzielona,
- nie przenoś semantyki jednej gry do shared tylko po to, aby "mieć wspólne testy".

### Game modules
- każda gra testuje własne metadata, settings, runtime state i helpery specyficzne dla gry,
- testy game module powinny skupiać się na kontrakcie integracyjnym oraz na logice samej gry,
- wspólny layout wejścia do gry nie zastępuje testów gameplayu.

## Running tests

Najczęściej używane komendy:

```powershell
pnpm test
pnpm --filter @project-party/web test
pnpm --filter @project-party/worker test
pnpm --filter @project-party/game-kalambury test
pnpm --filter @project-party/game-tajniacy test
```

E2E / smoke flow:
- Playwright uruchamiaj dla krytycznych przepływów platformy i najbardziej ryzykownych flow wejścia do gry,
- nie zastępuj nim unit i integration testów modułów.

## Dlaczego ten stack

### React + Vite
Daje szybki development i nie wciska na siłę jednego modelu aplikacji serwerowej.

### Cloudflare Workers
Na MVP daje tani backend pod:
- tworzenie sesji,
- join codes,
- lekkie API,
- realtime / durable patterns w przyszłości.

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
- runtime nie może zakładać, że każda gra ma hosta i kontrolery.
