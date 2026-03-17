// games/kalambury/src/host/sections/SetupFooter.tsx
import type { CSSProperties } from "react";

type KalamburySetupFooterProps = {
  canStart: boolean;
  startLabel: string;
  onStart: () => void;
};

export function KalamburySetupFooter({
  canStart,
  startLabel,
  onStart,
}: KalamburySetupFooterProps) {
  return (
    <div style={actionsStyle}>
      <button
        type="button"
        style={{
          ...startButtonStyle,
          opacity: canStart ? 1 : 0.4,
          cursor: canStart ? "pointer" : "not-allowed",
        }}
        disabled={!canStart}
        onClick={onStart}
      >
        {startLabel}
      </button>
    </div>
  );
}

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
