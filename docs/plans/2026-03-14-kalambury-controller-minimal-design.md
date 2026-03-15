# Kalambury Controller Minimal Design

**Date:** 2026-03-14

**Problem**

Obecny ekran telefonu prezentera zawiera zbyt dużo chrome’u: duży header, kod sesji, helper copy, ilustracje i dekoracje. To rozprasza i osłabia najważniejszy element, czyli kartę prezentera.

**Decision**

Telefon prezentera przechodzi na minimalistyczny, `card-first` layout z preferencją dla orientacji poziomej. Ekran skupia się na trzech elementach:

- informacja `PREZENTUJE` + imię aktualnego gracza,
- mały badge statusu,
- sama karta i jej akcja.

**What stays**

- badge statusu,
- informacja o aktualnym prezenterze,
- karta prezentera,
- CTA tylko wtedy, gdy dany stan tego wymaga.

**What goes away**

- kod sesji,
- duży nagłówek `Telefon prezentera`,
- rozbudowane helper paragraphs,
- ilustracja performera,
- dekoracyjny nadmiar sekcji i ramek.

**States**

`pending-reveal`
- `PREZENTUJE` + imię,
- badge `Karta czeka na odkrycie`,
- zakryta karta,
- przycisk `Odkryj karte`.

`preview`
- `PREZENTUJE` + imię,
- badge `Zapamietaj haslo`,
- odkryta karta,
- akcja `Zmien haslo`.

`hidden-live`
- `PREZENTUJE` + imię,
- badge `Tura trwa`,
- znowu zakryta karta,
- bez podglądu hasła.

`rejected`
- prosty wyjątek z komunikatem o zajętym slocie,
- bez pełnego layoutu karty.

**Layout direction**

- preferowany układ: landscape-first,
- w poziomie karta ma być głównym bohaterem ekranu,
- w pionie layout ma się składać do jednej kolumny bez utraty hierarchii,
- ten sam komponent ma działać w obu orientacjach, bez osobnych widoków.

**Scope**

- zmiana lokalna do `games/kalambury/src/controller/ControllerApp.tsx`,
- możliwe wydzielenie lokalnych klas do `games/kalambury/src/styles.css`,
- bez zmian w platformie i kontraktach runtime.

