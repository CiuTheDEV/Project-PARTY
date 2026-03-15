import type { DeviceProfile, GameMeta, PlayerRole, RuntimeDevice } from "@project-party/types";

export type SettingsField = {
  key: string;
  label: string;
  type: "number" | "boolean" | "text" | "select" | "multiselect";
  defaultValue?: unknown;
  options?: Array<{ label: string; value: string }>;
  min?: number;
  max?: number;
};

export type GameSettingsDefinition = {
  title: string;
  fields: SettingsField[];
};

export type GameCapabilities = {
  deviceProfiles: DeviceProfile[];
  supportedRoles: PlayerRole[];
  supportsRemotePlay?: boolean;
};

export type RuntimePlayer = {
  id: string;
  name: string;
  role?: string;
  isConnected?: boolean;
};

export type GameRuntimeContext = {
  sessionId: string;
  sessionCode?: string;
  gameId: string;
  role: PlayerRole;
  device: RuntimeDevice;
  config: Record<string, unknown>;
  players: RuntimePlayer[];
  transport: {
    send: (event: string, payload?: unknown) => Promise<void> | void;
    on: (event: string, handler: (payload: unknown) => void) => () => void;
  };
  storage: {
    get: <T>(key: string) => T | null | Promise<T | null>;
    set: <T>(key: string, value: T) => void | Promise<void>;
  };
  ui: {
    mount: (node: unknown) => void;
    unmount: () => void;
  };
};

export type GameRuntimeHandle = {
  start: () => Promise<void> | void;
  destroy?: () => Promise<void> | void;
};

export type GameDefinition = {
  id: string;
  version: string;
  meta: GameMeta;
  capabilities: GameCapabilities;
  settings: GameSettingsDefinition;
  createRuntime: (context: GameRuntimeContext) => GameRuntimeHandle;
};
