// games/kalambury/src/host/modals/ModeSettingsModal.tsx
import type { CSSProperties, ReactNode } from "react";
import {
  type KalamburyModeSection,
  type KalamburyModeSettings,
} from "../../shared/setup-content";
import {
  modeSections,
  phraseChangeCountOptions,
  roundCountOptions,
  roundDurationOptions,
} from "../../shared/setup-ui";

type IconProps = {
  size?: number;
  strokeWidth?: number;
  className?: string;
};

function InfinityIcon({ size = 16, strokeWidth = 2.2, className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path
        d="M18 8a4 4 0 0 0-3.3 1.7L12 13l-2.7-3.3A4 4 0 1 0 6 16c1.3 0 2.5-.6 3.3-1.7L12 11l2.7 3.3A4 4 0 1 0 18 8Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </svg>
  );
}

function getModeSectionIcon(sectionId: KalamburyModeSection) {
  switch (sectionId) {
    case "rounds":
      return "sports_esports";
    case "hints":
      return "lightbulb";
    case "phraseChange":
      return "autorenew";
    case "events":
      return "bolt";
    default:
      return "tune";
  }
}

type ToggleRowProps = {
  label: string;
  description?: string;
  active: boolean;
  onClick: () => void;
};

function ToggleRow({ label, description, active, onClick }: ToggleRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ ...toggleRowStyle, ...(active ? toggleRowActiveStyle : {}) }}
    >
      <span style={toggleCopyStyle}>
        <strong style={toggleLabelStyle}>{label}</strong>
        {description ? (
          <small style={toggleDescriptionStyle}>{description}</small>
        ) : null}
      </span>
      <span
        aria-hidden="true"
        style={{
          ...toggleSwitchStyle,
          ...(active ? toggleSwitchActiveStyle : {}),
        }}
      >
        <span style={toggleSwitchTextStyle}>
          {active ? "WLACZONE" : "WYLACZONE"}
        </span>
        <span
          style={{
            ...toggleThumbStyle,
            ...(active ? toggleThumbActiveStyle : {}),
          }}
        />
      </span>
    </button>
  );
}

type UpdateModeDraft = (
  updater: (current: KalamburyModeSettings) => KalamburyModeSettings,
) => void;

type ModeSliderOption = number | "infinite";

type ModeSliderCardProps = {
  label: string;
  valueContent: ReactNode;
  options: readonly ModeSliderOption[];
  selectedValue: ModeSliderOption;
  renderOption?: (option: ModeSliderOption) => ReactNode;
  onSelect: (option: ModeSliderOption) => void;
};

function ModeSliderCard({
  label,
  valueContent,
  options,
  selectedValue,
  renderOption = (option) => String(option),
  onSelect,
}: ModeSliderCardProps) {
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option === selectedValue),
  );

  return (
    <section style={settingsCardStyle}>
      <div style={settingsCardHeaderStyle}>
        <span style={settingsCardLabelStyle}>{label}</span>
        <strong style={settingsCardValueStyle}>{valueContent}</strong>
      </div>
      <div style={sliderControlStyle}>
        <input
          style={sliderInputStyle}
          type="range"
          min={0}
          max={Math.max(options.length - 1, 0)}
          step={1}
          value={selectedIndex}
          aria-label={label}
          onChange={(event) => {
            const nextIndex = Number(event.target.value);
            const nextOption = options[nextIndex];

            if (nextOption !== undefined) {
              onSelect(nextOption);
            }
          }}
        />
        <div
          aria-hidden="true"
          style={{
            ...sliderLabelsStyle,
            gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
          }}
        >
          {options.map((option, index) => {
            const optionLabel = renderOption(option);
            const active = index === selectedIndex;

            return (
              <span
                key={String(option)}
                style={{
                  ...sliderLabelStyle,
                  ...(active ? sliderLabelActiveStyle : {}),
                }}
              >
                {optionLabel}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}

type KalamburyModeSettingsModalProps = {
  isOpen: boolean;
  activeModeSection: KalamburyModeSection;
  onActiveModeSectionChange: (section: KalamburyModeSection) => void;
  modeSettingsDraft: KalamburyModeSettings;
  updateModeDraft: UpdateModeDraft;
  onClose: () => void;
  onSave: () => void;
};

export function KalamburyModeSettingsModal({
  isOpen,
  activeModeSection,
  onActiveModeSectionChange,
  modeSettingsDraft,
  updateModeDraft,
  onClose,
  onSave,
}: KalamburyModeSettingsModalProps) {
  if (!isOpen) {
    return null;
  }

  const activeSectionMeta =
    modeSections.find((section) => section.id === activeModeSection) ??
    modeSections[0];
  const resolvedActiveModeSection = activeSectionMeta?.disabled
    ? "rounds"
    : activeModeSection;
  const resolvedSectionMeta =
    modeSections.find((section) => section.id === resolvedActiveModeSection) ??
    modeSections[0];

  return (
    <div
      style={modalOverlayShellStyle}
      role="presentation"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onClose();
        }
      }}
      onClick={onClose}
    >
      <dialog
        open
        aria-labelledby="kalambury-mode-settings-title"
        style={tajniacyModalPanelStyle}
        onKeyDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={tajniacyModalTitlebarStyle}>
          <h2
            id="kalambury-mode-settings-title"
            style={tajniacyModalTitleStyle}
          >
            Ustawienia trybu
          </h2>
        </div>

        <div style={tajniacyModalLayoutStyle}>
          <nav
            style={tajniacyModalSidebarStyle}
            aria-label="Sekcje ustawien trybu"
          >
            {modeSections.map((section) => (
              <button
                key={section.id}
                type="button"
                style={{
                  ...tajniacyModalNavButtonStyle,
                  ...(resolvedActiveModeSection === section.id
                    ? tajniacyActiveModalNavButtonStyle
                    : {}),
                  ...(section.disabled
                    ? tajniacyDisabledModalNavButtonStyle
                    : {}),
                }}
                disabled={Boolean(section.disabled)}
                aria-disabled={section.disabled ? "true" : undefined}
                onClick={() => {
                  if (!section.disabled) {
                    onActiveModeSectionChange(section.id);
                  }
                }}
              >
                <span style={navLabelRowStyle}>
                  <span
                    className="material-symbols-outlined"
                    style={navIconStyle}
                  >
                    {getModeSectionIcon(section.id)}
                  </span>
                  <span>{section.label}</span>
                </span>
                {section.badge ? (
                  <span style={navBadgeStyle}>{section.badge}</span>
                ) : null}
              </button>
            ))}
          </nav>

          <div style={tajniacyModalContentAreaStyle}>
            <header style={tajniacyModalContentHeaderStyle}>
              <strong>{resolvedSectionMeta?.label}</strong>
            </header>

            <div style={tajniacyModalContentBodyStyle}>
              {resolvedActiveModeSection === "rounds" ? (
                <div style={settingsStackStyle}>
                  <ModeSliderCard
                    label="Czas tury"
                    valueContent={`${modeSettingsDraft.rounds.turnDurationSeconds}s`}
                    options={roundDurationOptions}
                    selectedValue={modeSettingsDraft.rounds.turnDurationSeconds}
                    renderOption={(option) => String(option)}
                    onSelect={(option) =>
                      updateModeDraft((current) => ({
                        ...current,
                        rounds: {
                          ...current.rounds,
                          turnDurationSeconds: Number(option),
                          winCondition: "rounds",
                        },
                      }))
                    }
                  />

                  <section style={settingsCardStyle}>
                    <div style={settingsLocklineStyle}>
                      <span style={settingsCardLabelStyle}>
                        Warunek zwyciestwa
                      </span>
                      <strong style={settingsCardValueStyle}>Rundy</strong>
                    </div>
                    <p style={settingsHintStyle}>
                      Na tym etapie konczymy gre po ustalonej liczbie rund.
                    </p>
                  </section>

                  <ModeSliderCard
                    label="Liczba rund"
                    valueContent={String(modeSettingsDraft.rounds.roundCount)}
                    options={roundCountOptions}
                    selectedValue={modeSettingsDraft.rounds.roundCount}
                    renderOption={(option) => String(option)}
                    onSelect={(option) =>
                      updateModeDraft((current) => ({
                        ...current,
                        rounds: {
                          ...current.rounds,
                          winCondition: "rounds",
                          roundCount: Number(option),
                        },
                      }))
                    }
                  />
                </div>
              ) : null}

              {resolvedActiveModeSection === "hints" ? (
                <div style={settingsStackStyle}>
                  <section style={settingsCardStyle}>
                    <ToggleRow
                      label="Podpowiedzi"
                      active={modeSettingsDraft.hints.enabled}
                      onClick={() =>
                        updateModeDraft((current) => ({
                          ...current,
                          hints: {
                            ...current.hints,
                            enabled: !current.hints.enabled,
                          },
                        }))
                      }
                    />
                  </section>
                  <section style={settingsCardStyle}>
                    <ToggleRow
                      label="Liczba slow"
                      active={modeSettingsDraft.hints.showWordCount}
                      onClick={() =>
                        updateModeDraft((current) => ({
                          ...current,
                          hints: {
                            ...current.hints,
                            showWordCount: !current.hints.showWordCount,
                          },
                        }))
                      }
                    />
                  </section>
                  <section style={settingsCardStyle}>
                    <ToggleRow
                      label="Kategoria"
                      active={modeSettingsDraft.hints.showCategory}
                      onClick={() =>
                        updateModeDraft((current) => ({
                          ...current,
                          hints: {
                            ...current.hints,
                            showCategory: !current.hints.showCategory,
                          },
                        }))
                      }
                    />
                  </section>
                </div>
              ) : null}

              {resolvedActiveModeSection === "phraseChange" ? (
                <div style={settingsStackStyle}>
                  <section style={settingsCardStyle}>
                    <ToggleRow
                      label="Zmiana hasla"
                      active={modeSettingsDraft.phraseChange.enabled}
                      onClick={() =>
                        updateModeDraft((current) => ({
                          ...current,
                          phraseChange: {
                            ...current.phraseChange,
                            enabled: !current.phraseChange.enabled,
                          },
                        }))
                      }
                    />
                  </section>

                  <ModeSliderCard
                    label="Ilosc zmian hasla (na gracza)"
                    valueContent={
                      modeSettingsDraft.phraseChange.changesPerPlayer ===
                      "infinite" ? (
                        <InfinityIcon
                          aria-hidden="true"
                          size={18}
                          strokeWidth={2.2}
                        />
                      ) : (
                        String(modeSettingsDraft.phraseChange.changesPerPlayer)
                      )
                    }
                    options={phraseChangeCountOptions}
                    selectedValue={
                      modeSettingsDraft.phraseChange.changesPerPlayer
                    }
                    renderOption={(option) =>
                      option === "infinite" ? (
                        <InfinityIcon
                          aria-hidden="true"
                          size={16}
                          strokeWidth={2.2}
                        />
                      ) : (
                        String(option)
                      )
                    }
                    onSelect={(option) =>
                      updateModeDraft((current) => ({
                        ...current,
                        phraseChange: {
                          ...current.phraseChange,
                          changesPerPlayer: option,
                        },
                      }))
                    }
                  />

                  <section style={settingsCardStyle}>
                    <div className="kalambury-settings-card__header">
                      <span style={settingsCardLabelStyle}>Reroluj</span>
                    </div>
                    <div style={settingsStackStyle}>
                      <ToggleRow
                        label="Tylko haslo"
                        active={modeSettingsDraft.phraseChange.rerollWordOnly}
                        onClick={() =>
                          updateModeDraft((current) => ({
                            ...current,
                            phraseChange: {
                              ...current.phraseChange,
                              rerollWordOnly:
                                !current.phraseChange.rerollWordOnly,
                            },
                          }))
                        }
                      />
                      <ToggleRow
                        label="Haslo + kategoria"
                        active={
                          modeSettingsDraft.phraseChange.rerollWordAndCategory
                        }
                        onClick={() =>
                          updateModeDraft((current) => ({
                            ...current,
                            phraseChange: {
                              ...current.phraseChange,
                              rerollWordAndCategory:
                                !current.phraseChange.rerollWordAndCategory,
                            },
                          }))
                        }
                      />
                    </div>
                  </section>

                  <section style={settingsCardStyle}>
                    <ToggleRow
                      label="Anti-streak kategorii (max 3 z rzedu)"
                      active={modeSettingsDraft.phraseChange.antiCategoryStreak}
                      onClick={() =>
                        updateModeDraft((current) => ({
                          ...current,
                          phraseChange: {
                            ...current.phraseChange,
                            antiCategoryStreak:
                              !current.phraseChange.antiCategoryStreak,
                          },
                        }))
                      }
                    />
                  </section>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div style={tajniacyModalActionsStyle}>
          <button
            type="button"
            style={tajniacyModalSecondaryButtonStyle}
            onClick={onClose}
          >
            Anuluj
          </button>
          <button
            type="button"
            style={tajniacyModalPrimaryButtonStyle}
            onClick={onSave}
          >
            Zastosuj
          </button>
        </div>
      </dialog>
    </div>
  );
}

const modalOverlayShellStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.85)",
  backdropFilter: "blur(12px)",
  display: "grid",
  placeItems: "center",
  zIndex: 1000,
  padding: 24,
};

const tajniacyModalPanelStyle: CSSProperties = {
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

const tajniacyModalTitlebarStyle: CSSProperties = {
  padding: "32px 40px 16px",
  textAlign: "center",
};

const tajniacyModalTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 24,
  fontWeight: 800,
  color: "#e91e63",
  letterSpacing: "-0.02em",
  textTransform: "uppercase",
};

const tajniacyModalLayoutStyle: CSSProperties = {
  flex: 1,
  display: "flex",
  overflow: "hidden",
};

const tajniacyModalSidebarStyle: CSSProperties = {
  width: 260,
  padding: "20px 0",
  background: "rgba(255,255,255,0.02)",
  borderRight: "1px solid rgba(255,255,255,0.06)",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const tajniacyModalNavButtonStyle: CSSProperties = {
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
  justifyContent: "space-between",
  gap: 12,
};

const tajniacyActiveModalNavButtonStyle: CSSProperties = {
  background: "rgba(233,30,99,0.12)",
  color: "#fff",
  borderLeft: "4px solid #e91e63",
  paddingLeft: 28,
};

const tajniacyDisabledModalNavButtonStyle: CSSProperties = {
  opacity: 0.45,
  cursor: "not-allowed",
};

const navBadgeStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: "0.05em",
  color: "#71717a",
  textTransform: "uppercase",
};

const navLabelRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const navIconStyle: CSSProperties = {
  fontSize: 20,
  lineHeight: 1,
};

const tajniacyModalContentAreaStyle: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const tajniacyModalContentHeaderStyle: CSSProperties = {
  padding: "24px 40px",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  fontSize: 18,
  fontWeight: 700,
  color: "#fff",
};

const tajniacyModalContentBodyStyle: CSSProperties = {
  flex: 1,
  padding: "32px 40px",
  overflowY: "auto",
};

const tajniacyModalActionsStyle: CSSProperties = {
  padding: "24px 40px",
  background: "rgba(255,255,255,0.02)",
  borderTop: "1px solid rgba(255,255,255,0.06)",
  display: "flex",
  justifyContent: "flex-end",
  gap: 16,
};

const tajniacyModalPrimaryButtonStyle: CSSProperties = {
  padding: "12px 32px",
  borderRadius: 12,
  border: "none",
  background: "#e91e63",
  color: "#fff",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
};

const tajniacyModalSecondaryButtonStyle: CSSProperties = {
  padding: "12px 32px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.05)",
  color: "#a1a1aa",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
};

const settingsStackStyle: CSSProperties = {
  display: "grid",
  gap: 24,
};

const settingsCardStyle: CSSProperties = {
  padding: 20,
  borderRadius: 14,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  display: "grid",
  gap: 16,
};

const settingsCardHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
};

const settingsCardLabelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.05em",
  color: "#71717a",
  textTransform: "uppercase",
};

const settingsCardValueStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  color: "#f7f8fa",
};

const settingsLocklineStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
};

const settingsHintStyle: CSSProperties = {
  margin: 0,
  fontSize: 14,
  lineHeight: 1.6,
  color: "#71717a",
};

const sliderControlStyle: CSSProperties = {
  display: "grid",
  gap: 10,
};

const sliderInputStyle: CSSProperties = {
  width: "100%",
  accentColor: "#e91e63",
};

const sliderLabelsStyle: CSSProperties = {
  display: "grid",
  gap: 8,
};

const sliderLabelStyle: CSSProperties = {
  display: "grid",
  placeItems: "center",
  minHeight: 36,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.02)",
  color: "#71717a",
  fontSize: 12,
  fontWeight: 700,
};

const sliderLabelActiveStyle: CSSProperties = {
  borderColor: "rgba(233,30,99,0.5)",
  background: "rgba(233,30,99,0.16)",
  color: "#fff",
};

const toggleRowStyle: CSSProperties = {
  width: "100%",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 14,
  background: "rgba(255,255,255,0.02)",
  padding: "16px 18px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  cursor: "pointer",
};

const toggleRowActiveStyle: CSSProperties = {
  borderColor: "rgba(233,30,99,0.45)",
  background: "rgba(233,30,99,0.08)",
};

const toggleCopyStyle: CSSProperties = {
  display: "grid",
  gap: 4,
  textAlign: "left",
};

const toggleLabelStyle: CSSProperties = {
  color: "#f7f8fa",
  fontSize: 15,
  fontWeight: 700,
};

const toggleDescriptionStyle: CSSProperties = {
  color: "#71717a",
  fontSize: 12,
  lineHeight: 1.5,
};

const toggleSwitchStyle: CSSProperties = {
  minWidth: 132,
  padding: "6px 8px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const toggleSwitchActiveStyle: CSSProperties = {
  background: "rgba(233,30,99,0.14)",
  borderColor: "rgba(233,30,99,0.35)",
};

const toggleSwitchTextStyle: CSSProperties = {
  color: "#e4e4e7",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: "0.05em",
};

const toggleThumbStyle: CSSProperties = {
  width: 18,
  height: 18,
  borderRadius: "50%",
  background: "#52525b",
};

const toggleThumbActiveStyle: CSSProperties = {
  background: "#e91e63",
};
