// ──────────────────────────────────────────────
// Tajniacy – bazy haseł
// ──────────────────────────────────────────────

export const standardWords: string[] = [
  // Zwierzęta / natura
  "BÓBR", "ORZEŁ", "ŻYRAFA", "DELFIN", "KROKODYL",
  "PANTERA", "SOKÓŁ", "ŻÓŁW", "PINGWIN", "KOLIBER",
  "SŁOŃ", "TYGRYS", "JELEŃ", "PAPUGA", "FOKA",
  "WILK", "NIEDŹWIEDŹ", "KAMELEON", "KRUK", "MOTYL",

  // Jedzenie / kuchnia
  "PIZZA", "SUSHI", "CHLEB", "MASŁO", "PIEPRZ",
  "DŻEM", "BANAN", "CZEKOLADA", "KAWA", "HERBATA",
  "CIASTO", "NALEŚNIK", "PIEROGI", "BARSZCZ", "MAKARON",
  "RYŻ", "SER", "MIÓD", "OLIWA", "CYTRYNA",

  // Miejsca / geografia
  "ZAMEK", "PUSTYNIA", "WYSPA", "WULKAN", "JASKINIA",
  "PLAŻA", "GÓRA", "WODOSPAD", "MOST", "LATARNIA",
  "WIEŻA", "PORT", "RYNEK", "STACJA", "TUNEL",
  "GRANICA", "STOLICA", "DOLINA", "RZEKA", "JEZIORO",

  // Przedmioty / rzeczy
  "KLUCZ", "LUSTRO", "KOMPAS", "ZEGAREK", "KORONA",
  "MIECZ", "TARCZA", "ŁAŃCUCH", "PARASOL", "SKRZYPCE",
  "FORTEPIAN", "BĘBEN", "FLET", "GITARA", "TRĄBKA",
  "GLOBUS", "LORNETKA", "MIKROSKOP", "RAKIETA", "ANTENA",

  // Pojęcia / abstrakcje
  "CIEŃ", "BŁYSK", "ECHO", "IRONIA", "GRYMAS",
  "PSIKUS", "PSOTY", "PARODIA", "LABIRYNT", "ZAGADKA",
  "SEKRET", "MARZENIE", "CISZA", "BURZA", "ISKRA",
  "DUCH", "LEGENDA", "MIT", "WIZJA", "TĘSKNOTA",

  // Technologia / nauka
  "ROBOT", "LASER", "ATOM", "ORBIT", "RADAR",
  "SYGNAŁ", "ANTENA", "BATERIA", "SILNIK", "TURBINA",
  "PROCESOR", "SERWER", "DRON", "HOLOGRAM", "SATELITA",
  "TELESKOP", "SONDA", "KAPSUŁA", "MODUŁ", "PANEL",

  // Sport / rozrywka
  "PIŁKA", "BRAMKA", "KORT", "RING", "ARENA",
  "MEDAL", "PUCHAR", "SPRINT", "MARATON", "SLALOM",
  "DESKA", "KAJAK", "ŻAGIEL", "WIOSŁO", "RĘKAWICA",
  "KASK", "OBRĘCZ", "SIATKA", "TRAMPOLIN", "TOR",

  // Zawody / ludzie
  "SZPIEG", "DETEKTYW", "PIRAT", "RYCERZ", "KAPITAN",
  "PILOT", "KOSMONAUTA", "AKTOR", "MAGIK", "KUCHARZ",
  "STRAŻAK", "LEKARZ", "SĘDZIA", "ARCHITEKT", "MALARZ",
  "RZEŹBIARZ", "MUZYK", "TANCERZ", "POETA", "KRÓL",

  // Dom / życie codzienne
  "OKNO", "DRZWI", "KOMIN", "DACH", "SCHODY",
  "PIWNICA", "STRYCH", "OGRÓD", "PŁOT", "GARAŻ",
  "KURTKA", "RĘKAW", "GUZIK", "SUWAK", "KAPTUR",
  "PODUSZKA", "KOŁDRA", "DYWAN", "LAMPA", "ŚWIECA",

  // Emocje / cechy
  "ODWAGA", "HONOR", "LOJALNOŚĆ", "ZDRADA", "PODSTĘP",
  "SPOKÓJ", "GNIEW", "RADOŚĆ", "SMUTEK", "STRACH",
  "NADZIEJA", "TĘSKNOTA", "ZAZDROŚĆ", "DUMA", "WSTYD",
  "LITOŚĆ", "ZEMSTA", "POKUSA", "PASJA", "NUDA",
];

export const uncensoredWords: string[] = [
  // Imprezy / alkohol
  "WÓDKA", "PIWO", "KIELISZEK", "TOAST", "KATER",
  "MELANŻ", "DYSKOTEKA", "BARMAN", "KOKTAJL", "SZOT",
  "DRINK", "PIJANY", "FLASZKA", "BIMBER", "NALEWKA",
  "TEQUILA", "WHISKY", "ABSINTH", "SAMBUCA", "GRZANIEC",

  // Kontrowersyjne / dorosłe
  "BURDEL", "KOCHANEK", "ROMANS", "SEKS", "BIELIZNA",
  "STRIPTIZ", "FETYSZ", "TABU", "GRZECH", "POKUSA",
  "SKANDAL", "PLOTKA", "SZANTAŻ", "PRZEKRĘT", "ŁAPÓWKA",
  "PRZEMYT", "KŁAMSTWO", "OSZUST", "ZDRAJCA", "SZUJA",

  // Slang / potoczne
  "ŁAJZA", "LESER", "NYGUS", "CWANIAK", "KOMBINATOR",
  "IMPREZKA", "BAŁAGAN", "KOSZMAR", "WKURZENIE", "SZAŁ",
  "JAZDA", "AKCJA", "BEKA", "ŻART", "WTOPA",
  "WPADKA", "OBCIACH", "ŻENADA", "CRINGE", "LAJT",

  // Ciało / fizjologia
  "MUSKUŁ", "TATUAŻ", "BLIZNA", "CELLULIT", "ZMARSZCZKA",
  "PUPKA", "BRZUCH", "BICEPS", "ŁYDKA", "PĘPEK",
  "PAZNOKIEĆ", "KRĘGOSŁUP", "BIODRO", "KOLANO", "ŁOKIEĆ",
  "ŻEBRO", "NADGARSTEK", "KOŚĆ", "ŚCIĘGNO", "KOSTKA",

  // Ostre tematy
  "HAZARD", "DŁUG", "BANKRUT", "LICHWA", "SPEKULANT",
  "LOCHA", "CELA", "KAJDANKI", "WYROK", "PROCES",
  "PROKURATOR", "ŚWIADEK", "ALIBI", "MOTYW", "DOWÓD",
  "OFIARA", "PODEJRZANY", "UCIECZKA", "POŚCIG", "ZASADZKA",

  // Narkotyki / używki
  "PAPIEROS", "CYGAR", "FAJKA", "DYMEK", "NIKOTYNA",
  "KOFEINA", "UZALEŻNIENIE", "ODWYK", "KLINIKA", "TERAPIA",
  "NAŁÓG", "ABSTYNENCJA", "DETOKS", "DAWKA", "RECYDYWA",
  "DEALER", "MELAN", "KARTEL", "MAFIA", "BOSS",

  // Dodatkowe +18
  "BÓJKA", "KŁÓTNIA", "ZEMSTA", "VENDETTA", "INTRYGANT",
  "MANIPULACJA", "PROWOKACJA", "SABOTAŻ", "ZDRADA", "KONSPIRACJA",
  "SPISEK", "ZAMACH", "REBELIA", "BUNT", "ANARCHIA",
  "CHAOS", "DESTRUKCJA", "DEMOLKA", "AWANTURA", "AFERA",
];

/**
 * Pobiera pulę haseł dla wybranej kategorii.
 * Zwraca nową kopię tablicy, żeby shuffle nie mutował oryginału.
 */
export function getWordPool(category: "standard" | "uncensored"): string[] {
  if (category === "uncensored") {
    return [...uncensoredWords];
  }
  return [...standardWords];
}
