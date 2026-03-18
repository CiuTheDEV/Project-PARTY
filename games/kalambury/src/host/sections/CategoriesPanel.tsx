// games/kalambury/src/host/sections/CategoriesPanel.tsx
import { useState, useCallback, useEffect, useRef, type CSSProperties } from "react";

import type {
  KalamburyCategoryDifficulty,
  KalamburyCategoryOption,
} from "../../shared/setup-content";
import {
  getAvailableCount,
  getTotalCount,
  resetAllUsedPhrasesForCategory,
  resetUsedPhrases,
} from "../../shared/phrase-pool";

type KalamburyCategoriesPanelProps = {
  isExpanded: boolean;
  selectedCategoriesCount: number;
  categories: KalamburyCategoryOption[];
  activeCategory: KalamburyCategoryOption | undefined;
  onToggleExpanded: () => void;
  onToggleCategory: (categoryId: string) => void;
  onToggleDifficulty: (
    categoryId: string,
    difficulty: KalamburyCategoryDifficulty,
  ) => void;
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
  const [resetTick, setResetTick] = useState(0);
  const [poolModalCategoryId, setPoolModalCategoryId] = useState<string | null>(null);

  const handleResetAll = useCallback((categoryId: string) => {
    resetAllUsedPhrasesForCategory(categoryId);
    setResetTick((n) => n + 1);
  }, []);

  const handleResetDifficulty = useCallback((categoryId: string, difficulty: "easy" | "hard") => {
    resetUsedPhrases(categoryId, difficulty);
    setResetTick((n) => n + 1);
  }, []);

  const poolModalCategory = poolModalCategoryId
    ? categories.find((c) => c.id === poolModalCategoryId) ?? null
    : null;

  return (
    <div style={sectionStyle}>
      <button
        type="button"
        style={accordionHeaderStyle}
        onClick={onToggleExpanded}
      >
        <div>
          <span style={sectionTitleStyle}>Kategorie</span>
          <span style={sectionSubtitleStyle}>
            Wybrane: {selectedCategoriesCount}
          </span>
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

              const easyAvail = getAvailableCount(category.id, "easy");
              const hardAvail = getAvailableCount(category.id, "hard");
              const easyTotal = getTotalCount(category.id, "easy");
              const hardTotal = getTotalCount(category.id, "hard");

              return (
                <div className="kalambury-category-stack" key={category.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <button
                      className={chipClassName}
                      type="button"
                      aria-pressed={category.isSelected}
                      style={{ flex: 1 }}
                      onClick={() => onToggleCategory(category.id)}
                    >
                      {category.label}
                    </button>
                    {category.isSelected ? (
                      <button
                        type="button"
                        style={poolIconBtnStyle}
                        title="Pula haseł"
                        onClick={() => setPoolModalCategoryId(category.id)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>bar_chart</span>
                      </button>
                    ) : null}
                  </div>
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
                        Łatwe{" "}
                        {category.easyEnabled
                          ? <span style={diffCountStyle(_resetTick, easyAvail, easyTotal)}>{easyAvail}/{easyTotal}</span>
                          : <span style={{ opacity: 0.5 }}>{easyTotal}</span>
                        }
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
                        Trudne{" "}
                        {category.hardEnabled
                          ? <span style={diffCountStyle(_resetTick, hardAvail, hardTotal)}>{hardAvail}/{hardTotal}</span>
                          : <span style={{ opacity: 0.5 }}>{hardTotal}</span>
                        }
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {selectedCategoriesCount === 0 ? (
            <p className="kalambury-setup__empty-state">
              Kliknij kategorie, aby pokazac chipy Latwe / Trudne i wybrac pule
              gry.
            </p>
          ) : null}

          <div className="kalambury-category-actions">
            <button
              className="kalambury-secondary-action"
              type="button"
              onClick={onSelectAll}
            >
              Wszystkie
            </button>
            <button
              className="kalambury-secondary-action"
              type="button"
              onClick={onRandomize}
            >
              Losowo
            </button>
            <button
              className="kalambury-secondary-action"
              type="button"
              onClick={onClear}
            >
              Wyczysc
            </button>
          </div>
        </div>
      ) : null}

      {poolModalCategory ? (
        <PoolModal
          category={poolModalCategory}
          resetTick={resetTick}
          onResetAll={() => handleResetAll(poolModalCategory.id)}
          onResetDifficulty={(d) => handleResetDifficulty(poolModalCategory.id, d)}
          onClose={() => setPoolModalCategoryId(null)}
        />
      ) : null}
    </div>
  );
}

// Helper — kolor licznika zależny od wypełnienia
function diffCountStyle(_tick: number, avail: number, total: number): CSSProperties {
  if (total === 0) return { opacity: 0.5 };
  const pct = avail / total;
  const color = pct === 0 ? "#ef4444" : pct < 0.25 ? "#f59e0b" : "#4ade80";
  return { color, fontVariantNumeric: "tabular-nums", fontWeight: 700, marginLeft: 3 };
}

// ── Pool Modal ────────────────────────────────────────────────────────────────

function PoolModal({
  category,
  resetTick: _resetTick,
  onResetAll,
  onResetDifficulty,
  onClose,
}: {
  category: KalamburyCategoryOption;
  resetTick: number;
  onResetAll: () => void;
  onResetDifficulty: (d: "easy" | "hard") => void;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const easyAvail = getAvailableCount(category.id, "easy");
  const easyTotal = getTotalCount(category.id, "easy");
  const hardAvail = getAvailableCount(category.id, "hard");
  const hardTotal = getTotalCount(category.id, "hard");

  const rows: Array<{ label: string; avail: number; total: number; difficulty: "easy" | "hard"; enabled: boolean }> = [
    { label: "Łatwe", avail: easyAvail, total: easyTotal, difficulty: "easy", enabled: category.easyEnabled },
    { label: "Trudne", avail: hardAvail, total: hardTotal, difficulty: "hard", enabled: category.hardEnabled },
  ];

  return (
    <div
      ref={overlayRef}
      style={modalOverlayStyle}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div style={modalPanelStyle}>
        {/* Header */}
        <div style={modalHeaderStyle}>
          <div>
            <p style={modalEyebrowStyle}>Pula haseł</p>
            <h3 style={modalTitleStyle}>{category.label}</h3>
          </div>
          <button type="button" style={modalCloseBtnStyle} onClick={onClose}>×</button>
        </div>

        {/* Rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 20px" }}>
          {rows.map(({ label, avail, total, difficulty, enabled }) => {
            if (total === 0) return null;
            const pct = Math.round((avail / total) * 100);
            const isEmpty = avail === 0;
            const isLow = !isEmpty && avail / total < 0.25;
            const barColor = isEmpty ? "#ef4444" : isLow ? "#f59e0b" : "#4ade80";
            const barGrad = isEmpty
              ? "linear-gradient(90deg,#ef4444,#dc2626)"
              : isLow
                ? "linear-gradient(90deg,#f59e0b,#d97706)"
                : "linear-gradient(90deg,#4ade80,#22d3ee)";
            const status = isEmpty ? "Wyczerpana" : isLow ? "Prawie pusta" : "OK";

            return (
              <div key={difficulty} style={{
                ...rowStyle,
                opacity: enabled ? 1 : 0.4,
              }}>
                <div style={rowTopStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: enabled ? barColor : "#52525b",
                      boxShadow: enabled ? `0 0 6px ${barColor}88` : "none",
                      flexShrink: 0,
                    }} />
                    <span style={rowLabelStyle}>{label}</span>
                    {!enabled && (
                      <span style={{ fontSize: 10, color: "#52525b", fontStyle: "italic" }}>wyłączone</span>
                    )}
                    {enabled && (
                      <span style={{ fontSize: 10, color: barColor, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" as const }}>
                        {status}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={rowCountStyle}>
                      <strong style={{ color: enabled ? barColor : "#52525b" }}>{avail}</strong>
                      <span style={{ color: "#52525b" }}> / {total}</span>
                    </span>
                    {enabled && (
                      <button
                        type="button"
                        style={rowResetBtnStyle}
                        title={`Reset ${label.toLowerCase()}`}
                        onClick={onResetDifficulty.bind(null, difficulty)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 12 }}>restart_alt</span>
                      </button>
                    )}
                  </div>
                </div>
                <div style={barTrackStyle}>
                  <div style={{
                    height: "100%", borderRadius: 99,
                    width: enabled ? `${pct}%` : "0%",
                    background: barGrad,
                    transition: "width 0.4s cubic-bezier(.4,0,.2,1)",
                    boxShadow: enabled && pct > 0 ? `0 0 8px ${barColor}55` : "none",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: 10, color: "#52525b" }}>{enabled ? pct : 0}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={modalFooterStyle}>
          <button type="button" style={resetAllBtnStyle} onClick={onResetAll}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>restart_alt</span>
            Reset wszystkich haseł
          </button>
          <button type="button" style={closePrimaryBtnStyle} onClick={onClose}>
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const sectionStyle: CSSProperties = {
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.02)",
  overflow: "hidden",
};

const sectionTitleStyle: CSSProperties = {
  display: "block",
  margin: 0,
  fontSize: 18,
  fontWeight: 700,
  color: "#f7f8fa",
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

const poolIconBtnStyle: CSSProperties = {
  display: "grid",
  placeItems: "center",
  width: 26,
  height: 26,
  borderRadius: 6,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "#71717a",
  cursor: "pointer",
  flexShrink: 0,
};

// Modal styles
const modalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.55)",
  backdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  zIndex: 2000,
};

const modalPanelStyle: CSSProperties = {
  width: "min(420px, 94vw)",
  background: "#141416",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 20,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  gap: 16,
  paddingBottom: 0,
};

const modalHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  padding: "20px 20px 0",
};

const modalEyebrowStyle: CSSProperties = {
  margin: 0,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#ff5bbd",
};

const modalTitleStyle: CSSProperties = {
  margin: "4px 0 0",
  fontSize: 18,
  fontWeight: 700,
  color: "#f7f8fa",
};

const modalCloseBtnStyle: CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  color: "#a1a1aa",
  fontSize: 16,
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
};

const rowStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  padding: "10px 12px",
  borderRadius: 10,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const rowTopStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const rowLabelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#f7f8fa",
};

const rowCountStyle: CSSProperties = {
  fontSize: 12,
  fontVariantNumeric: "tabular-nums",
};

const rowResetBtnStyle: CSSProperties = {
  display: "grid",
  placeItems: "center",
  width: 24,
  height: 24,
  borderRadius: 6,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "#71717a",
  cursor: "pointer",
};

const barTrackStyle: CSSProperties = {
  height: 4,
  borderRadius: 99,
  background: "rgba(255,255,255,0.07)",
  overflow: "hidden",
};

const modalFooterStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  padding: "12px 20px 20px",
  borderTop: "1px solid rgba(255,255,255,0.06)",
  marginTop: 4,
};

const resetAllBtnStyle: CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 5,
  padding: "9px 12px",
  borderRadius: 9,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "#a1a1aa",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

const closePrimaryBtnStyle: CSSProperties = {
  flex: 1,
  padding: "9px 12px",
  borderRadius: 9,
  border: "1px solid rgba(255,91,189,0.35)",
  background: "rgba(255,91,189,0.15)",
  color: "#fff",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};
