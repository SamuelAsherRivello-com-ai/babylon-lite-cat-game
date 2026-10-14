import { useEffect, useRef, useState } from "react";
import {
  createRenderTexture2D,
  createGridSpriteAtlas,
  createSprite2DLayer,
  createSpriteRenderer,
  createEngine,
  disposeEngine,
  disposeSpriteAtlas,
  disposeSpriteRenderer,
  loadTexture2D,
  registerSpriteRenderer,
  releaseTexture,
  setSpriteRendererTarget,
  startEngine,
  stopEngine,
} from "@babylonjs/lite";
import { contentConfig, getRenderingPolicy, logicalResolution, pixelPerfectOptions } from "./babylon/config.ts";
import { getInitializationMessage } from "./babylon/initialization.ts";
import { getLogicalToRenderScale } from "./babylon/pixel-perfect.ts";
import { BabylonLiteAIEntry, BabylonLiteMode } from "./babylon/pixel-grid-entry.ts";
import { createRenderTargetSurfaceView, getRenderResolutionDimensions } from "./babylon/render-resolution.ts";
import { useContentShell } from "../shared/content-shell-context.tsx";
import { useBabylonPresentation } from "./babylon/babylon-presentation.tsx";
import { CatHangout } from "../game/cat-hangout.tsx";
import { validateCatHangoutMap, type TiledMap } from "../game/tiled-map.ts";

// Lite 1.32 exposes this runtime limit through an internal device field omitted
// from its public declaration. Keep that pinned boundary assertion in one place.
function getTextureDimensionLimit(engine: Awaited<ReturnType<typeof createEngine>>): number {
  return (engine as typeof engine & { _device: { limits: { maxTextureDimension2D: number } } })._device.limits.maxTextureDimension2D;
}

const BACKGROUND = Object.freeze({ r: 1, g: 1, b: 1, a: 1 });
const furnitureUrl = `${import.meta.env.BASE_URL}assets/catmega/furniture.png`;
const mapUrl = `${import.meta.env.BASE_URL}maps/cat-hangout.tmj`;
const TILE_SIZE = 32;
const OBJECT_FRAMES: Readonly<Record<string, number>> = Object.freeze({ box: 4, rest: 21, food: 37, tree: 68, "human-spawn": 0, "bot-roam": 0 });

function PixelPerfectShowcase() {
  const { paused } = useContentShell();
  const { setRenderScale, renderPreset, setRenderResolutionInfo } = useBabylonPresentation();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingPausedRef = useRef(paused);
  const renderPresetRef = useRef(renderPreset);
  const applyRenderResolutionRef = useRef<(() => void) | null>(null);
  const engineRef = useRef<Awaited<ReturnType<typeof createEngine>> | null>(null);
  const engineReadyRef = useRef(false);
  const engineRunningRef = useRef(false);
  const [message, setMessage] = useState("Starting Babylon Lite…");

  useEffect(() => {
    renderPresetRef.current = renderPreset;
    applyRenderResolutionRef.current?.();
  }, [renderPreset]);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    let cancelled = false;
    let disposed = false;
    let engine: Awaited<ReturnType<typeof createEngine>> | null = null;
    let texture: Awaited<ReturnType<typeof loadTexture2D>> | null = null;
    let atlas: ReturnType<typeof createGridSpriteAtlas> | null = null;
    let renderTexture: ReturnType<typeof createRenderTexture2D> | null = null;
    let presentationAtlas: ReturnType<typeof createGridSpriteAtlas> | null = null;
    let presentationRenderer: ReturnType<typeof createSpriteRenderer> | null = null;
    let presentationSprite: ReturnType<typeof BabylonLiteAIEntry.addPresentationSprite> | null = null;
    let presentationWidth = 0;
    let presentationHeight = 0;
    let nativeWidth = 0;
    let nativeHeight = 0;
    let renderSurface: Awaited<ReturnType<typeof createEngine>> | null = null;
    let renderer: ReturnType<typeof createSpriteRenderer> | null = null;
    let layer: ReturnType<typeof createSprite2DLayer> | null = null;
    const worldSprites: ReturnType<typeof BabylonLiteAIEntry.addSprite>[] = [];
    let tiledMap: TiledMap | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let dprQuery: MediaQueryList | null = null;
    let setupFinished = false;
    let failed = false;

    const removeDprQuery = () => {
      dprQuery?.removeEventListener("change", handleDprChange);
      dprQuery = null;
    };
    const observeDpr = () => {
      removeDprQuery();
      dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
      dprQuery.addEventListener("change", handleDprChange, { once: true });
    };
    const updateRenderResolution = () => {
      if (!engine || !renderer || !host || !canvas || !layer || !tiledMap) return;
      const dpr = window.devicePixelRatio || 1;
      nativeWidth = Math.max(1, Math.floor(host.clientWidth * dpr));
      nativeHeight = Math.max(1, Math.floor(host.clientHeight * dpr));
      const resolved = getRenderResolutionDimensions(
        nativeWidth,
        nativeHeight,
        renderPresetRef.current,
        getTextureDimensionLimit(engine),
      );
      if (renderSurface) {
        renderSurface.canvas.width = resolved.width;
        renderSurface.canvas.height = resolved.height;
      }
      const sameTarget = renderTexture
        && renderTexture.width === resolved.width
        && renderTexture.height === resolved.height;
      const samePresentationSize = presentationWidth === nativeWidth && presentationHeight === nativeHeight;

      if (!sameTarget || !samePresentationSize || !presentationRenderer) {
        if (renderer) setSpriteRendererTarget(renderer, null);
        if (presentationRenderer) disposeSpriteRenderer(presentationRenderer);
        if (presentationAtlas) disposeSpriteAtlas(presentationAtlas);
        presentationRenderer = null;
        presentationAtlas = null;
        presentationSprite = null;
        if (!sameTarget) {
          if (renderTexture) releaseTexture(renderTexture);
          renderTexture = createRenderTexture2D(engine, resolved.width, resolved.height, {
            addressModeU: "clamp-to-edge",
            addressModeV: "clamp-to-edge",
            minFilter: "nearest",
            magFilter: "nearest",
          });
        }
        setSpriteRendererTarget(renderer, renderTexture);
        if (!renderTexture) throw new Error("Missing render texture");
        presentationAtlas = createGridSpriteAtlas(renderTexture, {
          cellWidthPx: resolved.width,
          cellHeightPx: resolved.height,
          columns: 1,
          rows: 1,
          pivot: [0.5, 0.5],
        });
        const presentationLayer = createSprite2DLayer(presentationAtlas, { pivot: [0.5, 0.5] });
        presentationSprite = BabylonLiteAIEntry.addPresentationSprite(presentationLayer, {
          positionPx: [nativeWidth / 2, nativeHeight / 2],
          sizePx: [nativeWidth, nativeHeight],
          frame: 0,
        });
        presentationRenderer = createSpriteRenderer(engine, {
          layers: [presentationLayer],
          clear: true,
          clearValue: BACKGROUND,
        });
        registerSpriteRenderer(presentationRenderer);
        presentationWidth = nativeWidth;
        presentationHeight = nativeHeight;
      } else if (presentationSprite) {
        BabylonLiteAIEntry.updatePresentationSprite(presentationSprite, {
          positionPx: [nativeWidth / 2, nativeHeight / 2],
          sizePx: [nativeWidth, nativeHeight],
        });
      }

      // The view is the map camera. Simulation positions stay unsnapped; the
      // approved entry point snaps only projected sprite anchors.
      BabylonLiteAIEntry.updateView(layer, {
        zoom: getLogicalToRenderScale(resolved.width, resolved.height, logicalResolution),
      });
      BabylonLiteAIEntry.centerView(layer, tiledMap.width * tiledMap.tilewidth / 2, tiledMap.height * tiledMap.tileheight / 2, resolved.width, resolved.height);
      setRenderScale(resolved.scale);
      setRenderResolutionInfo({
        preset: resolved.preset,
        width: resolved.width,
        height: resolved.height,
        nativeWidth,
        nativeHeight,
      });
    };
    const updateRenderResolutionSafely = () => {
      try {
        updateRenderResolution();
      } catch (error) {
        failed = true;
        console.error("Babylon Lite render-resolution update failed:", error);
        if (engineRunningRef.current && engine) stopEngine(engine);
        engineRunningRef.current = false;
        disposeResources();
        if (!cancelled) setMessage(getInitializationMessage(Boolean(navigator.gpu), error));
      }
    };
    function handleDprChange() {
      updateRenderResolutionSafely();
      observeDpr();
    }
    const disposeResources = () => {
      if (disposed || !setupFinished) return;
      disposed = true;
      if (renderer) setSpriteRendererTarget(renderer, null);
      if (presentationRenderer) disposeSpriteRenderer(presentationRenderer);
      if (renderer) disposeSpriteRenderer(renderer);
      if (presentationAtlas) disposeSpriteAtlas(presentationAtlas);
      if (atlas) disposeSpriteAtlas(atlas);
      if (renderTexture) releaseTexture(renderTexture);
      if (texture) releaseTexture(texture);
      if (engine) disposeEngine(engine);
      presentationRenderer = null;
      renderer = null;
      presentationAtlas = null;
      atlas = null;
      renderTexture = null;
      renderSurface = null;
      texture = null;
      engine = null;
      engineRef.current = null;
      engineReadyRef.current = false;
      engineRunningRef.current = false;
    };

    const setup = async () => {
      try {
        if (!navigator.gpu) throw new Error("WebGPU is not available in this browser.");
        BabylonLiteAIEntry.configure({ mode: BabylonLiteMode.PixelPerfect2D });

        const createdEngine = await createEngine(canvas, pixelPerfectOptions.engine);
        if (cancelled) {
          engine = createdEngine;
          setupFinished = true;
          disposeResources();
          return;
        }
        engine = createdEngine;
        engineRef.current = engine;

        const mapResponse = await fetch(mapUrl);
        if (!mapResponse.ok) throw new Error(`Unable to load Cat Hangout map (${mapResponse.status}).`);
        const parsedMap: unknown = await mapResponse.json();
        validateCatHangoutMap(parsedMap);
        tiledMap = parsedMap;

        const loadedTexture = await loadTexture2D(engine, furnitureUrl, pixelPerfectOptions.texture);
        if (cancelled) {
          texture = loadedTexture;
          setupFinished = true;
          disposeResources();
          return;
        }
        texture = loadedTexture;

        atlas = createGridSpriteAtlas(texture, {
          cellWidthPx: TILE_SIZE,
          cellHeightPx: TILE_SIZE,
          columns: 16,
          rows: 16,
          pivot: [0.5, 0.5],
        });
        layer = createSprite2DLayer(atlas, { pivot: [0.5, 0.5] });
        const ground = tiledMap.layers.find((candidate) => candidate.type === "tilelayer" && candidate.name === "Ground");
        if (!ground?.data) throw new Error("Map requires a Ground tile layer.");
        for (let row = 0; row < tiledMap.height; row += 1) {
          for (let column = 0; column < tiledMap.width; column += 1) {
            const index = row * tiledMap.width + column;
            worldSprites.push(BabylonLiteAIEntry.addSprite(layer, {
              positionPx: [column * TILE_SIZE + TILE_SIZE / 2, row * TILE_SIZE + TILE_SIZE / 2],
              sizePx: [TILE_SIZE, TILE_SIZE],
              frame: (ground.data[index] ?? 0) === 0 ? 0 : (ground.data[index] ?? 1) - 1,
            }));
          }
        }
        const activities = tiledMap.layers.find((candidate) => candidate.type === "objectgroup" && candidate.name === "Activities");
        for (const activity of activities?.objects ?? []) {
          worldSprites.push(BabylonLiteAIEntry.addSprite(layer, {
            positionPx: [activity.x + TILE_SIZE / 2, activity.y + TILE_SIZE / 2],
            sizePx: [TILE_SIZE, TILE_SIZE],
            frame: OBJECT_FRAMES[activity.type] ?? 0,
          }));
        }

        const dpr = window.devicePixelRatio || 1;
        const initialWidth = Math.max(1, Math.floor(host.clientWidth * dpr));
        const initialHeight = Math.max(1, Math.floor(host.clientHeight * dpr));
        const initialRenderSize = getRenderResolutionDimensions(
          initialWidth,
          initialHeight,
          renderPresetRef.current,
          getTextureDimensionLimit(engine),
        );
        renderSurface = createRenderTargetSurfaceView(engine, initialRenderSize.width, initialRenderSize.height);
        renderer = createSpriteRenderer(renderSurface, {
          layers: [layer],
          clear: true,
          clearValue: BACKGROUND,
        });
        setSpriteRendererTarget(renderer, null);
        registerSpriteRenderer(renderer);

        applyRenderResolutionRef.current = updateRenderResolutionSafely;
        updateRenderResolution();

        await startEngine(engine);
        // StrictMode can unmount this effect while the first async engine start
        // is pending. Let finally dispose the engine without registering fresh
        // listeners or observers after cleanup has already run.
        if (cancelled) return;
        if (failed) throw new Error("Babylon Lite render-resolution setup failed.");
        engineReadyRef.current = true;
        engineRunningRef.current = true;
        if (processingPausedRef.current) {
          stopEngine(engine);
          engineRunningRef.current = false;
        }
        resizeObserver = new ResizeObserver(updateRenderResolutionSafely);
        resizeObserver.observe(host);
        window.addEventListener("resize", updateRenderResolutionSafely);
        observeDpr();
        if (!cancelled) setMessage("");
      } catch (error) {
        failed = true;
        console.error("Babylon Lite content initialization failed:", error);
        if (!cancelled) setMessage(getInitializationMessage(Boolean(navigator.gpu), error));
      } finally {
        setupFinished = true;
        if (cancelled || failed) disposeResources();
      }
    };

    // Let StrictMode's immediate setup/cleanup probe finish before touching the
    // canvas. A cancelled probe must not asynchronously create an engine that can
    // unconfigure the canvas context owned by the surviving mount.
    queueMicrotask(() => {
      if (!cancelled) void setup();
    });
    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateRenderResolutionSafely);
      removeDprQuery();
      applyRenderResolutionRef.current = null;
      disposeResources();
    };
  }, []);

  useEffect(() => {
    processingPausedRef.current = paused;
    const engine = engineRef.current;
    if (!engine || !engineReadyRef.current) return;

    if (paused && engineRunningRef.current) {
      stopEngine(engine);
      engineRunningRef.current = false;
    } else if (!paused && !engineRunningRef.current) {
      engineRunningRef.current = true;
      void startEngine(engine);
    }
  }, [paused]);

  return (
    <div ref={hostRef} className="babylon_content" data-renderer="babylon-lite" data-content-style="2d">
      <canvas ref={canvasRef} className="babylon_canvas" aria-hidden="true" />
      {message && <div className="babylon_content_message" role="status">{message}</div>}
    </div>
  );
}

export function Content() {
  const renderingPolicy = getRenderingPolicy(contentConfig);
  if (renderingPolicy === "performance-scaled-3d") {
    return (
      <div className="babylon_content babylon_content_message" data-renderer="babylon-lite" data-content-style="3d">
        3D content is selected. Configure its Babylon Lite scene with the Performance-scaled 3D policy in the integration guide.
      </div>
    );
  }
  if (renderingPolicy !== "pixel-perfect") {
    return <div className="babylon_content babylon_content_message" role="status">Select Babylon Lite with 2D content or add the renderer-specific integration described in the guide.</div>;
  }

  return <><PixelPerfectShowcase /><CatHangout /></>;
}
