export type KalamburyPresenterPhrasePayload = {
  phrase: string;
  categoryLabel: string;
  wordCount: number;
  presenterName?: string;
  phraseChangeAllowed: boolean;
  phraseChangeRemaining: number | "infinite";
};

export type KalamburyPresenterPairState = {
  connected: boolean;
  pairedDeviceId: string | null;
};

type KalamburyControllerConnectionState = "pending" | "connected" | "rejected";
export type KalamburyPresenterPreviewState =
  | "pending-reveal"
  | "preview"
  | "hidden-live";

export type KalamburyPresenterMessage =
  | { type: "controller-ready"; deviceId: string }
  | { type: "controller-disconnected"; deviceId: string }
  | { type: "controller-reveal-request"; deviceId: string }
  | { type: "controller-reroll-request"; deviceId: string }
  | { type: "host-probe"; deviceId: string }
  | { type: "host-paired"; deviceId: string }
  | { type: "host-rejected"; deviceId: string }
  | { type: "host-reset" }
  | { type: "host-preview-start"; deviceId: string }
  | { type: "host-preview-finish"; deviceId: string }
  | { type: "host-preview-reset"; deviceId: string }
  | ({ type: "presenter-phrase"; deviceId: string } & KalamburyPresenterPhrasePayload)
  | { type: "presenter-clear"; deviceId: string | null };

type BroadcastChannelLike = {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  postMessage: (message: unknown) => void;
  close: () => void;
};

type BroadcastChannelConstructor = new (name: string) => BroadcastChannelLike;

export type KalamburyPresenterChannel = {
  postMessage: (
    message: KalamburyPresenterMessage,
  ) => void | Promise<void>;
  subscribe: (
    handler: (message: KalamburyPresenterMessage) => void,
  ) => () => void;
  close?: () => void;
};

type HostBridgeOptions = {
  BroadcastChannelImpl?: BroadcastChannelConstructor;
  channel?: KalamburyPresenterChannel;
  initialPairedDeviceId?: string | null;
  onPairingChange?: (state: KalamburyPresenterPairState) => void;
  onRevealRequest?: (state: { deviceId: string }) => void;
  onRerollRequest?: (state: { deviceId: string }) => void;
};

type ControllerBridgeOptions = {
  BroadcastChannelImpl?: BroadcastChannelConstructor;
  channel?: KalamburyPresenterChannel;
  deviceId?: string;
  onPhraseChange?: (payload: KalamburyPresenterPhrasePayload | null) => void;
  onPreviewStateChange?: (state: KalamburyPresenterPreviewState) => void;
  onConnectionStateChange?: (
    state: KalamburyControllerConnectionState,
  ) => void;
};

function resolveBroadcastChannel(
  BroadcastChannelImpl?: BroadcastChannelConstructor,
) {
  if (BroadcastChannelImpl) {
    return BroadcastChannelImpl;
  }

  if (typeof BroadcastChannel === "undefined") {
    return null;
  }

  return BroadcastChannel;
}

function getChannelName(sessionCode: string) {
  return `project-party.kalambury.presenter.${sessionCode.toUpperCase()}`;
}

export function isPresenterMessage(
  value: unknown,
): value is KalamburyPresenterMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  return typeof (value as { type?: unknown }).type === "string";
}

function createChannel(
  sessionCode: string,
  BroadcastChannelImpl?: BroadcastChannelConstructor,
) {
  const Channel = resolveBroadcastChannel(BroadcastChannelImpl);
  if (!Channel || !sessionCode) {
    return null;
  }

  return new Channel(getChannelName(sessionCode));
}

function createPresenterChannel(
  sessionCode: string,
  BroadcastChannelImpl?: BroadcastChannelConstructor,
): KalamburyPresenterChannel | null {
  const channel = createChannel(sessionCode, BroadcastChannelImpl);

  if (!channel) {
    return null;
  }

  return {
    postMessage(message) {
      channel.postMessage(message);
    },
    subscribe(handler) {
      channel.onmessage = (event) => {
        if (!isPresenterMessage(event.data)) {
          return;
        }

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

export function createKalamburyPresenterHostBridge(
  sessionCode: string,
  options: HostBridgeOptions = {},
) {
  const channel =
    options.channel ??
    createPresenterChannel(sessionCode, options.BroadcastChannelImpl);
  const shouldCloseChannel = !options.channel;
  let pairedDeviceId = options.initialPairedDeviceId ?? null;
  let unsubscribe = () => undefined;

  function emitPairingChange(connected: boolean) {
    options.onPairingChange?.({ connected, pairedDeviceId });
  }

  if (channel) {
    unsubscribe = channel.subscribe((message) => {
      if (message.type === "controller-ready") {
        if (!pairedDeviceId) {
          pairedDeviceId = message.deviceId;
          void channel.postMessage({
            type: "host-paired",
            deviceId: message.deviceId,
          } satisfies KalamburyPresenterMessage);
          emitPairingChange(true);
          return;
        }

        if (pairedDeviceId === message.deviceId) {
          void channel.postMessage({
            type: "host-paired",
            deviceId: message.deviceId,
          } satisfies KalamburyPresenterMessage);
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
    }
  }

  return {
    publishPhrase(payload: KalamburyPresenterPhrasePayload) {
      if (!pairedDeviceId) {
        return;
      }

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
      if (!pairedDeviceId) {
        return;
      }

      void channel?.postMessage({
        type: "host-preview-start",
        deviceId: pairedDeviceId,
      } satisfies KalamburyPresenterMessage);
    },
    finishPreviewWindow() {
      if (!pairedDeviceId) {
        return;
      }

      void channel?.postMessage({
        type: "host-preview-finish",
        deviceId: pairedDeviceId,
      } satisfies KalamburyPresenterMessage);
    },
    resetPreviewWindow() {
      if (!pairedDeviceId) {
        return;
      }

      void channel?.postMessage({
        type: "host-preview-reset",
        deviceId: pairedDeviceId,
      } satisfies KalamburyPresenterMessage);
    },
    disconnectPresenterDevice() {
      pairedDeviceId = null;
      void channel?.postMessage({
        type: "host-reset",
      } satisfies KalamburyPresenterMessage);
      emitPairingChange(false);
    },
    destroy() {
      unsubscribe();
      if (shouldCloseChannel) {
        channel?.close?.();
      }
    },
  };
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
  let unsubscribe = () => undefined;

  function postReady() {
    if (isDestroyed) {
      return;
    }

    void channel?.postMessage({
      type: "controller-ready",
      deviceId,
    } satisfies KalamburyPresenterMessage);
  }

  if (channel) {
    unsubscribe = channel.subscribe((message) => {
      if (message.type === "host-probe" && message.deviceId === deviceId) {
        postReady();
      }

      if (message.type === "host-paired" && message.deviceId === deviceId) {
        options.onConnectionStateChange?.("connected");
      }

      if (message.type === "host-rejected" && message.deviceId === deviceId) {
        options.onConnectionStateChange?.("rejected");
      }

      if (message.type === "host-reset") {
        options.onConnectionStateChange?.("pending");
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
      if (isDestroyed) {
        return;
      }
      options.onConnectionStateChange?.("pending");
      options.onPreviewStateChange?.("pending-reveal");
      postReady();
    },
    revealPhrase() {
      if (isDestroyed) {
        return;
      }

      void channel?.postMessage({
        type: "controller-reveal-request",
        deviceId,
      } satisfies KalamburyPresenterMessage);
    },
    requestPhraseChange() {
      if (isDestroyed) {
        return;
      }

      void channel?.postMessage({
        type: "controller-reroll-request",
        deviceId,
      } satisfies KalamburyPresenterMessage);
    },
    destroy() {
      if (isDestroyed) {
        return;
      }

      isDestroyed = true;
      unsubscribe();
      void channel?.postMessage({
        type: "controller-disconnected",
        deviceId,
      } satisfies KalamburyPresenterMessage);
      if (shouldCloseChannel) {
        channel?.close?.();
      }
    },
  };
}
