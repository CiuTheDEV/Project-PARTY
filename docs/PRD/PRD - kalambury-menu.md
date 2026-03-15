# PRD — PartyHUB / Kalambury / Ekran wyboru trybu gry

## 1. Dokument

* **Produkt:** PartyHUB
* **Gra:** Kalambury
* **Feature:** Ekran wyboru trybu gry („Klasyczny” / „Drużynowy”)
* **Docelowe środowisko wdrożenia:** Codex / repozytorium
* **Status:** Ready for implementation
* **Priorytet:** Wysoki

---

## 2. Cel funkcji

Stworzyć produkcyjny ekran wyboru trybu gry dla Kalamburów, który zamienia obecny statyczny mockup w działający, spójny z PartyHUB widok nawigacyjny z wyborem trybu, stanami kart, aktywną selekcją, obsługą placeholderów assetów i gotowością do dalszego flow gry.

---

## 3. Kontekst

Aktualny dostarczony kod przedstawia kompletny wizualny mockup ekranu w ciemnym stylu neonowym z:

* topbarem z brandingiem „KALAMBURY”, notyfikacjami i profilem gracza,
* lewym sidebarem z sekcjami „Główne Menu” i „Inne”,
* głównym nagłówkiem „Wybierz tryb gry”,
* dwoma kartami trybów: **Klasyczny** i **Drużynowy**,
* nawigacją strzałkami jak w karuzeli,
* stopką ze statusem serwerów i wersją aplikacji.

Mockup używa **Tailwind przez CDN**, fontu **Space Grotesk**, ikon **Material Symbols**, klasy `dark`, własnych kolorów (`primary`, `background-dark`, `surface-dark`, `accent-dark`, `muted-pink`) oraz efektu `neon-glow`. Docelowy wygląd i hierarchia informacji wynikają bezpośrednio z tego layoutu. W kodzie karta „Drużynowy” jest wizualnie aktywna, a „Klasyczny” oznaczony jako „Polecane”.

---

## 4. Problem do rozwiązania

Obecny ekran jest makietą HTML bez realnej logiki, bez modelu danych, bez komponentyzacji i bez integracji z flow gry. W Codexie trzeba go przekształcić w feature gotowy do rozwijania, który:

* jest zgodny z brandem PartyHUB,
* ma jasny model stanu,
* działa responsywnie,
* jest gotowy do podpięcia pod routing i backend / save state,
* używa realnych assetów zamiast przypadkowych obrazków zewnętrznych.

---

## 5. Cele biznesowe i UX

### 5.1 Cele biznesowe

* Ułatwić graczowi szybkie rozpoczęcie właściwego trybu.
* Zwiększyć czytelność różnic między trybami.
* Utrzymać premium, rozpoznawalny wygląd PartyHUB.
* Stworzyć ekran, który da się rozszerzać o kolejne tryby lub eventy bez przebudowy layoutu.

### 5.2 Cele UX

* Użytkownik w maksymalnie 3 sekundy rozumie, co ma zrobić.
* Użytkownik od razu widzi, który tryb jest aktywny / wybrany.
* Każda karta ma czytelny opis, metadane i CTA.
* Nawigacja boczna, topbar i stopka nie konkurują z głównym celem ekranu.

---

## 6. Zakres

### 6.1 In scope

1. Produkcyjna implementacja ekranu wyboru trybu gry.
2. Komponentyzacja widoku.
3. System danych dla kart trybów.
4. Stany kart: idle / hover / active / selected / disabled.
5. Obsługa kliknięcia w kartę i CTA.
6. Obsługa przycisków strzałek karuzeli.
7. Responsywność desktop + laptop + tablet.
8. Podmiana assetów hero na własne assety PartyHUB.
9. Integracja z routingiem lub callbackiem startu trybu.
10. Dokumentacja wdrożenia i kryteria akceptacyjne.

### 6.2 Out of scope

* Implementacja samej rozgrywki dla trybu klasycznego lub drużynowego.
* Finalny backend do statystyk, znajomych, profilu i serwerów.
* Kompletny system powiadomień.
* Prawdziwa synchronizacja online.
* Finalna ekonomia XP.

---

## 7. Użytkownicy

* **Gracz lokalny** — chce szybko rozpocząć sesję.
* **Host / organizator wieczoru** — chce świadomie wybrać tryb pod liczbę osób.
* **Powracający gracz** — ma rozpoznawać interfejs PartyHUB i szybko wracać do ulubionego trybu.

---

## 8. User stories

1. Jako gracz chcę zobaczyć dostępne tryby gry na jednej planszy, żebym mógł szybko wybrać styl rozgrywki.
2. Jako gracz chcę przeczytać krótki opis trybu, żebym wiedział, czym różni się klasyczny od drużynowego.
3. Jako gracz chcę widzieć, który tryb jest aktualnie aktywny lub wybrany, żebym nie pomylił decyzji.
4. Jako gracz chcę kliknąć kartę lub CTA i przejść dalej bez zbędnych kroków.
5. Jako użytkownik PartyHUB chcę, by ekran był spójny z resztą aplikacji wizualnie i nawigacyjnie.

---

## 9. Założenia produktowe

* Ekran działa jako osobny route / view w aplikacji Kalambury.
* Lista trybów jest konfigurowalna przez dane, nie hardcode per karta w JSX/HTML.
* Domyślnie dostępne są dwa tryby: `classic` i `team`.
* System musi obsłużyć przyszłe tryby: np. eventowe, ranked, limited-time, wip.
* Assety kart nie mogą docelowo zależeć od zewnętrznych URL-i Google.
* Brand PartyHUB musi pozostać neonowy, ciemny, premium i tokenizowany.

---

## 10. Wymagania funkcjonalne

### 10.1 App shell

Widok ma być osadzony w app shellu złożonym z:

* **Topbar**
* **Sidebar**
* **Main content**
* **Footer status bar**

Każdy z tych elementów ma być reużywalny i wydzielony komponentowo.

### 10.2 Topbar

Topbar musi zawierać:

* branding gry „KALAMBURY”,
* ikonę gry,
* przycisk powiadomień,
* przycisk konta,
* separator,
* sekcję profilu z labelką roli („Gracz”), nickiem i avatarem.

#### Zachowanie

* Ikony w topbarze mają stany hover / focus / active.
* Topbar pozostaje sticky na górze.
* Avatar i nick są pobierane z danych użytkownika albo z mock state.

### 10.3 Sidebar

Sidebar zawiera:

* sekcję „Główne Menu”: Graj Teraz, Ustawienia, Znajomi, Statystyki,
* sekcję „Inne”: Powrót do Lobby,
* widget postępu: poziom, XP, progress bar.

#### Zachowanie

* aktywna pozycja menu ma wyróżnienie neonowe,
* pozostałe mają hover i focus,
* „Powrót do Lobby” uruchamia callback / route back,
* progress widget jest tylko informacyjny na tym etapie.

### 10.4 Sekcja główna

Sekcja główna musi zawierać:

* nagłówek H1: „Wybierz tryb gry”,
* podtytuł opisujący ideę wyboru sposobu pokazywania haseł,
* kontener kart trybów z nawigacją.

### 10.5 Karty trybów

Każda karta trybu składa się z:

* hero assetu / ilustracji,
* gradient overlay na dole hero,
* opcjonalnego badge’a (`recommended`, `new`, `wip`, `active`),
* tytułu trybu,
* krótkiego opisu,
* metadanych (np. liczba graczy / czas sesji),
* CTA.

#### Wymagane pola danych

```ts
interface GameModeCard {
  id: string;
  slug: 'classic' | 'team' | string;
  title: string;
  description: string;
  metaLabel: string;
  metaIcon: string;
  heroAsset: string;
  heroAssetAlt: string;
  badge?: {
    label: string;
    variant: 'recommended' | 'new' | 'wip' | 'active';
  };
  state: 'available' | 'selected' | 'active' | 'disabled';
  ctaLabel: string;
}
```

### 10.6 Stany kart

#### Idle

* standardowe obramowanie,
* standardowy cień,
* brak powiększenia.

#### Hover

* delikatne podbicie borderu,
* delikatny lift / glow,
* bez agresywnych animacji.

#### Active / highlighted

* mocniejszy border,
* subtelny glow,
* opcjonalnie lekkie powiększenie `1.01–1.02`,
* CTA ma primary state.

#### Selected

* kliknięcie w kartę ustawia ją jako wybraną,
* wybrana karta aktualizuje CTA i internal state,
* stan selected może być tożsamy z active albo rozdzielony logicznie.

#### Disabled / unavailable

* zgaszona karta,
* brak kliknięcia,
* czytelny komunikat albo badge „WKRÓTCE” / „NIEDOSTĘPNE”.

### 10.7 CTA

* Kliknięcie w kartę lub główne CTA wybiera tryb.
* Kliknięcie CTA aktywnego trybu przechodzi do kolejnego ekranu flow.
* Dla MVP: callback `onSelectMode(modeId)`.
* Dla pełnego flow: route np. `/kalambury/mode/classic` lub `/kalambury/mode/team`.

### 10.8 Nawigacja strzałkami

* Strzałki po bokach obsługują przełączanie kart, jeśli w widoku znajduje się więcej kart niż mieszczących się jednocześnie.
* Dla 2 kart na desktopie mogą być nieaktywne lub ukryte, jeśli obie karty są widoczne.
* Dla mniejszych viewportów przełączają aktywną kartę lub przesuwają karuzelę.

### 10.9 Footer

Footer zawiera:

* status serwerów,
* region,
* licznik graczy online,
* copyright,
* wersję klienta.

Na etapie MVP dane mogą być mockowane.

---

## 11. Wymagania wizualne

### 11.1 Styl

* Ciemne tło z neonowym różem jako głównym akcentem.
* Gradienty burgund / purpura / pink, zgodne z obecną stroną.
* Styl premium gaming dashboard.

### 11.2 Typografia

* Font display i UI: zgodnie z obecnym mockiem `Space Grotesk`.
* Hierarchia nagłówków ma pozostać bardzo czytelna.
* H1 powinien dominować nad resztą layoutu.

### 11.3 Kolory bazowe

Na podstawie mocku:

* `primary`: `#f425af`
* `background-dark`: `#22101c`
* `surface-dark`: `#34182b`
* `accent-dark`: `#49223c`
* `muted-pink`: `#cb90b7`

W implementacji produkcyjnej kolory mają być wyniesione do tokenów.

### 11.4 Assety

* Usunąć zewnętrzne grafiki mockowe.
* Dla `classic` i `team` użyć własnych assetów PartyHUB.
* Preferowany format: **SVG**.
* Dla kart należy użyć przygotowanych ikon / ilustracji odpowiadających trybom.
* Hero assety muszą mieć bezpieczny crop i dobrze wyglądać na `h-56` oraz w wariantach responsywnych.

### 11.5 Spójność PartyHUB

Implementacja musi być zgodna z zasadą jednego języka UI:

* tokeny,
* spójne CTA,
* spójny radius,
* spójne shadow,
* spójne hover states,
* brak przypadkowych wartości i stylów rozsianych po komponentach.

---

## 12. Wymagania techniczne dla Codex

### 12.1 Kierunek implementacji

Kod z mocka jest oparty o Tailwind CDN, ale w Codexie widok ma zostać wdrożony jako kod repozytoryjny, nie jako statyczny snippet.

### 12.2 Docelowa architektura

Minimalny podział:

* `GameModesPage`
* `KalamburyTopBar`
* `KalamburySidebar`
* `ModeCarousel`
* `ModeCard`
* `KalamburyFooterStatus`

### 12.3 Dane

* Dane kart muszą pochodzić z jednego źródła, np. `gameModes.ts`.
* Stan wybranego trybu ma być zarządzany centralnie dla tej strony.
* Dane mockowe topbaru, profilu, stopki i XP mogą być wydzielone do `mock/` lub `fixtures/`.

### 12.4 Asset pipeline

* Wszystkie assety hero mają być lokalne.
* SVG powinny być zoptymalizowane i nazwane jednoznacznie.
* Brak zewnętrznych zależności do obrazków.

### 12.5 A11y

* pełna obsługa klawiatury,
* focus-visible dla kart, CTA i strzałek,
* sensowne `aria-label` dla przycisków,
* alt text lub semantyka dla hero assetów,
* kontrast tekstu zachowany w dark mode.

### 12.6 Responsywność

Obsłużyć minimum:

* 1920×1080
* 1366×768
* 1024×768
* tablet poziomy
* mobile szerokości 390–428 px

Na mobile:

* sidebar przechodzi w drawer albo zwijane menu,
* karty działają jako prawdziwy slider / jedna karta naraz,
* topbar zostaje uproszczony,
* footer nie może zjadać użytecznej przestrzeni.

### 12.7 Performance

* assety SVG preferowane,
* brak ciężkich efektów i przesadnych blurów na słabszych urządzeniach,
* animacje 150–260 ms,
* bez agresywnego layout shift.

---

## 13. Przebieg użytkownika (happy path)

1. Użytkownik wchodzi na ekran Kalambury.
2. Widzi ekran wyboru trybu z dwiema kartami.
3. Czyta opis i porównuje tryby.
4. Kliknięciem wybiera `Klasyczny` albo `Drużynowy`.
5. System zapisuje wybór i przechodzi do kolejnego kroku flow gry.

---

## 14. Edge cases

* Brak assetu hero dla jednej karty.
* Tylko jeden dostępny tryb.
* Więcej niż 2 tryby w przyszłości.
* Długi opis trybu.
* Długi nick użytkownika w topbarze.
* Niski viewport wysokości.
* Brak danych statusowych w footerze.
* Tryb zablokowany / event wygasł.

---

## 15. Telemetria / eventy

Wdrożyć eventy analityczne:

* `game_modes_page_viewed`
* `game_mode_card_hovered`
* `game_mode_selected`
* `game_mode_cta_clicked`
* `game_mode_carousel_navigated`

Parametry:

* `mode_id`
* `position`
* `viewport`
* `source_screen`

---

## 16. Kryteria akceptacyjne

### UX / UI

* Widok jest wizualnie zgodny z mockiem.
* Hierarchia nagłówka, sidebaru i kart jest zachowana.
* Aktywna karta jest jednoznacznie wyróżniona.
* Karty mają poprawne stany hover/focus/active.
* Assety są lokalne i zgodne z PartyHUB.

### Funkcjonalność

* Klik w kartę ustawia wybór.
* Klik w CTA przechodzi dalej.
* Strzałki działają zgodnie z liczbą kart i viewportem.
* Sidebar i topbar działają jako nawigacja / shell.

### Techniczne

* Brak zależności od zewnętrznych obrazów.
* Komponenty są reużywalne.
* Dane kart nie są porozrzucane po markupie.
* Responsywność działa na wymaganych breakpointach.
* A11y minimum jest zachowane.

---

## 17. Definition of Done

Feature uznaje się za gotowy, gdy:

1. ekran działa jako komponent / route w repo,
2. używa lokalnych assetów PartyHUB,
3. posiada model danych dla kart,
4. ma stany UI i obsługę wyboru,
5. jest responsywny,
6. ma sensowne focus states i a11y,
7. jest zgodny z brandem i tokenami,
8. został opisany w dokumentacji projektu.

---

## 18. Rekomendowany plan wdrożenia w Codex

### Build 1 — shell + layout

* przenieść mock do struktury komponentów,
* zbudować topbar / sidebar / footer,
* wyciągnąć tokeny i kolory,
* odtworzyć layout 1:1.

### Build 2 — mode cards + dane

* zbudować model danych kart,
* wdrożyć `ModeCard` i `ModeCarousel`,
* dodać stany hover / active / selected,
* podpiąć CTA i select mode.

### Build 3 — assety + responsywność + polish

* podmienić hero na lokalne SVG,
* dopracować mobile / tablet,
* dodać focus-visible, aria, edge cases,
* dopiąć eventy analityczne.

---

## 19. Wymagania dokumentacyjne PartyHUB

Jeżeli feature będzie wdrażany zgodnie z aktualnym workflow PartyHUB, implementacja powinna aktualizować:

* `readme/changelog.md`
* `readme/PATCH_NOTES.md`
* `readme/KNOWN_ISSUES.md`

Opis zmian ma być konkretny, testowalny i zgodny z obowiązującym schematem dokumentacji projektu.

---

## 20. Decyzje projektowe

1. **Drużynowy** może być domyślnie wyróżniony, ale stan aktywny nie powinien oznaczać automatycznego wyboru bez akcji użytkownika.
2. Badge `Polecane` dla Klasycznego może pozostać, jeśli produktowo ma wspierać onboarding.
3. Strzałki powinny być logiczne, a nie tylko dekoracyjne.
4. Progress widget i footer są częścią shellu, nie głównego celu ekranu.
5. Assety trybów muszą być spójne stylistycznie z PartyHUB i nie mogą wyglądać jak losowe stockowe obrazy.

---

## 21. Finalna rekomendacja

W Codexie należy potraktować ten ekran nie jako „ładny landing”, tylko jako **reużywalny moduł wyboru trybu**, z którego da się korzystać także w przyszłych grach PartyHUB. Implementacja ma być modularna, tokenizowana i gotowa do rozwijania, a nie jednorazowo zakodowana pod jeden screenshot.
