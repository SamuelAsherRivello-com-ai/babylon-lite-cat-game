export const renderResolutionPresets = Object.freeze(["quarter", "half", "native", "double"] as const);

export type RenderPreset = typeof renderResolutionPresets[number];
export interface RenderResolutionInfo { preset: RenderPreset; width: number; height: number; nativeWidth: number; nativeHeight: number }

const PRESET_SCALE = Object.freeze({ quarter: 0.25, half: 0.5, native: 1, double: 2 });

export function isRenderResolutionPreset(value: unknown): value is RenderPreset {
  return typeof value === "string" && Object.hasOwn(PRESET_SCALE, value);
}

export function getRenderResolutionDimensions(nativeWidth: number, nativeHeight: number, preset: string = "native", maxTextureDimension2D = Infinity) {
  if (![nativeWidth, nativeHeight].every(Number.isFinite) || nativeWidth <= 0 || nativeHeight <= 0) {
    return { preset: isRenderResolutionPreset(preset) ? preset : "native", width: 0, height: 0, scale: 0 };
  }

  const width = Math.max(1, Math.floor(nativeWidth));
  const height = Math.max(1, Math.floor(nativeHeight));
  const normalizedPreset = isRenderResolutionPreset(preset) ? preset : "native";
  const desiredScale = PRESET_SCALE[normalizedPreset];
  const dimensionLimit = Number.isFinite(maxTextureDimension2D) && maxTextureDimension2D > 0
    ? Math.floor(maxTextureDimension2D)
    : Infinity;
  const limitScale = Math.min(dimensionLimit / width, dimensionLimit / height);
  const scale = desiredScale > 1 ? Math.min(desiredScale, limitScale) : desiredScale;
  const renderWidth = Math.max(1, Math.floor(width * scale));
  const renderHeight = Math.max(1, Math.floor(height * scale));

  return {
    preset: normalizedPreset,
    width: renderWidth,
    height: renderHeight,
    scale: Math.min(renderWidth / width, renderHeight / height),
  };
}

export function cycleRenderResolutionPreset(preset: string): RenderPreset {
  const current = isRenderResolutionPreset(preset) ? preset : "native";
  return renderResolutionPresets[(renderResolutionPresets.indexOf(current) + 1) % renderResolutionPresets.length]!;
}

// Babylon Lite's pinned SpriteRenderer derives its projection size from surface.canvas,
// even when setSpriteRendererTarget redirects its output to a texture. Give the scene
// renderer a surface view with target dimensions while sharing the engine's render
// context registry, device, encoder, and swapchain view. The presenter remains attached
// to the real engine surface and therefore uses the native canvas dimensions.
export function createRenderTargetSurfaceView<T extends { canvas: { width: number; height: number } }>(engine: T, width: number, height: number): T {
  // Prototype delegation retains the pinned engine contract; only canvas dimensions differ.
  const surface: T = Object.create(engine);
  Object.defineProperty(surface, "canvas", {
    value: { width, height },
    enumerable: true,
  });
  return surface;
}
