import assert from "node:assert/strict";
import test from "node:test";

import { createInitialKalamburySetupState } from "./setup-content.ts";
import {
  createKalamburySetupDraftStorageKey,
  loadKalamburySetupDraft,
  saveKalamburySetupDraft,
} from "./setup-storage.ts";

function createMemoryStorage(initialEntries = {}) {
  const store = new Map(Object.entries(initialEntries));

  return {
    getItem(key: string): string | null {
      return store.has(key) ? String(store.get(key) ?? "") : null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
  };
}

test("saves and restores the persistent Kalambury setup draft", async () => {
  const baseState = createInitialKalamburySetupState();
  const storage = createMemoryStorage();
  const storageKey = createKalamburySetupDraftStorageKey(
    "project-party.kalambury.classic-setup",
  );

  await saveKalamburySetupDraft(storage, storageKey, baseState);

  const restored = await loadKalamburySetupDraft(
    storage,
    storageKey,
    createInitialKalamburySetupState(),
  );

  assert.equal(restored.players.length, baseState.players.length);
  assert.equal(restored.modeSettings.rounds.turnDurationSeconds, 15);
});

test("supports runtime storage adapters that return promises", async () => {
  const baseState = {
    ...createInitialKalamburySetupState(),
    presenterDeviceEnabled: true,
    pairedPresenterDeviceId: "device-a",
    activeCategoryId: "muzyka",
  };
  const storage = {
    data: new Map<string, string>(),
    async getItem(key: string): Promise<string | null> {
      return this.data.has(key) ? (this.data.get(key) ?? null) : null;
    },
    async setItem(key: string, value: string): Promise<void> {
      this.data.set(key, value);
    },
    async removeItem(key: string): Promise<void> {
      this.data.delete(key);
    },
  };
  const storageKey = createKalamburySetupDraftStorageKey(
    "project-party.kalambury.classic-setup",
  );

  await saveKalamburySetupDraft(storage, storageKey, baseState);
  const restored = await loadKalamburySetupDraft(
    storage,
    storageKey,
    createInitialKalamburySetupState(),
  );

  assert.equal(restored.presenterDeviceEnabled, true);
  assert.equal(restored.pairedPresenterDeviceId, "device-a");
  assert.equal(restored.activeCategoryId, "muzyka");
});
