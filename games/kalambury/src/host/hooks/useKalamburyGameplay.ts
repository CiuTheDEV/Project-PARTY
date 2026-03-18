import { useEffect, useMemo, useRef, useState } from "react";

import {
  type KalamburyPlayState,
  type KalamburySetupPayload,
  createKalamburyPlayState,
  drawKalamburyTurnOrder,
  enterKalamburyPreparation,
  enterKalamburyScore,
  getKalamburyCurrentPresenterId,
  rerollKalamburyPhrase,
  resolveKalamburyScore,
  startKalamburyTurn,
} from "../../runtime/state-machine";
import { PRESENTER_REVEAL_PREVIEW_SECONDS } from "../../settings/constants";

export type ScoreOutcome = "pending" | "guessed" | "missed";
export type PresenterRevealStage = "pending" | "preview";

export type KalamburyGameplayHandle = {
  // State
  playState: KalamburyPlayState | null;
  pendingDrawState: KalamburyPlayState | null;
  scoreOutcome: ScoreOutcome;
  selectedGuesserId: string | null;
  presenterBonus: boolean;
  isPhraseRevealed: boolean;
  presenterRevealStage: PresenterRevealStage;
  presenterRevealCountdown: number;
  presenter: KalamburySetupPayload["players"][number] | null;
  presenterPhraseChangeRemaining: number | "infinite";
  presenterPhraseChangeAllowed: boolean;
  sortedScoreboard: KalamburySetupPayload["players"];
  hostHintChips: string[];
  isDrawAnimating: boolean;
  scoreResolutionValid: boolean;
  guesserOptions: KalamburySetupPayload["players"];
  // Setters (for ScorePhase bindings)
  setScoreOutcome: (value: ScoreOutcome) => void;
  setSelectedGuesserId: (id: string | null) => void;
  setPresenterBonus: (value: boolean) => void;
  setIsPhraseRevealed: (value: boolean) => void;
  // Actions
  handleDrawOrder: () => void;
  handleDrawComplete: (finalState: KalamburyPlayState) => void;
  handleSkipDraw: () => void;
  handleShowPreparation: () => void;
  handleScoreStage: (presenterReconnectRequired: boolean) => void;
  handleResolveScore: () => void;
  handleBackFromScore: () => void;
  // Called by useKalamburyPresenterSync
  onRevealRequest: (onStartPreview: () => void) => void;
  onRerollRequest: () => void;
  onTimerTick: (presenterReconnectRequired: boolean) => void;
  onStartTurnAfterPreview: () => void;
  onPresenterRevealCountdownTick: () => void;
};

export function useKalamburyGameplay(
  setupPayload: KalamburySetupPayload,
): KalamburyGameplayHandle {
  const [playState, setPlayState] = useState<KalamburyPlayState | null>(() =>
    createKalamburyPlayState(setupPayload),
  );
  const [scoreOutcome, setScoreOutcome] = useState<ScoreOutcome>("pending");
  const [selectedGuesserId, setSelectedGuesserId] = useState<string | null>(null);
  const [presenterBonus, setPresenterBonus] = useState(false);
  const [isPhraseRevealed, setIsPhraseRevealed] = useState(false);
  const [pendingDrawState, setPendingDrawState] = useState<KalamburyPlayState | null>(null);
  const [presenterRevealStage, setPresenterRevealStage] = useState<PresenterRevealStage>("pending");
  const [presenterRevealCountdown, setPresenterRevealCountdown] = useState(
    PRESENTER_REVEAL_PREVIEW_SECONDS,
  );
  const lastRerollRef = useRef(0);

  useEffect(() => {
    setPlayState(createKalamburyPlayState(setupPayload));
    setPresenterRevealStage("pending");
    setPresenterRevealCountdown(PRESENTER_REVEAL_PREVIEW_SECONDS);
  }, [setupPayload]);

  useEffect(() => {
    if (playState?.stage !== "PRZYGOTOWANIE") {
      setPresenterRevealStage("pending");
      setPresenterRevealCountdown(PRESENTER_REVEAL_PREVIEW_SECONDS);
    }
  }, [playState?.stage]);

  useEffect(() => {
    if (!playState || playState.stage !== "SCORE") {
      setScoreOutcome("pending");
      setSelectedGuesserId(null);
      setPresenterBonus(false);
      setIsPhraseRevealed(false);
    }
  }, [playState]);

  useEffect(() => {
    if (
      playState?.stage !== "LOSOWANIE" &&
      playState?.stage !== "KOLEJNOSC" &&
      pendingDrawState !== null
    ) {
      setPendingDrawState(null);
    }
  }, [playState?.stage, pendingDrawState]);

  const presenter = useMemo(() => {
    if (!playState) return null;
    const presenterId = getKalamburyCurrentPresenterId(playState);
    return setupPayload.players.find((p) => p.id === presenterId) ?? null;
  }, [playState, setupPayload.players]);

  const presenterPhraseChangeRemaining =
    presenter && playState
      ? (playState.phraseChangeRemainingByPlayerId[presenter.id] ?? 0)
      : 0;
  const presenterPhraseChangeAllowed = presenterPhraseChangeRemaining !== 0;

  const sortedScoreboard = useMemo(
    () =>
      playState
        ? [...setupPayload.players].sort(
            (l, r) =>
              (playState.scores[r.id] ?? 0) - (playState.scores[l.id] ?? 0),
          )
        : [],
    [playState, setupPayload],
  );

  const hostHintChips = useMemo(() => {
    if (!playState) return [];
    const hints = setupPayload.modeSettings.hints ?? {
      enabled: false,
      showWordCount: false,
      showCategory: false,
    };
    if (!hints.enabled) return [];
    return [
      hints.showWordCount ? `Ilosc slow: ${playState.wordCount}` : null,
      hints.showCategory ? `Kategoria: ${playState.phraseCategoryLabel}` : null,
    ].filter(Boolean) as string[];
  }, [playState, setupPayload]);

  const isDrawAnimating = pendingDrawState !== null;
  const scoreResolutionValid =
    scoreOutcome === "missed" ||
    (scoreOutcome === "guessed" && selectedGuesserId !== null);
  const guesserOptions = setupPayload.players.filter(
    (p) => p.id !== presenter?.id,
  );

  function handleDrawOrder() {
    if (isDrawAnimating) return;
    setPlayState((current) => {
      if (!current) return current;
      const nextState = drawKalamburyTurnOrder(current, setupPayload);
      setPendingDrawState(nextState);
      return current;
    });
  }

  function handleDrawComplete(finalState: KalamburyPlayState) {
    setPlayState(finalState);
  }

  function handleSkipDraw() {
    if (!pendingDrawState) return;
    setPlayState(pendingDrawState);
  }

  function handleShowPreparation() {
    setPlayState((current) =>
      current ? enterKalamburyPreparation(current, setupPayload) : current,
    );
    setPresenterRevealStage("pending");
    setPresenterRevealCountdown(PRESENTER_REVEAL_PREVIEW_SECONDS);
  }

  function handleScoreStage(presenterReconnectRequired: boolean) {
    if (presenterReconnectRequired) return;
    setPlayState((current) =>
      current ? enterKalamburyScore(current) : current,
    );
  }

  function handleResolveScore() {
    if (!scoreResolutionValid) return;
    setPlayState((current) =>
      current
        ? resolveKalamburyScore(current, setupPayload, {
            guessedByPlayerId:
              scoreOutcome === "guessed" ? selectedGuesserId : null,
            presenterBonus,
          })
        : current,
    );
  }

  function handleBackFromScore() {
    if (scoreOutcome === "pending") return;
    setScoreOutcome("pending");
    setSelectedGuesserId(null);
    setPresenterBonus(false);
    setIsPhraseRevealed(false);
  }

  // Called by useKalamburyPresenterSync when controller requests reveal
  function onRevealRequest(onStartPreview: () => void) {
    if (playState?.stage !== "PRZYGOTOWANIE") return;
    setPresenterRevealStage("preview");
    setPresenterRevealCountdown(PRESENTER_REVEAL_PREVIEW_SECONDS);
    onStartPreview();
  }

  // Called by useKalamburyPresenterSync when controller requests reroll
  function onRerollRequest() {
    if (
      playState?.stage !== "PRZYGOTOWANIE" ||
      presenterRevealStage !== "preview"
    ) {
      return;
    }
    if (Date.now() - lastRerollRef.current < 1000) return;
    lastRerollRef.current = Date.now();
    setPlayState((current) =>
      current ? rerollKalamburyPhrase(current, setupPayload) : current,
    );
  }

  // Called by timer interval in useKalamburyPresenterSync
  function onTimerTick(presenterReconnectRequired: boolean) {
    if (presenterReconnectRequired) return;
    setPlayState((current) => {
      if (!current) return current;
      if (current.activeEvent === "rush") {
        const nextTime = current.timerSeconds + 1;
        if (nextTime >= 60) {
          return enterKalamburyScore({ ...current, timerSeconds: 60 });
        }
        return { ...current, timerSeconds: nextTime };
      }
      const nextTime = current.timerSeconds - 1;
      if (nextTime <= 0) {
        return enterKalamburyScore({ ...current, timerSeconds: 0 });
      }
      return { ...current, timerSeconds: nextTime };
    });
  }

  // Called by useKalamburyPresenterSync when preview countdown reaches 0
  function onStartTurnAfterPreview() {
    setPlayState((current) =>
      current ? startKalamburyTurn(current) : current,
    );
  }

  // Called by useKalamburyPresenterSync each second during preview
  function onPresenterRevealCountdownTick() {
    setPresenterRevealCountdown((current) => current - 1);
  }

  return {
    playState,
    pendingDrawState,
    scoreOutcome,
    selectedGuesserId,
    presenterBonus,
    isPhraseRevealed,
    presenterRevealStage,
    presenterRevealCountdown,
    presenter,
    presenterPhraseChangeRemaining,
    presenterPhraseChangeAllowed,
    sortedScoreboard,
    hostHintChips,
    isDrawAnimating,
    scoreResolutionValid,
    guesserOptions,
    setScoreOutcome,
    setSelectedGuesserId,
    setPresenterBonus,
    setIsPhraseRevealed,
    handleDrawOrder,
    handleDrawComplete,
    handleSkipDraw,
    handleShowPreparation,
    handleScoreStage,
    handleResolveScore,
    handleBackFromScore,
    onRevealRequest,
    onRerollRequest,
    onTimerTick,
    onStartTurnAfterPreview,
    onPresenterRevealCountdownTick,
  };
}
