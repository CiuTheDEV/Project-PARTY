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

type KalamburyPresenterMessage =
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

type HostBridgeOptions = {
  BroadcastChannelImpl?: BroadcastChannelConstructor;
  initialPairedDeviceId?: string | null;
  onPairingChange?: (state: KalamburyPresenterPairState) => void;
  onRevealRequest?: (state: { deviceId: string }) => void;
  onRerollRequest?: (state: { deviceId: string }) => void;
};

type ControllerBridgeOptions = {
  BroadcastChannelImpl?: BroadcastChannelConstructor;
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

function isPresenterMessage(value: unknown): value is KalamburyPresenterMessage {
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

function createDeviceId() {
  return `presenter-${Math.random().toString(36).slice(2, 10)}`;
}

export function createKalamburyPresenterHostBridge(
  sessionCode: string,
  options: HostBridgeOptions = {},
) {
  const channel = createChannel(sessionCode, options.BroadcastChannelImpl);
  let pairedDeviceId = options.initialPairedDeviceId ?? null;

  function emitPairingChange(connected: boolean) {
    options.onPairingChange?.({ connected, pairedDeviceId });
  }

  if (channel) {
    channel.onmessage = (event) => {
      if (!isPresenterMessage(event.data)) {
        return;
      }

      if (event.data.type === "controller-ready") {
        if (!pairedDeviceId) {
          pairedDeviceId = event.data.deviceId;
          channel.postMessage({
            type: "host-paired",
            deviceId: event.data.deviceId,
          } satisfies KalamburyPresenterMessage);
          emitPairingChange(true);
          return;
        }

        if (pairedDeviceId === event.data.deviceId) {
          channel.postMessage({
            type: "host-paired",
            deviceId: event.data.deviceId,
          } satisfies KalamburyPresenterMessage);
          emitPairingChange(true);
          return;
        }

        channel.postMessage({
          type: "host-rejected",
          deviceId: event.data.deviceId,
        } satisfies KalamburyPresenterMessage);
      }

      if (
        event.data.type === "controller-disconnected" &&
        pairedDeviceId === event.data.deviceId
      ) {
        pairedDeviceId = null;
        emitPairingChange(false);
      }

      if (
        event.data.type === "controller-reveal-request" &&
        pairedDeviceId === event.data.deviceId
      ) {
        options.onRevealRequest?.({ deviceId: event.data.deviceId });
      }

      if (
        event.data.type === "controller-reroll-request" &&
        pairedDeviceId === event.data.deviceId
      ) {
        options.onRerollRequest?.({ deviceId: event.data.deviceId });
      }
    };

    if (pairedDeviceId) {
      channel.postMessage({
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

      channel?.postMessage({
        type: "presenter-phrase",
        deviceId: pairedDeviceId,
        ...payload,
      } satisfies KalamburyPresenterMessage);
    },
    clearPhrase() {
      channel?.postMessage({
        type: "presenter-clear",
        deviceId: pairedDeviceId,
      } satisfies KalamburyPresenterMessage);
    },
    startPreviewWindow() {
      if (!pairedDeviceId) {
        return;
      }

      channel?.postMessage({
        type: "host-preview-start",
        deviceId: pairedDeviceId,
      } satisfies KalamburyPresenterMessage);
    },
    finishPreviewWindow() {
      if (!pairedDeviceId) {
        return;
      }

      channel?.postMessage({
        type: "host-preview-finish",
        deviceId: pairedDeviceId,
      } satisfies KalamburyPresenterMessage);
    },
    resetPreviewWindow() {
      if (!pairedDeviceId) {
        return;
      }

      channel?.postMessage({
        type: "host-preview-reset",
        deviceId: pairedDeviceId,
      } satisfies KalamburyPresenterMessage);
    },
    disconnectPresenterDevice() {
      pairedDeviceId = null;
      channel?.postMessage({ type: "host-reset" } satisfies KalamburyPresenterMessage);
      emitPairingChange(false);
    },
    destroy() {
      channel?.close();
    },
  };
}

export function createKalamburyPresenterControllerBridge(
  sessionCode: string,
  options: ControllerBridgeOptions = {},
) {
  const channel = createChannel(sessionCode, options.BroadcastChannelImpl);
  const deviceId = options.deviceId ?? createDeviceId();
  let isDestroyed = false;

  function postReady() {
    if (isDestroyed) {
      return;
    }

    channel?.postMessage({
      type: "controller-ready",
      deviceId,
    } satisfies KalamburyPresenterMessage);
  }

  if (channel) {
    channel.onmessage = (event) => {
      if (!isPresenterMessage(event.data)) {
        return;
      }

      if (
        event.data.type === "host-probe" &&
        event.data.deviceId === deviceId
      ) {
        postReady();
      }

      if (
        event.data.type === "host-paired" &&
        event.data.deviceId === deviceId
      ) {
        options.onConnectionStateChange?.("connected");
      }

      if (
        event.data.type === "host-rejected" &&
        event.data.deviceId === deviceId
      ) {
        options.onConnectionStateChange?.("rejected");
      }

      if (event.data.type === "host-reset") {
        options.onConnectionStateChange?.("pending");
        options.onPreviewStateChange?.("pending-reveal");
        options.onPhraseChange?.(null);
      }

      if (
        event.data.type === "presenter-clear" &&
        (!event.data.deviceId || event.data.deviceId === deviceId)
      ) {
        options.onPhraseChange?.(null);
      }

      if (
        event.data.type === "host-preview-start" &&
        event.data.deviceId === deviceId
      ) {
        options.onPreviewStateChange?.("preview");
      }

      if (
        event.data.type === "host-preview-finish" &&
        event.data.deviceId === deviceId
      ) {
        options.onPreviewStateChange?.("hidden-live");
      }

      if (
        event.data.type === "host-preview-reset" &&
        event.data.deviceId === deviceId
      ) {
        options.onPreviewStateChange?.("pending-reveal");
      }

      if (
        event.data.type === "presenter-phrase" &&
        event.data.deviceId === deviceId
      ) {
        options.onPhraseChange?.({
          phrase: event.data.phrase,
          categoryLabel: event.data.categoryLabel,
          wordCount: event.data.wordCount,
          presenterName: event.data.presenterName,
          phraseChangeAllowed: event.data.phraseChangeAllowed,
          phraseChangeRemaining: event.data.phraseChangeRemaining,
        });
      }
    };
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

      channel?.postMessage({
        type: "controller-reveal-request",
        deviceId,
      } satisfies KalamburyPresenterMessage);
    },
    requestPhraseChange() {
      if (isDestroyed) {
        return;
      }

      channel?.postMessage({
        type: "controller-reroll-request",
        deviceId,
      } satisfies KalamburyPresenterMessage);
    },
    destroy() {
      if (isDestroyed) {
        return;
      }

      isDestroyed = true;
      channel?.postMessage({
        type: "controller-disconnected",
        deviceId,
      } satisfies KalamburyPresenterMessage);
      channel?.close();
    },
  };
}
