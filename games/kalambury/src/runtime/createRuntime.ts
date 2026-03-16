import type {
  GameRuntimeContext,
  GameRuntimeHandle,
} from "@project-party/game-runtime";
import { createElement } from "react";

import { KalamburyControllerApp } from "../controller/ControllerApp";
import { KalamburyHostApp } from "../host/HostApp";
import {
  type KalamburyPresenterChannel,
  isPresenterMessage,
} from "../shared/presenter-bridge";
import {
  createKalamburyTransportAsync,
  getTransportMode,
} from "../transport/index";

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
  return {
    async start() {
      const mode = getTransportMode();
      const transport = await createKalamburyTransportAsync(
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
      context.ui.unmount();
    },
  };
}
