# GAME_MODULE_STANDARD.md

Ten dokument definiuje **obowiązkowy kontrakt integracyjny** modułu gry.

## Cel

Hub ma móc:
- wyświetlić grę na liście,
- utworzyć sesję,
- uruchomić grę,
- przekazać runtime context.

Bez znajomości wewnętrznej logiki gry.

## Wymagane eksporty modułu gry

Każda gra musi eksportować domyślnie wynik `defineGame(...)`.

Minimalny kontrakt:

```ts
export default defineGame({
  id: "kalambury",
  version: "0.1.0",
  meta: { ... },
  capabilities: { ... },
  settings: { ... },
  createRuntime,
});
```

## Wymagane pola

### `id`
Unikalny identyfikator gry.

### `version`
Wersja modułu gry.

### `meta`
Metadata potrzebne hubowi:
- `name`
- `shortDescription`
- `status`
- `tags`
- `deviceProfiles`
- `playerCount`
- `coverImage`

### `capabilities`
Deklaracja, co gra wspiera:
- profile urządzeń,
- role,
- tryby lokalne / sieciowe,
- wsparcie dla telefonów.

### `settings`
Schemat konfiguracji potrzebny platformie do utworzenia sesji i uruchomienia gry.

Nie oznacza to, że platforma musi posiadać docelowy setup UI tej gry.
Gra może przejąć własny setup flow już po wejściu do runtime.

### `createRuntime`
Funkcja tworząca runtime gry po uruchomieniu sesji.

## Zalecana struktura katalogów gry

```text
games/<game-id>/
├─ src/
│  ├─ index.ts
│  ├─ meta.ts
│  ├─ settings.ts
│  ├─ runtime/
│  │  ├─ createRuntime.ts
│  │  ├─ events.ts
│  │  └─ state-machine.ts
│  ├─ host/
│  ├─ controller/
│  ├─ shared/
│  └─ assets/
├─ package.json
├─ tsconfig.json
└─ README.md
```

Nie wszystkie katalogi są obowiązkowe.
Nie rób folderowego cosplayu, jeśli gra ich realnie nie potrzebuje.

## Zasady

- Gra trzyma własną logikę i własny stan.
- Gra nie przecieka semantyką do `packages/*`.
- Gra nie oczekuje, że hub zna jej etapy.
- Gra nie zakłada istnienia globalnego gameplay engine.
- Docelowy setup flow konkretnej gry pozostaje w module gry, jeśli jest game-specific.

## Definition of done dla nowej gry

Nowa gra jest gotowa do integracji, gdy:
- ma kompletne metadata,
- ma settings schema,
- implementuje `createRuntime`,
- jest zarejestrowana w launcherze,
- nie wymaga zmian w platformie specyficznych tylko dla siebie.
