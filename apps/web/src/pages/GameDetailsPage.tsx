import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import { fetchCatalogGameViaApi } from "../api/platform";
import { PlatformTopbar } from "../components/PlatformTopbar";
import type { CatalogGame } from "../platform/catalog";
import {
  getCatalogGameDeviceLabel,
  getCatalogGameLaunchLabel,
  isGameLaunchable,
} from "../platform/catalog";

const statusLabels: Record<CatalogGame["status"], string> = {
  active: "Dostepna",
  coming_soon: "W przygotowaniu",
  hidden: "Ukryta",
};

export function GameDetailsPage() {
  const { gameId = "" } = useParams();
  const [game, setGame] = useState<CatalogGame | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMissing, setIsMissing] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadGame() {
      if (!gameId) {
        if (!isCancelled) {
          setGame(null);
          setIsMissing(true);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);

      try {
        const loadedGame = await fetchCatalogGameViaApi(gameId);

        if (!isCancelled) {
          setGame(loadedGame);
          setIsMissing(false);
        }
      } catch {
        if (!isCancelled) {
          setGame(null);
          setIsMissing(true);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadGame();

    return () => {
      isCancelled = true;
    };
  }, [gameId]);

  if (isLoading) {
    return (
      <main className="app-shell">
        <div className="ambient-orb ambient-orb--primary" aria-hidden="true" />
        <div
          className="ambient-orb ambient-orb--secondary"
          aria-hidden="true"
        />
        <PlatformTopbar actionLabel="Wroc do lobby" actionHref="/" />
        <section className="hero hero--details-panel">
          <p className="eyebrow">Project Party</p>
          <p className="details-message">Ladowanie szczegolow gry...</p>
        </section>
      </main>
    );
  }

  if (isMissing || !game) {
    return (
      <main className="app-shell">
        <div className="ambient-orb ambient-orb--primary" aria-hidden="true" />
        <div
          className="ambient-orb ambient-orb--secondary"
          aria-hidden="true"
        />
        <PlatformTopbar actionLabel="Wroc do lobby" actionHref="/" />
        <section className="hero hero--details-panel">
          <p className="eyebrow">Project Party</p>
          <h1>Gra nie zostala znaleziona</h1>
          <p className="lead">
            Sprawdz adres albo wroc do lobby i wybierz jedna z dostepnych
            pozycji.
          </p>
          <Link className="details-link" to="/">
            Wroc do lobby
          </Link>
        </section>
      </main>
    );
  }

  const launchable = isGameLaunchable(game.id);

  if (launchable && game.slug === "kalambury") {
    return <Navigate to="/kalambury" replace />;
  }

  return (
    <main className="app-shell">
      <div className="ambient-orb ambient-orb--primary" aria-hidden="true" />
      <div className="ambient-orb ambient-orb--secondary" aria-hidden="true" />
      <PlatformTopbar actionLabel="Dolacz po kodzie" actionHref="/join" />

      <section className="hero hero--details-panel">
        <div className="details-hero-visual" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div className="details-copy">
          <p className="eyebrow">Project Party</p>
          <div className="details-badges">
            <span className={`details-status details-status--${game.status}`}>
              {statusLabels[game.status]}
            </span>
            <span className="details-badge">
              {getCatalogGameDeviceLabel(game.playMode)}
            </span>
          </div>
          <h1>{game.name}</h1>
          <p className="lead">{game.shortDescription}</p>
        </div>

        <dl className="details-grid details-grid--cards">
          <div>
            <dt>Tryb gry</dt>
            <dd>{getCatalogGameDeviceLabel(game.playMode)}</dd>
          </div>
          <div>
            <dt>Liczba graczy</dt>
            <dd>
              {game.minPlayers}-{game.maxPlayers}
            </dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{statusLabels[game.status]}</dd>
          </div>
        </dl>

        <section className="details-section">
          <div>
            <p className="eyebrow">Czego potrzebujesz</p>
            <p className="details-message details-message--muted">
              {game.requirementsText}
            </p>
          </div>

          <div className="details-note-card">
            <p className="eyebrow">{launchable ? "Co dalej" : "Status prac"}</p>
            <p className="details-message details-message--muted">
              {launchable
                ? (game.setupNote ?? "Ta gra jest gotowa do uruchomienia.")
                : (game.availabilityNote ??
                  "Ta gra jest jeszcze w przygotowaniu. Wrocimy do niej po dopieciu kolejnych modulow.")}
            </p>
          </div>
        </section>

        <div className="details-actions">
          <Link className="details-link details-link--ghost" to="/">
            Wroc do lobby
          </Link>

          {launchable ? (
            <Link className="details-link" to={`/games/${game.slug}/launch`}>
              {getCatalogGameLaunchLabel(game)}
            </Link>
          ) : (
            <span
              className="details-link details-link--disabled"
              aria-disabled="true"
            >
              {getCatalogGameLaunchLabel(game)}
            </span>
          )}
        </div>
      </section>
    </main>
  );
}
