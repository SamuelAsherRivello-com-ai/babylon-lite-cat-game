export type ConfigStorage = Pick<Storage, "getItem" | "setItem">;

export const projectConfigStorageKey = "github-repository-template.config";

export function readProjectConfig(storage: Pick<Storage, "getItem">): Record<string, unknown> {
  try {
    const saved: unknown = JSON.parse(storage.getItem(projectConfigStorageKey) ?? "null");
    return saved && typeof saved === "object" && !Array.isArray(saved) ? saved as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

export function writeProjectConfigPatch(storage: ConfigStorage, patch: Record<string, unknown>) {
  try {
    storage.setItem(projectConfigStorageKey, JSON.stringify({ ...readProjectConfig(storage), ...patch }));
    return true;
  } catch {
    return false;
  }
}
