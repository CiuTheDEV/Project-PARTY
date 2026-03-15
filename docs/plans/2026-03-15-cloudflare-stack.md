# Cloudflare Stack Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Urealnić `TECH_STACK.md` pod docelowy deployment Cloudflare i dodać Durable Objects do opisu session infra bez usuwania lokalnego BroadcastChannel flow.

**Architecture:** Zmiana dotyczy dokumentacji stacku. Dokument ma wyraźnie rozdzielić frontend hosting, backend/API, produkcyjny stateful transport i lokalne workflow testowe.

**Tech Stack:** Markdown, Cloudflare Pages, Cloudflare Workers, Durable Objects

---

### Task 1: Hosting i backend

**Files:**
- Modify: `docs/TECH_STACK.md`

**Step 1:** Doprecyzować, że `apps/web` jest hostowane na Cloudflare Pages.

**Step 2:** Doprecyzować, że `apps/worker` działa na Cloudflare Workers.

### Task 2: Session infra

**Files:**
- Modify: `docs/TECH_STACK.md`

**Step 1:** Dodać Durable Objects do opisu produkcyjnej koordynacji sesji i realtime.

**Step 2:** Opisać `BroadcastChannel` jako local/dev fallback.

### Task 3: Weryfikacja

**Files:**
- Verify: `docs/TECH_STACK.md`

**Step 1:** Sprawdzić diff.

**Step 2:** Sprawdzić `git status --short --branch`.
