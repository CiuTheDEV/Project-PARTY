import type {
  KalamburyModeSection,
  KalamburyModeSettings,
} from "./setup-content";

export const modeSections: Array<{
  id: KalamburyModeSection;
  label: string;
  disabled?: boolean;
  badge?: string;
}> = [
  { id: "rounds", label: "Rozgrywka" },
  { id: "hints", label: "Podpowiedzi" },
  { id: "phraseChange", label: "Zmiana hasla" },
  { id: "events", label: "Eventy", disabled: true, badge: "WIP" },
];
export const roundDurationOptions = [15, 30, 45, 60, 75, 90, 120] as const;
export const roundCountOptions = [1, 2, 3, 4, 5, 6, 7] as const;
export const pointsTargetOptions = [5, 10, 15, 20, 25] as const;
export const phraseChangeCountOptions = [
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  "infinite",
] as const;
export const eventChanceOptions = [0, 25, 50, 75, 100] as const;
export const noRepeatOptions = [0, 1, 2, 3] as const;

function getHintsLabel(settings: KalamburyModeSettings["hints"]) {
  if (!settings.enabled) {
    return "Bez podpowiedzi";
  }

  const parts = [
    settings.showWordCount ? "Slowa" : null,
    settings.showCategory ? "kategoria" : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" + ") : "Podpowiedzi aktywne";
}

function getPhraseChangeLabel(settings: KalamburyModeSettings["phraseChange"]) {
  if (!settings.enabled) {
    return "Bez zmiany";
  }

  const countLabel =
    settings.changesPerPlayer === "infinite"
      ? "INFx"
      : `${settings.changesPerPlayer}x`;
  const parts = [countLabel];

  if (settings.rerollWordAndCategory) {
    parts.push("+kat");
  } else if (settings.rerollWordOnly) {
    parts.push("+haslo");
  }

  if (settings.antiCategoryStreak) {
    parts.push("+anty");
  }

  return parts.join(" ");
}

export function normalizeModeSettings(
  settings: KalamburyModeSettings,
): KalamburyModeSettings {
  return {
    ...settings,
    roundModeLabel:
      settings.rounds.winCondition === "points" ? "Punkty" : "Rundy",
    turnDurationSeconds: settings.rounds.turnDurationSeconds,
    hintsLabel: getHintsLabel(settings.hints),
    phraseChangeLabel: getPhraseChangeLabel(settings.phraseChange),
  };
}

export function cloneModeSettings(
  settings: KalamburyModeSettings,
): KalamburyModeSettings {
  return normalizeModeSettings({
    ...settings,
    rounds: { ...settings.rounds },
    hints: { ...settings.hints },
    phraseChange: { ...settings.phraseChange },
    events: { ...settings.events },
  });
}
