export type MovementVector = Readonly<{ x: number; y: number }>;

const clamp = (value: number) => Math.max(-1, Math.min(1, value));

/** Combines keyboard and virtual-stick input into the authoritative room format. */
export function resolveCatMovement(keys: ReadonlySet<string>, touch: MovementVector): MovementVector {
  const x = (keys.has("d") || keys.has("arrowright") ? 1 : 0) - (keys.has("a") || keys.has("arrowleft") ? 1 : 0) + touch.x;
  const y = (keys.has("s") || keys.has("arrowdown") ? 1 : 0) - (keys.has("w") || keys.has("arrowup") ? 1 : 0) + touch.y;
  return { x: clamp(x), y: clamp(y) };
}
