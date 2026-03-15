# TODO

Roboczy backlog wykonawczy dla tej kopii repo.

Zasady:
- ten plik trzyma konkretne taski do zrobienia w repo, nie strategię produktu
- `Now` oznacza rzeczy, które realnie odblokowują development lub jakość MVP
- `Next` oznacza najbliższe rzeczy po domknięciu `Now`
- `Later` zostaje krótkie i nie zastępuje `docs/ROADMAP.md`
- pytania bez jasnej decyzji trafiają do `Blocked / Decisions`

## Now

### Platform / Hub
- [ ] Uporządkować katalog gier tak, żeby `apps/web` brał pełne metadata tylko z kontraktu modułów gry, bez lokalnych wyjątków i rozjazdów.
- [ ] Dokończyć audit route'ów w `apps/web` i usunąć pozostałe założenia platformy o flow konkretnej gry.
- [ ] Ustabilizować launcher gry i controller routes pod dev refresh / bezpośrednie wejście / cleanup runtime, bez dalszych wyścigów.
- [ ] Dopisać regresje dla najważniejszych flow webowych: wejście do gry, powrót do hubu, controller route, fullscreen layout.

### Kalambury
- [ ] Zamienić devowy presenter phone bridge oparty o `BroadcastChannel` na docelowy transport cross-device przez worker/session layer.
- [ ] Utrwalić kontrakt dodatku prezentera: połączenie, utrata połączenia, start rundy, dostarczenie hasła, cleanup po turze.
- [ ] Przejrzeć wszystkie etapy host flow w Kalamburach i wyłapać resztę overflow / viewport regressions poza głównym menu.
- [ ] Dodać browser-level test regresyjny dla flow `setup -> podlaczenie prezentera -> start -> prywatne haslo na telefonie`.
- [ ] Uporządkować miejsca, gdzie UI Kalamburów nadal sugeruje gotową integrację realtime mimo że transport devowy jest tymczasowy.

### Worker / Backend
- [ ] Spisać minimalny MVP transport dla sesji i controllera: jakie eventy są platformowe, a jakie zostają game-owned.
- [ ] Zdecydować, które odpowiedzialności session API zostają w `apps/worker`, a które powinny wrócić do modułów gier.
- [ ] Przygotować cienki mechanizm komunikacji host/controller, który nie wpycha logiki Kalamburów do platformy.

### Docs / Repo Hygiene
- [ ] Zaktualizować dokumentację o obecny stan Windows-first workflow i lokalne ograniczenia dev transportu prezentera.
- [ ] Uzupełnić docs tam, gdzie obecne zachowanie repo odbiega od założeń z plans i PRD.
- [ ] Trzymać `TODO.md`, `docs/ROADMAP.md` i `docs/plans/*` rozdzielone odpowiedzialnością, bez duplikowania tych samych list.

## Next

### Platform / Hub
- [ ] Dopracować discovery flow w hubie: featured, recently played, random game, lepsze status badges dla gier w produkcji.
- [ ] Ujednolicić sposób wejścia do modułu gry z poziomu huba, tak żeby kolejne gry nie wymagały nowych wyjątków routingu.
- [ ] Zrobić przegląd wspólnego shell UI platformy pod kątem tego, co faktycznie jest reusable między grami.

### Kalambury
- [ ] Dokończyć parity między host screenem, controller screenem i docelowym mode flow dla klasycznego trybu.
- [ ] Rozdzielić bardziej jawnie rzeczy produkcyjne od dev helpers w module Kalamburów.
- [ ] Ocenić, czy `team mode` ma wejść jako realny feature, czy zostać jasno oznaczony jako future work bez pół-integracji.

### Shared Packages
- [ ] Przejrzeć `packages/*` i wyrzucić lub cofnąć abstrakcje, które są de facto tylko dla jednej gry.
- [ ] Zbudować cienką warstwę helperów dla autorów gier dopiero tam, gdzie naprawdę powtarza się wzorzec w 2+ modułach.

## Later

### Product / Expansion
- [ ] Dodać kolejne moduły gier po domknięciu czystego reference path dla Kalamburów.
- [ ] Rozwinąć platformowe discovery i katalog gier dopiero po ustabilizowaniu kontraktu integracyjnego.
- [ ] Wrócić do kont, paywalla albo party room tylko wtedy, gdy kierunek produktu będzie tego realnie wymagał.

## Blocked / Decisions

- [ ] Zdecydować docelowy model realtime dla MVP: host-authoritative, worker-assisted czy inny cienki wariant pośredni.
- [ ] Zdecydować, które elementy session lifecycle są wspólne dla wszystkich gier, a które pozostają w 100% game-owned.
- [ ] Zdecydować, czy platforma ma mieć wspólny join flow dla wielu gier, czy tylko minimalny launcher + game-specific continuation.
- [ ] Zdecydować, jak daleko standaryzować game main-menu shell, żeby pomóc nowym modułom bez budowania gameplay monolitu.
