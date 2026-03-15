import type {
  GameRuntimeContext,
  GameRuntimeHandle,
} from "@project-party/game-runtime";
import { createElement } from "react";

import { TajniacyHostApp } from "../host/HostApp.tsx";
import { TajniacyControllerApp } from "../controller/ControllerApp.tsx";

export function createTajniacyRuntime(
  context: GameRuntimeContext,
): GameRuntimeHandle {
  return {
    start() {
      context.storage.set("tajniacy:last-session-id", context.sessionId);
      context.transport.send("tajniacy/runtime-started", {
        role: context.role,
        device: context.device,
      });

      if (context.role === "host") {
        context.ui.mount(createElement(TajniacyHostApp, { sessionCode: context.sessionCode }));
      } else if (context.role === "controller") {
        context.ui.mount(createElement(TajniacyControllerApp, {
          sessionCode: context.sessionCode ?? ""
        }));
      } else if (context.role === "player") {
        // Fallback for direct "player" role if used, though hub-flow uses standard controller route
        context.ui.mount(createElement(TajniacyControllerApp, {
          sessionCode: context.sessionCode ?? ""
        }));
      }
    },
    destroy() {
      context.ui.unmount();
    },
  };
}
