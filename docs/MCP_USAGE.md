# MCP_USAGE.md

Defines how tools should be used in this repo.

## General Rule

Use tools only when they add real value to the task.
Do not substitute tooling for thinking.

## Documentation Tools

Use when:
- API behavior is unclear,
- version-specific docs matter,
- setup/configuration needs confirmation,
- or library details may have changed.

Good examples:
- asking how to configure Cloudflare Workers behavior before touching worker setup
- checking official docs for a version-specific API before changing integration
- verifying up-to-date OpenAI docs before writing tool usage guidance

Bad examples:
- looking up docs for code that is already fully visible in local files
- searching docs instead of reading `apps/web/src/lib/gameRegistry.ts` when the question is "where is game registration?"

## Browser / Automation Tools

Use for:
- focused UI flow validation,
- smoke tests,
- routing checks,
- interaction verification,
- and targeted regression checks.

Good examples:
- open `/games/kalambury/launch` and verify the launch flow still mounts
- verify CTA buttons exist on a shared entry screen
- confirm a regression on the setup screen after a UI change

Bad examples:
- opening the browser just to understand repo structure
- random exploration without a concrete validation target
- using browser automation to replace reading local source files

## Repo-Specific Guidance

Before using docs or browser tools, first check whether the answer already exists in:
- `docs/`
- `apps/web/src/`
- `apps/worker/src/`
- `games/*/src/`
- `packages/*/src/`

Examples:
- if you need game registration, inspect `apps/web/src/lib/gameRegistry.ts`
- if you need routing, inspect `apps/web/src/App.tsx`
- if you need a game contract example, inspect `games/kalambury/src/index.ts`

## Efficiency Rules

- Prefer targeted reads over repo-wide fishing expeditions.
- Inspect only the files needed for the scoped task.
- Keep tool usage proportional to task size.
- Validate the changed flow, not the entire universe.
