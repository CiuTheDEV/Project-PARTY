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

## Praktyczny przykład

Poniżej znajduje się minimalny, ale realistyczny przykład modułu gry zgodnego z kontraktem:

```ts
import { z } from "zod";
import { defineGame } from "@project-party/game-runtime";

const settingsSchema = z.object({
  rounds: z.number().int().min(1).max(10).default(3),
  timerSeconds: z.number().int().min(15).max(180).default(60),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
});

export default defineGame({
  id: "example-game",
  version: "0.1.0",
  meta: {
    name: "Przykładowa Gra",
    shortDescription: "Referencyjny moduł gry dla Project Party.",
    status: "prototype",
    tags: ["party", "local", "teams"],
    deviceProfiles: ["tv", "phone"],
    playerCount: {
      min: 2,
      max: 8,
    },
    coverImage: "/games/example-game/cover.png",
  },
  capabilities: {
    roles: ["host", "player"],
    supportsLocalMode: true,
    supportsOnlineMode: false,
    supportsPhones: true,
    deviceProfiles: ["tv", "phone"],
  },
  settings: {
    schema: settingsSchema,
    defaults: {
      rounds: 3,
      timerSeconds: 60,
      difficulty: "medium",
    },
  },
  createRuntime(context) {
    context.ui.mount({
      type: "div",
      props: {
        children: "Tutaj gra przejmuje pełną kontrolę nad runtime.",
      },
    });

    return {
      teardown() {
        context.ui.unmount();
      },
    };
  },
});
```

Ten przykład pokazuje granice odpowiedzialności:
- hub zna tylko metadata, capabilities, settings i punkt wejścia runtime,
- gra sama zarządza tym, co dzieje się po uruchomieniu,
- wspólny kontrakt nie narzuca scoringu, stage flow ani modelu sesji konkretnej gry.

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

## Wspólny shell UI dla każdej gry

Każda nowa gra w Project Party korzysta z tego samego layoutu dla:
- `main menu` gry,
- `game setup`.

To jest wspólny kontrakt UX/UI na poziomie platformy.

Wspólne dla wszystkich gier są:
- układ ekranu,
- rytm sekcji i hierarchia treści,
- podstawowe rozmieszczenie CTA,
- poziom spójności z istniejącym wzorcem Kalambury / Tajniacy.

Zmienne per gra są:
- nazwa i copy,
- lista ustawień,
- grafiki i ilustracje,
- paleta kolorystyczna,
- gameplay i runtime flow po wejściu do gry.

To oznacza:
- gra nie projektuje od zera nowego layoutu wejścia,
- gra dostarcza własną zawartość i theme tokens,
- autonomia gry zaczyna się od logiki modułu, nie od rozbijania spójności platformowego shellu.

## Zalecana struktura katalogów gry

```text
games/<game-id>/
|- src/
|  |- index.ts
|  |- meta.ts
|  |- settings.ts
|  |- runtime/
|  |  |- createRuntime.ts
|  |  |- events.ts
|  |  `- state-machine.ts
|  |- host/
|  |- controller/
|  |- shared/
|  `- assets/
|- package.json
|- tsconfig.json
`- README.md
```

Nie wszystkie katalogi są obowiązkowe.
Nie rób folderowego cosplayu, jeśli gra ich realnie nie potrzebuje.

## Zasady

- Gra trzyma własną logikę i własny stan.
- Gra nie przecieka semantyką do `packages/*`.
- Gra nie oczekuje, że hub zna jej etapy.
- Gra nie zakłada istnienia globalnego gameplay engine.
- Docelowy setup flow konkretnej gry pozostaje w module gry, jeśli jest game-specific.
- Wspólny shell UI nie daje platformie prawa do sterowania gameplayem gry.

## Definition of done dla nowej gry

Nowa gra jest gotowa do integracji, gdy:
- ma kompletne metadata,
- ma settings schema,
- implementuje `createRuntime`,
- jest zarejestrowana w launcherze,
- zachowuje wspólny shell UI dla menu głównego i setupu gry,
- nie wymaga zmian w platformie specyficznych tylko dla siebie.
