import type {
  KalamburyPlayState,
  KalamburySetupPayload,
} from "../../runtime/state-machine";

const confettiPieces = [
  { x: "8%", y: "6%", delay: "0s", rotate: "-18deg", type: "emoji" },
  { x: "13%", y: "18%", delay: "0.2s", rotate: "14deg", type: "emoji" },
  { x: "22%", y: "30%", delay: "0.35s", rotate: "-30deg", type: "confetti" },
  { x: "34%", y: "12%", delay: "0.1s", rotate: "22deg", type: "confetti" },
  { x: "41%", y: "24%", delay: "0.45s", rotate: "-12deg", type: "confetti" },
  { x: "58%", y: "10%", delay: "0.18s", rotate: "28deg", type: "confetti" },
  { x: "66%", y: "20%", delay: "0.5s", rotate: "-8deg", type: "emoji" },
  { x: "74%", y: "14%", delay: "0.25s", rotate: "20deg", type: "confetti" },
  { x: "84%", y: "8%", delay: "0.4s", rotate: "-26deg", type: "emoji" },
  { x: "90%", y: "28%", delay: "0.55s", rotate: "16deg", type: "confetti" },
  { x: "10%", y: "78%", delay: "0.15s", rotate: "12deg", type: "emoji" },
  { x: "18%", y: "88%", delay: "0.6s", rotate: "-14deg", type: "confetti" },
  { x: "30%", y: "82%", delay: "0.32s", rotate: "18deg", type: "confetti" },
  { x: "48%", y: "90%", delay: "0.48s", rotate: "-20deg", type: "confetti" },
  { x: "66%", y: "84%", delay: "0.22s", rotate: "10deg", type: "emoji" },
  { x: "78%", y: "92%", delay: "0.58s", rotate: "-10deg", type: "confetti" },
  { x: "90%", y: "86%", delay: "0.3s", rotate: "26deg", type: "emoji" },
] as const;

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
