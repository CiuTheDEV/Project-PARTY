# Kalambury Player Card Unification Design

## Goal

Ujednolicic uklad i wyglad wszystkich kart graczy w module `games/kalambury`, tak aby kazdy ekran korzystal z tego samego jezyka wizualnego: centralny avatar, dolny nameplate, wspolna rama/tlo/spacing oraz przewidywalne warianty dla roznych flow.

## Scope

Zmiana dotyczy tylko `games/kalambury`.

W scope:
- karty graczy w setupie,
- karty kolejnosci tury,
- karta prezentera,
- karty wyboru zgadujacego,
- ranking/podsumowanie gry,
- pozostale lokalne widoki, w ktorych gracz jest reprezentowany jako samodzielna karta.

Poza scope:
- platforma `apps/web`,
- shared packages,
- ogolna przebudowa state machine,
- nowe kontrakty runtime.

## Recommended Approach

Wprowadzic jeden lokalny pattern `player-card` na poziomie CSS i lekkich, lokalnych fragmentow JSX w Kalamburach, zamiast budowac jeden "smart" komponent dla calej gry.

Pattern bazowy:
- karta jako ciemny panel z tym samym borderem, radius i glowem,
- avatar wycentrowany w glownej przestrzeni karty,
- nameplate jako dolny pas wewnatrz karty,
- wspolna typografia nazwy gracza,
- opcjonalne dodatki przez modyfikatory: badge kolejnosci, stan aktywny, winner, compact, interactive.

## Variant Rules

- `order`: pelny showcase; badge numeru tylko tutaj.
- `setup`: zachowuje lokalne akcje edycji/usuwania, ale anatomia karty pozostaje ta sama.
- `presenter`: ten sam pattern z mocniejszym statusem roli.
- `verdict/guesser`: karta pozostaje klikalna, ale nadal wyglada jak ta sama rodzina.
- `summary`: bardziej kompaktowa wysokosc, ale nadal avatar + nameplate + wspolna rama.

## Implementation Notes

- Najpierw trzeba zinwentaryzowac obecne klasy `.kalambury-player-card`, `.kalambury-order-card`, `.kalambury-presenter-hero`, `.kalambury-verdict-player-card`, `.kalambury-summary-rank`.
- Potem wyciagnac wspolne reguly do jednego lokalnego zestawu klas i dopiero nadpisywac warianty.
- JSX powinien zostac maksymalnie lokalny dla kazdego widoku; jesli pojawi sie maly wspolny fragment, to tylko w `games/kalambury/src/host`.
- Testy parity powinny pilnowac obecnosci wspolnego wzorca oraz tego, ze `order` zachowuje badge kolejnosci.

## Success Criteria

- Karty graczy na wszystkich ekranach wygladaja jak jedna rodzina komponentow.
- Rozni sie skala i interakcja, nie bazowa anatomia.
- `LOSOWANIE/KOLEJNOSC` zachowuje badge numeru, inne ekrany go nie dziedzicza.
- Zmiana nie wychodzi poza modul Kalamburów.
