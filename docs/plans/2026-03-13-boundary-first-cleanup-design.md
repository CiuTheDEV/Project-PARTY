# Boundary-First Cleanup Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Domknąć po merge trzy techniczne prowizorki bez zmiany zachowania produktu: publiczne importy pakietów, spójne uruchamianie narzędzi i mały cleanup runtime mounting w `apps/web`.

**Architecture:** Zmiany pozostają lokalne. `apps/web` i `apps/worker` przechodzą na publiczne entrypointy `@project-party/*`, `apps/web` dostaje mały helper do montowania runtime zamiast duplikować ten sam kod w dwóch stronach, a toolchain dostaje tylko minimalne dopięcie do workspace package resolution dla build/test/typecheck/lint.

**Tech Stack:** TypeScript, React 19, Vite 6, Node test runner, Turbo, Biome.

---

## Scope
- Przepiąć deep importy z `packages/*/src/*.ts` na `@project-party/*`.
- Utrzymać zielone `typecheck`, `lint`, `test`, `build` dla dotkniętych obszarów.
- Wyciągnąć minimalny helper montowania runtime dla host/controller w `apps/web`.

## Out of Scope
- Refaktor katalogu gier jako source of truth.
- Usuwanie storage bridge w `games/kalambury`.
- Zmiany zachowania produktu lub UI.

## Design Decisions

### 1. Publiczne importy pakietów
Wszystkie importy z `packages/*/src` w `apps/web` i `apps/worker` mają zostać przepięte na publiczne nazwy pakietów. To naprawia granicę pakietów bez ruszania domeny.

### 2. Minimalne dopięcie resolvera
Repo już ma aliasy TypeScript i Vite dla `@project-party/*`, więc brakującym ogniwem są testy Node i ewentualnie lokalny toolchain. Dopuszczalne są tylko małe zmiany konfiguracyjne, które sprawią, że obecne publiczne entrypointy będą czytelne dla istniejących komend.

### 3. Runtime mount helper
`GameLaunchPage` i `ControllerRuntimePage` składają prawie ten sam `GameRuntimeContext`. Zostanie wyciągnięty jeden mały helper w `apps/web`, który przyjmie tylko różniące się dane wejściowe i zwróci handle runtime. To nie zmienia zachowania, tylko usuwa oczywistą duplikację wrappera.

## Risks
- Node test runner może nadal nie rozumieć workspace imports bez dodatkowej flagi lub loadera.
- Zbyt szeroki helper runtime mógłby stać się nową abstrakcją; helper musi zostać mały i lokalny dla `apps/web`.
- Nie wolno naruszyć przepływu session create/join ani mountowania Kalamburów.

## Verification
- `apps/web`: `test`, `typecheck`, `lint`, `build`
- `apps/worker`: `test`, `typecheck`, `lint`
- `games/kalambury`: `test`, `typecheck`, `lint`
