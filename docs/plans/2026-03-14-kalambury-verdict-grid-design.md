# Kalambury Verdict Grid Design

**Date:** 2026-03-14

**Problem**

Obecny ekran `WERDYKT` renderuje pionową listę kandydatów do punktu. Przy 12 graczach lista nie mieści się w viewport i wymaga scrollowania, co spowalnia wybór i psuje rytm rundy.

**Decision**

Ekran `WERDYKT` przechodzi z układu listy do układu wyboru w siatce. Kandydaci do punktu są prezentowani jako kompaktowe, klikane kafle w siatce, bez widocznych punktów na samych kartach.

**Why this approach**

- mieści do 12 graczy bez scrolla,
- pozwala skanować ekran wzrokiem zamiast szukać osoby w pionowej liście,
- zachowuje prosty model decyzji: `kto zgadl?`,
- nie przeciąża sceny dodatkowymi danymi, bo score i bonus zostają w bottom barze.

**Layout**

- Nagłówek `Kto zgadl?` zostaje na środku sceny.
- Pod nagłówkiem renderowana jest siatka wyboru.
- Desktop:
  - docelowo 3 lub 4 kolumny zależnie od szerokości, z maksymalnie 12 kaflami widocznymi naraz.
- Mobile / mniejsze szerokości:
  - siatka redukuje liczbę kolumn responsywnie, ale nadal nie używa osobnego scrolla wewnątrz sceny.

**Player choice card**

Każda karta wyboru zawiera wyłącznie:

- avatar,
- imię,
- stan aktywny po kliknięciu.

Nie pokazujemy:

- aktualnych punktów,
- dodatkowych badge’y,
- rozbudowanych opisów.

**Selection state**

- kliknięcie kafla wybiera zgadującego,
- aktywna karta dostaje wyraźne podświetlenie,
- bottom bar pozostaje miejscem dla bonusu prezentera i akcji `Wroc` / `Zapisz i dalej`.

**Scope**

- zmiana ogranicza się do modułu `games/kalambury`,
- bez zmian w platformie,
- bez zmian w kontrakcie runtime,
- bez zmian w docs architektonicznych.

**Files likely affected**

- `games/kalambury/src/host/PlayScreen.tsx`
- `games/kalambury/src/styles.css`
- `games/kalambury/src/host/play-parity.test.js`
- opcjonalnie `games/kalambury/src/host/styles-parity.test.js`

