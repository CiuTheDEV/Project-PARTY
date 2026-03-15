# PROJECT_CONTEXT.md

## Czym jest Project Party

Project Party to **platforma gier imprezowych w przeglądarce**.

To nie jest:
- jedna gra z przyklejonym menu,
- jeden uniwersalny silnik gameplayu,
- jeden globalny model sesji dla wszystkich gier.

To jest:
- jeden hub,
- wiele osobnych modułów gier,
- wspólny język wizualny,
- lekki kontrakt integracyjny między hubem a grami.

## Model produktu

Użytkownik:
1. wchodzi na stronę,
2. widzi katalog gier,
3. wybiera grę,
4. konfiguruje ją,
5. uruchamia sesję,
6. gra na urządzeniu lub urządzeniach wymaganych przez daną grę.

## Filozofia platformy

Platforma jest odpowiedzialna za:
- hub,
- odkrywanie gier,
- routing platformy,
- spójny branding,
- wspólne komponenty UI,
- uruchomienie modułu gry,
- podstawową infrastrukturę sesji.

Platforma nie jest odpowiedzialna za:
- reguły konkretnej gry,
- scoring konkretnej gry,
- internal state machine konkretnej gry,
- narzucanie jednego flow rozgrywki wszystkim grom.

## Filozofia modułów gier

Każda gra jest osobnym modułem.

Każda gra może definiować własne:
- tryby,
- setup flow,
- model urządzeń,
- role uczestników,
- wymagania realtime,
- lifecycle sesji,
- źródło prawdy dla stanu.

Przykłady obsługiwanych modeli:
- jeden ekran,
- host + telefony,
- tylko telefony.

Ta zmienność jest celowa i architektura ma ją wspierać.

## MVP

Na start Project Party ma dowieźć:
- premium-feeling hub,
- szybkie wejście do gry,
- minimum jedną dobrze działającą grę referencyjną,
- architekturę gotową pod kolejne moduły,
- brak obowiązkowych kont.

## Kierunek repo

Repo jest monorepo i powinno rosnąć bez przeistaczania się w gameplay monolit.

Docelowe warstwy:
- `apps/web` — hub + runtime launchera,
- `apps/worker` — backend / session API / realtime helpers,
- `games/*` — gry jako osobne moduły,
- `packages/*` — współdzielone biblioteki.

## Stan po migracji

Stan referencyjny na dziś:
- hub platformy działa w `apps/web`,
- session API działa w `apps/worker`,
- Kalambury są wydzielonym modułem w `games/kalambury`,
- `_legacy/old-repo` nie jest już potrzebne do codziennego developmentu i pozostaje archiwum.
