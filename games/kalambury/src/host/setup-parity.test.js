import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const setupSectionsSource = readFileSync(
  new URL("./setup-sections.tsx", import.meta.url),
  "utf8",
);
const setupModalsSource = readFileSync(
  new URL("./setup-modals.tsx", import.meta.url),
  "utf8",
);
const setupScreenSource = readFileSync(
  new URL("./SetupScreen.tsx", import.meta.url),
  "utf8",
);

test("player cards keep icon-based legacy actions instead of text placeholders", () => {
  assert.equal(setupSectionsSource.includes("function Pencil"), true);
  assert.equal(setupSectionsSource.includes("function UserRoundCog"), true);
  assert.equal(setupSectionsSource.includes("function X"), true);
  assert.equal(setupSectionsSource.includes("<Pencil"), true);
  assert.equal(setupSectionsSource.includes("<UserRoundCog"), true);
  assert.equal(setupSectionsSource.includes("<X"), true);
});

test("setup modals keep legacy iconography for infinity and gender chips", () => {
  assert.equal(setupModalsSource.includes("function InfinityIcon"), true);
  assert.equal(setupModalsSource.includes("function Venus"), true);
  assert.equal(setupModalsSource.includes("function Mars"), true);
  assert.equal(setupModalsSource.includes("<InfinityIcon"), true);
  assert.equal(setupModalsSource.includes("icon: Venus"), true);
  assert.equal(setupModalsSource.includes("icon: Mars"), true);
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
  assert.equal(setupSectionsSource.includes("Kod sesji"), false);
  assert.equal(setupSectionsSource.includes("Do telefonu"), false);
  assert.equal(setupSectionsSource.includes("Podlacz urzadzenie"), true);
  assert.equal(
    setupSectionsSource.includes('className="kalambury-addon-card__summary"'),
    false,
  );
  assert.equal(setupSectionsSource.includes("Rozlacz urzadzenie"), true);
  assert.equal(setupSectionsSource.includes("Anuluj dodatek"), false);
});

test("presenter device flow uses QR modal with local scan simulation", () => {
  assert.equal(setupModalsSource.includes("QR"), true);
  assert.equal(setupModalsSource.includes("Symuluj skan"), true);
  assert.equal(setupModalsSource.includes("window.open"), true);
});

const hostAppSource = readFileSync(new URL("./HostApp.tsx", import.meta.url), "utf8");

test("host app renders a dedicated sidebar exit back to the platform lobby", () => {
  assert.equal(hostAppSource.includes('to="/"'), true);
  assert.equal(hostAppSource.includes("Wroc do lobby"), true);
  assert.equal(hostAppSource.includes('name="logout"'), true);
  assert.equal(hostAppSource.includes("kal-hub-sidebar__exit"), true);
});

test("setup screen keeps presenter pairing and exposes manual disconnect separately from addon toggle", () => {
  assert.equal(setupScreenSource.includes("pairedPresenterDeviceId"), true);
  assert.equal(setupScreenSource.includes("onDisconnectPresenterDevice"), true);
  assert.equal(setupSectionsSource.includes("Rozlacz urzadzenie"), true);
});

test("setup screen keeps the presenter host bridge stable after pairing", () => {
  assert.equal(
    setupScreenSource.includes("}, [presenterDeviceEnabled, sessionCode]);"),
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
  assert.equal(setupSectionsSource.includes("kalambury-persona-card"), true);
  assert.equal(setupSectionsSource.includes("data-gender={player.gender}"), true);
  assert.equal(
    setupSectionsSource.includes("kalambury-persona-card__avatar"),
    true,
  );
  assert.equal(
    setupSectionsSource.includes("kalambury-persona-card__nameplate"),
    true,
  );
  assert.equal(setupSectionsSource.includes("kalambury-player-card__dice"), true);
  assert.equal(setupSectionsSource.includes("onAddRandomPlayer"), true);
  assert.equal(setupScreenSource.includes("addRandomKalamburySetupPlayer"), true);
});

test("add player modal colors the name field border by selected gender", () => {
  assert.equal(
    setupModalsSource.includes(
      '? "kalambury-player-name-input kalambury-player-name-input--female"',
    ),
    true,
  );
  assert.equal(
    setupModalsSource.includes(
      ': playerDraft.gender === "male"\n                      ? "kalambury-player-name-input kalambury-player-name-input--male"',
    ),
    true,
  );
});
