// games/kalambury/src/shared/presenter/controller-bridge.ts

import {
  isPresenterMessage,
  type ControllerBridgeOptions,
  type KalamburyControllerConnectionState,
  type KalamburyPresenterChannel,
  type KalamburyPresenterMessage,
} from "./types";

function resolveBroadcastChannel(
  BroadcastChannelImpl?: import("./types").BroadcastChannelConstructor,
) {
  if (BroadcastChannelImpl) return BroadcastChannelImpl;
  if (typeof BroadcastChannel === "undefined") return null;
  return BroadcastChannel;
}

function getChannelName(sessionCode: string) {
  return `project-party.kalambury.presenter.${sessionCode.toUpperCase()}`;
}

function createPresenterChannel(
  sessionCode: string,
  BroadcastChannelImpl?: import("./types").BroadcastChannelConstructor,
): KalamburyPresenterChannel | null {
  const Channel = resolveBroadcastChannel(BroadcastChannelImpl);
  if (!Channel || !sessionCode) return null;

  const channel = new Channel(getChannelName(sessionCode));

  return {
    postMessage(message) {
      channel.postMessage(message);
    },
    subscribe(handler) {
      channel.onmessage = (event) => {
        if (!isPresenterMessage(event.data)) return;
        handler(event.data);
      };
      return () => {
        channel.onmessage = null;
      };
    },
    close() {
      channel.close();
    },
  };
}

function createDeviceId() {
  return `presenter-${Math.random().toString(36).slice(2, 10)}`;
}

export function createKalamburyPresenterControllerBridge(
  sessionCode: string,
  options: ControllerBridgeOptions = {},
) {
  const channel =
    options.channel ??
    createPresenterChannel(sessionCode, options.BroadcastChannelImpl);
  const shouldCloseChannel = !options.channel;
  const deviceId = options.deviceId ?? createDeviceId();
  let isDestroyed = false;
  let connectionState: KalamburyControllerConnectionState = "pending";
  let unsubscribe = () => undefined as void;
  let readyRetryTimer: ReturnType<typeof setInterval> | null = null;

  function stopReadyRetry() {
    if (readyRetryTimer) {
      clearInterval(readyRetryTimer);
      readyRetryTimer = null;
    }
  }

  function postReady() {
    if (isDestroyed) return;
    void channel?.postMessage({
      type: "controller-ready",
      deviceId,
    } satisfies KalamburyPresenterMessage);
  }

  function startReadyRetry() {
    if (readyRetryTimer || isDestroyed) return;
    readyRetryTimer = setInterval(() => {
      postReady();
    }, options.readyRetryMs ?? 1200);
  }

  function setConnectionState(state: KalamburyControllerConnectionState) {
    connectionState = state;
    options.onConnectionStateChange?.(state);

    if (state === "pending") {
      startReadyRetry();
      return;
    }

    stopReadyRetry();
  }

  if (channel) {
    unsubscribe = channel.subscribe((message) => {
      if (message.type === "host-probe" && message.deviceId === deviceId) {
        postReady();
      }

      if (message.type === "host-ping" && message.deviceId === deviceId) {
        void channel?.postMessage({
          type: "controller-pong",
          deviceId,
        } satisfies KalamburyPresenterMessage);
        // No redundant postReady() — heartbeat proves the channel is alive
      }

      if (message.type === "host-paired" && message.deviceId === deviceId) {
        if (connectionState === "pending") {
          setConnectionState("connected");
        }
      }

      if (message.type === "host-rejected" && message.deviceId === deviceId) {
        setConnectionState("rejected");
      }

      if (message.type === "host-reset") {
        setConnectionState("pending"); // auto-starts readyRetry
        options.onPreviewStateChange?.("pending-reveal");
        options.onPhraseChange?.(null);
      }

      if (
        message.type === "presenter-clear" &&
        (!message.deviceId || message.deviceId === deviceId)
      ) {
        options.onPhraseChange?.(null);
      }

      if (
        message.type === "host-preview-start" &&
        message.deviceId === deviceId
      ) {
        options.onPreviewStateChange?.("preview");
      }

      if (
        message.type === "host-preview-finish" &&
        message.deviceId === deviceId
      ) {
        options.onPreviewStateChange?.("hidden-live");
      }

      if (
        message.type === "host-preview-reset" &&
        message.deviceId === deviceId
      ) {
        options.onPreviewStateChange?.("pending-reveal");
      }

      if (
        message.type === "presenter-phrase" &&
        message.deviceId === deviceId
      ) {
        options.onPhraseChange?.({
          phrase: message.phrase,
          categoryLabel: message.categoryLabel,
          wordCount: message.wordCount,
          presenterName: message.presenterName,
          phraseChangeAllowed: message.phraseChangeAllowed,
          phraseChangeRemaining: message.phraseChangeRemaining,
        });
      }
    });
  }

  return {
    deviceId,
    announceReady() {
      if (isDestroyed) return;
      setConnectionState("pending");
      options.onPreviewStateChange?.("pending-reveal");
      postReady();
    },
    revealPhrase() {
      if (isDestroyed) return;
      void channel?.postMessage({
        type: "controller-reveal-request",
        deviceId,
      } satisfies KalamburyPresenterMessage);
    },
    requestPhraseChange() {
      if (isDestroyed) return;
      void channel?.postMessage({
        type: "controller-reroll-request",
        deviceId,
      } satisfies KalamburyPresenterMessage);
    },
    destroy() {
      if (isDestroyed) return;
      isDestroyed = true;
      stopReadyRetry();
      unsubscribe();
      void channel?.postMessage({
        type: "controller-disconnected",
        deviceId,
      } satisfies KalamburyPresenterMessage);
      if (shouldCloseChannel) channel?.close?.();
    },
  };
}
