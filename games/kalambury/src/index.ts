import { defineGame } from "@project-party/game-sdk";

import "./styles.css";
import { kalamburyMeta } from "./meta";
import { createKalamburyRuntime } from "./runtime/createRuntime";
import { kalamburySettings } from "./settings";

export default defineGame({
  id: "kalambury",
  version: "0.1.0",
  meta: kalamburyMeta,
  capabilities: {
    deviceProfiles: ["host-plus-phones", "single-screen"],
    supportedRoles: ["host", "player", "controller", "viewer"],
    supportsRemotePlay: true,
  },
  settings: kalamburySettings,
  createRuntime: createKalamburyRuntime,
});
