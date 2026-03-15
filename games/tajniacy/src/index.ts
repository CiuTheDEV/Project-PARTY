import { defineGame } from "@project-party/game-sdk";

import "./styles.css";

import { tajniacyMeta } from "./meta";
import { createTajniacyRuntime } from "./runtime/createRuntime";
import { tajniacySettings } from "./settings";

export default defineGame({
  id: "tajniacy",
  version: "0.1.0",
  meta: tajniacyMeta,
  capabilities: {
    deviceProfiles: ["host-plus-phones"],
    supportedRoles: ["host", "player", "controller", "viewer"],
    supportsRemotePlay: true,
  },
  settings: tajniacySettings,
  createRuntime: createTajniacyRuntime,
});
