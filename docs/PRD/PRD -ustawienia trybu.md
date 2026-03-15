Dokument Wymagań Produktowych (PRD) – Ekran Ustawień Gry Kalambury

1. Przegląd Projektu

Celem jest odtworzenie ekranu ustawień gry towarzyskiej "Kalambury" na podstawie dostarczonego zrzutu ekranu. Interfejs musi być nowoczesny, ciemny i zorientowany na urządzenia mobilne (układ pionowy).

2. Wygląd i Stylistyka (UI/UX)

Motyw: Dark Mode (Głęboka czerń tła #000000, kontenery w kolorze ciemnoszarym #1a1a1a).

Kolor Akcentu: Neonowy róż / Magenta (używany dla głównego przycisku "Start", obramowania aktywnego panelu oraz nagłówków).

Zaokrąglenia: Wysoki stopień zaokrąglenia rogów (border-radius: ok. 16px - 24px) dla wszystkich kart i przycisków.

Typografia: Bezszeryfowy, nowoczesny font (np. Sans-Serif / Inter). Biały tekst dla kluczowych informacji, szary dla etykiet pomocniczych.

3. Struktura Funkcjonalna

A. Nagłówek i Sekcja Graczy

Tytuł: "Ustawienia gry" (kolor różowy, wyśrodkowany).

Licznik Graczy: Etykieta "Gracze" (lewa) i licznik "2/8" (prawa, szary).

Lista Graczy: Poziomy scrollowalny rząd (lub flex-wrap) zawierający:

Karty istniejących graczy (Avatar emoji, tło szare, imię w czarnej pigułce).

Przycisk "DODAJ" (ramka dashed/przerywana, ikona plusa, szary tekst).

B. Konfiguracja Trybu (Panel Górny)

Przycisk Główny: "USTAWIENIA TRYBU" z ikoną zębatki.

Szybki Podgląd (3 kolumny):

Rozgrywka: "Rundy • 15s"

Podpowiedzi: "Słowa+Kategoria"

Zmiana hasła: "∞x +kat +anty" (z ikoną nieskończoności).

C. Panel Kategorii (Szczegółowa Konfiguracja)

Stan Aktywny: Panel kategorii posiada różową ramkę (outline), wskazującą na aktywną edycję.

Osobne Urządzenie Prezentera: - Specjalny boks z ikoną smartfona.

Tekst opisujący funkcję (mniejszy font pod tytułem).

Toggle switch (przełącznik) z etykietą statusu "WYŁĄCZONE" / "WŁĄCZONE".

Wybór Kategorii (Grid 3xN):

Przyciski kategorii: "Klasyczne", "Filmy i seriale", "Muzyka", "Sport", "Zawody", "Jedzenie", "Miejsca", "Zwierzęta", "Przysłowia".

Kategoria Wybrana (DEV): Różowe obramowanie przycisku.

Tagi poziomu trudności: Pod wybraną kategorią pojawiają się dwa tagi: "Łatwe 5" i "Trudne 5" (fioletowe obramowanie, biały tekst).

Narzędzia Masowe: Przyciski "Wszystkie", "Losowo", "Wyczyść" na dole panelu.

D. Nawigacja Dolna (Footer)

Układ: Stały pasek na dole.

Przycisk Powrót: Ciemnoszary, ikona strzałki w lewo, ok. 30% szerokości.

Przycisk Start: Magenta/Różowy, szeroki (ok. 70% szerokości), tekst pogrubiony.

4. Interakcje

Kliknięcie w kategorię powinno przełączać jej stan (aktywna/nieaktywna).

Przełącznik "Osobne urządzenie" powinien zmieniać kolor i etykietę po kliknięciu.

Przyciski powinny posiadać subtelny efekt "hover" lub "active" (zmniejszenie opacity).

5. Wytyczne Techniczne (dla AI)

Użyj Flexbox i CSS Grid do zachowania idealnych proporcji.

Zastosuj box-sizing: border-box, aby ramki nie rozpychały kontenerów.

Zachowaj odpowiednie odstępy (padding/gap) – ok. 12px-16px między elementami.