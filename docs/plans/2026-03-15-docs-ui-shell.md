# Shared Game UI Shell Docs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Zaktualizować dokumentację tak, aby nowa gra miała jasny kontrakt wspólnego shellu UI oraz praktyczne wskazówki dla wdrożenia i testów.

**Architecture:** Zmiana jest lokalna do `docs/` i nie dotyka runtime ani kodu aplikacji. Dokumenty mają rozdzielić wspólny layout wejścia do gry od autonomicznej logiki modułów.

**Tech Stack:** Markdown, PowerShell, Git

---

### Task 1: Rozszerzenie standardu modułu gry

**Files:**
- Modify: `docs/GAME_MODULE_STANDARD.md`

**Step 1:** Dodać pełniejszy przykład `defineGame(...)` z przykładowymi polami.

**Step 2:** Dodać sekcję opisującą wspólny shell UI dla `main menu` i `game setup`.

**Step 3:** Doprecyzować definition of done o spójność z platformowym layoutem.

### Task 2: Dopisanie workflow Windows-first

**Files:**
- Modify: `docs/CODEX_WORKFLOW.md`

**Step 1:** Dodać sekcję `Common PowerShell commands`.

**Step 2:** Umieścić krótkie przykłady komend dla instalacji, dev, testów i buildów.

### Task 3: Rozszerzenie strategii testów

**Files:**
- Modify: `docs/TECH_STACK.md`

**Step 1:** Dopisać praktyczną strategię testów dla platformy, shared packages i game modules.

**Step 2:** Dodać krótką sekcję z przykładowymi komendami uruchamiania testów.

### Task 4: Dodanie przewodnika tworzenia nowej gry

**Files:**
- Create: `docs/CREATING_NEW_GAME.md`

**Step 1:** Opisać checklistę tworzenia nowego modułu gry.

**Step 2:** Wpisać obowiązek zachowania wspólnego layoutu `main menu` i `game setup`.

**Step 3:** Rozdzielić elementy wspólne od elementów per-gra: copy, settings, assets, palette, runtime logic.

### Task 5: Weryfikacja

**Files:**
- Verify: `docs/GAME_MODULE_STANDARD.md`
- Verify: `docs/CODEX_WORKFLOW.md`
- Verify: `docs/TECH_STACK.md`
- Verify: `docs/CREATING_NEW_GAME.md`

**Step 1:** Przeczytać diff i sprawdzić, czy dokumenty nie przesuwają gameplayu do platformy.

**Step 2:** Uruchomić `git diff -- docs` oraz `git status --short --branch`.

**Step 3:** Zacommitować zmianę po weryfikacji.
