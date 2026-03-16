import type { GameRuntimeContext } from "@project-party/game-runtime";

export type KalamburyTransportMode = "firebase" | "do-ws" | "broadcast";

export interface KalamburyTransport {
  send: (event: string, payload?: unknown) => Promise<void> | void;
  on: (event: string, handler: (payload: unknown) => void) => () => void;
  destroy: () => void;
}

// Alias for adapter convenience
export type PlatformTransport = GameRuntimeContext["transport"];
