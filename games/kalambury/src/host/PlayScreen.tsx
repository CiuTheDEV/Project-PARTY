import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
} from "../runtime/state-machine";
import type { KalamburyPresenterChannel } from "../shared/presenter/types";
import { PRESENTER_REVEAL_PREVIEW_SECONDS } from "../settings/constants";
import { usePresenterHostBridge } from "./hooks/usePresenterHostBridge";
import { KalamburyPresenterQrModal } from "./modals/PresenterQrModal.tsx";
import { DrawSequence } from "./components/DrawSequence";
import { PreparePhase } from "./components/PreparePhase";
import { ActPhase } from "./components/ActPhase";
import { ScorePhase } from "./components/ScorePhase";
import { FinishedPhase } from "./components/FinishedPhase";

type PlayScreenProps = {
  setupPayload: KalamburySetupPayload;
  sessionCode?: string;
  transportChannel?: KalamburyPresenterChannel;
  onBackToHub: () => void;
};

type ScoreOutcome = "pending" | "guessed" | "missed";
type PresenterRevealStage = "pending" | "preview";

export function PlayScreen({
  setupPayload,
  sessionCode,
  transportChannel,
  onBackToHub,
}: PlayScreenProps) {
  const [playState, setPlayState] = useState<KalamburyPlayState | null>(() =>
    createKalamburyPlayState(setupPayload),
  );
  const [scoreOutcome, setScoreOutcome] = useState<ScoreOutcome>("pending");
  const [selectedGuesserId, setSelectedGuesserId] = useState<string | null>(
    null,
  );
  const [presenterBonus, setPresenterBonus] = useState(false);
  const [isPhraseRevealed, setIsPhraseRevealed] = useState(false);
  const [pendingDrawState, setPendingDrawState] =
    useState<KalamburyPlayState | null>(null);
  const lastRerollRef = useRef(0);
  const [presenterRevealStage, setPresenterRevealStage] =
    useState<PresenterRevealStage>("pending");
  const [presenterRevealCountdown, setPresenterRevealCountdown] = useState(
    PRESENTER_REVEAL_PREVIEW_SECONDS,
  );

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
      pendingDrawState !== null
    ) {
      setPendingDrawState(null);
    }
  }, [playState?.stage, pendingDrawState]);

  const { pairState: presenterPairState, bridge: presenterBridge } =
    usePresenterHostBridge({
      sessionCode,
      enabled: setupPayload.presenterDevice?.enabled ?? false,
      initialPairedDeviceId:
        setupPayload.presenterDevice?.pairedDeviceId ?? null,
      channel: transportChannel,
      pingIntervalMs: 3000,
      pingTimeoutMs: 5000,
      onRevealRequest: () => {
        // These values come from the latest render's closure — safe because the hook
        // stores onRevealRequest in a ref and reads .current at call time.
        if (playState?.stage !== "PRZYGOTOWANIE") {
          return;
        }

        setPresenterRevealStage("preview");
        setPresenterRevealCountdown(PRESENTER_REVEAL_PREVIEW_SECONDS);
        presenterBridge.startPreviewWindow();
      },
      onRerollRequest: () => {
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
      },
    });

  const presenterReconnectRequired =
    Boolean(setupPayload.presenterDevice?.enabled) &&
    Boolean(sessionCode) &&
    (playState?.stage === "PRZYGOTOWANIE" || playState?.stage === "ACT") &&
    !presenterPairState.connected;

  useEffect(() => {
    if (!playState || playState.stage !== "ACT" || presenterReconnectRequired) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setPlayState((current) => {
        if (!current) {
          return current;
        }

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
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [playState?.stage, presenterReconnectRequired]);

  // Clear presenter phrase when PlayScreen unmounts
  useEffect(() => {
    return () => {
      presenterBridge.clearPhrase();
    };
  }, [presenterBridge]);

  useEffect(() => {
    if (
      playState?.stage !== "PRZYGOTOWANIE" ||
      presenterRevealStage !== "preview" ||
      presenterReconnectRequired
    ) {
      return;
    }

    if (presenterRevealCountdown <= 0) {
      presenterBridge.finishPreviewWindow();
      setPlayState((current) =>
        current ? startKalamburyTurn(current) : current,
      );
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPresenterRevealCountdown((current) => current - 1);
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    playState?.stage,
    presenterReconnectRequired,
    presenterRevealCountdown,
    presenterRevealStage,
  ]);

  const presenter = useMemo(() => {
    if (!playState) {
      return null;
    }

    const presenterId = getKalamburyCurrentPresenterId(playState);
    return (
      setupPayload.players.find((player) => player.id === presenterId) ?? null
    );
  }, [playState, setupPayload.players]);

  const presenterPhraseChangeRemaining =
    presenter && playState
      ? (playState.phraseChangeRemainingByPlayerId[presenter.id] ?? 0)
      : 0;
  const presenterPhraseChangeAllowed = presenterPhraseChangeRemaining !== 0;

  const turnOrderPlayers = useMemo(
    () =>
      playState
        ? playState.turnOrderIds.reduce<
            Array<KalamburySetupPayload["players"][number]>
          >((accumulator, playerId) => {
            const player = setupPayload.players.find(
              (candidate) => candidate.id === playerId,
            );
            if (player) {
              accumulator.push(player);
            }
            return accumulator;
          }, [])
        : [],
    [playState, setupPayload],
  );

  const sortedScoreboard = useMemo(
    () =>
      playState
        ? [...setupPayload.players].sort(
            (left, right) =>
              (playState.scores[right.id] ?? 0) -
              (playState.scores[left.id] ?? 0),
          )
        : [],
    [playState, setupPayload],
  );

  const hostHintChips = useMemo(() => {
    if (!playState) {
      return [];
    }

    const hints = setupPayload.modeSettings.hints ?? {
      enabled: false,
      showWordCount: false,
      showCategory: false,
    };
    if (!hints.enabled) {
      return [];
    }

    return [
      hints.showWordCount ? `Ilosc slow: ${playState.wordCount}` : null,
      hints.showCategory ? `Kategoria: ${playState.phraseCategoryLabel}` : null,
    ].filter(Boolean) as string[];
  }, [playState, setupPayload]);

  const winner = sortedScoreboard[0] ?? null;
  const isDrawAnimating = pendingDrawState !== null;

  useEffect(() => {
    if (
      !playState ||
      !presenter ||
      playState.stage !== "PRZYGOTOWANIE" ||
      !presenterPairState.connected ||
      !presenterPairState.pairedDeviceId
    ) {
      presenterBridge.clearPhrase();
      return;
    }

    presenterBridge.publishPhrase({
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
    presenterPairState,
    presenterPhraseChangeAllowed,
    presenterPhraseChangeRemaining,
    presenterBridge,
  ]);

  useEffect(() => {
    if (!playState || !presenterPairState.connected) {
      return;
    }

    if (playState.stage === "ACT") {
      presenterBridge.finishPreviewWindow();
      presenterBridge.clearPhrase();
    }
  }, [playState, presenterPairState.connected, presenterBridge]);

  useEffect(() => {
    if (
      !playState ||
      playState.stage !== "PRZYGOTOWANIE" ||
      !presenterPairState.connected
    ) {
      return;
    }

    if (presenterRevealStage === "pending") {
      presenterBridge.resetPreviewWindow();
    }
  }, [playState, presenterPairState.connected, presenterRevealStage, presenterBridge]);

  if (!playState) {
    return null;
  }

  const setup = setupPayload;
  const currentPlayState = playState;
  const currentTurnLabel = `${currentPlayState.turnInRound + 1}/${setup.players.length}`;
  const eventLabel =
    currentPlayState.activeEvent === "golden-points"
      ? "Golden Points"
      : currentPlayState.activeEvent === "rush"
        ? "Rush"
        : null;
  const scoreResolutionValid =
    scoreOutcome === "missed" ||
    (scoreOutcome === "guessed" && selectedGuesserId !== null);
  const guesserOptions = setup.players.filter(
    (player) => player.id !== presenter?.id,
  );

  function getStageLabel(stage: KalamburyPlayState["stage"]) {
    if (stage === "LOSOWANIE" || stage === "KOLEJNOSC") {
      return "LOSOWANIE";
    }
    if (stage === "PRZYGOTOWANIE") {
      return "PRZYGOTOWANIE";
    }
    if (stage === "ACT") {
      return "PREZENTOWANIE";
    }
    if (stage === "SCORE") {
      return "WERDYKT";
    }
    return "PODSUMOWANIE";
  }

  function getAdvanceLabel() {
    if (
      currentPlayState.turnInRound + 1 >= setup.players.length &&
      currentPlayState.roundNumber >= currentPlayState.totalRounds
    ) {
      return "Zakoncz gre";
    }
    if (currentPlayState.turnInRound + 1 >= setup.players.length) {
      return "Nowa runda";
    }
    return "Zapisz i dalej";
  }

  function getDrawCtaLabel() {
    if (isDrawAnimating) {
      return "Losowanie w toku...";
    }
    return "Losowanie kolejnosci";
  }

  function handleDrawOrder() {
    if (isDrawAnimating) {
      return;
    }

    setPlayState((current) => {
      if (!current) {
        return current;
      }

      const nextState = drawKalamburyTurnOrder(current, setup);
      setPendingDrawState(nextState);
      return current;
    });
  }

  function handleDrawComplete(finalState: KalamburyPlayState) {
    setPlayState(finalState);
    setPendingDrawState(null);
  }

  function handleSkipDraw() {
    if (!pendingDrawState) {
      return;
    }
    setPlayState(pendingDrawState);
    setPendingDrawState(null);
  }

  function handleShowPreparation() {
    setPlayState((current) =>
      current ? enterKalamburyPreparation(current, setup) : current,
    );
    setPresenterRevealStage("pending");
    setPresenterRevealCountdown(PRESENTER_REVEAL_PREVIEW_SECONDS);
  }

  function handleScoreStage() {
    if (presenterReconnectRequired) {
      return;
    }

    setPlayState((current) =>
      current ? enterKalamburyScore(current) : current,
    );
  }

  function handleResolveScore() {
    if (!scoreResolutionValid) {
      return;
    }

    setPlayState((current) =>
      current
        ? resolveKalamburyScore(current, setup, {
            guessedByPlayerId:
              scoreOutcome === "guessed" ? selectedGuesserId : null,
            presenterBonus,
          })
        : current,
    );
  }

  function handleBackFromScore() {
    if (scoreOutcome === "pending") {
      return;
    }

    setScoreOutcome("pending");
    setSelectedGuesserId(null);
    setPresenterBonus(false);
    setIsPhraseRevealed(false);
  }

  return (
    <main className="app-shell app-shell--kalambury-play">
      <div className="ambient-orb ambient-orb--primary" aria-hidden="true" />
      <div
        className="ambient-orb ambient-orb--kalambury-secondary"
        aria-hidden="true"
      />

      <section className="hero hero--kalambury-play hero--kalambury-playwide">
        <header className="kalambury-playtopbar kalambury-playbar">
          <div className="kalambury-playtopbar__left">
            <span className="kalambury-stage-pill">
              {getStageLabel(playState.stage)}
            </span>
            {Boolean(setupPayload.presenterDevice?.enabled) && (
              <span
                className={
                  presenterPairState.connected
                    ? "kalambury-presenter-status kalambury-presenter-status--connected"
                    : "kalambury-presenter-status kalambury-presenter-status--disconnected"
                }
                aria-label={
                  presenterPairState.connected
                    ? "Telefon prezentera połączony"
                    : "Czekam na telefon prezentera..."
                }
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  {presenterPairState.connected
                    ? "smartphone"
                    : "phonelink_off"}
                </span>
              </span>
            )}
          </div>
          <div className="kalambury-playtopbar__actions">
            {isDrawAnimating && setup.players.length > 4 ? (
              <button
                className="kalambury-playtopbar__skip-draw"
                type="button"
                onClick={handleSkipDraw}
                aria-label="Pominij animacje losowania"
              >
                Pomiń losowanie
              </button>
            ) : null}
            <button
              className="kalambury-playtopbar__settings"
              type="button"
              onClick={onBackToHub}
              aria-label="Wroc do menu gry i ustawien"
            >
              Ustawienia
            </button>
          </div>
        </header>

        <section className="kalambury-stage-shell kalambury-stage-shell--fullstage">
          <div className="kalambury-stage-canvas">
            {(playState.stage === "LOSOWANIE" || playState.stage === "KOLEJNOSC") && pendingDrawState ? (
              <DrawSequence
                players={setup.players}
                pendingDrawState={pendingDrawState}
                onComplete={handleDrawComplete}
                onSkip={handleSkipDraw}
                canSkip={setup.players.length > 4}
              />
            ) : null}

            {playState.stage === "LOSOWANIE" && !pendingDrawState ? (
              <div className="kalambury-stage-panel kalambury-stage-panel--draw">
                <div className="kalambury-card-stack" aria-hidden="true">
                  <div className="kalambury-card-stack__card kalambury-card-stack__card--back" />
                  <div className="kalambury-card-stack__card kalambury-card-stack__card--mid" />
                  <div className="kalambury-card-stack__card kalambury-card-stack__card--front">
                    <span>KALAMBURY</span>
                  </div>
                </div>
              </div>
            ) : null}

            {playState.stage === "KOLEJNOSC" ? (
              <div className="kalambury-stage-panel kalambury-stage-panel--order">
                <div
                  className={
                    turnOrderPlayers.length >= 9
                      ? "kalambury-order-grid kalambury-order-grid--dense"
                      : turnOrderPlayers.length >= 5
                        ? "kalambury-order-grid kalambury-order-grid--compact"
                        : turnOrderPlayers.length % 2 === 1
                          ? "kalambury-order-grid kalambury-order-grid--orphan"
                          : "kalambury-order-grid"
                  }
                >
                  {turnOrderPlayers.map((player, index) => (
                    <article
                      className="kalambury-persona-card kalambury-persona-card--order kalambury-order-card"
                      data-gender={player.gender}
                      key={player.id}
                    >
                      <span className="kalambury-persona-card__badge kalambury-order-card__index">
                        {index + 1}
                      </span>
                      <div
                        className="kalambury-persona-card__avatar kalambury-order-card__avatar"
                        aria-hidden="true"
                      >
                        {player.avatar}
                      </div>
                      <strong className="kalambury-persona-card__nameplate kalambury-order-card__name">
                        {player.name}
                      </strong>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {playState.stage === "PRZYGOTOWANIE" && presenter ? (
              <PreparePhase
                presenter={presenter}
                currentTurnLabel={currentTurnLabel}
                presenterRevealStage={presenterRevealStage}
                presenterRevealCountdown={presenterRevealCountdown}
                presenterReconnectRequired={presenterReconnectRequired}
              />
            ) : null}

            {playState.stage === "ACT" && presenter ? (
              <ActPhase
                playState={playState}
                presenter={presenter}
                currentTurnLabel={currentTurnLabel}
                presenterReconnectRequired={presenterReconnectRequired}
                hostHintChips={hostHintChips}
                eventLabel={eventLabel}
                onStop={handleScoreStage}
              />
            ) : null}

            {playState.stage === "SCORE" && presenter ? (
              <ScorePhase
                playState={playState}
                presenter={presenter}
                guesserOptions={guesserOptions}
                scoreOutcome={scoreOutcome}
                selectedGuesserId={selectedGuesserId}
                presenterBonus={presenterBonus}
                isPhraseRevealed={isPhraseRevealed}
                scoreResolutionValid={scoreResolutionValid}
                onSetScoreOutcome={setScoreOutcome}
                onSetSelectedGuesserId={setSelectedGuesserId}
                onSetPresenterBonus={setPresenterBonus}
                onSetIsPhraseRevealed={setIsPhraseRevealed}
                onResolveScore={handleResolveScore}
                onBackFromScore={handleBackFromScore}
                getAdvanceLabel={getAdvanceLabel}
              />
            ) : null}

            {playState.stage === "FINISHED" ? (
              <FinishedPhase
                playState={playState}
                sortedScoreboard={sortedScoreboard}
                winner={winner}
                onBackToHub={onBackToHub}
              />
            ) : null}
          </div>
        </section>

        {playState.stage === "LOSOWANIE" ? (
          <footer className="kalambury-stage-footer kalambury-playbar">
            <button
              className="kalambury-footer-button kalambury-footer-button--primary kalambury-stage-footer__cta"
              type="button"
              disabled={isDrawAnimating}
              onClick={handleDrawOrder}
            >
              {getDrawCtaLabel()}
            </button>
          </footer>
        ) : null}

        {playState.stage === "KOLEJNOSC" ? (
          <footer className="kalambury-stage-footer kalambury-playbar">
            <button
              className="kalambury-footer-button kalambury-footer-button--primary kalambury-stage-footer__cta"
              type="button"
              onClick={handleShowPreparation}
            >
              Pokaz prezentera
            </button>
          </footer>
        ) : null}

        {playState.stage === "PRZYGOTOWANIE" ? (
          <footer className="kalambury-stage-footer kalambury-playbar" />
        ) : null}

        <KalamburyPresenterQrModal
          isOpen={presenterReconnectRequired}
          sessionCode={sessionCode}
          controllerHref={
            sessionCode
              ? `/games/kalambury/controller/${sessionCode}`
              : undefined
          }
          dismissible={false}
          onClose={() => {}}
          connected={false}
        />
      </section>
    </main>
  );
}
