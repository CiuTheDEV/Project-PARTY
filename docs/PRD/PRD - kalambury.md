# PRD Ă„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ä‚ËĂ˘â€šÂ¬ÄąÄ„ Kalambury (PartyHUB) Ă„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ä‚ËĂ˘â€šÂ¬ÄąÄ„ rebuild w Codex

## 0. Streszczenie
Kalambury to gra imprezowa Ă„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă„ÄľpokaÄ‚â€žĂ„â€¦Ä‚â€žĂ‹ĹĄ/odgadnijĂ„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă„â€ž, projektowana pod TV/desktop jako ekran gÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąË‡Ä‚â€žĂ˘â‚¬ĹˇĂ„Ä…Ă˘â‚¬Ĺˇwny (host) oraz opcjonalnie telefon jako ekran prezenter/sterownik. Rebuild ma byĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬Ă‹â€ˇ moduÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąË‡em w platformie PartyHUB, zgodnym z docelowym stosem (React + TS + Vite + Cloudflare Pages/Workers/D1). :contentReference[oaicite:0]{index=0}

---

## 1. Cel funkcji (1 zdanie)
UmoÄ‚â€žĂ„â€¦Ä‚â€žĂ‹ĹĄliwiĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬Ă‹â€ˇ grupie znajomych szybkie uruchomienie rund kalamburÄ‚â€žĂ˘â‚¬ĹˇĂ„Ä…Ă˘â‚¬Ĺˇw na duÄ‚â€žĂ„â€¦Ä‚â€žĂ‹ĹĄym ekranie, z opcjonalnym telefonem dla prezentera, aby gra byÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąË‡a pÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąË‡ynna, czytelna i odporna na softlocki.

---

## 2. Kontekst i zaÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąË‡oÄ‚â€žĂ„â€¦Ä‚â€žĂ‹ĹĄenia
- Start: projekt hobbystyczny, bez kosztÄ‚â€žĂ˘â‚¬ĹˇĂ„Ä…Ă˘â‚¬Ĺˇw wÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąË‡asnych.
- Gra jest moduÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąË‡em w platformie PartyHUB (routing, wspÄ‚â€žĂ˘â‚¬ĹˇĂ„Ä…Ă˘â‚¬Ĺˇlne UI, design tokens).
- Docelowy stack: React, TypeScript, Vite, React Router, CSS Variables, Cloudflare Pages (frontend), Cloudflare Workers + D1 (API/DB), a real-time (Durable Objects) w etapie gier wielourzĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬Ă‚Â¦dzeniowych. :contentReference[oaicite:1]{index=1}
- Biblioteka animacji: dopuszczalne GSAP / anime.js (+ ewentualnie canvas-confetti), z peÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąË‡nym wsparciem `prefers-reduced-motion`.

---

## 3. Persony / role
- **Host (TV/desktop)**: uruchamia grĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â‚¬ĹľĂ‹Â, prowadzi rundĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â‚¬ĹľĂ‹Â, zarzĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬Ă‚Â¦dza ustawieniami.
- **Prezenter (telefon)**: widzi hasÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąË‡o, kontroluje start/stop/zakrycie (w trybie multi-device).
- **Gracze**: zgadujĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬Ă‚Â¦; w trybie bez druÄ‚â€žĂ„â€¦Ä‚â€žĂ‹ĹĄyn kaÄ‚â€žĂ„â€¦Ä‚â€žĂ‹ĹĄdy jest osobnym graczem (kolejka tur).

---

## 4. User Flow (happy path) - max 5 krokow
1. Host wybiera "Kalambury" w lobby i trafia do Game Hub tej gry.
2. W Game Hub wybiera tryb gry; w MVP1 aktywny jest tylko jeden tryb, kolejne tryby sa poza zakresem.
3. Host ustawia graczy i avatary, a nastepnie wybiera kategorie do rundy.
4. W razie potrzeby host rozwija ustawienia trybu i dopasowuje parametry rundy; domyslny flow ma pozwalac zagrac bez grzebania w ustawieniach zaawansowanych.
5. Start tury: system wybiera prezentera, pokazuje przygotowanie rundy i przechodzi do rozgrywki.
---

## 5. Zakres (Scope) Ă„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ä‚ËĂ˘â€šÂ¬ÄąÄ„ MVP vs iteracje

### MVP1 (single-device, grywalne od zera)
- Game Hub gry jako ekran wejscia po kliknieciu karty w lobby.
- Jeden grywalny tryb Kalamburow; architektura strony od poczatku zaklada obsluge kolejnych trybow.
- Quick start: gracze, avatary, kategorie i szybki start bez dotykania ustawien zaawansowanych.
- Timer (countdown) + START/STOP.
- Punktacja prosta (host recznie przyznaje punkty).
- Lista graczy i kolejka prezentera (bez druzyn).
- Baza hasel w D1 (kategorie + trudnosc + tekst).

### MVP2 (multi-device: prezenter na telefonie)
### MVP2 (multi-device: prezenter na telefonie)
- Parowanie host Ă„â€šĂ‹ÂÄ‚ËĂ˘â€šÂ¬Ă‚Â Ä‚ËĂ˘â€šÂ¬ÄąÄ„ prezenter.
- Sekretne hasÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąË‡o na telefonie (z coverem/hold-reveal).
- START z telefonu (3s odliczanie na hoÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąĹşcie).
- Reroll hasÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąË‡a (z limitami / blokadĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬Ă‚Â¦ spamu).
- PeÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąË‡na odpornoÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąĹşĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬Ă‹â€ˇ na refresh / reconnect (deterministyczny stan rundy).

### MVP3 (RRE Ă„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ä‚ËĂ˘â€šÂ¬ÄąÄ„ Random Round Events)
- RRE po intro rundy, overlay eventu, tokeny stylu rundy, HUD badge.
- Eventy: Golden Points, Rush.
- Spec RRE powinien bazowaĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬Ă‹â€ˇ na `RRE_UPDATE_GUIDE.md`. :contentReference[oaicite:2]{index=2}

### MVP4 (polish)
- A11y + reduced motion + edge cases.
- ResponsywnoÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąĹşĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬Ă‹â€ˇ bez overflow (mobile portrait + landscape).
- Ujednolicone animacje i Ă„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă˘â‚¬Ĺźpremium UIĂ„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă„â€ž.

---

## 6. Wymagania funkcjonalne (FR)

### 6.1 Gracze i kolejka
- Dodawanie/usuwanie graczy, edycja nazw.
- Kazdy gracz ma avatar wybierany podczas konfiguracji gry.
- Losowa lub rotacyjna kolejka prezentera.
- Widoczny "teraz gra: [Imie]".

### 6.2 Kategorie i hasla (content)
- Kategorie (np. Filmy, Sport, Zwierzeta), trudnosc (latwe/trudne).
- Domyslnie wszystkie aktywne kategorie sa zaznaczone; host moze je tylko zawezic, jesli chce.
- Losowanie hasla z wybranych kategorii i trudnosci.
- **Zuzyte hasla**: nie powtarzac do wyczerpania puli (per kategoria i trudnosc).
- Reset zuzytych (globalnie lub per kategoria).

### 6.3 Przebieg rundy (state machine)
Minimalny zestaw stanÄ‚â€žĂ˘â‚¬ĹˇĂ„Ä…Ă˘â‚¬Ĺˇw (moÄ‚â€žĂ„â€¦Ä‚â€žĂ‹ĹĄe ewoluowaĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬Ă‹â€ˇ, ale logika ma byĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬Ă‹â€ˇ jawna):
- `LOBBY` Ă„â€šĂ‹ÂÄ‚ËĂ˘â€šÂ¬Ă‚Â Ä‚ËĂ˘â€šÂ¬Ă˘â€žË `ROUND_INTRO` Ă„â€šĂ‹ÂÄ‚ËĂ˘â€šÂ¬Ă‚Â Ä‚ËĂ˘â€šÂ¬Ă˘â€žË `SETUP` (kategorie/trudnoÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąĹşĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬Ă‹â€ˇ) Ă„â€šĂ‹ÂÄ‚ËĂ˘â€šÂ¬Ă‚Â Ä‚ËĂ˘â€šÂ¬Ă˘â€žË  
  (opcjonalnie `STAGE_RRE`) Ă„â€šĂ‹ÂÄ‚ËĂ˘â€šÂ¬Ă‚Â Ä‚ËĂ˘â€šÂ¬Ă˘â€žË `REVEAL` (hasÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąË‡o) Ă„â€šĂ‹ÂÄ‚ËĂ˘â€šÂ¬Ă‚Â Ä‚ËĂ˘â€šÂ¬Ă˘â€žË `ACT` (timer) Ă„â€šĂ‹ÂÄ‚ËĂ˘â€šÂ¬Ă‚Â Ä‚ËĂ˘â€šÂ¬Ă˘â€žË `SCORE` Ă„â€šĂ‹ÂÄ‚ËĂ˘â€šÂ¬Ă‚Â Ä‚ËĂ˘â€šÂ¬Ă˘â€žË `NEXT`.
W multi-device `REVEAL` rozdziela siĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â‚¬ĹľĂ‹Â na Ă„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă„Äľtelefon pokazuje hasÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąË‡o / host czekaĂ„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă„â€ž.

### 6.4 Timer i kontrola
- Standard: countdown.
- Rush: count-up + limit 60s (niezaleÄ‚â€žĂ„â€¦Ä‚â€žĂ‹ĹĄny od ustawieÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąÄľ trybu).
- Blokady anty-softlock: hard-timeout, moÄ‚â€žĂ„â€¦Ä‚â€žĂ‹ĹĄliwoÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąĹşĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬Ă‹â€ˇ Ă„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă˘â‚¬ĹźPomiÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąÄľĂ„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă„â€ž.

### 6.5 Punktacja
- Podstawowa: host przyznaje punkty recznie po udanym odgadnieciu.
- Warunek zwyciestwa w MVP1 jest jeden: gramy ustalona liczbe rund.
- Jedna pelna runda oznacza, ze kazdy gracz wykonal swoj ruch jako prezenter.
- Po przejsciu calej kolejki graczy licznik rund zwieksza sie o 1.
- Golden Points: mnoznik punktow (2-10) obowiazuje do konca rundy.
- Rush: punkty zaleza od czasu (thresholds w state, deterministyczne).

### 6.6 UI/UX
- Ekran po kliknieciu gry z lobby jest Game Hubem, a nie pasywna strona informacyjna.
- Game Hub ma dwa poziomy:
  - quick start widoczny od razu: gracze, avatary, kategorie, Start,
  - ustawienia trybu jako sekcja drugorzedna, domyslnie schowana lub mniej eksponowana.
- Wybor trybu jest pierwsza czescia Game Hubu; w MVP1 tylko jeden tryb jest aktywny, kolejne moga byc pokazane jako `W przygotowaniu`.
- Overlaye pelnoekranowe: czytelne, z hierarchia (tytul -> parametr -> 1 linia opisu).
- HUD: badge aktywnego RRE + styl rundy (tokeny).
- Brak scrollbarow na mobile (szczegolnie na ekranie prezentera).

### 6.7 Animacje i motion
### 6.7 Animacje i motion
- GSAP jako master timeline (wejÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąĹşcie/wyjÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąĹşcie overlayu, mikroanimacje licznika).
- anime.js opcjonalnie: Ă„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă˘â‚¬ĹźodometerĂ„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă„â€ž/count-up dla mnoÄ‚â€žĂ„â€¦Ä‚â€žĂ‹ĹĄnikÄ‚â€žĂ˘â‚¬ĹˇĂ„Ä…Ă˘â‚¬Ĺˇw.
- `prefers-reduced-motion` + manualny toggle Ă„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă„ÄľAnimacjeĂ„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă„â€ž:
  - OFF: brak ruchu, brak migotania, brak Ă„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă˘â‚¬ĹźczekaniaĂ„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă„â€ž na timeouty.
  - ON: animacje krÄ‚â€žĂ˘â‚¬ĹˇĂ„Ä…Ă˘â‚¬Ĺˇtkie, nieblokujĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬Ă‚Â¦ce flow.

---

## 7. Wymagania niefunkcjonalne (NFR)
- **StabilnoÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąĹşĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬Ă‹â€ˇ**: 0 bÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąË‡Ă„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â‚¬ĹľĂ‹ÂdÄ‚â€žĂ˘â‚¬ĹˇĂ„Ä…Ă˘â‚¬Ĺˇw w konsoli w happy path host + prezenter.
- **ResponsywnoÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąĹşĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬Ă‹â€ˇ**: mobile 320/360/390/428 + landscape ~844Ä‚â€žĂ˘â‚¬ĹˇÄ‚ËĂ˘â€šÂ¬Ă˘â‚¬ĹĄ390 (bez overflow); host 1366Ä‚â€žĂ˘â‚¬ĹˇÄ‚ËĂ˘â€šÂ¬Ă˘â‚¬ĹĄ768 i 1920Ä‚â€žĂ˘â‚¬ĹˇÄ‚ËĂ˘â€šÂ¬Ă˘â‚¬ĹĄ1080.
- **WydajnoÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąĹşĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬Ă‹â€ˇ**: szybkie wejÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąĹşcia overlayÄ‚â€žĂ˘â‚¬ĹˇĂ„Ä…Ă˘â‚¬Ĺˇw, brak layout thrash.
- **Deterministyka**: event/parametry rundy nie zmieniajĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬Ă‚Â¦ siĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â‚¬ĹľĂ‹Â po refresh/rejoin.
- **A11y**: focus states, sensowne aria-labels, kontrast, reduced motion.

---

## 8. Dane i model (D1) Ă„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ä‚ËĂ˘â€šÂ¬ÄąÄ„ propozycja
### Tabele (minimalne)
- `kal_categories`:
  - `id`, `name`, `slug`, `is_active`, `sort_order`
- `kal_phrases`:
  - `id`, `category_id`, `difficulty` (`easy|hard`), `text`, `is_active`
- `kal_sessions` (opcjonalnie na MVP2+):
  - `id`, `created_at`, `mode_json`
- `kal_session_used_phrases`:
  - `session_id`, `phrase_id`, `used_at`

### Dalsze (multi-device)
- `rooms` / `room_players` (lub Durable Objects jako Ä‚â€žĂ„â€¦Ă„Ä…ÄąĹźrÄ‚â€žĂ˘â‚¬ĹˇĂ„Ä…Ă˘â‚¬ĹˇdÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąË‡o prawdy stanu live).

---

## 9. API (Cloudflare Workers) - propozycja endpointow
> W tym projekcie MVP1 dla Kalamburow korzysta z API i D1 od startu; nie planujemy osobnego runtime na seed content w aplikacji. :contentReference[oaicite:3]{index=3}

### Content
- `GET /api/kalambury/categories`
- `GET /api/kalambury/phrases?categoryId=&difficulty=&excludeUsed=true&sessionId=`

### Session
- `POST /api/kalambury/sessions` Ă„â€šĂ‹ÂÄ‚ËĂ˘â€šÂ¬Ă‚Â Ä‚ËĂ˘â€šÂ¬Ă˘â€žË tworzy `sessionId`
- `POST /api/kalambury/sessions/:id/used` Ă„â€šĂ‹ÂÄ‚ËĂ˘â€šÂ¬Ă‚Â Ä‚ËĂ˘â€šÂ¬Ă˘â€žË zapis zuÄ‚â€žĂ„â€¦Ä‚â€žĂ‹ĹĄytego hasÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąË‡a
- `POST /api/kalambury/sessions/:id/reset-used` Ă„â€šĂ‹ÂÄ‚ËĂ˘â€šÂ¬Ă‚Â Ä‚ËĂ˘â€šÂ¬Ă˘â€žË reset

### Multi-device (MVP2+)
- `POST /api/kalambury/rooms` Ă„â€šĂ‹ÂÄ‚ËĂ˘â€šÂ¬Ă‚Â Ä‚ËĂ˘â€šÂ¬Ă˘â€žË tworzy pokÄ‚â€žĂ˘â‚¬ĹˇĂ„Ä…Ă˘â‚¬Ĺˇj (kod)
- `POST /api/kalambury/rooms/:code/join` Ă„â€šĂ‹ÂÄ‚ËĂ˘â€šÂ¬Ă‚Â Ä‚ËĂ˘â€šÂ¬Ă˘â€žË doÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąË‡Ă„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬Ă‚Â¦czenie (rola)
- Real-time: Durable Object (WebSocket) jako kanaÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąË‡ stanu (etap 2 stacku). :contentReference[oaicite:4]{index=4}

---

## 10. Kontrakt stanu gry (propozycja)
- `gameState.stage` (enum)
- `round.index`
- `match.totalRounds`
- `match.completedRounds`
- `round.presenterPlayerId`
- `round.categoryIds[]`, `round.difficulty`
- `round.phrase` (id + text) - text widoczny tylko dla prezenter/host zaleznie od trybu
- `round.timer`:
  - `mode: countdown|countup`, `limitSeconds`, `startedAt`, `endedAt`
- `round.rre` (MVP3):
  - `id`, `themeId`, `params`, `overlay: {startedAt, doneAt, skipped}`

---
---

## 11. Kryteria akceptacji (AC) Ă„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ä‚ËĂ˘â€šÂ¬ÄąÄ„ Ă„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă˘â‚¬ĹźDefinition of DoneĂ„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă„â€ž
- MoÄ‚â€žĂ„â€¦Ä‚â€žĂ‹ĹĄna rozegraĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬Ă‹â€ˇ peÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąË‡ny flow: start gry Ă„â€šĂ‹ÂÄ‚ËĂ˘â€šÂ¬Ă‚Â Ä‚ËĂ˘â€šÂ¬Ă˘â€žË kilka rund Ă„â€šĂ‹ÂÄ‚ËĂ˘â€šÂ¬Ă‚Â Ä‚ËĂ˘â€šÂ¬Ă˘â€žË punktacja Ă„â€šĂ‹ÂÄ‚ËĂ˘â€šÂ¬Ă‚Â Ä‚ËĂ˘â€šÂ¬Ă˘â€žË nastĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â‚¬ĹľĂ‹Âpny gracz, bez bÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąË‡Ă„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â‚¬ĹľĂ‹ÂdÄ‚â€žĂ˘â‚¬ĹˇĂ„Ä…Ă˘â‚¬Ĺˇw w konsoli.
- Mobile prezenter (MVP2) nie ma scrolla i nie pokazuje hasÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąË‡a Ă„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă˘â‚¬ĹźprzypadkiemĂ„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă„â€ž (cover/hold).
- Reroll nie softlockuje UI; spam klikÄ‚â€žĂ˘â‚¬ĹˇĂ„Ä…Ă˘â‚¬Ĺˇw nie wiesza stanu.
- `prefers-reduced-motion` i toggle Animacje OFF nie psujĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬Ă‚Â¦ przejÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąĹşĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬Ă‹â€ˇ (bez migotania, bez czekania na animacje).
- RRE (MVP3) zgodne ze spec i deterministyczne po refresh.

---

## 12. Out of scope (na start)
- Konta uzytkownikow, platnosci, panel admina.
- Zaawansowane statystyki i historia gier.
- Team mode (druzyny) - chyba ze dopiszesz jako osobny PRD.
- Dodatkowe tryby Kalamburow poza jednym pierwszym trybem z MVP1.
- Multi-device, pairing i telefon prezentera przed domknieciem single-device.
- Rozbudowane ustawienia jako warunek wejscia do gry; quick start ma pozostac domyslna sciezka.

---
---

## 13. Plan wdroÄ‚â€žĂ„â€¦Ä‚â€žĂ‹ĹĄenia (high level)
1. **Setup moduÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąË‡u gry** (routing + layout + design tokens).
2. **MVP1**: single-device runda + content z D1.
3. **MVP2**: multi-device (room + pairing + prezenter UI).
4. **MVP3**: RRE (Golden + Rush) + overlay + tokeny + HUD.
5. **MVP4**: polish, a11y, reduced motion, edge cases.

---

## 14. Ryzyka i mitigacje
- **Real-time**: bez Durable Objects multi-device bĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â‚¬ĹľĂ‹Âdzie kruche Ă„â€šĂ‹ÂÄ‚ËĂ˘â€šÂ¬Ă‚Â Ä‚ËĂ˘â€šÂ¬Ă˘â€žË planowaĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬Ă‹â€ˇ MVP2 od razu na DO (etap 2) albo Ä‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąĹşwiadomie ograniczyĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬Ă‹â€ˇ MVP1 do single-device. :contentReference[oaicite:5]{index=5}
- **Regresje CSS/animacji**: overlaye muszĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬Ă‚Â¦ mieĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬Ă‹â€ˇ hard-timeout i logikĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â‚¬ĹľĂ‹Â niezaleÄ‚â€žĂ„â€¦Ä‚â€žĂ‹ĹĄnĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â€šÂ¬Ă‚Â¦ od animacji.
- **Content quality**: brak dobrych haseÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąË‡ zabija zabawĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â‚¬ĹľĂ‹Â Ă„â€šĂ‹ÂÄ‚ËĂ˘â€šÂ¬Ă‚Â Ä‚ËĂ˘â€šÂ¬Ă˘â€žË narzĂ„â€šĂ˘â‚¬ĹľÄ‚ËĂ˘â‚¬ĹľĂ‹Âdzia do Ä‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąË‡atwego importu/edycji.

---

## 15. Otwarte kwestie (do decyzji)
- DokÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąË‡adna punktacja (kto dostaje punkty w trybie bez druÄ‚â€žĂ„â€¦Ä‚â€žĂ‹ĹĄyn).
- Czy host zawsze widzi hasÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąË‡o, czy tylko prezenter (tryb Ă„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă˘â‚¬Ĺźtylko hasÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąË‡oĂ„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă„â€ž vs Ă„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă˘â‚¬ĹźhasÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąË‡o + kategoriaĂ„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă„â€ž).
- Czy dopuszczamy Ă„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă˘â‚¬Ĺźreroll hasÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąË‡o + kategoriaĂ„â€šĂ‹ÂÄ‚ËĂ˘â‚¬ĹˇĂ‚Â¬Ă„Ä…Ă„â€ž w tym samym czasie (z reguÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąË‡y nie).
- Docelowa lista RRE poza Golden/Rush (osobny PRD, jeÄ‚â€žĂ„â€¦Ä‚ËĂ˘â€šÂ¬ÄąĹşli rozbudowujemy).
