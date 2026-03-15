# Full Docs Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ujednolicić i urealnić dokumentację repo, aby onboarding i praca agentów opierały się na aktualnych ścieżkach, komendach i przykładach z Project Party.

**Architecture:** Zmiana dotyczy wyłącznie dokumentacji i pliku `.claude/project-knowledge.md`. Dokumenty mają wzajemnie się uzupełniać: `docs/*` pozostają źródłem prawdy, a `.claude/project-knowledge.md` daje szybki skrót orientacyjny.

**Tech Stack:** Markdown, Git

---

### Task 1: Naprawa mapy repo i contributing

**Files:**
- Modify: `docs/REPO_MAP.md`
- Modify: `docs/CONTRIBUTING.md`

**Step 1:** Usunąć Linuxowe ścieżki i odwołania do nieistniejących katalogów.

**Step 2:** Wpisać aktualne dokumenty i aktywne obszary repo.

### Task 2: Rozszerzenie workflow i testów

**Files:**
- Modify: `docs/CODEX_WORKFLOW.md`
- Modify: `docs/TECH_STACK.md`

**Step 1:** Dodać przykładowe workflow oparte na realnych plikach z `apps`, `games`, `packages`.

**Step 2:** Dodać przykłady testów i komend uruchomienia.

### Task 3: Rozszerzenie MCP guidance

**Files:**
- Modify: `docs/MCP_USAGE.md`

**Step 1:** Dodać przykłady dobrego użycia dokumentacyjnych tools.

**Step 2:** Dodać przykłady dobrego i złego użycia browser tools.

### Task 4: Dodanie docs pomocniczych

**Files:**
- Create: `docs/TROUBLESHOOTING.md`
- Create: `.claude/project-knowledge.md`

**Step 1:** Opisać najczęstsze problemy Windows/workspace/registry/runtime/typecheck.

**Step 2:** Dodać krótki quick reference dla AI.

### Task 5: Weryfikacja

**Files:**
- Verify: `docs/REPO_MAP.md`
- Verify: `docs/CONTRIBUTING.md`
- Verify: `docs/CODEX_WORKFLOW.md`
- Verify: `docs/TECH_STACK.md`
- Verify: `docs/MCP_USAGE.md`
- Verify: `docs/TROUBLESHOOTING.md`
- Verify: `.claude/project-knowledge.md`

**Step 1:** Sprawdzić `git diff -- docs .claude/project-knowledge.md`.

**Step 2:** Sprawdzić `git status --short --branch`.
