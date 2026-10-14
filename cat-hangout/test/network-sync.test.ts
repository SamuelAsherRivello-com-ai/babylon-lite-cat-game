import assert from "node:assert/strict";
import test from "node:test";
import { interpolatePosition, predictPosition, reconcilePosition } from "../src/game/network-sync.ts";

test("interpolates remote cats between authoritative snapshots", () => {
  assert.deepEqual(interpolatePosition({ x: 0, y: 10 }, { x: 20, y: 30 }, 0.25), { x: 5, y: 15 });
});

test("predicts local movement with normalized diagonal input", () => {
  const position = predictPosition({ x: 0, y: 0 }, { x: 1, y: 1 }, 1, 10);
  assert.ok(Math.abs(Math.hypot(position.x, position.y) - 10) < 0.001);
});

test("limits large reconciliation corrections", () => {
  assert.deepEqual(reconcilePosition({ x: 0, y: 0 }, { x: 100, y: 0 }, 12), { x: 12, y: 0 });
});
