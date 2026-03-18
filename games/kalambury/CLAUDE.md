# CLAUDE.md — Kalambury

This file provides guidance to Claude Code (claude.ai/code) when working with this game module.

## Czym jest Kalambury

Gra imprezowa typu "kalambury" — jeden prezenter odgrywa hasło (nie może mówić), reszta zgaduje. Flow:

1. Host konfiguruje graczy, kategorie, tryb gry (Setup)
2. Start → losowanie kolejności prezenterów (LOSOWANIE)
3. Dla każdej tury: prezenter dostaje hasło na podgląd 10s (PRZYGOTOWANIE), potem zespół zgaduje z timerem (ACT)
4. Po turze: kto zgadł, punkty (SCORE) → następna tura lub runda
5. Koniec gry po N rundach lub gdy ktoś osiągnie target punktowy (FINISHED)

Opcjonalnie: prezenter może grać na telefonie — wtedy dostaje hasło tylko na swoim ekranie.

---

## Mapa folderów

```
src/
├── runtime/          # Punkt wejścia gry i cała logika stanu
├── transport/        # Trzy adaptery transportu (broadcast/do-ws/firebase)
├── shared/
│   ├── presenter/    # Bridge host↔controller (protokół parowania telefonu)
│   └── *.ts          # Setup state, storage, UI utils, typy słów
├── manifest/         # Treści widoczne w hubie (opis trybów, zakładki)
├── settings/         # Stałe konfiguracyjne (np. czas podglądu hasła)
├── host/
│   ├── components/   # Komponenty per faza gry (DrawSequence, ActPhase, itd.)
│   ├── hooks/        # usePresenterHostBridge — główny hook prezenterski
│   ├── modals/       # AddPlayerModal, ModeSettingsModal, PresenterQrModal
│   └── sections/     # Sekcje SetupScreen (PlayersPanel, CategoriesPanel, itd.)
├── controller/       # Cały UI telefonu-prezentera (jeden plik: ControllerApp.tsx)
└── assets/           # SVG ilustracje dla trybów gry
```

### Co gdzie siedzi

| Folder/Plik | Co konkretnie znajdziesz |
|---|---|
| `runtime/state-machine.ts` | Wszystkie typy stanu + czyste funkcje przejść (createKalamburyPlayState, resolveKalamburyScore, itp.) |
| `runtime/createRuntime.ts` | Montowanie UI wg roli, wybór transportu, tworzenie kanału prezentera |
| `transport/` | Trzy niezależne implementacje za wspólnym interfejsem `KalamburyTransport` |
| `shared/setup-content.ts` | Katalog awatarów, domyślni gracze, kategorie, helpery do edycji setupu |
| `shared/setup-storage.ts` | Persystencja draftu setupu do storage (auto-save po każdej zmianie) |
| `shared/presenter/types.ts` | Kompletna lista wiadomości protokołu host↔controller |
| `shared/presenter/host-bridge.ts` | Logika parowania, heartbeat, timeout, obsługa reconnect po stronie hosta |
| `shared/presenter/controller-bridge.ts` | Ogłaszanie gotowości co 1.2s, odpowiedzi na pinga, obsługa faz podglądu |
| `host/hooks/usePresenterHostBridge.ts` | React wrapper nad host-bridge; zwraca stabilny handle bez null-checków |
| `host/PlayScreen.tsx` | Master komponent gameplayu — renderuje fazę, ticker timera, obsługę score |
| `host/SetupScreen.tsx` | Konfiguracja graczy + kategorii + trybu + urządzenia prezentera |

---

## Kluczowe pliki

| Plik | Po co |
|---|---|
| `src/index.ts` | Eksport `GameDefinition` — jedyny publiczny kontrakt z hubem |
| `src/runtime/state-machine.ts` | "Mózg" gry: typy, stałe, czyste funkcje przejść stanów |
| `src/runtime/createRuntime.ts` | Inicjalizacja transportu, montowanie UI wg roli (host vs controller) |
| `src/transport/index.ts` | Fabryka transportu — czyta tryb z localStorage, zwraca odpowiedni adapter |
| `src/shared/presenter/host-bridge.ts` | Pełna logika parowania telefonu-prezentera |
| `src/host/PlayScreen.tsx` | Gameplay loop — ticker, fazy, scoring, reroll, reconnect overlay |

---

## Konwencje

### Stan gry

State machine jest **czysta** — żadnych side effectów, żadnego Reacta, żadnych importów platformowych. Wszystkie przejścia to funkcje `(state, payload) => newState`. Testuj je bez przeglądarki.

Fazy (`KalamburyRoundStage`):
```
LOSOWANIE → KOLEJNOSC → PRZYGOTOWANIE → ACT → SCORE → [LOSOWANIE | FINISHED]
```

### Transport

Tryb przechowywany w `localStorage("kalambury:transport-mode")`. Można nadpisać URL-param `?transport=broadcast|do-ws|firebase` — auto-zapisuje się do localStorage (użyteczne przy QR code).

| Tryb | Gdzie działa |
|---|---|
| `broadcast` | Tylko lokalne, jedno urządzenie, bez sieci |
| `do-ws` | Produkcja — wrapper na `context.transport` (Durable Objects) |
| `firebase` | Fallback — Firebase RTDB, lazy-loaded |

Transport `do-ws` **nie woła `destroy()`** — nie jest jego własnością, pochodzi z platformy.

### Presenter bridge

Osobny `BroadcastChannel` o nazwie `project-party.kalambury.presenter.{SESSION_CODE}` — niezależny od głównego transportu gry. Działa **tylko w tej samej przeglądarce/originie** (lokalnie i w Cloudflare tylko na tym samym urządzeniu co host).

Host wysyła `host-ping` co 4s. Controller odpowiada `controller-pong`. Jeśli brak pongu przez 8s → host uznaje rozłączenie.

Controller ogłasza `controller-ready` co 1.2s dopóki nie zostanie sparowany. Pierwsze zgłoszenie wygrywa, kolejne dostają `host-rejected`.

### Persystencja

Setup (gracze, kategorie, ustawienia trybu) auto-persystuje do `{storageKey}.draft`. Ładuje przy starcie. Jeśli JSON jest uszkodzony — graceful fallback do defaults.

`deviceId` kontrolera persystuje w `localStorage` — ten sam telefon reconnectuje z tym samym ID.

### Hasła

Hasła są hard-coded w `phraseCatalog` w `state-machine.ts`. Wybór jest deterministyczny: `(roundNumber + turnInRound) % categories.length`. Ten sam seed → to samo hasło. Pozwala testować offline.

---

## Pułapki i ważne uwagi

**`pairedDeviceId` nie może być persystowany między sesjami.**
Jeśli zapisasz `pairedDeviceId` do storage i załadujesz przy starcie hosta — host wyśle `host-probe`, stary telefon nie odpowie, ale zablokuje nowe połączenia przez cały timeout. Wynik: każdy nowy telefon dostaje "Miejsce zajęte". Fix: zawsze inicjalizuj `pairedDeviceId: null` przy ładowaniu draftu.

**Kolejność handlerów w `apps/worker/src/http.ts` ma znaczenie.**
Handler `GET /api/sessions/:code` musi być **za** handlerem WebSocket (`/ws`). Jeśli jest przed, przechwytuje upgrade request i WS nigdy nie dochodzi do DO. Symptom: WebSocket w DevTools pokazuje 0,0 kB i status "Zakończone".

**`do-ws` transport nie tworzy własnego połączenia.**
To tylko cienki wrapper delegujący do `context.transport` przekazanego przez platformę. Nie volaj `destroy()` na nim — nie jest własnością gry.

**Firebase transport jest lazy-loaded.**
Moduł `firebase.ts` inicjalizuje się tylko gdy mode=`firebase`. Jeśli zmieniasz konfigurację Firebase, uruchom tryb firebase wprost zanim uznasz że działa.

**Tryb zespołowy (`teamsEnabled`) jest stub.**
Istnieje w settings schema i setup UI, ale gameplay go nie implementuje. Nie zakładaj że działa — to future work.

**Round events są wyłączone.**
`KALAMBURY_ROUND_EVENTS_ENABLED = false` w state-machine.ts. Cały kod eventów (golden-points, rush) istnieje ale nigdy nie jest aktywowany. Nie usuwaj — to zaplanowany feature.

**Prezenter musi dostać `channel` jako prop do `SetupScreen`.**
Jeśli `SetupScreen` nie dostanie `transportChannel` z `createRuntime`, stworzy własny lokalny `BroadcastChannel` — który nie przejdzie między urządzeniami. Host nie zobaczy połączenia telefonu na produkcji. Patrz `createRuntime.ts` → `presenterTransportChannel`.

**`usePresenterHostBridge` zwraca stabilny handle (nie null).**
Hook nigdy nie zwraca `null` — zawsze zwraca obiekt z metodami. Metody wewnętrznie sprawdzają czy bridge istnieje. Nie dodawaj null-guard-ów w JSX.

**Parity testy (`.test.js`) to nie unit testy.**
Pliki `*-parity.test.js` w `host/` weryfikują że struktura kodu (importy, eksporty, props, klasy CSS) nie rozjechała się z oczekiwaniami. Mogą failować po refactorze nawet gdy logika jest poprawna — aktualizuj je świadomie.
