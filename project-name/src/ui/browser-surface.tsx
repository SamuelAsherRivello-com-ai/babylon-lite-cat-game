import type { CSSProperties, ReactNode } from "react";
import type { Layout } from "./layout.ts";
export type Gutters = Partial<Record<"top" | "bottom" | "left" | "right", ReactNode>>;
type SurfaceStyle = CSSProperties & { "--gutter-color"?: string; "--project-viewport-width"?: string; "--project-viewport-height"?: string };

import { useLayoutEffect, useRef, useState } from "react";
import { defaultLayout, fitViewport, validateLayout } from "./layout.ts";

function rectangle(x: number, y: number, width: number, height: number) {
  return { left: x, top: y, width, height };
}

export function BrowserSurface({ layout = defaultLayout, children, ui, gutters = {}, onViewportResize }: { layout?: Layout; children?: ReactNode; ui?: ReactNode; gutters?: Gutters; onViewportResize?: (rect: DOMRect) => void }) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const measure = () => setSize({ width: surface.clientWidth, height: surface.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(surface);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const viewport = document.getElementById("viewport");
    if (viewport && onViewportResize) {
      const update = () => onViewportResize(viewport.getBoundingClientRect());
      update();
      const observer = new ResizeObserver(update);
      observer.observe(viewport);
      return () => observer.disconnect();
    }
    return undefined;
  }, [size, layout, onViewportResize]);

  let error;
  try { validateLayout(layout); } catch (failure) { error = failure instanceof Error ? failure.message : String(failure); }
  const viewport = error ? null : fitViewport(size.width, size.height, layout);
  const regions = viewport && {
    top: rectangle(0, 0, size.width, viewport.y),
    bottom: rectangle(0, viewport.y + viewport.height, size.width, viewport.y),
    left: rectangle(0, viewport.y, viewport.x, viewport.height),
    right: rectangle(viewport.x + viewport.width, viewport.y, viewport.x, viewport.height),
  };

  return (
    <div ref={surfaceRef} id="browser_surface" style={layout.gutterBackground ? ({ "--gutter-color": layout.gutterBackground } as SurfaceStyle) : undefined}>
      {error || !viewport || !regions ? <div className="layout_error" role="alert">{error}</div> : <>
        {(Object.entries(regions) as [keyof Gutters, ReturnType<typeof rectangle>][] ).map(([side, style]) => (
          <div key={side} className={`gutter gutter_${side}`} style={style}>{gutters[side]}</div>
        ))}
        <div id="viewport" data-orientation={layout.orientation} style={{ ...rectangle(viewport.x, viewport.y, viewport.width, viewport.height), "--project-viewport-width": `${viewport.width}px`, "--project-viewport-height": `${viewport.height}px` } as SurfaceStyle}>
          {/* Selected content mounts beneath the independent UI layer. Content and renderer
              integrations own their backing resolution and lifecycle while the viewport stays
              in CSS pixels. See the integration guide for current renderer examples. */}
          <div id="content_layer">{children}</div>
          <div id="ui_layer">{ui}</div>
        </div>
      </>}
    </div>
  );
}
