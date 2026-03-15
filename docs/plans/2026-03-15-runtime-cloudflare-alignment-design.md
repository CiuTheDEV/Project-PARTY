# Runtime Cloudflare Alignment Design

**Goal:** Ujednolicić `REPO_ARCHITECTURE.md` i `RUNTIME_CONTRACT.md` z nowym kierunkiem Cloudflare opisanym w `TECH_STACK.md`.

## Decision

- `apps/web` jest opisywane jako frontend hostowany na Cloudflare Pages.
- `apps/worker` jest opisywane jako backend na Cloudflare Workers z Durable Objects dla sesji/realtime.
- `RUNTIME_CONTRACT.md` jasno dopuszcza więcej niż jeden transport backendowy.
- `BroadcastChannel` pozostaje opisany jako local/dev transport, a nie wyjątek od architektury.

## Guardrails

- Nie zmieniać typu `GameRuntimeContext`.
- Nie robić z Durable Objects jedynej dopuszczalnej implementacji.
- Zachować granicę: platforma zna kontrakt, gra zna własną logikę.
