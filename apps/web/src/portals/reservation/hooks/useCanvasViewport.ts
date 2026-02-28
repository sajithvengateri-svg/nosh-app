import { useState, useCallback, useEffect, useRef } from 'react';

interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
}

interface UseCanvasViewportOptions {
  minZoom?: number;
  maxZoom?: number;
  canvasWidth: number;
  canvasHeight: number;
}

export function useCanvasViewport(options: UseCanvasViewportOptions) {
  const { minZoom = 0.25, maxZoom = 3, canvasWidth, canvasHeight } = options;
  const [viewport, setViewport] = useState<ViewportState>({ zoom: 1, panX: 0, panY: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Zoom toward a point (in client/screen coordinates)
  const zoomAtPoint = useCallback((clientX: number, clientY: number, newZoom: number) => {
    setViewport(prev => {
      const clampedZoom = Math.min(maxZoom, Math.max(minZoom, newZoom));
      if (!containerRef.current) return { ...prev, zoom: clampedZoom };

      const rect = containerRef.current.getBoundingClientRect();
      // Position within the container (0-1 range)
      const px = (clientX - rect.left) / rect.width;
      const py = (clientY - rect.top) / rect.height;

      // SVG point under cursor before zoom change
      const svgX = (px * canvasWidth - prev.panX) / prev.zoom;
      const svgY = (py * canvasHeight - prev.panY) / prev.zoom;

      // New pan to keep same SVG point under cursor
      const newPanX = px * canvasWidth - svgX * clampedZoom;
      const newPanY = py * canvasHeight - svgY * clampedZoom;

      return { zoom: clampedZoom, panX: newPanX, panY: newPanY };
    });
  }, [canvasWidth, canvasHeight, minZoom, maxZoom]);

  // Wheel handler for zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1; // zoom out/in
    setViewport(prev => {
      const newZoom = Math.min(maxZoom, Math.max(minZoom, prev.zoom * delta));
      if (!containerRef.current) return { ...prev, zoom: newZoom };

      const rect = containerRef.current.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;

      const svgX = (px * canvasWidth - prev.panX) / prev.zoom;
      const svgY = (py * canvasHeight - prev.panY) / prev.zoom;

      const newPanX = px * canvasWidth - svgX * newZoom;
      const newPanY = py * canvasHeight - svgY * newZoom;

      return { zoom: newZoom, panX: newPanX, panY: newPanY };
    });
  }, [canvasWidth, canvasHeight, minZoom, maxZoom]);

  // Pan start/move/end via spacebar+drag
  const startPan = useCallback((clientX: number, clientY: number) => {
    panStartRef.current = { x: clientX, y: clientY, panX: viewport.panX, panY: viewport.panY };
  }, [viewport.panX, viewport.panY]);

  const movePan = useCallback((clientX: number, clientY: number) => {
    if (!panStartRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // Convert screen pixels to SVG-viewBox units
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;
    const dx = (clientX - panStartRef.current.x) * scaleX;
    const dy = (clientY - panStartRef.current.y) * scaleY;
    setViewport(prev => ({
      ...prev,
      panX: panStartRef.current!.panX + dx,
      panY: panStartRef.current!.panY + dy,
    }));
  }, [canvasWidth, canvasHeight]);

  const endPan = useCallback(() => {
    panStartRef.current = null;
  }, []);

  // Spacebar detection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement)) {
        e.preventDefault();
        setIsPanning(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsPanning(false);
        endPan();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [endPan]);

  // Fit to screen
  const fitToScreen = useCallback((items: Array<{ x: number; y: number; width: number; height: number }>) => {
    if (items.length === 0) {
      setViewport({ zoom: 1, panX: 0, panY: 0 });
      return;
    }
    const minX = Math.min(...items.map(i => i.x));
    const minY = Math.min(...items.map(i => i.y));
    const maxX = Math.max(...items.map(i => i.x + i.width));
    const maxY = Math.max(...items.map(i => i.y + i.height));

    const contentW = maxX - minX || canvasWidth;
    const contentH = maxY - minY || canvasHeight;

    const padding = 0.1; // 10% padding
    const scaleX = canvasWidth / (contentW * (1 + padding * 2));
    const scaleY = canvasHeight / (contentH * (1 + padding * 2));
    const zoom = Math.min(scaleX, scaleY, maxZoom);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const panX = canvasWidth / 2 - centerX * zoom;
    const panY = canvasHeight / 2 - centerY * zoom;

    setViewport({ zoom, panX, panY });
  }, [canvasWidth, canvasHeight, maxZoom]);

  // Zoom controls
  const zoomIn = useCallback(() => {
    setViewport(prev => ({ ...prev, zoom: Math.min(maxZoom, prev.zoom * 1.2) }));
  }, [maxZoom]);

  const zoomOut = useCallback(() => {
    setViewport(prev => ({ ...prev, zoom: Math.max(minZoom, prev.zoom / 1.2) }));
  }, [minZoom]);

  const resetZoom = useCallback(() => {
    setViewport({ zoom: 1, panX: 0, panY: 0 });
  }, []);

  const setPan = useCallback((panX: number, panY: number) => {
    setViewport(prev => ({ ...prev, panX, panY }));
  }, []);

  // Convert screen coords to SVG canvas coords (accounting for zoom+pan)
  const screenToCanvas = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const px = (clientX - rect.left) / rect.width;
    const py = (clientY - rect.top) / rect.height;
    const svgX = (px * canvasWidth - viewport.panX) / viewport.zoom;
    const svgY = (py * canvasHeight - viewport.panY) / viewport.zoom;
    return { x: svgX, y: svgY };
  }, [canvasWidth, canvasHeight, viewport]);

  return {
    viewport,
    isPanning,
    containerRef,
    handleWheel,
    startPan,
    movePan,
    endPan,
    fitToScreen,
    zoomIn,
    zoomOut,
    resetZoom,
    screenToCanvas,
    zoomAtPoint,
    setPan,
  };
}
