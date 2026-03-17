import type { KalamburySetupPayload } from "../../runtime/state-machine";
import { PRESENTER_REVEAL_PREVIEW_SECONDS } from "../../settings/constants";
import { formatKalamburyTimerValue } from "./play-utils";

type PresenterRevealStage = "pending" | "preview";

export type PreparePhaseProps = {
  presenter: KalamburySetupPayload["players"][number];
  currentTurnLabel: string;
  presenterRevealStage: PresenterRevealStage;
  presenterRevealCountdown: number;
  presenterReconnectRequired: boolean;
};

export function PreparePhase({
  presenter,
  currentTurnLabel,
  presenterRevealStage,
  presenterRevealCountdown,
  presenterReconnectRequired,
}: PreparePhaseProps) {

  return (
    <div className="kalambury-stage-panel kalambury-stage-panel--prepare">
      <div className="kalambury-prepare-presenter-column">
        <p className="kalambury-stage-counter kalambury-stage-counter--prepare">
          TURA {currentTurnLabel}
        </p>
        <article
          className="kalambury-persona-card kalambury-persona-card--presenter kalambury-presenter-hero"
          data-gender={presenter.gender}
        >
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
      <div
        className={[
          "kalambury-host-status",
          "kalambury-host-status--prepare",
          presenterRevealStage === "preview"
            ? "kalambury-host-status--timed"
            : "",
          presenterRevealStage === "preview"
            ? "kalambury-host-status--prepare-preview"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="kalambury-host-status__copy kalambury-host-status__copy--prepare">
          <h2>
            {presenterReconnectRequired
              ? "Gra wstrzymana do czasu ponownego podlaczenia urzadzenia prezentera"
              : presenterRevealStage === "preview"
                ? "Prezenter zapoznaje sie z haslem"
                : "Karta czeka na odkrycie na telefonie"}
          </h2>
          <p>
            {presenterReconnectRequired
              ? "Podlacz ponownie telefon prezentera. Runda wznowi sie dokladnie z tego miejsca po sparowaniu nowego lub tego samego urzadzenia."
              : presenterRevealStage === "preview"
                ? `Po ${PRESENTER_REVEAL_PREVIEW_SECONDS} sekundach runda rozpocznie sie automatycznie. Host nadal nie widzi hasla.`
                : "Prezenter musi odkryc karte na telefonie. Dopiero wtedy zacznie sie okno na zapoznanie z haslem."}
          </p>
        </div>
        {presenterRevealStage === "preview" ? (
          <div className="kalambury-play__timer kalambury-play__timer--prepare">
            {formatKalamburyTimerValue(presenterRevealCountdown)}
          </div>
        ) : null}
        {presenterRevealStage === "preview" ? (
          <div
            className="kalambury-host-status__footer"
            aria-hidden="true"
          />
        ) : null}
      </div>
    </div>
  );
}
