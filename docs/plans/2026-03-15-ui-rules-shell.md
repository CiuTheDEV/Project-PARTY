# UI Rules Shared Shell Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Dodać do `docs/UI_RULES.md` praktyczne zasady dla shared game UI shell i sugerowaną anatomię ekranów wejścia do gry.

**Architecture:** Zmiana jest lokalna do dokumentacji. `UI_RULES.md` ma uzupełnić istniejące dokumenty o warstwę wizualno-layoutową bez naruszania granicy między platformą a gameplayem gry.

**Tech Stack:** Markdown, Git

---

### Task 1: Rozszerzenie reguł UI

**Files:**
- Modify: `docs/UI_RULES.md`

**Step 1:** Dodać sekcję `Shared Game UI Shell`.

**Step 2:** Opisać, co jest wspólne między grami, a co może być różne.

### Task 2: Dodanie sugerowanej anatomii

**Files:**
- Modify: `docs/UI_RULES.md`

**Step 1:** Dodać `Main Menu Anatomy` z sugerowanymi blokami.

**Step 2:** Dodać `Setup Screen Anatomy` z sugerowanymi grupami sekcji.

### Task 3: Weryfikacja

**Files:**
- Verify: `docs/UI_RULES.md`

**Step 1:** Sprawdzić diff pod kątem zgodności z `docs/GAME_MODULE_STANDARD.md` i `docs/CREATING_NEW_GAME.md`.

**Step 2:** Uruchomić `git diff -- docs/UI_RULES.md` oraz `git status --short --branch`.
