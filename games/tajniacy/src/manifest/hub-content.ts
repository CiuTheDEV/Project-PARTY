// ──────────────────────────────────────────────
// Tajniacy – Hub content (analogiczny do Kalambury)
// ──────────────────────────────────────────────

export type TajniacyHubMode = {
  id: "classic" | "blitz";
  title: string;
  status: "available" | "coming_soon";
  statusLabel: string;
  summary: string;
  metaLabel: string;
  metaIcon: string;
  ctaLabel: string;
  ctaDisabled: boolean;
  featured: boolean;
};

export type TajniacyHubSettingsTabId =
  | "sound"
  | "data"
  | "about";

export type TajniacyHubContent = {
  heading: string;
  description: string;
  primaryActionLabel: string;
  topbar: {
    brandLabel: string;
    authLabel: string;
  };
  sidebar: {
    primaryItems: Array<{
      id: "play" | "settings" | "stats";
      label: string;
      icon: string;
      active: boolean;
    }>;
  };
  modePicker: {
    activeModeId: TajniacyHubMode["id"];
    modes: TajniacyHubMode[];
  };
  settingsPanel: {
    heading: string;
    description: string;
    activeTabId: TajniacyHubSettingsTabId;
    tabs: Array<{
      id: TajniacyHubSettingsTabId;
      label: string;
      icon: string;
      title: string;
      description: string;
      items: string[];
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

const modes: TajniacyHubMode[] = [
  {
    id: "classic",
    title: "Klasyczny",
    status: "available",
    statusLabel: "Polecane",
    summary:
      "Dwie druzyny, 25 hasel i strategia skojarzen. Odkryj wszystkie kryptonimy przed przeciwnikiem — ale uwazaj na zabojce!",
    metaLabel: "4-10 Graczy",
    metaIcon: "group",
    ctaLabel: "Wybierz",
    ctaDisabled: false,
    featured: true,
  },
  {
    id: "blitz",
    title: "Blitz",
    status: "coming_soon",
    statusLabel: "W przygotowaniu",
    summary:
      "Szybka wersja z mniejsza plansza i limitem czasu na ture. Idealna na krotkie sesje.",
    metaLabel: "10-20 Min",
    metaIcon: "timer",
    ctaLabel: "Wkrotce",
    ctaDisabled: true,
    featured: false,
  },
];

const settingsTabs: TajniacyHubContent["settingsPanel"]["tabs"] = [
  {
    id: "sound",
    label: "Dzwiek",
    icon: "volume_up",
    title: "Dzwiek",
    description:
      "Ustaw poziomy audio i przygotuj miks pod rozgrywke w salonie.",
    items: [
      "Glosnosc muzyki tla i efektow.",
      "Szybkie wyciszenie podczas tury.",
      "Test audio przed startem sesji.",
    ],
  },
  {
    id: "data",
    label: "Dane",
    icon: "database",
    title: "Dane",
    description: "Podglad danych sesji i zachowania lokalnych ustawien gry.",
    items: [
      "Status lokalnego setupu i wybranych tali.",
      "Reset zapisanych ustawien przed nowa sesja.",
      "Zapis ustawien lokalnych.",
    ],
  },
  {
    id: "about",
    label: "O grze",
    icon: "info",
    title: "O grze",
    description: "Najwazniejsze informacje o wersji i grze.",
    items: [
      "Biezaca wersja Tajniakow.",
      "Opis trybu klasycznego.",
      "Credits i changelog modulu Tajniacy.",
    ],
  },
];

export function isHubModePlayable(mode: TajniacyHubMode) {
  return mode.status === "available" && !mode.ctaDisabled;
}

export function getHubNextModeId(
  hubModes: TajniacyHubMode[],
  activeModeId: TajniacyHubMode["id"],
  offset: -1 | 1,
) {
  const modeIndex = hubModes.findIndex((m) => m.id === activeModeId);
  const idx = modeIndex >= 0 ? modeIndex : 0;
  const next = (idx + offset + hubModes.length) % hubModes.length;
  return hubModes[next].id;
}

export function getTajniacyHubContent(): TajniacyHubContent {
  return {
    heading: "Wybierz tryb gry",
    description:
      "Rywalizuj wiedza i skojarzeniami. Kazdy tryb oferuje unikalne wyzwania druzyn i spoleczna strategiczna rozgrywke.",
    primaryActionLabel: "Graj",
    topbar: {
      brandLabel: "Tajniacy",
      authLabel: "Zaloguj",
    },
    sidebar: {
      primaryItems: [
        { id: "play", label: "Graj teraz", icon: "play_circle", active: true },
        {
          id: "stats",
          label: "Statystyki",
          icon: "leaderboard",
          active: false,
        },
        {
          id: "settings",
          label: "Ustawienia",
          icon: "settings",
          active: false,
        },
      ],
    },
    modePicker: {
      activeModeId: "classic",
      modes,
    },
    settingsPanel: {
      heading: "Ustawienia gry",
      description:
        "Dostosuj dzwiek i zachowanie gry pod swoja sesje druzyn.",
      activeTabId: "sound",
      tabs: settingsTabs,
    },
    footerStatus: {
      serverLabel: "Serwery",
      serverValue: "Online",
      regionLabel: "Region",
      regionValue: "EU-CENTRAL",
      playersLabel: "Graczy online",
      playersValue: "8,291",
      copyright: "(c) 2024 Tajniacy Game Studios",
      version: "Wersja 0.1.0",
    },
  };
}
