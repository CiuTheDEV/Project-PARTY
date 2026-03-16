# DECISIONS.md

Tracks key project decisions.

Operational source of truth lives in:
- `docs/PROJECT_CONTEXT.md`
- `docs/REPO_ARCHITECTURE.md`
- `docs/TECH_STACK.md`
- `docs/GAME_MODULE_STANDARD.md`
- `docs/RUNTIME_CONTRACT.md`

Treat `docs/plans/` and `docs/PRD/` as historical context, not the primary operational docs.

## 2026-03-16

### Decision
Kalambury zarządza własnym wyborem transportu w module gry (`games/kalambury/src/transport/`), nie na poziomie platformy.

### Reason
Platforma nie powinna znać szczegółów transportowych konkretnej gry. Kalambury potrzebuje fallbacku na Firebase gdy Cloudflare DO osiąga limity — to problem Kalambury, nie platformy. Wzorzec `transport/` może być wzorcem dla przyszłych gier jeśli zajdzie potrzeba.

---

### Decision
Firebase RTDB jako opcjonalny transport fallback w Kalambury — tylko transport (send/on), nie storage sesji.

### Reason
Storage sesji pozostaje w DO. Firebase zastępuje tylko kanał komunikacji między urządzeniami. Oddzielenie odpowiedzialności pozwala na minimalną integrację i łatwe wyłączenie.

---

### Decision
Brak cichego fallbacku przy wyborze Firebase bez aktywnej sesji — zamiast tego throw z komunikatem kierującym użytkownika do Ustawień.

### Reason
Cichy fallback maskuje błędy konfiguracji. Jawny błąd z instrukcją daje użytkownikowi actionable feedback i zapobiega puzzlowaniu się "czemu gra działa lokalnie".

---

### Decision
Presenter bridge podzielony na `shared/presenter/types.ts`, `host-bridge.ts`, `controller-bridge.ts` + hook `host/hooks/usePresenterHostBridge.ts`.

### Reason
Monolityczny `shared/presenter-bridge.ts` (544 linie) łączył dwie niezależne odpowiedzialności (host i controller) i zawierał logikę bridge rozrzuconą po komponentach jako lokalne useEffect. Podział daje izolowane testy dla każdej strony protokołu, hook eliminuje stale closure workaroundy (`playStateRef`, `presenterRevealStageRef`) i upraszcza komponenty.

---

## 2026-03-13

### Decision
Hub is the homepage of Project Party.

### Reason
Users should enter directly into the game discovery experience, not a separate marketing shell.

---

### Decision
Each game is a separate module within the project.

### Reason
Different games need different gameplay flows, device models, and session behavior.

---

### Decision
Routing should stay shallow.

### Reason
Public URLs should remain simple. Game internals belong inside the module, not in a baroque route tree.

---

### Decision
Games expose a minimal metadata contract to the hub.

### Reason
The hub needs to display, filter, and categorize games without knowing their internal logic.

---

### Decision
Sessions are game-owned at MVP stage.

### Reason
Games vary too much to force one shared session model this early.

---

### Decision
Realtime is preferred, but state ownership is game-dependent.

### Reason
Some games may be host-authoritative, others server-authoritative, and forcing one rule now would be brittle.

---

### Decision
Accounts are not required at launch.

### Reason
Low-friction entry matters more than auth/monetization at the current stage.
