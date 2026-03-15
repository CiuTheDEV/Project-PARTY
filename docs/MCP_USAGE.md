# MCP_USAGE.md

Defines how tools should be used.

## General Rule

Use tools only when they add real value to the task.
Do not substitute tooling for thinking.

## Documentation Tools

Use when:
- API behavior is unclear,
- version-specific docs matter,
- setup/configuration needs confirmation,
- or framework/library details may have changed.

Do not use them for obvious local logic.

## Browser / Automation Tools

Use for:
- focused UI flow validation,
- smoke tests,
- routing checks,
- interaction verification,
- and targeted regression checks.

Do not use them for vague wandering exploration.

## Efficiency Rules

- Prefer targeted reads over repo-wide fishing expeditions.
- Inspect only the files needed for the scoped task.
- Keep tool usage proportional to task size.
- Validate the changed flow, not the entire universe.
