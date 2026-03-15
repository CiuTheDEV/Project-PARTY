# Kalambury Remote Transport Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Zbudować pełny zdalny transport Kalambur przez Durable Objects z zachowaniem fallbacku `BroadcastChannel`.

**Architecture:** Worker przechowuje session snapshot i event log w Durable Object. Web buduje adapter transportu, który potrafi działać lokalnie i zdalnie. Kalambury używają bridge opartego o wspólny kanał wiadomości zamiast surowego `BroadcastChannel`.

**Tech Stack:** TypeScript, Cloudflare Workers, Durable Objects, React, node:test

---

### Task 1: Session types i worker state

**Files:**
- Modify: `C:\Users\Mateo\Desktop\PROJECT PARTY\packages\types\src\session.ts`
- Modify: `C:\Users\Mateo\Desktop\PROJECT PARTY\apps\worker\src\session-store.ts`
- Modify: `C:\Users\Mateo\Desktop\PROJECT PARTY\apps\worker\src\durable-object.ts`
- Test: `C:\Users\Mateo\Desktop\PROJECT PARTY\apps\worker\src\http.test.ts`

1. Dodać platformowe typy uczestnika sesji i eventu sesji.
2. Rozszerzyć `SessionRecord` o participants.
3. Dodać obsługę zapisu/odczytu eventów w Durable Object.
4. Dopisać testy worker dla join + event flow.

### Task 2: Worker HTTP endpoints

**Files:**
- Modify: `C:\Users\Mateo\Desktop\PROJECT PARTY\apps\worker\src\http.ts`
- Modify: `C:\Users\Mateo\Desktop\PROJECT PARTY\apps\worker\src\session-store.ts`
- Test: `C:\Users\Mateo\Desktop\PROJECT PARTY\apps\worker\src\http.test.ts`

1. Dodać endpoint publikacji eventu sesji.
2. Dodać endpoint odczytu eventów od wskazanego offsetu.
3. Dodać endpoint snapshotu participants przez istniejący `GET /api/sessions/:code`.
4. Pokryć to testami.

### Task 3: Web session transport adapter

**Files:**
- Create: `C:\Users\Mateo\Desktop\PROJECT PARTY\apps\web\src\runtime\session-transport.ts`
- Create: `C:\Users\Mateo\Desktop\PROJECT PARTY\apps\web\src\runtime\session-transport.test.mjs`
- Modify: `C:\Users\Mateo\Desktop\PROJECT PARTY\apps\web\src\api\platform.ts`
- Modify: `C:\Users\Mateo\Desktop\PROJECT PARTY\apps\web\src\runtime\mountRuntime.ts`

1. Dodać API publish/fetch events.
2. Zbudować adapter z local fallback i remote pollingiem.
3. Wstrzyknąć adapter do runtime.
4. Sprawdzić testami local + remote mode.

### Task 4: Kalambury bridge abstraction

**Files:**
- Modify: `C:\Users\Mateo\Desktop\PROJECT PARTY\games\kalambury\src\shared\presenter-bridge.ts`
- Test: istniejące testy Kalambur bridge/parity jeśli dotykają bridge

1. Wyciągnąć wspólne API kanału wiadomości.
2. Zachować kompatybilność z `BroadcastChannel`.
3. Umożliwić podanie transportu runtime jako primary channel.

### Task 5: Kalambury runtime integration

**Files:**
- Modify: `C:\Users\Mateo\Desktop\PROJECT PARTY\games\kalambury\src\runtime\createRuntime.ts`
- Modify: `C:\Users\Mateo\Desktop\PROJECT PARTY\games\kalambury\src\controller\ControllerApp.tsx`
- Modify: `C:\Users\Mateo\Desktop\PROJECT PARTY\games\kalambury\src\host\PlayScreen.tsx`

1. Przekazać transport do host/controller.
2. Użyć zdalnego kanału jako primary i `BroadcastChannel` jako fallback.
3. Zachować obecną semantykę preview/reveal/reroll/reset.

### Task 6: Verification

**Files:**
- Modify if needed: `C:\Users\Mateo\Desktop\PROJECT PARTY\docs\RUNTIME_CONTRACT.md`

1. Uruchomić testy worker.
2. Uruchomić testy web adaptera.
3. Uruchomić testy Kalambur dotknięte bridge.
4. Jeśli kontrakt platformowy się rozszerzy, dopisać docs.
