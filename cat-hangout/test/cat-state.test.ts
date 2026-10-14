import assert from "node:assert/strict";
import test from "node:test";
import { updateBotCat, updateHumanCat } from "../src/game/cat-state.ts";
import type { Cat } from "../src/game/room.ts";

const cat: Cat = { id: "human-1", kind: "human", number: 1, name: "Mochi", color: "#fff", activity: "idle", x: 5, y: 5 };

test("humans only walk from explicit input and otherwise choose idles", () => {
  assert.equal(updateHumanCat(cat, { x: 0, y: 0 }, 0.2).activity, "sleep");
  const moved = updateHumanCat(cat, { x: 1, y: 0 }, 0);
  assert.equal(moved.activity, "walk"); assert.ok(moved.x > cat.x);
});

test("bots select activities and wander when walking", () => {
  assert.equal(updateBotCat({ ...cat, kind: "bot" }, 0.5).activity, "food");
  const wandered = updateBotCat({ ...cat, kind: "bot" }, 0);
  assert.equal(wandered.activity, "walk"); assert.notEqual(wandered.x, cat.x);
});
