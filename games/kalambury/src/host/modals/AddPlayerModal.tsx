// games/kalambury/src/host/modals/AddPlayerModal.tsx
import type { CSSProperties, Dispatch, SetStateAction } from "react";
import {
  type KalamburyAvatarCategory,
  type KalamburyPlayerAvatarOption,
  type KalamburyPlayerDraft,
  type KalamburyPlayerGender,
  kalamburyAvatarOptions,
} from "../../shared/setup-content";

type IconProps = {
  size?: number;
  strokeWidth?: number;
  className?: string;
};

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

