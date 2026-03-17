// games/kalambury/src/host/sections/PresenterDevicePanel.tsx
import type { CSSProperties } from "react";

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
  const statusBackground = presenterDeviceConnected
    ? "rgba(74,222,128,0.12)"
    : "rgba(82,82,91,0.15)";
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
        <span
          style={{
            ...pairingStatusStyle,
            color: statusColor,
            background: statusBackground,
          }}
        >
          {statusLabel}
        </span>
      </div>

      <button
        type="button"
        style={pairingButtonStyle}
        onClick={
          presenterDeviceConnected
            ? onDisconnectPresenterDevice
            : onOpenPresenterQr
        }
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
          {presenterDeviceConnected ? "link_off" : "add_link"}
        </span>
        {presenterDeviceConnected ? "Rozlacz urzadzenie" : "Podlacz urzadzenie"}
      </button>
    </div>
  );
}

const summaryLabelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  color: "#71717a",
  letterSpacing: "0.05em",
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
