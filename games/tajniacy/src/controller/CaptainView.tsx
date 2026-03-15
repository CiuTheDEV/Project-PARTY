// ──────────────────────────────────────────────
// Tajniacy – Captain Device View
// Prywatny widok klucza planszy z możliwością podawania haseł
// Responsywny na urządzenia mobilne
// ──────────────────────────────────────────────

import { useState, useEffect } from "react";
import { TEAM_AVATAR_EMOJI } from "../shared/avatars.ts";
import { countRemaining } from "../shared/board-generator.ts";
import type { Board, MatchSettings, RoundState, TeamId } from "../shared/types.ts";

type CaptainViewProps = {
  board: Board;
  settings: MatchSettings;
  teamId: TeamId;
  matchScore: Record<TeamId, number>;
  startingTeam: TeamId;
  roundNumber: number;
  /** If true, hides the hint input — spectator captain mode */
  readOnly?: boolean;
  currentHint?: { word: string; count: number } | null;
  onSendHint?: (word: string, count: number) => void;
  onClearHint?: () => void;
};

export function TajniacyCaptainApp({
  board,
  settings,
  teamId,
  matchScore,
  startingTeam,
  roundNumber,
  readOnly = false,
  currentHint = null,
  onSendHint,
  onClearHint,
}: CaptainViewProps) {
  const [hintWord, setHintWord] = useState("");
  const [hintCount, setHintCount] = useState<number>(1);
  const [cooldown, setCooldown] = useState(0);

  const redTeam = settings.teams[0];
  const blueTeam = settings.teams[1];
  const myTeam = teamId === "red" ? redTeam : blueTeam;
  const redRemaining = countRemaining(board, "red");
  const blueRemaining = countRemaining(board, "blue");
  const accentColor = teamId === "red" ? "#E74C3C" : "#3498DB";

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        const next = cooldown - 1;
        setCooldown(next);
        // Auto-expire hint when cooldown runs out
        if (next === 0 && currentHint) {
          onClearHint?.();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSend = () => {
    if (!hintWord.trim() || cooldown > 0) return;
    onSendHint?.(hintWord, hintCount);
    setCooldown(15);
    setHintWord("");
    setHintCount(1);
  };

  return (
    <div style={{ ...shellStyle, borderTop: `3px solid ${accentColor}` }}>
      {/* Header — single compact row */}
      <header style={headerStyle}>
        {/* Role badge */}
        <div style={{ ...roleBadgeStyle, borderColor: `${accentColor}55`, color: accentColor }}>
          <span style={{ fontSize: 10 }}>{readOnly ? "👁️" : "🔑"}</span>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.06em" }}>
            {readOnly ? "WIDOK" : myTeam.name.toUpperCase()}
          </span>
        </div>

        {/* Center: scores + turn info */}
        <div style={centerBlockStyle}>
          <div style={scoresRowStyle}>
            <span style={{ color: "#E74C3C", fontWeight: 900, fontSize: 16 }}>{matchScore.red}</span>
            <span style={{ color: "#52525b", fontSize: 10 }}>:</span>
            <span style={{ color: "#3498DB", fontWeight: 900, fontSize: 16 }}>{matchScore.blue}</span>
          </div>
          <div style={{
            fontSize: 9,
            fontWeight: 800,
            color: startingTeam === "red" ? "#E74C3C" : "#3498DB",
            letterSpacing: "0.06em",
          }}>
            ZACZYNAJĄ: {(startingTeam === "red" ? redTeam.name : blueTeam.name).toUpperCase()}
          </div>
        </div>

        {/* Right: hint chip or remaining count */}
        <div style={rightBlockStyle}>
          {currentHint ? (
            <div style={{ display: "flex", gap: 4, alignItems: "center", background: `${accentColor}18`, padding: "3px 7px", borderRadius: 8, border: `1px solid ${accentColor}33` }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: accentColor }}>{currentHint.word}</span>
              <span style={{ fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,0.5)" }}>{currentHint.count === 0 ? "∞" : currentHint.count}</span>
              {!readOnly && (
                <button type="button" style={{ background: "none", border: "none", color: "#71717a", cursor: "pointer", padding: 0, display: "flex", marginLeft: 1 }} onClick={onClearHint}>
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>close</span>
                </button>
              )}
            </div>
          ) : (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, color: "#71717a" }}>RUNDA</div>
              <div style={{ fontSize: 14, fontWeight: 900 }}>{roundNumber}</div>
            </div>
          )}
        </div>
      </header>

      {/* Grid */}
      <main style={gridScrollStyle}>
        <div style={gridStyle}>
          {board.map((card, index) => {
            const isRevealed = card.revealed;
            const bg = keyBg[card.identity];

            return (
              <div
                key={`${card.word}-${index}`}
                style={{
                  ...keyCardStyle,
                  background: bg,
                  opacity: isRevealed ? 0.28 : 1,
                  boxShadow: isRevealed ? "none" : `0 3px 8px ${cardColors[card.identity]}55`,
                  border: isRevealed
                    ? "1px solid rgba(255,255,255,0.04)"
                    : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <span style={keyWordStyle}>{card.word}</span>
                {card.identity === "assassin" && (
                  <span style={keySkullStyle}>💀</span>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer style={footerStyle}>
        {!readOnly && (
            <div style={hintFormStyle}>
              <input
                type="text"
                placeholder="Hasło..."
                value={hintWord}
                onChange={(e) => setHintWord(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                style={hintInputStyle}
              />
              <div style={countControlStyle}>
                <button type="button" style={countBtnStyle} onClick={() => setHintCount(Math.max(0, hintCount - 1))}>-</button>
                <span style={countValueStyle}>{hintCount === 0 ? "∞" : hintCount}</span>
                <button type="button" style={countBtnStyle} onClick={() => setHintCount(hintCount + 1)}>+</button>
              </div>
              <button
                type="button"
                style={{
                  ...sendBtnStyle,
                  background: accentColor,
                  opacity: hintWord.trim() && cooldown === 0 ? 1 : 0.4,
                }}
                onClick={handleSend}
                disabled={!hintWord.trim() || cooldown > 0}
              >
                {cooldown > 0 ? `PODAJ (${cooldown}s)` : "PODAJ"}
              </button>
            </div>
        )}

        {/* Active hint bar with countdown + clear button */}
        {!readOnly && currentHint && cooldown > 0 && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: `${accentColor}15`,
            border: `1px solid ${accentColor}40`,
            borderRadius: 12,
            padding: "8px 12px",
            gap: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: accentColor }}>{currentHint.word}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>{currentHint.count === 0 ? "∞" : currentHint.count}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, color: "#71717a" }}>znika za {cooldown}s</span>
              <button
                type="button"
                onClick={onClearHint}
                style={{ background: "rgba(231,76,60,0.15)", border: "1px solid rgba(231,76,60,0.3)", color: "#E74C3C", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}
              >
                Usuń
              </button>
            </div>
          </div>
        )}

        {readOnly && (
          <div style={readOnlyBannerStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
            Tryb widza — nie możesz wysyłać haseł
          </div>
        )}


        <div style={remainingRowStyle}>
          <div style={tokenStyle("#E74C3C")}>
            <span>{TEAM_AVATAR_EMOJI[redTeam.avatar]}</span>
            <strong>{redRemaining}</strong>
            <span style={{ fontSize: 10, color: "#71717a" }}>pozostało</span>
          </div>
          <div style={tokenStyle("#3498DB")}>
            <span style={{ fontSize: 10, color: "#71717a" }}>pozostało</span>
            <strong>{blueRemaining}</strong>
            <span>{TEAM_AVATAR_EMOJI[blueTeam.avatar]}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Design Tokens ──────────────────────────

const cardColors: Record<string, string> = {
  red: "#E74C3C",
  blue: "#3498DB",
  neutral: "#71717a",
  assassin: "#000000",
};

const keyBg: Record<string, string> = {
  red: "linear-gradient(135deg, #B03A2E, #E74C3C)",
  blue: "linear-gradient(135deg, #1A5276, #3498DB)",
  neutral: "rgba(82, 82, 91, 0.5)",
  assassin: "#111",
};

const shellStyle: React.CSSProperties = {
  height: "100dvh",
  background: "#0a0a0b",
  display: "grid",
  gridTemplateRows: "auto 1fr auto",
  fontFamily: "'Space Grotesk', system-ui, sans-serif",
  color: "#fff",
  padding: "4px",
  gap: 4,
  boxSizing: "border-box",
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 6,
  padding: "2px 2px",
};

const roleBadgeStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 1,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid",
  borderRadius: 10,
  padding: "5px 8px",
  minWidth: 44,
};

const centerBlockStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 1,
};

const scoresRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const rightBlockStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  minWidth: 44,
};


const gridScrollStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, 1fr)",
  gridTemplateRows: "repeat(5, minmax(0, 1fr))",
  gap: "clamp(3px, 1vw, 8px)", // Smaller gap for mobile
  flex: 1,
};

const keyCardStyle: React.CSSProperties = {
  borderRadius: 8,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  position: "relative",
  height: "100%",
  overflow: "hidden",
  transition: "opacity 0.3s ease",
  padding: "2px 1px",
};

const keyWordStyle: React.CSSProperties = {
  fontSize: "clamp(6px, 2vh, 11px)",
  fontWeight: 800,
  textTransform: "uppercase",
  textAlign: "center",
  lineHeight: 1.05,
  wordBreak: "break-word",
  overflow: "hidden",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
};

const keySkullStyle: React.CSSProperties = {
  position: "absolute",
  bottom: 2,
  right: 2,
  fontSize: "clamp(8px, 2vw, 12px)",
};

const footerStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const hintFormStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto auto",
  gap: 6,
  background: "rgba(255,255,255,0.04)",
  padding: "6px 8px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.08)",
  alignItems: "center",
};

const hintInputStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#fff",
  padding: "8px",
  fontSize: 15,
  fontWeight: 700,
  outline: "none",
  width: "100%",
  minWidth: 0,
};

const countControlStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "rgba(255,255,255,0.06)",
  borderRadius: 10,
  padding: "2px 6px",
};

const countBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#fff",
  fontSize: 18,
  fontWeight: 700,
  cursor: "pointer",
  width: 24,
  lineHeight: 1,
  padding: 0,
};

const countValueStyle: React.CSSProperties = {
  minWidth: 16,
  textAlign: "center",
  fontWeight: 800,
  fontSize: 14,
};

const sendBtnStyle: React.CSSProperties = {
  border: "none",
  color: "#fff",
  fontWeight: 900,
  padding: "10px",
  borderRadius: 10,
  cursor: "pointer",
  fontSize: 12,
  letterSpacing: "0.06em",
};

const activeHintContainerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  padding: "10px 14px",
  borderRadius: 14,
};

const activeHintTextStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#a1a1aa",
};

const clearBtnStyle: React.CSSProperties = {
  background: "rgba(231, 76, 60, 0.15)",
  border: "1px solid rgba(231, 76, 60, 0.3)",
  color: "#E74C3C",
  borderRadius: 8,
  padding: "6px 10px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.15s",
};

const readOnlyBannerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  background: "rgba(251,191,36,0.08)",
  border: "1px solid rgba(251,191,36,0.2)",
  padding: "10px 16px",
  borderRadius: 12,
  color: "#fbbf24",
  fontSize: 12,
  fontWeight: 600,
};

const remainingRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 8,
};

const tokenStyle = (color: string): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: `${color}11`,
  padding: "10px 14px",
  borderRadius: 12,
  border: `1px solid ${color}33`,
  fontSize: 16,
  flex: 1,
  justifyContent: "center",
});
