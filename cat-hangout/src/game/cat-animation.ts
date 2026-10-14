import type { CatActivity } from "./room.ts";

export type AnimationDefinition = Readonly<{ name: "walk" | "idle" | "sleep" | "box"; frames: readonly number[]; frameMs: number }>;

export const catAnimations: Readonly<Record<AnimationDefinition["name"], AnimationDefinition>> = Object.freeze({
  walk: { name: "walk", frames: [0, 1, 2, 3], frameMs: 110 },
  idle: { name: "idle", frames: [0, 1], frameMs: 520 },
  sleep: { name: "sleep", frames: [4, 5], frameMs: 780 },
  box: { name: "box", frames: [6, 7], frameMs: 360 },
});

export function animationForActivity(activity: CatActivity): AnimationDefinition {
  if (activity === "walk") return catAnimations.walk;
  if (activity === "sleep") return catAnimations.sleep;
  if (activity === "box") return catAnimations.box;
  return catAnimations.idle;
}

export function frameAt(animation: AnimationDefinition, elapsedMs: number) {
  const index = Math.floor(Math.max(0, elapsedMs) / animation.frameMs) % animation.frames.length;
  return animation.frames[index]!;
}
