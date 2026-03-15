Dokument Wytycznych UI/UX - Project PARTY

Ten dokument zawiera techniczne wytyczne UI/UX oraz specyfikację designu na podstawie aktualnego kodu HTML/Tailwind. Służy on jako punkt odniesienia do zachowania spójności wizualnej platformy.

1. Fundamenty Wizualne i Konfiguracja (Theme)

Paleta Kolorystyczna (Tailwind Config)

Zastosowana paleta opiera się na głębokiej czerni i neonowych akcentach:

background-dark (#09090B): Główne tło strony.

surface-dark (#18181B): Tło kart gier.

surface-light (#27272A): Tło interaktywnych elementów (np. pigułka profilu).

primary (#A855F7): Elektryczny fiolet (Electric Purple).

secondary (#06B6D4): Cyjan (Cyan).

text-high (#FFFFFF): Maksymalny kontrast dla nagłówków.

text-med (#A1A1AA): Standardowy kolor tekstu opisu.

Typografia

Nagłówki (Display): Space Grotesk – używany do dużych tytułów (Hero, Nazwy gier).

Body: Plus Jakarta Sans – używany do opisów i interfejsu.

2. Zaawansowane Elementy Designu

2.1. Efekty Tła (Ambient Light)

Aby uzyskać głębię, należy stosować rozmyte elipsy w tle:

Górne światło: bg-primary/20 z blur-[120px], centrowane na górze.

Dolne światło: bg-secondary/10 z blur-[100px], w prawym dolnym rogu.

2.2. Glassmorphism (Panel szklany)

Wszystkie panele (Header, Filter Bar) wykorzystują klasę .glass-panel:

backdrop-blur-xl – mocne rozmycie tła.

bg-surface-dark/60 – półprzezroczyste tło.

border-white/10 – bardzo cienka, subtelna ramka.

2.3. Efekty Glow (Blask)

shadow-glow-primary: Cień fioletowy 0 0 20px -5px rgba(168, 85, 247, 0.5).

shadow-glow-cyan: Cień cyjanowy 0 0 20px -5px rgba(6, 182, 212, 0.5).

text-glow: Delikatna poświata tekstu text-shadow: 0 0 20px rgba(168, 85, 247, 0.3).

3. Specyfikacja Komponentów

3.1. Header (Nawigacja)

Wysokość i layout: h-20, pozycjonowanie sticky top-0 z-50. Wykorzystuje efekt .glass-panel.

Logo: Ikona (błyskawica) zamknięta w zaokrąglonym kwadracie (w-8 h-8 rounded-lg) z gradientem from-primary to-secondary oraz efektem shadow-glow-primary. Obok pogrubiony napis Project PARTY (Space Grotesk, 20px).

Profil Użytkownika (Pigułka): Element button, tło bg-surface-light/50, na hover jaśniejsze. Wewnątrz:

Awatar: Kółko (w-8 h-8) z gradientowym tłem z ukrytym overflow i zdjęciem obiektu.

Nazwa użytkownika: Tekst szary przechodzący w biały na hover.

Ikona strzałki w dół (expand_more).

3.2. Sekcja Hero

Wyrównanie: Tekst wycentrowany (text-center).

Główny Nagłówek: Krój Space Grotesk, rozmiar 5xl/6xl, poświata .text-glow.

Wyróżnione słowa ("dzisiejszą imprezę"): Potrójny gradient tekstu (bg-clip-text text-transparent bg-gradient-to-r from-primary via-fuchsia-400 to-secondary).

Podtytuł: Jasnoszary (text-text-med), rozmiar text-xl, normalna grubość.

3.3. Pasek Filtrów (Filter Bar)

Układ: inline-flex z pełnym zaokrągleniem rounded-full.

Separatory: Pionowe linie w-px h-6 bg-white/10 oddzielające sekcje dropdownów i przycisk wyszukiwania.

Dropdowny: Tło interaktywne na hover:bg-white/10, cienka, przezroczysta ramka zmieniająca się na hover:border-white/10.

3.4. Karta Gry (Game Card)

Struktura główna: Kontener z klasą .card-gradient-border (gradientowa ramka 1px maskująca krawędzie).

Zdjęcie (Image Area): * Wysokość 180px, obiekt object-cover. Na dole obrazka gradient do koloru tła (from-surface-dark via-transparent opacity-80), który maskuje twardą krawędź zdjęcia.

Hover State (Cała karta): scale-105 na obrazku, -translate-y-1 na karcie oraz aktywacja specyficznego cienia glow. Uwaga: Karty używają naprzemiennie hover:shadow-glow-primary i hover:shadow-glow-cyan dla urozmaicenia.

Status Badge (Etykieta w prawym górnym rogu): * Półprzezroczysty czarny panel (bg-black/60 backdrop-blur-md).

Dostępna: Zielona kropka z własnym poświetleniem shadow-[0_0_8px_rgba(34,197,94,0.8)].

W przygotowaniu: Bursztynowa kropka z poświetleniem shadow-[0_0_8px_rgba(245,158,11,0.8)].

Opis Gry (Description): Przycięty do dwóch linijek tekstu (klasa line-clamp-2), aby utrzymać równą wysokość wszystkich kart.

Separator (Divider): Linia grubości 1px (h-px w-full bg-white/5 mb-5) oddzielająca opis od tagów/wymagań sprzętowych.

Tagi Metadanych (Gracze / Urządzenia): Małe pigułki (bg-surface-light/50 px-2.5 py-1 rounded-md border border-white/5) z ikoną w kolorze secondary (Cyjan) i jasnoszarym tekstem.

3.5. Przyciski CTA na karcie

Stan Aktywny ("Zobacz szczegóły"): Obramowanie border-white/20, tekst biały. Na hover: tło i ramka zmienia się na primary lub secondary (zależnie od karty), pojawia się glow, a ikona strzałki przesuwa w prawo (group-hover/btn:translate-x-1).

Stan Nieaktywny ("Już wkrótce"): Opacity zmniejszone, karta w odcieniach szarości (grayscale), przycisk ma kursor not-allowed, obramowanie border-white/10 i szary tekst z ikoną kłódki.

4. Wytyczne Techniczne (Code Standards) i Layout

Szerokość i Centrowanie (Layout):

Pasek nawigacji i sekcja z grami są ujęte w kontenery o maksymalnej szerokości max-w-7xl z wyśrodkowaniem mx-auto.

Główna sekcja <main> posiada flex-grow (zajmuje całą wolną przestrzeń wysokości ekranu).

Ikony: Wykorzystanie fontu Material Symbols Outlined o zmiennej wadze (wbudowanego za pomocą Google Fonts).

Responsywność siatki gier:

Mobile: 1 kolumna (grid-cols-1).

Tablet: 2 kolumny (md:grid-cols-2).

Desktop: 3 kolumny (lg:grid-cols-3), odstępy między kartami gap-8.

Warstwy (Z-index): Elementy tła rozmytego (-z-10), Header (z-50), Content / Hero relative (z-10).

Animacje (Transitions): Każdy element interaktywny musi posiadać klasę transition-all (najczęściej duration-300 lub duration-500 dla zdjęć) w celu płynności efektów hover.