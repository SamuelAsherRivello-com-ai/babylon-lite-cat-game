import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { validateCatHangoutMap } from "../src/game/tiled-map.ts";

const map = { type: "map", orientation: "orthogonal", width: 2, height: 2, tilewidth: 32, tileheight: 32, layers: [
  { name: "Collision", type: "tilelayer", data: [0, 0, 0, 1] },
  { name: "Activities", type: "objectgroup", objects: ["human-spawn", "bot-roam", "box", "rest", "food", "tree"].map((type) => ({ name: type, type, x: 0, y: 0 })) },
] } as const;

test("accepts a complete Tiled map contract", () => assert.doesNotThrow(() => validateCatHangoutMap(map)));
test("rejects a map without collision", () => assert.throws(() => validateCatHangoutMap({ ...map, layers: [map.layers[1]] }), /Collision/));
test("ships an editable Cat Hangout Tiled map with collision", () => {
  const shippedMap = JSON.parse(readFileSync("cat-hangout/public/maps/cat-hangout.tmj", "utf8"));
  assert.doesNotThrow(() => validateCatHangoutMap(shippedMap));
});
