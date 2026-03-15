# PRD — LOBBY platformy gier imprezowych

## 1. Cel funkcji

Lobby służy grupom znajomych i graczom imprezowym do szybkiego znalezienia, zrozumienia i uruchomienia wybranej gry z jednej wspólnej biblioteki, bez chaosu i skakania między różnymi stronami.

---

## 2. User Flow (happy path)

### Założenie

Użytkownik wchodzi na platformę po to, żeby jak najszybciej wybrać grę i przejść do jej uruchomienia.

### Flow

1. **Użytkownik otwiera stronę główną platformy.**
   System ładuje lobby z biblioteką dostępnych gier.

2. **Użytkownik widzi listę / siatkę gier.**
   Każda pozycja pokazuje minimum:

   * nazwę gry,
   * krótki opis,
   * typ rozgrywki:

     * tylko TV,
     * TV + telefony graczy,
     * TV + telefon prezentera,
   * status:

     * dostępna,
     * w przygotowaniu.

3. **Użytkownik przegląda bibliotekę.**
   Może:

   * kliknąć grę,
   * opcjonalnie użyć prostego filtrowania, np. „tylko dostępne”, „TV only”, „na większą grupę”.

4. **Użytkownik wybiera grę.**
   Po kliknięciu przechodzi do strony / ekranu konkretnej gry.

5. **System przekazuje użytkownika do modułu gry.**
   Lobby kończy swoją rolę na etapie wyboru gry i przekazuje ster do ekranu startowego danej gry.

### Najważniejszy rezultat happy path

Użytkownik w mniej niż kilkanaście sekund rozumie:

* jakie gry są dostępne,
* czym się różnią,
* którą może uruchomić od razu.

---

## 3. Baza danych

Na **bardzo wczesnym MVP** lobby może działać nawet na statycznym pliku JSON bez prawdziwej bazy danych.
Jeśli jednak chcemy przygotować fundament pod rozwój platformy, sensowna jest minimalna struktura poniżej.

### Tabela: `games`

Przechowuje wszystkie gry widoczne w lobby.

| Pole                | Typ danych            | Opis                                                            |
| ------------------- | --------------------- | --------------------------------------------------------------- |
| `id`                | UUID                  | Klucz główny                                                    |
| `slug`              | VARCHAR(100) UNIQUE   | Unikalny identyfikator do URL, np. `kalambury`                  |
| `name`              | VARCHAR(100)          | Nazwa gry                                                       |
| `short_description` | TEXT                  | Krótki opis gry do lobby                                        |
| `play_mode`         | ENUM                  | Typ gry: `tv_only`, `tv_plus_phones`, `tv_plus_presenter_phone` |
| `status`            | ENUM                  | Status: `active`, `coming_soon`, `hidden`                       |
| `min_players`       | SMALLINT              | Minimalna liczba graczy                                         |
| `max_players`       | SMALLINT              | Maksymalna liczba graczy                                        |
| `thumbnail_url`     | TEXT NULL             | Miniatura / grafika kafelka                                     |
| `accent_color`      | VARCHAR(20) NULL      | Kolor wyróżniający grę w lobby                                  |
| `sort_order`        | INTEGER DEFAULT 0     | Kolejność wyświetlania                                          |
| `is_featured`       | BOOLEAN DEFAULT false | Czy gra jest promowana                                          |
| `created_at`        | TIMESTAMP             | Data utworzenia                                                 |
| `updated_at`        | TIMESTAMP             | Data aktualizacji                                               |

### Tabela: `game_tags`

Opcjonalne tagi do filtrowania i opisywania gier.

| Pole   | Typ danych         | Opis                                                |
| ------ | ------------------ | --------------------------------------------------- |
| `id`   | UUID               | Klucz główny                                        |
| `name` | VARCHAR(50)        | Nazwa tagu, np. `rysowanie`, `słowna`, `duża grupa` |
| `slug` | VARCHAR(50) UNIQUE | Unikalny identyfikator tagu                         |

### Tabela: `game_tag_map`

Tabela łącząca gry z tagami.

| Pole      | Typ danych | Opis                 |
| --------- | ---------- | -------------------- |
| `game_id` | UUID       | FK do `games.id`     |
| `tag_id`  | UUID       | FK do `game_tags.id` |

**Klucz główny złożony:** `game_id + tag_id`

### Relacje

* `games` 1..N ↔ N..1 `game_tags`
* relacja realizowana przez `game_tag_map`

### Uwaga produktowa

Jeśli na start masz 3–5 gier i zero panelu admina, prawdziwa baza nie jest konieczna.
Wtedy można zacząć od prostego pliku konfiguracyjnego, a później migrować do DB.

---

## 4. Endpointy API

Na etapie samego lobby API może być bardzo proste.

### `GET /api/games`

Zwraca listę gier widocznych w lobby.

**Zastosowanie:**

* pobranie biblioteki gier na stronę główną,
* pokazanie nazw, opisów, statusów i trybów gry.

**Przykładowe pola odpowiedzi:**

* `id`
* `slug`
* `name`
* `short_description`
* `play_mode`
* `status`
* `min_players`
* `max_players`
* `thumbnail_url`
* `is_featured`

### `GET /api/games/:slug`

Zwraca szczegóły jednej wybranej gry.

**Zastosowanie:**

* przejście z lobby do strony konkretnej gry,
* wyświetlenie dokładniejszego opisu przed startem.

### `GET /api/tags`

Zwraca listę dostępnych tagów / filtrów.

**Zastosowanie:**

* budowa prostego filtrowania w lobby.

### `GET /api/games?status=active&play_mode=tv_only`

Filtrowanie listy gier po parametrach.

**Zastosowanie:**

* pokazywanie tylko aktywnych gier,
* zawężanie po typie rozgrywki.

### Czy API jest konieczne od razu?

Nie zawsze.
Jeśli robisz pierwsze MVP bardzo małymi krokami, lobby może działać nawet bez backendu — na lokalnym JSON-ie.
API staje się potrzebne wtedy, gdy:

* chcesz łatwo dodawać kolejne gry,
* chcesz filtrować / sortować dane,
* chcesz w przyszłości mieć panel zarządzania biblioteką.

---

## 5. Kryteria DONE

1. **Użytkownik po wejściu na stronę widzi bibliotekę gier z jasnym rozróżnieniem, które gry są dostępne, a które dopiero powstają.**

2. **Użytkownik może kliknąć wybraną grę i przejść do jej dedykowanego ekranu bez błędów i bez niejasności, co dalej.**

3. **Lobby ładuje się szybko i pozwala w prosty sposób zrozumieć typ każdej gry: tylko TV, TV + telefony albo TV + telefon prezentera.**

---

## Notatka końcowa

To PRD celowo trzyma się ziemi i nie rozbudowuje lobby ponad potrzebę.
Jego zadanie jest proste: **pokazać gry i szybko wysłać użytkownika do właściwej rozgrywki**.
Jeśli ten etap będzie szybki i czytelny, stanie się dobrym fundamentem pod dokładanie kolejnych gier krok po kroku.
