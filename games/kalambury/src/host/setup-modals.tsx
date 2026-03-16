import type { CSSProperties, Dispatch, ReactNode, SetStateAction } from "react";
import {
  type KalamburyAvatarCategory,
  type KalamburyModeSection,
  type KalamburyModeSettings,
  type KalamburyPlayerAvatarOption,
  type KalamburyPlayerDraft,
  type KalamburyPlayerGender,
  kalamburyAvatarOptions,
} from "../shared/setup-content";
import {
  modeSections,
  phraseChangeCountOptions,
  roundCountOptions,
  roundDurationOptions,
} from "../shared/setup-ui";

type IconProps = {
  size?: number;
  strokeWidth?: number;
  className?: string;
};

function buildAbsoluteUrl(path: string) {
  if (typeof window === "undefined") {
    return path;
  }

  return new URL(path, window.location.origin).toString();
}

function buildQrImageUrl(path: string) {
  const absoluteUrl = buildAbsoluteUrl(path);
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=16&data=${encodeURIComponent(absoluteUrl)}`;
}

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

function Venus({ size = 18, strokeWidth = 2.2, className }: IconProps) {
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
        d="M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
      <path
        d="M12 14v7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
      <path
        d="M9 18h6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </svg>
  );
}

function Mars({ size = 18, strokeWidth = 2.2, className }: IconProps) {
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
        d="M10 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
      <path
        d="M14 10 21 3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
      <path
        d="M16 3h5v5"
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
type KalamburyAddPlayerModalProps = {
  isOpen: boolean;
  title?: string;
  saveLabel?: string;
  playerDraft: KalamburyPlayerDraft;
  setPlayerDraft: Dispatch<SetStateAction<KalamburyPlayerDraft>>;
  selectedAvatar: KalamburyPlayerAvatarOption | null;
  canSavePlayerDraft: boolean;
  onClose: () => void;
  onSave: () => void;
};
export function KalamburyAddPlayerModal({
  isOpen,
  title = "Dodaj gracza",
  saveLabel = "Gotowe",
  playerDraft,
  setPlayerDraft,
  selectedAvatar,
  canSavePlayerDraft,
  onClose,
  onSave,
}: KalamburyAddPlayerModalProps) {
  if (!isOpen) {
    return null;
  }

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
        aria-labelledby="kalambury-add-player-title"
        style={avatarModalPanelStyle}
        onKeyDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="kalambury-add-player-title" style={avatarModalTitleStyle}>
          {title}
        </h2>

        <div style={playerPreviewLayoutStyle}>
          <div style={playerPreviewPanelStyle}>
            <p style={playerPreviewLabelStyle}>Wybrany avatar</p>
            <div style={playerPreviewAvatarStyle} aria-hidden="true">
              {selectedAvatar?.emoji ?? "?"}
            </div>
            <p style={playerPreviewHintStyle}>
              {selectedAvatar?.label ??
                "Najpierw wybierz avatar po prawej stronie."}
            </p>

            <label style={playerPreviewFieldStyle}>
              <span style={playerPreviewFieldLabelStyle}>Nazwa gracza</span>
              <input
                className={
                  playerDraft.gender === "female"
                    ? "kalambury-player-name-input kalambury-player-name-input--female"
                    : playerDraft.gender === "male"
                      ? "kalambury-player-name-input kalambury-player-name-input--male"
                      : "kalambury-player-name-input"
                }
                style={{
                  ...playerNameInputStyle,
                  ...(playerDraft.gender === "female"
                    ? playerNameInputFemaleStyle
                    : playerDraft.gender === "male"
                      ? playerNameInputMaleStyle
                      : {}),
                }}
                type="text"
                value={playerDraft.name}
                placeholder="Nazwa gracza (min. 3 znaki)"
                onChange={(event) =>
                  setPlayerDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </label>

            <div style={genderPanelStyle}>
              <span style={playerPreviewFieldLabelStyle}>Plec</span>
              <div style={genderOptionsStyle}>
                {[
                  {
                    id: "female" as KalamburyPlayerGender,
                    label: "Kobieta",
                    icon: Venus,
                    iconClassName:
                      "kalambury-gender-chip__icon kalambury-gender-chip__icon--female",
                  },
                  {
                    id: "male" as KalamburyPlayerGender,
                    label: "Mezczyzna",
                    icon: Mars,
                    iconClassName:
                      "kalambury-gender-chip__icon kalambury-gender-chip__icon--male",
                  },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    aria-label={option.label}
                    style={{
                      ...genderChipStyle,
                      ...(playerDraft.gender === option.id
                        ? genderChipActiveStyle
                        : {}),
                    }}
                    onClick={() =>
                      setPlayerDraft((current) => ({
                        ...current,
                        gender: option.id,
                      }))
                    }
                  >
                    <option.icon
                      aria-hidden="true"
                      className={option.iconClassName}
                      strokeWidth={2.2}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={avatarPickerPanelStyle}>
            <div style={avatarCategoryTabsStyle}>
              {(
                Object.keys(kalamburyAvatarOptions) as KalamburyAvatarCategory[]
              ).map((category) => (
                <button
                  key={category}
                  type="button"
                  style={{
                    ...avatarCategoryTabButtonStyle,
                    ...(playerDraft.avatarCategory === category
                      ? activeAvatarCategoryTabButtonStyle
                      : {}),
                  }}
                  onClick={() =>
                    setPlayerDraft((current) => ({
                      ...current,
                      avatarCategory: category,
                      avatarId:
                        current.avatarCategory === category
                          ? current.avatarId
                          : null,
                    }))
                  }
                >
                  {category === "ludzie"
                    ? "Ludzie"
                    : category === "zwierzeta"
                      ? "Zwierzeta"
                      : "Inne"}
                </button>
              ))}
            </div>

            <div style={avatarModalGridStyle}>
              {kalamburyAvatarOptions[playerDraft.avatarCategory].map(
                (avatar) => (
                  <button
                    key={avatar.id}
                    type="button"
                    aria-label={avatar.label}
                    style={{
                      ...avatarModalItemStyle,
                      ...(playerDraft.avatarId === avatar.id
                        ? avatarModalItemSelectedStyle
                        : {}),
                    }}
                    onClick={() =>
                      setPlayerDraft((current) => ({
                        ...current,
                        avatarId: avatar.id,
                      }))
                    }
                  >
                    <span aria-hidden="true">{avatar.emoji}</span>
                  </button>
                ),
              )}
            </div>
          </div>
        </div>

        <div style={avatarModalActionsStyle}>
          <button
            type="button"
            style={avatarModalSecondaryButtonStyle}
            onClick={onClose}
          >
            Anuluj
          </button>
          <button
            type="button"
            style={avatarModalPrimaryButtonStyle}
            disabled={!canSavePlayerDraft}
            onClick={onSave}
          >
            {saveLabel}
          </button>
        </div>
      </dialog>
    </div>
  );
}

type KalamburyPresenterQrModalProps = {
  isOpen: boolean;
  sessionCode?: string;
  controllerHref?: string;
  onClose: () => void;
  onDisconnect?: () => void;
  connected?: boolean;
  dismissible?: boolean;
};

export function KalamburyPresenterQrModal({
  isOpen,
  sessionCode,
  controllerHref,
  onClose,
  onDisconnect,
  connected = false,
  dismissible = true,
}: KalamburyPresenterQrModalProps) {
  if (!isOpen || !sessionCode || !controllerHref) {
    return null;
  }

  const controllerUrl = buildAbsoluteUrl(controllerHref);
  const qrImageUrl = buildQrImageUrl(controllerHref);

  return (
    <div
      style={modalOverlayStyle}
      role="presentation"
      onKeyDown={(event) => {
        if (dismissible && event.key === "Escape") {
          onClose();
        }
      }}
      onClick={dismissible ? onClose : undefined}
    >
      <dialog
        open
        aria-labelledby="kal-pairing-modal-title"
        style={modalPanelStyle}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={modalHeaderStyle}>
          <h2 id="kal-pairing-modal-title" style={modalTitleStyle}>
            Podłącz urządzenie
          </h2>
          {dismissible && (
            <button
              type="button"
              aria-label="Zamknij"
              onClick={onClose}
              style={modalCloseBtnStyle}
            >
              ×
            </button>
          )}
        </div>

        <div style={modalBodyStyle}>
          <div style={modalQrBoxStyle}>
            <img
              src={qrImageUrl}
              alt={`QR do sesji ${sessionCode}`}
              style={modalQrImgStyle}
            />
          </div>
          <div style={modalInfoStyle}>
            <p style={modalEyebrowStyle}>Tryb: Prezenter</p>
            <strong style={modalSessionStyle}>Sesja: {sessionCode}</strong>
            <p style={modalHintStyle}>
              Zeskanuj telefonem prezentera, aby otworzyć prywatny widok hasła i
              sterowanie tylko dla tej osoby.
            </p>
            <div style={modalPresenceStyle}>
              <span
                style={{
                  ...modalPresenceChipStyle,
                  ...(connected ? modalPresenceChipActiveStyle : {}),
                }}
              >
                {connected ? "●" : "○"} Prezenter
              </span>
            </div>
          </div>
        </div>

        <div style={sessionCodeBoxStyle}>
          <span style={sessionCodeLabelStyle}>Kod sesji:</span>
          <strong style={sessionCodeValueStyle}>{sessionCode}</strong>
        </div>

        <div style={modalActionsStyle}>
          <button
            type="button"
            style={modalOpenLinkButtonStyle}
            onClick={() =>
              window.open(controllerUrl, "_blank", "noopener,noreferrer")
            }
          >
            Symuluj skan
          </button>
          {dismissible ? (
            <button
              type="button"
              style={modalCloseActionStyle}
              onClick={onClose}
            >
              Zamknij
            </button>
          ) : (
            <button
              type="button"
              style={{
                ...modalCloseActionStyle,
                opacity: 0.4,
                cursor: "not-allowed",
              }}
              disabled
            >
              Czekam...
            </button>
          )}
        </div>

        {onDisconnect ? (
          <div style={modalEmergencyRowStyle}>
            <button
              type="button"
              style={modalDisconnectButtonStyle}
              onClick={() => {
                onDisconnect();
                onClose();
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16 }}
              >
                link_off
              </span>
              Rozłącz urządzenie
            </button>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}

const modalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  backdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  zIndex: 1000,
};

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

const avatarModalPanelStyle: CSSProperties = {
  width: "min(100%, 960px)",
  maxHeight: "85vh",
  background: "#121214",
  borderRadius: 24,
  padding: 32,
  display: "flex",
  flexDirection: "column",
  gap: 24,
  boxShadow: "0 40px 100px rgba(0,0,0,0.8)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const avatarModalTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 28,
  fontWeight: 800,
  color: "#fff",
  textAlign: "center",
};

const playerPreviewLayoutStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "320px minmax(0, 1fr)",
  gap: 24,
  alignItems: "start",
};

const playerPreviewPanelStyle: CSSProperties = {
  display: "grid",
  gap: 18,
  alignContent: "start",
};

const playerPreviewLabelStyle: CSSProperties = {
  margin: 0,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "#71717a",
};

const playerPreviewAvatarStyle: CSSProperties = {
  width: 88,
  height: 88,
  borderRadius: 24,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "grid",
  placeItems: "center",
  fontSize: 44,
  margin: "0 auto",
};

const playerPreviewHintStyle: CSSProperties = {
  margin: 0,
  color: "#71717a",
  fontSize: 13,
  textAlign: "center",
  lineHeight: 1.5,
};

const playerPreviewFieldStyle: CSSProperties = {
  display: "grid",
  gap: 8,
};

const playerPreviewFieldLabelStyle: CSSProperties = {
  color: "#a1a1aa",
  fontSize: 13,
  fontWeight: 600,
};

const playerNameInputStyle: CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.04)",
  color: "#f7f8fa",
  fontSize: 16,
  fontWeight: 700,
  textAlign: "center",
  outline: "none",
  boxSizing: "border-box",
};

const playerNameInputFemaleStyle: CSSProperties = {
  borderColor: "rgba(233,30,99,0.4)",
};

const playerNameInputMaleStyle: CSSProperties = {
  borderColor: "rgba(56,189,248,0.4)",
};

const genderPanelStyle: CSSProperties = {
  display: "grid",
  gap: 10,
};

const genderOptionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
};

const genderChipStyle: CSSProperties = {
  minHeight: 52,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.04)",
  color: "#e4e4e7",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};

const genderChipActiveStyle: CSSProperties = {
  borderColor: "rgba(233,30,99,0.4)",
  background: "rgba(233,30,99,0.12)",
};

const avatarPickerPanelStyle: CSSProperties = {
  display: "grid",
  gap: 16,
  alignContent: "start",
  minWidth: 0,
};

const avatarCategoryTabsStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  padding: 4,
  background: "transparent",
};

const avatarCategoryTabButtonStyle: CSSProperties = {
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

const activeAvatarCategoryTabButtonStyle: CSSProperties = {
  background: "transparent",
  color: "#fff",
  border: "1px solid #e91e63",
};

const avatarModalGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
  gap: 10,
  overflowY: "auto",
  paddingRight: 4,
  maxHeight: 420,
};

const avatarModalItemStyle: CSSProperties = {
  aspectRatio: "1 / 1",
  display: "grid",
  placeItems: "center",
  fontSize: 30,
  borderRadius: 10,
  border: "none",
  background: "#27272a",
  cursor: "pointer",
  color: "#fff",
};

const avatarModalItemSelectedStyle: CSSProperties = {
  background: "#3f3f46",
  boxShadow: "inset 0 0 0 2px #e91e63",
};

const avatarModalActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1.5fr",
  gap: 16,
};

const avatarModalPrimaryButtonStyle: CSSProperties = {
  padding: 16,
  borderRadius: 12,
  border: "none",
  background: "#e91e63",
  color: "#fff",
  fontSize: 18,
  fontWeight: 800,
  cursor: "pointer",
};

const avatarModalSecondaryButtonStyle: CSSProperties = {
  padding: 16,
  borderRadius: 12,
  border: "none",
  background: "#27272a",
  color: "#fff",
  fontSize: 18,
  fontWeight: 800,
  cursor: "pointer",
};

const modalPanelStyle: CSSProperties = {
  width: "min(560px, 94vw)",
  background: "#141416",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 20,
  padding: 0,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  gap: 0,
};

const modalHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "22px 24px 18px",
  borderBottom: "1px solid rgba(255,255,255,0.07)",
};

const modalTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 700,
  color: "#f7f8fa",
};

const modalCloseBtnStyle: CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  color: "#a1a1aa",
  fontSize: 14,
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
};

const modalBodyStyle: CSSProperties = {
  display: "flex",
  gap: 20,
  padding: "20px 24px",
  alignItems: "flex-start",
};

const modalQrBoxStyle: CSSProperties = {
  flexShrink: 0,
  width: 160,
  height: 160,
  borderRadius: 14,
  background: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const modalQrImgStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const modalInfoStyle: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const modalEyebrowStyle: CSSProperties = {
  margin: 0,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#ff5bbd",
};

const modalSessionStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  color: "#f7f8fa",
};

const modalHintStyle: CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: "#71717a",
  lineHeight: 1.5,
};

const modalPresenceStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  marginTop: 4,
};

const modalPresenceChipStyle: CSSProperties = {
  fontSize: 11,
  color: "#a1a1aa",
  padding: "3px 0",
};

const modalPresenceChipActiveStyle: CSSProperties = {
  color: "#4ade80",
};

const sessionCodeBoxStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "12px 24px",
  margin: "0 24px",
  borderRadius: 10,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.07)",
};

const sessionCodeLabelStyle: CSSProperties = {
  fontSize: 12,
  color: "#71717a",
};

const sessionCodeValueStyle: CSSProperties = {
  fontSize: 22,
  letterSpacing: "0.15em",
  color: "#f7f8fa",
  fontVariantNumeric: "tabular-nums",
};

const modalActionsStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  padding: "16px 24px 8px",
};

const modalOpenLinkButtonStyle: CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "11px 16px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  color: "#f7f8fa",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const modalCloseActionStyle: CSSProperties = {
  flex: 1,
  padding: "11px 16px",
  borderRadius: 10,
  border: "1px solid rgba(255,91,189,0.4)",
  background: "rgba(255,91,189,0.2)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const modalEmergencyRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  padding: "8px 24px 20px",
};

const modalDisconnectButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "none",
  border: "none",
  color: "#71717a",
  fontSize: 12,
  cursor: "pointer",
  padding: "6px 8px",
  borderRadius: 6,
  transition: "color 0.15s",
};
