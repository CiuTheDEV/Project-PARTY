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

function createPresenterTransportChannel(
  context: GameRuntimeContext,
): KalamburyPresenterChannel {
  return {
    postMessage(message) {
      return context.transport.send("kalambury.presenter", message);
    },
    subscribe(handler) {
      return context.transport.on("kalambury.presenter", (payload) => {
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
  const presenterTransportChannel = createPresenterTransportChannel(context);

  return {
    start() {
      context.storage.set("kalambury:last-session-id", context.sessionId);
      context.transport.send("kalambury/runtime-started", {
        role: context.role,
        device: context.device,
      });

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
