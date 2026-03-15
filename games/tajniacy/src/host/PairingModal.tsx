import { useState } from "react";
import type { TajniacyPresence } from "../shared/bridge.ts";

type PairingModalProps = {
  isOpen: boolean;
  sessionCode?: string;
  presence: TajniacyPresence;
  isPauseMode?: boolean; // true = opened due to captain disconnect during game
  onClose: () => void;
  onDisconnectAll: () => void;
};

type PairingTab = "captains" | "player";

function buildQrUrl(path: string) {
  if (typeof window === "undefined") return "";
  const abs = new URL(path, window.location.origin).toString();
  return `https://api.qrserver.com/v1/create-qr-code/?size=256x256&margin=12&data=${encodeURIComponent(abs)}`;
}

export function TajniacyPairingModal({
  isOpen,
  sessionCode,
  presence,
  isPauseMode = false,
  onClose,
  onDisconnectAll,
}: PairingModalProps) {
  const [activeTab, setActiveTab] = useState<PairingTab>("captains");

  if (!isOpen || !sessionCode) return null;

  const bothCaptainsBack = presence.captainRed && presence.captainBlue;
  const canClose = isPauseMode ? bothCaptainsBack : true;

  const captainPath = `/games/tajniacy/controller/${sessionCode}`;
  const playerPath = `/games/tajniacy/controller/${sessionCode}?preset=player`;

  const captainQrUrl = buildQrUrl(captainPath);
  const playerQrUrl = buildQrUrl(playerPath);
  const captainFullUrl = typeof window !== "undefined"
    ? new URL(captainPath, window.location.origin).toString()
    : captainPath;
  const playerFullUrl = typeof window !== "undefined"
    ? new URL(playerPath, window.location.origin).toString()
    : playerPath;

  const currentPath = activeTab === "captains" ? captainPath : playerPath;
  const currentQrUrl = activeTab === "captains" ? captainQrUrl : playerQrUrl;
  const currentFullUrl = activeTab === "captains" ? captainFullUrl : playerFullUrl;

  return (
    <div style={overlayStyle} role="presentation" onClick={canClose ? onClose : undefined}>
      <dialog
        open
        aria-labelledby="taj-pairing-modal-title"
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={headerStyle}>
          <h2 id="taj-pairing-modal-title" style={titleStyle}>
            {isPauseMode ? "⚠️ Kapitan rozłączony" : "Podłącz urządzenia"}
          </h2>
          {canClose && (
            <button type="button" style={closeBtnStyle} aria-label="Zamknij" onClick={onClose}>✕</button>
          )}
        </div>

        {/* Pause warning banner */}
        {isPauseMode && (
          <div style={pauseBannerStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, flexShrink: 0 }}>pause_circle</span>
            Gra jest wstrzymana. Ponowne połączenie kapitana jest wymagane do wznowienia.
          </div>
        )}

        {/* Tabs */}
        <div style={tabBarStyle}>
          <button
            type="button"
            style={{ ...tabBtnStyle, ...(activeTab === "captains" ? tabActiveBtnStyle : {}) }}
            onClick={() => setActiveTab("captains")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>military_tech</span>
            QR Kapitanów
          </button>
          <button
            type="button"
            style={{ ...tabBtnStyle, ...(activeTab === "player" ? tabActiveBtnStyle : {}) }}
            onClick={() => setActiveTab("player")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>monitor</span>
            QR Gracza
          </button>
        </div>

        {/* QR Code */}
        <div style={qrAreaStyle}>
          <div style={qrBoxStyle}>
            <img
              style={qrImgStyle}
              src={currentQrUrl}
              alt={`QR do sesji ${sessionCode}`}
            />
          </div>

          <div style={qrInfoStyle}>
            <p style={qrEyebrowStyle}>
              {activeTab === "captains" ? "Tryb: Kapitan" : "Tryb: Widok Gracza"}
            </p>
            <strong style={qrSessionStyle}>Sesja: {sessionCode}</strong>
            <p style={qrHintStyle}>
              {activeTab === "captains"
                ? "Zeskanuj telefonem kapitana — zobaczy mapę szpiegów i wyśle wskazówkę."
                : "Zeskanuj telefonem lub TV — widok tylko do odczytu planszy."}
            </p>

            {/* Presence indicator */}
            {activeTab === "captains" && (
              <div style={presenceChipsStyle}>
                <span style={{ ...presenceChipStyle, ...(presence.captainRed ? presenceChipActiveStyle : {}) }}>
                  {presence.captainRed ? "🟢" : "⚪"} Kapitan Czerwony
                </span>
                <span style={{ ...presenceChipStyle, ...(presence.captainBlue ? presenceChipActiveStyle : {}) }}>
                  {presence.captainBlue ? "🟢" : "⚪"} Kapitan Niebieski
                </span>
              </div>
            )}
            {activeTab === "player" && (
              <div style={presenceChipsStyle}>
                <span style={{ ...presenceChipStyle, ...(presence.playerView ? presenceChipActiveStyle : {}) }}>
                  {presence.playerView ? "🟢" : "⚪"} Widok Graczy
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Session code */}
        <div style={sessionCodeBoxStyle}>
          <span style={sessionCodeLabelStyle}>Kod sesji:</span>
          <strong style={sessionCodeValueStyle}>{sessionCode}</strong>
        </div>

        {/* Actions */}
        <div style={actionsStyle}>
          <button
            type="button"
            style={openLinkBtnStyle}
            onClick={() => window.open(currentFullUrl, "_blank", "noopener,noreferrer")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>open_in_new</span>
            Otwórz link
          </button>
          {canClose ? (
            <button type="button" style={closeBtnActionStyle} onClick={onClose}>
              Zamknij
            </button>
          ) : (
            <button
              type="button"
              style={{ ...closeBtnActionStyle, opacity: 0.4, cursor: "not-allowed" }}
              disabled
            >
              Czekam...
            </button>
          )}
        </div>

        {/* Emergency disconnect */}
        <div style={emergencyRowStyle}>
          <button
            type="button"
            style={disconnectBtnStyle}
            onClick={() => {
              onDisconnectAll();
              onClose();
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>link_off</span>
            Rozłącz wszystkie urządzenia
          </button>
        </div>
      </dialog>
    </div>
  );
}

// ─── Styles ───────────────────────────────────

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  backdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const panelStyle: React.CSSProperties = {
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

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "22px 24px 18px",
  borderBottom: "1px solid rgba(255,255,255,0.07)",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 700,
  color: "#f7f8fa",
};

const closeBtnStyle: React.CSSProperties = {
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

const tabBarStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  padding: "16px 24px 12px",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};

const tabBtnStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "10px 16px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
  color: "#71717a",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.15s",
};

const tabActiveBtnStyle: React.CSSProperties = {
  background: "rgba(231, 76, 60, 0.15)",
  borderColor: "rgba(231, 76, 60, 0.4)",
  color: "#f87171",
};

const qrAreaStyle: React.CSSProperties = {
  display: "flex",
  gap: 20,
  padding: "20px 24px",
  alignItems: "flex-start",
};

const qrBoxStyle: React.CSSProperties = {
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

const qrImgStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const qrInfoStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const qrEyebrowStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  color: "#E74C3C",
  textTransform: "uppercase",
};

const qrSessionStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  color: "#f7f8fa",
};

const qrHintStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: "#71717a",
  lineHeight: 1.5,
};

const presenceChipsStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  marginTop: 4,
};

const presenceChipStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#a1a1aa",
  padding: "3px 0",
};

const presenceChipActiveStyle: React.CSSProperties = {
  color: "#4ade80",
};

const sessionCodeBoxStyle: React.CSSProperties = {
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

const sessionCodeLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#71717a",
};

const sessionCodeValueStyle: React.CSSProperties = {
  fontSize: 22,
  letterSpacing: "0.15em",
  color: "#f7f8fa",
  fontVariantNumeric: "tabular-nums",
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  padding: "16px 24px 8px",
};

const openLinkBtnStyle: React.CSSProperties = {
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

const closeBtnActionStyle: React.CSSProperties = {
  flex: 1,
  padding: "11px 16px",
  borderRadius: 10,
  border: "1px solid rgba(231, 76, 60, 0.4)",
  background: "rgba(231, 76, 60, 0.2)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const emergencyRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  padding: "8px 24px 20px",
};

const disconnectBtnStyle: React.CSSProperties = {
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

const pauseBannerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 20px",
  background: "rgba(251, 191, 36, 0.1)",
  borderBottom: "1px solid rgba(251, 191, 36, 0.2)",
  color: "#fbbf24",
  fontSize: 12,
  fontWeight: 600,
  lineHeight: 1.4,
};
