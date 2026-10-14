import type { Sprite2DHandle, Sprite2DLayer, Sprite2DProps, Sprite2DView } from "@babylonjs/lite";
type Position = [number, number];
type ViewLayer = Pick<Sprite2DLayer, "view">;

import {
  addSprite2D,
  centerSprite2DView,
  sprite2DScreenToWorldToRef,
  sprite2DWorldToScreenToRef,
  updateSprite2D,
} from "@babylonjs/lite";

export const BabylonLiteMode = Object.freeze({
  PixelPerfect2D: "2d-pixel-perfect",
});

const simulationPositions = new WeakMap<Sprite2DHandle, Position>();
const gameSprites = new WeakSet<Sprite2DHandle>();
const presentationSprites = new WeakSet<Sprite2DHandle>();
const spritesByLayer = new WeakMap<ViewLayer, Set<Sprite2DHandle>>();

let activeMode: string | null = null;

function assertPosition(positionPx: unknown, name = "positionPx"): asserts positionPx is Position {
  if (
    !Array.isArray(positionPx)
    || positionPx.length !== 2
    || !positionPx.every(Number.isFinite)
  ) {
    throw new TypeError(`${name} must be [finiteX, finiteY].`);
  }
}

export function snapPositionPxThroughView(view: Sprite2DView, positionPx: Position): Position {
  assertPosition(positionPx);
  if (!view || !Array.isArray(view.positionPx)) {
    throw new TypeError("A Babylon Lite Sprite2DView is required.");
  }

  const screenPosition = { x: 0, y: 0 };
  sprite2DWorldToScreenToRef(view, positionPx[0], positionPx[1], screenPosition);
  screenPosition.x = Math.round(screenPosition.x);
  screenPosition.y = Math.round(screenPosition.y);

  const snappedPosition = { x: 0, y: 0 };
  sprite2DScreenToWorldToRef(view, screenPosition.x, screenPosition.y, snappedPosition);
  return [snappedPosition.x, snappedPosition.y];
}

export class BabylonLiteAIEntry {
  static configure({ mode }: { mode?: typeof BabylonLiteMode.PixelPerfect2D } = {}) {
    activeMode = null;
    if (mode !== BabylonLiteMode.PixelPerfect2D) {
      throw new Error(`Unsupported or missing Babylon Lite mode: ${mode ?? "null"}`);
    }
    activeMode = mode;
  }

  static addSprite(layer: Sprite2DLayer, props: Sprite2DProps) {
    this.#assertConfigured();
    assertPosition(props?.positionPx, "props.positionPx");
    const sprite = addSprite2D(layer, props);
    gameSprites.add(sprite);
    let sprites = spritesByLayer.get(layer);
    if (!sprites) {
      sprites = new Set();
      spritesByLayer.set(layer, sprites);
    }
    sprites.add(sprite);
    this.move(sprite, props.positionPx);
    return sprite;
  }

  static move(sprite: Sprite2DHandle, desiredPositionPx: Position) {
    this.#assertConfigured();
    this.#assertGameSprite(sprite);
    assertPosition(desiredPositionPx, "desiredPositionPx");

    const simulationPosition: Position = [...desiredPositionPx];
    simulationPositions.set(sprite, simulationPosition);
    const renderPositionPx = this.#syncSprite(sprite);

    return {
      simulationPosition: [...simulationPosition],
      renderPositionPx,
    };
  }

  static update(sprite: Sprite2DHandle, patch: Partial<Sprite2DProps>) {
    this.#assertConfigured();
    this.#assertGameSprite(sprite);
    if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
      throw new TypeError("patch must be an object of Babylon Lite sprite properties.");
    }

    const { positionPx, ...otherProperties } = patch;
    if (positionPx !== undefined) this.move(sprite, positionPx);
    if (Object.keys(otherProperties).length > 0) updateSprite2D(sprite, otherProperties);
  }

  static updateView(layer: ViewLayer, patch: Partial<Sprite2DView>) {
    this.#assertConfigured();
    if (!layer || !layer.view || !patch || typeof patch !== "object" || Array.isArray(patch)) {
      throw new TypeError("A Babylon Lite sprite layer and view patch are required.");
    }
    const view = layer.view;
    for (const key of Object.keys(patch)) {
      if (!["positionPx", "zoom", "rotation"].includes(key)) {
        throw new TypeError(`Unsupported Babylon Lite view property: ${key}`);
      }
    }
    if (patch.positionPx !== undefined) {
      assertPosition(patch.positionPx, "patch.positionPx");
      view.positionPx[0] = patch.positionPx[0];
      view.positionPx[1] = patch.positionPx[1];
    }
    if (patch.zoom !== undefined) {
      if (!Number.isFinite(patch.zoom) || patch.zoom === 0) {
        throw new TypeError("patch.zoom must be a finite non-zero number.");
      }
      view.zoom = patch.zoom;
    }
    if (patch.rotation !== undefined) {
      if (!Number.isFinite(patch.rotation)) {
        throw new TypeError("patch.rotation must be finite.");
      }
      view.rotation = patch.rotation;
    }

    for (const sprite of spritesByLayer.get(layer) ?? []) this.#syncSprite(sprite);
  }

  static centerView(layer: ViewLayer, worldX: number, worldY: number, screenWidthPx: number, screenHeightPx: number) {
    this.#assertConfigured();
    if (!layer?.view || ![worldX, worldY, screenWidthPx, screenHeightPx].every(Number.isFinite)) {
      throw new TypeError("A Babylon Lite layer and finite center-view dimensions are required.");
    }
    centerSprite2DView(layer.view, worldX, worldY, screenWidthPx, screenHeightPx);
    for (const sprite of spritesByLayer.get(layer) ?? []) this.#syncSprite(sprite);
  }

  static getSimulationPosition(sprite: Sprite2DHandle): Position | null {
    this.#assertConfigured();
    this.#assertGameSprite(sprite);
    const position = simulationPositions.get(sprite);
    return position ? [...position] : null;
  }

  // Renderer-owned full-surface sprites preserve presentation geometry, including
  // half-pixel centers for odd-sized render targets. Game code must not use these.
  static addPresentationSprite(layer: Sprite2DLayer, props: Sprite2DProps) {
    const sprite = addSprite2D(layer, props);
    presentationSprites.add(sprite);
    return sprite;
  }

  static updatePresentationSprite(sprite: Sprite2DHandle, patch: Partial<Sprite2DProps>) {
    if (!presentationSprites.has(sprite)) {
      throw new TypeError("Expected a renderer-owned Babylon Lite presentation sprite.");
    }
    if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
      throw new TypeError("patch must be an object of Babylon Lite sprite properties.");
    }
    updateSprite2D(sprite, patch);
  }

  static #assertConfigured() {
    if (activeMode === null) {
      throw new Error("Call BabylonLiteAIEntry.configure({ mode: BabylonLiteMode.PixelPerfect2D }) first.");
    }
  }

  static #assertGameSprite(sprite: Sprite2DHandle) {
    if (!gameSprites.has(sprite)) {
      throw new TypeError("Expected a sprite created by BabylonLiteAIEntry.addSprite(...).");
    }
  }

  static #syncSprite(sprite: Sprite2DHandle) {
    const simulationPosition = simulationPositions.get(sprite);
    if (!simulationPosition) {
      throw new Error("Managed sprite is missing its simulation position.");
    }
    const renderPositionPx = snapPositionPxThroughView(sprite.layer.view, simulationPosition);
    updateSprite2D(sprite, { positionPx: renderPositionPx });
    return renderPositionPx;
  }
}
