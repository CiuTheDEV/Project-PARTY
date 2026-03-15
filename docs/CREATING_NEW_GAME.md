# CREATING_NEW_GAME.md

Ten dokument opisuje minimalny, praktyczny proces dodania nowej gry do Project Party.

## Cel

Nowa gra ma:
- pozostać autonomicznym modułem,
- wpasować się w kontrakt platformy,
- zachować spójny UX wejścia do gry,
- nie wymagać specjalnego traktowania przez hub.

## Checklist krok po kroku

1. Utwórz nowy katalog `games/<game-id>/`.
2. Dodaj `package.json`, `tsconfig.json` i `src/index.ts`.
3. Przygotuj `meta`, `settings` i `createRuntime`.
4. Zarejestruj grę w launcherze / katalogu.
5. Dodaj testy dla metadata, settings i runtime.
6. Zweryfikuj, że gra nie wymaga platformowych wyjątków tylko dla siebie.

## Obowiązkowy wspólny layout wejścia do gry

Każda nowa gra musi zachować ten sam layout UI dla:
- menu głównego gry,
- setupu gry.

Wzorzec referencyjny to aktualny układ znany z Kalambur i Tajniaków.

To, co ma być spójne:
- ogólny layout,
- hierarchia sekcji,
- rozmieszczenie kluczowych CTA,
- rytm wejścia w konfigurację i start gry.

To, co może się zmieniać per gra:
- teksty,
- konkretne opcje setupu,
- grafiki,
- ikony,
- paleta kolorystyczna i theme tokens.

To, co pozostaje po stronie gry:
- gameplay,
- scoring,
- stan rozgrywki,
- runtime flow po uruchomieniu sesji.

## Minimalna struktura

```text
games/<game-id>/
|- src/
|  |- index.ts
|  |- meta.ts
|  |- settings.ts
|  |- runtime/
|  |- host/
|  |- controller/
|  |- shared/
|  `- assets/
|- package.json
|- tsconfig.json
`- README.md
```

Nie wszystkie foldery są obowiązkowe.
Dodawaj tylko to, czego realnie potrzebuje dana gra.

## Co sprawdzić przed PR

- Czy gra eksportuje poprawny `defineGame(...)`?
- Czy metadata i settings są kompletne?
- Czy menu główne i setup zachowują wspólny layout platformy?
- Czy paleta gry jest indywidualna, ale nadal spójna z jakością Project Party?
- Czy gameplay nie wycieka do `apps/*` ani `packages/*` bez realnej potrzeby?
- Czy testy obejmują przynajmniej kontrakt integracyjny i kluczową logikę gry?
