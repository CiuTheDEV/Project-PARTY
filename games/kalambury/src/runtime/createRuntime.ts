import type {
  GameRuntimeContext,
  GameRuntimeHandle,
} from "@project-party/game-runtime";
import { createElement } from "react";

import { KalamburyControllerApp } from "../controller/ControllerApp";
import { KalamburyHostApp } from "../host/HostApp";
import { isPresenterMessage, type KalamburyPresenterChannel } from "../shared/presenter/types";
import {
  createKalamburyTransportAsync,
  getTransportMode,
  setTransportMode,
} from "../transport/index";
import type { KalamburyTransport } from "../transport/types";

function createPresenterTransportChannel(
  send: GameRuntimeContext["transport"]["send"],
  on: GameRuntimeContext["transport"]["on"],
): KalamburyPresenterChannel {
  return {
    postMessage(message) {
      return send("kalambury.presenter", message);
    },
    subscribe(handler) {
      return on("kalambury.presenter", (payload) => {
        if (isPresenterMessage(payload)) {
          handler(payload);
        }
      });
    },
  };
}

export function createKalamburyRuntime(
  context: GameRuntimeContext,
): GameRuntimeHandle {
  let transport: KalamburyTransport | null = null;

  return {
    async start() {
      // If a transport query param is present in the URL (e.g. controller opened
      // via QR with ?transport=firebase), sync it into localStorage so this
      // device uses the correct transport without manual configuration.
      if (typeof window !== "undefined") {
        const urlTransport = new URLSearchParams(window.location.search).get("transport");
        const VALID_MODES = ["do-ws", "firebase", "broadcast"] as const;
        if (urlTransport && (VALID_MODES as readonly string[]).includes(urlTransport)) {
          setTransportMode(urlTransport as (typeof VALID_MODES)[number]);
        }
      }
      const mode = getTransportMode();
      transport = await createKalamburyTransportAsync(
        mode,
        context.sessionCode,
        context.transport,
      );

      context.storage.set("kalambury:last-session-id", context.sessionId);
      transport.send("kalambury/runtime-started", {
        role: context.role,
        device: context.device,
      });

      const presenterTransportChannel = createPresenterTransportChannel(
        transport.send.bind(transport),
        transport.on.bind(transport),
      );

      if (context.role === "controller" || context.role === "player") {
        context.ui.mount(
          createElement(KalamburyControllerApp, {
            sessionCode: context.sessionCode,
            playerName: context.players[0]?.name,
            transportChannel: presenterTransportChannel,
          }),
        );
        return;
      }

      context.ui.mount(
        createElement(KalamburyHostApp, {
          sessionCode: context.sessionCode,
          transportChannel: presenterTransportChannel,
          storage: {
            getItem: (key: string) => context.storage.get<string>(key),
            setItem: (key: string, value: string) =>
              context.storage.set(key, value),
          },
        }),
      );
    },
    destroy() {
      transport?.destroy();
      transport = null;
      context.ui.unmount();
    },
  };
}
