# Playwright Tooling Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add repo-local Playwright tooling that works from Linux/WSL and can debug the running web app.

**Architecture:** Install Playwright at repo root, keep browser binaries in a repo-local cache, and add a single Node script for smoke/debug browser runs against `apps/web`.

**Tech Stack:** Playwright, Node.js, pnpm, existing repo-local Linux toolchain

---

### Task 1: Add repo-local Playwright dependency

**Files:**
- Modify: `/home/mateo/projects/project-party/package.json`
- Modify: `/home/mateo/projects/project-party/pnpm-lock.yaml`

**Steps:**
1. Add `playwright` as a root dev dependency.
2. Keep package changes at repo root only.
3. Verify the dependency is installed via repo-local pnpm.

### Task 2: Add a minimal browser debug script

**Files:**
- Create: `/home/mateo/projects/project-party/tests/playwright/debug-launch.mjs`

**Steps:**
1. Write a single script that opens `http://127.0.0.1:5174`.
2. Capture URL, body text, console messages, page errors, and failed requests.
3. Print JSON to stdout and exit non-zero on launch/runtime errors.

### Task 3: Add operational scripts

**Files:**
- Modify: `/home/mateo/projects/project-party/package.json`

**Steps:**
1. Add a script to install Chromium into a repo-local cache.
2. Add a script to run the debug launch script with the repo-local Playwright/browser configuration.
3. Keep the scripts explicit and Linux/WSL-first.

### Task 4: Verify end-to-end tooling

**Files:**
- None

**Steps:**
1. Install Chromium through the new repo script.
2. Run the debug script against the local app.
3. Confirm the browser starts and the script returns real browser diagnostics.
