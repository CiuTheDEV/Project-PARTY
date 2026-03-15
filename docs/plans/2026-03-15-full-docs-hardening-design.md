# Full Docs Hardening Design

**Goal:** Wykonać pełny pakiet poprawek i uzupełnień dokumentacji wskazanych w review, bez dodawania przykładów oderwanych od realiów repo.

## Scope

- Naprawić `docs/REPO_MAP.md` pod Windows-first i aktualne ścieżki repo.
- Naprawić `docs/CONTRIBUTING.md`, aby odwoływał się do istniejących dokumentów i aktualnego workflow.
- Rozszerzyć `docs/CODEX_WORKFLOW.md` o przykładowe workflow oparte na realnych ścieżkach repo.
- Rozszerzyć `docs/TECH_STACK.md` o przykłady testów z warstw `apps`, `games`, `packages`.
- Rozszerzyć `docs/MCP_USAGE.md` o konkretne przykłady dobrego i złego użycia.
- Dodać `docs/TROUBLESHOOTING.md`.
- Dodać `.claude/project-knowledge.md` jako quick reference dla AI.

## Guardrails

- Wszystkie przykłady muszą używać realnych plików, pakietów i komend istniejących w repo.
- Dokumentacja nie może przenosić gameplayu do platformy.
- `project-knowledge.md` ma być skrótem orientacyjnym, a nie ważniejszym źródłem prawdy niż `docs/*`.

## References To Reuse

- `apps/web/src/lib/gameRegistry.ts`
- `apps/web/src/App.tsx`
- `games/kalambury/src/index.ts`
- `games/tajniacy/src/index.ts`
- workspace scripts z root `package.json`, `apps/web/package.json`, `apps/worker/package.json`, `games/*/package.json`
