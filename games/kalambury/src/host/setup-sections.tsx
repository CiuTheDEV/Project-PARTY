import type { CSSProperties } from "react";
import type {
  KalamburyCategoryDifficulty,
  KalamburyCategoryOption,
  KalamburySetupPlayer,
  KalamburySetupSummary,
} from "../shared/setup-content";

type IconProps = {
  size?: number;
  strokeWidth?: number;
};

function Pencil({ size = 16, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <path d="M12 20h9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} />
    </svg>
  );
}

function X({ size = 16, strokeWidth = 2.2 }: IconProps) {
  return (
    <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <path d="m18 6-12 12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} />
      <path d="m6 6 12 12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} />
    </svg>
  );
}

function UserRoundCog({ size = 18, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <path d="M10 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} />
      <path d="M3 20a7 7 0 0 1 10.6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} />
      <path d="M18.5 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} />
      <path d="m18.5 14.5.5 1 .9.2-.7.8.1 1 .8.5-.8.5-.1 1 .7.8-.9.2-.5 1-.5-1-.9-.2.7-.8-.1-1-.8-.5.8-.5.1-1-.7-.8.9-.2Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} />
    </svg>
  );
}

function Dice({ size = 18, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth={strokeWidth} />
      <circle cx="9" cy="9" r="1.2" fill="currentColor" />
      <circle cx="15" cy="9" r="1.2" fill="currentColor" />
      <circle cx="9" cy="15" r="1.2" fill="currentColor" />
      <circle cx="15" cy="15" r="1.2" fill="currentColor" />
    </svg>
  );
}

type KalamburyPlayersPanelProps = {
  description: string;
  players: KalamburySetupPlayer[];
  minPlayers: number;
  maxPlayers: number;
  activePlayerActionsId: string | null;
  onTogglePlayerActions: (playerId: string) => void;
  onEditPlayer: (playerId: string) => void;
  onRemovePlayer: (playerId: string) => void;
  onAddPlayer: () => void;
  onAddRandomPlayer: () => void;
};

export function KalamburyPlayersPanel({
  description,
  players,
  minPlayers,
  maxPlayers,
  activePlayerActionsId,
  onTogglePlayerActions,
  onEditPlayer,
  onRemovePlayer,
  onAddPlayer,
  onAddRandomPlayer,
}: KalamburyPlayersPanelProps) {
  return (
    <div style={playersSectionStyle}>
      <div style={playersHeaderStyle}>
        <div>
          <div style={sectionTitleStyle}>Gracze</div>
          <p style={sectionDescriptionStyle}>{description}</p>
        </div>
        <span style={countBadgeStyle}>
          {players.length}/{maxPlayers}
        </span>
      </div>

      <div style={playersGridStyle}>
        {players.map((player) => {
          const actionsOpen = activePlayerActionsId === player.id;
          const canRemove = players.length > minPlayers;

          return (
            <article
              key={player.id}
              className={
                actionsOpen
                  ? "kalambury-persona-card kalambury-persona-card--setup kalambury-player-card kalambury-player-card--menu-open"
                  : "kalambury-persona-card kalambury-persona-card--setup kalambury-player-card"
              }
              data-gender={player.gender}
              tabIndex={actionsOpen ? 0 : undefined}
              onClick={actionsOpen ? () => onTogglePlayerActions(player.id) : undefined}
              onKeyDown={
                actionsOpen
                  ? (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onTogglePlayerActions(player.id);
                      }
                    }
                  : undefined
              }
            >
              <div className="kalambury-player-card__top">
                <div className="kalambury-player-card__avatar-wrap">
                  <div className="kalambury-persona-card__avatar kalambury-player-card__avatar" aria-hidden="true">
                    {player.avatar}
                  </div>
                </div>
                <div className="kalambury-player-card__action-rail">
                  {actionsOpen ? (
                    <div
                      className="kalambury-player-card__action-menu"
                      onKeyDown={(event) => event.stopPropagation()}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        className="kalambury-player-card__action-button"
                        type="button"
                        aria-label={`Edytuj ${player.name}`}
                        onClick={() => onEditPlayer(player.id)}
                      >
                        <Pencil />
                      </button>
                      <button
                        className="kalambury-player-card__action-button kalambury-player-card__action-button--danger"
                        type="button"
                        aria-label={`Usun ${player.name}`}
                        disabled={!canRemove}
                        onClick={() => onRemovePlayer(player.id)}
                      >
                        <X />
                      </button>
                    </div>
                  ) : (
                    <button
                      className="kalambury-player-card__actions-toggle"
                      type="button"
                      aria-label={`Akcje gracza ${player.name}`}
                      aria-expanded="false"
                      onClick={() => onTogglePlayerActions(player.id)}
                    >
                      <UserRoundCog />
                    </button>
                  )}
                </div>
              </div>
              <p className="kalambury-persona-card__nameplate kalambury-player-card__name">{player.name}</p>
            </article>
          );
        })}

        {players.length < maxPlayers ? (
          <article className="kalambury-player-card kalambury-player-card--add">
            <button className="kalambury-player-card__add-primary" type="button" aria-label="Dodaj gracza" onClick={onAddPlayer}>
              <span className="kalambury-player-card__plus" aria-hidden="true">+</span>
              <span>Dodaj</span>
            </button>
            <button className="kalambury-player-card__dice" type="button" aria-label="Dodaj losowego gracza" onClick={onAddRandomPlayer}>
              <Dice />
            </button>
          </article>
        ) : null}
      </div>
    </div>
  );
}

type KalamburyModeSummaryPanelProps = {
  summaries: KalamburySetupSummary[];
  onOpenSettings: () => void;
};

export function KalamburyModeSummaryPanel({ summaries, onOpenSettings }: KalamburyModeSummaryPanelProps) {
  return (
    <>
      <button type="button" style={modeSettingsButtonStyle} onClick={onOpenSettings}>
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>settings</span>
        Ustawienia trybu
      </button>

      <div style={summaryGridStyle}>
        {summaries.map((summary) => (
          <article key={summary.id} style={summaryCardStyle}>
            <span style={summaryLabelStyle}>{summary.label}</span>
            <strong style={summaryValueStyle}>{summary.value}</strong>
          </article>
        ))}
      </div>
    </>
  );
}

type KalamburyPresenterDevicePanelProps = {
  presenterDeviceConnected: boolean;
  presenterDeviceBlockingStart: boolean;
  onOpenPresenterQr: () => void;
  onDisconnectPresenterDevice: () => void;
};

export function KalamburyPresenterDevicePanel({
  presenterDeviceConnected,
  presenterDeviceBlockingStart,
  onOpenPresenterQr,
  onDisconnectPresenterDevice,
}: KalamburyPresenterDevicePanelProps) {
  const statusLabel = presenterDeviceConnected ? "Polaczono" : "Niepolaczono";
  const statusColor = presenterDeviceConnected ? "#4ade80" : "#52525b";
  const statusBackground = presenterDeviceConnected ? "rgba(74,222,128,0.12)" : "rgba(82,82,91,0.15)";
  const helperText = presenterDeviceBlockingStart
    ? "Podlacz telefon prezentera, aby rozpoczac runde."
    : "Podlacz telefon prezentera. Po zeskanowaniu kodu urzadzenie pokaze prywatne haslo i kontrolki tylko dla tej osoby.";

  return (
    <div style={pairingTileStyle}>
      <div style={pairingHeaderStyle}>
        <div>
          <span style={summaryLabelStyle}>DODATKOWE URZADZENIE</span>
          <p style={pairingDescriptionStyle}>{helperText}</p>
        </div>
        <span style={{ ...pairingStatusStyle, color: statusColor, background: statusBackground }}>{statusLabel}</span>
      </div>

      <button
        type="button"
        style={pairingButtonStyle}
        onClick={presenterDeviceConnected ? onDisconnectPresenterDevice : onOpenPresenterQr}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
          {presenterDeviceConnected ? "link_off" : "add_link"}
        </span>
        {presenterDeviceConnected ? "Rozlacz urzadzenie" : "Dodaj urzadzenie"}
      </button>
    </div>
  );
}

type KalamburyCategoriesPanelProps = {
  isExpanded: boolean;
  selectedCategoriesCount: number;
  categories: KalamburyCategoryOption[];
  activeCategory: KalamburyCategoryOption | undefined;
  onToggleExpanded: () => void;
  onToggleCategory: (categoryId: string) => void;
  onToggleDifficulty: (categoryId: string, difficulty: KalamburyCategoryDifficulty) => void;
  onSelectAll: () => void;
  onRandomize: () => void;
  onClear: () => void;
};

export function KalamburyCategoriesPanel({
  isExpanded,
  selectedCategoriesCount,
  categories,
  activeCategory,
  onToggleExpanded,
  onToggleCategory,
  onToggleDifficulty,
  onSelectAll,
  onRandomize,
  onClear,
}: KalamburyCategoriesPanelProps) {
  return (
    <div style={sectionStyle}>
      <button type="button" style={accordionHeaderStyle} onClick={onToggleExpanded}>
        <div>
          <span style={sectionTitleStyle}>Kategorie</span>
          <span style={sectionSubtitleStyle}>Wybrane: {selectedCategoriesCount}</span>
        </div>
        <span style={chevronStyle}>{isExpanded ? "▲" : "+"}</span>
      </button>

      {isExpanded ? (
        <div style={accordionBodyStyle}>
          <div className="kalambury-categories-grid">
            {categories.map((category) => {
              const isOpened = activeCategory?.id === category.id;
              const chipClassName = category.isSelected
                ? "kalambury-category-chip kalambury-category-chip--selected"
                : isOpened
                  ? "kalambury-category-chip kalambury-category-chip--opened"
                  : "kalambury-category-chip";

              return (
                <div className="kalambury-category-stack" key={category.id}>
                  <button className={chipClassName} type="button" aria-pressed={category.isSelected} onClick={() => onToggleCategory(category.id)}>
                    {category.label}
                  </button>
                  {category.isSelected || isOpened ? (
                    <div className="kalambury-category-inline-options">
                      <button
                        className={
                          category.easyEnabled
                            ? "kalambury-category-tag kalambury-category-difficulty kalambury-category-difficulty--active"
                            : "kalambury-category-tag kalambury-category-difficulty kalambury-category-difficulty--disabled"
                        }
                        type="button"
                        aria-pressed={category.easyEnabled}
                        onClick={() => onToggleDifficulty(category.id, "easy")}
                      >
                        Latwe {category.easyCount}
                      </button>
                      <button
                        className={
                          category.hardEnabled
                            ? "kalambury-category-tag kalambury-category-difficulty kalambury-category-difficulty--active"
                            : "kalambury-category-tag kalambury-category-difficulty kalambury-category-difficulty--disabled"
                        }
                        type="button"
                        aria-pressed={category.hardEnabled}
                        onClick={() => onToggleDifficulty(category.id, "hard")}
                      >
                        Trudne {category.hardCount}
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {selectedCategoriesCount === 0 ? (
            <p className="kalambury-setup__empty-state">
              Kliknij kategorie, aby pokazac chipy Latwe / Trudne i wybrac pule gry.
            </p>
          ) : null}

          <div className="kalambury-category-actions">
            <button className="kalambury-secondary-action" type="button" onClick={onSelectAll}>Wszystkie</button>
            <button className="kalambury-secondary-action" type="button" onClick={onRandomize}>Losowo</button>
            <button className="kalambury-secondary-action" type="button" onClick={onClear}>Wyczysc</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type KalamburySetupFooterProps = {
  canStart: boolean;
  startLabel: string;
  onStart: () => void;
};

export function KalamburySetupFooter({ canStart, startLabel, onStart }: KalamburySetupFooterProps) {
  return (
    <div style={actionsStyle}>
      <button
        type="button"
        style={{ ...startButtonStyle, opacity: canStart ? 1 : 0.4, cursor: canStart ? "pointer" : "not-allowed" }}
        disabled={!canStart}
        onClick={onStart}
      >
        {startLabel}
      </button>
    </div>
  );
}

const sectionStyle: CSSProperties = {
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.02)",
  overflow: "hidden",
};

const playersSectionStyle: CSSProperties = {
  ...sectionStyle,
  padding: "24px 32px",
  background: "rgba(255,255,255,0.03)",
};

const playersHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 20,
};

const sectionTitleStyle: CSSProperties = {
  display: "block",
  margin: 0,
  fontSize: 18,
  fontWeight: 700,
  color: "#f7f8fa",
};

const sectionDescriptionStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "#71717a",
  fontSize: 14,
  lineHeight: 1.45,
};

const countBadgeStyle: CSSProperties = {
  flexShrink: 0,
  padding: "7px 12px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.04)",
  color: "#e4e4e7",
  fontSize: 14,
  fontWeight: 700,
};

const playersGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 16,
};

const modeSettingsButtonStyle: CSSProperties = {
  width: "100%",
  padding: "16px",
  borderRadius: 14,
  border: "none",
  background: "linear-gradient(180deg, #d81b60 0%, #e91e63 100%)",
  color: "#fff",
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
  marginTop: 8,
  boxShadow: "0 8px 30px rgba(216,27,96,0.24)",
};

const summaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 12,
  marginBottom: 8,
};

const summaryCardStyle: CSSProperties = {
  padding: 16,
  borderRadius: 14,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const summaryLabelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  color: "#71717a",
  letterSpacing: "0.05em",
};

const summaryValueStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#e4e4e7",
};

const pairingTileStyle: CSSProperties = {
  padding: 20,
  borderRadius: 14,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const pairingHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
};

const pairingDescriptionStyle: CSSProperties = {
  margin: "4px 0 0",
  fontSize: 12,
  color: "#71717a",
  lineHeight: 1.5,
  maxWidth: 640,
};

const pairingStatusStyle: CSSProperties = {
  flexShrink: 0,
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: "0.05em",
  padding: "3px 10px",
  borderRadius: 99,
  whiteSpace: "nowrap",
};

const pairingButtonStyle: CSSProperties = {
  width: "100%",
  padding: "11px 16px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  color: "#e4e4e7",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

const accordionHeaderStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 20px",
  background: "none",
  border: "none",
  color: "#f7f8fa",
  cursor: "pointer",
  textAlign: "left",
};

const sectionSubtitleStyle: CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "#71717a",
  marginTop: 2,
};

const chevronStyle: CSSProperties = {
  fontSize: 11,
  color: "#52525b",
};

const accordionBodyStyle: CSSProperties = {
  padding: "0 20px 20px",
};

const actionsStyle: CSSProperties = {
  display: "grid",
  gap: 12,
  paddingTop: 8,
};

const startButtonStyle: CSSProperties = {
  width: "100%",
  padding: "16px 0",
  borderRadius: 14,
  border: "none",
  background: "linear-gradient(180deg, #d81b60 0%, #e91e63 100%)",
  color: "#fff",
  fontSize: 18,
  fontWeight: 700,
  letterSpacing: "0.02em",
  boxShadow: "0 8px 30px rgba(216,27,96,0.2)",
};
