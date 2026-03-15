# CODE_BOUNDARIES.md

This file defines safe and sensitive areas of the codebase.

## Safe Areas

Changes are usually safe in:
- individual game modules
- shared UI primitives/components
- hub presentation logic
- isolated utility helpers
- local styling and layout work

## Moderate Risk Areas

Changes require caution in:
- game registration / game metadata systems
- routing into games
- shared worker/API helpers
- shared design tokens
- platform discovery flows (search, filters, featured, recent, random)

## Sensitive Areas

Changes here can affect the whole platform:
- platform routing model
- shared realtime infrastructure
- shared session infrastructure
- architecture contracts
- design-system foundations
- anything that blurs platform vs game-module ownership

## Boundary Rules

- Prefer local game-module changes over platform changes.
- Do not move a game-specific rule into shared code just because another game might maybe someday use it.
- Do not let one game's assumptions become global platform policy by accident.
- If touching sensitive areas, explain impact first.
- Avoid architecture rewrites during local UI or feature work.

## Platform vs Game Test

Before changing shared code, ask:
1. Is this truly needed by multiple games now?
2. Is the behavior generic enough to stay game-agnostic?
3. Would this create hidden dependency on one game's flow?

If the answer to #3 is yes, keep it inside the game module.
