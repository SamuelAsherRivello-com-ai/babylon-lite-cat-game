export type TiledAnimationFrame = Readonly<{ tileId: number; durationMs: number }>;
export type TiledTileset = Readonly<{ source: string; tileWidth: number; tileHeight: number; columns: number; tileCount: number; animations: ReadonlyMap<number, readonly TiledAnimationFrame[]> }>;

function attribute(source: string, name: string): string {
  const value = new RegExp(`\\b${name}=["']([^"']+)["']`).exec(source)?.[1];
  if (!value) throw new Error(`TSX is missing ${name}.`);
  return value;
}

function integer(value: string, name: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`TSX ${name} must be a positive integer.`);
  return parsed;
}

function nonNegativeInteger(value: string, name: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`TSX ${name} must be a non-negative integer.`);
  return parsed;
}

export function parseExternalTileset(source: string, xml: string): TiledTileset {
  const root = /<tileset\b([^>]*)>/.exec(xml)?.[1];
  if (!root) throw new Error(`TSX ${source} requires a tileset root.`);
  const tileWidth = integer(attribute(root, "tilewidth"), "tilewidth");
  const tileHeight = integer(attribute(root, "tileheight"), "tileheight");
  const columns = integer(attribute(root, "columns"), "columns");
  const tileCount = integer(attribute(root, "tilecount"), "tilecount");
  const animations = new Map<number, readonly TiledAnimationFrame[]>();
  for (const tile of xml.matchAll(/<tile\b([^>]*)>([\s\S]*?)<\/tile>/g)) {
    const id = nonNegativeInteger(attribute(tile[1]!, "id"), "tile id");
    const frames = [...tile[2]!.matchAll(/<frame\b([^>]*)\/?/g)].map((frame) => ({ tileId: nonNegativeInteger(attribute(frame[1]!, "tileid"), "frame tileid"), durationMs: integer(attribute(frame[1]!, "duration"), "frame duration") }));
    if (frames.length) animations.set(id, Object.freeze(frames));
  }
  return Object.freeze({ source, tileWidth, tileHeight, columns, tileCount, animations });
}

export function animationFrameAt(tileset: TiledTileset, tileId: number, elapsedMs: number): number {
  const frames = tileset.animations.get(tileId);
  if (!frames?.length) return tileId;
  const duration = frames.reduce((total, frame) => total + frame.durationMs, 0);
  let remaining = Math.max(0, elapsedMs) % duration;
  for (const frame of frames) { if (remaining < frame.durationMs) return frame.tileId; remaining -= frame.durationMs; }
  return frames[0]!.tileId;
}

export async function loadExternalTileset(mapUrl: string, source: string): Promise<TiledTileset> {
  const url = new URL(source, mapUrl).toString();
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to load TSX ${source} (${response.status}).`);
  return parseExternalTileset(source, await response.text());
}
