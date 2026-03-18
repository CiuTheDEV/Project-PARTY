// games/kalambury/src/host/modals/PresenterQrModal.tsx
import type { CSSProperties } from "react";

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

type KalamburyTransportMode = "do-ws" | "firebase" | "broadcast";

const transportModeLabel: Record<KalamburyTransportMode, string> = {
  "do-ws": "DO + WS",
  firebase: "Firebase",
  broadcast: "Broadcast Channel",
};

type KalamburyPresenterQrModalProps = {
  isOpen: boolean;
  sessionCode?: string;
  controllerHref?: string;
  transportMode?: KalamburyTransportMode;
  onClose: () => void;
  onDisconnect?: () => void;
  connected?: boolean;
  dismissible?: boolean;
};

export function KalamburyPresenterQrModal({
  isOpen,
  sessionCode,
  controllerHref,
  transportMode,
  onClose,
  onDisconnect,
  connected = false,
  dismissible = true,
}: KalamburyPresenterQrModalProps) {
  if (!isOpen || !sessionCode) {
    return null;
  }

  const isBroadcast = transportMode === "broadcast" || !controllerHref;
  const controllerUrl = controllerHref ? buildAbsoluteUrl(controllerHref) : null;
  const qrImageUrl = controllerHref ? buildQrImageUrl(controllerHref) : null;
  const modeLabel = transportMode ? transportModeLabel[transportMode] : null;

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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 id="kal-pairing-modal-title" style={modalTitleStyle}>
              Podłącz urządzenie
            </h2>
            {modeLabel ? (
              <span style={modalHeaderModeBadgeStyle}>
                <span className="material-symbols-outlined" style={{ fontSize: 12, verticalAlign: "middle" }}>
                  {transportMode === "broadcast" ? "broadcast_on_home" : transportMode === "firebase" ? "local_fire_department" : "cloud"}
                </span>
                {" "}{modeLabel}
              </span>
            ) : null}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {!isBroadcast && dismissible && (
              <button
                type="button"
                aria-label="Symuluj skan"
                title="Symuluj skan"
                onClick={() => {
                  if (controllerUrl) window.open(controllerUrl, "_blank", "noopener,noreferrer");
                }}
                style={modalCloseBtnStyle}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
              </button>
            )}
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
        </div>

        <div style={modalBodyStyle}>
          {!isBroadcast && qrImageUrl ? (
            <div style={modalQrBoxStyle}>
              <img
                src={qrImageUrl}
                alt={`QR do sesji ${sessionCode}`}
                style={modalQrImgStyle}
              />
            </div>
          ) : (
            <div style={{ ...modalQrBoxStyle, background: "rgba(255,255,255,0.04)", flexDirection: "column", gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: "#71717a" }}>
                broadcast_on_home
              </span>
              <span style={{ fontSize: 10, color: "#52525b", textAlign: "center", padding: "0 8px" }}>
                Broadcast Channel — tylko ta przeglądarka
              </span>
            </div>
          )}
          <div style={modalInfoStyle}>
            <p style={modalEyebrowStyle}>Tryb: Prezenter</p>
            {modeLabel ? (
              <p style={modalTransportBadgeStyle}>
                <span className="material-symbols-outlined" style={{ fontSize: 13, verticalAlign: "middle" }}>
                  {transportMode === "broadcast" ? "broadcast_on_home" : transportMode === "firebase" ? "local_fire_department" : "cloud"}
                </span>
                {" "}{modeLabel}
              </p>
            ) : null}
            <strong style={modalSessionStyle}>Sesja: {sessionCode}</strong>
            <p style={modalHintStyle}>
              {isBroadcast
                ? "Tryb Broadcast działa tylko w tej samej przeglądarce. Kliknij poniżej, aby otworzyć widok prezentera w nowej karcie."
                : "Zeskanuj telefonem prezentera, aby otworzyć prywatny widok hasła i sterowanie tylko dla tej osoby."}
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
          {isBroadcast && (
            <button
              type="button"
              style={modalOpenLinkButtonStyle}
              onClick={() => {
                const url = buildAbsoluteUrl(`/games/kalambury/controller/${sessionCode}?transport=broadcast`);
                window.open(url, "_blank", "noopener,noreferrer");
              }}
            >
              Otwórz widok prezentera
            </button>
          )}
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

const modalTransportBadgeStyle: CSSProperties = {
  margin: 0,
  fontSize: 11,
  fontWeight: 600,
  color: "#a1a1aa",
  display: "flex",
  alignItems: "center",
  gap: 4,
};

const modalHeaderModeBadgeStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#a1a1aa",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 6,
  padding: "2px 7px",
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  whiteSpace: "nowrap",
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
