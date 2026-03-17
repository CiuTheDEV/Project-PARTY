import type {
  KalamburyPlayState,
  KalamburySetupPayload,
} from "../../runtime/state-machine";

export type ActPhaseProps = {
  playState: KalamburyPlayState;
  presenter: KalamburySetupPayload["players"][number];
  currentTurnLabel: string;
  presenterReconnectRequired: boolean;
  hostHintChips: string[];
  eventLabel: string | null;
  onStop: () => void;
};

function formatKalamburyTimerValue(seconds: number) {
  return Math.max(0, Math.trunc(seconds)).toString();
}

export function ActPhase({
  playState,
  presenter,
  currentTurnLabel,
  presenterReconnectRequired,
  hostHintChips,
  eventLabel,
  onStop,
}: ActPhaseProps) {
  return (
    <>
      <div className="kalambury-stage-panel kalambury-stage-panel--act-host">
        <div className="kalambury-prepare-presenter-column">
          <p className="kalambury-stage-counter kalambury-stage-counter--prepare">
            TURA {currentTurnLabel}
          </p>
          <article
            className="kalambury-persona-card kalambury-persona-card--presenter kalambury-presenter-hero"
            data-gender={presenter.gender}
          >
            <span className="kalambury-persona-card__badge kalambury-presenter-hero__badge">
              {currentTurnLabel}
            </span>
            <strong className="kalambury-presenter-hero__label">
              PREZENTUJE
            </strong>
            <div
              className="kalambury-persona-card__avatar kalambury-presenter-hero__avatar"
              aria-hidden="true"
            >
              {presenter.avatar}
            </div>
            <strong className="kalambury-persona-card__nameplate kalambury-presenter-hero__name">
              {presenter.name}
            </strong>
          </article>
        </div>
        <div className="kalambury-host-status kalambury-host-status--prepare kalambury-host-status--timed kalambury-host-status--act">
          <div className="kalambury-host-status__copy kalambury-host-status__copy--prepare">
            <h2>Czas do konca prezentowania</h2>
            {eventLabel ? (
              <span className="kalambury-play__event-badge">
                {eventLabel}
              </span>
            ) : null}
          </div>
          <div className="kalambury-play__timer kalambury-play__timer--act">
            {playState.activeEvent === "rush"
              ? `+${formatKalamburyTimerValue(playState.timerSeconds)}`
              : formatKalamburyTimerValue(playState.timerSeconds)}
          </div>
          <div className="kalambury-host-status__footer">
            {presenterReconnectRequired ? (
              <div className="kalambury-host-status__copy kalambury-host-status__copy--reconnect">
                <h2>
                  Gra wstrzymana do czasu ponownego podlaczenia
                  urzadzenia prezentera
                </h2>
                <p>
                  Podlacz telefon prezentera ponownie, aby wznowic ture
                  bez utraty czasu i zsynchronizowac haslo na nowym
                  urzadzeniu.
                </p>
              </div>
            ) : null}
            {hostHintChips.length > 0 ? (
              <div className="kalambury-hint-chips kalambury-hint-chips--act">
                {hostHintChips.map((chip) => (
                  <span className="kalambury-hint-chip" key={chip}>
                    {chip}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <footer className="kalambury-stage-footer kalambury-playbar">
        <button
          className="kalambury-footer-button kalambury-footer-button--danger kalambury-stage-footer__cta"
          type="button"
          disabled={presenterReconnectRequired}
          onClick={onStop}
        >
          STOP
        </button>
      </footer>
    </>
  );
}
