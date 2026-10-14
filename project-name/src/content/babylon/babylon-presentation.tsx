import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { ReadoutProps } from "../../ui/app.tsx";
import type { RenderPreset, RenderResolutionInfo } from "./render-resolution.ts";
interface PresentationState { renderPreset: RenderPreset; setRenderPreset: Dispatch<SetStateAction<RenderPreset>>; renderScale: number; setRenderScale: Dispatch<SetStateAction<number>>; renderResolutionInfo: RenderResolutionInfo | null; setRenderResolutionInfo: Dispatch<SetStateAction<RenderResolutionInfo | null>>; cycleRenderResolution: () => void }

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import "./babylon-presentation.css";
import babylonLogoUrl from "./images/babylon-logo-32x32.png?url";
import { getRenderScaleDisplayText } from "./showcase-overlay.ts";
import { readProjectConfig, writeProjectConfigPatch } from "../../shared/project-config-storage.ts";
import {
  cycleRenderResolutionPreset,
  getRenderResolutionDimensions,
  isRenderResolutionPreset,
} from "./render-resolution.ts";

const BabylonPresentationContext = createContext<PresentationState>({
  renderPreset: "native",
  setRenderPreset() {},
  renderScale: 1,
  setRenderScale() {},
  renderResolutionInfo: null,
  setRenderResolutionInfo() {},
  cycleRenderResolution() {},
});

function readRenderPreset() {
  try {
    const { renderPreset } = readProjectConfig(localStorage);
    return isRenderResolutionPreset(renderPreset) ? renderPreset : "native";
  } catch {
    return "native";
  }
}

function writeRenderPreset(renderPreset: RenderPreset) {
  try {
    writeProjectConfigPatch(localStorage, { renderPreset });
  } catch {
    // Keep the in-memory renderer setting usable when browser storage is unavailable.
  }
}

export function BabylonPresentationProvider({ children }: { children: ReactNode }) {
  const [renderPreset, setRenderPreset] = useState(readRenderPreset);
  const [renderScale, setRenderScale] = useState(1);
  const [renderResolutionInfo, setRenderResolutionInfo] = useState<RenderResolutionInfo | null>(null);
  useEffect(() => writeRenderPreset(renderPreset), [renderPreset]);
  const cycleRenderResolution = useCallback(
    () => setRenderPreset((current) => cycleRenderResolutionPreset(current)),
    [],
  );

  return (
    <BabylonPresentationContext.Provider value={{
      renderPreset,
      setRenderPreset,
      renderScale,
      setRenderScale,
      renderResolutionInfo,
      setRenderResolutionInfo,
      cycleRenderResolution,
    }}>
      {children}
    </BabylonPresentationContext.Provider>
  );
}

export function useBabylonPresentation() {
  return useContext(BabylonPresentationContext);
}

export function BabylonLiteReadout({ hudVisible, viewportPixels, devicePixelRatio, openSettings }: ReadoutProps) {
  const { renderPreset, renderScale, renderResolutionInfo, cycleRenderResolution } = useBabylonPresentation();
  const nativeWidth = Math.floor(viewportPixels.width * devicePixelRatio);
  const nativeHeight = Math.floor(viewportPixels.height * devicePixelRatio);
  const estimated = getRenderResolutionDimensions(nativeWidth, nativeHeight, renderPreset);
  const resolution = renderResolutionInfo
    && renderResolutionInfo.preset === renderPreset
    && renderResolutionInfo.nativeWidth === nativeWidth
    && renderResolutionInfo.nativeHeight === nativeHeight
    ? renderResolutionInfo
    : estimated;
  const resolutionText = resolution.width > 0
    ? `(R) RenderResolution: ${resolution.width}x${resolution.height}${renderPreset === "native" ? " (Native)" : ""}`
    : "(R) RenderResolution: measuring…";
  const [fps, setFps] = useState(0);

  useEffect(() => {
    if (!hudVisible) return undefined;
    let frameId = 0;
    let windowStart = 0;
    let frameCount = 0;
    const sample = (timestamp: number) => {
      frameCount += 1;
      if (!windowStart) windowStart = timestamp;
      if (timestamp - windowStart >= 1000) {
        setFps(Math.min(999, Math.round((frameCount * 1000) / (timestamp - windowStart))));
        windowStart = timestamp;
        frameCount = 0;
      }
      frameId = window.requestAnimationFrame(sample);
    };
    frameId = window.requestAnimationFrame(sample);
    return () => window.cancelAnimationFrame(frameId);
  }, [hudVisible]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key.toLowerCase() === "r" && !event.repeat) cycleRenderResolution();
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [cycleRenderResolution]);

  if (!hudVisible) return null;
  return (
    <div className="babylon_readout" aria-label="Babylon Lite settings">
      <img src={babylonLogoUrl} width="32" height="32" alt="" />
      <button className="babylon_readout_title" type="button" onClick={openSettings}>(B) Babylon Lite</button>
      <button className="babylon_readout_body" type="button" onClick={cycleRenderResolution}>{resolutionText}</button>
      <div className="babylon_readout_body">{getRenderScaleDisplayText(renderScale)}</div>
      <div className="babylon_readout_body">Mode: 2DPixelPerfect</div>
      <div className="babylon_readout_body" aria-live="off">FPS: {String(fps).padStart(3, "0")}</div>
    </div>
  );
}

export function BabylonLiteSettings() {
  const { renderPreset, renderScale, renderResolutionInfo } = useBabylonPresentation();
  const resolution = renderResolutionInfo?.preset === renderPreset ? renderResolutionInfo : null;
  const resolutionText = resolution && resolution.width > 0
    ? `${resolution.width}x${resolution.height}${renderPreset === "native" ? " (Native)" : ""}`
    : "measuring…";
  return (
    <div className="dialog_options babylon_settings">
      <div>Babylon Lite</div>
      <div>(R) RenderResolution: {resolutionText}</div>
      <div>{getRenderScaleDisplayText(renderScale)}</div>
      <div>Mode: 2DPixelPerfect</div>
    </div>
  );
}
