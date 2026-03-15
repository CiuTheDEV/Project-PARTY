import assert from "node:assert/strict";
import test from "node:test";

import { kalamburyMeta } from "./meta.ts";

test("Kalambury module is no longer marked as draft after migration", () => {
  assert.equal(kalamburyMeta.status, "stable");
});
