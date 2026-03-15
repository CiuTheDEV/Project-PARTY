# Runtime Cloudflare Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Zaktualizować dokumenty architektury i runtime tak, aby były spójne z Cloudflare Pages + Workers + Durable Objects oraz local/dev fallbackiem przez BroadcastChannel.

**Architecture:** Zmiana dotyczy wyłącznie dokumentacji. `TECH_STACK.md`, `REPO_ARCHITECTURE.md` i `RUNTIME_CONTRACT.md` mają wspólnie opisywać ten sam model infrastruktury bez zmiany samego runtime contractu.

**Tech Stack:** Markdown, Cloudflare Pages, Cloudflare Workers, Durable Objects

---

### Task 1: Architektura repo

**Files:**
- Modify: `docs/REPO_ARCHITECTURE.md`

**Step 1:** Dopisać hosting `apps/web` na Cloudflare Pages.

**Step 2:** Dopisać Durable Objects po stronie `apps/worker`.

### Task 2: Runtime contract

**Files:**
- Modify: `docs/RUNTIME_CONTRACT.md`

**Step 1:** Dodać notkę, że `transport` może być mapowany na różne backend transports.

**Step 2:** Opisać Durable Objects jako preferowaną produkcyjną implementację i BroadcastChannel jako local/dev fallback.

### Task 3: Weryfikacja

**Files:**
- Verify: `docs/REPO_ARCHITECTURE.md`
- Verify: `docs/RUNTIME_CONTRACT.md`

**Step 1:** Sprawdzić diff.

**Step 2:** Sprawdzić `git status --short --branch`.
