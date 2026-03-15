# TROUBLESHOOTING.md

## Common Issues

### `pnpm install` fails

Symptoms:
- workspace dependency errors
- missing local package links
- import resolution failures after adding a new package

Checklist:
- run `pnpm install` from repo root
- confirm the new package has a valid `package.json`
- confirm workspace package names use the `@project-party/*` convention

### Game not showing in hub

Symptoms:
- gra nie pojawia się w katalogu
- route istnieje, ale launch flow nie znajduje modułu

Checklist:
- czy gra została dodana do `apps/web/src/lib/gameRegistry.ts`?
- czy metadata gry nie ukrywają jej po stronie katalogu?
- czy `pnpm install` zostało uruchomione po dodaniu nowego pakietu?

### Module not found: `@project-party/...`

Symptoms:
- import error w IDE albo runtime
- TypeScript nie widzi nowego workspace package

Solution:

```powershell
pnpm install
```

Potem:
- zrestartuj TypeScript server / IDE
- sprawdź `name` w `package.json`
- sprawdź import w `apps/web/src/lib/gameRegistry.ts` albo w module gry

### Runtime nie startuje

Symptoms:
- ekran launch się ładuje, ale gra się nie mountuje
- błąd przy `createRuntime`

Checklist:
- czy `src/index.ts` eksportuje poprawny `defineGame(...)`?
- czy `createRuntime` jest podpięte do właściwego entrypointu?
- porównaj implementację z `games/kalambury/src/index.ts`
- sprawdź logi w konsoli przeglądarki

### Tests failing after adding game

Symptoms:
- typecheck errors
- missing files in test glob
- broken imports

Checklist:
- czy `tsconfig.json` w `games/<id>/` istnieje?
- czy package ma poprawne zależności?
- czy skrypt `test` w `package.json` odpowiada realnym test files?

Przykładowe komendy:

```powershell
pnpm --filter @project-party/game-my-game test
pnpm --filter @project-party/game-my-game typecheck
```

### Worker tests fail after API change

Checklist:
- sprawdź `apps/worker/src/http.test.ts`
- sprawdź `apps/worker/src/index.test.ts`
- porównaj payloady z aktualnym `apps/worker/src/http.ts`

### Shared package change causes regressions

Checklist:
- czy zmiana naprawdę powinna być w `packages/*`?
- uruchom `pnpm test`
- sprawdź `packages/shared/src/catalog.test.ts`
- sprawdź `packages/shared/src/session.test.ts`
