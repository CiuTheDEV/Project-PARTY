import { useState, useEffect } from "react";
import type { TajniacyPresence } from "../shared/bridge.ts";
import { TajniacyPairingModal } from "./PairingModal.tsx";
import {
  AVATAR_CATEGORIES,
  DEFAULT_AVATARS,
  TEAM_AVATAR_EMOJI,
} from "../shared/avatars.ts";
import type { AvatarCategory } from "../shared/avatars.ts";
import type {
  MatchSettings,
  RoundRecord,
  TeamAvatar,
  TeamId,
  WordCategory,
} from "../shared/types.ts";
import { standardWords, uncensoredWords, loadUsedWords, resetUsedWords } from "../shared/words.ts";

type SetupScreenProps = {
  sessionCode?: string;
  presence?: TajniacyPresence;
  settings: MatchSettings;
  matchScore: Record<TeamId, number>;
  roundHistory: RoundRecord[];
  onTeamNameChange: (teamId: TeamId, name: string) => void;
  onTeamAvatarChange: (teamId: TeamId, avatar: TeamAvatar) => void;
  onCategoryChange: (category: WordCategory | null) => void;
  onAssassinCountChange: (count: number) => void;
  onRoundsToWinChange: (rounds: number) => void;
  onStartMatch: () => void;
  onDisconnectAll?: () => void;
  onClose?: () => void;
};

export function SetupScreen({
  sessionCode,
  presence = { captainRed: false, captainBlue: false, playerView: false, spectatorCaptain: false },
  settings,
  matchScore,
  roundHistory,
  onTeamNameChange,
  onTeamAvatarChange,
  onCategoryChange,
  onAssassinCountChange,
  onRoundsToWinChange,
  onStartMatch,
  onDisconnectAll,
  onClose,
}: SetupScreenProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [usedWordsCount, setUsedWordsCount] = useState(0);
  useEffect(() => {
    setUsedWordsCount(settings.category ? loadUsedWords(settings.category).length : 0);
  }, [settings.category]);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<"gameplay" | "advanced">("gameplay");
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);

  // Avatar picker state
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<TeamId | null>(null);
  const [activeAvatarCategory, setActiveAvatarCategory] = useState<AvatarCategory>("Zwierzęta");
  const [selectedAvatarInModal, setSelectedAvatarInModal] = useState<string | null>(null);

  const hasMatchInProgress = matchScore.red > 0 || matchScore.blue > 0;
  const canStart = settings.category !== null;

  const toggleSection = (id: string) => {
    setExpandedSection((prev) => (prev === id ? null : id));
  };

  return (
    <div style={shellStyle}>
      <div style={containerStyle}>
        {/* Header */}
        <div style={headerStyle}>
          {onClose && (
            <button
              type="button"
              style={closeButtonStyle}
              onClick={onClose}
              aria-label="Zamknij"
            >
              ✕
            </button>
          )}
          <h1 style={titleStyle}>Tajniacy</h1>
          <p style={subtitleStyle}>Konfiguracja meczu</p>
        </div>

        {/* Match score (if in progress) */}
        {hasMatchInProgress && (
          <div style={scoreBarStyle}>
            <span style={{ color: "#E74C3C" }}>
              {TEAM_AVATAR_EMOJI[settings.teams[0].avatar]} {settings.teams[0].name}: {matchScore.red}
            </span>
            <span style={{ color: "#71717a" }}>vs</span>
            <span style={{ color: "#3498DB" }}>
              {TEAM_AVATAR_EMOJI[settings.teams[1].avatar]} {settings.teams[1].name}: {matchScore.blue}
            </span>
          </div>
        )}

        {/* Teams section - Permanent */}
        <div
          style={{
            ...sectionStyle,
            padding: "24px 32px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ ...sectionTitleStyle, marginBottom: 20, fontSize: 18, fontWeight: 700 }}>Drużyny</div>
          <div style={teamsGridStyle}>
            {settings.teams.map((team) => (
              <div
                key={team.id}
                style={{
                  ...teamCardStyle,
                  borderColor:
                    team.id === "red"
                      ? "rgba(231, 76, 60, 0.4)"
                      : "rgba(52, 152, 219, 0.4)",
                  background: "rgba(0,0,0,0.2)",
                  padding: 24,
                }}
              >
                <h3
                  style={{
                    ...teamTitleStyle,
                    color: team.id === "red" ? "#E74C3C" : "#3498DB",
                    fontSize: 16,
                    marginBottom: 16,
                  }}
                >
                  Drużyna {team.id === "red" ? "Czerwona" : "Niebieska"}
                </h3>

                {/* Avatar grid - New layout: 7 avatars + ALWAYS (+) button */}
                <div style={avatarGridStyle}>
                  {(() => {
                    const displayAvatars = [...DEFAULT_AVATARS];
                    // Jeśli wybrany avatar nie jest na liście domyślnej, podmień ostatni widoczny slot
                    if (!displayAvatars.includes(team.avatar)) {
                      displayAvatars[displayAvatars.length - 1] = team.avatar;
                    }

                    return displayAvatars.map((avatar) => (
                      <button
                        key={avatar}
                        type="button"
                        style={{
                          ...avatarButtonStyle,
                          borderColor:
                            team.avatar === avatar
                              ? team.id === "red"
                                ? "#E74C3C"
                                : "#3498DB"
                              : "transparent",
                          background:
                            team.avatar === avatar
                              ? team.id === "red"
                                ? "rgba(231, 76, 60, 0.25)"
                                : "rgba(52, 152, 219, 0.25)"
                              : "rgba(255,255,255,0.06)",
                        }}
                        onClick={() => onTeamAvatarChange(team.id, avatar)}
                      >
                        {TEAM_AVATAR_EMOJI[avatar]}
                      </button>
                    ));
                  })()}
                  
                  {/* Stały przycisk plusa */}
                  <button
                    type="button"
                    style={{
                      ...avatarButtonStyle,
                      borderColor: "transparent",
                      background: "rgba(255,255,255,0.06)",
                      fontSize: 32,
                      color: "#71717a",
                    }}
                    onClick={() => {
                      setEditingTeamId(team.id);
                      setSelectedAvatarInModal(team.avatar);
                      setIsAvatarModalOpen(true);
                    }}
                  >
                    +
                  </button>
                </div>

                {/* Name input */}
                <input
                  type="text"
                  value={team.name}
                  onChange={(e) => onTeamNameChange(team.id, e.target.value)}
                  placeholder={team.id === "red" ? "Czerwoni" : "Niebiescy"}
                  style={{ ...nameInputStyle, marginTop: 24, height: 48, fontSize: 16 }}
                  maxLength={20}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Mode Settings Button */}
        <button
          type="button"
          style={modeSettingsBtnStyle}
          onClick={() => setIsSettingsModalOpen(true)}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>settings</span>
          Ustawienia trybu
        </button>

        {/* Mode Summary Panel */}
        <div style={modeSummaryBoxStyle}>
          <div style={summaryItemStyle}>
            <span style={summaryLabelStyle}>ROZGRYWKA</span>
            <strong style={summaryValueStyle}>
              {settings.roundsToWin} {settings.roundsToWin === 1 ? "runda" : "rundy"}
            </strong>
          </div>
          <div style={summaryItemStyle}>
            <span style={summaryLabelStyle}>ZABÓJCY</span>
            <strong style={summaryValueStyle}>
              {settings.assassinCount} {settings.assassinCount === 1 ? "osoba" : "osoby"}
            </strong>
          </div>
          <div style={summaryItemStyle}>
            <span style={summaryLabelStyle}>REMISY</span>
            <strong style={summaryValueStyle}>
              Sudden Death
            </strong>
          </div>
        </div>

        {/* ─── Device Pairing — Single tile ─── */}
        {(() => {
          const captainCount = [presence.captainRed, presence.captainBlue].filter(Boolean).length;
          const statusLabel = captainCount === 0
            ? "Niepołączono"
            : captainCount === 1
              ? "1 kapitan połączony"
              : "2 Kapitanów połączonych";
          const statusColor = captainCount === 0 ? "#52525b" : "#4ade80";
          const statusBg = captainCount === 0
            ? "rgba(82,82,91,0.15)"
            : "rgba(74,222,128,0.12)";

          return (
            <div style={pairingTileStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span style={summaryLabelStyle}>DODATKOWE URZĄDZENIA</span>
                  <p style={pairingDescStyle}>
                    Podłącz telefony kapitanów i widok graczy — każde urządzenie wybiera swoją rolę po zeskanowaniu kodu.
                  </p>
                </div>
                <span style={{
                  flexShrink: 0,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  color: statusColor,
                  background: statusBg,
                  padding: "3px 10px",
                  borderRadius: 99,
                  marginLeft: 12,
                  whiteSpace: "nowrap",
                }}>
                  {statusLabel}
                </span>
              </div>
              <button
                type="button"
                style={addDevicesBtnStyle}
                onClick={() => setIsPairingModalOpen(true)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_link</span>
                Dodaj urządzenia
              </button>
            </div>
          );
        })()}

        {/* Category section - Stays as accordion */}
        <Section
          title="Talia haseł"
          subtitle={
            settings.category === "standard"
              ? "Standardowa"
              : settings.category === "uncensored"
                ? "Bez cenzury (+18)"
                : "Nie wybrano"
          }
          expanded={expandedSection === "category"}
          onToggle={() => toggleSection("category")}
        >
          <div style={categoryGridStyle}>
            <button
              type="button"
              style={{
                ...categoryCardStyle,
                borderColor:
                  settings.category === "standard"
                    ? "#E74C3C"
                    : "rgba(255,255,255,0.1)",
                background:
                  settings.category === "standard"
                    ? "rgba(231, 76, 60, 0.12)"
                    : "rgba(255,255,255,0.03)",
              }}
              onClick={() => onCategoryChange("standard")}
            >
              <strong>Standardowa</strong>
              <p style={categoryDescStyle}>
                Klasyczne hasła odpowiednie dla wszystkich. Bezpieczne i rodzinne.
              </p>
              <span style={{ fontSize: 10, color: "#E74C3C", marginTop: 4, opacity: 0.8 }}>
                {standardWords.length} UNIKALNYCH HASEŁ
              </span>
            </button>

            <button
              type="button"
              style={{
                ...categoryCardStyle,
                borderColor:
                  settings.category === "uncensored"
                    ? "#E74C3C"
                    : "rgba(255,255,255,0.1)",
                background:
                  settings.category === "uncensored"
                    ? "rgba(231, 76, 60, 0.12)"
                    : "rgba(255,255,255,0.03)",
              }}
              onClick={() => onCategoryChange("uncensored")}
            >
              <strong>Bez cenzury (+18)</strong>
              <p style={categoryDescStyle}>
                Hasła pikantne i kontrowersyjne — tylko dla dorosłych.
              </p>
              <span style={{ fontSize: 10, color: "#E74C3C", marginTop: 4, opacity: 0.8 }}>
                {uncensoredWords.length} UNIKALNYCH HASEŁ
              </span>
            </button>
          </div>

          {/* Pool status + reset */}
          {settings.category && (() => {
            const total = settings.category === "uncensored" ? uncensoredWords.length : standardWords.length;
            const available = total - usedWordsCount;
            const pct = Math.round((available / total) * 100);
            return (
              <div style={poolStatusStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: "#a1a1aa" }}>
                    Dostępne hasła: <strong style={{ color: available > 25 ? "#4ade80" : "#f59e0b" }}>{available}</strong>
                    <span style={{ color: "#52525b" }}> / {total}</span>
                  </span>
                  <span style={{ fontSize: 11, color: "#52525b" }}>{pct}%</span>
                </div>
                <div style={poolBarTrackStyle}>
                  <div style={{ ...poolBarFillStyle, width: `${pct}%`, background: available > 25 ? "#4ade80" : "#f59e0b" }} />
                </div>
                <button
                  type="button"
                  style={resetPoolButtonStyle}
                  onClick={() => {
                    resetUsedWords(settings.category!);
                    setUsedWordsCount(0);
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
                  Reset puli haseł
                </button>
              </div>
            );
          })()}
        </Section>

        {/* Action buttons */}
        <div style={actionsStyle}>
          <button
            type="button"
            style={{
              ...startButtonStyle,
              opacity: canStart ? 1 : 0.4,
              cursor: canStart ? "pointer" : "not-allowed",
            }}
            disabled={!canStart}
            onClick={handleStartClick}
          >
            Start
          </button>
        </div>
      </div>

      {/* ─── Avatar Picker Modal ─── */}
      {isAvatarModalOpen && editingTeamId && (
        <div style={modalOverlayStyle} onClick={() => setIsAvatarModalOpen(false)}>
          <div style={avatarModalPanelStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={avatarModalTitleStyle}>Wybierz emoji</h2>

            {/* Categories */}
            <div style={avatarCategoryTabsStyle}>
              {(Object.keys(AVATAR_CATEGORIES) as AvatarCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  style={{
                    ...avatarCategoryTabButtonStyle,
                    ...(activeAvatarCategory === cat ? activeAvatarCategoryTabButtonStyle : {}),
                  }}
                  onClick={() => setActiveAvatarCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Emoji Grid */}
            <div style={avatarModalGridStyle}>
              {AVATAR_CATEGORIES[activeAvatarCategory].map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  style={{
                    ...avatarModalItemStyle,
                    ...(selectedAvatarInModal === avatar ? avatarModalItemSelectedStyle : {}),
                  }}
                  onClick={() => setSelectedAvatarInModal(avatar)}
                >
                  {TEAM_AVATAR_EMOJI[avatar]}
                </button>
              ))}
            </div>

            {/* Modal Actions */}
            <div style={avatarModalActionsStyle}>
              <button
                type="button"
                style={avatarModalSecondaryButtonStyle}
                onClick={() => setIsAvatarModalOpen(false)}
              >
                Anuluj
              </button>
              <button
                type="button"
                style={avatarModalPrimaryButtonStyle}
                onClick={() => {
                  if (selectedAvatarInModal) {
                    onTeamAvatarChange(editingTeamId, selectedAvatarInModal);
                  }
                  setIsAvatarModalOpen(false);
                }}
              >
                Wybierz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Mode Settings Modal ─── */}
      {isSettingsModalOpen && (
        <div style={modalOverlayStyle} onClick={() => setIsSettingsModalOpen(false)}>
          <div style={modalPanelStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalTitlebarStyle}>
              <h2 style={modalTitleStyle}>Ustawienia trybu</h2>
            </div>

            <div style={modalLayoutStyle}>
              {/* Sidebar */}
              <nav style={modalSidebarStyle}>
                <button
                  type="button"
                  style={{
                    ...modalNavButtonStyle,
                    ...(activeSettingsTab === "gameplay" ? activeModalNavButtonStyle : {}),
                  }}
                  onClick={() => setActiveSettingsTab("gameplay")}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>sports_esports</span>
                  Rozgrywka
                </button>
                <button
                  type="button"
                  style={{
                    ...modalNavButtonStyle,
                    ...(activeSettingsTab === "advanced" ? activeModalNavButtonStyle : {}),
                  }}
                  onClick={() => setActiveSettingsTab("advanced")}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>tune</span>
                  Zaawansowane
                </button>
              </nav>

              {/* Content area */}
              <div style={modalContentAreaStyle}>
                <header style={modalContentHeaderStyle}>
                  <strong>{activeSettingsTab === "gameplay" ? "Rozgrywka" : "Zaawansowane"}</strong>
                </header>

                <div style={modalContentBodyStyle}>
                  {activeSettingsTab === "gameplay" ? (
                    <div style={{ display: "grid", gap: 24 }}>
                      {/* Rounds to win */}
                      <div style={settingRowStyle}>
                        <span style={settingLabelStyle}>Rundy do wygranej:</span>
                        <div style={selectorRowStyle}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              style={{
                                ...selectorButtonStyle,
                                borderColor:
                                  settings.roundsToWin === n
                                    ? "#E74C3C"
                                    : "rgba(255,255,255,0.15)",
                                color: settings.roundsToWin === n ? "#fff" : "#a1a1aa",
                                background:
                                  settings.roundsToWin === n
                                    ? "rgba(231, 76, 60, 0.2)"
                                    : "rgba(255,255,255,0.03)",
                              }}
                              onClick={() => onRoundsToWinChange(n)}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Assassin count */}
                      <div style={settingRowStyle}>
                        <span style={settingLabelStyle}>Liczba zabójców:</span>
                        <div style={selectorRowStyle}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              style={{
                                ...selectorButtonStyle,
                                borderColor:
                                  settings.assassinCount === n
                                    ? "#E74C3C"
                                    : "rgba(255,255,255,0.15)",
                                color: settings.assassinCount === n ? "#fff" : "#a1a1aa",
                                background:
                                  settings.assassinCount === n
                                    ? "rgba(231, 76, 60, 0.2)"
                                    : "rgba(255,255,255,0.03)",
                              }}
                              onClick={() => onAssassinCountChange(n)}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: "#71717a", fontSize: 14, textAlign: "center", padding: "40px 0" }}>
                      Brak dodatkowych ustawień dla tego trybu.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={modalActionsStyle}>
              <button
                type="button"
                style={modalSecondaryButtonStyle}
                onClick={() => setIsSettingsModalOpen(false)}
              >
                Anuluj
              </button>
              <button
                type="button"
                style={modalPrimaryButtonStyle}
                onClick={() => setIsSettingsModalOpen(false)}
              >
                Zastosuj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Pairing Modal ─── */}
      <TajniacyPairingModal
        isOpen={isPairingModalOpen}
        sessionCode={sessionCode}
        presence={presence}
        onClose={() => setIsPairingModalOpen(false)}
        onDisconnectAll={() => {
          onDisconnectAll?.();
          setIsPairingModalOpen(false);
        }}
      />
    </div>
  );

  function handleStartClick() {
    if (canStart) {
      onStartMatch();
    }
  }
}

// ─── Accordion Section ───────────────────────

function Section({
  title,
  subtitle,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={sectionStyle}>
      <button type="button" style={sectionHeaderStyle} onClick={onToggle}>
        <div>
          <span style={sectionTitleStyle}>{title}</span>
          {subtitle && (
            <span style={sectionSubtitleStyle}>{subtitle}</span>
          )}
        </div>
        <span style={chevronStyle}>{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && <div style={sectionBodyStyle}>{children}</div>}
    </div>
  );
}

// ─── Styles ──────────────────────────────────

const shellStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  padding: "32px 48px",
  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
  boxSizing: "border-box",
};

const containerStyle: React.CSSProperties = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: 20,
};

const headerStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "16px 0",
  position: "relative",
};

const closeButtonStyle: React.CSSProperties = {
  position: "absolute",
  top: 12,
  right: 0,
  width: 36,
  height: 36,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.04)",
  color: "#a1a1aa",
  fontSize: 16,
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "2rem",
  fontWeight: 800,
  color: "#f7f8fa",
  letterSpacing: "-0.03em",
  fontStyle: "italic",
};

const subtitleStyle: React.CSSProperties = {
  margin: "4px 0 0",
  color: "#71717a",
  fontSize: 14,
};

const scoreBarStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: 32,
  fontSize: 18,
  fontWeight: 700,
  padding: "14px 24px",
  background: "rgba(255,255,255,0.03)",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.06)",
};

const sectionStyle: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.02)",
  overflow: "hidden",
};

const sectionHeaderStyle: React.CSSProperties = {
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 20px",
  background: "none",
  border: "none",
  color: "#f7f8fa",
  cursor: "pointer",
  fontSize: 15,
  fontWeight: 600,
  textAlign: "left",
};

const sectionTitleStyle: React.CSSProperties = {
  display: "block",
};

const sectionSubtitleStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "#71717a",
  marginTop: 2,
};

const chevronStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#52525b",
};

const sectionBodyStyle: React.CSSProperties = {
  padding: "0 20px 20px",
};

const teamsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 24,
};

const teamCardStyle: React.CSSProperties = {
  padding: 24,
  borderRadius: 24,
  border: "1px solid",
  background: "rgba(0,0,0,0.3)",
  display: "flex",
  flexDirection: "column",
  gap: 20,
};

const teamTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontWeight: 700,
  textAlign: "center",
};

const avatarGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 8,
};

const avatarButtonStyle: React.CSSProperties = {
  width: "100%",
  aspectRatio: "1 / 1",
  display: "grid",
  placeItems: "center",
  fontSize: 42,
  borderRadius: 18,
  border: "2px solid",
  cursor: "pointer",
  transition: "all 0.2s ease",
  outline: "none",
};

const nameInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.04)",
  color: "#f7f8fa",
  fontSize: 14,
  textAlign: "center",
  outline: "none",
  boxSizing: "border-box",
};

const categoryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
};

const categoryCardStyle: React.CSSProperties = {
  padding: "16px 20px",
  borderRadius: 12,
  border: "1px solid",
  cursor: "pointer",
  textAlign: "left",
  color: "#f7f8fa",
  fontSize: 14,
  background: "rgba(255,255,255,0.03)",
  display: "grid",
  gap: 4,
};

const categoryDescStyle: React.CSSProperties = {
  margin: 0,
  color: "#71717a",
  fontSize: 12,
};

const settingRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(140px, auto) 1fr",
  gap: 16,
  marginBottom: 16,
  alignItems: "center",
};

const settingLabelStyle: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: 13,
};

const selectorRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, 1fr)",
  gap: 8,
};

const selectorButtonStyle: React.CSSProperties = {
  width: "100%",
  height: 48,
  borderRadius: 10,
  border: "1px solid",
  background: "transparent",
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
};

const historyRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 12px",
  borderRadius: 8,
  background: "rgba(255,255,255,0.03)",
  fontSize: 13,
};

const actionsStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
  paddingTop: 8,
};

const startButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "16px 0",
  borderRadius: 14,
  border: "none",
  background: "linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)",
  color: "#fff",
  fontSize: 18,
  fontWeight: 700,
  cursor: "pointer",
  letterSpacing: "0.02em",
  boxShadow: "0 8px 30px rgba(231, 76, 60, 0.2)",
};

const modeSettingsBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "16px",
  borderRadius: 14,
  border: "none",
  background: "#E74C3C",
  color: "#fff",
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
  transition: "all 0.2s ease",
  marginTop: 8,
};

const modeSummaryBoxStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 12,
  marginBottom: 8,
};

const summaryItemStyle: React.CSSProperties = {
  padding: "16px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const summaryLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  color: "#71717a",
  letterSpacing: "0.05em",
};

const summaryValueStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#e4e4e7",
};

const pairingTileStyle: React.CSSProperties = {
  padding: "20px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const pairingDescStyle: React.CSSProperties = {
  margin: "4px 0 0",
  fontSize: 12,
  color: "#52525b",
  lineHeight: 1.5,
};

const addDevicesBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 16px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "#e4e4e7",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  transition: "all 0.2s ease",
};

const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.85)",
  backdropFilter: "blur(12px)",
  display: "grid",
  placeItems: "center",
  zIndex: 1000,
  padding: 24,
};

const modalPanelStyle: React.CSSProperties = {
  width: "min(100%, 1000px)",
  height: "min(100%, 680px)",
  background: "#0a0a0a",
  borderRadius: 30,
  border: "1px solid rgba(255,255,255,0.1)",
  boxShadow: "0 40px 100px rgba(0,0,0,0.8)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const modalTitlebarStyle: React.CSSProperties = {
  padding: "32px 40px 16px",
  textAlign: "center",
};

const modalTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 24,
  fontWeight: 800,
  color: "#E74C3C", // Red accent for Tajniacy
  letterSpacing: "-0.02em",
  textTransform: "uppercase",
};

const modalLayoutStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  overflow: "hidden",
};

const modalSidebarStyle: React.CSSProperties = {
  width: 260,
  padding: "20px 0",
  background: "rgba(255,255,255,0.02)",
  borderRight: "1px solid rgba(255,255,255,0.06)",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const modalNavButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "16px 32px",
  background: "transparent",
  border: "none",
  color: "#a1a1aa",
  fontSize: 15,
  fontWeight: 600,
  textAlign: "left",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 12,
  transition: "all 0.2s ease",
};

const activeModalNavButtonStyle: React.CSSProperties = {
  background: "rgba(231, 76, 60, 0.1)",
  color: "#fff",
  borderLeft: "4px solid #E74C3C",
  paddingLeft: 28,
};

const modalContentAreaStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const modalContentHeaderStyle: React.CSSProperties = {
  padding: "24px 40px",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  fontSize: 18,
  fontWeight: 700,
  color: "#fff",
};

const modalContentBodyStyle: React.CSSProperties = {
  flex: 1,
  padding: "32px 40px",
  overflowY: "auto",
};

const modalActionsStyle: React.CSSProperties = {
  padding: "24px 40px",
  background: "rgba(255,255,255,0.02)",
  borderTop: "1px solid rgba(255,255,255,0.06)",
  display: "flex",
  justifyContent: "flex-end",
  gap: 16,
};

const modalPrimaryButtonStyle: React.CSSProperties = {
  padding: "12px 32px",
  borderRadius: 12,
  border: "none",
  background: "#E74C3C",
  color: "#fff",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const modalSecondaryButtonStyle: React.CSSProperties = {
  padding: "12px 32px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.05)",
  color: "#a1a1aa",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  transition: "all 0.2s ease",
};

// ─── Avatar Picker Styles ────────────────────

const avatarModalPanelStyle: React.CSSProperties = {
  width: "min(100%, 500px)",
  maxHeight: "85vh",
  background: "#121214",
  borderRadius: 24,
  padding: "32px",
  display: "flex",
  flexDirection: "column",
  gap: 24,
  boxShadow: "0 40px 100px rgba(0,0,0,0.8)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const avatarModalTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 28,
  fontWeight: 800,
  color: "#fff",
  textAlign: "center",
};

const avatarCategoryTabsStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  padding: "4px",
  background: "transparent",
};

const avatarCategoryTabButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: "10px 0",
  borderRadius: 8,
  border: "1px solid transparent",
  background: "#27272a",
  color: "#fff",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

const activeAvatarCategoryTabButtonStyle: React.CSSProperties = {
  background: "transparent",
  color: "#fff",
  border: "1px solid #E74C3C",
};

const avatarModalGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(6, 1fr)",
  gap: 8,
  overflowY: "auto",
  paddingRight: 4,
  maxHeight: 380,
};

const avatarModalItemStyle: React.CSSProperties = {
  aspectRatio: "1 / 1",
  display: "grid",
  placeItems: "center",
  fontSize: 30,
  borderRadius: 10,
  border: "none",
  background: "#27272a",
  cursor: "pointer",
  transition: "all 0.1s ease",
};

const avatarModalItemSelectedStyle: React.CSSProperties = {
  background: "#3f3f46",
  boxShadow: "inset 0 0 0 2px #E74C3C",
};

const avatarModalActionsStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1.5fr",
  gap: 16,
};

const avatarModalPrimaryButtonStyle: React.CSSProperties = {
  padding: "16px",
  borderRadius: 12,
  border: "none",
  background: "#E74C3C",
  color: "#fff",
  fontSize: 18,
  fontWeight: 800,
  cursor: "pointer",
};

const avatarModalSecondaryButtonStyle: React.CSSProperties = {
  padding: "16px",
  borderRadius: 12,
  border: "none",
  background: "#27272a",
  color: "#fff",
  fontSize: 18,
  fontWeight: 800,
  cursor: "pointer",
};

const poolStatusStyle: React.CSSProperties = {
  marginTop: 12,
  padding: "14px 16px",
  borderRadius: 10,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const poolBarTrackStyle: React.CSSProperties = {
  height: 4,
  borderRadius: 2,
  background: "rgba(255,255,255,0.08)",
  overflow: "hidden",
  marginBottom: 12,
};

const poolBarFillStyle: React.CSSProperties = {
  height: "100%",
  borderRadius: 2,
  transition: "width 0.3s ease",
};

const resetPoolButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 16px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.04)",
  color: "#a1a1aa",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

