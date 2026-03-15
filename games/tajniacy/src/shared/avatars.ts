// ──────────────────────────────────────────────
// Tajniacy – emoji avatarów drużyn
// ──────────────────────────────────────────────

import type { TeamAvatar } from "./types.ts";

export const TEAM_AVATAR_EMOJI: Record<string, string> = {
  // Zwierzęta
  dragon: "🐉",
  lion: "🦁",
  eagle: "🦅",
  shark: "🦈",
  wolf: "🐺",
  butterfly: "🦋",
  unicorn: "🦄",
  dragon2: "🐲",
  fox: "🦊",
  panda: "🐼",
  koala: "🐨",
  owl: "🦉",
  peacock: "🦚",
  parrot: "🦜",
  octopus: "🐙",
  squid: "🦑",
  lobster: "🦞",
  crab: "🦀",
  turtle: "🐢",
  lizard: "🦎",
  snake: "🐍",
  scorpion: "🦂",
  spider: "🕷️",
  bat: "🦇",
  bee: "🐝",
  
  // Obiekty
  robot: "🤖",
  crown: "👑",
  skull: "💀",
  ghost: "👻",
  gem: "💎",
  bomb: "💣",
  shield: "🛡️",
  swords: "⚔️",
  key: "🔑",
  trophy: "🏆",
  medal: "🏅",
  
  // Natura
  fire: "🔥",
  snowflake: "❄️",
  star: "⭐",
  pepper: "🌶️",
  peach: "🍑",
  eggplant: "🍆",
  lightning: "⚡",
  leaf: "🍃",
  flower: "🌸",
  ufo: "🛸",
  rocket: "🚀",
  
  // Magia
  wizard: "🧙",
  fairy: "🧚",
  vampire: "🧛",
  zombie: "🧟",
  genie: "🧞",
  mermaid: "🧜",
  alien: "👽",
  crystal_ball: "🔮",
  magic_wand: "🪄",
};

export type AvatarCategory = "Zwierzęta" | "Obiekty" | "Natura" | "Magia";

export const AVATAR_CATEGORIES: Record<AvatarCategory, string[]> = {
  Zwierzęta: [
    "dragon", "lion", "eagle", "shark", "wolf", "butterfly", "unicorn", "dragon2", 
    "fox", "panda", "koala", "owl", "peacock", "parrot", "octopus", "squid", 
    "lobster", "crab", "turtle", "lizard", "snake", "scorpion", "spider", "bat", "bee"
  ],
  Obiekty: ["robot", "crown", "skull", "ghost", "gem", "bomb", "shield", "swords", "key", "trophy", "medal"],
  Natura: ["fire", "snowflake", "star", "pepper", "peach", "eggplant", "lightning", "leaf", "flower", "ufo", "rocket"],
  Magia: ["wizard", "fairy", "vampire", "zombie", "genie", "mermaid", "alien", "crystal_ball", "magic_wand"],
};

export const ALL_AVATARS: TeamAvatar[] = Object.keys(TEAM_AVATAR_EMOJI) as TeamAvatar[];

export const DEFAULT_AVATARS: TeamAvatar[] = [
  "dragon", "eggplant", "lion", "fire", "pepper", "robot", "lightning"
];
