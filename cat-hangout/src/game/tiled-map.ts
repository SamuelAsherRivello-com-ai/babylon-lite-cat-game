export type TiledLayer = Readonly<{ name: string; type: "tilelayer" | "objectgroup"; data?: readonly number[]; objects?: ReadonlyArray<{ name: string; type: string; x: number; y: number }> }>;
export type TiledMap = Readonly<{ type: "map"; orientation: "orthogonal"; width: number; height: number; tilewidth: number; tileheight: number; layers: readonly TiledLayer[]; tilesets?: readonly Readonly<{ firstgid: number; source?: string }>[] }>;

export const requiredObjectTypes = ["human-spawn", "bot-roam", "box", "rest", "food", "tree"] as const;

export function validateCatHangoutMap(value: unknown): asserts value is TiledMap {
  if (!value || typeof value !== "object") throw new Error("Map must be an object.");
  const map = value as Partial<TiledMap>;
  if (map.type !== "map" || map.orientation !== "orthogonal") throw new Error("Map must be an orthogonal Tiled map.");
  if (typeof map.width !== "number" || typeof map.height !== "number" || !Number.isInteger(map.width) || !Number.isInteger(map.height) || map.width < 1 || map.height < 1) throw new Error("Map dimensions must be positive integers.");
  if (typeof map.tilewidth !== "number" || typeof map.tileheight !== "number" || !Number.isInteger(map.tilewidth) || !Number.isInteger(map.tileheight) || map.tilewidth < 1 || map.tileheight < 1) throw new Error("Map tile dimensions must be positive integers.");
  const { width, height } = map;
  const layers = map.layers ?? [];
  for (const tileset of map.tilesets ?? []) {
    if (!Number.isInteger(tileset.firstgid) || tileset.firstgid < 1 || (tileset.source !== undefined && !tileset.source.endsWith(".tsx"))) throw new Error("Map tilesets must use valid TSX sources.");
  }
  const collision = layers.find((layer) => layer.type === "tilelayer" && layer.name === "Collision");
  if (!collision?.data || collision.data.length !== width * height) throw new Error("Map requires a Collision tile layer matching map dimensions.");
  const activities = layers.find((layer) => layer.type === "objectgroup" && layer.name === "Activities");
  if (!activities?.objects) throw new Error("Map requires an Activities object layer.");
  const types = new Set(activities.objects.map((object) => object.type));
  for (const required of requiredObjectTypes) if (!types.has(required)) throw new Error(`Activities layer is missing ${required}.`);
}

/** Returns whether a map-space point is inside a walkable collision cell. */
export function isCatHangoutMapWalkable(map: TiledMap, worldX: number, worldY: number): boolean {
  validateCatHangoutMap(map);
  if (!Number.isFinite(worldX) || !Number.isFinite(worldY)) return false;
  const column = Math.floor(worldX / map.tilewidth);
  const row = Math.floor(worldY / map.tileheight);
  if (column < 0 || row < 0 || column >= map.width || row >= map.height) return false;
  const collision = map.layers.find((layer) => layer.type === "tilelayer" && layer.name === "Collision");
  return collision?.data?.[row * map.width + column] === 0;
}
