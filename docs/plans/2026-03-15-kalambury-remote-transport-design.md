# Kalambury Remote Transport Design

## Goal

Wprowadzić pełny zdalny transport dla Kalambur działający między różnymi urządzeniami przez Cloudflare Workers + Durable Objects, bez utraty lokalnego fallbacku opartego o `BroadcastChannel`.

## Problem

Obecny deploy poprawnie tworzy sesję i przyjmuje `join`, ale host i controller Kalambur nadal komunikują się wyłącznie przez `BroadcastChannel`. To działa tylko lokalnie w obrębie jednej przeglądarki/origin i nie daje cross-device pairing ani zdalnego realtime.

## Decision

Przyjmujemy model hybrydowy:

- `BroadcastChannel` zostaje jako local/dev fallback
- produkcyjny transport sesji idzie przez `apps/worker` i Durable Object przypisany do `sessionCode`
- Kalambury przestają znać szczegóły transportu i dostają adapter kanału wiadomości

## Architecture

### Session state

Durable Object sesji przechowuje:

- `SessionRecord`
- listę uczestników sesji
- rosnący log eventów sesji dla prostego pollingu

To daje dwa potrzebne kanały:

- odczyt aktualnego snapshotu sesji
- odczyt/publikację eventów host <-> controller

### Transport contract

W `apps/web` powstanie adapter transportu sesji z jednolitym API:

- `publish(type, payload)`
- `subscribe(handler)`
- `destroy()`

Adapter wybiera backend:

- `BroadcastChannel` dla local/dev fallback
- remote API dla sesji z `sessionCode`

### Kalambury integration

Kalambury host/controller dostaną bridge oparty o abstrakcyjny kanał wiadomości zamiast bezpośredniego `BroadcastChannel`. Zachowujemy istniejącą semantykę wiadomości:

- pairing
- reject/reset
- phrase sync
- reveal / reroll
- preview start / finish / reset

## Scope

W tym etapie:

- host widzi zdalnie dołączony telefon
- controller może sparować się z hostem na innym urządzeniu
- wszystkie eventy prezentera działają przez DO
- `BroadcastChannel` nadal działa lokalnie

Poza zakresem:

- pełny realtime layer dla wszystkich gier
- przepinanie Tajniaków
- WebSocket/SSE

## Risks

- polling może być mniej responsywny niż prawdziwy push, ale jest wystarczający na pierwszy produkcyjny transport
- rozszerzenie `SessionRecord` musi pozostać lekkie i platformowe, bez wrzucania logiki gry do worker
- bridge Kalambur nie może stracić zgodności z istniejącymi lokalnymi testami

## Validation

- testy worker dla participants i event log
- testy adaptera transportu w `apps/web`
- testy bridge Kalambur na abstrakcyjnym kanale
- ręczny smoke test: host desktop + controller phone na publicznym deployu
