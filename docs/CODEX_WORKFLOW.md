# CODEX_WORKFLOW.md

## Cel

Ten plik definiuje, jak Codex ma pracować w repozytorium Project Party.

## Priorytety

1. Zachować granice architektoniczne.
2. Nie psuć kontraktu między hubem a grami.
3. Zmieniać jak najmniej, ale sensownie.
4. Dokumentować zmianę, jeśli zmienia kontrakt lub strukturę.

## Tryby pracy

### PLAN
Używaj, gdy:
- zmiana dotyka wielu warstw,
- zmienia routing,
- zmienia runtime contract,
- zmienia integrację gry z hubem,
- nie jest jasne, czy odpowiedzialność należy do platformy czy gry.

### EXECUTE
Używaj, gdy:
- scope jest jasny,
- target files są znane,
- ryzyko architektoniczne zostało już ocenione.

### REVIEW
Używaj, gdy:
- audytujesz spójność repo,
- sprawdzasz regresje,
- oceniasz UX consistency,
- weryfikujesz, czy nie zbudowano przypadkiem gameplay monolitu.

## Środowisko lokalne

Ta kopia workspace jest Windows-first.

- Używaj natywnego `node.exe` i PowerShell.
- Nie opieraj lokalnego workflow o WSL, linuxowe binarki w `.tools/*` ani skrypty wymagające środowiska Linux.
- Jeśli lokalny toolchain znowu zacznie wskazywać na WSL fallbacki, potraktuj to jako błąd workflow i napraw root cause zamiast doklejać kolejne obejścia.

## Common PowerShell commands

Podstawowe komendy uruchamiaj z roota repo:

```powershell
pnpm install
pnpm dev
pnpm test
pnpm build
pnpm lint
pnpm typecheck
```

Przykłady pracy na konkretnych workspace'ach:

```powershell
pnpm --filter @project-party/web dev
pnpm --filter @project-party/web test
pnpm --filter @project-party/worker test
pnpm --filter @project-party/game-kalambury test
pnpm --filter @project-party/game-tajniacy test
```

Przykłady dodatkowych narzędzi:

```powershell
pnpm playwright:install
pnpm playwright:debug:launch
```

Jeśli dopisujesz komendy do dokumentacji, bazuj na realnych skryptach z `package.json`, a nie na przykładowych komendach z internetu.

## Zasady implementacyjne

- Preferuj micro-buildy.
- Nie rób refactorów pobocznych bez potrzeby.
- Lokalna zmiana w grze powinna zostać lokalną zmianą w grze.
- Zmiana w `packages/*` wymaga uzasadnienia, że jest realnie współdzielona.
- Zmiana w `docs/*` jest obowiązkowa, gdy zmienia się kontrakt lub docelowa struktura.
- Wspólny layout `main menu` i `game setup` jest platformowym shell-em UI i powinien pozostać spójny między grami.

## Checklist przed zakończeniem taska

- Czy zmiana trafiła do właściwej warstwy?
- Czy hub nie nauczył się czegoś o konkretnej grze, czego nie powinien wiedzieć?
- Czy nie powstał shared abstraction tylko dla jednej gry?
- Czy dokumentacja wymaga aktualizacji?
