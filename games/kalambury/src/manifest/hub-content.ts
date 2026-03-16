const classicModeHeroAsset = new URL(
  "../assets/kalambury-mode-classic-line-art.svg",
  import.meta.url,
).href;
const teamModeHeroAsset = new URL(
  "../assets/kalambury-mode-team-line-art.svg",
  import.meta.url,
).href;

import type { KalamburySymbolName } from "../shared/SymbolIcon";

export type KalamburyHubMode = {
  id: "classic" | "team";
  title: string;
  status: "available" | "coming_soon";
  statusLabel: string;
  summary: string;
  metaLabel: string;
  metaIcon: KalamburySymbolName;
  ctaLabel: string;
  ctaDisabled: boolean;
  heroAsset: string;
  heroAssetAlt: string;
  featured: boolean;
};

export type KalamburyHubModeDirection = "next" | "previous";

export type KalamburyHubSettingsTabId =
  | "sound"
  | "animations"
  | "connection"
  | "data"
  | "controls"
  | "about";

export type KalamburyHubContent = {
  heading: string;
  description: string;
  primaryActionLabel: string;
  topbar: {
    brandLabel: string;
    authLabel: string;
  };
  sidebar: {
    primaryItems: Array<{
      id: "play" | "settings";
      label: string;
      icon: KalamburySymbolName;
      active: boolean;
    }>;
    settingsItems: Array<{
      id: "back";
      label: string;
      icon: KalamburySymbolName;
    }>;
  };
  modePicker: {
    activeModeId: KalamburyHubMode["id"];
    modes: KalamburyHubMode[];
  };
  settingsPanel: {
    heading: string;
    description: string;
    activeTabId: KalamburyHubSettingsTabId;
    tabs: Array<{
      id: KalamburyHubSettingsTabId;
      label: string;
      icon: KalamburySymbolName;
      title: string;
      description: string;
      items?: string[];
    }>;
  };
  footerStatus: {
    serverLabel: string;
    serverValue: string;
    regionLabel: string;
    regionValue: string;
    playersLabel: string;
    playersValue: string;
    copyright: string;
    version: string;
  };
};

const modes: KalamburyHubMode[] = [
  {
    id: "classic",
    title: "Klasyczny",
    status: "available",
    statusLabel: "Polecane",
    summary:
      "Indywidualne zgadywanie gestow i mimiki. Pokaz haslo bez slow i zdobywaj punkty za kazde odgadniete zadanie.",
    metaLabel: "2-8 Graczy",
    metaIcon: "person",
    ctaLabel: "Wybierz",
    ctaDisabled: false,
    heroAsset: classicModeHeroAsset,
    heroAssetAlt: "Ilustracja klasycznego trybu Kalambury.",
    featured: true,
  },
  {
    id: "team",
    title: "Druzynowy",
    status: "coming_soon",
    statusLabel: "W przygotowaniu",
    summary:
      "Wspolpraca w grupach i zacieta rywalizacja. Idealny wybor na wieczor ze znajomymi.",
    metaLabel: "15-45 Min",
    metaIcon: "timer",
    ctaLabel: "Wkrotce",
    ctaDisabled: true,
    heroAsset: teamModeHeroAsset,
    heroAssetAlt: "Ilustracja druzynowego trybu Kalambury.",
    featured: false,
  },
];

const settingsTabs: KalamburyHubContent["settingsPanel"]["tabs"] = [
  {
    id: "sound",
    label: "Dzwiek",
    icon: "volume_up",
    title: "Dzwiek",
    description:
      "Ustaw poziomy audio i przygotuj miks pod rozgrywke na TV lub w salonie.",
    items: [
      "Glosnosc muzyki tla, stingow i efektow punktowych.",
      "Szybkie wyciszenie lobby i rundy jednym ruchem.",
      "Krotki test audio przed startem kolejnej sesji.",
    ],
  },
  {
    id: "animations",
    label: "Animacje",
    icon: "animation",
    title: "Animacje",
    description: "Kontrola dynamiki ekranu, przejsc i ruchu elementow sceny.",
    items: [
      "Tryb pelny dla wieczoru w stylu show.",
      "Tryb spokojniejszy dla dlugiej sesji na TV.",
      "Opcja szybkiego ograniczenia motion bez zmiany layoutu.",
    ],
  },
  {
    id: "connection",
    label: "Połączenie",
    icon: "wifi",
    title: "Tryb połączenia",
    description: "Wybierz sposób w jaki urządzenia łączą się podczas rozgrywki.",
    // items intentionally omitted — HostApp renders ConnectionModePanel for this tab
  },
  {
    id: "data",
    label: "Dane",
    icon: "database",
    title: "Dane",
    description: "Podglad danych sesji i zachowania lokalnych ustawien gry.",
    items: [
      "Status lokalnego setupu i wybranych kategorii.",
      "Reset zapisanych ustawien przed nowa sesja.",
      "Zapis ustawien lokalnych dla kolejnych uruchomien gry.",
    ],
  },
  {
    id: "controls",
    label: "Sterowanie",
    icon: "sports_esports",
    title: "Sterowanie",
    description:
      "Uproszczone sterowanie pod pilota, klawiature i szybkie akcje hosta.",
    items: [
      "Mapowanie glownego CTA i cofania.",
      "Czytelne akcje dla hosta w setupie i podczas rundy.",
      "Obsluga dodatku telefonu prezentera w klasycznym flow gry.",
    ],
  },
  {
    id: "about",
    label: "O grze",
    icon: "info",
    title: "O grze",
    description: "Najwazniejsze informacje o wersji i samej rozgrywce.",
    items: [
      "Biezaca wersja Kalamburow dla rozgrywki na jednym ekranie.",
      "Krotki opis trybu klasycznego i dodatku prezentera.",
      "Credits i changelog modulu Kalambury.",
    ],
  },
];

function getKalamburyHubModeIndex(
  hubModes: KalamburyHubMode[],
  activeModeId: KalamburyHubMode["id"],
) {
  const modeIndex = hubModes.findIndex((mode) => mode.id === activeModeId);

  return modeIndex >= 0 ? modeIndex : 0;
}

export function getKalamburyHubNextModeId(
  hubModes: KalamburyHubMode[],
  activeModeId: KalamburyHubMode["id"],
  offset: -1 | 1,
) {
  const modeIndex = getKalamburyHubModeIndex(hubModes, activeModeId);
  const nextIndex = (modeIndex + offset + hubModes.length) % hubModes.length;

  return hubModes[nextIndex].id;
}

export function isKalamburyHubModePlayable(mode: KalamburyHubMode) {
  return mode.status === "available" && !mode.ctaDisabled;
}

export function getKalamburyHubContent(): KalamburyHubContent {
  return {
    heading: "Wybierz tryb gry",
    description:
      "Wybierz w jaki sposob chcesz pokazywac hasla. Kazdy tryb oferuje unikalne wyzwania oparte na gestach i mimice.",
    primaryActionLabel: "Graj",
    topbar: {
      brandLabel: "Kalambury",
      authLabel: "Zaloguj",
    },
    sidebar: {
      primaryItems: [
        { id: "play", label: "Graj teraz", icon: "play_circle", active: true },
        {
          id: "settings",
          label: "Ustawienia",
          icon: "settings",
          active: false,
        },
      ],
      settingsItems: [{ id: "back", label: "Powrot do Lobby", icon: "logout" }],
    },
    modePicker: {
      activeModeId: "classic",
      modes,
    },
    settingsPanel: {
      heading: "Ustawienia gry",
      description:
        "Dostosuj dzwiek, animacje i zachowanie gry pod swoja sesje.",
      activeTabId: "sound",
      tabs: settingsTabs,
    },
    footerStatus: {
      serverLabel: "Serwery",
      serverValue: "Online",
      regionLabel: "Region",
      regionValue: "EU-CENTRAL",
      playersLabel: "Graczy online",
      playersValue: "12,402",
      copyright: "(c) 2024 Kalambury Game Studios",
      version: "Wersja 2.4.0",
    },
  };
}
