export type TiledLayer = Readonly<{ name: string; type: "tilelayer" | "objectgroup"; data?: number[]; objects?: ReadonlyArray<{ name: string; type: string; x: number; y: number }> }>;
export type TiledMap = Readonly<{ type: "map"; orientation: "orthogonal"; width: number; height: number; tilewidth: number; tileheight: number; layers: readonly TiledLayer[] }>;

export const requiredObjectTypes = ["human-spawn", "bot-roam", "box", "rest", "food", "tree"] as const;

export function validateCatHangoutMap(value: unknown): asserts value is TiledMap {
  if (!value || typeof value !== "object") throw new Error("Map must be an object.");
  const map = value as Partial<TiledMap>;
  if (map.type !== "map" || map.orientation !== "orthogonal") throw new Error("Map must be an orthogonal Tiled map.");
  if (typeof map.width !== "number" || typeof map.height !== "number" || !Number.isInteger(map.width) || !Number.isInteger(map.height) || map.width < 1 || map.height < 1) throw new Error("Map dimensions must be positive integers.");
  if (typeof map.tilewidth !== "number" || typeof map.tileheight !== "number" || !Number.isInteger(map.tilewidth) || !Number.isInteger(map.tileheight) || map.tilewidth < 1 || map.tileheight < 1) throw new Error("Map tile dimensions must be positive integers.");
  const { width, height } = map;
  const layers = map.layers ?? [];
  const collision = layers.find((layer) => layer.type === "tilelayer" && layer.name === "Collision");
  if (!collision?.data || collision.data.length !== width * height) throw new Error("Map requires a Collision tile layer matching map dimensions.");
  const activities = layers.find((layer) => layer.type === "objectgroup" && layer.name === "Activities");
  if (!activities?.objects) throw new Error("Map requires an Activities object layer.");
  const types = new Set(activities.objects.map((object) => object.type));
  for (const required of requiredObjectTypes) if (!types.has(required)) throw new Error(`Activities layer is missing ${required}.`);
}
