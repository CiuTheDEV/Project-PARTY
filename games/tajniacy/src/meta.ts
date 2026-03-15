import type { GameMeta } from "@project-party/types";

export const tajniacyMeta: GameMeta = {
  name: "Tajniacy",
  shortDescription:
    "Drużynowa gra skojarzeń — odkryj wszystkie kryptonimy przed przeciwnikiem.",
  status: "in-development",
  tags: ["party", "teams", "word-game", "host-plus-phones"],
  deviceProfiles: ["host-plus-phones"],
  playerCount: {
    min: 4,
    max: 10,
  },
};
