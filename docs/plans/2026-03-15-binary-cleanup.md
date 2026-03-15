# Binary Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Usunąć z repo tylko nieużywane binarne artefakty poza mockupami.

**Architecture:** Zmiana jest ograniczona do cleanupu assetów. Mockupy dokumentacyjne i aktywnie używane assety gry pozostają nienaruszone.

**Tech Stack:** Git, Markdown

---

### Task 1: Potwierdzenie użycia assetów

**Files:**
- Verify: `games/kalambury/src/assets/kalambury-classic-performer.png`
- Verify: `games/kalambury/src/meta.ts`
- Verify: `games/kalambury/src/manifest/hub-content.ts`

**Step 1:** Sprawdzić, które assety są importowane przez kod produktu.

**Step 2:** Odróżnić aktywne assety od archiwalnych plików wspomnianych tylko w `docs/plans/`.

### Task 2: Cleanup

**Files:**
- Delete: `games/kalambury/src/assets/kalambury-classic-performer.png`

**Step 1:** Usunąć z repo wyłącznie potwierdzony nieużywany asset.

### Task 3: Weryfikacja

**Files:**
- Verify: `git diff -- games/kalambury/src/assets/kalambury-classic-performer.png docs/plans/2026-03-15-binary-cleanup-design.md docs/plans/2026-03-15-binary-cleanup.md`

**Step 1:** Sprawdzić diff.

**Step 2:** Sprawdzić `git status --short --branch`.
