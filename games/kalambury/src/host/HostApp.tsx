import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  type KalamburyHubMode,
  type KalamburyHubSettingsTabId,
  getKalamburyHubContent,
  getKalamburyHubNextModeId,
  isKalamburyHubModePlayable,
} from "../manifest/hub-content";
import type { KalamburySetupPayload } from "../runtime/state-machine";
import { KalamburySymbolIcon } from "../shared/SymbolIcon";
import { getKalamburySetupModeContent } from "../shared/setup-content";
import type { KalamburyStorageLike } from "../shared/setup-storage";
import { PlayScreen } from "./PlayScreen";
import { SetupScreen } from "./SetupScreen";

type KalamburyHostAppProps = {
  initialModeId?: KalamburyHubMode["id"];
  sessionCode?: string;
  storage?: KalamburyStorageLike | null;
};

export function KalamburyHostApp({
  initialModeId,
  sessionCode,
  storage = null,
}: KalamburyHostAppProps) {
  const hubContent = getKalamburyHubContent();
  const [activeSection, setActiveSection] = useState<"play" | "settings">(
    "play",
  );
  const [selectedModeId, setSelectedModeId] = useState<KalamburyHubMode["id"]>(
    initialModeId ?? hubContent.modePicker.activeModeId,
  );
  const [selectedSettingsTabId, setSelectedSettingsTabId] =
    useState<KalamburyHubSettingsTabId>(hubContent.settingsPanel.activeTabId);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState<"hub" | "play">("hub");
  const [currentSetupPayload, setCurrentSetupPayload] =
    useState<KalamburySetupPayload | null>(null);

  useEffect(() => {
    if (!storage) {
      return;
    }

    let isCancelled = false;
    const storageKey = getKalamburySetupModeContent("classic").storageKey;
    void Promise.resolve(storage.getItem(storageKey)).then((rawPayload) => {
      if (isCancelled || !rawPayload) {
        return;
      }

      try {
        const parsed = JSON.parse(rawPayload) as KalamburySetupPayload;
        setCurrentSetupPayload(parsed);
      } catch {
        void storage.removeItem?.(storageKey);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [storage]);

  const selectedMode =
    hubContent.modePicker.modes.find((mode) => mode.id === selectedModeId) ??
    hubContent.modePicker.modes[0];
  const selectedSettingsTab =
    hubContent.settingsPanel.tabs.find(
      (tab) => tab.id === selectedSettingsTabId,
    ) ?? hubContent.settingsPanel.tabs[0];
  const isPlaySectionActive = activeSection === "play";

  function cycleMode(offset: -1 | 1) {
    setSelectedModeId(
      getKalamburyHubNextModeId(
        hubContent.modePicker.modes,
        selectedModeId,
        offset,
      ),
    );
  }

  function handleStartSetup() {
    if (!selectedMode || !isKalamburyHubModePlayable(selectedMode)) {
      return;
    }

    setIsSetupOpen(true);
  }

  if (activeScreen === "play" && currentSetupPayload) {
    return (
      <PlayScreen
        setupPayload={currentSetupPayload}
        sessionCode={sessionCode}
        onBackToHub={() => setActiveScreen("hub")}
      />
    );
  }

  return (
    <main className="app-shell app-shell--kalambury-hub app-shell--kalambury-hub-shell kal-hub-centered-layout">
      <div className="ambient-orb ambient-orb--primary" aria-hidden="true" />
      <div
        className="ambient-orb ambient-orb--kalambury-secondary"
        aria-hidden="true"
      />

      <div className="kal-hub-shell">
        <header className="kal-hub-topbar" aria-label="Kalambury">
          <div className="kal-hub-brand">
            <KalamburySymbolIcon
              className="kal-hub-brand__mark material-symbols-outlined"
              name="theater_comedy"
            />
            <span className="kal-hub-brand__text">
              {hubContent.topbar.brandLabel}
            </span>
          </div>

          <div className="kal-hub-topbar__actions">
            <button className="kal-hub-login-button" type="button">
              {hubContent.topbar.authLabel}
            </button>
          </div>
        </header>

        <div className="kal-hub-layout">
          <aside className="kal-hub-sidebar" aria-label="Menu Kalambury">
            <div className="kal-hub-sidebar__section">
              <p className="kal-hub-sidebar__eyebrow">Glowne menu</p>
              <nav className="kal-hub-sidebar__nav">
                {hubContent.sidebar.primaryItems.map((item) => (
                  <button
                    key={item.id}
                    className={
                      activeSection === item.id
                        ? "kal-hub-sidebar__item kal-hub-sidebar__item--active"
                        : "kal-hub-sidebar__item"
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

            <div className="kal-hub-sidebar__exit">
              <Link className="kal-hub-sidebar__exit-link" to="/">
                <span className="material-symbols-outlined">logout</span>
                <span>Wroc do lobby</span>
              </Link>
            </div>
          </aside>

          <section className="kal-hub-main" aria-labelledby="hub-heading">
            <div className="kal-hub-main__intro">
              <div>
                <h1 id="hub-heading">
                  {isPlaySectionActive
                    ? hubContent.heading
                    : hubContent.settingsPanel.heading}
                </h1>
                <p>
                  {isPlaySectionActive
                    ? hubContent.description
                    : hubContent.settingsPanel.description}
                </p>
              </div>

              {isPlaySectionActive ? (
                <div className="kal-hub-selector-status" aria-live="polite">
                  <span>
                    {hubContent.modePicker.modes.findIndex(
                      (mode) => mode.id === selectedMode.id,
                    ) + 1}{" "}
                    / {hubContent.modePicker.modes.length}
                  </span>
                  <div
                    className="kal-hub-selector-status__dots"
                    aria-hidden="true"
                  >
                    {hubContent.modePicker.modes.map((mode) => (
                      <span
                        key={mode.id}
                        className={
                          mode.id === selectedMode.id
                            ? "kal-hub-selector-status__dot kal-hub-selector-status__dot--active"
                            : "kal-hub-selector-status__dot"
                        }
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {isPlaySectionActive ? (
              <>
                <div className="kal-hub-card-rail">
                  <button
                    className="kal-hub-carousel-button"
                    type="button"
                    aria-label="Pokaz poprzedni tryb"
                    onClick={() => cycleMode(-1)}
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>

                  <div className="kal-hub-cards">
                    {hubContent.modePicker.modes.map((mode) => {
                      const isSelected = mode.id === selectedMode.id;
                      const isPlayable = isKalamburyHubModePlayable(mode);

                      return (
                        <article
                          key={mode.id}
                          className={
                            isSelected
                              ? "kal-hub-mode-card kal-hub-mode-card--selected"
                              : "kal-hub-mode-card"
                          }
                        >
                          <div className="kal-hub-mode-card__hero">
                            <img
                              src={mode.heroAsset}
                              alt={mode.heroAssetAlt}
                              decoding="async"
                            />
                            <div
                              className="kal-hub-mode-card__hero-overlay"
                              aria-hidden="true"
                            />
                            <div className="kal-hub-mode-card__badge-row">
                              <span
                                className={
                                  mode.featured
                                    ? "kal-hub-mode-card__badge kal-hub-mode-card__badge--featured"
                                    : "kal-hub-mode-card__badge kal-hub-mode-card__badge--muted"
                                }
                              >
                                {mode.statusLabel}
                              </span>
                            </div>
                          </div>

                          <div className="kal-hub-mode-card__body">
                            <div>
                              <h2>{mode.title}</h2>
                              <p>{mode.summary}</p>
                            </div>

                            <div className="kal-hub-mode-card__meta-row">
                              <span className="kal-hub-mode-card__meta">
                                <span className="material-symbols-outlined">
                                  {mode.metaIcon}
                                </span>
                                {mode.metaLabel}
                              </span>

                              <button
                                className={
                                  isSelected
                                    ? "kal-hub-mode-card__select kal-hub-mode-card__select--selected"
                                    : "kal-hub-mode-card__select"
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
                    className="kal-hub-carousel-button"
                    type="button"
                    aria-label="Pokaz nastepny tryb"
                    onClick={() => cycleMode(1)}
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>

                <div
                  className="kal-hub-cta-row"
                  aria-label="Start wybranego trybu"
                >
                  <button
                    className="kal-hub-launch-button"
                    type="button"
                    disabled={!isKalamburyHubModePlayable(selectedMode)}
                    onClick={handleStartSetup}
                  >
                    {hubContent.primaryActionLabel}
                  </button>
                </div>
              </>
            ) : (
              <section
                className="kal-hub-settings"
                aria-labelledby="kal-hub-settings-heading"
              >
                <div
                  className="kal-hub-settings__tabs"
                  role="tablist"
                  aria-label="Zakladki ustawien Kalambury"
                >
                  {hubContent.settingsPanel.tabs.map((tab) => {
                    const isActive = tab.id === selectedSettingsTabId;

                    return (
                      <button
                        key={tab.id}
                        id={`kal-hub-tab-${tab.id}`}
                        className={
                          isActive
                            ? "kal-hub-settings__tab kal-hub-settings__tab--active"
                            : "kal-hub-settings__tab"
                        }
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-controls={`kal-hub-tabpanel-${tab.id}`}
                        onClick={() => setSelectedSettingsTabId(tab.id)}
                      >
                        <span className="material-symbols-outlined">{tab.icon}</span>
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                <article
                  id={`kal-hub-tabpanel-${selectedSettingsTab.id}`}
                  className="kal-hub-settings__panel"
                  role="tabpanel"
                  aria-labelledby={`kal-hub-tab-${selectedSettingsTab.id}`}
                >
                  <div className="kal-hub-settings__panel-head">
                    <p className="kal-hub-settings__eyebrow">Panel systemowy</p>
                    <h2 id="kal-hub-settings-heading">
                      {selectedSettingsTab.title}
                    </h2>
                    <p>{selectedSettingsTab.description}</p>
                  </div>

                  <ul className="kal-hub-settings__list">
                    {selectedSettingsTab.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              </section>
            )}
          </section>
        </div>

      </div>

      {isSetupOpen ? (
        <div className="kal-hub-setup-overlay" role="presentation">
          <dialog
            className="kal-hub-setup-overlay__panel"
            open
            aria-label={`Setup trybu ${selectedMode.title}`}
            onKeyDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <SetupScreen
              embedded
              modeId={selectedMode.id}
              sessionCode={sessionCode}
              storage={storage}
              onClose={() => setIsSetupOpen(false)}
              onStartRound={(payload) => {
                const storageKey = getKalamburySetupModeContent(
                  payload.mode,
                ).storageKey;
                void storage?.setItem(storageKey, JSON.stringify(payload));
                setCurrentSetupPayload(payload);
                setIsSetupOpen(false);
                setActiveScreen("play");
              }}
            />
          </dialog>
        </div>
      ) : null}
    </main>
  );
}
