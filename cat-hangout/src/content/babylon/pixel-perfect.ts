import { logicalResolution } from "./config.ts";

export function getLogicalToRenderScale(renderWidth: number, renderHeight: number, resolution = logicalResolution) {
  if (![renderWidth, renderHeight, resolution.width, resolution.height].every(Number.isFinite)
    || renderWidth <= 0 || renderHeight <= 0 || resolution.width <= 0 || resolution.height <= 0) {
    return 0;
  }

  return Math.min(renderWidth / resolution.width, renderHeight / resolution.height);
}
