import assert from "node:assert/strict";
import test from "node:test";
import { resolveCatMovement } from "../src/game/cat-input.ts";
import { getRecoveryStatus } from "../src/game/cat-hangout-client.ts";
import { setCatCameraTarget, subscribeCatCameraTarget } from "../src/game/cat-camera.ts";

test("combines WASD, arrows, and virtual-stick movement without exceeding server bounds", () => {
  assert.deepEqual(resolveCatMovement(new Set(["w", "d"]), { x: 0, y: 0 }), { x: 1, y: -1 });
  const blended = resolveCatMovement(new Set(["arrowleft"]), { x: 0.8, y: 1.2 });
  assert.ok(Math.abs(blended.x + 0.2) < Number.EPSILON);
  assert.equal(blended.y, 1);
  assert.deepEqual(resolveCatMovement(new Set(), { x: 0, y: 0 }), { x: 0, y: 0 });
});

test("classifies full, expired, and interrupted-room recovery states", () => {
  assert.equal(getRecoveryStatus("Room is full"), "full");
  assert.equal(getRecoveryStatus("seat reservation expired"), "expired");
  assert.equal(getRecoveryStatus("Connection interrupted. Retrying…"), "disconnected");
  assert.equal(getRecoveryStatus("gateway unavailable"), "reconnecting");
});

test("publishes the predicted local cat as the renderer camera target", () => {
  const received: Array<{ x: number; y: number } | null> = [];
  const unsubscribe = subscribeCatCameraTarget((target) => received.push(target));
  setCatCameraTarget({ x: 128, y: 96 });
  unsubscribe();
  setCatCameraTarget(null);
  assert.deepEqual(received, [null, { x: 128, y: 96 }]);
});
