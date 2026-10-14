export type Position = Readonly<{ x: number; y: number }>;

export function interpolatePosition(previous: Position, next: Position, alpha: number): Position {
  const clamped = Math.max(0, Math.min(1, alpha));
  return { x: previous.x + (next.x - previous.x) * clamped, y: previous.y + (next.y - previous.y) * clamped };
}

export function predictPosition(position: Position, input: Position, deltaSeconds: number, speed = 90): Position {
  const magnitude = Math.hypot(input.x, input.y);
  if (magnitude === 0 || deltaSeconds <= 0) return position;
  return { x: position.x + (input.x / magnitude) * speed * deltaSeconds, y: position.y + (input.y / magnitude) * speed * deltaSeconds };
}

export function reconcilePosition(predicted: Position, authoritative: Position, maximumCorrection = 12): Position {
  const deltaX = authoritative.x - predicted.x;
  const deltaY = authoritative.y - predicted.y;
  const distance = Math.hypot(deltaX, deltaY);
  if (distance <= maximumCorrection) return authoritative;
  return { x: predicted.x + (deltaX / distance) * maximumCorrection, y: predicted.y + (deltaY / distance) * maximumCorrection };
}
