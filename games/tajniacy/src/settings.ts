import type { GameSettingsDefinition } from "@project-party/game-runtime";

export const tajniacySettings: GameSettingsDefinition = {
  title: "Ustawienia Tajniaków",
  fields: [
    {
      key: "category",
      label: "Kategoria haseł",
      type: "select",
      defaultValue: "",
      options: [
        { label: "Standardowa", value: "standard" },
        { label: "Bez cenzury (+18)", value: "uncensored" },
      ],
    },
    {
      key: "assassinCount",
      label: "Liczba zabójców",
      type: "number",
      defaultValue: 1,
      min: 1,
      max: 5,
    },
    {
      key: "roundsToWin",
      label: "Rundy do wygranej",
      type: "number",
      defaultValue: 3,
      min: 1,
      max: 5,
    },
  ],
};
