import { useState, useEffect } from "react";

import { TEAM_AVATAR_EMOJI } from "../shared/avatars.ts";
import { countRemaining } from "../shared/board-generator.ts";
import type { MatchState, TeamId } from "../shared/types.ts";
import { standardWords, uncensoredWords, loadUsedWords } from "../shared/words.ts";
import { getDevStats, resetDevStats, subscribeDevStats } from "../shared/dev-stats.ts";

type PlayScreenProps = {
  state: MatchState;
  onRevealCard: (index: number) => void;
  onAssassinResolve: (clickedBy: TeamId) => void;
  onNextRound: () => void;
  onResetMatch: () => void;
  onReplay: () => void;
  onReturnToSetup: () => void;
  poolJustReset?: boolean;
  onPoolResetAck?: () => void;
};

export function PlayScreen({
  state,
  onRevealCard,
  onAssassinResolve,
  onNextRound,
  onResetMatch,
  onReplay,
  onReturnToSetup,
  poolJustReset = false,
  onPoolResetAck,
}: PlayScreenProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAssassinModal, setShowAssassinModal] = useState(false);
  const [showDevModal, setShowDevModal] = useState(false);
  const [devStats, setDevStats] = useState(getDevStats);

  useEffect(() => {
    return subscribeDevStats(() => setDevStats(getDevStats()));
  }, []);


  const round = state.round;
  if (!round) return null;

  const redTeam = state.settings.teams[0];
  const blueTeam = state.settings.teams[1];
  const redRemaining = countRemaining(round.board, "red");
  const blueRemaining = countRemaining(round.board, "blue");

  const startingCountRed = round.startingTeam === "red" ? 9 : 8;
  const startingCountBlue = round.startingTeam === "blue" ? 9 : 8;

  // Sprawdź czy właśnie odkryto zabójcę
  const assassinJustRevealed =
    round.isFinished &&
    round.result?.reason === "assassin" &&
    !round.result?.assassinClickedBy;

  useEffect(() => {
    if (assassinJustRevealed) {
      if (!showAssassinModal) {
        const timer = setTimeout(() => setShowAssassinModal(true), 400);
        return () => clearTimeout(timer);
      }
    } else {
      if (showAssassinModal) {
        setShowAssassinModal(false);
      }
    }
  }, [assassinJustRevealed, showAssassinModal]);

  const handleCardClick = (index: number) => {
    if (round.isFinished) return;
    const card = round.board[index];
    if (card.revealed) return;
    onRevealCard(index);
  };

  return (
    <div style={shellStyle} className="app-shell--tajniacy-hub">
      {/* ─── HEADER (Drums/Scores) ─── */}
      <header style={headerStyle}>
        <div style={{ ...teamScoreBlockStyle, borderColor: "rgba(231,76,60,0.3)" }}>
          <div style={teamHeaderInfoStyle}>
            <span style={avatarCircleStyle(redTeam.id === "red" ? "#E74C3C" : "#3498DB")}>
              {TEAM_AVATAR_EMOJI[redTeam.avatar]}
            </span>
            <span style={teamNameStyle}>{redTeam.name}</span>
          </div>
          {round.hint.red && (
            <div style={hintBetweenStyle}>
              <span style={hintWordStyle}>{round.hint.red.word}</span>
              <span style={hintTeamCountStyle("#E74C3C")}>{round.hint.red.count === 0 ? "∞" : round.hint.red.count}</span>
            </div>
          )}
          <div style={scoreValueStyle("#E74C3C")}>{state.matchScore.red}</div>
        </div>

        <div style={centralActionsStyle}>


          <button type="button" style={actionCircleButtonStyle} onClick={() => setShowResetConfirm(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>refresh</span>
          </button>

          <button type="button" style={actionCircleButtonStyle} onClick={onReturnToSetup}>
            <span className="material-symbols-outlined" style={{ fontSize: 28 }}>settings</span>
          </button>

          {/* DEV only */}
          <button
            type="button"
            style={{ ...actionCircleButtonStyle, opacity: 0.5, fontSize: 11 }}
            onClick={() => setShowDevModal(true)}
            title="DEV: Pula haseł"
          >
            DEV
          </button>
        </div>

        <div style={{ ...teamScoreBlockStyle, borderColor: "rgba(52,152,219,0.3)", flexDirection: "row-reverse" }}>
          <div style={{ ...teamHeaderInfoStyle, flexDirection: "row-reverse" }}>
            <span style={avatarCircleStyle(blueTeam.id === "blue" ? "#3498DB" : "#E74C3C")}>
              {TEAM_AVATAR_EMOJI[blueTeam.avatar]}
            </span>
            <span style={teamNameStyle}>{blueTeam.name}</span>
          </div>
          {round.hint.blue && (
            <div style={{ ...hintBetweenStyle, textAlign: "right" }}>
              <span style={hintWordStyle}>{round.hint.blue.word}</span>
              <span style={hintTeamCountStyle("#3498DB")}>{round.hint.blue.count === 0 ? "∞" : round.hint.blue.count}</span>
            </div>
          )}
          <div style={scoreValueStyle("#3498DB")}>{state.matchScore.blue}</div>
        </div>
      </header>

      {/* ─── MAIN BOARD ─── */}
      <main style={boardWrapperStyle}>
        <div style={boardGridStyle}>
          {round.board.map((card, index) => {
            const isRevealed = card.revealed;
            const isActuallyRevealed = card.revealed;

            return (
              <button
                key={`${card.word}-${index}`}
                type="button"
                className={`taj-card ${isActuallyRevealed ? "taj-card--revealed" : ""}`}
                style={{
                  ...cardBaseStyle,
                  background: isRevealed
                    ? cardColors[card.identity].bg
                    : "rgba(255,255,255,0.03)",
                  border: isRevealed
                    ? `1px solid ${cardColors[card.identity].border}`
                    : "1px solid rgba(255,255,255,0.08)",
                  boxShadow: isRevealed
                    ? `0 8px 32px ${cardColors[card.identity].glow}`
                    : "0 4px 12px rgba(0,0,0,0.2)",
                  opacity: isActuallyRevealed ? 0.9 : 1,
                  cursor: isActuallyRevealed || round.isFinished ? "default" : "pointer",
                }}
                onClick={() => handleCardClick(index)}
              >
                <span style={{
                  ...cardWordStyle,
                  color: isRevealed ? "#fff" : "rgba(255,255,255,0.9)",
                  opacity: 1
                }}>
                  {card.word}
                </span>

                {isRevealed && card.identity === "assassin" && (
                  <span style={assassinIconStyle}>💀</span>
                )}
              </button>
            );
          })}
        </div>
      </main>

      {/* ─── BOTTOM AGENT TOKENS ─── */}
      <footer style={footerStyle}>
        <div style={tokenRowStyle}>
          {Array.from({ length: startingCountRed }).map((_, i) => {
            const isActive = i < redRemaining;
            return (
              <div
                key={i}
                style={{
                  ...tokenStyle,
                  background: isActive ? "linear-gradient(135deg, #E74C3C, #C0392B)" : "rgba(255,255,255,0.03)",
                  opacity: isActive ? 1 : 0.2,
                  filter: isActive ? "none" : "grayscale(100%)",
                  transform: isActive ? "scale(1)" : "scale(0.9)",
                  borderColor: isActive ? "#ff7675" : "rgba(255,255,255,0.1)",
                }}
              >
                <span style={tokenEmojiStyle}>{TEAM_AVATAR_EMOJI[redTeam.avatar]}</span>
                <span style={tokenNumberStyle}>{i + 1}</span>
              </div>
            );
          })}
        </div>

        <div style={turnIndicatorStyle}>
          {round.isFinished ? (
            <span style={{ color: "#71717a" }}>Runda zakończona</span>
          ) : (
            <>
              Zaczynają: <span style={{
                color: round.startingTeam === "red" ? "#E74C3C" : "#3498DB",
                fontWeight: 900,
                textTransform: "uppercase",
                marginLeft: 8
              }}>
                {round.startingTeam === "red" ? redTeam.name : blueTeam.name}
              </span>
            </>
          )}
        </div>

        <div style={{ ...tokenRowStyle, justifyContent: "flex-end" }}>
          {Array.from({ length: startingCountBlue }).map((_, i) => {
            const num = startingCountBlue - i;
            const isActive = num <= blueRemaining;
            return (
              <div
                key={i}
                style={{
                  ...tokenStyle,
                  background: isActive ? "linear-gradient(135deg, #3498DB, #2980B9)" : "rgba(255,255,255,0.03)",
                  opacity: isActive ? 1 : 0.2,
                  filter: isActive ? "none" : "grayscale(100%)",
                  transform: isActive ? "scale(1)" : "scale(0.9)",
                  borderColor: isActive ? "#74b9ff" : "rgba(255,255,255,0.1)",
                }}
              >
                <span style={tokenEmojiStyle}>{TEAM_AVATAR_EMOJI[blueTeam.avatar]}</span>
                <span style={tokenNumberStyle}>{num}</span>
              </div>
            );
          })}
        </div>
      </footer>

      {/* ─── MODALS & OVERLAYS ─── */}

      {/* 1. ASSASSIN PROMPT */}
      {showAssassinModal && (
        <div style={overlayStyle}>
          <div style={{ ...modalStyle, background: "transparent", border: "none" }}>
            <div style={{ fontSize: "min(120px, 15vh)", marginBottom: 20, filter: "drop-shadow(0 0 20px rgba(255,255,255,0.3))" }}>💀</div>
            <h2 className="animate-neon-red" style={{
              fontSize: "min(80px, 10vh)",
              fontWeight: 900,
              color: "#E74C3C",
              margin: "0 0 10px",
              textTransform: "uppercase"
            }}>
              ZABÓJCA!
            </h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 20, marginBottom: 40 }}>Kto natknął się na zabójcę...</p>

            <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Która drużyna przegrała rundę?</h3>

            <div style={{ display: "flex", gap: 32, justifyContent: "center" }}>
              <button
                onClick={() => {
                  onAssassinResolve("red");
                  setShowAssassinModal(false);
                }}
                style={{
                  ...teamResultButtonStyle,
                  border: `2px solid #E74C3C`,
                  boxShadow: `0 0 30px rgba(231, 76, 60, 0.2)`,
                }}
              >
                <div style={{ fontSize: 64, marginBottom: 12 }}>{TEAM_AVATAR_EMOJI[redTeam.avatar]}</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{redTeam.name}</div>
              </button>

              <button
                onClick={() => {
                  onAssassinResolve("blue");
                  setShowAssassinModal(false);
                }}
                style={{
                  ...teamResultButtonStyle,
                  border: `2px solid #3498DB`,
                  boxShadow: `0 0 30px rgba(52, 152, 219, 0.2)`,
                }}
              >
                <div style={{ fontSize: 64, marginBottom: 12 }}>{TEAM_AVATAR_EMOJI[blueTeam.avatar]}</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{blueTeam.name}</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ROUND END SUMMARY */}
      {state.phase === "round-end" && round.result && (
        <div style={overlayStyle}>
          {/* Header Message */}
          <div style={roundEndHeaderBoxStyle}>
            <span style={{ fontSize: 32, marginRight: 16 }}>
              {TEAM_AVATAR_EMOJI[round.result.winner === "red" ? redTeam.avatar : blueTeam.avatar]}
            </span>
            <span style={{ fontSize: 28, fontWeight: 800 }}>
              {round.result.winner === "red" ? redTeam.name : blueTeam.name} {round.result.reason === "assassin" ? "trafili na zabójcę!" : "wygrywają rundę!"}
            </span>
          </div>

          {/* VS Score Block */}
          <div style={vsScoreContainerStyle}>
            {/* Red Side */}
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <span style={{ fontSize: 48 }}>{TEAM_AVATAR_EMOJI[redTeam.avatar]}</span>
              <span style={{ fontSize: 24, fontWeight: 900, color: "rgba(255,255,255,0.7)" }}>{redTeam.name}</span>
              <div style={{ ...scoreSquareStyle, background: "#E74C3C" }}>{state.matchScore.red}</div>
            </div>

            <div style={{ fontSize: 32, fontWeight: 900, color: "rgba(255,255,255,0.3)" }}>VS</div>

            {/* Blue Side */}
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ ...scoreSquareStyle, background: "#3498DB" }}>{state.matchScore.blue}</div>
              <span style={{ fontSize: 24, fontWeight: 900, color: "rgba(255,255,255,0.7)" }}>{blueTeam.name}</span>
              <span style={{ fontSize: 48 }}>{TEAM_AVATAR_EMOJI[blueTeam.avatar]}</span>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 40 }}>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>Do {state.settings.roundsToWin} wygranych rund</p>
            <button
              className="taj-button-enter"
              style={{ background: "#E74C3C", boxShadow: "0 0 30px rgba(231, 76, 60, 0.5)" }}
              onClick={onNextRound}
            >
              Kolejna runda <span style={{ fontSize: 24 }}>↵</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. MATCH END SUMMARY */}
      {state.phase === "match-end" && state.matchWinner && (
        <div style={overlayStyle}>
          <div className="confetti-container">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="confetti-piece"
                style={{
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ["#E74C3C", "#3498DB", "#F1C40F", "#2ECC71"][Math.floor(Math.random() * 4)],
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 3}s`
                }}
              />
            ))}
          </div>

          <div style={{ ...roundEndHeaderBoxStyle, borderColor: "#F1C40F", boxShadow: "0 0 40px rgba(241, 196, 15, 0.2)" }}>
            <span style={{ fontSize: 32, marginRight: 16 }}>
              {TEAM_AVATAR_EMOJI[state.matchWinner === "red" ? redTeam.avatar : blueTeam.avatar]}
            </span>
            <span className="animate-neon-yellow" style={{ fontSize: 36, fontWeight: 900, color: "#F1C40F" }}>
              {state.matchWinner === "red" ? redTeam.name : blueTeam.name} WYGRYWAJĄ MECZ!
            </span>
          </div>

          {/* VS Score Block (Final) */}
          <div style={vsScoreContainerStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <span style={{ fontSize: 48 }}>{TEAM_AVATAR_EMOJI[redTeam.avatar]}</span>
              <span style={{ fontSize: 24, fontWeight: 900, color: "rgba(255,255,255,0.7)" }}>{redTeam.name}</span>
              <div style={{ ...scoreSquareStyle, background: "#E74C3C", border: state.matchWinner === "red" ? "4px solid #fff" : "none" }}>{state.matchScore.red}</div>
            </div>

            <div style={{ fontSize: 32, fontWeight: 900, color: "rgba(255,255,255,0.3)" }}>VS</div>

            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ ...scoreSquareStyle, background: "#3498DB", border: state.matchWinner === "blue" ? "4px solid #fff" : "none" }}>{state.matchScore.blue}</div>
              <span style={{ fontSize: 24, fontWeight: 900, color: "rgba(255,255,255,0.7)" }}>{blueTeam.name}</span>
              <span style={{ fontSize: 48 }}>{TEAM_AVATAR_EMOJI[blueTeam.avatar]}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 20, marginTop: 40 }}>
            <button
              className="taj-button-enter"
              style={{ background: "rgba(255,255,255,0.1)", fontSize: 18 }}
              onClick={onResetMatch}
            >
              Powrót do menu
            </button>
            <button
              className="taj-button-enter"
              style={{ background: "#F1C40F", color: "#000", fontSize: 18, boxShadow: "0 0 20px rgba(241, 196, 15, 0.4)" }}
              onClick={onReplay}
            >
              Zagraj Ponownie
            </button>
          </div>
        </div>
      )}

      {/* Pool exhausted — auto-reset notification */}
      {poolJustReset && (
        <div style={overlayStyle}>
          <div style={{ ...modalStyle, padding: 48 }} className="taj-modal-glass">
            <div style={{ fontSize: 48, marginBottom: 16 }}>♻️</div>
            <h2 style={modalTitleStyle}>Pula haseł wyczerpana</h2>
            <p style={modalTextStyle}>
              Wszystkie unikalne hasła zostały już użyte. Pula została zresetowana — hasła wróciły do obiegu.
            </p>
            <button
              style={{ ...modalBtnStyle, background: "#E74C3C", width: "100%" }}
              onClick={onPoolResetAck}
            >
              Rozumiem, gramy dalej
            </button>
          </div>
        </div>
      )}

      {showResetConfirm && (
        <div style={overlayStyle}>
          <div style={{ ...modalStyle, padding: 48 }} className="taj-modal-glass">
            <h2 style={modalTitleStyle}>Reset Meczu</h2>
            <p style={modalTextStyle}>Czy na pewno chcesz zresetować cały postęp i wrócić do ustawień?</p>
            <div style={modalActionsStyle}>
              <button style={{ ...modalBtnStyle, background: "#E74C3C", flex: 1 }} onClick={onResetMatch}>Tak, resetuj</button>
              <button style={{ ...modalBtnStyle, background: "rgba(255,255,255,0.1)", flex: 1 }} onClick={() => setShowResetConfirm(false)}>Anuluj</button>
            </div>
          </div>
        </div>
      )}

      {/* DEV: Word pool inspector */}
      {showDevModal && (() => {
        const category = state.settings.category ?? "standard";
        const allWords = category === "uncensored" ? uncensoredWords : standardWords;
        const boardWords = new Set(round.board.map((c) => c.word));
        const allUsed = new Set(loadUsedWords(category));
        const prevUsed = new Set([...allUsed].filter((w) => !boardWords.has(w)));
        const unused = allWords.filter((w) => !allUsed.has(w));

        return (
          <div style={overlayStyle} onClick={() => setShowDevModal(false)}>
            <div
              style={{
                background: "#111",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 20,
                padding: 32,
                maxWidth: 760,
                width: "90vw",
                maxHeight: "80vh",
                overflowY: "auto",
                color: "#fff",
                fontFamily: "monospace",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h2 style={{ margin: 0, fontSize: 18 }}>🛠 DEV — Pula haseł</h2>
                <button
                  type="button"
                  onClick={() => setShowDevModal(false)}
                  style={{ background: "none", border: "none", color: "#fff", fontSize: 24, cursor: "pointer" }}
                >✕</button>
              </div>

              <div style={{ marginBottom: 20, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                Kategoria: <strong style={{ color: "#fff" }}>{category}</strong>
                {" · "}
                <span style={{ color: "#e74c3c" }}>■ zużyte ({prevUsed.size})</span>
                {" · "}
                <span style={{ color: "#2ecc71" }}>■ aktywne na planszy ({boardWords.size})</span>
                {" · "}
                <span style={{ color: "#555" }}>■ unikalne ({unused.length})</span>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {allWords.map((w) => {
                  const isActive = boardWords.has(w);
                  const isUsed = prevUsed.has(w);
                  return (
                    <span
                      key={w}
                      style={{
                        borderRadius: 6,
                        padding: "3px 10px",
                        fontSize: 12,
                        fontWeight: isActive ? 700 : 400,
                        background: isActive
                          ? "rgba(46,204,113,0.15)"
                          : isUsed
                          ? "rgba(231,76,60,0.12)"
                          : "rgba(255,255,255,0.04)",
                        border: `1px solid ${isActive ? "rgba(46,204,113,0.5)" : isUsed ? "rgba(231,76,60,0.3)" : "rgba(255,255,255,0.08)"}`,
                        color: isActive ? "#2ecc71" : isUsed ? "#e74c3c" : "#555",
                      }}
                    >
                      {w}
                    </span>
                  );
                })}
              </div>

              {/* Bridge stats */}
              <div style={{ marginTop: 12, padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#71717a", letterSpacing: "0.05em" }}>BRIDGE STATS</span>
                  <button
                    type="button"
                    onClick={resetDevStats}
                    style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#71717a", fontSize: 10, padding: "2px 8px", borderRadius: 4, cursor: "pointer" }}
                  >
                    reset
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {([
                    ["📤 Wysłane", devStats.messagesSent],
                    ["📥 Odebrane", devStats.messagesReceived],
                    ["🔄 Sync retries", devStats.syncRetries],
                    ["📡 Re-announces", devStats.reannounces],
                  ] as [string, number][]).map(([label, val]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                      <span>{label}</span>
                      <strong style={{ color: val > 0 ? "#fff" : "#444" }}>{val}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Design Tokens & Styles ──────────────────

const cardColors: Record<string, { bg: string; border: string; glow: string }> = {
  red: {
    bg: "linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)",
    border: "#ff7675",
    glow: "rgba(231, 76, 60, 0.4)"
  },
  blue: {
    bg: "linear-gradient(135deg, #3498DB 0%, #2980B9 100%)",
    border: "#74b9ff",
    glow: "rgba(52, 152, 219, 0.4)"
  },
  neutral: {
    bg: "linear-gradient(135deg, #636e72 0%, #2d3436 100%)",
    border: "#b2bec3",
    glow: "rgba(0,0,0,0)"
  },
  assassin: {
    bg: "#000",
    border: "#d63031",
    glow: "rgba(255,255,255,0.1)"
  },
};

const shellStyle: React.CSSProperties = {
  height: "100vh",
  background: "#0a0a0b",
  display: "grid",
  gridTemplateRows: "auto 1fr auto",
  fontFamily: "'Space Grotesk', system-ui, sans-serif",
  color: "#fff",
  overflow: "hidden",
  position: "relative",
};

const headerStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(200px, 1.2fr) auto minmax(200px, 1.2fr)",
  alignItems: "center",
  padding: "0 2vw",
  gap: 12,
  height: "10vh",
  minHeight: 64,
};

const teamScoreBlockStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: "1.5vw",
  padding: "0 1.5vw",
  background: "rgba(255,255,255,0.02)",
  borderRadius: 16,
  border: "1px solid",
  justifyContent: "space-between",
  minWidth: 0,
  height: "100%",
};

const teamHeaderInfoStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 16,
};

const avatarCircleStyle = (color: string): React.CSSProperties => ({
  width: "min(48px, 6vh)",
  height: "min(48px, 6vh)",
  borderRadius: "50%",
  background: color,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "min(24px, 3vh)",
  boxShadow: `0 0 20px ${color}44`,
  flexShrink: 0,
});

const teamNameStyle: React.CSSProperties = {
  fontFamily: "'Space Grotesk', system-ui, sans-serif",
  fontSize: 22,
  fontWeight: 900,
  fontStyle: "italic",
  color: "#f7f8fa",
  letterSpacing: "-0.02em",
  textTransform: "uppercase",
};

const inlineHintStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 10px",
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 800,
  textTransform: "uppercase",
  marginLeft: 8,
};

// Hint displayed between team name and score (horizontal row)
const hintBetweenStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  flex: 1,
};

const hintWordStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.9)",
};

const hintTeamCountStyle = (color: string): React.CSSProperties => ({
  fontSize: 20,
  fontWeight: 900,
  color,
  letterSpacing: "0.08em",
});

const scoreValueStyle = (color: string): React.CSSProperties => ({
  fontSize: "clamp(24px, 4vh, 48px)",
  fontWeight: 900,
  color,
  lineHeight: 1,
});

const centralActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
};

const actionCircleButtonStyle: React.CSSProperties = {
  width: "min(50px, 6vh)",
  height: "min(50px, 6vh)",
  borderRadius: "50%",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.03)",
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
  transition: "all 0.2s ease",
  color: "#fff",
};

const boardWrapperStyle: React.CSSProperties = {
  flex: 1,
  padding: "10px",
  display: "grid",
  placeItems: "center",
  overflow: "hidden",
  minHeight: 0,
};

const boardGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, 1fr)",
  gridTemplateRows: "repeat(5, 1fr)",
  gap: "10px", // Snappy, fixed small gap
  width: "100%",
  height: "100%",
};

const cardBaseStyle: React.CSSProperties = {
  borderRadius: 12,
  padding: 0,
  height: "100%",
  width: "100%",
  display: "grid",
  placeItems: "center",
  position: "relative",
  transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  backdropFilter: "blur(4px)",
};

const cardWordStyle: React.CSSProperties = {
  fontSize: "clamp(12px, 4vh, 48px)",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  textAlign: "center",
  padding: "0 10px",
  pointerEvents: "none",
};

const assassinIconStyle: React.CSSProperties = {
  position: "absolute",
  bottom: 12,
  right: 12,
  fontSize: 24,
};

const footerStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  alignItems: "center",
  padding: "0 2vw",
  height: "10vh",
  minHeight: 64,
  background: "linear-gradient(to top, rgba(0,0,0,0.4), transparent)",
};

const tokenRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "nowrap",
};

const tokenStyle: React.CSSProperties = {
  width: "min(42px, 3.5vw)",
  height: "min(52px, 5vh)",
  borderRadius: 8,
  border: "1px solid",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 2,
  transition: "all 0.3s ease",
  overflow: "hidden",
  background: "rgba(255,255,255,0.03)",
};

const tokenEmojiStyle: React.CSSProperties = {
  fontSize: "min(22px, 2.5vh)",
  margin: 0,
  lineHeight: 1,
};

const tokenNumberStyle: React.CSSProperties = {
  fontSize: "min(10px, 1.2vh)",
  fontWeight: 900,
  color: "rgba(255,255,255,0.8)",
  lineHeight: 1,
};

const turnIndicatorStyle: React.CSSProperties = {
  fontSize: "clamp(14px, 2.2vh, 20px)",
  fontWeight: 700,
  color: "rgba(255,255,255,0.4)",
  padding: "0 2vw",
  whiteSpace: "nowrap",
};

const hintBannerWrapperStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  padding: "4px 0",
};

const hintBannerStyle: React.CSSProperties = {
  background: "linear-gradient(90deg, transparent, rgba(231, 76, 60, 0.1), rgba(52, 152, 219, 0.1), transparent)",
  padding: "8px 48px",
  borderRadius: 40,
  display: "flex",
  alignItems: "center",
  gap: 16,
  border: "1px solid rgba(255,255,255,0.05)",
  boxShadow: "0 0 40px rgba(0,0,0,0.3)",
};

const hintTextStyle: React.CSSProperties = {
  fontSize: "clamp(24px, 4vh, 42px)",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.2em",
  color: "#fff",
  textShadow: "0 0 20px rgba(255,255,255,0.3)",
};

const hintCountStyle: React.CSSProperties = {
  fontSize: "clamp(20px, 3vh, 32px)",
  fontWeight: 900,
  background: "rgba(255,255,255,0.1)",
  width: "min(48px, 6vh)",
  height: "min(48px, 6vh)",
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  color: "#fbbf24",
  border: "1px solid rgba(251, 191, 36, 0.3)",
};

const overlayStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0, 0, 0, 0.9)",
  backdropFilter: "blur(12px) saturate(160%)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  textAlign: "center",
  maxWidth: 800,
  width: "90%",
};

const roundEndHeaderBoxStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px 48px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 24,
  marginBottom: 60,
  backdropFilter: "blur(20px)",
};

const vsScoreContainerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 48,
  marginBottom: 60,
};

const scoreSquareStyle: React.CSSProperties = {
  width: "min(120px, 15vh)",
  height: "min(120px, 15vh)",
  borderRadius: 24,
  display: "grid",
  placeItems: "center",
  fontSize: "min(64px, 10vh)",
  fontWeight: 900,
  color: "#fff",
  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
};

const teamResultButtonStyle: React.CSSProperties = {
  padding: "40px 60px",
  background: "rgba(255,255,255,0.02)",
  borderRadius: 32,
  cursor: "pointer",
  transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  color: "#fff",
};

const modalTitleStyle: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 900,
  marginBottom: 24,
};

const modalTextStyle: React.CSSProperties = {
  fontSize: 20,
  color: "rgba(255,255,255,0.7)",
  marginBottom: 32,
};

const modalActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 16,
  width: "100%",
};

const modalBtnStyle: React.CSSProperties = {
  padding: "16px 32px",
  borderRadius: 16,
  border: "none",
  color: "#fff",
  fontSize: 18,
  fontWeight: 700,
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const modalPrimaryBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: 18,
  borderRadius: 20,
  border: "none",
  background: "#E74C3C",
  color: "#fff",
  fontSize: 18,
  fontWeight: 800,
  cursor: "pointer",
};
