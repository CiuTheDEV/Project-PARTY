# CLOUDFLARE_GAME_DEPLOY.md

## Cel

Nowa gra ma działać:
- lokalnie z fallbackiem `BroadcastChannel`
- produkcyjnie przez `apps/worker` + Durable Objects + WebSocket
- bez przenoszenia logiki gameplayu do platformy

## Zasada

Platforma utrzymuje tylko:
- session lifecycle
- participants snapshot
- session event log / transport (HTTP + WebSocket)

Gra utrzymuje:
- własne eventy runtime
- własny pairing / controller flow
- własną logikę ekranu hosta i telefonu

---

## 1. Dodaj grę normalnie do repo

W `games/<game-id>/`:
- `src/index.ts`
- `src/runtime/createRuntime.ts`
- host/controller screens
- local game bridge albo adapter runtime
- `package.json`
- rejestracja w `apps/web/src/lib/gameRegistry.ts`

## 2. Nie gadaj bezpośrednio z Durable Object z poziomu gry

Gra nie powinna znać:
- `wrangler`
- `SESSIONS`
- endpointów DO
- Cloudflare-specific storage API

Gra ma używać tylko `context.transport` z runtime contractu.

## 3. Eventy gry wysyłaj przez `context.transport`

W runtime gry:
- host i controller publikują eventy przez `context.transport.send(...)`
- nasłuchują przez `context.transport.on(...)`

Przykład:

```ts
context.transport.send("my-game.controller-ready", {
  deviceId,
  role: "controller",
});

const unsubscribe = context.transport.on(
  "my-game.controller-ready",
  (payload) => {
    // update host UI
  },
);
```

## 4. Zachowaj fallback `BroadcastChannel`

Jeśli gra ma istniejący local bridge:
- zostaw go jako fallback local/dev
- primary path w produkcji prowadź przez `context.transport`

Dobra praktyka:
- bridge gry przyjmuje abstrakcyjny channel/transport
- `BroadcastChannel` jest tylko jedną z implementacji
- runtime może podać transport z platformy

## 5. Session state w worker ma zostać platformowe

W `packages/types/src/session.ts` trzymaj tylko rzeczy wspólne:
- `SessionRecord`
- `participants`
- `SessionTransportEvent`

Nie wrzucaj tam:
- rund gry
- punktacji
- stage flow
- danych specyficznych dla jednej gry

## 6. Durable Object trzyma stan sesji, nie logikę gry

W `apps/worker/src/durable-object.ts`:
- zapis snapshotu sesji
- zapis participants
- zapis event logu
- odczyt eventów po offset
- WebSocket connections (broadcast do podłączonych klientów)

DO nie powinien znać semantyki eventów gry poza tym, że je przechowuje i oddaje.

## 7. Transport: WebSocket + HTTP fallback

Platforma używa WebSocket jako primary transport (zero pollingu po połączeniu).
Klienci łączą się bezpośrednio do API workera przez `wss://`.

### Jak to działa

```
Klient → wss://project-party-api.*.workers.dev/api/sessions/:code/ws → DO
```

Po połączeniu WS:
- eventy są pushowane natychmiast przez DO broadcast
- latency ~50-100ms RTT

Gdy WS nie jest gotowy (handshake, reconnect):
- transport falluje na HTTP polling co 1500ms automatycznie
- po reconnect WS polling zatrzymuje się

### Dlaczego klient łączy się bezpośrednio do API workera

WebSocket upgrade **nie przechodzi przez Service Binding** między web workerem a API workerem.
Klient musi połączyć się bezpośrednio do `project-party-api`.

Adres WS pochodzi z `VITE_API_BASE` w `apps/web/.env.production`:

```
VITE_API_BASE=https://project-party-api.ciu-ciubiczys.workers.dev
```

Lokalnie (`VITE_API_BASE` jest puste) — WS próbuje się połączyć do `localhost`, nie działa, transport falluje na poll + BroadcastChannel. To oczekiwane zachowanie.

## 8. Endpointy platformy, z których korzysta web

Nowa gra korzysta z istniejących wzorców:
- `POST /api/sessions`
- `GET /api/sessions/:code`
- `POST /api/sessions/join`
- `POST /api/sessions/:code/events`
- `GET /api/sessions/:code/events?after=<offset>`
- `GET /api/sessions/:code/ws` ← WebSocket upgrade

Gra nie robi własnych cloudflare-specific endpointów, jeśli nie ma naprawdę mocnego powodu.

**Uwaga na kolejność routingu w `http.ts`:** handler `/ws` musi być przed ogólnym `GET /api/sessions/:code`, bo ten drugi jest prefixem i go przechwyci.

## 9. Jeśli potrzebujesz realtime, buduj go przez event namespaced per game

Nazewnictwo eventów:
- `kalambury.presenter`
- `tajniacy.bridge`
- `my-game.runtime`

To pozwala:
- trzymać wspólny transport platformowy
- nie mieszać eventów różnych gier
- nie budować osobnego infra per game

## 10. Deploy Cloudflare

Repo używa:
- `apps/worker/wrangler.jsonc` dla API + DO
- `apps/web/wrangler.jsonc` dla web workera i static assets

Kolejność deployu:

```powershell
pnpm --filter @project-party/web build
npx wrangler deploy --config apps/worker/wrangler.jsonc
npx wrangler deploy --config apps/web/wrangler.jsonc
```

Najpierw deploy worker API, potem web, bo web ma binding do API workera.

## 11. Gdy nowa gra potrzebuje transportu zdalnego

Checklist:
- [ ] gra używa `context.transport`
- [ ] local fallback dalej działa
- [ ] event names są namespaced
- [ ] host/controller nie zależą wyłącznie od `BroadcastChannel`
- [ ] testy obejmują local i remote path
- [ ] docs są zaktualizowane, jeśli rozszerzasz kontrakt platformy

## 12. Minimalna walidacja przed deployem

Uruchom:

```powershell
pnpm --filter @project-party/worker test
pnpm --filter @project-party/web build
```

Jeśli gra ma własny bridge/testy:

```powershell
node --test games/<game-id>/src/**/*.test.*
```

## 13. Smoke test po deployu

Sprawdź:
1. host tworzy sesję
2. telefon dołącza do tej samej sesji
3. host widzi presence / pairing (Network tab → WS z statusem 101 i pozostaje otwarty)
4. event gry przechodzi w obie strony z latency <200ms
5. local fallback nadal działa poza Cloudflare

## 14. Pułapka: BroadcastChannel w komponentach poza runtime

**Problem:** Gra może tworzyć bridge/channel w komponentach React (np. screen setupu), które działają **przed** lub **obok** głównego runtime. Jeśli ten komponent nie dostaje `channel` z `context.transport`, sam tworzy lokalny `BroadcastChannel` — który działa tylko w ramach tej samej przeglądarki/urządzenia.

Na Cloudflare host i telefon to różne urządzenia. Lokalny `BroadcastChannel` nigdy nie dotrze do drugiego urządzenia — więc pairing/presence nie zadziała.

**Wzorzec do stosowania:** Każdy komponent gry, który potrzebuje cross-device komunikacji, musi przyjmować `channel` jako prop i nie tworzyć własnego BroadcastChannel gdy channel jest dostępny:

```ts
// W createRuntime.ts — twórz channel z context.transport
const presenterChannel = createPresenterTransportChannel(context);

// Przekaż go przez drzewo komponentów
context.ui.mount(
  createElement(MyHostApp, {
    transportChannel: presenterChannel,
    ...
  })
);
```

```tsx
// W MyHostApp.tsx — przekaż dalej do sub-komponentów
<SetupScreen
  channel={transportChannel}   // ← nie pomiń tego!
  sessionCode={sessionCode}
  ...
/>
```

```ts
// W bridge gry — używaj przekazanego channel, nie twórz nowego
const bridge = createMyGameHostBridge(sessionCode, {
  channel,   // ← gdy undefined, fallback na BroadcastChannel (local dev only)
  ...
});
```

**Checklist:**
- [ ] Każdy ekran hosta/kontrolera który tworzy bridge → przyjmuje `channel` jako prop
- [ ] `createRuntime` przekazuje `presenterTransportChannel` do każdego takiego ekranu
- [ ] Bridge/channel wrapper nie tworzy `BroadcastChannel` gdy `options.channel` jest podany

## 15. Pułapka: persystowanie pairedDeviceId między sesjami

**Problem:** Jeśli bridge hosta zapisuje `pairedDeviceId` w storage i odczytuje go przy starcie, a stary telefon nie odpowie na `host-probe` — host odrzuci każde nowe urządzenie jako `host-rejected`.

**Zasada:** `pairedDeviceId` i wszelki **stan aktywnego połączenia** nie powinien być persistowany w storage. Pairing nawiązuje się na świeżo przy każdym otwarciu sesji.

Co można persistować:
- ustawienia gry (tryb, kategorie, gracze)
- preferencje hosta (czy presenter device jest włączony)

Czego **nie** persistować:
- `pairedDeviceId`
- `isConnected`
- cokolwiek co opisuje aktywne połączenie między urządzeniami

```ts
// ŹLE — zapisujesz stan połączenia
await storage.setItem("setup-draft", JSON.stringify({
  presenterDeviceEnabled: true,
  pairedPresenterDeviceId: "presenter-abc123",  // ← tego nie zapisuj
}));

// DOBRZE — zapisujesz tylko preferencje
await storage.setItem("setup-draft", JSON.stringify({
  presenterDeviceEnabled: true,
  // pairedPresenterDeviceId — nie zapisuj
}));
```

Przy ładowaniu draftu zawsze inicjalizuj `pairedDeviceId` jako `null`.
