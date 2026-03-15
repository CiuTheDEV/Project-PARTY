import type { CSSProperties } from "react";
import { Link } from "react-router-dom";

import type { CatalogGame } from "../platform/catalog";
import { getCatalogGameDeviceLabel } from "../platform/catalog";

type GameCardProps = {
  game: CatalogGame;
};

const statusLabels: Record<CatalogGame["status"], string> = {
  active: "DOSTEPNA",
  coming_soon: "W PRZYGOTOWANIU",
  hidden: "UKRYTA",
};

const visualConfigs: Record<
  string,
  { icon: string; label: string; eyebrow: string }
> = {
  kalambury: {
    icon: "draw",
    label: "Rysuj i zgaduj",
    eyebrow: "Party classic",
  },
  tajniacy: {
    icon: "fingerprint",
    label: "Tropicie szpiega",
    eyebrow: "Social deduction",
  },
  "5-sekund": {
    icon: "timer",
    label: "Presja czasu",
    eyebrow: "Quick fire",
  },
  "mamy-szpiega": {
    icon: "visibility",
    label: "Blef i podejrzenia",
    eyebrow: "Hidden role",
  },
  "panstwa-miasta": {
    icon: "public",
    label: "Kategorie na litery",
    eyebrow: "Word battle",
  },
};

export function GameCard({ game }: GameCardProps) {
  const accentColor = game.accentColor ?? "#06b6d4";
  const visual = visualConfigs[game.slug] ?? {
    icon: "stadia_controller",
    label: "Party mode",
    eyebrow: "Project Party",
  };

  const cardStyle = {
    "--game-accent": accentColor,
  } as CSSProperties;

  return (
    <article
      className={`game-card game-card--${game.status}`}
      style={cardStyle}
    >
      <div className="game-card__visual" aria-hidden="true">
        <div className="game-card__visual-art">
          <span className="game-card__visual-noise" />
          <span className="game-card__visual-glow" />
          <span className="game-card__visual-beam" />
          <span className="game-card__visual-grid" />

          <div className="game-card__visual-frame">
            <span className="game-card__visual-eyebrow">{visual.eyebrow}</span>
            <span className="material-symbols-outlined game-card__visual-icon">
              {visual.icon}
            </span>
            <span className="game-card__visual-label">{visual.label}</span>
          </div>
        </div>

        <div className="game-card__status-badge">
          <span className="game-card__status-dot" />
          <span>{statusLabels[game.status]}</span>
        </div>
      </div>

      <div className="game-card__content">
        <div className="game-card__title-row">
          <h2>{game.name}</h2>
          {game.isFeatured ? (
            <span className="game-card__featured">HOT</span>
          ) : null}
        </div>

        <p className="game-card__description">{game.shortDescription}</p>

        <div className="game-card__divider" aria-hidden="true" />

        <div className="game-card__meta">
          <span className="game-chip">
            <span className="material-symbols-outlined game-chip__icon">
              group
            </span>
            {game.minPlayers}-{game.maxPlayers} graczy
          </span>

          <span className="game-chip">
            <span className="material-symbols-outlined game-chip__icon">
              devices
            </span>
            {getCatalogGameDeviceLabel(game.playMode)}
          </span>
        </div>

        <Link
          className={`game-card__cta${game.status !== "active" ? " game-card__cta--subtle" : ""}`}
          to={game.status === "active" ? `/${game.slug}` : `/games/${game.slug}`}
        >
          <span>{game.status === "active" ? "Graj" : "Sprawdz status"}</span>
          <span className="material-symbols-outlined game-card__cta-icon">
            arrow_forward
          </span>
        </Link>
      </div>
    </article>
  );
}
