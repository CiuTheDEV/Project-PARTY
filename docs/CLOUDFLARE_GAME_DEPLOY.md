# CLOUDFLARE_GAME_DEPLOY.md

## Cel

Nowa gra ma działać:
- lokalnie z fallbackiem `BroadcastChannel`
- produkcyjnie przez `apps/worker` + Durable Objects
- bez przenoszenia logiki gameplayu do platformy

## Zasada

Platforma utrzymuje tylko:
- session lifecycle
- participants snapshot
- session event log / transport

Gra utrzymuje:
- własne eventy runtime
- własny pairing / controller flow
- własną logikę ekranu hosta i telefonu

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

DO nie powinien znać semantyki eventów gry poza tym, że je przechowuje i oddaje.

## 7. Endpointy platformy, z których korzysta web

Nowa gra korzysta z istniejących wzorców:
- `POST /api/sessions`
- `GET /api/sessions/:code`
- `POST /api/sessions/join`
- `POST /api/sessions/:code/events`
- `GET /api/sessions/:code/events?after=<offset>`

Gra nie robi własnych cloudflare-specific endpointów, jeśli nie ma naprawdę mocnego powodu.

## 8. Jeśli potrzebujesz realtime, buduj go przez event namespaced per game

Nazewnictwo eventów:
- `kalambury.presenter`
- `tajniacy.bridge`
- `my-game.runtime`

To pozwala:
- trzymać wspólny transport platformowy
- nie mieszać eventów różnych gier
- nie budować osobnego infra per game

## 9. Deploy Cloudflare

Repo używa:
- `apps/worker/wrangler.jsonc` dla API + DO
- `apps/web/wrangler.jsonc` dla web workera i static assets

Najczęstsza kolejność:

```powershell
pnpm --filter @project-party/web build
npx wrangler deploy --config apps/worker/wrangler.jsonc
npx wrangler deploy --config apps/web/wrangler.jsonc
```

Najpierw deploy worker API, potem web, bo web ma binding do API workera.

## 10. Gdy nowa gra potrzebuje transportu zdalnego

Checklist:
- gra używa `context.transport`
- local fallback dalej działa
- event names są namespaced
- host/controller nie zależą wyłącznie od `BroadcastChannel`
- testy obejmują local i remote path
- docs są zaktualizowane, jeśli rozszerzasz kontrakt platformy

## 11. Minimalna walidacja przed deployem

Uruchom:

```powershell
pnpm --filter @project-party/worker test
pnpm --filter @project-party/web build
```

Jeśli gra ma własny bridge/testy:

```powershell
node --test games/<game-id>/src/**/*.test.*
```

## 12. Smoke test po deployu

Sprawdź:
1. host tworzy sesję
2. telefon dołącza do tej samej sesji
3. host widzi presence / pairing
4. event gry przechodzi w obie strony
5. local fallback nadal działa poza Cloudflare
