interface HudLine { text: string; top: number; lineHeight: number; width: number }
interface Rect { left: number; top: number; width: number; height: number }
type HitTargets = Partial<Record<"openSettings" | "cycleResolution", Rect>>;
interface HudLayoutOptions { width: number; height: number; devicePixelRatio?: number; titleLineHeight: number; bodyLineHeight: number; titleWidth: number; titleButtonWidth: number; resolutionLineWidth: number; fpsWidth?: number }
type FontStyle = Pick<CSSStyleDeclaration, "fontSize" | "fontStyle" | "fontWeight" | "fontFamily" | "lineHeight">;
export type HudContext = Pick<CanvasRenderingContext2D, "clearRect" | "save" | "restore" | "drawImage" | "fillText" | "font" | "textAlign" | "textBaseline" | "fillStyle" | "imageSmoothingEnabled"> & { measureText(text: string): Pick<TextMetrics, "width"> & Partial<TextMetrics> };
type HudOptions = { width: number; height: number; devicePixelRatio?: number; visible: false } | { width: number; height: number; devicePixelRatio?: number; visible?: true; resolutionText: string; renderScaleText: string; modeText?: string; fpsText?: string; titleStyle: FontStyle; bodyStyle: FontStyle; color?: string };

export const BABYLON_HUD_LOGO_SIZE = 32;
export const BABYLON_HUD_BOTTOM_INSET = 9;
const BABYLON_HUD_LOGO_OPTICAL_OFFSET = 0.5;
const BABYLON_HUD_TITLE_BASELINE_OFFSET = 1.5;
const BABYLON_HUD_BODY_BASELINE_OFFSET = 1;

export function getWorldHudLayout({
  width,
  height,
  devicePixelRatio = 1,
  titleLineHeight,
  bodyLineHeight,
  titleWidth,
  titleButtonWidth,
  resolutionLineWidth,
  fpsWidth = 0,
}: HudLayoutOptions) {
  const dpr = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
  const cssWidth = width / dpr;
  const cssHeight = height / dpr;
  const logoSize = BABYLON_HUD_LOGO_SIZE;
  const blockHeight = logoSize + titleLineHeight + (3 * bodyLineHeight);
  const logoTop = cssHeight - BABYLON_HUD_BOTTOM_INSET - blockHeight;
  const titleTop = logoTop + logoSize;
  const resolutionTop = titleTop + titleLineHeight;
  const scaleTop = resolutionTop + bodyLineHeight;
  const modeTop = scaleTop + bodyLineHeight;

  const centeredLine = (top: number, lineHeight: number, measuredWidth: number) => ({
    left: (cssWidth - (measuredWidth / dpr)) / 2,
    top,
    width: measuredWidth / dpr,
    height: lineHeight,
  });
  const titleRect = centeredLine(titleTop, titleLineHeight, titleWidth);
  const resolutionRect = centeredLine(resolutionTop, bodyLineHeight, resolutionLineWidth);

  return {
    logo: {
      left: (cssWidth - logoSize) / 2 - BABYLON_HUD_LOGO_OPTICAL_OFFSET,
      top: logoTop - BABYLON_HUD_LOGO_OPTICAL_OFFSET,
      width: logoSize,
      height: logoSize,
    },
    lines: [
      { text: "(B) Babylon Lite", top: titleTop, lineHeight: titleLineHeight, width: titleWidth },
      { text: "", top: resolutionTop, lineHeight: bodyLineHeight, width: resolutionLineWidth },
      { text: "", top: scaleTop, lineHeight: bodyLineHeight, width: 0 },
      { text: "", top: modeTop, lineHeight: bodyLineHeight, width: 0 },
      { text: "", top: logoTop - bodyLineHeight, lineHeight: bodyLineHeight, width: fpsWidth },
    ] satisfies [HudLine, HudLine, HudLine, HudLine, HudLine],
    hitTargets: {
      openSettings: { ...titleRect, width: titleButtonWidth / dpr },
      cycleResolution: resolutionRect,
    },
    devicePixelRatio: dpr,
    cssWidth,
    cssHeight,
    bottomInset: BABYLON_HUD_BOTTOM_INSET,
  };
}

function canvasFont(style: FontStyle, devicePixelRatio: number) {
  const fontSize = Number.parseFloat(style.fontSize) * devicePixelRatio;
  return `${style.fontStyle} ${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
}

function baselineOffset(context: HudContext, lineHeight: number) {
  const metrics = context.measureText("Mg");
  const ascent = metrics.fontBoundingBoxAscent ?? metrics.actualBoundingBoxAscent ?? 0;
  const descent = metrics.fontBoundingBoxDescent ?? metrics.actualBoundingBoxDescent ?? 0;
  return ((lineHeight - ascent - descent) / 2) + ascent;
}

export function drawWorldHud(context: HudContext, logo: CanvasImageSource | null, options: HudOptions) {
  const { width, height, devicePixelRatio = 1 } = options;
  context.clearRect(0, 0, width, height);
  if (options.visible === false) return { layout: null, hitTargets: {} };
  const { resolutionText, renderScaleText, modeText = "Mode: 2DPixelPerfect", fpsText = "FPS: 000", titleStyle, bodyStyle, color = "#e0694b" } = options;

  const dpr = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
  const titleFont = canvasFont(titleStyle, dpr);
  const bodyFont = canvasFont(bodyStyle, dpr);
  const titleLineHeight = Number.parseFloat(titleStyle.lineHeight);
  const bodyLineHeight = Number.parseFloat(bodyStyle.lineHeight);
  const title = "(B) Babylon Lite";
  const lines = [title, resolutionText, renderScaleText, modeText, fpsText];

  context.save();
  context.textAlign = "center";
  context.textBaseline = "alphabetic";
  context.fillStyle = color;
  context.font = titleFont;
  const titleWidth = context.measureText(title).width;
  const titleButtonWidth = context.measureText("(B)").width;
  context.font = bodyFont;
  const bodyWidths = lines.slice(1).map((line) => context.measureText(line).width);
  const layout = getWorldHudLayout({
    width,
    height,
    devicePixelRatio: dpr,
    titleLineHeight,
    bodyLineHeight,
    titleWidth,
    titleButtonWidth,
    resolutionLineWidth: bodyWidths[0]!,
    fpsWidth: bodyWidths[3]!,
  });

  context.imageSmoothingEnabled = true;
  if (logo) {
    context.drawImage(
      logo,
      layout.logo.left * dpr,
      layout.logo.top * dpr,
      layout.logo.width * dpr,
      layout.logo.height * dpr,
    );
  }

  context.font = titleFont;
  context.fillText(
    title,
    width / 2,
    (layout.lines[0].top * dpr) + baselineOffset(context, titleLineHeight * dpr) - (BABYLON_HUD_TITLE_BASELINE_OFFSET * dpr),
  );
  context.font = bodyFont;
  for (let index = 1; index < lines.length; index += 1) {
    const line = layout.lines[index];
    const text = lines[index];
    const measuredWidth = bodyWidths[index - 1];
    if (!line || text === undefined || measuredWidth === undefined) continue;
    context.fillText(
      text,
      width / 2,
      (line.top * dpr) + baselineOffset(context, bodyLineHeight * dpr) - (BABYLON_HUD_BODY_BASELINE_OFFSET * dpr),
    );
    line.text = text;
    line.width = measuredWidth;
  }
  context.restore();

  return { layout, hitTargets: layout.hitTargets };
}

export function hitTestWorldHud(point: { x: number; y: number }, hitTargets: HitTargets | null) {
  for (const [action, rect] of Object.entries(hitTargets ?? {})) {
    if (rect
      && point.x >= rect.left && point.x <= rect.left + rect.width
      && point.y >= rect.top && point.y <= rect.top + rect.height) return action;
  }
  return null;
}
