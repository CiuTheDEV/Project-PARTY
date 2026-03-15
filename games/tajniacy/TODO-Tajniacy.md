# TODO-Tajniacy.md

## 1. Setup & Meta Polish
- [x] Permanent Team Panels (always visible)
- [x] "Mode Settings" Modal (Kalambury parity)
- [x] Avatar Selection System (Large tiles, + button logic)
- [x] Categorized Avatar Picker (Animals, Objects, etc.)
- [ ] **Word Categories Integration**:
    - [x] "Standardowa" list implemented.
    - [x] "Bez cenzury" (NSFW) list implemented.
    - [x] Category selection logic in state.
    - [ ] Dynamic icons/labels for categories in setup. - nie potrzebujemy tego

## 2. Gameplay Screen (Host)
- [x] **Agent Tokens System**:
    - Implement a row of team avatars at the bottom.
    - Avatars "deactivate" (grayscale/dim) as agents are found.
- [x] **Game Board Design**:
    - 5x5 grid with high-contrast typography (All-caps).
    - Glassmorphism effects for cards.
    - "Peek" mechanic: Hold a button to show colors for the host.
- [x] **Reveal Animations**:
    - Smooth 3D-like transition for cards.
    - Glow effects for Team Red/Blue reveals.
- [x] **Scoreboard**: Causal header with current scores.
- [x] **Hint Display**:
    - [x] Show the current Captain's hint (Word + Count) on the Host screen when submitted.
    - [x] Toggle/Reset hint display when turn ends (manually or via turns).
- [x] **Round History UI**:
    - [x] State tracking for `roundHistory`.
    - [x] Sidebar or bottom panel showing past rounds (winner, score, assassin count). - dodaj to pod ustawieniami w menu głównym, osobny przycisk satystyki.
- [ ] **Interactive Overlays**:
    - [x] Assassin resolution modal.
    - [x] Round win overlay.
    - [x] Match win overlay.
    - [x] **Reset Confirmation**: Modal to confirm "Reset meczu" to prevent accidental data loss.

## 3. Devices & Pairing (Captain/Player)
- [ ] **Pairing Flow Logic**:
    - [ ] UI on Host: **Pairing Tile** (kafelek podglądu urządzeń).
    - [ ] "Connect Captain" (1 or 2 devices) logic via BroadcastChannel.
    - [ ] "Connect Player View" logic.
    - [ ] Dynamic role assignment (preventing double captains).
- [ ] **Real-time State Sync (BroadcastChannel dev)**:
    - [ ] Implement `useBroadcastSync` hook.
    - [ ] Replace mock props in `createRuntime.ts` with real `sharedState` / `matchState`.
    - [x] Implement "Rozłącz wszystkie" with session code regeneration <!-- id: 40 -->
- [x] Fix "1 Kapitan" start bypass (allow starting without red/blue captains if 1-kapitan mode used) <!-- id: 41 -->
- [x] Fix role selection buttons auto-disabling/occupancy sync issues <!-- id: 42 -->
- [x] Fix Controller auto-login on host link open <!-- id: 43 -->
- [x] Implement waiting lobby in Controller (phase based) <!-- id: 44 -->
- [x] Display starting team info on Captain screen <!-- id: 45 -->
- [x] Shrink Top Bar in Captain/Player views for more board space <!-- id: 46 -->
- [x] Improve hint font scaling inside cards <!-- id: 47 -->
- [x] Relocate hint display next to team name/score (between them) <!-- id: 48 -->
- [x] Add 30s turn timer/block for hint submission <!-- id: 49 -->
- [x] Style hint word (team name size) and count (different color) <!-- id: 50 -->
- [x] **Captain View**:
    - [x] 5x5 Key Map visibility.
    - [x] Hint Input (Word + Number).
    - [x] Real-time sync to host.
- [ ] **Player View (View-only)**:
    - [x] Basic layout.
    - [ ] Verify connection and sync with host board state.
- [ ] **Connection Presence**:
    - [ ] Visual indicator on Host for Captain connection status (Online/Offline).
    - [ ] Reconnection logic (keep role and state after browser refresh).

## 4. Game Logic & Rules
- [x] **Win Conditions**: Detect team completion or assassin hit.
- [x] **Round Management**: 
    - [x] Score updates.
    - [x] Transition to next round (Return to Setup/Next Round).
- [ ] **Settings Inter-Round**:
    - [ ] Allow changing word category or assassin count between rounds without resetting match score. - nie potrzebne
- [x] **Multiple Assassins**:
    - [x] Board generator supports 1-5 assassins.
    - [x] UI scales to handle multiple assassin cards.

## 5. Polish & Sound
- [x] Interactive sounds for reveals.
- [x] Haptic feedback for mobile captains.
- [x] Transition animations between Setup and Playing stages.
- [x] Premium Scrollbar & UI Scaling.
