# TROUBLESHOOTING.md

## Common Issues

### `pnpm install` fails

Symptoms:
- workspace dependency errors
- missing local package links
- import resolution failures after adding a new package

Checklist:
- run `pnpm install` from repo root
- confirm the new package has a valid `package.json`
- confirm workspace package names use the `@project-party/*` convention

### Game not showing in hub

Symptoms:
- gra nie pojawia się w katalogu
- route istnieje, ale launch flow nie znajduje modułu

Checklist:
- czy gra została dodana do `apps/web/src/lib/gameRegistry.ts`?
- czy metadata gry nie ukrywają jej po stronie katalogu?
- czy `pnpm install` zostało uruchomione po dodaniu nowego pakietu?

### Module not found: `@project-party/...`

Symptoms:
- import error w IDE albo runtime
- TypeScript nie widzi nowego workspace package

Solution:

```powershell
pnpm install
```

Potem:
- zrestartuj TypeScript server / IDE
- sprawdź `name` w `package.json`
- sprawdź import w `apps/web/src/lib/gameRegistry.ts` albo w module gry

### Runtime nie startuje

Symptoms:
- ekran launch się ładuje, ale gra się nie mountuje
- błąd przy `createRuntime`

Checklist:
- czy `src/index.ts` eksportuje poprawny `defineGame(...)`?
- czy `createRuntime` jest podpięte do właściwego entrypointu?
- porównaj implementację z `games/kalambury/src/index.ts`
- sprawdź logi w konsoli przeglądarki

### Tests failing after adding game

Symptoms:
- typecheck errors
- missing files in test glob
- broken imports

Checklist:
- czy `tsconfig.json` w `games/<id>/` istnieje?
- czy package ma poprawne zależności?
- czy skrypt `test` w `package.json` odpowiada realnym test files?

Przykładowe komendy:

```powershell
pnpm --filter @project-party/game-my-game test
pnpm --filter @project-party/game-my-game typecheck
```

### Worker tests fail after API change

Checklist:
- sprawdź `apps/worker/src/http.test.ts`
- sprawdź `apps/worker/src/index.test.ts`
- porównaj payloady z aktualnym `apps/worker/src/http.ts`

### Shared package change causes regressions

Checklist:
- czy zmiana naprawdę powinna być w `packages/*`?
- uruchom `pnpm test`
- sprawdź `packages/shared/src/catalog.test.ts`
- sprawdź `packages/shared/src/session.test.ts`

---

## Cloudflare / produkcja

### Host nie widzi połączenia telefonu

Symptoms:
- telefon wchodzi do sesji, ale host nie pokazuje połączenia / pairingu
- działa lokalnie, nie działa na Cloudflare

Checklist:
- czy `SetupScreen` (lub inny ekran setupu) dostaje `channel` jako prop z `createRuntime`? Bez tego tworzy lokalny `BroadcastChannel` który nie przechodzi między urządzeniami
- czy `HostApp` przekazuje `transportChannel` do `SetupScreen`?
- czy `createRuntime` tworzy `presenterTransportChannel` z `context.transport` i przekazuje go do `HostApp`?

Szczegóły: `docs/CLOUDFLARE_GAME_DEPLOY.md` sekcja 14.

### "To miejsce jest już zajęte" / host-rejected mimo braku połączenia

Symptoms:
- nowy telefon dostaje ekran "zajęte" zaraz po otwarciu
- żadne urządzenie nie jest aktualnie połączone

Przyczyna:
- stary `pairedDeviceId` zapisany w storage jest ładowany przy starcie hosta
- host wysyła `host-probe`, stary telefon nie odpowiada, ale blokuje nowe połączenia dopóki nie minie timeout

Fix:
- nie persistuj `pairedDeviceId` w storage (patrz `docs/CLOUDFLARE_GAME_DEPLOY.md` sekcja 15)
- przy ładowaniu draftu zawsze inicjalizuj `pairedDeviceId: null`

### WebSocket nie łączy się (ciągle "Zakończone" w DevTools)

Symptoms:
- Network tab → WS → status "Zakończone", 0,0 kB transferu
- transport wraca na polling, latency ~1.5-3s

Możliwe przyczyny:

1. **Zła kolejność routingu w `http.ts`** — handler `GET /api/sessions/:code` przechwytuje `/ws` zanim dojdzie do właściwego handlera. Handler `/ws` musi być **przed** ogólnym handler sesji.

2. **WebSocket przez Service Binding** — web worker proxy (`env.API.fetch`) nie przepuszcza WebSocket upgrade. Klient musi łączyć się bezpośrednio do API workera. Sprawdź `VITE_API_BASE` w `apps/web/.env.production`.

3. **Brak `acceptWebSocket` w DO** — sprawdź czy `SessionDurableObject` implementuje `webSocketMessage` i `webSocketClose` (wymagane przez Hibernation API).

Weryfikacja: otwórz DevTools → Network → WS → kliknij połączenie → zakładka Headers. Kod 101 = sukces. Brak nagłówków odpowiedzi = połączenie odrzucone przed DO.

### Duże opóźnienie między hostem a telefonem na produkcji

Symptoms:
- synchronizacja działa, ale z opóźnieniem 1-3 sekund

Przyczyna:
- WebSocket nie jest aktywny → transport używa HTTP polling (domyślnie co 1500ms)
- patrz wyżej: "WebSocket nie łączy się"

Gdy WS działa poprawnie, latency powinno wynosić <200ms.
