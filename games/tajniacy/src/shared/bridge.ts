import type { MatchState, TeamId } from "./types";
import { devTrack } from "./dev-stats.ts";

export type TajniacyChannel = {
  postMessage: (message: TajniacyBridgeMessage) => void | Promise<void>;
  subscribe: (handler: (message: TajniacyBridgeMessage) => void) => () => void;
  close?: () => void;
};

export type TajniacyBridgeRole =
  | "host"
  | "captain-red"
  | "captain-blue"
  | "spectator-captain"  // widzowie mapy — brak pisania haseł
  | "player-view";

export type TajniacyBridgeMessage =
  | { type: "device-ready"; role: TajniacyBridgeRole; deviceId: string }
  | { type: "device-assigned"; role: TajniacyBridgeRole; deviceId: string }
  | { type: "state-sync"; state: MatchState }
  | { type: "request-sync"; deviceId: string }
  | { type: "agent-reveal-request"; index: number; deviceId: string }
  | { type: "hint-submit-request"; word: string; count: number; teamId: TeamId; deviceId: string }
  | { type: "hint-clear-request"; teamId: TeamId; deviceId: string }
  | { type: "device-disconnected"; deviceId: string }
  | { type: "presence-ping"; deviceId: string; role: TajniacyBridgeRole }
  | { type: "presence-pong"; deviceId: string; role: TajniacyBridgeRole }
  | { type: "roles-occupied"; captainRedTaken: boolean; captainBlueTaken: boolean }
  | { type: "host-reset" };

export type TajniacyPresence = {
  captainRed: boolean;
  captainBlue: boolean;
  playerView: boolean;
  spectatorCaptain: boolean;
};

type TajniacyChannel = {
  postMessage(message: TajniacyBridgeMessage): void;
  subscribe(handler: (message: TajniacyBridgeMessage) => void): () => void;
  close(): void;
};

type BridgeOptions = {
  /** Injectable channel (overrides BroadcastChannel entirely — for remote transport or testing) */
  channel?: TajniacyChannel;
  onStateSync?: (state: MatchState) => void;
  onRoleAssigned?: (role: TajniacyBridgeRole) => void;
  onRevealRequest?: (index: number) => void;
  onHintRequest?: (word: string, count: number, teamId: TeamId) => void;
  onHintClearRequest?: (teamId: TeamId) => void;
  onRequestSync?: () => void;
  onPresenceUpdate?: (presence: TajniacyPresence) => void;
  onOccupiedRolesUpdate?: (captainRedTaken: boolean, captainBlueTaken: boolean) => void;
  onHostReset?: () => void;
  onCaptainDisconnect?: () => void;
  /** Injectable BroadcastChannel implementation (for testing) */
  BroadcastChannelImpl?: new (name: string) => {
    onmessage: ((event: MessageEvent<unknown>) => void) | null;
    postMessage: (message: unknown) => void;
    close: () => void;
  };
  /**
   * Enable host→controller heartbeat. Defaults to true only when using
   * BroadcastChannel (same-browser). Set false for remote HTTP transport
   * where ping/pong would spam the DO event log and cause false disconnects.
   */
  enableHeartbeat?: boolean;
  /** How often the host pings controllers (ms). Default: 4000 */
  pingIntervalMs?: number;
  /** How long without a pong before a device is considered disconnected (ms). Default: 8000 */
  pingTimeoutMs?: number;
};

function createBroadcastChannel(
  sessionCode: string,
  BroadcastChannelImpl?: BridgeOptions["BroadcastChannelImpl"]
): TajniacyChannel | null {
  const BC = BroadcastChannelImpl ?? (typeof BroadcastChannel !== "undefined" ? BroadcastChannel : null);
  if (!BC) return null;

  const bc = new BC(`project-party.tajniacy.${sessionCode.toUpperCase()}`);
  let handler: ((message: TajniacyBridgeMessage) => void) | null = null;

  bc.onmessage = (event: MessageEvent<TajniacyBridgeMessage>) => {
    handler?.(event.data);
  };

  return {
    postMessage(message) { bc.postMessage(message); },
    subscribe(h) {
      handler = h;
      return () => { handler = null; };
    },
    close() { bc.close(); },
  };
}

export function createTajniacyBridge(
  sessionCode: string,
  role: TajniacyBridgeRole,
  options: BridgeOptions = {}
) {
  const rawChannel = options.channel ?? createBroadcastChannel(sessionCode, options.BroadcastChannelImpl);
  if (!rawChannel) return null;

  // Heartbeat is only meaningful over BroadcastChannel (same-browser, instant).
  // Over remote HTTP transport it would spam the DO event log and cause false disconnects.
  const enableHeartbeat = options.enableHeartbeat ?? !options.channel;

  // Wrap channel to track sent/received counts in dev
  const channel: TajniacyChannel = {
    postMessage(message) {
      devTrack("messagesSent");
      return rawChannel.postMessage(message);
    },
    subscribe(handler) {
      return rawChannel.subscribe((message) => {
        devTrack("messagesReceived");
        handler(message);
      });
    },
    close: rawChannel.close,
  };


  const deviceId = `device-${Math.random().toString(36).slice(2, 10)}`;

  // Track whether this device has been acknowledged by host (device-assigned received)
  let isAssigned = false;

  // Host-side presence tracking
  // Map: deviceId → role, with timestamps for heartbeat detection
  const connectedDevices = new Map<string, { role: TajniacyBridgeRole; lastSeen: number }>();

  function computePresence(): TajniacyPresence {
    const roles = Array.from(connectedDevices.values()).map((d) => d.role);
    return {
      captainRed: roles.includes("captain-red"),
      captainBlue: roles.includes("captain-blue"),
      playerView: roles.includes("player-view"),
      spectatorCaptain: roles.includes("spectator-captain"),
    };
  }

  function notifyPresence() {
    options.onPresenceUpdate?.(computePresence());
  }

  const unsubscribe = channel.subscribe((msg) => {
    switch (msg.type) {
      case "state-sync":
        options.onStateSync?.(msg.state);
        break;

      case "device-assigned":
        if (msg.deviceId === deviceId) {
          isAssigned = true;
          options.onRoleAssigned?.(msg.role);
        }
        break;

      case "device-disconnected":
        if (role === "host") {
          const info = connectedDevices.get(msg.deviceId);
          if (info) {
            const wasCapt = info.role === "captain-red" || info.role === "captain-blue";
            connectedDevices.delete(msg.deviceId);
            notifyPresence();
            if (wasCapt) {
              options.onCaptainDisconnect?.();
            }
          }
        }
        break;

      case "agent-reveal-request":
        if (role === "host") {
          options.onRevealRequest?.(msg.index);
        }
        break;

      case "hint-submit-request":
        if (role === "host") {
          options.onHintRequest?.(msg.word, msg.count, msg.teamId);
        }
        break;

      case "hint-clear-request":
        if (role === "host") {
          options.onHintClearRequest?.(msg.teamId);
        }
        break;

      case "request-sync":
        if (role === "host") {
          options.onRequestSync?.();
        }
        break;

      case "device-ready":
        if (role === "host") {
          // Enforce 1-device-per-captain: reject if role already occupied
          const alreadyOccupied =
            (msg.role === "captain-red" || msg.role === "captain-blue") &&
            Array.from(connectedDevices.values()).some((d) => d.role === msg.role);

          if (alreadyOccupied) {
            // Send back a denial — controller will get role assigned as spectator-captain
            channel.postMessage({
              type: "device-assigned",
              role: "spectator-captain" as TajniacyBridgeRole,
              deviceId: msg.deviceId,
            });
          } else {
            channel.postMessage({ type: "device-assigned", role: msg.role, deviceId: msg.deviceId });
            connectedDevices.set(msg.deviceId, { role: msg.role, lastSeen: Date.now() });
            notifyPresence();
          }
          // Always broadcast current occupancy to all controllers
          const roles = Array.from(connectedDevices.values()).map((d) => d.role);
          channel.postMessage({
            type: "roles-occupied",
            captainRedTaken: roles.includes("captain-red"),
            captainBlueTaken: roles.includes("captain-blue"),
          });
        }
        break;

      case "presence-ping":
        // Controllers respond with a pong so host can track presence (BroadcastChannel only)
        if (role !== "host" && enableHeartbeat) {
          channel.postMessage({ type: "presence-pong", deviceId, role });
          // Re-announce only if we had a real role (captain/player) and lost assignment
          // (e.g. after WS reconnect + host timeout). Skipped for passive listener
          // (player-view on selection screen) to avoid spamming device-ready every 4s.
          const isRealRole = role === "captain-red" || role === "captain-blue" || role === "spectator-captain";
          if (!isAssigned && isRealRole) {
            devTrack("reannounces");
            channel.postMessage({ type: "device-ready", role, deviceId });
          }
        }
        break;

      case "presence-pong":
        if (role === "host") {
          const existing = connectedDevices.get(msg.deviceId);
          if (existing) {
            existing.lastSeen = Date.now();
          } else {
            connectedDevices.set(msg.deviceId, { role: msg.role, lastSeen: Date.now() });
          }
        }
        break;

      case "roles-occupied":
        if (role !== "host") {
          options.onOccupiedRolesUpdate?.(msg.captainRedTaken, msg.captainBlueTaken);
        }
        break;

      case "host-reset":
        if (role !== "host") {
          options.onHostReset?.();
        }
        break;
    }
  });

  // ── Periodic presence check (host only, BroadcastChannel only) ────────────────────────
  let pingInterval: ReturnType<typeof setInterval> | null = null;

  if (role === "host" && enableHeartbeat) {
    const PING_INTERVAL_MS = options.pingIntervalMs ?? 4000;
    const TIMEOUT_MS = options.pingTimeoutMs ?? 8000;

    pingInterval = setInterval(() => {
      // Send ping to all controllers
      channel.postMessage({ type: "presence-ping", deviceId, role });

      // After half the interval, check for timed-out devices
      setTimeout(() => {
        const now = Date.now();
        let changed = false;

        for (const [id, info] of connectedDevices.entries()) {
          if (now - info.lastSeen > TIMEOUT_MS) {
            const wasCapt =
              info.role === "captain-red" || info.role === "captain-blue";
            connectedDevices.delete(id);
            changed = true;

            if (wasCapt) {
              options.onCaptainDisconnect?.();
            }
          }
        }

        if (changed) {
          notifyPresence();
        }
      }, PING_INTERVAL_MS / 2);
    }, PING_INTERVAL_MS);
  }

  return {
    /** Push the full match state to all connected devices */
    syncState(state: MatchState) {
      channel.postMessage({ type: "state-sync", state });
    },
    /** Controller requests a card reveal */
    requestReveal(index: number) {
      channel.postMessage({ type: "agent-reveal-request", index, deviceId });
    },
    /** Captain submits a hint */
    submitHint(word: string, count: number, teamId: TeamId) {
      channel.postMessage({ type: "hint-submit-request", word, count, teamId, deviceId });
    },
    /** Captain clears the hint */
    clearHint(teamId: TeamId) {
      channel.postMessage({ type: "hint-clear-request", teamId, deviceId });
    },
    /** Ask host for full state sync (cold-join) */
    requestSync() {
      channel.postMessage({ type: "request-sync", deviceId });
    },
    /** Controller announces it has joined and requests a role */
    announceReady(requestedRole: TajniacyBridgeRole) {
      isAssigned = false;
      channel.postMessage({ type: "device-ready", role: requestedRole, deviceId });
    },
    /** Emergency - disconnect all controllers */
    disconnectAll() {
      channel.postMessage({ type: "host-reset" });
      connectedDevices.clear();
      notifyPresence();
    },
    /** Returns the current occupancy snapshot */
    getPresence(): TajniacyPresence {
      return computePresence();
    },
    destroy() {
      if (pingInterval) clearInterval(pingInterval);
      unsubscribe();
      if (role !== "host") {
        channel.postMessage({ type: "device-disconnected", deviceId });
      }
      channel.close?.();
    },
  };
}
