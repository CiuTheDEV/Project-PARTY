# Tajniacy

Drużynowa gra skojarzeń w stylu Codenames dla Project PARTY.

## Opis

Dwie drużyny rywalizują na wspólnej planszy 5×5, a ich kapitanowie korzystają z prywatnych urządzeń z kluczem odpowiedzi, by prowadzić swoją ekipę do odkrycia wszystkich własnych kart przed przeciwnikiem.

## Model urządzeń

- **Host** — wspólny ekran z planszą, kliknięcia, konfiguracja
- **Urządzenia kapitanów** (×2) — prywatny widok klucza
- **View mode** (×N, opcjonalny) — podgląd planszy

## Status

🚧 W trakcie implementacji — Etap 1 (Foundation) zakończony.

## Struktura

```
src/
├── index.ts            # defineGame() entrypoint
├── meta.ts             # GameMeta dla huba
├── settings.ts         # GameSettingsDefinition
├── runtime/
│   └── createRuntime.ts
├── host/
│   ├── HostApp.tsx     # Orchestrator stanu
│   ├── SetupScreen.tsx # Konfiguracja meczu
│   └── PlayScreen.tsx  # Plansza 5×5 z overlayami
├── controller/
│   ├── CaptainView.tsx # Klucz kapitana
│   └── PlayerView.tsx  # View-only
└── shared/
    ├── types.ts        # Typy domenowe
    ├── avatars.ts      # Emoji avatarów
    ├── words.ts        # Baza haseł
    ├── board-generator.ts  # Generator planszy
    └── state-machine.ts    # Cała logika meczu
```
