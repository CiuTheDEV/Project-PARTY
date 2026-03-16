import type { GameRuntimeContext } from "@project-party/game-runtime";
import type { KalamburyTransport, KalamburyTransportMode } from "./types.ts";
import { createBroadcastAdapter } from "./broadcast.ts";
import { createDoWsAdapter } from "./do-ws.ts";

export type { KalamburyTransport, KalamburyTransportMode };
export { getTransportMode, setTransportMode } from "./transport-storage.ts";

// Single public factory — async to handle lazy Firebase import
export async function createKalamburyTransportAsync(
  mode: KalamburyTransportMode,
  sessionCode: string | undefined,
  contextTransport: GameRuntimeContext["transport"],
): Promise<KalamburyTransport> {
  if (mode === "firebase") {
    if (!sessionCode) {
      throw new Error(
        "Tryb Firebase wymaga aktywnej sesji sieciowej. Zmień tryb połączenia w Ustawieniach.",
      );
    }
    const { createFirebaseAdapter } = await import("./firebase.ts");
    return createFirebaseAdapter(sessionCode);
  }

  if (mode === "broadcast") {
    return createBroadcastAdapter(sessionCode ?? "local");
  }

  // do-ws (default)
  return createDoWsAdapter(contextTransport);
}
