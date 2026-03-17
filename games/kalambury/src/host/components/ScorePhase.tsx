import type {
  KalamburyPlayState,
  KalamburySetupPayload,
} from "../../runtime/state-machine";

type ScoreOutcome = "pending" | "guessed" | "missed";

export type ScorePhaseProps = {
  playState: KalamburyPlayState;
  presenter: KalamburySetupPayload["players"][number];
  guesserOptions: KalamburySetupPayload["players"];
  scoreOutcome: ScoreOutcome;
  selectedGuesserId: string | null;
  presenterBonus: boolean;
  isPhraseRevealed: boolean;
  scoreResolutionValid: boolean;
  onSetScoreOutcome: (outcome: ScoreOutcome) => void;
  onSetSelectedGuesserId: (id: string) => void;
  onSetPresenterBonus: (fn: (current: boolean) => boolean) => void;
  onSetIsPhraseRevealed: (fn: (current: boolean) => boolean) => void;
  onResolveScore: () => void;
  onBackFromScore: () => void;
  getAdvanceLabel: () => string;
};

export function ScorePhase({
  playState,
  presenter,
  guesserOptions,
  scoreOutcome,
  selectedGuesserId,
  presenterBonus,
  isPhraseRevealed,
  scoreResolutionValid,
  onSetScoreOutcome,
  onSetSelectedGuesserId,
  onSetPresenterBonus,
  onSetIsPhraseRevealed,
  onResolveScore,
  onBackFromScore,
  getAdvanceLabel,
}: ScorePhaseProps) {
  return (
    <>
      <div className="kalambury-stage-panel kalambury-stage-panel--verdict">
        {scoreOutcome === "pending" ? (
          <div className="kalambury-verdict-shell">
            <h2>Werdykt tury</h2>
            <div className="kalambury-verdict-choice-row">
              <button
                className="kalambury-verdict-choice"
                type="button"
                onClick={() => onSetScoreOutcome("missed")}
              >
                Nikt nie zgadl
              </button>
              <button
                className="kalambury-verdict-choice"
                type="button"
                onClick={() => onSetScoreOutcome("guessed")}
              >
                Kto zgadl?
              </button>
            </div>
          </div>
        ) : null}

        {scoreOutcome === "missed" ? (
          <div className="kalambury-verdict-shell kalambury-verdict-shell--missed">
            <h2>NIKT NIE ZGADL</h2>
            <button
              className="kalambury-secondary-action"
              type="button"
              onClick={() => onSetIsPhraseRevealed((current) => !current)}
            >
              {isPhraseRevealed ? "Ukryj haslo" : "Pokaz haslo"}
            </button>
            <p className="kalambury-host-copy">
              {isPhraseRevealed
                ? `Haslo: ${playState.phrase}`
                : "Haslo jest ukryte."}
            </p>
          </div>
        ) : null}

        {scoreOutcome === "guessed" ? (
          <div className="kalambury-verdict-shell kalambury-verdict-shell--guessed">
            <h2>KTO ZGADL?</h2>
            <div className="kalambury-verdict-player-grid kalambury-verdict-player-grid--guessers">
              {guesserOptions.map((player) => (
                <button
                  key={player.id}
                  className={
                    selectedGuesserId === player.id
                      ? "kalambury-persona-card kalambury-persona-card--interactive kalambury-persona-card--verdict kalambury-verdict-player-card kalambury-verdict-player-card--guesser kalambury-verdict-player-card--active"
                      : "kalambury-persona-card kalambury-persona-card--interactive kalambury-persona-card--verdict kalambury-verdict-player-card kalambury-verdict-player-card--guesser"
                  }
                  data-gender={player.gender}
                  type="button"
                  onClick={() => onSetSelectedGuesserId(player.id)}
                >
                  <span
                    className="kalambury-persona-card__avatar kalambury-verdict-player-card__avatar"
                    aria-hidden="true"
                  >
                    {player.avatar}
                  </span>
                  <span className="kalambury-persona-card__nameplate kalambury-verdict-player-card__name">
                    {player.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <footer className="kalambury-stage-footer kalambury-playbar kalambury-stage-footer--verdict-layout">
        <div className="kalambury-verdict-strip__bonus">
          <span className="kalambury-verdict-strip__plus">+1</span>
          <span>
            punkt dla prezentera: <strong>{presenter?.name ?? "-"}</strong>,
            jesli uwazacie, ze zasluzyl/a
          </span>
        </div>
        <div className="kalambury-verdict-actions">
          <button
            className={
              presenterBonus
                ? "kalambury-switch kalambury-switch--active"
                : "kalambury-switch"
            }
            type="button"
            onClick={() => onSetPresenterBonus((current) => !current)}
          >
            <span>{presenterBonus ? "WLACZONE" : "WYLACZONE"}</span>
            <span className="kalambury-switch__thumb" />
          </button>
          <button
            className="kalambury-footer-button kalambury-footer-button--ghost"
            type="button"
            onClick={onBackFromScore}
          >
            Wroc
          </button>
          <button
            className="kalambury-footer-button kalambury-footer-button--primary"
            type="button"
            disabled={!scoreResolutionValid}
            onClick={onResolveScore}
          >
            {getAdvanceLabel()}
          </button>
        </div>
      </footer>
    </>
  );
}
