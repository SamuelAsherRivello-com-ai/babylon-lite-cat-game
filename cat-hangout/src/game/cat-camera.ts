export type CatCameraTarget = Readonly<{ x: number; y: number }>;
type Listener = (target: CatCameraTarget | null) => void;

let target: CatCameraTarget | null = null;
const listeners = new Set<Listener>();

export function setCatCameraTarget(next: CatCameraTarget | null) {
  target = next;
  for (const listener of listeners) listener(target);
}

export function subscribeCatCameraTarget(listener: Listener) {
  listeners.add(listener);
  listener(target);
  return () => listeners.delete(listener);
}
