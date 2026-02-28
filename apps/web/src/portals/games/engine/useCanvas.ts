import { useRef, useEffect, useCallback } from "react";

interface CanvasOptions {
  /** If true, canvas fills its parent container */
  fullParent?: boolean;
}

/**
 * Manages an HTML5 Canvas with DPI scaling and auto-resize.
 * Returns the canvas ref, context getter, and logical dimensions.
 */
export function useCanvas(options: CanvasOptions = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dimensionsRef = useRef({ width: 0, height: 0 });

  const getCtx = useCallback(() => {
    return canvasRef.current?.getContext("2d") ?? null;
  }, []);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);

    dimensionsRef.current = { width: w, height: h };
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  return {
    canvasRef,
    getCtx,
    dimensions: dimensionsRef,
    resize,
  };
}
