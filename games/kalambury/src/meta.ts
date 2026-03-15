import type { GameMeta } from "@project-party/types";

const kalamburyCoverImage = new URL(
  "./assets/kalambury-mode-classic-line-art.svg",
  import.meta.url,
).href;

export const kalamburyMeta: GameMeta = {
  name: "Kalambury",
  shortDescription: "Rysuj, pokazuj i zgaduj hasła w imprezowym tempie.",
  status: "stable",
  tags: ["party", "drawing", "host-plus-phones"],
  deviceProfiles: ["host-plus-phones", "single-screen"],
  playerCount: {
    min: 2,
    max: 12,
  },
  coverImage: kalamburyCoverImage,
};
