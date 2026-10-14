export const MAX_HUMANS = 12;
export const MIN_CATS = 4;
export const MAX_BOTS = 3;

export type CatKind = "human" | "bot";
export type CatActivity = "idle" | "walk" | "sleep" | "box" | "food" | "tree" | "social";
export type Cat = Readonly<{ id: string; kind: CatKind; number: number; name: string; color: string; activity: CatActivity; x: number; y: number }>;

const names = ["Mochi", "Pochi", "Nori", "Miso", "Soba", "Yuzu", "Taro", "Kumo", "Pip", "Bean", "Luna", "Marmalade"];
const colors = ["#ff7b72", "#79c0ff", "#d2a8ff", "#7ee787", "#ffa657", "#f2cc60", "#ff9bce", "#56d4dd", "#c9d1d9", "#a5d6ff", "#e3b341", "#8ddb8c"];

export function botCount(humanCount: number) {
  if (!Number.isInteger(humanCount) || humanCount < 0 || humanCount > MAX_HUMANS) throw new RangeError("humanCount must be an integer from 0 to 12");
  return Math.min(MAX_BOTS, Math.max(0, MIN_CATS - humanCount));
}

export function createRoomCats(humanCount: number): Cat[] {
  const bots = botCount(humanCount);
  return Array.from({ length: humanCount + bots }, (_, index) => ({
    id: index < humanCount ? `human-${index + 1}` : `bot-${index - humanCount + 1}`,
    kind: index < humanCount ? "human" : "bot",
    number: index + 1,
    name: names[index] ?? `Cat ${index + 1}`,
    color: colors[index] ?? "#ffffff",
    activity: "idle",
    x: 80 + (index % 4) * 56,
    y: 74 + Math.floor(index / 4) * 46,
  }));
}
