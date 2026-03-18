import type {
  KalamburyCategoryOption,
  KalamburyModeSettings,
  KalamburySetupPlayer,
  KalamburySetupState,
} from "./setup-content.ts";
import { cloneModeSettings, normalizeModeSettings } from "./setup-ui.ts";

type MaybePromise<T> = T | Promise<T>;

export type KalamburyStorageLike = {
  getItem: (key: string) => MaybePromise<string | null>;
  setItem: (key: string, value: string) => MaybePromise<void>;
  removeItem?: (key: string) => MaybePromise<void>;
};

type PersistedKalamburyCategoryDraft = Pick<
  KalamburyCategoryOption,
  "id" | "easyEnabled" | "hardEnabled" | "isSelected"
>;

type PersistedKalamburySetupDraft = {
  players: KalamburySetupPlayer[];
  modeSettings: KalamburyModeSettings;
  presenterDeviceEnabled: boolean;
  pairedPresenterDeviceId: string | null;
  categories: PersistedKalamburyCategoryDraft[];
  activeCategoryId: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPlayerGender(value: unknown): value is "female" | "male" {
  return value === "female" || value === "male";
}

function isAvatarCategory(
  value: unknown,
): value is "ludzie" | "zwierzeta" | "inne" {
  return value === "ludzie" || value === "zwierzeta" || value === "inne";
}

function isKalamburySetupPlayer(value: unknown): value is KalamburySetupPlayer {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.avatar === "string" &&
    typeof value.avatarId === "string" &&
    isAvatarCategory(value.avatarCategory) &&
    isPlayerGender(value.gender)
  );
}

function mergeCategories(
  baseCategories: KalamburyCategoryOption[],
  persistedCategories: unknown,
): KalamburyCategoryOption[] {
  if (!Array.isArray(persistedCategories)) {
    return baseCategories;
  }

  const persistedById = new Map(
    persistedCategories
      .filter(isRecord)
      .filter((category) => typeof category.id === "string")
      .map((category) => [category.id as string, category]),
  );

  return baseCategories.map((category) => {
    const persisted = persistedById.get(category.id);

    if (!persisted) {
      return category;
    }

    const easyEnabled = persisted.easyEnabled === true;
    const hardEnabled = persisted.hardEnabled === true;

    return {
      ...category,
      easyEnabled,
      hardEnabled,
      isSelected: easyEnabled || hardEnabled,
    };
  });
}

function mergePlayers(
  baseState: KalamburySetupState,
  persistedPlayers: unknown,
): KalamburySetupPlayer[] {
  if (!Array.isArray(persistedPlayers)) {
    return baseState.players;
  }

  const nextPlayers = persistedPlayers.filter(isKalamburySetupPlayer);

  if (
    nextPlayers.length < baseState.playerLimit.min ||
    nextPlayers.length > baseState.playerLimit.max
  ) {
    return baseState.players;
  }

  return nextPlayers;
}

function mergeModeSettings(
  baseState: KalamburySetupState,
  persistedModeSettings: unknown,
): KalamburyModeSettings {
  if (!isRecord(persistedModeSettings)) {
    return baseState.modeSettings;
  }

  try {
    return normalizeModeSettings(
      cloneModeSettings(persistedModeSettings as KalamburyModeSettings),
    );
  } catch {
    return baseState.modeSettings;
  }
}

export function createKalamburySetupDraftStorageKey(
  storageKey: string,
): string {
  return `${storageKey}.draft`;
}

async function removeStoredDraft(
  storage: KalamburyStorageLike,
  storageKey: string,
): Promise<void> {
  await storage.removeItem?.(storageKey);
}

export async function loadKalamburySetupDraft(
  storage: KalamburyStorageLike | null | undefined,
  storageKey: string,
  baseState: KalamburySetupState,
): Promise<KalamburySetupState> {
  if (!storage) {
    return baseState;
  }

  try {
    const raw = await storage.getItem(storageKey);

    if (!raw) {
      return baseState;
    }

    const parsed = JSON.parse(raw) as Partial<PersistedKalamburySetupDraft>;
    const categories = mergeCategories(baseState.categories, parsed.categories);
    const activeCategoryId =
      typeof parsed.activeCategoryId === "string" &&
      categories.some((category) => category.id === parsed.activeCategoryId)
        ? parsed.activeCategoryId
        : "";

    return {
      ...baseState,
      players: mergePlayers(baseState, parsed.players),
      modeSettings: mergeModeSettings(baseState, parsed.modeSettings),
      presenterDeviceEnabled: parsed.presenterDeviceEnabled === true,
      pairedPresenterDeviceId: null,
      categories,
      activeCategoryId,
    };
  } catch {
    await removeStoredDraft(storage, storageKey);
    return baseState;
  }
}

export async function saveKalamburySetupDraft(
  storage: KalamburyStorageLike | null | undefined,
  storageKey: string,
  state: KalamburySetupState,
): Promise<void> {
  if (!storage) {
    return;
  }

  const payload: PersistedKalamburySetupDraft = {
    players: state.players,
    modeSettings: state.modeSettings,
    presenterDeviceEnabled: state.presenterDeviceEnabled,
    pairedPresenterDeviceId: state.pairedPresenterDeviceId,
    categories: state.categories.map((category) => ({
      id: category.id,
      easyEnabled: category.easyEnabled,
      hardEnabled: category.hardEnabled,
      isSelected: category.isSelected,
    })),
    activeCategoryId: state.activeCategoryId,
  };

  await storage.setItem(storageKey, JSON.stringify(payload));
}
