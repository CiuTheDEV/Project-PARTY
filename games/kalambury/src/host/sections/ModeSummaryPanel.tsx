// games/kalambury/src/host/sections/ModeSummaryPanel.tsx
import type { CSSProperties } from "react";

import type { KalamburySetupSummary } from "../../shared/setup-content";

type KalamburyModeSummaryPanelProps = {
  summaries: KalamburySetupSummary[];
  onOpenSettings: () => void;
};

export function KalamburyModeSummaryPanel({
  summaries,
  onOpenSettings,
}: KalamburyModeSummaryPanelProps) {
  return (
    <>
      <button
        type="button"
        style={modeSettingsButtonStyle}
        onClick={onOpenSettings}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
          settings
        </span>
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
