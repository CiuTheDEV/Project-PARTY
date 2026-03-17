import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const playersPanelSource = readFileSync(
  new URL("./sections/PlayersPanel.tsx", import.meta.url),
  "utf8",
);
const presenterDevicePanelSource = readFileSync(
  new URL("./sections/PresenterDevicePanel.tsx", import.meta.url),
  "utf8",
);
const addPlayerModalSource = readFileSync(
  new URL("./modals/AddPlayerModal.tsx", import.meta.url),
  "utf8",
);
const presenterQrModalSource = readFileSync(
  new URL("./modals/PresenterQrModal.tsx", import.meta.url),
  "utf8",
);
const modeSettingsModalSource = readFileSync(
  new URL("./modals/ModeSettingsModal.tsx", import.meta.url),
  "utf8",
);
const setupScreenSource = readFileSync(
  new URL("./SetupScreen.tsx", import.meta.url),
  "utf8",
);

test("player cards keep icon-based legacy actions instead of text placeholders", () => {
  assert.equal(playersPanelSource.includes("function Pencil"), true);
  assert.equal(playersPanelSource.includes("function UserRoundCog"), true);
  assert.equal(playersPanelSource.includes("function X"), true);
  assert.equal(playersPanelSource.includes("<Pencil"), true);
  assert.equal(playersPanelSource.includes("<UserRoundCog"), true);
  assert.equal(playersPanelSource.includes("<X"), true);
});

test("setup modals keep legacy iconography for infinity and gender chips", () => {
  assert.equal(modeSettingsModalSource.includes("function InfinityIcon"), true);
  assert.equal(addPlayerModalSource.includes("function Venus"), true);
  assert.equal(addPlayerModalSource.includes("function Mars"), true);
  assert.equal(modeSettingsModalSource.includes("<InfinityIcon"), true);
  assert.equal(addPlayerModalSource.includes("icon: Venus"), true);
  assert.equal(addPlayerModalSource.includes("icon: Mars"), true);
});

test("setup screen keeps legacy shell accents and feedback copy", () => {
  assert.equal(
    setupScreenSource.includes('className="ambient-orb ambient-orb--primary"'),
    true,
  );
  assert.equal(
    setupScreenSource.includes(
      'className="ambient-orb ambient-orb--kalambury-secondary"',
    ),
    true,
  );
  assert.equal(
    setupScreenSource.includes(
      'setSetupFeedback("Setup zapisany lokalnie. Przechodze do rundy...");',
    ),
    true,
  );
});

test("setup screen hydrates persisted draft before autosave runs", () => {
  assert.equal(setupScreenSource.includes("isDraftHydrated"), true);
  assert.equal(setupScreenSource.includes("if (!isDraftHydrated)"), true);
  assert.equal(setupScreenSource.includes("setIsDraftHydrated(true);"), true);
});

test("setup screen renders presenter device join entry with session code", () => {
  assert.equal(setupScreenSource.includes("sessionCode={sessionCode}"), true);
  assert.equal(presenterDevicePanelSource.includes("Kod sesji"), false);
  assert.equal(presenterDevicePanelSource.includes("Do telefonu"), false);
  assert.equal(presenterDevicePanelSource.includes("Podlacz urzadzenie"), true);
  assert.equal(
    presenterDevicePanelSource.includes('className="kalambury-addon-card__summary"'),
    false,
  );
  assert.equal(presenterDevicePanelSource.includes("Anuluj dodatek"), false);
  assert.equal(presenterDevicePanelSource.includes("Rozlacz urzadzenie"), true);
});

test("presenter device flow uses QR modal with local scan simulation", () => {
  assert.equal(presenterQrModalSource.includes("QR"), true);
  assert.equal(presenterQrModalSource.includes("Symuluj skan"), true);
  assert.equal(presenterQrModalSource.includes("window.open"), true);
});

const hostAppSource = readFileSync(
  new URL("./HostApp.tsx", import.meta.url),
  "utf8",
);

test("host app renders a dedicated sidebar exit back to the platform lobby", () => {
  assert.equal(hostAppSource.includes('to="/"'), true);
  assert.equal(hostAppSource.includes("Wroc do lobby"), true);
  assert.equal(hostAppSource.includes('name="logout"'), true);
  assert.equal(hostAppSource.includes("kal-hub-sidebar__exit"), true);
});

test("setup screen keeps presenter pairing and exposes manual disconnect separately from addon toggle", () => {
  assert.equal(setupScreenSource.includes("pairedPresenterDeviceId"), true);
  assert.equal(setupScreenSource.includes("onDisconnectPresenterDevice"), true);
  assert.equal(presenterDevicePanelSource.includes("Rozlacz urzadzenie"), true);
});

test("setup screen keeps the presenter host bridge stable after pairing", () => {
  assert.equal(
    setupScreenSource.includes("usePresenterHostBridge"),
    true,
  );
  assert.equal(
    setupScreenSource.includes(
      "}, [pairedPresenterDeviceId, presenterDeviceEnabled, sessionCode]);",
    ),
    false,
  );
});

test("setup screen uses the shared player card anatomy for setup roster cards", () => {
  assert.equal(playersPanelSource.includes("kalambury-persona-card"), true);
  assert.equal(
    playersPanelSource.includes("data-gender={player.gender}"),
    true,
  );
  assert.equal(
    playersPanelSource.includes("kalambury-persona-card__avatar"),
    true,
  );
  assert.equal(
    playersPanelSource.includes("kalambury-persona-card__nameplate"),
    true,
  );
  assert.equal(
    playersPanelSource.includes("kalambury-player-card__dice"),
    true,
  );
  assert.equal(playersPanelSource.includes("onAddRandomPlayer"), true);
  assert.equal(
    setupScreenSource.includes("addRandomKalamburySetupPlayer"),
    true,
  );
});

test("add player modal colors the name field border by selected gender", () => {
  assert.equal(
    addPlayerModalSource.includes(
      '? "kalambury-player-name-input kalambury-player-name-input--female"',
    ),
    true,
  );
  assert.equal(
    addPlayerModalSource.includes(
      ': playerDraft.gender === "male"\n                      ? "kalambury-player-name-input kalambury-player-name-input--male"',
    ),
    true,
  );
});
