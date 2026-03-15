export type KalamburyAvatarCategory = "ludzie" | "zwierzeta" | "inne";

export type KalamburyPlayerGender = "female" | "male";

export type KalamburyPlayerAvatarOption = {
  id: string;
  category: KalamburyAvatarCategory;
  label: string;
  emoji: string;
};

export type KalamburySetupPlayer = {
  id: string;
  name: string;
  avatar: string;
  avatarId: string;
  avatarCategory: KalamburyAvatarCategory;
  gender: KalamburyPlayerGender;
};

export type KalamburyPlayerDraft = {
  name: string;
  avatarId: string | null;
  avatarCategory: KalamburyAvatarCategory;
  gender: KalamburyPlayerGender | null;
};

export type KalamburyModeSection =
  | "rounds"
  | "hints"
  | "phraseChange"
  | "events";

export type KalamburyModeSettings = {
  roundModeLabel: string;
  turnDurationSeconds: number;
  hintsLabel: string;
  phraseChangeLabel: string;
  rounds: {
    turnDurationSeconds: number;
    winCondition: "rounds" | "points";
    roundCount: number;
    pointsTarget: number;
  };
  hints: {
    enabled: boolean;
    showWordCount: boolean;
    showCategory: boolean;
  };
  phraseChange: {
    enabled: boolean;
    changesPerPlayer: number | "infinite";
    rerollWordOnly: boolean;
    rerollWordAndCategory: boolean;
    antiCategoryStreak: boolean;
  };
  events: {
    enabled: boolean;
    chancePercent: number;
    goldenPointsEnabled: boolean;
    rushEnabled: boolean;
    noRepeatWindow: number;
  };
};

export type KalamburyCategoryDifficulty = "easy" | "hard";

export type KalamburyCategoryOption = {
  id: string;
  label: string;
  easyCount: number;
  hardCount: number;
  easyEnabled: boolean;
  hardEnabled: boolean;
  isSelected: boolean;
};

export type KalamburySetupSummary = {
  id: "rounds" | "hints" | "phrase";
  label: string;
  value: string;
};

export type KalamburySetupState = {
  playerLimit: {
    min: number;
    max: number;
  };
  players: KalamburySetupPlayer[];
  modeSettings: KalamburyModeSettings;
  presenterDeviceEnabled: boolean;
  pairedPresenterDeviceId: string | null;
  categories: KalamburyCategoryOption[];
  activeCategoryId: string;
};

const avatarCatalog = [
  {
    id: "person-smile-f",
    category: "ludzie",
    label: "Usmiechnieta",
    emoji: "\u{1F642}",
  },
  {
    id: "person-laugh-f",
    category: "ludzie",
    label: "Rozesmiana",
    emoji: "\u{1F604}",
  },
  {
    id: "person-halo-m",
    category: "ludzie",
    label: "Aniolek",
    emoji: "\u{1F607}",
  },
  {
    id: "person-heart-f",
    category: "ludzie",
    label: "Serca",
    emoji: "\u{1F970}",
  },
  {
    id: "person-star-m",
    category: "ludzie",
    label: "Gwiazda",
    emoji: "\u{1F929}",
  },
  {
    id: "person-cool-m",
    category: "ludzie",
    label: "Cool",
    emoji: "\u{1F60E}",
  },
  { id: "cat", category: "zwierzeta", label: "Kot", emoji: "\u{1F431}" },
  { id: "dog", category: "zwierzeta", label: "Pies", emoji: "\u{1F436}" },
  { id: "fox", category: "zwierzeta", label: "Lis", emoji: "\u{1F98A}" },
  { id: "panda", category: "zwierzeta", label: "Panda", emoji: "\u{1F43C}" },
  { id: "ghost", category: "inne", label: "Duch", emoji: "\u{1F47B}" },
  { id: "robot", category: "inne", label: "Robot", emoji: "\u{1F916}" },
  { id: "alien", category: "inne", label: "Obcy", emoji: "\u{1F47D}" },
  { id: "unicorn", category: "inne", label: "Jednorozec", emoji: "\u{1F984}" },
] as const satisfies readonly KalamburyPlayerAvatarOption[];

export const kalamburyAvatarOptions: Record<
  KalamburyAvatarCategory,
  KalamburyPlayerAvatarOption[]
> = {
  ludzie: avatarCatalog.filter((avatar) => avatar.category === "ludzie"),
  zwierzeta: avatarCatalog.filter((avatar) => avatar.category === "zwierzeta"),
  inne: avatarCatalog.filter((avatar) => avatar.category === "inne"),
};

const playerBlueprints = [
  { name: "Ewka", avatarId: "person-smile-f", gender: "female" },
  { name: "Mateo", avatarId: "person-cool-m", gender: "male" },
  { name: "Lena", avatarId: "person-laugh-f", gender: "female" },
  { name: "Kuba", avatarId: "person-star-m", gender: "male" },
  { name: "Ola", avatarId: "person-heart-f", gender: "female" },
  { name: "Bartek", avatarId: "robot", gender: "male" },
  { name: "Iga", avatarId: "cat", gender: "female" },
  { name: "Antek", avatarId: "fox", gender: "male" },
  { name: "Zosia", avatarId: "ghost", gender: "female" },
  { name: "Igor", avatarId: "dog", gender: "male" },
  { name: "Nadia", avatarId: "unicorn", gender: "female" },
  { name: "Maja", avatarId: "unicorn", gender: "female" },
] as const satisfies readonly {
  name: string;
  avatarId: string;
  gender: KalamburyPlayerGender;
}[];

const categoryBlueprints = [
  { id: "klasyczne", label: "Klasyczne", easyCount: 5, hardCount: 5 },
  {
    id: "filmy-i-seriale",
    label: "Filmy i seriale",
    easyCount: 5,
    hardCount: 5,
  },
  { id: "muzyka", label: "Muzyka", easyCount: 5, hardCount: 5 },
  { id: "sport", label: "Sport", easyCount: 5, hardCount: 5 },
  { id: "zawody", label: "Zawody", easyCount: 5, hardCount: 5 },
  { id: "jedzenie", label: "Jedzenie", easyCount: 5, hardCount: 5 },
  { id: "miejsca", label: "Miejsca", easyCount: 5, hardCount: 5 },
  { id: "zwierzeta", label: "Zwierzeta", easyCount: 5, hardCount: 5 },
  { id: "przyslowia", label: "Przyslowia", easyCount: 5, hardCount: 5 },
  { id: "dev", label: "DEV", easyCount: 5, hardCount: 5 },
] as const;

export function getKalamburyAvatarOptionById(
  avatarId: string,
): KalamburyPlayerAvatarOption {
  return (
    avatarCatalog.find((avatar) => avatar.id === avatarId) ?? {
      id: avatarId,
      category: "inne",
      label: avatarId,
      emoji: "\u{2753}",
    }
  );
}

function createModeSettings(): KalamburyModeSettings {
  return {
    roundModeLabel: "Rundy",
    turnDurationSeconds: 15,
    hintsLabel: "Slowa + kategoria",
    phraseChangeLabel: "INFx +kat +anty",
    rounds: {
      turnDurationSeconds: 15,
      winCondition: "rounds",
      roundCount: 1,
      pointsTarget: 10,
    },
    hints: {
      enabled: true,
      showWordCount: true,
      showCategory: true,
    },
    phraseChange: {
      enabled: true,
      changesPerPlayer: "infinite",
      rerollWordOnly: false,
      rerollWordAndCategory: true,
      antiCategoryStreak: true,
    },
    events: {
      enabled: false,
      chancePercent: 0,
      goldenPointsEnabled: false,
      rushEnabled: false,
      noRepeatWindow: 0,
    },
  };
}

export function createKalamburySetupPlayerFromDraft(
  id: string,
  draft: KalamburyPlayerDraft,
): KalamburySetupPlayer {
  if (!draft.avatarId || !draft.gender) {
    throw new Error("Kalambury player draft is incomplete");
  }

  const avatar = getKalamburyAvatarOptionById(draft.avatarId);

  return {
    id,
    name: draft.name.trim(),
    avatar: avatar.emoji,
    avatarId: avatar.id,
    avatarCategory: draft.avatarCategory,
    gender: draft.gender,
  };
}

function createSetupPlayer(
  id: string,
  name: string,
  avatarId: string,
  gender: KalamburyPlayerGender,
): KalamburySetupPlayer {
  return createKalamburySetupPlayerFromDraft(id, {
    name,
    avatarId,
    avatarCategory: getKalamburyAvatarOptionById(avatarId).category,
    gender,
  });
}

export function createInitialKalamburyPlayerDraft(): KalamburyPlayerDraft {
  return {
    name: "",
    avatarId: null,
    avatarCategory: "ludzie",
    gender: null,
  };
}

export function createInitialKalamburySetupState(): KalamburySetupState {
  return {
    playerLimit: {
      min: 2,
      max: 12,
    },
    players: playerBlueprints
      .slice(0, 2)
      .map((player, index) =>
        createSetupPlayer(
          `player-${index + 1}`,
          player.name,
          player.avatarId,
          player.gender,
        ),
      ),
    modeSettings: createModeSettings(),
    presenterDeviceEnabled: false,
    pairedPresenterDeviceId: null,
    categories: categoryBlueprints.map((category) => ({
      ...category,
      easyEnabled: false,
      hardEnabled: false,
      isSelected: false,
    })),
    activeCategoryId: "",
  };
}

export function addKalamburySetupPlayer(
  players: KalamburySetupPlayer[],
  maxPlayers: number,
): KalamburySetupPlayer[] {
  if (players.length >= maxPlayers) {
    return players;
  }

  const blueprint = playerBlueprints[players.length] ?? {
    name: `Gracz ${players.length + 1}`,
    avatarId: "ghost",
    gender: "male" as KalamburyPlayerGender,
  };

  return [
    ...players,
    createSetupPlayer(
      `player-${players.length + 1}`,
      blueprint.name,
      blueprint.avatarId,
      blueprint.gender,
    ),
  ];
}

export function addRandomKalamburySetupPlayer(
  players: KalamburySetupPlayer[],
  maxPlayers: number,
  random: () => number = Math.random,
): KalamburySetupPlayer[] {
  if (players.length >= maxPlayers) {
    return players;
  }

  const usedNames = new Set(players.map((player) => player.name));
  const availableBlueprints = playerBlueprints.filter(
    (blueprint) => !usedNames.has(blueprint.name),
  );
  const randomIndex = Math.max(
    0,
    Math.min(
      availableBlueprints.length - 1,
      Math.floor(random() * Math.max(availableBlueprints.length, 1)),
    ),
  );
  const blueprint = availableBlueprints[randomIndex] ?? {
    name: `Gracz ${players.length + 1}`,
    avatarId:
      avatarCatalog[
        Math.max(
          0,
          Math.min(
            avatarCatalog.length - 1,
            Math.floor(random() * avatarCatalog.length),
          ),
        )
      ]?.id ?? "ghost",
    gender: random() >= 0.5 ? ("male" as const) : ("female" as const),
  };

  return [
    ...players,
    createSetupPlayer(
      `player-${players.length + 1}`,
      blueprint.name,
      blueprint.avatarId,
      blueprint.gender,
    ),
  ];
}

export function removeKalamburySetupPlayer(
  players: KalamburySetupPlayer[],
  playerId: string,
  minPlayers: number,
): KalamburySetupPlayer[] {
  if (players.length <= minPlayers) {
    return players;
  }

  return players.filter((player) => player.id !== playerId);
}

export function getKalamburyModeSettingSummaries(
  settings: KalamburyModeSettings,
): KalamburySetupSummary[] {
  const roundsValue =
    settings.rounds.winCondition === "points"
      ? `Punkty - ${settings.rounds.pointsTarget}`
      : `Rundy - ${settings.rounds.turnDurationSeconds}s`;
  const hintsValue = settings.hints.enabled
    ? [
        settings.hints.showWordCount ? "Slowa" : null,
        settings.hints.showCategory ? "kategoria" : null,
      ]
        .filter(Boolean)
        .join(" + ")
    : "Bez podpowiedzi";
  const phraseValue = settings.phraseChange.enabled
    ? `${settings.phraseChange.changesPerPlayer === "infinite" ? "INFx" : `${settings.phraseChange.changesPerPlayer}x`} +kat +anty`
    : "Bez zmiany";

  return [
    {
      id: "rounds",
      label: "Rozgrywka",
      value: roundsValue,
    },
    {
      id: "hints",
      label: "Podpowiedzi",
      value: hintsValue,
    },
    {
      id: "phrase",
      label: "Zmiana hasla",
      value: phraseValue,
    },
  ];
}

export function toggleKalamburyCategory(
  categories: KalamburyCategoryOption[],
  categoryId: string,
): KalamburyCategoryOption[] {
  return categories.map((category) =>
    category.id === categoryId
      ? {
          ...category,
          isSelected: false,
          easyEnabled: false,
          hardEnabled: false,
        }
      : category,
  );
}

export function toggleKalamburyCategoryDifficulty(
  categories: KalamburyCategoryOption[],
  categoryId: string,
  difficulty: KalamburyCategoryDifficulty,
): KalamburyCategoryOption[] {
  return categories.map((category) => {
    if (category.id !== categoryId) {
      return category;
    }

    const nextEasyEnabled =
      difficulty === "easy" ? !category.easyEnabled : category.easyEnabled;
    const nextHardEnabled =
      difficulty === "hard" ? !category.hardEnabled : category.hardEnabled;

    return {
      ...category,
      easyEnabled: nextEasyEnabled,
      hardEnabled: nextHardEnabled,
      isSelected: nextEasyEnabled || nextHardEnabled,
    };
  });
}

export function resolveKalamburyCategorySelection(
  categories: KalamburyCategoryOption[],
  currentActiveCategoryId: string,
  categoryId: string,
): { categories: KalamburyCategoryOption[]; activeCategoryId: string } {
  const clickedCategory = categories.find(
    (category) => category.id === categoryId,
  );

  if (!clickedCategory) {
    return {
      categories,
      activeCategoryId: currentActiveCategoryId,
    };
  }

  if (!clickedCategory.isSelected) {
    return {
      categories,
      activeCategoryId: categoryId,
    };
  }

  if (currentActiveCategoryId !== categoryId) {
    return {
      categories,
      activeCategoryId: categoryId,
    };
  }

  const nextCategories = toggleKalamburyCategory(categories, categoryId);

  return {
    categories: nextCategories,
    activeCategoryId: getKalamburyActiveCategoryId(nextCategories, categoryId),
  };
}

export function selectAllKalamburyCategories(
  categories: KalamburyCategoryOption[],
): KalamburyCategoryOption[] {
  return categories.map((category) => ({
    ...category,
    easyEnabled: true,
    hardEnabled: true,
    isSelected: true,
  }));
}

export function clearKalamburyCategories(
  categories: KalamburyCategoryOption[],
): KalamburyCategoryOption[] {
  return categories.map((category) => ({
    ...category,
    easyEnabled: false,
    hardEnabled: false,
    isSelected: false,
  }));
}

export function randomizeKalamburyCategories(
  categories: KalamburyCategoryOption[],
  random: () => number = Math.random,
): KalamburyCategoryOption[] {
  if (categories.length === 0) {
    return categories;
  }

  const selectedConfigs = new Map<
    string,
    { easyEnabled: boolean; hardEnabled: boolean }
  >();
  const pool = categories.map((category) => category.id);
  const selectionCount = Math.floor(random() * categories.length) + 1;

  while (selectedConfigs.size < selectionCount && pool.length > 0) {
    const index = Math.floor(random() * pool.length);
    const [pickedId] = pool.splice(index, 1);

    if (!pickedId) {
      continue;
    }

    const difficultyRoll = Math.floor(random() * 3);
    const easyEnabled = difficultyRoll !== 2;
    const hardEnabled = difficultyRoll !== 0;

    selectedConfigs.set(pickedId, {
      easyEnabled,
      hardEnabled,
    });
  }

  return categories.map((category) => {
    const config = selectedConfigs.get(category.id);

    return {
      ...category,
      easyEnabled: config?.easyEnabled ?? false,
      hardEnabled: config?.hardEnabled ?? false,
      isSelected: Boolean(config),
    };
  });
}

export function getKalamburyActiveCategoryId(
  categories: KalamburyCategoryOption[],
  currentActiveCategoryId: string,
): string {
  const currentCategory = categories.find(
    (category) => category.id === currentActiveCategoryId,
  );

  if (currentCategory) {
    return currentActiveCategoryId;
  }

  return categories.find((category) => category.isSelected)?.id ?? "";
}
export type KalamburySetupModeContent = {
  modeId: "classic" | "team";
  eyebrow: string;
  title: string;
  description: string;
  storageKey: string;
  startLabel: string;
};

export function getKalamburySetupModeContent(
  modeId: "classic" | "team" = "classic",
): KalamburySetupModeContent {
  if (modeId === "team") {
    return {
      modeId,
      eyebrow: "Kalambury / Druzynowy",
      title: "Ustawienia gry",
      description: "Skonfiguruj parametry pod druzynowa rozgrywke Kalamburow.",
      storageKey: "project-party.kalambury.team-setup",
      startLabel: "Start",
    };
  }

  return {
    modeId: "classic",
    eyebrow: "Kalambury / Klasyczny",
    title: "Ustawienia gry",
    description: "Skonfiguruj ekipe pod klasyczna rozgrywke Kalamburow.",
    storageKey: "project-party.kalambury.classic-setup",
    startLabel: "Start",
  };
}
