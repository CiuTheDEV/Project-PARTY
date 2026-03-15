// ──────────────────────────────────────────────
// Tajniacy – Player View (view-only)
// Uproszczony podgląd planszy dla graczy/widzów
// Responsywny na urządzenia mobilne
// ──────────────────────────────────────────────

import { TEAM_AVATAR_EMOJI } from "../shared/avatars.ts";
import { countRemaining } from "../shared/board-generator.ts";
import type { Board, MatchSettings, TeamId } from "../shared/types.ts";

type PlayerViewProps = {
  board: Board;
  settings: MatchSettings;
  matchScore: Record<TeamId, number>;
  startingTeam: TeamId;
  hints?: { red: { word: string; count: number } | null; blue: { word: string; count: number } | null } | null;
};

export function TajniacyPlayerView({
  board,
  settings,
  matchScore,
  startingTeam,
  hints,
}: PlayerViewProps) {
  const redTeam = settings.teams[0];
  const blueTeam = settings.teams[1];
  const redRemaining = countRemaining(board, "red");
  const blueRemaining = countRemaining(board, "blue");

  return (
    <div style={shellStyle}>
      {/* Header — compact single row */}
      <header style={headerStyle}>
        {/* Red team */}
        <div style={teamBlockStyle("#E74C3C")}>
          <span style={avatarStyle}>{TEAM_AVATAR_EMOJI[redTeam.avatar]}</span>
          <div style={teamInfoStyle}>
            <span style={teamNameStyle}>{redTeam.name}</span>
            <span style={scoreStyle}>{matchScore.red}</span>
            {hints?.red && (
              <div style={hintChipStyle("#E74C3C")}>
                <span style={hintWordStyle}>{hints.red.word}</span>
                <span style={hintCountStyle}>{hints.red.count === 0 ? "∞" : hints.red.count}</span>
              </div>
            )}
          </div>
        </div>

        {/* Center — turn */}
        <div style={centerInfoStyle}>
          <div style={labelStyle}>ZACZYNAJĄ:</div>
          <div style={{
            ...turnValueStyle,
            color: startingTeam === "red" ? "#E74C3C" : "#3498DB"
          }}>
            {(startingTeam === "red" ? redTeam.name : blueTeam.name).toUpperCase()}
          </div>
        </div>

        {/* Blue team */}
        <div style={{ ...teamBlockStyle("#3498DB"), textAlign: "right" }}>
          <div style={{ ...teamInfoStyle, alignItems: "flex-end" }}>
            <span style={teamNameStyle}>{blueTeam.name}</span>
            <span style={scoreStyle}>{matchScore.blue}</span>
            {hints?.blue && (
              <div style={hintChipStyle("#3498DB")}>
                <span style={hintWordStyle}>{hints.blue.word}</span>
                <span style={hintCountStyle}>{hints.blue.count === 0 ? "∞" : hints.blue.count}</span>
              </div>
            )}
          </div>
          <span style={avatarStyle}>{TEAM_AVATAR_EMOJI[blueTeam.avatar]}</span>
        </div>
      </header>

      {/* Board */}
      <main style={gridStyle}>
        {board.map((card, index) => {
          const isRevealed = card.revealed;
          const bg = isRevealed ? viewBg[card.identity] : "rgba(255,255,255,0.03)";

          return (
            <div
              key={`${card.word}-${index}`}
              style={{
                ...cardStyle,
                background: bg,
                border: isRevealed ? "none" : "1px solid rgba(255,255,255,0.07)",
                opacity: isRevealed ? 0.88 : 1,
              }}
            >
              <span style={{
                ...wordStyle,
                color: isRevealed ? "#fff" : "rgba(255,255,255,0.55)",
                fontSize: "clamp(8px, 3vw, 14px)",
              }}>
                {card.word}
              </span>
              {isRevealed && card.identity === "assassin" && (
                <span style={skullStyle}>💀</span>
              )}
            </div>
          );
        })}
      </main>

      {/* Footer */}
      <footer style={footerStyle}>
        <div style={badgeStyle("#E74C3C")}>
          Czerwoni: {redRemaining}
        </div>
        <div style={badgeStyle("#3498DB")}>
          Niebiescy: {blueRemaining}
        </div>
      </footer>
    </div>
  );
}

// ─── Design Tokens ──────────────────────────

const viewBg: Record<string, string> = {
  red: "linear-gradient(135deg, #B03A2E, #E74C3C)",
  blue: "linear-gradient(135deg, #1A5276, #3498DB)",
  neutral: "#52525b",
  assassin: "#111",
};

const shellStyle: React.CSSProperties = {
  height: "100dvh",
  background: "#0a0a0b",
  display: "grid",
  gridTemplateRows: "auto 1fr auto",
  fontFamily: "'Space Grotesk', system-ui, sans-serif",
  color: "#fff",
  padding: "6px",
  gap: 6,
  boxSizing: "border-box",
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 5,
};

const teamBlockStyle = (color: string): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 5,
  padding: "5px 8px",
  background: `${color}10`,
  borderRadius: 10,
  border: `1px solid ${color}30`,
  minWidth: 0,
  flex: 1,
});

const teamInfoStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minWidth: 0,
};

const teamNameStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: "#71717a",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const scoreStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  lineHeight: 1,
};

const avatarStyle: React.CSSProperties = {
  fontSize: 20,
  flexShrink: 0,
};

const centerInfoStyle: React.CSSProperties = {
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
  minWidth: 0,
};

const labelStyle: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 800,
  color: "#52525b",
  letterSpacing: "0.1em",
};

const turnValueStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: "0.05em",
};

const hintChipStyle = (color: string): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 4,
  background: `${color}18`,
  border: `1px solid ${color}40`,
  borderRadius: 8,
  padding: "3px 8px",
  marginTop: 2,
});

const hintWordStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  color: "#f7f8fa",
  textTransform: "uppercase",
};

const hintCountStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 900,
  color: "#a1a1aa",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, 1fr)",
  gridTemplateRows: "repeat(5, minmax(0, 1fr))",
  gap: "clamp(4px, 1.5vw, 8px)",
  flex: 1,
  minHeight: 0,
  padding: "4px 0",
};

const cardStyle: React.CSSProperties = {
  borderRadius: 8,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  position: "relative",
  height: "100%",
  overflow: "hidden",
  transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  padding: 2,
};

const wordStyle: React.CSSProperties = {
  fontWeight: 800,
  textTransform: "uppercase",
  textAlign: "center",
  lineHeight: 1.05,
  overflow: "hidden",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
};

const skullStyle: React.CSSProperties = {
  position: "absolute",
  bottom: 2,
  right: 2,
  fontSize: "clamp(7px, 2vw, 10px)",
};

const footerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-around",
  alignItems: "center",
  gap: 8,
};

const badgeStyle = (color: string): React.CSSProperties => ({
  padding: "6px 12px",
  borderRadius: 999,
  background: `${color}18`,
  border: `1px solid ${color}35`,
  color,
  fontSize: 11,
  fontWeight: 700,
  whiteSpace: "nowrap",
});

const hintFooterStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#a1a1aa",
  textAlign: "center",
  padding: "4px 8px",
};
