import type { GameSettingsDefinition } from "@project-party/game-runtime";

export const kalamburySettings: GameSettingsDefinition = {
  title: "Ustawienia Kalamburów",
  fields: [
    {
      key: "roundTimeSeconds",
      label: "Czas rundy (sekundy)",
      type: "number",
      defaultValue: 60,
      min: 15,
      max: 180,
    },
    {
      key: "teamsEnabled",
      label: "Tryb drużynowy",
      type: "boolean",
      defaultValue: false,
    },
    {
      key: "difficulty",
      label: "Poziom trudności",
      type: "select",
      defaultValue: "mixed",
      options: [
        { label: "Łatwy", value: "easy" },
        { label: "Trudny", value: "hard" },
        { label: "Mieszany", value: "mixed" },
      ],
    },
  ],
};
