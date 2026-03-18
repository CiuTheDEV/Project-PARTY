# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Run all dev servers in parallel
pnpm build            # Build all packages
pnpm check            # Lint + typecheck together
pnpm lint             # Lint with Biome
pnpm typecheck        # Full TypeScript type check
pnpm test             # Run all tests

# Run tests for a specific package
pnpm --filter @project-party/web test
pnpm --filter @project-party/worker test
pnpm --filter @project-party/game-kalambury test
pnpm --filter @project-party/game-tajniacy test

# Cloudflare dev / deploy
pnpm cf:dev:web
pnpm cf:dev:worker
pnpm cf:deploy:web
pnpm cf:deploy:worker

# Playwright E2E
pnpm playwright:install
pnpm playwright:debug:launch
```

Tests use Node.js native `node:test` — no external test framework. Biome handles formatting, linting, and import organization.

**When to run what:**
- Change in one game → test that game + optionally `@project-party/web`
- Change in platform → test `@project-party/web` or `@project-party/worker`
- Change in shared packages → `pnpm test && pnpm typecheck`
- Change to integration contract → `pnpm test` (all)

## Architecture

Project Party is a **hub + autonomous game modules** platform. The hub knows nothing about game logic — it only knows the runtime contract. Each game is fully self-contained.

### Monorepo Layout

```
apps/web/       # Frontend hub + game launcher (React + Vite + Cloudflare Workers)
apps/worker/    # Backend API + Durable Objects (Cloudflare Workers)
games/          # Autonomous game modules (kalambury, tajniacy, …)
packages/
  types/         # Domain types: DeviceProfile, PlayerRole, GameMeta, SessionRecord
  shared/        # Generic utils: catalog, session, slugs
  ui/            # Shared React components (platform shell)
  design-system/ # Design tokens
  game-runtime/  # Runtime contract types and interfaces
  game-sdk/      # defineGame() helper for game authors
docs/           # Architecture docs — primary source of truth (see below)
tests/          # Playwright E2E
```

### The Game Module Contract

Every game exports a `GameDefinition` (via `defineGame()` from `@project-party/game-sdk`):

```ts
type GameDefinition = {
  id: string;
  version: string;
  meta: GameMeta;
  capabilities: GameCapabilities; // deviceProfiles, supportedRoles, supportsRemotePlay
  settings: GameSettingsDefinition;
  createRuntime: (context: GameRuntimeContext) => GameRuntimeHandle;
};
```

The hub calls `game.createRuntime(context)` and receives a `{ start, destroy? }` handle. Games interact with the platform exclusively through `context.transport`, `context.storage`, `context.ui`, and `context.players` — never by importing platform internals.

### Device Profiles & Roles

Device profiles: `"single-screen"` | `"host-plus-phones"` | `"phones-only"`
Player roles: `"host"` | `"player"` | `"controller"` | `"viewer"`

Each game declares which profiles and roles it supports. The hub routes accordingly.

### Key Integration Files

| File | Purpose |
|---|---|
| `apps/web/src/lib/gameRegistry.ts` | Static game imports, lookup by id |
| `apps/web/src/runtime/mountRuntime.ts` | Bridges GameDefinition → GameRuntimeContext |
| `apps/web/src/runtime/session-transport.ts` | Transport abstraction (BroadcastChannel locally, HTTP events in prod) |
| `apps/worker/src/http.ts` | REST API: catalog, sessions, events |
| `apps/worker/src/durable-object.ts` | Stateful session coordination (no game logic) |

### TypeScript Path Aliases

Defined in `tsconfig.base.json`. Use `@project-party/types`, `@project-party/shared`, etc. — never relative imports across package boundaries.

### Deployment

- **Web**: SPA static assets on Cloudflare Workers, `/api/*` proxied to the API worker
- **Worker**: REST API + Durable Objects (`SessionDurableObject`) with SQLite persistence
- Config in `apps/web/wrangler.jsonc` and `apps/worker/wrangler.jsonc`

## Non-Negotiable Rules

- Treat the platform as **hub + autonomous game modules**. Do not assume a single global gameplay model.
- **Never move game-specific logic into `apps/` or `packages/`** without explicit justification that multiple games need it now.
- **Never add a game's assumptions to shared code** just because another game might someday need the same thing.
- When changing the integration contract, update the relevant `docs/` files.
- Prefer the smallest change closest to its responsible owner (game > platform > shared).

## Code Boundaries

**Safe:** individual game modules, shared UI primitives, hub presentation logic, isolated utils.

**Moderate risk (explain change first):** game registration, platform routing into games, shared worker helpers, design tokens, platform discovery flows.

**Sensitive (explain architectural impact first):** platform routing model, session/realtime infrastructure, architecture contracts, design-system foundations.

Before touching shared code, ask: Is this truly needed by multiple games *now*? Is the behavior generic enough to stay game-agnostic? Would this create a hidden dependency on one game's flow? If the last answer is yes — keep it inside the game module.

## Documentation

Read before touching code:
1. `AGENTS.md`
1. `docs/PROJECT_CONTEXT.md`
2. `docs/REPO_ARCHITECTURE.md`
3. `docs/TECH_STACK.md`
4. `docs/GAME_MODULE_STANDARD.md`
5. `docs/RUNTIME_CONTRACT.md`
6. `docs/CODEX_WORKFLOW.md`

Also read `docs/CLOUDFLARE_GAME_DEPLOY.md` for anything involving remote transport, Cloudflare Workers, Durable Objects, or production deployment.

`docs/plans/` and `docs/PRD/` are archives — not current source of truth.

When debugging production issues (WebSocket failures, transport sync, Firebase), check `docs/TROUBLESHOOTING.md` first — it contains known failure patterns and fixes for non-obvious problems (e.g., WS routing order in `http.ts`, `pairedDeviceId` persistence bug, Firebase transport mode mismatch).

## Platform Notes

- This is a **Windows-first** dev environment. Shell commands in `package.json` route through `scripts/run-tool.mjs` for cross-platform compatibility.
- The presenter phone bridge currently uses `BroadcastChannel` (local-only). Cross-device transport via the worker session layer is not yet complete — see `TODO.md`.
- Transport mode for Kalambury (`broadcast` | `do-ws` | `firebase`) is set per-device in `localStorage` under `kalambury:transport-mode` — it is not propagated automatically via session.
