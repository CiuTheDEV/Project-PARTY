import type { KalamburyTransportMode } from "./types";

const KEY = "kalambury:transport-mode";
const DEFAULT: KalamburyTransportMode = "do-ws";
const VALID_MODES: KalamburyTransportMode[] = ["do-ws", "firebase", "broadcast"];

export function getTransportMode(): KalamburyTransportMode {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored && (VALID_MODES as string[]).includes(stored)) {
      return stored as KalamburyTransportMode;
    }
  } catch {
    // localStorage unavailable (SSR)
  }
  return DEFAULT;
}

export function setTransportMode(mode: KalamburyTransportMode): void {
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    // localStorage unavailable
  }
}
