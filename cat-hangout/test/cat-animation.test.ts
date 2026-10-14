import assert from "node:assert/strict";
import test from "node:test";
import { animationForActivity, catAnimations, frameAt } from "../src/game/cat-animation.ts";

test("selects walking, sleep, box, and idle animation contracts", () => {
  assert.equal(animationForActivity("walk"), catAnimations.walk);
  assert.equal(animationForActivity("sleep"), catAnimations.sleep);
  assert.equal(animationForActivity("box"), catAnimations.box);
  assert.equal(animationForActivity("food"), catAnimations.idle);
});

test("advances tilesheet frames at the declared duration", () => {
  assert.equal(frameAt(catAnimations.walk, 0), 0);
  assert.equal(frameAt(catAnimations.walk, 110), 1);
  assert.equal(frameAt(catAnimations.walk, 440), 0);
});
