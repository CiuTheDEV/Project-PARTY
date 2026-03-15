
import { useEffect, useRef, useState } from "react";
import { createTajniacyBridge, type TajniacyBridgeRole, type TajniacyChannel } from "../shared/bridge";
import { devTrack } from "../shared/dev-stats.ts";
import type { MatchState } from "../shared/types";
import { TajniacyCaptainApp } from "./CaptainView";
import { TajniacyPlayerView } from "./PlayerView";

type TajniacyControllerAppProps = {
  sessionCode: string;
  transportChannel?: TajniacyChannel;
};

function resolvePresetRole(): TajniacyBridgeRole | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const preset = params.get("preset");
    if (preset === "player") return "player-view";
    // "captain" preset still shows the captain selection screen
  } catch { /* SSR / no window */ }
  return null;
}

export function TajniacyControllerApp({ sessionCode, transportChannel }: TajniacyControllerAppProps) {
  const presetRole = resolvePresetRole();

  const [role, setRole] = useState<TajniacyBridgeRole | null>(presetRole);
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [bridge, setBridge] = useState<ReturnType<typeof createTajniacyBridge> | null>(null);

  // Occupancy received from host
  const [captainRedTaken, setCaptainRedTaken] = useState(false);
  const [captainBlueTaken, setCaptainBlueTaken] = useState(false);

  // Track if this device was auto-reassigned to spectator-captain (role occupied)
  const [assignedRole, setAssignedRole] = useState<TajniacyBridgeRole | null>(null);

  // ─── Passive listener (selection screen) ──────────────────────
  // Created immediately so we receive roles-occupied BEFORE the user clicks
  useEffect(() => {
    if (role !== null) return; // Only when on selection screen

    const b = createTajniacyBridge(sessionCode, "player-view", {
      channel: transportChannel,
      onOccupiedRolesUpdate: (redTaken, blueTaken) => {
        setCaptainRedTaken(redTaken);
        setCaptainBlueTaken(blueTaken);
      },
      onHostReset: () => {
        setCaptainRedTaken(false);
        setCaptainBlueTaken(false);
      },
    });

    // Announce as player-view — host will respond with current roles-occupied snapshot
    b?.announceReady("player-view");

    return () => b?.destroy();
  }, [role, sessionCode, transportChannel]);

  // ─── Active bridge (after role selected) ──────────────────────
  const matchStateRef = useRef<MatchState | null>(null);

  useEffect(() => {
    if (!role) return;

    const b = createTajniacyBridge(sessionCode, role, {
      channel: transportChannel,
      onStateSync: (state) => {
        // Skip if state is identical to what we already have (dedup BroadcastChannel + WS/poll)
        const prev = matchStateRef.current;
        if (
          prev &&
          prev.phase === state.phase &&
          prev.round?.roundNumber === state.round?.roundNumber &&
          prev.matchScore.red === state.matchScore.red &&
          prev.matchScore.blue === state.matchScore.blue &&
          prev.round?.board.filter((c) => c.revealed).length ===
            state.round?.board.filter((c) => c.revealed).length
        ) {
          return;
        }
        matchStateRef.current = state;
        setMatchState(state);
      },
      onRoleAssigned: (r) => {
        setAssignedRole(r);
        if (r !== role) setRole(r);
      },
      onOccupiedRolesUpdate: (redTaken, blueTaken) => {
        setCaptainRedTaken(redTaken);
        setCaptainBlueTaken(blueTaken);
      },
      onHostReset: () => {
        setRole(null);
        setMatchState(null);
        matchStateRef.current = null;
        setAssignedRole(null);
        setCaptainRedTaken(false);
        setCaptainBlueTaken(false);
      },
    });

    if (b) {
      setBridge(b);
      b.announceReady(role);
      b.requestSync();

      // Retry requestSync every 2s until we receive state (cold join resilience)
      const syncRetryInterval = setInterval(() => {
        if (!matchStateRef.current) {
          devTrack("syncRetries");
          b.requestSync();
        } else {
          clearInterval(syncRetryInterval);
        }
      }, 2000);

      return () => {
        clearInterval(syncRetryInterval);
        b.destroy();
      };
    }

    return () => b?.destroy();
  }, [role, sessionCode, transportChannel]);


  // ─── Role Selection Screen ─────────────────────────────────────
  if (!role) {
    const isPlayerPreset = presetRole === "player-view";

    return (
      <div style={shellStyle}>
        <div style={headerSelectStyle}>
          <span style={logoStyle}>🕵️</span>
          <h1 style={headingStyle}>Wybierz rolę</h1>
          <p style={subheadingStyle}>Kod sesji: <strong style={{ letterSpacing: "0.1em" }}>{sessionCode}</strong></p>
        </div>

        <div style={gridStyle}>
          {/* Captain Red */}
          <button
            style={{
              ...roleBtnStyle,
              borderColor: captainRedTaken ? "rgba(255,255,255,0.05)" : "rgba(231, 76, 60, 0.4)",
              background: captainRedTaken ? "rgba(255,255,255,0.02)" : "rgba(231, 76, 60, 0.12)",
              opacity: captainRedTaken ? 0.4 : 1,
              cursor: captainRedTaken ? "not-allowed" : "pointer",
            }}
            disabled={captainRedTaken}
            onClick={() => setRole("captain-red")}
          >
            <span style={roleIconStyle}>🔴</span>
            <span style={roleLabelStyle}>Kapitan Czerwonych</span>
            {captainRedTaken && <span style={takenBadgeStyle}>ZAJĘTE</span>}
          </button>

          {/* Captain Blue */}
          <button
            style={{
              ...roleBtnStyle,
              borderColor: captainBlueTaken ? "rgba(255,255,255,0.05)" : "rgba(52, 152, 219, 0.4)",
              background: captainBlueTaken ? "rgba(255,255,255,0.02)" : "rgba(52, 152, 219, 0.12)",
              opacity: captainBlueTaken ? 0.4 : 1,
              cursor: captainBlueTaken ? "not-allowed" : "pointer",
            }}
            disabled={captainBlueTaken}
            onClick={() => setRole("captain-blue")}
          >
            <span style={roleIconStyle}>🔵</span>
            <span style={roleLabelStyle}>Kapitan Niebieskich</span>
            {captainBlueTaken && <span style={takenBadgeStyle}>ZAJĘTE</span>}
          </button>

          {/* 1 Kapitan — spectator captain, read-only */}
          {(() => {
            const spectatorBlocked = captainRedTaken || captainBlueTaken;
            return (
              <button
                style={{
                  ...roleBtnStyle,
                  borderColor: spectatorBlocked ? "rgba(255,255,255,0.05)" : "rgba(251, 191, 36, 0.3)",
                  background: spectatorBlocked ? "rgba(255,255,255,0.02)" : "rgba(251, 191, 36, 0.08)",
                  opacity: spectatorBlocked ? 0.4 : 1,
                  cursor: spectatorBlocked ? "not-allowed" : "pointer",
                }}
                disabled={spectatorBlocked}
                onClick={() => setRole("spectator-captain")}
              >
                <span style={roleIconStyle}>👁️</span>
                <span style={roleLabelStyle}>1 Kapitan</span>
                {spectatorBlocked
                  ? <span style={takenBadgeStyle}>NIEDOSTĘPNE</span>
                  : <span style={roleHintStyle}>Widok mapy bez wysyłania haseł</span>
                }
              </button>
            );
          })()}

        </div>
      </div>
    );
  }

  // ─── Waiting for state ─────────────────────────────────────────
  if (!matchState) {
    return (
      <div style={shellStyle}>
        <div style={waitWrapStyle}>
          <div style={spinnerStyle} />
          <h1 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700 }}>Czekam na dane z TV...</h1>
          <p style={{ opacity: 0.45, fontSize: 13, margin: 0 }}>Upewnij się, że gra jest uruchomiona na głównym ekranie.</p>
          <button
            style={changeBtnStyle}
            onClick={() => {
              setRole(null);
              setMatchState(null);
              setAssignedRole(null);
            }}
          >
            Zmień rolę
          </button>
        </div>
      </div>
    );
  }

  // ─── Captain views ─────────────────────────────────────────────
  if (role === "captain-red" || role === "captain-blue" || role === "spectator-captain") {
    const teamId = role === "captain-blue" ? "blue" : "red";
    const isReadOnly = role === "spectator-captain";

    // Show lobby if game hasn't started yet
    if (matchState.phase === "setup") {
      const accent = teamId === "red" ? "#E74C3C" : "#3498DB";
      const myTeam = matchState.settings.teams[teamId === "red" ? 0 : 1];
      return (
        <div style={{ minHeight: "100dvh", background: "#0a0a0b", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, fontFamily: "'Inter', sans-serif", color: "#fff", padding: 24, borderTop: `4px solid ${accent}` }}>
          <div style={{ fontSize: 48 }}>{isReadOnly ? "👁️" : teamId === "red" ? "🔴" : "🔵"}</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#52525b", letterSpacing: "0.1em", marginBottom: 6 }}>JESTEŚ</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: accent }}>{isReadOnly ? "WIDZ MAPY" : `KAPITAN ${myTeam.name.toUpperCase()}`}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", border: `3px solid rgba(255,255,255,0.08)`, borderTopColor: accent, animation: "spin 0.9s linear infinite" }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "#a1a1aa" }}>Czekam na start gry...</div>
            <div style={{ fontSize: 12, color: "#52525b" }}>Host musi uruchomić grę na TV</div>
          </div>
          <button style={{ marginTop: 12, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#71717a", padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontSize: 12 }} onClick={() => { setRole(null); setMatchState(null); setAssignedRole(null); }}>Zmień rolę</button>
        </div>
      );
    }

    return (
      <TajniacyCaptainApp
        teamId={teamId}
        board={matchState.round?.board ?? []}
        settings={matchState.settings}
        matchScore={matchState.matchScore}
        roundNumber={matchState.round?.roundNumber ?? 1}
        startingTeam={matchState.round?.startingTeam ?? "red"}
        readOnly={isReadOnly}
        currentHint={matchState.round?.hint?.[teamId] ?? null}
        onSendHint={(word, count) =>
          bridge?.submitHint(word, count, teamId)
        }
        onClearHint={() => bridge?.clearHint(teamId)}
      />
    );
  }

  // ─── Player view ───────────────────────────────────────────────
  if (role === "player-view") {
    // Show lobby if game hasn't started yet
    if (matchState.phase === "setup") {
      return (
        <div style={{ minHeight: "100dvh", background: "#0a0a0b", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, fontFamily: "'Inter', sans-serif", color: "#fff", padding: 24 }}>
          <div style={{ fontSize: 48 }}>🕵️</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#52525b", letterSpacing: "0.1em", marginBottom: 6 }}>JESTEŚ</div>
            <div style={{ fontSize: 20, fontWeight: 900 }}>GRACZ / WIDZ</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", border: `3px solid rgba(255,255,255,0.08)`, borderTopColor: "#a78bfa", animation: "spin 0.9s linear infinite" }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "#a1a1aa" }}>Czekam na start gry...</div>
            <div style={{ fontSize: 12, color: "#52525b" }}>Host musi uruchomić grę na TV</div>
          </div>
          <button style={{ marginTop: 12, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#71717a", padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontSize: 12 }} onClick={() => { setRole(null); setMatchState(null); setAssignedRole(null); }}>Zmień rolę</button>
        </div>
      );
    }
    return (
      <TajniacyPlayerView
        board={matchState.round?.board ?? []}
        settings={matchState.settings}
        matchScore={matchState.matchScore}
        startingTeam={matchState.round?.startingTeam ?? "red"}
        hints={matchState.round?.hint ?? null}
      />
    );
  }

  return null;
}

// ─── Styles ───────────────────────────────────────────────────────

const shellStyle: React.CSSProperties = {
  minHeight: "100dvh",
  background: "#0a0a0b",
  display: "flex",
  flexDirection: "column",
  fontFamily: "'Inter', sans-serif",
  color: "#fff",
  padding: "24px 16px",
  gap: 24,
  boxSizing: "border-box",
};

const headerSelectStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 6,
  textAlign: "center",
  paddingTop: 24,
};

const logoStyle: React.CSSProperties = {
  fontSize: 40,
};

const headingStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 900,
  letterSpacing: "0.02em",
};

const subheadingStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: "#52525b",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
  width: "100%",
  maxWidth: 400,
  margin: "0 auto",
};

const roleBtnStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto 1fr",
  gap: "6px 10px",
  alignItems: "center",
  padding: "16px 18px",
  borderRadius: 16,
  border: "1px solid",
  textAlign: "left",
  color: "#fff",
  transition: "all 0.15s",
  position: "relative",
};

const roleIconStyle: React.CSSProperties = {
  fontSize: 22,
  gridRow: "span 2",
};

const roleLabelStyle: React.CSSProperties = {
  fontWeight: 800,
  fontSize: 15,
};

const roleHintStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#71717a",
  gridColumn: 2,
};

const takenBadgeStyle: React.CSSProperties = {
  position: "absolute",
  top: 10,
  right: 12,
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: "0.08em",
  color: "#71717a",
  background: "rgba(255,255,255,0.06)",
  padding: "2px 7px",
  borderRadius: 99,
};

const waitWrapStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
  gap: 10,
  textAlign: "center",
  paddingTop: 80,
};

const spinnerStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  border: "3px solid rgba(255,255,255,0.08)",
  borderTopColor: "#E74C3C",
  animation: "spin 0.9s linear infinite",
};

const changeBtnStyle: React.CSSProperties = {
  marginTop: 16,
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#a1a1aa",
  padding: "8px 18px",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13,
};
