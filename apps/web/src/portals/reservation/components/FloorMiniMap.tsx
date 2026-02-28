import React from "react";
import type { ResTable } from "@/lib/shared/types/res.types";
import type { FloorZoneRegion } from "./FloorCanvas";

interface FloorMiniMapProps {
  tables: ResTable[];
  zones: FloorZoneRegion[];
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  panX: number;
  panY: number;
  containerWidth: number;
  containerHeight: number;
  onViewportJump: (panX: number, panY: number) => void;
}

const MINIMAP_WIDTH = 160;
const MINIMAP_HEIGHT = 100;
const ZOOM_THRESHOLD = 1.2;

const TABLE_DOT_RADIUS = 3;

export default function FloorMiniMap({
  tables,
  zones,
  canvasWidth,
  canvasHeight,
  zoom,
  panX,
  panY,
  containerWidth,
  containerHeight,
  onViewportJump,
}: FloorMiniMapProps) {
  if (zoom <= ZOOM_THRESHOLD) {
    return null;
  }

  // Scale factor to fit the full canvas into the minimap box
  const scaleX = MINIMAP_WIDTH / canvasWidth;
  const scaleY = MINIMAP_HEIGHT / canvasHeight;
  const scale = Math.min(scaleX, scaleY);

  // Scaled canvas dimensions (may be smaller than minimap box if aspect ratios differ)
  const scaledCanvasWidth = canvasWidth * scale;
  const scaledCanvasHeight = canvasHeight * scale;

  // Offset to center the scaled canvas within the minimap box
  const offsetX = (MINIMAP_WIDTH - scaledCanvasWidth) / 2;
  const offsetY = (MINIMAP_HEIGHT - scaledCanvasHeight) / 2;

  // Viewport indicator dimensions:
  // The visible area in canvas coordinates is (containerWidth / zoom) x (containerHeight / zoom).
  // panX and panY represent the top-left corner offset of the canvas relative to the container,
  // so the visible region in canvas coords starts at (-panX / zoom, -panY / zoom).
  const viewportCanvasX = -panX / zoom;
  const viewportCanvasY = -panY / zoom;
  const viewportCanvasW = containerWidth / zoom;
  const viewportCanvasH = containerHeight / zoom;

  // Clamp viewport rect to canvas bounds for display
  const vpX = Math.max(0, viewportCanvasX) * scale + offsetX;
  const vpY = Math.max(0, viewportCanvasY) * scale + offsetY;
  const vpW =
    Math.min(viewportCanvasW, canvasWidth - Math.max(0, viewportCanvasX)) *
    scale;
  const vpH =
    Math.min(viewportCanvasH, canvasHeight - Math.max(0, viewportCanvasY)) *
    scale;

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();

    // Click position within the SVG
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert click position to canvas coordinates
    const canvasX = (clickX - offsetX) / scale;
    const canvasY = (clickY - offsetY) / scale;

    // Compute panX/panY so the clicked point is centered in the container
    const newPanX = -(canvasX * zoom - containerWidth / 2);
    const newPanY = -(canvasY * zoom - containerHeight / 2);

    onViewportJump(newPanX, newPanY);
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: 12,
        left: 12,
        width: MINIMAP_WIDTH,
        height: MINIMAP_HEIGHT,
        backgroundColor: "rgba(15, 15, 15, 0.85)",
        borderRadius: 8,
        border: "1px solid rgba(255, 255, 255, 0.15)",
        overflow: "hidden",
        pointerEvents: "auto",
        zIndex: 20,
      }}
    >
      {/* Label */}
      <div
        style={{
          position: "absolute",
          top: 2,
          left: 6,
          fontSize: 9,
          fontWeight: 600,
          color: "rgba(255, 255, 255, 0.55)",
          letterSpacing: 0.5,
          userSelect: "none",
          lineHeight: 1,
          zIndex: 1,
        }}
      >
        Mini Map
      </div>

      <svg
        width={MINIMAP_WIDTH}
        height={MINIMAP_HEIGHT}
        style={{ cursor: "crosshair", display: "block" }}
        onClick={handleClick}
      >
        {/* Zones as faded rects */}
        {zones.map((zone) => (
          <rect
            key={zone.id}
            x={zone.x * scale + offsetX}
            y={zone.y * scale + offsetY}
            width={zone.width * scale}
            height={zone.height * scale}
            fill={zone.color ?? "rgba(100, 100, 255, 0.15)"}
            opacity={0.25}
            rx={1}
          />
        ))}

        {/* Tables as small colored dots */}
        {tables.map((table) => {
          const cx =
            (table.x_position + (table.width ?? 0) / 2) * scale + offsetX;
          const cy =
            (table.y_position + (table.height ?? 0) / 2) * scale + offsetY;
          const fill = table.is_blocked ? "#ef4444" : "#22c55e";

          return (
            <circle
              key={table.id}
              cx={cx}
              cy={cy}
              r={TABLE_DOT_RADIUS}
              fill={fill}
              opacity={0.9}
            />
          );
        })}

        {/* Viewport indicator */}
        <rect
          x={vpX}
          y={vpY}
          width={Math.max(vpW, 2)}
          height={Math.max(vpH, 2)}
          fill="rgba(59, 130, 246, 0.2)"
          stroke="rgba(59, 130, 246, 0.7)"
          strokeWidth={1.5}
          rx={1}
        />
      </svg>
    </div>
  );
}
