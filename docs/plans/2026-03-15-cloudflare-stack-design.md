# Cloudflare Stack Design

**Goal:** Zaktualizować `TECH_STACK.md`, aby jasno opisywał docelowy model hostingu i session infra oparty o Cloudflare.

## Decision

- `apps/web` pozostaje frontendem React + Vite i docelowo jest hostowany na Cloudflare Pages.
- `apps/worker` pozostaje backendem API i docelowo działa na Cloudflare Workers.
- Durable Objects są preferowaną warstwą dla stateful session coordination i realtime w środowisku produkcyjnym.
- `BroadcastChannel` pozostaje lokalnym mechanizmem dev/test i fallbackiem dla lokalnych scenariuszy, nie jest usuwany z architektury.

## Guardrails

- Nie opisywać Durable Objects jako jedynego dopuszczalnego transportu.
- Zachować elastyczność runtime contractu.
- Nie mieszać frontendu hostowanego na Pages z backendową odpowiedzialnością Workers.
