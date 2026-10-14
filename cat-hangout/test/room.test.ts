import assert from "node:assert/strict";
import test from "node:test";
import { botCount, createRoomCats } from "../src/game/room.ts";

test("fills only the gap below four cats", () => {
  assert.equal(botCount(1), 3);
  assert.equal(botCount(2), 2);
  assert.equal(botCount(3), 1);
  assert.equal(botCount(4), 0);
  assert.equal(botCount(12), 0);
});

test("assigns readable identities", () => {
  const cats = createRoomCats(2);
  assert.equal(cats.length, 4);
  assert.equal(new Set(cats.map((cat) => cat.name)).size, 4);
  assert.deepEqual(cats.map((cat) => cat.kind), ["human", "human", "bot", "bot"]);
});
