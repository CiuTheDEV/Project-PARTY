// games/kalambury/src/shared/presenter/types.ts

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

export type KalamburyPresenterPreviewState =
  | "pending-reveal"
  | "preview"
  | "hidden-live";

export type KalamburyControllerConnectionState =
  | "pending"
  | "connected"
  | "rejected";

export type HostToControllerMessage =
  | { type: "host-probe"; deviceId: string }
  | { type: "host-ping"; deviceId: string }
  | { type: "host-paired"; deviceId: string }
  | { type: "host-rejected"; deviceId: string }
  | { type: "host-reset" }
  | { type: "host-preview-start"; deviceId: string }
  | { type: "host-preview-finish"; deviceId: string }
  | { type: "host-preview-reset"; deviceId: string }
  | ({ type: "presenter-phrase"; deviceId: string } & KalamburyPresenterPhrasePayload)
  | { type: "presenter-clear"; deviceId: string | null };

export type ControllerToHostMessage =
  | { type: "controller-ready"; deviceId: string }
  | { type: "controller-disconnected"; deviceId: string }
  | { type: "controller-pong"; deviceId: string }
  | { type: "controller-reveal-request"; deviceId: string }
  | { type: "controller-reroll-request"; deviceId: string };

export type KalamburyPresenterMessage =
  | HostToControllerMessage
  | ControllerToHostMessage;

export function isPresenterMessage(
  value: unknown,
): value is KalamburyPresenterMessage {
  if (!value || typeof value !== "object") return false;
  return typeof (value as { type?: unknown }).type === "string";
}

type BroadcastChannelLike = {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  postMessage: (message: unknown) => void;
  close: () => void;
};

export type BroadcastChannelConstructor = new (name: string) => BroadcastChannelLike;

export type KalamburyPresenterChannel = {
  postMessage: (message: KalamburyPresenterMessage) => void | Promise<void>;
  subscribe: (
    handler: (message: KalamburyPresenterMessage) => void,
  ) => () => void;
  close?: () => void;
};

export type HostBridgeOptions = {
  BroadcastChannelImpl?: BroadcastChannelConstructor;
  channel?: KalamburyPresenterChannel;
  initialPairedDeviceId?: string | null;
  probeTimeoutMs?: number;
  pingIntervalMs?: number;
  pingTimeoutMs?: number;
  onPairingChange?: (state: KalamburyPresenterPairState) => void;
  onRevealRequest?: (state: { deviceId: string }) => void;
  onRerollRequest?: (state: { deviceId: string }) => void;
};

export type ControllerBridgeOptions = {
  BroadcastChannelImpl?: BroadcastChannelConstructor;
  channel?: KalamburyPresenterChannel;
  deviceId?: string;
  readyRetryMs?: number;
  onPhraseChange?: (payload: KalamburyPresenterPhrasePayload | null) => void;
  onPreviewStateChange?: (state: KalamburyPresenterPreviewState) => void;
  onConnectionStateChange?: (state: KalamburyControllerConnectionState) => void;
};
