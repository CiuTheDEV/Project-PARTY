# PRD — Tajniacy

## 1. Cel gry
Tajniacy to przeglądarkowa gra drużynowa dla Project PARTY, w której dwie drużyny rywalizują na wspólnej planszy 5×5, a ich kapitanowie korzystają z prywatnych urządzeń z kluczem odpowiedzi, by prowadzić swoją ekipę do odkrycia wszystkich własnych kart przed przeciwnikiem.

## 2. Kontekst
Project PARTY jest platformą wielu osobnych modułów gier, a nie jednym uniwersalnym silnikiem gameplayu. Platforma odpowiada za hub, routing, branding, wspólne UI i infrastrukturę sesji, ale nie narzuca reguł konkretnej gry ani jednego flow rozgrywki dla wszystkich modułów. Tajniacy mają więc własny model urządzeń, własny lifecycle sesji i własną logikę meczu. fileciteturn37file0turn37file1

Tajniacy bazują na rozpoznawalnym fantasy gry typu Codenames/Tajniacy: wspólna plansza kryptonimów, tajny klucz dla kapitanów, napięcie wokół odkrywania kart i ryzyko trafienia zabójcy. Jednocześnie moduł nie jest ślepą kopią zasad pudełkowych 1:1. To wariant cyfrowy dopasowany do Project PARTY i do modelu „host + urządzenia”. Zasady papierowego oryginału stanowią inspirację, ale gameplay został świadomie uproszczony i częściowo odsystemowiony na potrzeby hostowanej rozgrywki. fileciteturn37file3turn37file7

## 3. Rola tej gry w katalogu
Tajniacy mają dawać doświadczenie:
- szpiegowskie,
- drużynowe,
- społeczne,
- oparte na skojarzeniach, dyskusji i napięciu,
- spokojniejsze i bardziej „stolikowe” niż gry oparte na czasie lub refleksie.

To moduł, który wnosi do katalogu Project PARTY:
- klasyczną rozgrywkę drużynową bez presji czasu,
- mocne rozdzielenie informacji publicznych i sekretnych,
- prosty onboarding na poziomie hosta,
- wysoki potencjał regrywalności dzięki różnym planszom, kategoriom i liczbie zabójców.

## 4. Zakres

### In scope
- osobny moduł gry „Tajniacy” w ramach Project PARTY,
- model urządzeń: host + telefony,
- plansza 5×5 na hoście,
- prywatny widok kapitana z kluczem odpowiedzi,
- opcjonalny view mode dla zwykłych graczy,
- konfiguracja meczu przez hosta,
- kategorie haseł: Standardowa / Bez cenzury,
- liczba zabójców: 1–5,
- mecz do 1–5 wygranych rund,
- overlay końca rundy,
- overlay końca meczu,
- historia rund w meczu,
- reconnect flow dla urządzeń kapitanów,
- reset meczu z potwierdzeniem,
- replay flow z zachowaniem ustawień.

### Out of scope
- audio feedback,
- timer rundy lub tury,
- tutorial / instrukcja w grze,
- profile graczy,
- logowanie kont,
- ręczne wpisywanie listy graczy do systemu,
- system wyboru kapitana w aplikacji,
- egzekwowanie poprawności wskazówki,
- egzekwowanie limitu kliknięć przez system,
- system „czyja teraz kolej”,
- host view z tajnym kluczem,
- upload własnych avatarów,
- zaawansowana analityka meczu,
- historia szczegółowa klik po kliku.

### Nice to have
- późniejszy audio polish,
- wbudowana instrukcja,
- bardziej rozbudowana historia meczu,
- dodatkowe kategorie haseł,
- więcej wariantów estetycznych dla kart i avatarów,
- bardziej zaawansowane recovery flow po reconnectach,
- późniejsze rozszerzenie o alternatywne tryby gry.

## 5. Topologia urządzeń
Model: **host + urządzenia**.

### Host
- duży ekran / TV / desktop,
- pokazuje wspólną planszę 5×5,
- przyjmuje oficjalne kliknięcia na karty,
- pokazuje wynik meczu i stan rundy,
- służy do konfiguracji i zarządzania sesją.

### Urządzenia kapitanów
- 2 dedykowane urządzenia na mecz,
- oba otwierają prywatny widok z tym samym kluczem aktualnej planszy,
- klucz jest dostępny wyłącznie tutaj,
- urządzenia mogą przechodzić między osobami, gdy zmienia się kapitan między rundami.

### Urządzenia zwykłych graczy
- opcjonalne,
- dowolna liczba,
- uproszczony view mode,
- brak interakcji,
- funkcja dostępnościowo-wygodnościowa, nie wymagana do startu.

### Konsekwencje UX i implementacji
- system musi rozdzielać widoki publiczne i prywatne,
- system musi wspierać co najmniej dwa typy połączeń urządzeń: kapitańskie i view-only,
- start meczu wymaga podpięcia wyłącznie dwóch urządzeń kapitanów,
- host nie może mieć dostępu do klucza.

## 6. Role graczy
### Host / operator
- konfiguruje mecz,
- uruchamia rundy,
- wykonuje oficjalne kliknięcia na planszy,
- zarządza resetem, lobby i połączeniami urządzeń,
- przy trafieniu zabójcy wskazuje w modalu, która drużyna go kliknęła.

### Drużyna czerwona
- byt drużynowy konfigurowany w systemie przez nazwę i avatar,
- realni gracze nie są zapisywani w aplikacji,
- jedna osoba w danej rundzie pełni rolę kapitana poza systemem.

### Drużyna niebieska
- analogicznie jak wyżej.

### Kapitan
- używa dedykowanego urządzenia kapitana,
- widzi klucz odpowiedzi,
- podaje wskazówkę ustnie w formacie słowo + liczba,
- nie wpisuje wskazówki do systemu.

### Zwykły gracz
- patrzy na planszę hosta lub opcjonalny view mode,
- nie ma uprawnień do kliknięć,
- nie ma dostępu do klucza,
- nie jest identyfikowany przez system.

## 7. User flow
### A. Wejście do gry
1. Użytkownik wchodzi do Project PARTY i wybiera moduł Tajniacy.
2. Host przechodzi do ekranu konfiguracji meczu.

### B. Konfiguracja meczu
1. Host tworzy drużynę czerwoną i niebieską.
2. Dla każdej drużyny wpisuje ręcznie nazwę.
3. Dla każdej drużyny wybiera predefiniowany avatar / ikonę.
4. Host wybiera próg zwycięstw: do 1 / 2 / 3 / 4 / 5 wygranych rund.
5. Host wybiera kategorię: Standardowa lub Bez cenzury.
   - domyślnie żadna kategoria nie jest zaznaczona,
   - wybór kategorii jest wymagany przed startem.
6. Host wybiera liczbę zabójców: 1 / 2 / 3 / 4 / 5.
   - domyślnie: 1.

### C. Parowanie urządzeń
1. Host otwiera zakładkę połączeń urządzeń.
2. Dla kapitanów dostępny jest jeden wspólny QR + kod pokoju.
3. Dla view mode graczy dostępny jest drugi wspólny QR + kod pokoju.
4. Dwa urządzenia kapitańskie muszą zostać podłączone.
5. View mode graczy jest opcjonalny i może mieć dowolną liczbę połączeń.
6. Po podpięciu dwóch urządzeń kapitanów host może kliknąć START.

### D. Rozpoczęcie rundy
1. System losuje nową planszę 5×5.
2. System losuje drużynę rozpoczynającą 50/50.
3. Drużyna rozpoczynająca ma 9 kart, druga 8.
4. Liczba neutralnych kart jest wyliczana jako reszta po odjęciu kart drużynowych i wybranej liczby zabójców.
5. Kapitanowie widzą klucz na swoich urządzeniach.
6. Host widzi wyłącznie planszę publiczną.

### E. Rozgrywka rundy
1. Kapitan aktywnej drużyny podaje ustnie wskazówkę: słowo + liczba.
2. Osoba przy hoście klika odpowiednie karty na planszy.
3. System nie egzekwuje technicznie limitu kliknięć ani aktywnej drużyny.
4. Karty po odkryciu zostają odkryte na stałe.
5. Jeśli odkryta zostaje ostatnia karta którejkolwiek drużyny, runda kończy się natychmiast.
6. Jeśli odkryty zostaje zabójca, runda kończy się natychmiast i pojawia się modal wskazania, która drużyna go kliknęła.
7. Po zakończeniu sekwencji danej drużyny kolejna drużyna podaje swoją wskazówkę. Aplikacja nie wymusza końca tury.

### F. Koniec rundy
1. Pojawia się overlay końca rundy.
2. Overlay pokazuje zwycięską drużynę.
3. Overlay pokazuje aktualny wynik meczu.
4. Użytkownik przechodzi przyciskiem do ustawień.
5. Między rundami wszystkie ustawienia zostają zachowane.
6. Zmienia się tylko plansza i ewentualnie kapitanowie.
7. Host może ręcznie zmienić kategorię i liczbę zabójców między rundami.
8. Zmiana kategorii lub liczby zabójców nie resetuje wyniku meczu.

### G. Koniec meczu
1. Gdy jedna drużyna osiągnie próg zwycięstw, pojawia się overlay końca meczu.
2. Overlay pokazuje nazwę zwycięskiej drużyny i końcowy wynik.
3. Dostępne akcje:
   - Zagraj ponownie,
   - Powrót do lobby.
4. „Zagraj ponownie” zachowuje ustawienia meczu i może zachować sparowane urządzenia kapitanów.

## 8. Gameplay / logika
### Model planszy
- plansza zawsze ma układ 5×5,
- jedna drużyna ma zawsze 9 kart,
- druga ma zawsze 8 kart,
- drużyna startująca jest losowana 50/50 i to ona dostaje 9 kart,
- liczba neutralnych kart maleje wraz ze wzrostem liczby zabójców,
- dostępne zabójcy: 1–5.

### Warunki zwycięstwa rundy
Runda kończy się, gdy:
- zostanie odkryta ostatnia karta czerwonych,
- albo zostanie odkryta ostatnia karta niebieskich,
- albo zostanie odkryty zabójca.

### Zabójca
- trafienie zabójcy kończy rundę natychmiast,
- system sam nie wie, która drużyna kliknęła zabójcę,
- po trafieniu pojawia się modal,
- host wskazuje, która drużyna kliknęła zabójcę,
- punkt / wygrana rundy trafia do drużyny przeciwnej.

### Warunki zwycięstwa meczu
- mecz grany jest do ustalonego progu wygranych rund,
- dostępne progi: 1 / 2 / 3 / 4 / 5,
- gdy drużyna osiąga próg, mecz się kończy.

### Ważna decyzja projektowa: brak systemowego egzekwowania tur
To jest kluczowy element modułu:
- aplikacja nie pokazuje stanu „czyja kolej”,
- aplikacja nie pilnuje liczby kliknięć względem liczby wypowiedzianej przez kapitana,
- aplikacja nie ma przycisku „zakończ turę”,
- aplikacja nie przerywa automatycznie sekwencji po odkryciu neutralnej lub wrogiej karty,
- jedynymi automatycznymi końcami rundy są zabójca i odkrycie ostatniej karty którejś drużyny.

### Konsekwencja względem oryginału
Papierowa instrukcja Tajniaków zakłada, że zły strzał kończy turę drużyny. W tej wersji cyfrowej aplikacja tego nie wymusza. To świadomy custom wariant UX/gameplay dla Project PARTY, wynikający z decyzji, by system był bardziej planszą i stanem rozgrywki niż arbitrem tur. fileciteturn37file3turn37file7

## 9. UX / UI
### Ekran hosta
Układ 3-strefowy:
- **top bar** — cały czas widoczny,
- **centrum** — plansza 5×5,
- **bottom bar** — cały czas widoczny.

### Top bar
- lewa sekcja: drużyna czerwona,
- prawa sekcja: drużyna niebieska,
- środek: stałe akcje hosta:
  - Reset meczu,
  - Połączenie urządzeń,
  - Powrót do lobby / wyjście.

### Bottom bar
- liczba nieodkrytych kart obu drużyn,
- informacja o drużynie rozpoczynającej rundę,
- widoczny stale przez całą rundę.

### Plansza 5×5
- centralny bohater ekranu,
- minimalistyczne karty,
- mocna, czytelna typografia,
- po odkryciu karta zachowuje widoczność hasła,
- karta zalewa się kolorem swojej tożsamości,
- odkrycie ma subtelny efekt premium.

### Odkryte stany kart
- czerwona: pełne wypełnienie czerwienią, jasny tekst,
- niebieska: pełne wypełnienie błękitem, jasny tekst,
- neutralna: jasnoszary / chłodny, czytelny stan,
- zabójca: bardzo ciemny / prawie czarny stan, ikona czaszki, czerwony akcent.

### Overlay końca rundy
- nazwa zwycięskiej drużyny,
- aktualny wynik meczu,
- przycisk powrotu do ustawień.

### Overlay końca meczu
- nazwa zwycięskiej drużyny,
- końcowy wynik meczu,
- przycisk Zagraj ponownie,
- przycisk Powrót do lobby.

### Historia meczu
Prosta historia, zawierająca dla każdej rundy:
- kto wygrał rundę,
- wynik meczu po rundzie,
- kategorię rundy,
- liczbę zabójców w rundzie.

### Interakcje bezpieczeństwa
- Reset meczu musi mieć modal potwierdzenia.

## 10. Motyw wizualny
- klimat: **szpiegowski**,
- bazowy interfejs: **ciemny**,
- kolory przewodnie:
  - `#E74C3C`
  - `#3498DB`
- styl planszy: minimalistyczny,
- styl kapitańskiego urządzenia: premium szpiegowski panel, ale maksymalnie czytelny,
- styl view mode gracza: uproszczony, lekki, bez zbędnego UI hosta.

### Ograniczenia wizualne
- plansza ma pozostać najważniejszym elementem ekranu,
- top bar i bottom bar nie mogą wizualnie przytłoczyć centrum,
- mimo premium feelingu należy unikać przeładowania efektami,
- czytelność słów ma mieć wyższy priorytet niż dekoracyjność.

## 11. Host / Device / Presenter flow
### Host flow
- konfiguracja drużyn i meczu,
- parowanie urządzeń,
- start rundy,
- oficjalne kliknięcia na planszy,
- obsługa modali końca rundy i końca meczu,
- reset / lobby / reconnect.

### Captain device flow
- wejście przez wspólny QR lub kod pokoju,
- prywatny widok klucza bieżącej planszy,
- brak dodatkowych akcji wymaganych systemowo,
- urządzenie może być przekazywane między osobami między rundami,
- w przypadku rozłączenia gra zostaje wstrzymana.

### Player view flow
- wejście przez osobny wspólny QR lub kod pokoju,
- uproszczony podgląd planszy,
- brak możliwości klikania,
- brak obowiązkowości.

### Reconnect / failure flow
- rozłączenie urządzenia kapitana w trakcie meczu:
  - wstrzymuje grę,
  - host dostaje alert,
  - wymagane jest ponowne sparowanie urządzenia,
  - po reconnectcie mecz może być kontynuowany.

## 12. Integracja z platformą
### Shared z poziomu Project PARTY
- routing i launcher gry,
- infrastruktura sesji,
- ogólny system parowania urządzeń,
- wspólne komponenty bazowe UI,
- branding platformy,
- standardy responsywności i jakości.

### Game-specific dla Tajniaków
- generator planszy 5×5,
- logika rozkładu kart drużynowych / neutralnych / zabójców,
- prywatny widok klucza,
- hostowa plansza z odkrywaniem kart,
- overlaye rundy i meczu,
- historia rund,
- specyficzny reconnect flow dla urządzeń kapitanów.

### Wpływ na istniejące systemy
- lobby / konfiguracja: wymaga rozszerzenia o ustawienia specyficzne dla Tajniaków,
- urządzenia: wymaga rozróżnienia co najmniej dwóch kanałów urządzeń,
- scoreboard: wymaga stanu meczu „do X wygranych rund”,
- flow hosta: musi wspierać powrót do ustawień między rundami bez resetowania wyniku,
- device flow: musi wspierać prywatność klucza i opcjonalność widoku graczy.

## 13. Architektura wdrożenia
### Dotknięte warstwy
- `apps/web` — wejście do modułu, host UI, konfiguracja, overlaye, session binding,
- `apps/worker` — session API / room state / device pairing / reconnect helpers,
- `games/tajniacy` — cała logika gry,
- `packages/*` — ewentualne shared UI primitives, typy, session helpers.

### Typy plików / obszary implementacji
- ekran konfiguracji gry,
- host board view,
- captain key view,
- player view-only screen,
- game state machine dla rundy i meczu,
- generator planszy,
- historia meczu,
- modale i overlaye,
- reconnect handling,
- style / tokens / komponenty wizualne.

### Źródło prawdy
- źródłem prawdy dla stanu rundy i meczu powinna być sesja gry,
- host nie może być jedynym miejscem przechowywania krytycznego stanu,
- widoki urządzeń muszą renderować stan z sesji zgodnie ze swoim poziomem uprawnień.

## 14. Plan wdrożenia
### Etap 1 — Foundation modułu
**Cel:** uruchomić szkielet gry i podstawowy stan sesji.

**Zakres:**
- rejestracja modułu Tajniacy w hubie,
- podstawowe trasy / launch flow,
- model konfiguracji meczu,
- bazowy stan sesji,
- typy danych dla drużyn, rundy, ustawień i urządzeń.

**Zależności:** session layer platformy.

**Ryzyka:** zbyt wczesne związanie logiki gry z hostem zamiast z sesją.

**Definition of done:** można wejść do gry, ustawić podstawowe parametry meczu i trzymać je w stanie sesji.

### Etap 2 — Parowanie urządzeń
**Cel:** spiąć dwa kanały urządzeń.

**Zakres:**
- QR + kod dla urządzeń kapitanów,
- QR + kod dla view mode,
- walidacja startu tylko po podpięciu 2 urządzeń kapitanów,
- podstawowe stany połączenia / brak połączenia / reconnect.

**Zależności:** Etap 1.

**Ryzyka:** pomylenie ról urządzeń, niestabilne reconnecty.

**Definition of done:** host może sparować 2 urządzenia kapitanów, opcjonalnie view mode i uruchomić mecz.

### Etap 3 — Core gameplay
**Cel:** dostarczyć grywalną rundę od startu do końca.

**Zakres:**
- generator planszy 5×5,
- rozkład 9 / 8 / neutralni / zabójcy,
- losowanie drużyny startującej,
- odkrywanie kart,
- warunki końca rundy,
- modal zabójcy,
- aktualizacja wyniku meczu.

**Zależności:** Etap 1–2.

**Ryzyka:** niespójna logika końca rundy, błędne naliczanie zwycięzcy przy zabójcy.

**Definition of done:** da się rozegrać pełną rundę i otrzymać poprawny wynik.

### Etap 4 — Host UI i device UI
**Cel:** doprowadzić główne interfejsy do używalności.

**Zakres:**
- top bar,
- bottom bar,
- plansza 5×5,
- ekran kapitana,
- view mode gracza,
- overlay końca rundy,
- overlay końca meczu,
- historia rund.

**Zależności:** Etap 3.

**Ryzyka:** przeładowanie host UI, za mała czytelność kart na różnych ekranach.

**Definition of done:** wszystkie główne ekrany działają i są spójne wizualnie.

### Etap 5 — Lifecycle meczu i polish MVP
**Cel:** domknąć flow wielorundowe.

**Zakres:**
- powrót do ustawień między rundami,
- zmiana kategorii i liczby zabójców bez resetu wyniku,
- reset meczu z potwierdzeniem,
- „Zagraj ponownie” z zachowaniem ustawień,
- reconnect flow przy rozłączeniu kapitana,
- podstawowy polish animacji odkrycia.

**Zależności:** Etap 4.

**Ryzyka:** wycieki stanu między rundami, utrata sparowanych urządzeń po replayu.

**Definition of done:** pełen mecz do X zwycięstw działa stabilnie od konfiguracji do replayu.

## 15. Acceptance criteria
1. Host może skonfigurować obie drużyny, próg zwycięstw, kategorię i liczbę zabójców.
2. Bez wybranej kategorii mecz nie może wystartować.
3. Bez dwóch podpiętych urządzeń kapitanów mecz nie może wystartować.
4. View mode graczy nie jest wymagany do startu.
5. Host nigdy nie widzi tajnego klucza.
6. Oba urządzenia kapitanów widzą poprawny klucz bieżącej planszy.
7. Plansza zawsze generuje 25 kart.
8. Drużyna startująca ma zawsze 9 kart, druga 8.
9. Zmiana liczby zabójców zmniejsza liczbę neutralnych kart, bez naruszania układu 9/8.
10. Odkryta karta pozostaje odkryta do końca rundy.
11. Odkrycie ostatniej karty którejkolwiek drużyny kończy rundę.
12. Odkrycie zabójcy kończy rundę i wymaga wskazania przez hosta, która drużyna go kliknęła.
13. Wynik meczu aktualizuje się poprawnie po każdej rundzie.
14. Między rundami można wrócić do ustawień bez utraty wyniku meczu.
15. Między rundami można zmienić kategorię i liczbę zabójców bez resetu wyniku.
16. Overlay końca rundy pokazuje zwycięzcę rundy i wynik meczu.
17. Overlay końca meczu pokazuje zwycięzcę meczu i końcowy wynik.
18. „Zagraj ponownie” zachowuje ustawienia meczu.
19. Reset meczu wymaga potwierdzenia.
20. Rozłączenie urządzenia kapitana wstrzymuje grę i wymaga reconnectu.

## 16. Test plan
### Happy path
- konfiguracja obu drużyn,
- wybór kategorii,
- wybór liczby zabójców,
- sparowanie 2 urządzeń kapitanów,
- start meczu,
- rozegranie rundy,
- aktualizacja wyniku,
- rozegranie pełnego meczu do progu zwycięstw,
- replay.

### Edge case’y gameplayowe
- trafienie zabójcy,
- trafienie ostatniej własnej karty,
- trafienie ostatniej wrogiej karty,
- wysoka liczba zabójców,
- zmiana kategorii między rundami,
- zmiana liczby zabójców między rundami,
- reset meczu w połowie serii.

### Edge case’y urządzeń
- podłączone tylko 1 urządzenie kapitana,
- rozłączenie jednego urządzenia kapitana w trakcie rundy,
- reconnect urządzenia kapitana,
- wiele urządzeń w view mode,
- brak urządzeń w view mode.

### Responsive
- host na dużym ekranie,
- host na desktopie 16:9,
- kapitan na telefonie pionowo,
- gracz-view na telefonie pionowo,
- czytelność kart przy różnych rozdzielczościach.

### Regresje krytyczne
- host nie może zobaczyć klucza,
- replay nie może czyścić ustawień, jeśli nie powinien,
- zmiana kategorii między rundami nie może resetować wyniku,
- rozłączenie kapitana musi naprawdę zatrzymać grę,
- logika zabójcy nie może przypisać punktu złej drużynie.

## 17. Ryzyka
### Produktowe
- część użytkowników może oczekiwać zasad 1:1 jak w pudełku,
- brak systemowego limitu kliknięć może prowadzić do sporów przy stole,
- brak systemowego „czyja kolej” wymaga większej dyscypliny społecznej.

### UX
- łatwo przesadzić z ilością informacji w top/bottom barze,
- zbyt agresywne efekty mogą obniżyć czytelność planszy,
- reconnect kapitana musi być prosty i jednoznaczny, inaczej psuje flow.

### Techniczne
- bezpieczne odseparowanie klucza od hosta jest krytyczne,
- synchronizacja hosta i urządzeń musi być stabilna,
- reconnect nie może duplikować sesji kapitana lub mieszać uprawnień.

### Wdrożeniowe
- zbyt szybkie mieszanie shared platform code z game-specific code może stworzyć bałagan architektoniczny,
- historia rund i lifecycle meczu mogą rozlać się po wielu warstwach, jeśli stan nie będzie dobrze zdefiniowany.

## 18. Założenia robocze
- System sesji Project PARTY potrafi utrzymać wspólny stan hosta i urządzeń w czasie rzeczywistym lub quasi-rzeczywistym.
- Platforma jest w stanie odróżnić co najmniej dwa typy podłączonych widoków: prywatne urządzenia kapitanów i view-only dla graczy.
- Moduł Tajniacy będzie wdrażany jako osobny katalog gry, zgodnie z kierunkiem monorepo Project PARTY. fileciteturn37file0

## 19. Decyzje odłożone na później
- audio feedback,
- instrukcja wbudowana w grę,
- bardziej zaawansowany log / historia,
- system analityki i telemetrii,
- bardziej restrykcyjne egzekwowanie tur przez aplikację,
- dodatkowe kategorie i warianty gry,
- rozszerzenia wizualne wykraczające poza MVP,
- ewentualne wsparcie dla niestandardowych trybów lub rotacji ról.
