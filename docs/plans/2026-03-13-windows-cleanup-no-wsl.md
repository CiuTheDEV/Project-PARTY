# Windows Cleanup Without WSL Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Usunac zaleznosc tej kopii repo od WSL i linuxowego toolchainu, tak aby lokalne komendy developerskie dzialaly natywnie w Windows.

**Architecture:** Zmiany pozostaja w lokalnym workflow i repo hygiene. Naprawiamy root cause w skryptach uruchomieniowych, a dopiero potem usuwamy katalogi i cache po WSL. Produkt i kontrakty runtime pozostaja bez zmian.

**Tech Stack:** Node.js on Windows, PowerShell, npm/pnpm workspace, Turbo, TypeScript, Biome, Playwright.

---

### Task 1: Przepiac launcher na natywny Windows Node

**Files:**
- Modify: `C:\Users\Mateo\Desktop\PROJECT PARTY\scripts\node`
- Modify: `C:\Users\Mateo\Desktop\PROJECT PARTY\package.json` only if command invocation requires it

**Step 1: Write the failing check**
- Uruchom obecny launcher i potwierdz, ze wymaga `.tools/node-linux`.

**Step 2: Run check to verify failure**
- Run: `Get-Content .\scripts\node`
- Expected: linux path to `.tools/node-linux`

**Step 3: Write minimal implementation**
- Replace shell wrapper with a Windows-native launcher strategy that uses installed `node.exe`.

**Step 4: Run check to verify it passes**
- Run: `node .\scripts\run-tool.mjs turbo --version`

### Task 2: Usunac linuxowe fallbacki z run-tool i Playwright

**Files:**
- Modify: `C:\Users\Mateo\Desktop\PROJECT PARTY\scripts\run-tool.mjs`
- Modify: `C:\Users\Mateo\Desktop\PROJECT PARTY\scripts\playwright-local.mjs`

**Step 1: Write the failing check**
- Identify references to `.tools/node-linux`, `.tools/linux-deps`, `.tools/linux-deps-19`, and linux-only binaries.

**Step 2: Run check to verify current issue**
- Run: `Select-String -Path .\scripts\run-tool.mjs,.\scripts\playwright-local.mjs -Pattern "node-linux|linux-deps|turbo-linux|:"`

**Step 3: Write minimal implementation**
- Resolve tools from `node_modules` and current `process.execPath`.
- Keep only Windows-safe path handling.

**Step 4: Run check to verify it passes**
- Run:
  - `node .\scripts\run-tool.mjs tsc --version`
  - `node .\scripts\run-tool.mjs biome --version`
  - `node .\scripts\playwright-local.mjs`

### Task 3: Zaktualizowac dokumentacje i ignore rules

**Files:**
- Modify: `C:\Users\Mateo\Desktop\PROJECT PARTY\docs\CODEX_WORKFLOW.md`
- Modify: `C:\Users\Mateo\Desktop\PROJECT PARTY\README.md` only if workflow note belongs there
- Modify only if needed: `C:\Users\Mateo\Desktop\PROJECT PARTY\.gitignore`

**Step 1: Write minimal doc update**
- Add a short note that this workspace copy is Windows-first and does not support WSL toolchain.

**Step 2: Verify ignore coverage**
- Confirm WSL/cache directories are ignored.

### Task 4: Usunac WSL-only artefakty po walidacji

**Files:**
- Delete directories only after toolchain checks pass:
  - `C:\Users\Mateo\Desktop\PROJECT PARTY\.tools\linux-deps`
  - `C:\Users\Mateo\Desktop\PROJECT PARTY\.tools\linux-deps-19`
  - `C:\Users\Mateo\Desktop\PROJECT PARTY\.tools\node-linux`
  - `C:\Users\Mateo\Desktop\PROJECT PARTY\.npm-cache`
  - `C:\Users\Mateo\Desktop\PROJECT PARTY\.pnpm-store`
  - `C:\Users\Mateo\Desktop\PROJECT PARTY\.playwright-browsers`
  - `C:\Users\Mateo\Desktop\PROJECT PARTY\.playwright-tmp`
  - `C:\Users\Mateo\Desktop\PROJECT PARTY\.playwright-tools`
  - `C:\Users\Mateo\Desktop\PROJECT PARTY\.turbo`
  - `C:\Users\Mateo\Desktop\PROJECT PARTY\output`

**Step 1: Validate first**
- Run toolchain commands before deleting anything.

**Step 2: Delete only the confirmed WSL-only directories**
- Keep `_legacy` untouched.

**Step 3: Verify cleanup**
- Re-run selected commands and confirm no dependency on removed directories remains.

### Task 5: Final verification

**Files:**
- None unless verification exposes a real gap

**Step 1: Run verification**
- `node .\scripts\run-tool.mjs turbo --version`
- `npm run typecheck`
- `npm run test`
- `npm run build`

**Step 2: Fix only scoped issues**
- Keep changes limited to local toolchain and cleanup.

**Step 3: Re-run verification**
- Confirm the workspace works without WSL-only files.
