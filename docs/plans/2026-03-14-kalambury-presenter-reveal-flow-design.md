# Kalambury Presenter Reveal Flow Design

## Goal

Przebudowac flow startu tury z dodatkiem prezentera tak, aby haslo nie bylo od razu "wyslane i zaakceptowane", tylko przechodzilo przez kontrolowany moment odkrycia na telefonie prezentera.

## Scope

Zmiana dotyczy tylko `games/kalambury`.

W scope:
- hostowy ekran przed rozpoczeciem tury,
- ekran telefonu prezentera,
- eventy synchronizacji miedzy hostem i controllerem,
- przejscie do aktywnej tury po sztywnym preview 10 s,
- ukrycie hasla na telefonie po zakonczeniu preview.

Poza scope:
- zmiany w `apps/web` i `apps/worker`,
- backendowy transport docelowy,
- zmiana globalnego kontraktu platformy,
- konfigurowalny czas preview.

## Recommended Flow

Flow powinien skladac sie z trzech etapow:

1. `Reveal pending`
- Host pokazuje karte prezentera oraz status, ze karta czeka na odkrycie na telefonie.
- Telefon pokazuje tylko rewers karty i jedno glowne CTA `Odkryj haslo`.
- Host nie ma recznego przycisku startu tej sceny; triggerem przejscia jest telefon.

2. `Reveal preview`
- Klikniecie `Odkryj haslo` na telefonie emituje event przejscia.
- Host przechodzi do ekranu `Prezenter zapoznaje sie z haslem`.
- Telefon pokazuje odkryta karte z haslem, kategoria i akcja `Zmien haslo`.
- Etap trwa zawsze sztywne 10 sekund.

3. `Round live`
- Po 10 sekundach host automatycznie przechodzi do aktywnej tury z odliczaniem czasu z ustawien trybu.
- Telefon traci podglad hasla: karta wraca do stanu zakrytego.
- Po przejsciu do live nie ma juz mozliwosci zmiany hasla ani ponownego podgladu.

## UX Rules

- Host nigdy nie pokazuje hasla.
- Telefon pokazuje haslo tylko w kontrolowanym oknie preview 10 s.
- Odkrycie hasla jest swiadomym ruchem prezentera, a nie automatycznym skutkiem wejscia w scene.
- Koniec preview jest automatyczny i zsynchronizowany po obu stronach.
- Po zakonczeniu preview prezenter nie ma juz "sciagi" na ekranie telefonu.

## UI Direction

Host:
- `Reveal pending`: status-first, szybki ekran z karta prezentera i komunikatem `Karta czeka na odkrycie na telefonie`.
- `Reveal preview`: prosty ekran z karta prezentera i dominujacym countdownem 10 s.
- `Round live`: pozostaje gameplay aktywnej tury bez pokazywania hasla.

Telefon:
- `Reveal pending`: duza karta z rewersem i jasnym affordance do odkrycia.
- `Reveal preview`: odkryta karta z haslem, kategoria i opcja `Zmien haslo`.
- `Round live`: karta znow zakryta.

## State / Sync Contract

Potrzebne sa wyrazne eventy lokalnego bridge:
- event odkrycia karty przez prezentera,
- event startu preview 10 s,
- event zakonczenia preview i przejscia do live,
- event zmiany hasla w trakcie preview.

Zalecane jest modelowanie tego jako osobnych etapow flow, a nie jako luźnych flag UI.

## Success Criteria

- Host czeka na akcje prezentera zamiast komunikowac, ze haslo po prostu "zostalo wyslane".
- Telefon pokazuje rewers, potem 10-sekundowe odkrycie, potem znow zakrywa haslo.
- Klikniecie odkrycia automatycznie przeprowadza host do preview.
- Koniec preview automatycznie uruchamia aktywna ture.
- Wszystko pozostaje lokalne dla `games/kalambury`.
