# Binary Cleanup Design

**Goal:** Posprzątać repo z niepotrzebnych binarnych artefaktów bez usuwania mockupów ani aktywnie używanych assetów gry.

## Findings

- Śledzone obrazy w repo są już mocno ograniczone.
- `docs/MOCUPS/*` oraz `docs/mockups/*` mają zostać zachowane.
- Aktywne assety Kalambur używane przez kod to:
  - `games/kalambury/src/assets/kalambury-mode-classic-line-art.svg`
  - `games/kalambury/src/assets/kalambury-mode-team-line-art.svg`
- `games/kalambury/src/assets/kalambury-classic-performer.png` nie jest referencjonowany przez kod gry; pojawia się tylko w starym planie w `docs/plans/`.

## Decision

- Zachować wszystkie mockupy.
- Zachować aktywnie używane assety gry.
- Usunąć tylko binarki, które nie są używane przez aktualny kod produktu.

## Guardrails

- Nie usuwać niczego z `docs/MOCUPS/`.
- Nie usuwać niczego z `docs/mockups/`.
- Nie usuwać assetów, które są importowane w `games/*` albo używane przez metadata / manifest.
