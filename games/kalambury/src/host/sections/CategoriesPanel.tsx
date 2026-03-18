// games/kalambury/src/host/sections/CategoriesPanel.tsx
import { useState, useCallback, type CSSProperties } from "react";

import type {
  KalamburyCategoryDifficulty,
  KalamburyCategoryOption,
} from "../../shared/setup-content";
import {
  getAvailableCount,
  getTotalCount,
  resetAllUsedPhrasesForCategory,
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
  // Bump to force re-read of localStorage after reset
  const [resetTick, setResetTick] = useState(0);

  const handleResetCategory = useCallback((categoryId: string) => {
    resetAllUsedPhrasesForCategory(categoryId);
    setResetTick((n) => n + 1);
  }, []);

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

              return (
                <div className="kalambury-category-stack" key={category.id}>
                  <button
                    className={chipClassName}
                    type="button"
                    aria-pressed={category.isSelected}
                    onClick={() => onToggleCategory(category.id)}
                  >
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
                      {category.isSelected ? (
                        <div style={{ width: "100%", flexBasis: "100%" }}>
                          <CategoryPoolBar
                            categoryId={category.id}
                            easyEnabled={category.easyEnabled}
                            hardEnabled={category.hardEnabled}
                            resetTick={resetTick}
                            onReset={handleResetCategory}
                          />
                        </div>
                      ) : null}
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
    </div>
  );
}

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

// ── Pool bar ──────────────────────────────────────────────────────────────────

function CategoryPoolBar({
  categoryId,
  easyEnabled,
  hardEnabled,
  resetTick: _resetTick,
  onReset,
}: {
  categoryId: string;
  easyEnabled: boolean;
  hardEnabled: boolean;
  resetTick: number;
  onReset: (id: string) => void;
}) {
  const easyAvail = easyEnabled ? getAvailableCount(categoryId, "easy") : 0;
  const hardAvail = hardEnabled ? getAvailableCount(categoryId, "hard") : 0;
  const easyTotal = easyEnabled ? getTotalCount(categoryId, "easy") : 0;
  const hardTotal = hardEnabled ? getTotalCount(categoryId, "hard") : 0;
  const available = easyAvail + hardAvail;
  const total = easyTotal + hardTotal;
  if (total === 0) return null;
  const pct = Math.round((available / total) * 100);
  const color = available > Math.floor(total * 0.25) ? "#4ade80" : "#f59e0b";

  return (
    <div style={poolBarWrapStyle}>
      <div style={poolBarRowStyle}>
        <span style={{ fontSize: 11, color: "#a1a1aa" }}>
          Dostępne:{" "}
          <strong style={{ color }}>{available}</strong>
          <span style={{ color: "#52525b" }}> / {total}</span>
        </span>
        <button
          type="button"
          style={poolResetBtnStyle}
          title="Reset puli haseł"
          onClick={() => onReset(categoryId)}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>refresh</span>
          Reset
        </button>
      </div>
      <div style={poolBarTrackStyle}>
        <div style={{ ...poolBarFillStyle, width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

const poolBarWrapStyle: CSSProperties = {
  marginTop: 6,
  width: "100%",
};

const poolBarRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 4,
};

const poolResetBtnStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 3,
  background: "none",
  border: "none",
  color: "#71717a",
  fontSize: 11,
  cursor: "pointer",
  padding: "2px 4px",
  borderRadius: 4,
};

const poolBarTrackStyle: CSSProperties = {
  height: 4,
  borderRadius: 99,
  background: "rgba(255,255,255,0.08)",
  overflow: "hidden",
};

const poolBarFillStyle: CSSProperties = {
  height: "100%",
  borderRadius: 99,
  transition: "width 0.3s ease",
};
