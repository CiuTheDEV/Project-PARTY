import type {
  KalamburyPlayState,
  KalamburySetupPayload,
} from "../../runtime/state-machine";
import { confettiPieces } from "./play-utils";

export type FinishedPhaseProps = {
  playState: KalamburyPlayState;
  sortedScoreboard: KalamburySetupPayload["players"];
  winner: KalamburySetupPayload["players"][number] | null;
  onBackToHub: () => void;
};

export function FinishedPhase({
  playState,
  sortedScoreboard,
  winner,
  onBackToHub,
}: FinishedPhaseProps) {
  return (
    <>
      <div className="kalambury-stage-panel kalambury-stage-panel--summary">
        <div className="kalambury-summary-confetti" aria-hidden="true">
          {confettiPieces.map((piece, index) => (
            <span
              key={`${piece.x}-${piece.y}-${index}`}
              className={
                piece.type === "emoji"
                  ? "kalambury-summary-confetti__emoji"
                  : "kalambury-summary-confetti__piece"
              }
              style={{
                left: piece.x,
                top: piece.y,
                animationDelay: piece.delay,
                transform: `rotate(${piece.rotate})`,
              }}
            >
              {piece.type === "emoji" ? "✦" : ""}
            </span>
          ))}
        </div>
        <div className="kalambury-summary-head">
          <h2>PODSUMOWANIE GRY</h2>
          {winner ? (
            <p>
              Zwyciezca: <strong>{winner.name}</strong> (
              {playState.scores[winner.id] ?? 0})
            </p>
          ) : null}
        </div>
        <div className="kalambury-summary-rankings">
          {sortedScoreboard.map((player, index) => (
            <article
              className={
                index === 0
                  ? "kalambury-persona-card kalambury-persona-card--summary kalambury-summary-rank kalambury-summary-rank--winner"
                  : "kalambury-persona-card kalambury-persona-card--summary kalambury-summary-rank"
              }
              data-gender={player.gender}
              key={player.id}
            >
              <span className="kalambury-summary-rank__position">
                #{index + 1}
              </span>
              <span
                className="kalambury-persona-card__avatar kalambury-summary-rank__avatar"
                aria-hidden="true"
              >
                {player.avatar}
              </span>
              <strong className="kalambury-persona-card__nameplate kalambury-summary-rank__name">
                {player.name}
              </strong>
              <span className="kalambury-summary-rank__score">
                {playState.scores[player.id] ?? 0}
              </span>
            </article>
          ))}
        </div>
      </div>
      <footer className="kalambury-stage-footer kalambury-playbar kalambury-stage-footer--split">
        <button
          className="kalambury-footer-button kalambury-footer-button--ghost"
          type="button"
          onClick={onBackToHub}
        >
          Wroc do menu gry
        </button>
        <button
          className="kalambury-footer-button kalambury-footer-button--primary"
          type="button"
          onClick={onBackToHub}
        >
          Powrot do menu
        </button>
      </footer>
    </>
  );
}
