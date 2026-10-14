import assert from "node:assert/strict";
import test from "node:test";
import { animationFrameAt, parseExternalTileset } from "../src/game/tiled-tileset.ts";

const tsx = `<?xml version="1.0"?><tileset tilewidth="32" tileheight="32" tilecount="4" columns="2"><tile id="0"><animation><frame tileid="0" duration="100"/><frame tileid="1" duration="200"/></animation></tile></tileset>`;

test("resolves external TSX geometry and its timed animation frames", () => {
  const tileset = parseExternalTileset("../tilesets/cat-furniture.tsx", tsx);
  assert.equal(tileset.columns, 2);
  assert.equal(animationFrameAt(tileset, 0, 0), 0);
  assert.equal(animationFrameAt(tileset, 0, 100), 1);
  assert.equal(animationFrameAt(tileset, 0, 300), 0);
});

test("rejects malformed external TSX references", () => {
  assert.throws(() => parseExternalTileset("bad.tsx", "<tileset tilewidth=\"32\"/>"), /tileheight/);
});
