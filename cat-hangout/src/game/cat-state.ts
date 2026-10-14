import type { Cat, CatActivity } from "./room.ts";

export type MovementInput = Readonly<{ x: number; y: number; interact?: boolean }>;

const idleActivities: readonly CatActivity[] = ["idle", "sleep", "box", "food", "tree", "social"];
const botActivities: readonly CatActivity[] = ["walk", "sleep", "box", "food", "tree", "social"];

export function updateHumanCat(cat: Cat, input: MovementInput, idleRoll: number): Cat {
  const magnitude = Math.hypot(input.x, input.y);
  if (magnitude > 0) {
    const speed = 1.8;
    return { ...cat, x: cat.x + (input.x / magnitude) * speed, y: cat.y + (input.y / magnitude) * speed, activity: "walk" };
  }
  if (input.interact) return { ...cat, activity: "social" };
  return { ...cat, activity: idleActivities[Math.min(idleActivities.length - 1, Math.floor(idleRoll * idleActivities.length))]! };
}

export function updateBotCat(cat: Cat, roll: number): Cat {
  const activity = botActivities[Math.min(botActivities.length - 1, Math.floor(roll * botActivities.length))]!;
  if (activity !== "walk") return { ...cat, activity };
  const angle = roll * Math.PI * 2;
  return { ...cat, activity, x: cat.x + Math.cos(angle) * 1.1, y: cat.y + Math.sin(angle) * 1.1 };
}
