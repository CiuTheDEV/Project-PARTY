import { useEffect } from "react";

import type { KalamburySetupPayload } from "../../runtime/state-machine";
import type { KalamburyPresenterChannel } from "../../shared/presenter/types";
import { usePresenterHostBridge } from "./usePresenterHostBridge";
import type { KalamburyGameplayHandle } from "./useKalamburyGameplay";

type UseKalamburyPresenterSyncOptions = {
  setupPayload: KalamburySetupPayload;
  sessionCode: string | undefined;
  transportChannel: KalamburyPresenterChannel | undefined;
  gameplay: KalamburyGameplayHandle;
};

export function useKalamburyPresenterSync({
  setupPayload,
  sessionCode,
  transportChannel,
  gameplay,
}: UseKalamburyPresenterSyncOptions) {
  const { pairState, bridge } = usePresenterHostBridge({
    sessionCode,
    enabled: setupPayload.presenterDevice?.enabled ?? false,
    initialPairedDeviceId: setupPayload.presenterDevice?.pairedDeviceId ?? null,
    channel: transportChannel,
    pingIntervalMs: 3000,
    pingTimeoutMs: 5000,
    onRevealRequest: () => {
      gameplay.onRevealRequest(() => bridge.startPreviewWindow());
    },
    onRerollRequest: () => {
      gameplay.onRerollRequest();
    },
  });

  const {
    playState,
    presenter,
    presenterRevealStage,
    presenterRevealCountdown,
    presenterPhraseChangeAllowed,
    presenterPhraseChangeRemaining,
    onTimerTick,
    onStartTurnAfterPreview,
    onPresenterRevealCountdownTick,
  } = gameplay;

  const presenterReconnectRequired =
    Boolean(setupPayload.presenterDevice?.enabled) &&
    Boolean(sessionCode) &&
    (playState?.stage === "PRZYGOTOWANIE" || playState?.stage === "ACT") &&
    !pairState.connected;

  // Timer tick during ACT stage
  useEffect(() => {
    if (!playState || playState.stage !== "ACT" || presenterReconnectRequired) {
      return;
    }

    const intervalId = window.setInterval(() => {
      onTimerTick(presenterReconnectRequired);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [playState?.stage, presenterReconnectRequired, onTimerTick]);

  // Presenter preview countdown (PRZYGOTOWANIE → ACT after N seconds)
  useEffect(() => {
    if (
      playState?.stage !== "PRZYGOTOWANIE" ||
      presenterRevealStage !== "preview" ||
      presenterReconnectRequired
    ) {
      return;
    }

    if (presenterRevealCountdown <= 0) {
      bridge.finishPreviewWindow();
      onStartTurnAfterPreview();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onPresenterRevealCountdownTick();
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [
    playState?.stage,
    presenterReconnectRequired,
    presenterRevealCountdown,
    presenterRevealStage,
    onStartTurnAfterPreview,
    onPresenterRevealCountdownTick,
    bridge,
  ]);

  // Publish phrase to controller when in PRZYGOTOWANIE
  useEffect(() => {
    if (
      !playState ||
      !presenter ||
      playState.stage !== "PRZYGOTOWANIE" ||
      !pairState.connected ||
      !pairState.pairedDeviceId
    ) {
      bridge.clearPhrase();
      return;
    }

    bridge.publishPhrase({
      phrase: playState.phrase,
      categoryLabel: playState.phraseCategoryLabel,
      wordCount: playState.wordCount,
      presenterName: presenter.name,
      phraseChangeAllowed: presenterPhraseChangeAllowed,
      phraseChangeRemaining: presenterPhraseChangeRemaining,
    });
  }, [
    playState,
    presenter,
    pairState,
    presenterPhraseChangeAllowed,
    presenterPhraseChangeRemaining,
    bridge,
  ]);

  // Clear phrase and finish preview when entering ACT
  useEffect(() => {
    if (!playState || !pairState.connected) return;
    if (playState.stage === "ACT") {
      bridge.finishPreviewWindow();
      bridge.clearPhrase();
    }
  }, [playState, pairState.connected, bridge]);

  // Reset preview window on controller when back to pending
  useEffect(() => {
    if (
      !playState ||
      playState.stage !== "PRZYGOTOWANIE" ||
      !pairState.connected
    ) {
      return;
    }
    if (presenterRevealStage === "pending") {
      bridge.resetPreviewWindow();
    }
  }, [playState, pairState.connected, presenterRevealStage, bridge]);

  // Clear phrase on unmount
  useEffect(() => {
    return () => bridge.clearPhrase();
  }, [bridge]);

  return { pairState, bridge, presenterReconnectRequired };
}
