import type {
  GameDefinition,
  GameRuntimeHandle,
  RuntimePlayer,
} from "@project-party/game-runtime";
import type { PlayerRole, RuntimeDevice } from "@project-party/types";
import { createSessionTransport } from "./session-transport.ts";

type RuntimeSession = {
  sessionId: string;
  sessionCode?: string;
  gameId: string;
  config: Record<string, unknown>;
};

type MountGameRuntimeInput = {
  definition: Pick<GameDefinition, "createRuntime">;
  session: RuntimeSession;
  role: PlayerRole;
  device: RuntimeDevice;
  players: RuntimePlayer[];
  storage?: {
    get: <T>(key: string) => T | null;
    set: <T>(key: string, value: T) => void;
  };
  mount: (node: unknown) => void;
  unmount: () => void;
  onTransport?: (event: string, payload: unknown) => void;
};

export function mountGameRuntime(
  input: MountGameRuntimeInput,
): GameRuntimeHandle {
  const storage = input.storage ?? {
    get: <T>(_key: string) => null as T | null,
    set: <T>(_key: string, _value: T) => undefined,
  };
  const sessionTransport = createSessionTransport({
    sessionCode: input.session.sessionCode,
  });
  const runtime = input.definition.createRuntime({
    sessionId: input.session.sessionId,
    sessionCode: input.session.sessionCode,
    gameId: input.session.gameId,
    role: input.role,
    device: input.device,
    config: input.session.config,
    players: input.players,
    transport: {
      send: async (event, payload) => {
        input.onTransport?.(event, payload);
        await sessionTransport.send(event, payload);
      },
      on: (event, handler) => sessionTransport.on(event, handler),
    },
    storage: {
      get: <T>(key: string) => storage.get<T>(key),
      set: (key, value) => {
        storage.set(key, value);
      },
    },
    ui: {
      mount: input.mount,
      unmount: input.unmount,
    },
  });

  return {
    start() {
      return runtime.start();
    },
    async destroy() {
      await runtime.destroy?.();
      sessionTransport.destroy();
      input.unmount();
    },
  };
}
