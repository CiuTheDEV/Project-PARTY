# Kalambury Transport Modes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dodać w Kalambury wybór trybu połączenia (DO+WS / Firebase RTDB / BroadcastChannel) jako globalne ustawienie persystowane w localStorage, z pełną integracją z runtime gry.

**Architecture:** Kalambury-local transport factory w `games/kalambury/src/transport/` — trzy adaptery w osobnych plikach, wspólny interfejs `KalamburyTransport`. Platforma (`apps/`) nie jest modyfikowana. UI jako nowy tab "Połączenie" w panelu Ustawienia gry.

**Tech Stack:** TypeScript, React, Firebase Realtime Database (`firebase` npm), Vite env vars (`VITE_FIREBASE_*`), natywny `BroadcastChannel` API, Node.js native test runner.

**Spec:** `docs/superpowers/specs/2026-03-16-kalambury-transport-modes-design.md`

---

## File Map

### Nowe pliki
| Plik | Odpowiedzialność |
|---|---|
| `games/kalambury/src/transport/types.ts` | `KalamburyTransportMode`, `KalamburyTransport` interface |
| `games/kalambury/src/transport/transport-storage.ts` | get/set trybu w localStorage |
| `games/kalambury/src/transport/broadcast.ts` | BroadcastChannel adapter |
| `games/kalambury/src/transport/do-ws.ts` | Wrapper na `context.transport` (DO+WS) |
| `games/kalambury/src/transport/firebase.ts` | Firebase RTDB adapter |
| `games/kalambury/src/transport/index.ts` | Fabryka `createKalamburyTransport()` |
| `games/kalambury/src/host/ConnectionModePanel.tsx` | UI — radio karty wyboru trybu |
| `games/kalambury/src/transport/transport-storage.test.ts` | Testy transport-storage |
| `games/kalambury/src/transport/broadcast.test.ts` | Testy broadcast adaptera |
| `games/kalambury/src/transport/do-ws.test.ts` | Testy do-ws adaptera |
| `games/kalambury/src/transport/index.test.ts` | Testy fabryki |

### Modyfikowane pliki
| Plik | Zmiana |
|---|---|
| `games/kalambury/package.json` | Dodanie `firebase` do dependencies |
| `games/kalambury/src/manifest/hub-content.ts` | Nowy tab `"connection"`, rozszerzona unia, `items?` opcjonalne |
| `games/kalambury/src/host/HostApp.tsx` | Render `ConnectionModePanel` dla taba `"connection"` |
| `games/kalambury/src/runtime/createRuntime.ts` | Guard + `createKalamburyTransport` zamiast `context.transport` bezpośrednio |

---

## Chunk 0: Przygotowanie — aktualizacja skryptu testowego

### Task 0: Dodaj src/transport/*.test.ts do skryptu testowego

**Files:**
- Modify: `games/kalambury/package.json`

Bez tej zmiany wszystkie polecenia `pnpm --filter @project-party/game-kalambury test` w kolejnych taskach cicho pomijają nowe pliki testowe z folderu `transport/` — zamiast zgłaszać błąd "Cannot find module" zgłoszą "0 tests found".

- [ ] **Step 1: Zaktualizuj pole `test` w package.json**

Zmień:
```json
"test": "node ../../scripts/run-node-test.mjs src/*.test.ts src/manifest/*.test.ts src/shared/*.test.ts src/runtime/*.test.ts src/host/*.test.js src/controller/*.test.js"
```
Na:
```json
"test": "node ../../scripts/run-node-test.mjs src/*.test.ts src/manifest/*.test.ts src/shared/*.test.ts src/runtime/*.test.ts src/transport/*.test.ts src/host/*.test.js src/controller/*.test.js"
```

- [ ] **Step 2: Uruchom testy — powinny przejść (istniejące)**

```bash
pnpm --filter @project-party/game-kalambury test
```
Oczekiwane: wszystkie istniejące testy passing, nowe pliki w `transport/` jeszcze nie istnieją więc glob ich nie znajdzie.

- [ ] **Step 3: Commit**

```bash
git add games/kalambury/package.json
git commit -m "chore(kalambury): add transport test glob to test script"
```

---

## Chunk 1: Typy i transport-storage

### Task 1: Typy transportu

**Files:**
- Create: `games/kalambury/src/transport/types.ts`

- [ ] **Step 1: Utwórz plik typów**

```ts
// games/kalambury/src/transport/types.ts
import type { GameRuntimeContext } from "@project-party/game-runtime";

export type KalamburyTransportMode = "firebase" | "do-ws" | "broadcast";

export interface KalamburyTransport {
  send: (event: string, payload?: unknown) => Promise<void> | void;
  on: (event: string, handler: (payload: unknown) => void) => () => void;
  destroy: () => void;
}

// Alias dla wygody adapterów
export type PlatformTransport = GameRuntimeContext["transport"];
```

- [ ] **Step 2: Sprawdź typecheck**

```bash
pnpm --filter @project-party/game-kalambury typecheck
```
Oczekiwane: brak błędów.

- [ ] **Step 3: Commit**

```bash
git add games/kalambury/src/transport/types.ts
git commit -m "feat(kalambury): add KalamburyTransport types"
```

---

### Task 2: transport-storage — persystencja trybu w localStorage

**Files:**
- Create: `games/kalambury/src/transport/transport-storage.ts`
- Create: `games/kalambury/src/transport/transport-storage.test.ts`

- [ ] **Step 1: Napisz failing test**

```ts
// games/kalambury/src/transport/transport-storage.test.ts
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";

// Mock localStorage dla środowiska Node
const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
};

// Podmień globalny localStorage przed importem
(globalThis as any).localStorage = mockLocalStorage;

const { getTransportMode, setTransportMode } = await import("./transport-storage.ts");

describe("transport-storage", () => {
  before(() => { delete store["kalambury:transport-mode"]; });

  it("returns do-ws as default when nothing is stored", () => {
    assert.equal(getTransportMode(), "do-ws");
  });

  it("returns stored mode after setTransportMode", () => {
    setTransportMode("firebase");
    assert.equal(getTransportMode(), "firebase");
  });

  it("returns do-ws for unknown stored value", () => {
    store["kalambury:transport-mode"] = "invalid-value";
    assert.equal(getTransportMode(), "do-ws");
  });

  after(() => { delete store["kalambury:transport-mode"]; });
});
```

- [ ] **Step 2: Uruchom test — powinien failować**

```bash
pnpm --filter @project-party/game-kalambury test
```
Oczekiwane: błąd "Cannot find module ./transport-storage.ts".

- [ ] **Step 3: Zaimplementuj transport-storage**

```ts
// games/kalambury/src/transport/transport-storage.ts
import type { KalamburyTransportMode } from "./types";

const KEY = "kalambury:transport-mode";
const DEFAULT: KalamburyTransportMode = "do-ws";
const VALID_MODES: KalamburyTransportMode[] = ["do-ws", "firebase", "broadcast"];

export function getTransportMode(): KalamburyTransportMode {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored && (VALID_MODES as string[]).includes(stored)) {
      return stored as KalamburyTransportMode;
    }
  } catch {
    // localStorage niedostępny (np. SSR)
  }
  return DEFAULT;
}

export function setTransportMode(mode: KalamburyTransportMode): void {
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    // localStorage niedostępny
  }
}
```

- [ ] **Step 4: Uruchom testy — powinny przejść**

```bash
pnpm --filter @project-party/game-kalambury test
```
Oczekiwane: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add games/kalambury/src/transport/transport-storage.ts games/kalambury/src/transport/transport-storage.test.ts
git commit -m "feat(kalambury): add transport-storage (get/set mode in localStorage)"
```

---

## Chunk 2: Adaptery transport

### Task 3: BroadcastChannel adapter

**Files:**
- Create: `games/kalambury/src/transport/broadcast.ts`
- Create: `games/kalambury/src/transport/broadcast.test.ts`

- [ ] **Step 1: Napisz failing test**

```ts
// games/kalambury/src/transport/broadcast.test.ts
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";

// BroadcastChannel mock dla Node.js
class MockBroadcastChannel {
  static channels: Map<string, MockBroadcastChannel[]> = new Map();
  name: string;
  onmessage: ((event: { data: unknown }) => void) | null = null;

  constructor(name: string) {
    this.name = name;
    const list = MockBroadcastChannel.channels.get(name) ?? [];
    list.push(this);
    MockBroadcastChannel.channels.set(name, list);
  }

  postMessage(data: unknown) {
    const list = MockBroadcastChannel.channels.get(this.name) ?? [];
    for (const ch of list) {
      if (ch !== this) ch.onmessage?.({ data });
    }
  }

  close() {
    const list = MockBroadcastChannel.channels.get(this.name) ?? [];
    MockBroadcastChannel.channels.set(
      this.name,
      list.filter((ch) => ch !== this),
    );
  }
}

(globalThis as any).BroadcastChannel = MockBroadcastChannel;

const { createBroadcastAdapter } = await import("./broadcast.ts");

describe("broadcast adapter", () => {
  before(() => MockBroadcastChannel.channels.clear());

  it("sends and receives a message on the same channel name", async () => {
    const a = createBroadcastAdapter("test-session");
    const b = createBroadcastAdapter("test-session");

    const received: unknown[] = [];
    b.on("test.event", (payload) => received.push(payload));

    a.send("test.event", { value: 42 });

    await new Promise((r) => setTimeout(r, 0));
    assert.deepEqual(received, [{ value: 42 }]);

    a.destroy();
    b.destroy();
  });

  it("does not receive messages on different channel names", async () => {
    const a = createBroadcastAdapter("session-1");
    const b = createBroadcastAdapter("session-2");

    const received: unknown[] = [];
    b.on("test.event", (payload) => received.push(payload));
    a.send("test.event", { value: 1 });

    await new Promise((r) => setTimeout(r, 0));
    assert.deepEqual(received, []);

    a.destroy();
    b.destroy();
  });

  it("unsubscribes handler when returned function is called", async () => {
    const a = createBroadcastAdapter("unsub-session");
    const b = createBroadcastAdapter("unsub-session");

    const received: unknown[] = [];
    const unsub = b.on("test.event", (payload) => received.push(payload));
    unsub();

    a.send("test.event", { value: 99 });
    await new Promise((r) => setTimeout(r, 0));
    assert.deepEqual(received, []);

    a.destroy();
    b.destroy();
  });
});
```

- [ ] **Step 2: Uruchom test — powinien failować**

```bash
pnpm --filter @project-party/game-kalambury test
```
Oczekiwane: błąd "Cannot find module ./broadcast.ts".

- [ ] **Step 3: Zaimplementuj broadcast adapter**

```ts
// games/kalambury/src/transport/broadcast.ts
import type { KalamburyTransport } from "./types";

type MessageEnvelope = { event: string; payload: unknown };

export function createBroadcastAdapter(sessionCode: string): KalamburyTransport {
  const channel = new BroadcastChannel(`kalambury:${sessionCode}`);
  const handlers = new Map<string, Set<(payload: unknown) => void>>();

  channel.onmessage = (event) => {
    const envelope = event.data as MessageEnvelope;
    if (!envelope?.event) return;
    const eventHandlers = handlers.get(envelope.event);
    if (!eventHandlers) return;
    for (const handler of eventHandlers) {
      handler(envelope.payload);
    }
  };

  return {
    send(event, payload) {
      channel.postMessage({ event, payload } satisfies MessageEnvelope);
    },
    on(event, handler) {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(handler);
      return () => handlers.get(event)?.delete(handler);
    },
    destroy() {
      handlers.clear();
      channel.close();
    },
  };
}
```

- [ ] **Step 4: Uruchom testy — powinny przejść**

```bash
pnpm --filter @project-party/game-kalambury test
```
Oczekiwane: wszystkie passing.

- [ ] **Step 5: Commit**

```bash
git add games/kalambury/src/transport/broadcast.ts games/kalambury/src/transport/broadcast.test.ts
git commit -m "feat(kalambury): add BroadcastChannel transport adapter"
```

---

### Task 4: DO+WS adapter (wrapper na context.transport)

**Files:**
- Create: `games/kalambury/src/transport/do-ws.ts`
- Create: `games/kalambury/src/transport/do-ws.test.ts`

- [ ] **Step 1: Napisz failing test**

```ts
// games/kalambury/src/transport/do-ws.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { PlatformTransport } from "./types";

const { createDoWsAdapter } = await import("./do-ws.ts");

function createMockPlatformTransport(): PlatformTransport & {
  sentEvents: Array<{ event: string; payload: unknown }>;
  simulateIncoming: (event: string, payload: unknown) => void;
} {
  const sentEvents: Array<{ event: string; payload: unknown }> = [];
  const listeners = new Map<string, Set<(payload: unknown) => void>>();

  return {
    sentEvents,
    send(event, payload) {
      sentEvents.push({ event, payload });
    },
    on(event, handler) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(handler);
      return () => listeners.get(event)?.delete(handler);
    },
    simulateIncoming(event, payload) {
      listeners.get(event)?.forEach((h) => h(payload));
    },
  };
}

describe("do-ws adapter", () => {
  it("delegates send to platform transport", () => {
    const mock = createMockPlatformTransport();
    const adapter = createDoWsAdapter(mock);

    adapter.send("test.event", { x: 1 });
    assert.deepEqual(mock.sentEvents, [{ event: "test.event", payload: { x: 1 } }]);
  });

  it("delegates on to platform transport and returns unsubscribe", () => {
    const mock = createMockPlatformTransport();
    const adapter = createDoWsAdapter(mock);

    const received: unknown[] = [];
    const unsub = adapter.on("test.event", (p) => received.push(p));

    mock.simulateIncoming("test.event", { y: 2 });
    assert.deepEqual(received, [{ y: 2 }]);

    unsub();
    mock.simulateIncoming("test.event", { y: 3 });
    assert.deepEqual(received, [{ y: 2 }]); // nie dodano po unsub
  });
});
```

- [ ] **Step 2: Uruchom test — powinien failować**

```bash
pnpm --filter @project-party/game-kalambury test
```
Oczekiwane: błąd "Cannot find module ./do-ws.ts".

- [ ] **Step 3: Zaimplementuj do-ws adapter**

```ts
// games/kalambury/src/transport/do-ws.ts
import type { KalamburyTransport, PlatformTransport } from "./types";

export function createDoWsAdapter(transport: PlatformTransport): KalamburyTransport {
  return {
    send: (event, payload) => transport.send(event, payload),
    on: (event, handler) => transport.on(event, handler),
    destroy() {
      // context.transport jest zarządzany przez platformę — nie niszczymy go tutaj
    },
  };
}
```

- [ ] **Step 4: Uruchom testy — powinny przejść**

```bash
pnpm --filter @project-party/game-kalambury test
```
Oczekiwane: wszystkie passing.

- [ ] **Step 5: Commit**

```bash
git add games/kalambury/src/transport/do-ws.ts games/kalambury/src/transport/do-ws.test.ts
git commit -m "feat(kalambury): add DO+WS transport adapter (wraps context.transport)"
```

---

### Task 5: Dodaj firebase do package.json

**Files:**
- Modify: `games/kalambury/package.json`

- [ ] **Step 1: Dodaj firebase dependency**

```bash
pnpm --filter @project-party/game-kalambury add firebase
```

- [ ] **Step 2: Sprawdź czy firebase pojawił się w package.json**

```bash
grep '"firebase"' games/kalambury/package.json
```
Oczekiwane: linia z wersją firebase.

- [ ] **Step 3: Commit**

```bash
git add games/kalambury/package.json pnpm-lock.yaml
git commit -m "feat(kalambury): add firebase dependency"
```

---

### Task 6: Firebase RTDB adapter

**Files:**
- Create: `games/kalambury/src/transport/firebase.ts`

Uwaga: Firebase adapter **nie ma unit testów** w tym planie — wymaga działającego Firebase projektu. Testowanie odbywa się manualnie (patrz Task 10: weryfikacja e2e). Zamiast tego w pliku umieszczamy komentarze dokumentujące zachowanie.

- [ ] **Step 1: Utwórz firebase adapter**

```ts
// games/kalambury/src/transport/firebase.ts
import type { KalamburyTransport } from "./types";

// Lazy import — firebase SDK ładuje się tylko gdy wybrany tryb "firebase"
// Credentials z .env.local: VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN,
// VITE_FIREBASE_DATABASE_URL, VITE_FIREBASE_PROJECT_ID

type FirebaseApp = import("firebase/app").FirebaseApp;
type DatabaseReference = import("firebase/database").DatabaseReference;

let firebaseApp: FirebaseApp | null = null;

async function getFirebaseApp(): Promise<FirebaseApp> {
  if (firebaseApp) return firebaseApp;

  const { initializeApp, getApps } = await import("firebase/app");

  const existing = getApps().find((app) => app.name === "kalambury");
  if (existing) {
    firebaseApp = existing;
    return firebaseApp;
  }

  firebaseApp = initializeApp(
    {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    },
    "kalambury",
  );

  return firebaseApp;
}

export async function createFirebaseAdapter(
  sessionCode: string,
): Promise<KalamburyTransport> {
  const app = await getFirebaseApp();
  const { getDatabase, ref, push, onChildAdded, off } = await import(
    "firebase/database"
  );

  const db = getDatabase(app);
  const sessionRef: DatabaseReference = ref(
    db,
    `sessions/${sessionCode}/events`,
  );

  // Zapamiętujemy czas dołączenia — nie odtwarzamy historii starszych eventów
  const joinTimestamp = Date.now();

  return {
    send(event, payload) {
      push(sessionRef, {
        event,
        payload: payload ?? null,
        createdAt: Date.now(),
      }).catch((err: unknown) => {
        console.error("[kalambury/firebase] send error:", err);
      });
    },

    on(event, handler) {
      // onChildAdded zwraca funkcję unsubscribe — wywołujemy ją gdy handler jest usuwany
      return onChildAdded(sessionRef, (snapshot) => {
        const data = snapshot.val() as {
          event: string;
          payload: unknown;
          createdAt: number;
        } | null;

        if (!data) return;
        if (data.createdAt < joinTimestamp) return; // ignoruj historię
        if (data.event !== event) return;

        handler(data.payload);
      });
    },

    destroy() {
      // off(sessionRef) odłącza wszystkie listenery na tej ścieżce
      off(sessionRef);
    },
  };
}
```

- [ ] **Step 2: Sprawdź typecheck**

```bash
pnpm --filter @project-party/game-kalambury typecheck
```
Oczekiwane: brak błędów TypeScript.

- [ ] **Step 3: Commit**

```bash
git add games/kalambury/src/transport/firebase.ts
git commit -m "feat(kalambury): add Firebase RTDB transport adapter"
```

---

## Chunk 3: Fabryka transport

### Task 7: Fabryka createKalamburyTransport

**Files:**
- Create: `games/kalambury/src/transport/index.ts`
- Create: `games/kalambury/src/transport/index.test.ts`

- [ ] **Step 1: Napisz failing test**

```ts
// games/kalambury/src/transport/index.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { PlatformTransport } from "./types";

// Mock BroadcastChannel
class MockBroadcastChannel {
  name: string;
  constructor(name: string) { this.name = name; }
  onmessage = null;
  postMessage() {}
  close() {}
}
(globalThis as any).BroadcastChannel = MockBroadcastChannel;

const mockTransport: PlatformTransport = {
  send: () => {},
  on: () => () => {},
};

const { createKalamburyTransportAsync } = await import("./index.ts");

describe("createKalamburyTransportAsync factory", () => {
  it("returns a transport with send, on, destroy for broadcast mode", async () => {
    const t = await createKalamburyTransportAsync("broadcast", "test-session", mockTransport);
    assert.ok(typeof t.send === "function");
    assert.ok(typeof t.on === "function");
    assert.ok(typeof t.destroy === "function");
    t.destroy();
  });

  it("returns a transport with send, on, destroy for do-ws mode", async () => {
    const t = await createKalamburyTransportAsync("do-ws", "test-session", mockTransport);
    assert.ok(typeof t.send === "function");
    assert.ok(typeof t.on === "function");
    assert.ok(typeof t.destroy === "function");
  });

  it("rejects when mode is firebase and sessionCode is empty", async () => {
    await assert.rejects(
      () => createKalamburyTransportAsync("firebase", "", mockTransport),
      /Firebase wymaga aktywnej sesji/,
    );
  });

  it("rejects when mode is firebase and sessionCode is undefined", async () => {
    await assert.rejects(
      () => createKalamburyTransportAsync("firebase", undefined, mockTransport),
      /Firebase wymaga aktywnej sesji/,
    );
  });
});
```

- [ ] **Step 2: Uruchom test — powinien failować**

```bash
pnpm --filter @project-party/game-kalambury test
```
Oczekiwane: błąd "Cannot find module ./index.ts".

- [ ] **Step 3: Zaimplementuj fabrykę**

Uwaga: Firebase adapter jest `async` (lazy import SDK). Dlatego eksportujemy wyłącznie `createKalamburyTransportAsync` — jedną funkcję async obsługującą wszystkie tryby. Nie ma osobnej synchronicznej fabryki dla firebase, co eliminuje niejednoznaczność guard'ów.

```ts
// games/kalambury/src/transport/index.ts
import type { GameRuntimeContext } from "@project-party/game-runtime";
import type { KalamburyTransport, KalamburyTransportMode } from "./types";
import { createBroadcastAdapter } from "./broadcast";
import { createDoWsAdapter } from "./do-ws";

export type { KalamburyTransport, KalamburyTransportMode };
export { getTransportMode, setTransportMode } from "./transport-storage";

// Jedyna publiczna fabryka — async żeby obsłużyć lazy Firebase import
export async function createKalamburyTransportAsync(
  mode: KalamburyTransportMode,
  sessionCode: string | undefined,
  contextTransport: GameRuntimeContext["transport"],
): Promise<KalamburyTransport> {
  if (mode === "firebase") {
    if (!sessionCode) {
      throw new Error(
        "Tryb Firebase wymaga aktywnej sesji sieciowej. Zmień tryb połączenia w Ustawieniach.",
      );
    }
    const { createFirebaseAdapter } = await import("./firebase");
    return createFirebaseAdapter(sessionCode);
  }

  if (mode === "broadcast") {
    return createBroadcastAdapter(sessionCode ?? "local");
  }

  // do-ws (domyślny)
  return createDoWsAdapter(contextTransport);
}
```

- [ ] **Step 4: Uruchom testy — powinny przejść**

```bash
pnpm --filter @project-party/game-kalambury test
```
Oczekiwane: wszystkie passing.

- [ ] **Step 5: Commit**

```bash
git add games/kalambury/src/transport/index.ts games/kalambury/src/transport/index.test.ts
git commit -m "feat(kalambury): add createKalamburyTransport factory"
```

---

## Chunk 4: Integracja z runtime

### Task 8: Aktualizacja createRuntime.ts

**Files:**
- Modify: `games/kalambury/src/runtime/createRuntime.ts`

Obecny plik (`createRuntime.ts`) używa `context.transport` bezpośrednio. Zastępujemy to `createKalamburyTransportAsync`.

- [ ] **Step 1: Zaktualizuj createRuntime.ts**

Zastąp cały plik:

```ts
// games/kalambury/src/runtime/createRuntime.ts
import type {
  GameRuntimeContext,
  GameRuntimeHandle,
} from "@project-party/game-runtime";
import { createElement } from "react";

import { KalamburyControllerApp } from "../controller/ControllerApp";
import { KalamburyHostApp } from "../host/HostApp";
import {
  type KalamburyPresenterChannel,
  isPresenterMessage,
} from "../shared/presenter-bridge";
import {
  createKalamburyTransportAsync,
  getTransportMode,
} from "../transport/index";

function createPresenterTransportChannel(
  send: GameRuntimeContext["transport"]["send"],
  on: GameRuntimeContext["transport"]["on"],
): KalamburyPresenterChannel {
  return {
    postMessage(message) {
      return send("kalambury.presenter", message);
    },
    subscribe(handler) {
      return on("kalambury.presenter", (payload) => {
        if (isPresenterMessage(payload)) {
          handler(payload);
        }
      });
    },
  };
}

export function createKalamburyRuntime(
  context: GameRuntimeContext,
): GameRuntimeHandle {
  return {
    async start() {
      const mode = getTransportMode();
      const transport = await createKalamburyTransportAsync(
        mode,
        context.sessionCode,
        context.transport,
      );

      context.storage.set("kalambury:last-session-id", context.sessionId);
      transport.send("kalambury/runtime-started", {
        role: context.role,
        device: context.device,
      });

      const presenterTransportChannel = createPresenterTransportChannel(
        transport.send.bind(transport),
        transport.on.bind(transport),
      );

      if (context.role === "controller" || context.role === "player") {
        context.ui.mount(
          createElement(KalamburyControllerApp, {
            sessionCode: context.sessionCode,
            playerName: context.players[0]?.name,
            transportChannel: presenterTransportChannel,
          }),
        );
        return;
      }

      context.ui.mount(
        createElement(KalamburyHostApp, {
          sessionCode: context.sessionCode,
          transportChannel: presenterTransportChannel,
          storage: {
            getItem: (key: string) => context.storage.get<string>(key),
            setItem: (key: string, value: string) =>
              context.storage.set(key, value),
          },
        }),
      );
    },
    destroy() {
      context.ui.unmount();
    },
  };
}
```

- [ ] **Step 2: Uruchom typecheck i testy**

```bash
pnpm --filter @project-party/game-kalambury typecheck
pnpm --filter @project-party/game-kalambury test
```
Oczekiwane: brak błędów TypeScript, wszystkie testy passing.

- [ ] **Step 3: Commit**

```bash
git add games/kalambury/src/runtime/createRuntime.ts
git commit -m "feat(kalambury): integrate transport factory into createRuntime"
```

---

## Chunk 5: UI — hub-content i ConnectionModePanel

### Task 9: Aktualizacja hub-content.ts

**Files:**
- Modify: `games/kalambury/src/manifest/hub-content.ts`

- [ ] **Step 1: Rozszerz `KalamburyHubSettingsTabId` i zaktualizuj typ taba**

W `hub-content.ts` wprowadź trzy zmiany:

1. Dodaj `"connection"` do unii `KalamburyHubSettingsTabId` (po `"animations"`, przed `"data"`):
```ts
export type KalamburyHubSettingsTabId =
  | "sound"
  | "animations"
  | "connection"
  | "data"
  | "controls"
  | "about";
```

2. Zmień `items: string[]` na `items?: string[]` w typie taba wewnątrz `KalamburyHubContent`:
```ts
tabs: Array<{
  id: KalamburyHubSettingsTabId;
  label: string;
  icon: KalamburySymbolName;
  title: string;
  description: string;
  items?: string[];  // ← opcjonalne
}>;
```

3. Dodaj nowy wpis w `settingsTabs` po elemencie `"animations"` (indeks 1), przed `"data"`:
```ts
{
  id: "connection",
  label: "Połączenie",
  icon: "wifi",
  title: "Tryb połączenia",
  description: "Wybierz sposób w jaki urządzenia łączą się podczas rozgrywki.",
  // Pole `items` celowo pominięte — jest teraz opcjonalne.
  // HostApp.tsx renderuje ConnectionModePanel dla tego taba zamiast listy items.
},
```

- [ ] **Step 2: Uruchom testy manifestu**

```bash
pnpm --filter @project-party/game-kalambury test
```
Oczekiwane: wszystkie passing (istniejące testy manifestu nie powinny się posypać).

- [ ] **Step 3: Commit**

```bash
git add games/kalambury/src/manifest/hub-content.ts
git commit -m "feat(kalambury): add connection tab to hub settings"
```

---

### Task 10: ConnectionModePanel — UI wyboru trybu

**Files:**
- Create: `games/kalambury/src/host/ConnectionModePanel.tsx`

- [ ] **Step 1: Utwórz ConnectionModePanel**

```tsx
// games/kalambury/src/host/ConnectionModePanel.tsx
import { useState } from "react";
import type { KalamburyTransportMode } from "../transport/types";
import {
  getTransportMode,
  setTransportMode,
} from "../transport/index";

type ModeOption = {
  id: KalamburyTransportMode;
  label: string;
  description: string;
  icon: string;
};

const MODE_OPTIONS: ModeOption[] = [
  {
    id: "do-ws",
    label: "DO + WebSocket",
    description: "Produkcyjny, najszybszy",
    icon: "bolt",
  },
  {
    id: "firebase",
    label: "Firebase",
    description: "Alternatywa, działa globalnie",
    icon: "cloud",
  },
  {
    id: "broadcast",
    label: "Broadcast Channel",
    description: "Lokalnie, jedno urządzenie",
    icon: "devices",
  },
];

export function ConnectionModePanel() {
  const [selected, setSelected] = useState<KalamburyTransportMode>(
    getTransportMode,
  );

  function handleSelect(mode: KalamburyTransportMode) {
    setSelected(mode);
    setTransportMode(mode);
  }

  return (
    <div className="kal-hub-connection-panel">
      <ul className="kal-hub-connection-panel__list">
        {MODE_OPTIONS.map((option) => {
          const isActive = selected === option.id;
          return (
            <li key={option.id}>
              <button
                type="button"
                className={
                  isActive
                    ? "kal-hub-connection-panel__option kal-hub-connection-panel__option--active"
                    : "kal-hub-connection-panel__option"
                }
                aria-pressed={isActive}
                onClick={() => handleSelect(option.id)}
              >
                <span
                  className="material-symbols-outlined kal-hub-connection-panel__icon"
                  aria-hidden="true"
                >
                  {option.icon}
                </span>
                <span className="kal-hub-connection-panel__content">
                  <span className="kal-hub-connection-panel__label">
                    {option.label}
                  </span>
                  <span className="kal-hub-connection-panel__desc">
                    {option.description}
                  </span>
                </span>
                {isActive && (
                  <span
                    className="material-symbols-outlined kal-hub-connection-panel__check"
                    aria-hidden="true"
                  >
                    check_circle
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Sprawdź typecheck**

```bash
pnpm --filter @project-party/game-kalambury typecheck
```
Oczekiwane: brak błędów.

- [ ] **Step 3: Commit**

```bash
git add games/kalambury/src/host/ConnectionModePanel.tsx
git commit -m "feat(kalambury): add ConnectionModePanel UI component"
```

---

### Task 11: Podłącz ConnectionModePanel w HostApp.tsx

**Files:**
- Modify: `games/kalambury/src/host/HostApp.tsx`

- [ ] **Step 1: Dodaj import ConnectionModePanel**

Na górze `HostApp.tsx`, po istniejących importach z `./PlayScreen` i `./SetupScreen`:

```ts
import { ConnectionModePanel } from "./ConnectionModePanel";
```

- [ ] **Step 2: Zastąp generyczną listę items dla taba "connection"**

W `HostApp.tsx` znajdź fragment renderujący zawartość taba ustawień (linia ~367):

```tsx
<ul className="kal-hub-settings__list">
  {selectedSettingsTab.items.map((item) => (
    <li key={item}>{item}</li>
  ))}
</ul>
```

Zastąp:

```tsx
{selectedSettingsTab.id === "connection" ? (
  <ConnectionModePanel />
) : (
  <ul className="kal-hub-settings__list">
    {selectedSettingsTab.items?.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
)}
```

- [ ] **Step 3: Uruchom typecheck i testy**

```bash
pnpm --filter @project-party/game-kalambury typecheck
pnpm --filter @project-party/game-kalambury test
```
Oczekiwane: brak błędów, wszystkie testy passing.

- [ ] **Step 4: Commit**

```bash
git add games/kalambury/src/host/HostApp.tsx
git commit -m "feat(kalambury): render ConnectionModePanel in settings hub"
```

---

## Chunk 6: Style CSS i weryfikacja końcowa

### Task 12: Style dla ConnectionModePanel

**Files:**
- Modify: `games/kalambury/src/styles.css`

- [ ] **Step 1: Dodaj style dla ConnectionModePanel na końcu pliku styles.css**

```css
/* ─── Connection Mode Panel ─────────────────────────────────────────────── */

.kal-hub-connection-panel {
  width: 100%;
}

.kal-hub-connection-panel__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kal-hub-connection-panel__option {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s, border-color 0.15s;
  color: #e4e4e7;
}

.kal-hub-connection-panel__option:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.16);
}

.kal-hub-connection-panel__option--active {
  background: rgba(124, 58, 237, 0.15);
  border-color: rgba(124, 58, 237, 0.5);
}

.kal-hub-connection-panel__icon {
  font-size: 22px;
  color: #a1a1aa;
  flex-shrink: 0;
}

.kal-hub-connection-panel__option--active .kal-hub-connection-panel__icon {
  color: #a78bfa;
}

.kal-hub-connection-panel__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.kal-hub-connection-panel__label {
  font-size: 14px;
  font-weight: 600;
  color: #f4f4f5;
}

.kal-hub-connection-panel__desc {
  font-size: 12px;
  color: #71717a;
}

.kal-hub-connection-panel__check {
  font-size: 20px;
  color: #a78bfa;
  flex-shrink: 0;
}
```

- [ ] **Step 2: Uruchom dev server i sprawdź wizualnie**

```bash
pnpm dev
```
Otwórz `http://localhost:5173`, wejdź w Kalambury → Ustawienia → Połączenie. Sprawdź czy:
- Tab "Połączenie" pojawia się po "Animacje", przed "Dane"
- Trzy opcje renderują się poprawnie
- Kliknięcie zmienia zaznaczenie
- Po odświeżeniu strony wybór jest pamiętany

- [ ] **Step 3: Commit**

```bash
git add games/kalambury/src/styles.css
git commit -m "feat(kalambury): add CSS styles for ConnectionModePanel"
```

---

### Task 13: Weryfikacja końcowa

- [ ] **Step 1: Uruchom wszystkie testy kalambury**

```bash
pnpm --filter @project-party/game-kalambury test
```
Oczekiwane: wszystkie passing, zero failing.

- [ ] **Step 2: Uruchom typecheck całego repo**

```bash
pnpm typecheck
```
Oczekiwane: brak błędów TypeScript.

- [ ] **Step 3: Uruchom lint**

```bash
pnpm lint
```
Oczekiwane: brak błędów Biome.

- [ ] **Step 4: Ostateczny commit**

```bash
git add -A
git commit -m "feat(kalambury): transport mode selection complete"
```

---

## Notatki dla implementatora

### Firebase — wymagane przed uruchomieniem trybu Firebase
1. Utwórz projekt Firebase na https://console.firebase.google.com
2. Włącz Realtime Database
3. Ustaw reguły RTDB (development):
   ```json
   { "rules": { ".read": true, ".write": true } }
   ```
4. Skopiuj credentials do `apps/web/.env.local`:
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_DATABASE_URL=...
   VITE_FIREBASE_PROJECT_ID=...
   ```
5. Przed deployem produkcyjnym: zawęź reguły RTDB do `/sessions/$sessionCode`

### Jak uruchamiać testy
```bash
# Tylko kalambury
pnpm --filter @project-party/game-kalambury test

# Cały repo
pnpm test

# TypeScript
pnpm typecheck
```

### Skrypt testowy kalambury
Skrypt `test` w `package.json` kalambury jest aktualizowany w Task 0 (przed wszystkimi innymi taskami) — dodaje glob `src/transport/*.test.ts`.
