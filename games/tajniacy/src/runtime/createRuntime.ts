import type {
  GameRuntimeContext,
  GameRuntimeHandle,
} from "@project-party/game-runtime";
import { createElement } from "react";

import { TajniacyHostApp } from "../host/HostApp.tsx";
import { TajniacyControllerApp } from "../controller/ControllerApp.tsx";
import { type TajniacyBridgeMessage, type TajniacyChannel } from "../shared/bridge.ts";

function isTajniacyBridgeMessage(value: unknown): value is TajniacyBridgeMessage {
  if (!value || typeof value !== "object") return false;
  return typeof (value as { type?: unknown }).type === "string";
}

function createTransportChannel(context: GameRuntimeContext): TajniacyChannel {
  return {
    postMessage(message) {
      return context.transport.send("tajniacy.bridge", message);
    },
    subscribe(handler) {
      return context.transport.on("tajniacy.bridge", (payload) => {
        if (isTajniacyBridgeMessage(payload)) {
          handler(payload);
        }
      });
    },
  };
}

export function createTajniacyRuntime(
  context: GameRuntimeContext,
): GameRuntimeHandle {
  const transportChannel = createTransportChannel(context);

  return {
    start() {
      context.storage.set("tajniacy:last-session-id", context.sessionId);
      context.transport.send("tajniacy/runtime-started", {
        role: context.role,
        device: context.device,
      });

      if (context.role === "host") {
        context.ui.mount(createElement(TajniacyHostApp, {
          sessionCode: context.sessionCode,
          transportChannel,
        }));
      } else if (context.role === "controller" || context.role === "player") {
        context.ui.mount(createElement(TajniacyControllerApp, {
          sessionCode: context.sessionCode ?? "",
          transportChannel,
        }));
      }
    },
    destroy() {
      context.ui.unmount();
    },
  };
}
