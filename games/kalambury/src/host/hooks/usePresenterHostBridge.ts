// games/kalambury/src/host/hooks/usePresenterHostBridge.ts

import { useEffect, useRef, useState } from "react";

import { createKalamburyPresenterHostBridge } from "../../shared/presenter/host-bridge.ts";
import type {
  KalamburyPresenterChannel,
  KalamburyPresenterPairState,
  KalamburyPresenterPhrasePayload,
} from "../../shared/presenter/types.ts";

type UsePresenterHostBridgeOptions = {
  sessionCode: string | undefined;
  enabled: boolean;
  initialPairedDeviceId: string | null;
  channel: KalamburyPresenterChannel | undefined;
  pingIntervalMs?: number;
  pingTimeoutMs?: number;
  onRevealRequest?: () => void;
  onRerollRequest?: () => void;
};

// Stable handle returned from the hook — always the same object reference,
// methods forward to the current bridge. This avoids null-checks at call sites
// and eliminates the problem of returning bridgeRef.current (which is null
// on first render before the useEffect runs).
type PresenterHostBridgeHandle = {
  publishPhrase: (payload: KalamburyPresenterPhrasePayload) => void;
  clearPhrase: () => void;
  startPreviewWindow: () => void;
  finishPreviewWindow: () => void;
  resetPreviewWindow: () => void;
  disconnectPresenterDevice: () => void;
};

type UsePresenterHostBridgeResult = {
  pairState: KalamburyPresenterPairState;
  bridge: PresenterHostBridgeHandle;
};

export function usePresenterHostBridge(
  options: UsePresenterHostBridgeOptions,
): UsePresenterHostBridgeResult {
  const {
    sessionCode,
    enabled,
    initialPairedDeviceId,
    channel,
    pingIntervalMs,
    pingTimeoutMs,
  } = options;

  // Keep callbacks in refs so bridge never needs to be recreated when they change
  const onRevealRequestRef = useRef(options.onRevealRequest);
  const onRerollRequestRef = useRef(options.onRerollRequest);
  useEffect(() => {
    onRevealRequestRef.current = options.onRevealRequest;
  });
  useEffect(() => {
    onRerollRequestRef.current = options.onRerollRequest;
  });

  const [pairState, setPairState] = useState<KalamburyPresenterPairState>({
    connected: false,
    pairedDeviceId: null,
  });

  const bridgeRef = useRef<ReturnType<
    typeof createKalamburyPresenterHostBridge
  > | null>(null);

  // Stable handle — always the same object, delegates to current bridgeRef.current
  const stableHandle = useRef<PresenterHostBridgeHandle>({
    publishPhrase: (payload) => bridgeRef.current?.publishPhrase(payload),
    clearPhrase: () => bridgeRef.current?.clearPhrase(),
    startPreviewWindow: () => bridgeRef.current?.startPreviewWindow(),
    finishPreviewWindow: () => bridgeRef.current?.finishPreviewWindow(),
    resetPreviewWindow: () => bridgeRef.current?.resetPreviewWindow(),
    disconnectPresenterDevice: () => bridgeRef.current?.disconnectPresenterDevice(),
  });

  useEffect(() => {
    if (!enabled || !sessionCode) {
      setPairState({ connected: false, pairedDeviceId: null });
      bridgeRef.current = null;
      return;
    }

    const bridge = createKalamburyPresenterHostBridge(sessionCode, {
      channel,
      initialPairedDeviceId,
      pingIntervalMs,
      pingTimeoutMs,
      onPairingChange: (state) => {
        setPairState(state);
      },
      onRevealRequest: () => {
        onRevealRequestRef.current?.();
      },
      onRerollRequest: () => {
        onRerollRequestRef.current?.();
      },
    });

    bridgeRef.current = bridge;

    return () => {
      bridge.destroy();
      if (bridgeRef.current === bridge) {
        bridgeRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, sessionCode, channel, pingIntervalMs, pingTimeoutMs]);

  return { pairState, bridge: stableHandle.current };
}
