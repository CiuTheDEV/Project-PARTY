import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

import type { KalamburySetupPayload } from "../runtime/state-machine";
import {
  type KalamburyPresenterChannel,
  createKalamburyPresenterHostBridge,
} from "../shared/presenter-bridge";
import {
  type KalamburyModeSection,
  type KalamburyModeSettings,
  type KalamburyPlayerDraft,
  type KalamburyPlayerGender,
  addRandomKalamburySetupPlayer,
  clearKalamburyCategories,
  createInitialKalamburyPlayerDraft,
  createInitialKalamburySetupState,
  createKalamburySetupPlayerFromDraft,
  getKalamburyActiveCategoryId,
  getKalamburyAvatarOptionById,
  getKalamburyModeSettingSummaries,
  getKalamburySetupModeContent,
  randomizeKalamburyCategories,
  removeKalamburySetupPlayer,
  resolveKalamburyCategorySelection,
  selectAllKalamburyCategories,
  toggleKalamburyCategoryDifficulty,
} from "../shared/setup-content";
import {
  type KalamburyStorageLike,
  createKalamburySetupDraftStorageKey,
  loadKalamburySetupDraft,
  saveKalamburySetupDraft,
} from "../shared/setup-storage";
import { getTransportMode } from "../transport/index";
import { cloneModeSettings, normalizeModeSettings } from "../shared/setup-ui";
import {
  KalamburyAddPlayerModal,
  KalamburyModeSettingsModal,
  KalamburyPresenterQrModal,
} from "./setup-modals";
import {
  KalamburyCategoriesPanel,
  KalamburyModeSummaryPanel,
  KalamburyPlayersPanel,
  KalamburyPresenterDevicePanel,
  KalamburySetupFooter,
} from "./setup-sections";

const initialKalamburySetupState = createInitialKalamburySetupState();
const REUSABLE_RUNTIME_SESSION_KEY = "reusable-session";

function buildControllerHref(sessionCode: string | undefined): string | undefined {
  const mode = getTransportMode();
  // broadcast is local-only (same device), QR pairing doesn't apply
  if (mode === "broadcast") {
    return undefined;
  }
  if (!sessionCode) {
    return undefined;
  }
  if (mode === "firebase") {
    return `/games/kalambury/controller/${sessionCode}?transport=firebase`;
  }
  // do-ws (default)
  return `/games/kalambury/controller/${sessionCode}`;
}

type SetupScreenProps = {
  embedded?: boolean;
  modeId?: "classic" | "team";
  sessionCode?: string;
  channel?: KalamburyPresenterChannel;
  storage?: KalamburyStorageLike | null;
  onClose?: () => void;
  onStartRound: (payload: KalamburySetupPayload) => void;
};

export function SetupScreen({
  embedded = false,
  onClose,
  modeId = "classic",
  sessionCode,
  channel,
  storage = null,
  onStartRound,
}: SetupScreenProps) {
  const setupModeContent = getKalamburySetupModeContent(modeId);
  const setupDraftStorageKey = createKalamburySetupDraftStorageKey(
    setupModeContent.storageKey,
  );
  const [players, setPlayers] = useState(initialKalamburySetupState.players);
  const [modeSettings, setModeSettings] = useState<KalamburyModeSettings>(
    initialKalamburySetupState.modeSettings,
  );
  const [modeSettingsDraft, setModeSettingsDraft] =
    useState<KalamburyModeSettings>(
      cloneModeSettings(initialKalamburySetupState.modeSettings),
    );
  const [activeModeSection, setActiveModeSection] =
    useState<KalamburyModeSection>("rounds");
  const [presenterDeviceEnabled, setPresenterDeviceEnabled] = useState(
    initialKalamburySetupState.presenterDeviceEnabled,
  );
  const [presenterDeviceConnected, setPresenterDeviceConnected] =
    useState(false);
  const [pairedPresenterDeviceId, setPairedPresenterDeviceId] = useState<
    string | null
  >(initialKalamburySetupState.pairedPresenterDeviceId);
  const [categories, setCategories] = useState(
    initialKalamburySetupState.categories,
  );
  const [activeCategoryId, setActiveCategoryId] = useState(
    initialKalamburySetupState.activeCategoryId,
  );
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);
  const [isModeSettingsOpen, setIsModeSettingsOpen] = useState(false);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [activePlayerActionsId, setActivePlayerActionsId] = useState<
    string | null
  >(null);
  const [playerDraft, setPlayerDraft] = useState<KalamburyPlayerDraft>(
    createInitialKalamburyPlayerDraft(),
  );
  const [setupFeedback, setSetupFeedback] = useState("");
  const [isDraftHydrated, setIsDraftHydrated] = useState(false);
  const [isPresenterQrOpen, setIsPresenterQrOpen] = useState(false);
  const presenterBridgeRef = useRef<ReturnType<
    typeof createKalamburyPresenterHostBridge
  > | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function hydrateDraft() {
      setIsDraftHydrated(false);

      if (!storage) {
        if (!isCancelled) {
          setIsDraftHydrated(true);
        }
        return;
      }

      const persistedSetupState = await loadKalamburySetupDraft(
        storage,
        setupDraftStorageKey,
        initialKalamburySetupState,
      );

      if (isCancelled) {
        return;
      }

      setPlayers(persistedSetupState.players);
      setModeSettings(persistedSetupState.modeSettings);
      setModeSettingsDraft(cloneModeSettings(persistedSetupState.modeSettings));
      setPresenterDeviceEnabled(persistedSetupState.presenterDeviceEnabled);
      setPairedPresenterDeviceId(persistedSetupState.pairedPresenterDeviceId);
      setCategories(persistedSetupState.categories);
      setActiveCategoryId(persistedSetupState.activeCategoryId);
      setIsDraftHydrated(true);
    }

    void hydrateDraft();

    return () => {
      isCancelled = true;
    };
  }, [setupDraftStorageKey, storage]);

  useEffect(() => {
    if (!isDraftHydrated) {
      return;
    }

    void saveKalamburySetupDraft(storage, setupDraftStorageKey, {
      ...initialKalamburySetupState,
      players,
      modeSettings,
      presenterDeviceEnabled,
      pairedPresenterDeviceId,
      categories,
      activeCategoryId,
    });
  }, [
    activeCategoryId,
    categories,
    isDraftHydrated,
    modeSettings,
    pairedPresenterDeviceId,
    players,
    presenterDeviceEnabled,
    setupDraftStorageKey,
    storage,
  ]);

  useEffect(() => {
    if (!presenterDeviceEnabled || !sessionCode) {
      setPresenterDeviceConnected(false);
      presenterBridgeRef.current = null;
      return;
    }

    setPresenterDeviceConnected(false);
    const bridge = createKalamburyPresenterHostBridge(sessionCode, {
      channel,
      initialPairedDeviceId: pairedPresenterDeviceId,
      onPairingChange: ({ connected, pairedDeviceId: nextPairedDeviceId }) => {
        setPresenterDeviceConnected(connected);
        setPairedPresenterDeviceId(nextPairedDeviceId);
        if (connected && nextPairedDeviceId) {
          setIsPresenterQrOpen(false);
        }
      },
    });
    presenterBridgeRef.current = bridge;

    return () => {
      if (presenterBridgeRef.current === bridge) {
        presenterBridgeRef.current = null;
      }
      bridge.destroy();
    };
  }, [presenterDeviceEnabled, sessionCode]);

  useEffect(() => {
    if (!isModeSettingsOpen && !isAddPlayerOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      if (isAddPlayerOpen) {
        closeAddPlayerModal();
        return;
      }

      setIsModeSettingsOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAddPlayerOpen, isModeSettingsOpen]);

  const modeSummaries = getKalamburyModeSettingSummaries(modeSettings);
  const selectedCategoriesCount = categories.filter(
    (category) => category.isSelected,
  ).length;
  const activeCategory = categories.find(
    (category) => category.id === activeCategoryId,
  );
  const presenterDeviceBlockingStart =
    presenterDeviceEnabled &&
    (!presenterDeviceConnected || !pairedPresenterDeviceId);
  const canStart =
    players.length >= 2 &&
    selectedCategoriesCount > 0 &&
    !presenterDeviceBlockingStart;
  const selectedAvatar =
    playerDraft.avatarId !== null
      ? getKalamburyAvatarOptionById(playerDraft.avatarId)
      : null;
  const canSavePlayerDraft =
    playerDraft.name.trim().length >= 3 &&
    playerDraft.avatarId !== null &&
    playerDraft.gender !== null;

  function syncCategories(
    nextCategories: typeof categories,
    preferredId: string,
  ) {
    setCategories(nextCategories);
    setActiveCategoryId(
      getKalamburyActiveCategoryId(nextCategories, preferredId),
    );
  }

  function updateModeDraft(
    updater: (current: KalamburyModeSettings) => KalamburyModeSettings,
  ) {
    setModeSettingsDraft((current) => normalizeModeSettings(updater(current)));
  }

  function handleRemovePlayer(playerId: string) {
    setActivePlayerActionsId((current) =>
      current === playerId ? null : current,
    );
    setPlayers((currentPlayers) =>
      removeKalamburySetupPlayer(currentPlayers, playerId, 2),
    );
  }

  function openAddPlayerModal() {
    setEditingPlayerId(null);
    setActivePlayerActionsId(null);
    setPlayerDraft(createInitialKalamburyPlayerDraft());
    setIsAddPlayerOpen(true);
  }

  function openEditPlayerModal(playerId: string) {
    const player = players.find((entry) => entry.id === playerId);

    if (!player) {
      return;
    }

    setEditingPlayerId(playerId);
    setActivePlayerActionsId(null);
    setPlayerDraft({
      name: player.name,
      avatarId: player.avatarId,
      avatarCategory: player.avatarCategory,
      gender: player.gender,
    });
    setIsAddPlayerOpen(true);
  }

  function closeAddPlayerModal() {
    setIsAddPlayerOpen(false);
    setEditingPlayerId(null);
    setPlayerDraft(createInitialKalamburyPlayerDraft());
  }

  function savePlayerDraft() {
    if (!canSavePlayerDraft) {
      return;
    }

    const playerId =
      editingPlayerId ?? ["player", players.length + 1, Date.now()].join("-");
    const nextPlayer = createKalamburySetupPlayerFromDraft(playerId, {
      ...playerDraft,
      name: playerDraft.name.trim(),
      gender: playerDraft.gender as KalamburyPlayerGender,
      avatarId: playerDraft.avatarId,
    });

    setPlayers((currentPlayers) =>
      editingPlayerId
        ? currentPlayers.map((player) =>
            player.id === editingPlayerId ? nextPlayer : player,
          )
        : [...currentPlayers, nextPlayer],
    );
    closeAddPlayerModal();
  }

  function clearReusableSession() {
    return storage?.setItem(REUSABLE_RUNTIME_SESSION_KEY, JSON.stringify(null));
  }

  async function disconnectPresenterDevice() {
    presenterBridgeRef.current?.disconnectPresenterDevice();
    await clearReusableSession();
    setPresenterDeviceConnected(false);
    setPairedPresenterDeviceId(null);
    setIsPresenterQrOpen(false);
  }

  return (
    <main
      className={
        embedded
          ? "app-shell app-shell--kalambury-setup app-shell--embedded"
          : "app-shell app-shell--kalambury-setup"
      }
    >
      <div className="ambient-orb ambient-orb--primary" aria-hidden="true" />
      <div
        className="ambient-orb ambient-orb--kalambury-secondary"
        aria-hidden="true"
      />

      <section className="hero hero--kalambury-setup" style={setupShellStyle}>
        <div className="kalambury-setup__header" style={headerStyle}>
          <h1 style={titleStyle}>Kalambury</h1>
          <p className="lead" style={subtitleStyle}>
            Konfiguracja meczu
          </p>
          {embedded && onClose ? (
            <button
              className="kalambury-setup__close"
              type="button"
              aria-label="Zamknij"
              onClick={onClose}
            >
              X
            </button>
          ) : null}
        </div>

        <KalamburyPlayersPanel
          description={setupModeContent.description}
          players={players}
          minPlayers={2}
          maxPlayers={12}
          activePlayerActionsId={activePlayerActionsId}
          onTogglePlayerActions={(playerId) =>
            setActivePlayerActionsId((current) =>
              current === playerId ? null : playerId,
            )
          }
          onEditPlayer={openEditPlayerModal}
          onRemovePlayer={handleRemovePlayer}
          onAddPlayer={openAddPlayerModal}
          onAddRandomPlayer={() =>
            setPlayers((currentPlayers) =>
              addRandomKalamburySetupPlayer(currentPlayers, 12),
            )
          }
        />

        <KalamburyModeSummaryPanel
          summaries={modeSummaries}
          onOpenSettings={() => {
            setModeSettingsDraft(cloneModeSettings(modeSettings));
            setActiveModeSection("rounds");
            setIsModeSettingsOpen(true);
          }}
        />

        <KalamburyPresenterDevicePanel
          presenterDeviceConnected={presenterDeviceConnected}
          presenterDeviceBlockingStart={presenterDeviceBlockingStart}
          onOpenPresenterQr={() => {
            setPresenterDeviceEnabled(true);
            setIsPresenterQrOpen(true);
          }}
          onDisconnectPresenterDevice={() => {
            void disconnectPresenterDevice();
          }}
        />

        <KalamburyCategoriesPanel
          isExpanded={isCategoriesExpanded}
          selectedCategoriesCount={selectedCategoriesCount}
          categories={categories}
          activeCategory={activeCategory}
          onToggleExpanded={() =>
            setIsCategoriesExpanded((current) => !current)
          }
          onToggleCategory={(categoryId) => {
            const nextState = resolveKalamburyCategorySelection(
              categories,
              activeCategoryId,
              categoryId,
            );
            syncCategories(nextState.categories, nextState.activeCategoryId);
          }}
          onToggleDifficulty={(categoryId, difficulty) => {
            syncCategories(
              toggleKalamburyCategoryDifficulty(
                categories,
                categoryId,
                difficulty,
              ),
              categoryId,
            );
          }}
          onSelectAll={() =>
            syncCategories(
              selectAllKalamburyCategories(categories),
              activeCategoryId,
            )
          }
          onRandomize={() =>
            syncCategories(
              randomizeKalamburyCategories(categories),
              activeCategoryId,
            )
          }
          onClear={() =>
            syncCategories(clearKalamburyCategories(categories), "")
          }
        />

        <KalamburySetupFooter
          canStart={canStart}
          startLabel={setupModeContent.startLabel}
          onStart={async () => {
            if (!canStart) {
              return;
            }

            const payload: KalamburySetupPayload = {
              gameSlug: "kalambury",
              mode: setupModeContent.modeId,
              players,
              modeSettings,
              presenterDevice: {
                enabled: presenterDeviceEnabled,
                connected: presenterDeviceConnected,
                pairedDeviceId: pairedPresenterDeviceId,
              },
              categories: categories.filter((category) => category.isSelected),
              savedAt: new Date().toISOString(),
            };

            await storage?.setItem(
              setupModeContent.storageKey,
              JSON.stringify(payload),
            );
            setSetupFeedback("Setup zapisany lokalnie. Przechodze do rundy...");
            onStartRound(payload);
          }}
        />

        {setupFeedback ? (
          <p className="kalambury-setup__feedback">{setupFeedback}</p>
        ) : null}
      </section>

      <KalamburyModeSettingsModal
        isOpen={isModeSettingsOpen}
        activeModeSection={activeModeSection}
        onActiveModeSectionChange={setActiveModeSection}
        modeSettingsDraft={modeSettingsDraft}
        updateModeDraft={updateModeDraft}
        onClose={() => setIsModeSettingsOpen(false)}
        onSave={() => {
          setModeSettings(normalizeModeSettings(modeSettingsDraft));
          setIsModeSettingsOpen(false);
        }}
      />

      <KalamburyAddPlayerModal
        isOpen={isAddPlayerOpen}
        title={editingPlayerId ? "Edytuj gracza" : "Dodaj gracza"}
        saveLabel={editingPlayerId ? "Zapisz" : "Gotowe"}
        playerDraft={playerDraft}
        setPlayerDraft={setPlayerDraft}
        selectedAvatar={selectedAvatar}
        canSavePlayerDraft={canSavePlayerDraft}
        onClose={closeAddPlayerModal}
        onSave={savePlayerDraft}
      />

      <KalamburyPresenterQrModal
        isOpen={isPresenterQrOpen}
        sessionCode={sessionCode}
        controllerHref={buildControllerHref(sessionCode)}
        onClose={() => setIsPresenterQrOpen(false)}
        connected={presenterDeviceConnected}
        onDisconnect={() => {
          void disconnectPresenterDevice();
        }}
      />
    </main>
  );
}

const setupShellStyle: CSSProperties = {
  width: "min(100%, 1180px)",
  display: "flex",
  flexDirection: "column",
  gap: 20,
  padding: "32px 48px",
  boxSizing: "border-box",
};

const headerStyle: CSSProperties = {
  textAlign: "center",
  padding: "16px 0",
  position: "relative",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "2rem",
  fontWeight: 800,
  color: "#f7f8fa",
  letterSpacing: "-0.03em",
  fontStyle: "italic",
};

const subtitleStyle: CSSProperties = {
  margin: "4px 0 0",
  color: "#71717a",
  fontSize: 14,
};
