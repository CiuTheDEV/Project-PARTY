import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { createTajniacyBridge } from "../shared/bridge.ts";
import type { TajniacyChannel, TajniacyPresence } from "../shared/bridge.ts";

import {
  type TajniacyHubMode,
  type TajniacyHubSettingsTabId,
  getHubNextModeId,
  getTajniacyHubContent,
  isHubModePlayable,
} from "../manifest/hub-content.ts";
import type { MatchState, TeamId } from "../shared/types.ts";
import {
  clearHint,
  createInitialMatchState,
  resetMatch,
  resolveAssassin,
  returnToSetup,
  revealCard,
  startNewRound,
  updateAssassinCount,
  updateCategory,
  updateHint,
  updateRoundsToWin,
  updateTeamAvatar,
  updateTeamName,
} from "../shared/state-machine.ts";
import { loadUsedWords, saveUsedWords, isPoolExhausted } from "../shared/words.ts";
import { PlayScreen } from "./PlayScreen.tsx";
import { SetupScreen } from "./SetupScreen.tsx";
import { TajniacyPairingModal } from "./PairingModal.tsx";

type TajniacyHostAppProps = {
  sessionCode?: string;
  transportChannel?: TajniacyChannel;
};

export function TajniacyHostApp({ sessionCode, transportChannel }: TajniacyHostAppProps) {
  const hubContent = getTajniacyHubContent();

  // Hub state
  const [activeSection, setActiveSection] = useState<"play" | "settings" | "stats">("play");
  const [selectedModeId, setSelectedModeId] = useState<TajniacyHubMode["id"]>(
    hubContent.modePicker.activeModeId,
  );
  const [selectedSettingsTabId, setSelectedSettingsTabId] =
    useState<TajniacyHubSettingsTabId>(hubContent.settingsPanel.activeTabId);
  const [isSetupOpen, setIsSetupOpen] = useState(false);

  // Game state
  const [activeScreen, setActiveScreen] = useState<"hub" | "play">("hub");
  const [matchState, setMatchState] = useState<MatchState>(createInitialMatchState);
  const [presence, setPresence] = useState<TajniacyPresence>({
    captainRed: false,
    captainBlue: false,
    playerView: false,
    spectatorCaptain: false,
  });
  // Whether the game is paused due to a captain disconnecting
  const [isCaptainDisconPaused, setIsCaptainDisconPaused] = useState(false);
  // Whether pool was just auto-reset (triggers info modal on next round start)
  const [poolJustReset, setPoolJustReset] = useState(false);
  // Presence at the moment the match started — so we know if two captains were connected
  const [startPresence, setStartPresence] = useState<TajniacyPresence | null>(null);

  // Bridge synchronization
  const callbacksRef = useRef({
    onRevealRequest: (index: number) => handleRevealCard(index),
    onHintRequest: (word: string, count: number, teamId: TeamId) => handleSendHint(word, count, teamId),
    onHintClearRequest: (teamId: TeamId) => handleClearHint(teamId),
    onRequestSync: () => handleRequestSync(),
  });

  useEffect(() => {
    callbacksRef.current = {
      onRevealRequest: handleRevealCard,
      onHintRequest: handleSendHint,
      onHintClearRequest: (teamId: TeamId) => handleClearHint(teamId),
      onRequestSync: handleRequestSync,
    };
  });

  const [bridge] = useState(() =>
    sessionCode ? createTajniacyBridge(sessionCode, "host", {
      channel: transportChannel,
      onRevealRequest: (index) => callbacksRef.current.onRevealRequest(index),
      onHintRequest: (word, count, teamId) => callbacksRef.current.onHintRequest(word, count, teamId),
      onHintClearRequest: (teamId) => callbacksRef.current.onHintClearRequest(teamId),
      onRequestSync: () => callbacksRef.current.onRequestSync(),
      onPresenceUpdate: (p) => setPresence(p),
      onCaptainDisconnect: () => {
        setIsCaptainDisconPaused(true);
      },
    }) : null
  );

  const handleDisconnectAll = () => {
    bridge?.disconnectAll();
    setIsCaptainDisconPaused(false);
    setPresence({ captainRed: false, captainBlue: false, playerView: false, spectatorCaptain: false });
  };

  useEffect(() => {
    if (bridge) {
      bridge.syncState(matchState);
    }
  }, [matchState, bridge]);

  useEffect(() => {
    return () => {
      bridge?.destroy();
    };
  }, [bridge]);

  const selectedMode =
    hubContent.modePicker.modes.find((m) => m.id === selectedModeId) ??
    hubContent.modePicker.modes[0];
  const selectedSettingsTab =
    hubContent.settingsPanel.tabs.find((t) => t.id === selectedSettingsTabId) ??
    hubContent.settingsPanel.tabs[0];
  const isPlaySection = activeSection === "play";

  function cycleMode(offset: -1 | 1) {
    setSelectedModeId(
      getHubNextModeId(hubContent.modePicker.modes, selectedModeId, offset),
    );
  }

  function handleStartSetup() {
    if (!selectedMode || !isHubModePlayable(selectedMode)) return;
    setIsSetupOpen(true);
  }

  // ─── Setup handlers ────────────────────────
  const handleTeamNameChange = (teamId: TeamId, name: string) =>
    setMatchState((s) => updateTeamName(s, teamId, name));

  const handleTeamAvatarChange = (
    teamId: TeamId,
    avatar: MatchState["settings"]["teams"][0]["avatar"],
  ) => setMatchState((s) => updateTeamAvatar(s, teamId, avatar));

  const handleCategoryChange = (category: MatchState["settings"]["category"]) =>
    setMatchState((s) => updateCategory(s, category));

  const handleAssassinCountChange = (count: number) =>
    setMatchState((s) => updateAssassinCount(s, count));

  const handleRoundsToWinChange = (rounds: number) =>
    setMatchState((s) => updateRoundsToWin(s, rounds));

  // Shared helper — prepares and launches a round, detects pool exhaustion
  const launchRound = (prepare: (s: MatchState) => MatchState) => {
    setMatchState((s) => {
      const category = s.settings.category!;
      const exhausted = isPoolExhausted(category);
      if (exhausted) setPoolJustReset(true);
      const usedWords = loadUsedWords(category);
      const next = startNewRound(prepare(s), usedWords);
      const boardWords = next.round!.board.map((c) => c.word);
      // After getWordPool auto-reset, localStorage is empty — save only boardWords
      saveUsedWords(category, exhausted ? boardWords : [...usedWords, ...boardWords]);
      return next;
    });
  };

  const handleStartMatch = (skipConfirm = false) => {
    const captainsCount = (presence.captainRed ? 1 : 0) + (presence.captainBlue ? 1 : 0);
    const spectatorCount = presence.spectatorCaptain ? 1 : 0;

    if (captainsCount === 0 && spectatorCount === 0) {
      alert("Rozpoczęcie gry wymaga aktywnego podłączenia co najmniej jednego kapitana!");
      return;
    }

    // Single-captain confirmation: if only 1 of 2 captains is connected and we
    // haven't already confirmed, ask before starting.
    if (captainsCount === 1 && spectatorCount === 0 && !skipConfirm) {
      // Show confirm — handled by SetupScreen or native confirm
      const ok = window.confirm(
        "Połączony jest tylko jeden kapitan. Czy na pewno chcesz rozpocząć grę?"
      );
      if (!ok) return;
    }

    setStartPresence(presence);
    setIsCaptainDisconPaused(false);
    launchRound((s) => s);
    setIsSetupOpen(false);
    setActiveScreen("play");
  };

  // ─── Play handlers ─────────────────────────
  const handleRevealCard = (index: number) =>
    setMatchState((s) => revealCard(s, index));

  const handleAssassinResolve = (clickedBy: TeamId) =>
    setMatchState((s) => resolveAssassin(s, clickedBy));

  const handleNextRound = () => {
    launchRound(returnToSetup);
  };

  const handleSendHint = (word: string, count: number, teamId: TeamId) => {
    setMatchState((s) => updateHint(s, word, count, teamId));
  };

  const handleClearHint = (teamId: TeamId) => {
    setMatchState((s) => clearHint(s, teamId));
  };

  const handleRequestSync = () => {
    setMatchState((s) => ({ ...s }));
  };

  const handleResetMatch = () => {
    setMatchState((s) => resetMatch(s));
    setIsSetupOpen(true);
    setActiveScreen("hub");
  };

  const handleReplay = () => {
    launchRound(resetMatch);
  };

  const handleReturnToSetup = () => {
    setMatchState((s) => returnToSetup(s));
    setIsSetupOpen(true);
    setActiveScreen("hub");
  };

  // ─── Play screen ──────────────────────────
  if (activeScreen === "play" && matchState.round) {
    return (
      <>
        <PlayScreen
          state={matchState}
          onRevealCard={handleRevealCard}
          onAssassinResolve={handleAssassinResolve}
          onNextRound={handleNextRound}
          onResetMatch={handleResetMatch}
          onReplay={handleReplay}
          onReturnToSetup={handleReturnToSetup}
          poolJustReset={poolJustReset}
          onPoolResetAck={() => setPoolJustReset(false)}
        />
        {/* Captain disconnect pause overlay */}
        {isCaptainDisconPaused && (
          <TajniacyPairingModal
            isOpen
            sessionCode={sessionCode}
            presence={presence}
            isPauseMode
            onClose={() => {
              // Allow closing if either both are back (if started with 2) or the 1 is back (if started with 1)
              const redOk = !startPresence?.captainRed || presence.captainRed;
              const blueOk = !startPresence?.captainBlue || presence.captainBlue;
              if (redOk && blueOk) {
                setIsCaptainDisconPaused(false);
              }
            }}
            onDisconnectAll={handleDisconnectAll}
          />
        )}
      </>
    );
  }

  // ─── Hub screen ───────────────────────────
  return (
    <main className="app-shell app-shell--tajniacy-hub taj-hub-shell-bg taj-hub-centered-layout">
      <div className="ambient-orb taj-orb--primary" aria-hidden="true" />
      <div className="ambient-orb taj-orb--secondary" aria-hidden="true" />

      <div className="taj-hub-shell">
        {/* ─── Top bar ─── */}
        <header className="taj-hub-topbar" aria-label="Tajniacy">
          <div className="taj-hub-brand">
            <span className="taj-hub-brand__mark">🕵️</span>
            <span className="taj-hub-brand__text">
              {hubContent.topbar.brandLabel}
            </span>
          </div>
          <div className="taj-hub-topbar__actions">
            <button className="taj-hub-login-button" type="button">
              {hubContent.topbar.authLabel}
            </button>
          </div>
        </header>

        {/* ─── Main layout ─── */}
        <div className="taj-hub-layout">
          {/* ─── Sidebar ─── */}
          <aside className="taj-hub-sidebar" aria-label="Menu Tajniacy">
            <div className="taj-hub-sidebar__section">
              <p className="taj-hub-sidebar__eyebrow">Glowne menu</p>
              <nav className="taj-hub-sidebar__nav">
                {hubContent.sidebar.primaryItems.map((item) => (
                  <button
                    key={item.id}
                    className={
                      activeSection === item.id
                        ? "taj-hub-sidebar__item taj-hub-sidebar__item--active"
                        : "taj-hub-sidebar__item"
                    }
                    type="button"
                    aria-pressed={activeSection === item.id}
                    onClick={() => setActiveSection(item.id)}
                  >
                    <span className="material-symbols-outlined">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
            <div className="taj-hub-sidebar__exit">
              <Link className="taj-hub-sidebar__exit-link" to="/">
                <span className="material-symbols-outlined">logout</span>
                <span>Wroc do lobby</span>
              </Link>
            </div>
          </aside>

          {/* ─── Main content ─── */}
          <section className="taj-hub-main" aria-labelledby="hub-heading">
            <div className="taj-hub-main__intro">
              <div>
                <h1 id="hub-heading">
                  {isPlaySection
                    ? hubContent.heading
                    : hubContent.settingsPanel.heading}
                </h1>
                <p>
                  {isPlaySection
                    ? hubContent.description
                    : hubContent.settingsPanel.description}
                </p>
              </div>

              {isPlaySection ? (
                <div className="taj-hub-selector-status" aria-live="polite">
                  <span>
                    {hubContent.modePicker.modes.findIndex(
                      (m) => m.id === selectedMode.id,
                    ) + 1}{" "}
                    / {hubContent.modePicker.modes.length}
                  </span>
                  <div className="taj-hub-selector-status__dots" aria-hidden="true">
                    {hubContent.modePicker.modes.map((mode) => (
                      <span
                        key={mode.id}
                        className={
                          mode.id === selectedMode.id
                            ? "taj-hub-selector-status__dot taj-hub-selector-status__dot--active"
                            : "taj-hub-selector-status__dot"
                        }
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {isPlaySection ? (
              <>
                {/* ─── Mode cards carousel ─── */}
                <div className="taj-hub-card-rail">
                  <button
                    className="taj-hub-carousel-button"
                    type="button"
                    aria-label="Pokaz poprzedni tryb"
                    onClick={() => cycleMode(-1)}
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>

                  <div className="taj-hub-cards">
                    {hubContent.modePicker.modes.map((mode) => {
                      const isSelected = mode.id === selectedMode.id;
                      const isPlayable = isHubModePlayable(mode);

                      return (
                        <article
                          key={mode.id}
                          className={
                            isSelected
                              ? "taj-hub-mode-card taj-hub-mode-card--selected"
                              : "taj-hub-mode-card"
                          }
                        >
                          <div className="taj-hub-mode-card__hero">
                            <div className="taj-hub-mode-card__hero-art">
                              <span className="taj-hub-mode-card__hero-emoji">
                                {mode.id === "classic" ? "🕵️‍♂️" : "⚡"}
                              </span>
                            </div>
                            <div
                              className="taj-hub-mode-card__hero-overlay"
                              aria-hidden="true"
                            />
                            <div className="taj-hub-mode-card__badge-row">
                              <span
                                className={
                                  mode.featured
                                    ? "taj-hub-mode-card__badge taj-hub-mode-card__badge--featured"
                                    : "taj-hub-mode-card__badge taj-hub-mode-card__badge--muted"
                                }
                              >
                                {mode.statusLabel}
                              </span>
                            </div>
                          </div>

                          <div className="taj-hub-mode-card__body">
                            <div>
                              <h2>{mode.title}</h2>
                              <p>{mode.summary}</p>
                            </div>
                            <div className="taj-hub-mode-card__meta-row">
                              <span className="taj-hub-mode-card__meta">
                                <span className="material-symbols-outlined">
                                  {mode.metaIcon}
                                </span>
                                {mode.metaLabel}
                              </span>
                              <button
                                className={
                                  isSelected
                                    ? "taj-hub-mode-card__select taj-hub-mode-card__select--selected"
                                    : "taj-hub-mode-card__select"
                                }
                                type="button"
                                disabled={!isPlayable}
                                onClick={() => setSelectedModeId(mode.id)}
                              >
                                {isSelected && isPlayable
                                  ? "Wybrany"
                                  : mode.ctaLabel}
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  <button
                    className="taj-hub-carousel-button"
                    type="button"
                    aria-label="Pokaz nastepny tryb"
                    onClick={() => cycleMode(1)}
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>

                {/* ─── CTA ─── */}
                <div className="taj-hub-cta-row" aria-label="Start wybranego trybu">
                  <button
                    className="taj-hub-launch-button"
                    type="button"
                    disabled={!isHubModePlayable(selectedMode)}
                    onClick={handleStartSetup}
                  >
                    {hubContent.primaryActionLabel}
                  </button>
                </div>
              </>
            ) : activeSection === "settings" ? (
              /* ─── Settings panel ─── */
              <section
                className="taj-hub-settings"
                aria-labelledby="taj-hub-settings-heading"
              >
                <div
                  className="taj-hub-settings__tabs"
                  role="tablist"
                  aria-label="Zakladki ustawien Tajniacy"
                >
                  {hubContent.settingsPanel.tabs.map((tab) => {
                    const isActive = tab.id === selectedSettingsTabId;
                    return (
                      <button
                        key={tab.id}
                        id={`taj-hub-tab-${tab.id}`}
                        className={
                          isActive
                            ? "taj-hub-settings__tab taj-hub-settings__tab--active"
                            : "taj-hub-settings__tab"
                        }
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-controls={`taj-hub-tabpanel-${tab.id}`}
                        onClick={() => setSelectedSettingsTabId(tab.id)}
                      >
                        <span className="material-symbols-outlined">{tab.icon}</span>
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                <article
                  id={`taj-hub-tabpanel-${selectedSettingsTab.id}`}
                  className="taj-hub-settings__panel"
                  role="tabpanel"
                  aria-labelledby={`taj-hub-tab-${selectedSettingsTab.id}`}
                >
                  <div className="taj-hub-settings__panel-head">
                    <p className="taj-hub-settings__eyebrow">Panel systemowy</p>
                    <h2 id="taj-hub-settings-heading">
                      {selectedSettingsTab.title}
                    </h2>
                    <p>{selectedSettingsTab.description}</p>
                  </div>
                  <ul className="taj-hub-settings__list">
                    {selectedSettingsTab.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              </section>
            ) : (
              /* ─── Stats / History panel ─── */
              <section className="taj-hub-settings" aria-labelledby="stats-heading">
                <div className="taj-hub-settings__panel" style={{ width: '100%', gridColumn: 'span 2' }}>
                  <div className="taj-hub-settings__panel-head">
                    <p className="taj-hub-settings__eyebrow">Historia meczu</p>
                    <h2 id="stats-heading">Statystyki rozgrywki</h2>
                    <p>Podgląd wyników i przebiegu obecnego meczu.</p>
                  </div>

                  {matchState.roundHistory.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: 12 }}>history</span>
                      <p>Brak rozegranych rund w tym meczu.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 12 }}>
                      {matchState.roundHistory.map((record, i) => (
                        <div
                          key={i}
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            padding: 16,
                            borderRadius: 16,
                            border: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{
                              width: 40,
                              height: 40,
                              borderRadius: 10,
                              background: record.winner === 'red' ? '#E74C3C' : '#3498DB',
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: 18,
                              fontWeight: 900
                            }}>
                              {record.roundNumber}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800 }}>Runda {record.roundNumber}</div>
                              <div style={{ fontSize: 13, opacity: 0.6 }}>
                                Kategoria: {record.category === 'uncensored' ? 'Bez cenzury' : 'Standardowa'} • Zabójcy: {record.assassinCount}
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 900, fontSize: 18, color: record.winner === 'red' ? '#E74C3C' : '#3498DB' }}>
                              Wygrywa {record.winner === 'red' ? matchState.settings.teams[0].name : matchState.settings.teams[1].name}
                            </div>
                            <div style={{ fontSize: 13, opacity: 0.6 }}>
                              Wynik: {record.scoreAfter.red} : {record.scoreAfter.blue}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}
          </section>
        </div>


      </div>

      {/* ─── Setup overlay ─── */}
      {isSetupOpen ? (
        <div className="taj-hub-setup-overlay" role="presentation">
          <dialog
            className="taj-hub-setup-overlay__panel"
            open
            aria-label={`Setup trybu ${selectedMode.title}`}
            onKeyDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <SetupScreen
              sessionCode={sessionCode}
              presence={presence}
              settings={matchState.settings}
              matchScore={matchState.matchScore}
              roundHistory={matchState.roundHistory}
              onTeamNameChange={handleTeamNameChange}
              onTeamAvatarChange={handleTeamAvatarChange}
              onCategoryChange={handleCategoryChange}
              onAssassinCountChange={handleAssassinCountChange}
              onRoundsToWinChange={handleRoundsToWinChange}
              onStartMatch={handleStartMatch}
              onDisconnectAll={handleDisconnectAll}
              onClose={() => setIsSetupOpen(false)}
            />
          </dialog>
        </div>
      ) : null}
    </main>
  );
}
