# DECISIONS.md

Tracks key project decisions.

Operational source of truth lives in:
- `docs/PROJECT_CONTEXT.md`
- `docs/REPO_ARCHITECTURE.md`
- `docs/TECH_STACK.md`
- `docs/GAME_MODULE_STANDARD.md`
- `docs/RUNTIME_CONTRACT.md`

Treat `docs/plans/` and `docs/PRD/` as historical context, not the primary operational docs.

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
