import { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Undo2, Eraser, Check, X } from "lucide-react";

interface Stroke {
  points: { x: number; y: number }[];
}

interface FingerCanvasProps {
  open: boolean;
  onClose: () => void;
  onDone: (base64: string) => void;
  loading?: boolean;
}

export function FingerCanvas({ open, onClose, onDone, loading }: FingerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [isMobileDevice] = useState(() =>
    typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0)
  );

  const lineWidth = isMobileDevice ? 4 : 2.5;

  // Resize canvas to fill container
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      redraw(strokes);
    };

    // Small delay to let the overlay render
    const t = setTimeout(resize, 50);
    window.addEventListener("resize", resize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", resize);
    };
  }, [open, strokes]);

  const redraw = useCallback((strokesToDraw: Stroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const stroke of strokesToDraw) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  }, [lineWidth]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pos = getPos(e);
    setCurrentStroke({ points: [pos] });

    const canvas = canvasRef.current;
    if (canvas) canvas.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!currentStroke) return;
    e.preventDefault();
    const pos = getPos(e);
    const updated = { points: [...currentStroke.points, pos] };
    setCurrentStroke(updated);

    // Draw live stroke
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || updated.points.length < 2) return;
    const prev = updated.points[updated.points.length - 2];
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!currentStroke) return;
    e.preventDefault();
    const newStrokes = [...strokes, currentStroke];
    setStrokes(newStrokes);
    setCurrentStroke(null);
  };

  const handleUndo = () => {
    const newStrokes = strokes.slice(0, -1);
    setStrokes(newStrokes);
    redraw(newStrokes);
  };

  const handleClear = () => {
    setStrokes([]);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleDone = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const base64 = dataUrl.split(",")[1];
    onDone(base64);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            <X className="w-4 h-4 mr-1" /> Cancel
          </Button>
        </div>
        <p className="text-sm font-medium text-muted-foreground">Quick Note</p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleUndo} disabled={strokes.length === 0 || loading}>
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClear} disabled={strokes.length === 0 || loading}>
            <Eraser className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={handleDone} disabled={strokes.length === 0 || loading}>
            {loading ? (
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Reading…
              </span>
            ) : (
              <>
                <Check className="w-4 h-4 mr-1" /> Done
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 touch-none cursor-crosshair"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ touchAction: "none" }}
        />
        {strokes.length === 0 && !currentStroke && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-muted-foreground/40 text-lg">Write your prep notes here…</p>
          </div>
        )}
      </div>
    </div>
  );
}
