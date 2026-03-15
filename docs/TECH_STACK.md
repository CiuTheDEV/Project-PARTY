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
- Vitest dla unit/integration
- Playwright później dla krytycznych flow

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
