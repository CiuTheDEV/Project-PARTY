# Cloudflare Workers Setup Design

**Goal:** Przygotować repo do deployu na Cloudflare z podziałem na frontend static assets worker i osobny API/session worker z Durable Objects.

## Architecture

- `apps/web` dostaje worker entry pod static assets i proxy `/api/*` do service binding.
- `apps/worker` dostaje worker entry, `wrangler` config i minimalny `SessionDurableObject`.
- Local dev pozostaje oparty o obecny Vite flow i in-memory/session fallback.

## Decisions

- Nie przepinamy całego gameplay/runtime na Durable Objects w tym kroku.
- Durable Objects obsługują session persistence tylko wtedy, gdy worker działa z bindingiem Cloudflare.
- Gdy env/binding nie istnieje, worker używa obecnego lokalnego store w pamięci.

## Files To Introduce

- `apps/web/wrangler.jsonc`
- `apps/web/src/cloudflare-entry.ts`
- `apps/worker/wrangler.jsonc`
- `apps/worker/src/cloudflare-entry.ts`
- `apps/worker/src/durable-object.ts`
- ewentualne zmiany w `apps/worker/src/http.ts`, `apps/worker/src/index.ts`, `apps/worker/src/session-store.ts`

## Guardrails

- Nie łamać obecnych testów `apps/worker`.
- Nie usuwać `BroadcastChannel` ani lokalnego Vite proxy.
- Trzymać wszystko na realnych ścieżkach i skryptach repo.
