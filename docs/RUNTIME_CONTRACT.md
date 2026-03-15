# RUNTIME_CONTRACT.md

## Cel runtime contractu

Runtime contract istnieje po to, aby **hub mógł uruchamiać bardzo różne gry jednym wspólnym mechanizmem**, bez wchodzenia w ich wewnętrzne zasady.

## Lifecycle wysokiego poziomu

```text
discover -> configure -> create-session -> join -> launch -> play -> end -> teardown
```

### `discover`
Hub pokazuje katalog gier.

### `configure`
Platforma zbiera minimalną konfigurację potrzebną do utworzenia sesji.

Docelowy setup flow może pozostać po stronie modułu gry i zostać wyrenderowany już po wejściu do runtime.

### `create-session`
Platforma tworzy sesję i uzyskuje `sessionId` / `sessionCode`.

### `join`
Dołączają odpowiednie role i urządzenia.

### `launch`
Hub ładuje moduł gry i wywołuje `createRuntime(context)`.

### `play`
Pełna kontrola należy do modułu gry.

### `end`
Gra raportuje wynik końcowy i opcjonalne statystyki.

### `teardown`
Gra czyści zasoby, subskrypcje i timery.

## GameRuntimeContext

```ts
type GameRuntimeContext = {
  sessionId: string;
  sessionCode?: string;
  gameId: string;
  role: "host" | "player" | "controller" | "viewer";
  device: "tv" | "desktop" | "tablet" | "phone";
  config: Record<string, unknown>;
  players: Array<{
    id: string;
    name: string;
    role?: string;
    isConnected?: boolean;
  }>;
  transport: {
    send: (event: string, payload?: unknown) => Promise<void> | void;
    on: (event: string, handler: (payload: unknown) => void) => () => void;
  };
  storage: {
    get: <T>(key: string) => T | null | Promise<T | null>;
    set: <T>(key: string, value: T) => void | Promise<void>;
  };
  ui: {
    mount: (node: unknown) => void;
    unmount: () => void;
  };
};
```

## Transport model

Pole `transport` opisuje wspólny interfejs komunikacji runtime, a nie jedną sztywną technologię backendową.

To oznacza:
- produkcja może mapować `transport` na Cloudflare Workers + Durable Objects,
- lokalny development może mapować `transport` na prostszy mechanizm, np. `BroadcastChannel`,
- web layer może być serwowana przez osobnego Cloudflare Workera, bez zmiany kontraktu gry,
- kontrakt runtime pozostaje stabilny nawet jeśli infrastruktura transportu zmienia się między local i production.

## Co runtime contract robi

- daje wspólny język startu gry,
- oddziela hub od logiki gry,
- pozwala na wiele modeli urządzeń,
- daje grze kanał storage niezależny od `window.localStorage/sessionStorage`,
- pozwala grze przejąć własny setup i host/controller flow po starcie runtime,
- nie wymusza jednego modelu scoringu ani state machine,
- nie wymusza jednej implementacji transportu sesji.

## Czego runtime contract nie robi

- nie definiuje rund gry,
- nie definiuje punktacji gry,
- nie definiuje stage flow gry,
- nie definiuje uniwersalnego lobby gameplayowego dla każdej gry,
- nie wymaga, aby każda gra lub każdy build działał wyłącznie przez Durable Objects.
