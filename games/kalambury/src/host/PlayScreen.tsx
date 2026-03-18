import type { KalamburyPlayState, KalamburySetupPayload } from "../runtime/state-machine";
import type { KalamburyPresenterChannel } from "../shared/presenter/types";
import { useKalamburyGameplay } from "./hooks/useKalamburyGameplay";
import { useKalamburyPresenterSync } from "./hooks/useKalamburyPresenterSync";
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

export function PlayScreen({
  setupPayload,
  sessionCode,
  transportChannel,
  onBackToHub,
}: PlayScreenProps) {
  const gameplay = useKalamburyGameplay(setupPayload);
  const { pairState: presenterPairState, presenterReconnectRequired } =
    useKalamburyPresenterSync({ setupPayload, sessionCode, transportChannel, gameplay });

  const {
    playState,
    pendingDrawState,
    scoreOutcome,
    selectedGuesserId,
    presenterBonus,
    isPhraseRevealed,
    presenterRevealStage,
    presenterRevealCountdown,
    presenter,
    presenterPhraseChangeAllowed,
    presenterPhraseChangeRemaining,
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
  } = gameplay;

  if (!playState) return null;

  const setup = setupPayload;
  const currentTurnLabel = `${playState.turnInRound + 1}/${setup.players.length}`;
  const eventLabel =
    playState.activeEvent === "golden-points"
      ? "Golden Points"
      : playState.activeEvent === "rush"
        ? "Rush"
        : null;
  const winner = sortedScoreboard[0] ?? null;

  function getStageLabel(stage: KalamburyPlayState["stage"]) {
    if (stage === "LOSOWANIE" || stage === "KOLEJNOSC") return "LOSOWANIE";
    if (stage === "PRZYGOTOWANIE") return "PRZYGOTOWANIE";
    if (stage === "ACT") return "PREZENTOWANIE";
    if (stage === "SCORE") return "WERDYKT";
    return "PODSUMOWANIE";
  }

  function getAdvanceLabel() {
    if (
      playState.turnInRound + 1 >= setup.players.length &&
      playState.roundNumber >= playState.totalRounds
    ) {
      return "Zakoncz gre";
    }
    if (playState.turnInRound + 1 >= setup.players.length) {
      return "Nowa runda";
    }
    return "Zapisz i dalej";
  }

  function getDrawCtaLabel() {
    if (isDrawAnimating) return "Losowanie w toku...";
    return "Losowanie kolejnosci";
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
                  {presenterPairState.connected ? "smartphone" : "phonelink_off"}
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
                onStop={() => handleScoreStage(presenterReconnectRequired)}
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
