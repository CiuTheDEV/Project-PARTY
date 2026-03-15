# Windows Cleanup Without WSL Design

**Goal:** Usunac zaleznosc tej kopii repo od WSL i linuxowego toolchainu, tak aby caly lokalny workflow dzialal natywnie w Windows PowerShell.

**Context**

Obecnie repo ma aktywne zaleznosci od linuxowych binarek i katalogow roboczych pozostalych po WSL:
- [`scripts/node`](/C:/Users/Mateo/Desktop/PROJECT%20PARTY/scripts/node) uruchamia `.tools/node-linux/bin/node`
- [`scripts/run-tool.mjs`](/C:/Users/Mateo/Desktop/PROJECT%20PARTY/scripts/run-tool.mjs) ma linuxowe fallbacki i PATH/NODE_PATH dla `.tools/linux-deps*`
- [`scripts/playwright-local.mjs`](/C:/Users/Mateo/Desktop/PROJECT%20PARTY/scripts/playwright-local.mjs) wymusza `.tools/node-linux`
- workspace zawiera artefakty WSL i cache: `.tools/linux-deps*`, `.tools/node-linux`, `.npm-cache`, `.pnpm-store`, `.playwright-*`, `.turbo`, `output`

## Approaches

### 1. Full Windows-first cleanup

Przepiac wszystkie skrypty na natywny `node.exe`, usunac linuxowe fallbacki i skasowac WSL-only katalogi.

Plusy:
- jasny, jednoznaczny workflow
- brak kolejnych potkniec o WSL
- mniejszy koszt utrzymania

Minusy:
- trzeba ostroznie poprawic kilka skryptow naraz

### 2. Dual-mode compatibility

Zostawic Windows i WSL obok siebie, ale preferowac Windows.

Plusy:
- minimalnie mniejsze ryzyko migracji

Minusy:
- dalej zostaje balagan
- dalej latwo odpalic zly tryb

### 3. File cleanup only

Usunac katalogi po WSL bez zmiany skryptow.

Plusy:
- najszybciej

Minusy:
- nie rozwiazuje root cause, bo skrypty nadal wskazuja na linuxowe binarki

## Recommended Design

Wybor: **Full Windows-first cleanup**.

### Architecture

Zmiana pozostaje w warstwie lokalnego toolchainu i repo hygiene. Nie zmienia kontraktu miedzy platforma a grami ani zachowania produktu. Dotykamy tylko skryptow uruchomieniowych, ignorowanych artefaktow i lekkiej dokumentacji operacyjnej.

### Planned Changes

1. Zastapic linuxowy launcher w [`scripts/node`](/C:/Users/Mateo/Desktop/PROJECT%20PARTY/scripts/node) natywnym wrapperem dla Windows.
2. Uproscic [`scripts/run-tool.mjs`](/C:/Users/Mateo/Desktop/PROJECT%20PARTY/scripts/run-tool.mjs), aby wybieral tylko windowsowe lub standardowe JS entrypointy z `node_modules`.
3. Uproscic [`scripts/playwright-local.mjs`](/C:/Users/Mateo/Desktop/PROJECT%20PARTY/scripts/playwright-local.mjs), aby korzystal z aktualnego `process.execPath` zamiast `.tools/node-linux`.
4. Dostosowac [`package.json`](/C:/Users/Mateo/Desktop/PROJECT%20PARTY/package.json), jesli bedzie potrzebne do natywnego uruchamiania z PowerShell.
5. Dodac krotka note w dokumentacji workflow, ze ta kopia repo jest windows-first i bez wsparcia WSL.
6. Usunac WSL-only katalogi i cache po potwierdzeniu, ze skrypty dzialaja bez nich.

### Risks

- PowerShell moze traktowac plik `scripts/node` inaczej niz shell posix, wiec wrapper musi byc uruchamialny z obecnych skryptow npm.
- `turbo`, `vite`, `tsc` i `biome` musza dalej rozpoznawac workspace links po usunieciu linuxowych PATH hackow.
- Playwright musi dzialac bez linuxowego node i bez `.tools/linux-deps*`.

### Validation

- `node .\scripts\run-tool.mjs turbo --version`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run playwright:debug:launch` tylko jesli lokalne zaleznosci Playwright sa nadal potrzebne po cleanupie

