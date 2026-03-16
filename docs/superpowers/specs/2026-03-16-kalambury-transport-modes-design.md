# Design: Kalambury — Tryb Połączenia (Multi-Transport Support)

**Data:** 2026-03-16
**Zakres:** `games/kalambury` tylko
**Status:** Zatwierdzone przez użytkownika

---

## Problem

Platforma Project Party używa Cloudflare Durable Objects + WebSocket jako jedynego transportu produkcyjnego. Gdy DO wyczerpie limity lub wystąpią inne awarie, nie ma fallbacku. Potrzebna jest możliwość przełączenia na alternatywny transport bez zmiany kodu gry.

---

## Cel

Dodać w Kalambury wybór trybu połączenia (Firebase RTDB / DO+WS / BroadcastChannel) jako globalne ustawienie użytkownika, persystowane w localStorage. Wybór wpływa na transport używany przez runtime Kalambury.

---

## Decyzje projektowe

| Pytanie | Decyzja |
|---|---|
| Gdzie UI? | Tab "Tryb połączenia" w panelu Ustawienia gry, po "Animacje", przed "Dane" |
| Gdzie logika? | Wyłącznie w `games/kalambury/src/transport/` — platforma nic nie wie |
| Jaki Firebase? | Realtime Database (nie Firestore) — prostszy, tańszy dla event streamingu |
| Co zastępuje Firebase? | Tylko transport (send/on) — nie storage sesji |
| Credentials Firebase? | Zmienne środowiskowe Vite (`VITE_FIREBASE_*`) |
| Domyślny tryb? | `do-ws` |
| Kolejność w UI? | DO + WebSocket → Firebase → Broadcast Channel |
| Persystencja? | `localStorage`, klucz `kalambury:transport-mode` |

---

## Architektura

### Nowe pliki

```
games/kalambury/src/
  transport/
    index.ts              # createKalamburyTransport(mode, sessionCode) — fabryka
    types.ts              # KalamburyTransportMode, KalamburyTransport interface
    broadcast.ts          # BroadcastChannel adapter
    do-ws.ts              # DO + WebSocket adapter (deleguje do session-transport)
    firebase.ts           # Firebase RTDB adapter
    transport-storage.ts  # getTransportMode() / setTransportMode() — localStorage
  host/
    ConnectionModePanel.tsx  # Nowy — zawartość taba "Tryb połączenia" w ustawieniach
```

### Zmodyfikowane pliki

```
games/kalambury/src/manifest/hub-content.ts   # Nowy tab "connection"
games/kalambury/src/host/HostApp.tsx           # Render ConnectionModePanel dla taba connection
games/kalambury/src/runtime/create-runtime.ts # Użycie createKalamburyTransport zamiast context.transport
```

---

## Interfejsy

```ts
// transport/types.ts

export type KalamburyTransportMode = "firebase" | "do-ws" | "broadcast"

export interface KalamburyTransport {
  send: (event: string, payload?: unknown) => Promise<void> | void  // zgodny z GameRuntimeContext["transport"]["send"]
  on: (event: string, handler: (payload: unknown) => void) => () => void
  destroy: () => void
}
```

---

## Adaptery

### `broadcast.ts`
- Natywny `BroadcastChannel` nazwany po `sessionCode`
- `send`: serializuje do JSON i postuje na kanale
- `on`: nasłuchuje `message`, deserializuje, filtruje po `event`
- `destroy`: `channel.close()`

### `do-ws.ts`
- **Nie importuje z `apps/`** — game modules nigdy nie importują z platform app layer
- Otrzymuje `context.transport` jako argument i opakowuje go w `KalamburyTransport` interface
- `context.transport` jest już transportem DO+WS w produkcji — zero duplikacji logiki
- Sygnatura fabryki dla tego adaptera: `createDoWsAdapter(transport: GameRuntimeContext["transport"]): KalamburyTransport`

### `firebase.ts`
- Lazy init: `initializeApp` tylko gdy tryb = firebase
- Credentials z `import.meta.env.VITE_FIREBASE_*`
- Struktura RTDB: `/sessions/{sessionCode}/events/{pushId}` → `{ event, payload, createdAt }`
- `send`: `push()` nowego eventu — błędy sieciowe logowane przez `console.error` (nie rzucane, nie przerywają gry)
- `on`: `onChildAdded()` z filtrem `createdAt >= joinTimestamp` (nie odtwarza historii)
- `destroy`: `off()` na listenerach + opcjonalne czyszczenie starych eventów

### `transport-storage.ts`
```ts
const KEY = "kalambury:transport-mode"
const DEFAULT: KalamburyTransportMode = "do-ws"

export function getTransportMode(): KalamburyTransportMode
export function setTransportMode(mode: KalamburyTransportMode): void
```

### `index.ts` — fabryka
```ts
export function createKalamburyTransport(
  mode: KalamburyTransportMode,
  sessionCode: string,
  contextTransport: GameRuntimeContext["transport"]
): KalamburyTransport
```
Switch po `mode`, zwraca odpowiedni adapter.

**Guard na brak `sessionCode`:** Gdy `sessionCode` jest pusty lub `undefined` i tryb = `"firebase"`, fabryka rzuca błąd (firebase wymaga sessionCode do ścieżki RTDB). W takiej sytuacji runtime powinien fallbackować do `"broadcast"` lub uniemożliwić uruchomienie.

---

## UI — Tab "Tryb połączenia"

### Lokalizacja
Panel Ustawienia gry → tab "Tryb połączenia" (pozycja 3, po "Animacje", przed "Dane").

### `hub-content.ts` — zmiany wymagane

1. **Rozszerzenie unii `KalamburyHubSettingsTabId`:**
```ts
export type KalamburyHubSettingsTabId =
  | "sound"
  | "animations"
  | "connection"   // ← nowe
  | "data"
  | "controls"
  | "about"
```

2. **Pole `items` w typie taba** — zmienić z `items: string[]` na `items?: string[]` (opcjonalne), aby tab "connection" mógł mieć puste `items` bez fałszywych założeń.

3. **Nowy wpis w `settingsTabs`** (pozycja 3, po "animations"):
```ts
{
  id: "connection",
  label: "Połączenie",
  icon: "wifi",       // Material Symbols — poprawna nazwa w zestawie outlined
  title: "Tryb połączenia",
  description: "Wybierz sposób w jaki urządzenia łączą się podczas rozgrywki.",
  items: []           // nieużywane — HostApp.tsx renderuje ConnectionModePanel dla tego taba
}
```

### `ConnectionModePanel.tsx`
Trzy karty radio-style:

```
┌──────────────────────────────────────────┐
│  ◉  DO + WebSocket          ← domyślny  │
│     Produkcyjny, najszybszy              │
├──────────────────────────────────────────┤
│  ○  Firebase                             │
│     Alternatywa, działa globalnie        │
├──────────────────────────────────────────┤
│  ○  Broadcast Channel                    │
│     Lokalnie, jedno urządzenie           │
└──────────────────────────────────────────┘
```

Wybór zapisywany natychmiast przez `setTransportMode()` — bez przycisku "Zapisz".

### `HostApp.tsx`
Gdy `selectedSettingsTabId === "connection"` — renderuje `<ConnectionModePanel />` zamiast generycznej listy `items`.

---

## Integracja z runtime Kalambury

W `games/kalambury/src/runtime/create-runtime.ts` (lub odpowiednik):

```ts
const mode = getTransportMode()
const sessionCode = context.sessionCode

// Guard: Firebase wymaga sessionCode — brak sessionCode = błąd, nie cichy fallback
if (mode === "firebase" && !sessionCode) {
  throw new Error(
    "Tryb Firebase wymaga aktywnej sesji sieciowej. Zmień tryb połączenia w Ustawieniach."
  )
}

const transport = createKalamburyTransport(
  mode,
  sessionCode ?? "",
  context.transport  // przekazywany do do-ws adaptera
)
// transport używany zamiast context.transport przez resztę runtime
```

Platforma (`mountRuntime.ts`) nie jest modyfikowana.

---

## Firebase — setup

1. Nowy projekt Firebase (Realtime Database)
2. Reguły RTDB — minimalna produkcyjna reguła (wymagane przed deploy):
   ```json
   {
     "rules": {
       "sessions": {
         "$sessionCode": {
           ".read": true,
           ".write": true
         }
       }
     }
   }
   ```
   Na etapie dev reguły mogą być open (`".read": true, ".write": true` na root). **Przed deployem na produkcję** reguły muszą być zawężone do ścieżki `/sessions/$sessionCode`.
3. Credentials w `.env.local`:
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_DATABASE_URL=...
   VITE_FIREBASE_PROJECT_ID=...
   ```
4. `.env.local` już jest w `.gitignore`

---

## Zależności

- `firebase` (npm) — dodana tylko do `games/kalambury/package.json`

---

## Co NIE jest w scope

- Inne gry (tajniacy) — nie dotykamy
- Platforma (`apps/web`, `apps/worker`) — nie dotykamy
- Storage sesji — zostaje w DO, Firebase zastępuje tylko transport
- Firebase Auth — nie w tym scope
- Istniejące taby Ustawień (Dźwięk, Animacje itd.) — nie dotykamy

---

## Ryzyka

| Ryzyko | Mitygacja |
|---|---|
| Firebase credentials w bundle | Reguły RTDB ograniczają nadużycia; standard dla Firebase SPA |
| Stare eventy przy reconnect Firebase | Filtr `createdAt >= joinTimestamp` w `on()` |
| Lazy init Firebase przy zmianie trybu w trakcie sesji | Transport tworzony raz przy starcie runtime, zmiana trybu działa od następnej sesji |
| `session-transport.ts` zmienia API | `do-ws.ts` adaptuje — jedna warstwa izolacji |
