import { normalizeSessionCode } from "@project-party/shared";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { joinSessionViaApi } from "../api/platform";
import { PlatformTopbar } from "../components/PlatformTopbar";
import { getJoinFlowState } from "../platform/session";

export function JoinPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const state = useMemo(
    () => getJoinFlowState({ code, playerName }),
    [code, playerName],
  );

  async function handleJoin() {
    setIsJoining(true);
    setJoinError(null);

    try {
      const session = await joinSessionViaApi({
        sessionCode: code,
        playerName,
      });

      navigate(`/games/${session.gameId}/controller/${session.sessionCode}`, {
        state: {
          playerName: session.playerName,
          playerId: session.playerId,
        },
      });
    } catch (error) {
      setJoinError(
        error instanceof Error
          ? error.message
          : "Nie udalo sie dolaczyc do sesji.",
      );
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <main className="app-shell">
      <div className="ambient-orb ambient-orb--primary" aria-hidden="true" />
      <div className="ambient-orb ambient-orb--secondary" aria-hidden="true" />
      <PlatformTopbar actionLabel="Wroc do lobby" actionHref="/" />

      <section className="hero hero--details-panel">
        <div className="details-copy">
          <p className="eyebrow">Project Party</p>
          <div className="details-badges">
            <span className="details-badge">Join flow</span>
            <span className="details-badge">TV + telefony</span>
          </div>
          <h1>Dolacz do sesji</h1>
          <p className="lead">
            Wpisz kod sesji i swoje imie, aby dolaczyc do trwajacej rozgrywki na
            wspolnym ekranie.
          </p>
        </div>

        <section className="details-section">
          <label className="join-field">
            <span className="eyebrow">Kod sesji</span>
            <input
              className="join-field__input"
              value={code}
              onChange={(event) =>
                setCode(normalizeSessionCode(event.target.value))
              }
              placeholder="ABC123"
            />
          </label>

          <label className="join-field">
            <span className="eyebrow">Imie gracza</span>
            <input
              className="join-field__input"
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              placeholder="Mateo"
            />
          </label>
        </section>

        <div className="details-note-card">
          <p className="eyebrow">Status</p>
          <p className="details-message details-message--muted">
            {state === "idle"
              ? "Wpisz kod i imie."
              : state === "incomplete"
                ? "Uzupelnij brakujace dane."
                : "Gotowe do dolaczenia do sesji."}
          </p>
          {joinError ? (
            <p className="details-message" style={{ color: "#fecaca" }}>
              {joinError}
            </p>
          ) : null}
        </div>

        <div className="details-actions">
          <Link className="details-link details-link--ghost" to="/">
            Wroc do lobby
          </Link>
          <button
            type="button"
            className="details-link"
            disabled={state !== "ready" || isJoining}
            onClick={() => void handleJoin()}
          >
            {isJoining ? "Dolaczanie..." : "Dolacz"}
          </button>
        </div>
      </section>
    </main>
  );
}
