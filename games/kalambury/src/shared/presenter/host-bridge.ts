// games/kalambury/src/shared/presenter/host-bridge.ts

import { createPresenterChannel } from "./channel-utils.ts";
import {
  type HostBridgeOptions,
  type KalamburyPresenterMessage,
} from "./types.ts";

export function createKalamburyPresenterHostBridge(
  sessionCode: string,
  options: HostBridgeOptions = {},
) {
  const channel =
    options.channel ??
    createPresenterChannel(sessionCode, options.BroadcastChannelImpl);
  const shouldCloseChannel = !options.channel;
  let pairedDeviceId = options.initialPairedDeviceId ?? null;
  let unsubscribe = () => undefined as void;
  let probeTimer: ReturnType<typeof setTimeout> | null = null;
  let pingInterval: ReturnType<typeof setInterval> | null = null;
  let lastPongTime = 0;

  const PING_INTERVAL_MS = options.pingIntervalMs ?? 4000;
  const PING_TIMEOUT_MS = options.pingTimeoutMs ?? 8000;

  function emitPairingChange(connected: boolean) {
    options.onPairingChange?.({ connected, pairedDeviceId });
  }

  function clearProbeTimer() {
    if (probeTimer) {
      clearTimeout(probeTimer);
      probeTimer = null;
    }
  }

  function stopHeartbeat() {
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }
  }

  function startHeartbeat() {
    if (pingInterval) return;
    lastPongTime = Date.now();
    pingInterval = setInterval(() => {
      if (!pairedDeviceId) {
        stopHeartbeat();
        return;
      }
      if (Date.now() - lastPongTime > PING_TIMEOUT_MS) {
        pairedDeviceId = null;
        stopHeartbeat();
        emitPairingChange(false);
        return;
      }
      void channel?.postMessage({ type: "host-ping", deviceId: pairedDeviceId });
    }, PING_INTERVAL_MS);
  }

  if (channel) {
    unsubscribe = channel.subscribe((message) => {
      if (
        message.type === "controller-pong" &&
        message.deviceId === pairedDeviceId
      ) {
        lastPongTime = Date.now();
      }

      if (message.type === "controller-ready") {
        if (!pairedDeviceId) {
          pairedDeviceId = message.deviceId;
          clearProbeTimer();
          void channel.postMessage({
            type: "host-paired",
            deviceId: message.deviceId,
          } satisfies KalamburyPresenterMessage);
          startHeartbeat();
          emitPairingChange(true);
          return;
        }

        if (pairedDeviceId === message.deviceId) {
          clearProbeTimer();
          void channel.postMessage({
            type: "host-paired",
            deviceId: message.deviceId,
          } satisfies KalamburyPresenterMessage);
          lastPongTime = Date.now();
          startHeartbeat();
          emitPairingChange(true);
          return;
        }

        void channel.postMessage({
          type: "host-rejected",
          deviceId: message.deviceId,
        } satisfies KalamburyPresenterMessage);
      }

      if (
        message.type === "controller-disconnected" &&
        pairedDeviceId === message.deviceId
      ) {
        pairedDeviceId = null;
        stopHeartbeat();
        emitPairingChange(false);
      }

      if (
        message.type === "controller-reveal-request" &&
        pairedDeviceId === message.deviceId
      ) {
        options.onRevealRequest?.({ deviceId: message.deviceId });
      }

      if (
        message.type === "controller-reroll-request" &&
        pairedDeviceId === message.deviceId
      ) {
        options.onRerollRequest?.({ deviceId: message.deviceId });
      }
    });

    if (pairedDeviceId) {
      void channel.postMessage({
        type: "host-probe",
        deviceId: pairedDeviceId,
      } satisfies KalamburyPresenterMessage);

      const probeTimeoutMs = options.probeTimeoutMs ?? 5000;
      probeTimer = setTimeout(() => {
        probeTimer = null;
        pairedDeviceId = null;
        emitPairingChange(false);
      }, probeTimeoutMs);
    }
  }

  return {
    publishPhrase(payload: import("./types").KalamburyPresenterPhrasePayload) {
      if (!pairedDeviceId) return;
      void channel?.postMessage({
        type: "presenter-phrase",
        deviceId: pairedDeviceId,
        ...payload,
      } satisfies KalamburyPresenterMessage);
    },
    clearPhrase() {
      void channel?.postMessage({
        type: "presenter-clear",
        deviceId: pairedDeviceId,
      } satisfies KalamburyPresenterMessage);
    },
    startPreviewWindow() {
      if (!pairedDeviceId) return;
      void channel?.postMessage({
        type: "host-preview-start",
        deviceId: pairedDeviceId,
      } satisfies KalamburyPresenterMessage);
    },
    finishPreviewWindow() {
      if (!pairedDeviceId) return;
      void channel?.postMessage({
        type: "host-preview-finish",
        deviceId: pairedDeviceId,
      } satisfies KalamburyPresenterMessage);
    },
    resetPreviewWindow() {
      if (!pairedDeviceId) return;
      void channel?.postMessage({
        type: "host-preview-reset",
        deviceId: pairedDeviceId,
      } satisfies KalamburyPresenterMessage);
    },
    disconnectPresenterDevice() {
      pairedDeviceId = null;
      emitPairingChange(false);
      void channel?.postMessage({
        type: "host-reset",
      } satisfies KalamburyPresenterMessage);
    },
    destroy() {
      clearProbeTimer();
      stopHeartbeat();
      unsubscribe();
      if (pairedDeviceId) {
        void channel?.postMessage({
          type: "host-reset",
        } satisfies KalamburyPresenterMessage);
        pairedDeviceId = null;
        emitPairingChange(false);
      }
      if (shouldCloseChannel) channel?.close?.();
    },
  };
}
