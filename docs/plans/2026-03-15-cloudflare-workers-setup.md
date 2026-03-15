# Cloudflare Workers Setup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Dodać minimalną, działającą konfigurację Cloudflare dla `apps/web` i `apps/worker`, z service bindingiem i Durable Objects przy zachowaniu lokalnego fallbacku.

**Architecture:** Frontend będzie serwowany przez worker ze static assets i service bindingiem do API workera. API worker dostanie Durable Objects dla sesji w środowisku Cloudflare oraz lokalny fallback do obecnego store w pamięci.

**Tech Stack:** Wrangler, Cloudflare Workers, Durable Objects, Vite, TypeScript

---

### Task 1: Web Worker setup

**Files:**
- Create: `apps/web/wrangler.jsonc`
- Create: `apps/web/src/cloudflare-entry.ts`
- Modify: `apps/web/package.json`

**Step 1:** Dodać config static assets i service binding do API.

**Step 2:** Dodać fetch handler dla assets i `/api/*`.

### Task 2: API Worker setup

**Files:**
- Create: `apps/worker/wrangler.jsonc`
- Create: `apps/worker/src/cloudflare-entry.ts`
- Create: `apps/worker/src/durable-object.ts`
- Modify: `apps/worker/package.json`

**Step 1:** Dodać config worker + DO bindings + migrations.

**Step 2:** Dodać minimalną klasę DO dla sesji.

### Task 3: Wiring z fallbackiem

**Files:**
- Modify: `apps/worker/src/http.ts`
- Modify: `apps/worker/src/index.ts`
- Modify: `apps/worker/src/session-store.ts`

**Step 1:** Dodać opcjonalny env do session flow.

**Step 2:** Użyć DO tylko gdy binding jest dostępny.

### Task 4: Repo-level polish

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`

**Step 1:** Dodać helper scripts do dev/deploy.

**Step 2:** Zignorować `.wrangler/`.

### Task 5: Verification

**Files:**
- Verify: `apps/web/*`
- Verify: `apps/worker/*`

**Step 1:** Uruchomić testy `apps/worker`.

**Step 2:** Sprawdzić `git diff` i `git status --short --branch`.
