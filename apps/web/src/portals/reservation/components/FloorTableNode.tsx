import React from "react";
import { cn } from "@/lib/utils";
import type { ResTable, ReservationStatus } from "@/lib/shared/types/res.types";

export type TableDisplayStatus = 'AVAILABLE' | 'OCCUPIED' | 'DESSERT' | 'BLOCKED' | 'RESERVED' | 'BILL';

interface FloorTableNodeProps {
  table: ResTable;
  status?: TableDisplayStatus;
  guestName?: string;
  waiterInitials?: string;
  seatedTime?: string;
  isSelected?: boolean;
  isEditMode?: boolean;
  onClick?: () => void;
  onRotateStart?: (e: React.MouseEvent) => void;
}

/** Gradient fill URLs — the actual <linearGradient> defs live in FloorCanvas's <defs> block */
const statusGradientFills: Record<TableDisplayStatus, string> = {
  AVAILABLE: 'url(#grad-available)',
  OCCUPIED: 'url(#grad-occupied)',
  DESSERT: 'url(#grad-dessert)',
  BLOCKED: 'url(#grad-blocked)',
  RESERVED: 'url(#grad-reserved)',
  BILL: 'url(#grad-bill)',
};

/** Stroke-only Tailwind classes — kept as className fallbacks for strokes */
const statusStrokeColors: Record<TableDisplayStatus, string> = {
  AVAILABLE: 'stroke-emerald-700',
  OCCUPIED: 'stroke-red-700',
  DESSERT: 'stroke-amber-700',
  BLOCKED: 'stroke-muted-foreground/60',
  RESERVED: 'stroke-blue-700',
  BILL: 'stroke-amber-600',
};

// Chair fill colors matching the table status (same hue, slightly different opacity)
const chairStatusColors: Record<TableDisplayStatus, string> = {
  AVAILABLE: 'fill-emerald-500/70 stroke-emerald-700 stroke-[1.5]',
  OCCUPIED: 'fill-red-500/70 stroke-red-700 stroke-[1.5]',
  DESSERT: 'fill-amber-500/70 stroke-amber-700 stroke-[1.5]',
  BLOCKED: 'fill-muted-foreground/30 stroke-muted-foreground/50 stroke-[1.5]',
  RESERVED: 'fill-blue-500/70 stroke-blue-700 stroke-[1.5]',
  BILL: 'fill-amber-400/70 stroke-amber-600 stroke-[1.5]',
};

/** Renders a filled half-moon chair facing the table, colored to match table status.
 *  Includes a subtle inner arc line to suggest cushion padding. */
const HalfMoonChair = ({ cx, cy, angle, size = 10, colorClass }: { cx: number; cy: number; angle: number; size?: number; colorClass: string }) => {
  const r = size;
  // Inner cushion arc is drawn at ~60% radius for a padding effect
  const innerR = r * 0.6;
  return (
    <g transform={`translate(${cx},${cy}) rotate(${angle * 180 / Math.PI + 90})`}>
      <path
        d={`M ${-r} 0 A ${r} ${r} 0 0 1 ${r} 0 Z`}
        className={colorClass}
      />
      {/* Subtle inner cushion line */}
      <path
        d={`M ${-innerR} 0 A ${innerR} ${innerR} 0 0 1 ${innerR} 0`}
        className="stroke-white/25 fill-none stroke-[0.75]"
      />
    </g>
  );
};

const FloorTableNode = ({
  table, status = 'AVAILABLE', guestName, waiterInitials, seatedTime,
  isSelected, isEditMode, onClick, onRotateStart,
}: FloorTableNodeProps) => {
  const gradientFill = statusGradientFills[status];
  const strokeClass = statusStrokeColors[status];
  const chairColor = chairStatusColors[status];
  const x = table.x_position ?? 0;
  const y = table.y_position ?? 0;
  const w = table.width;
  const h = table.height;

  // Chair size proportional to table (clamped)
  const chairSize = Math.max(7, Math.min(12, Math.min(w, h) * 0.15));

  const renderShape = () => {
    const selectedCls = isSelected ? "stroke-primary stroke-[4]" : "";
    const baseCls = cn(strokeClass, "stroke-[3] transition-colors", selectedCls);

    switch (table.shape) {
      case 'ROUND':
        return <ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} fill={gradientFill} className={baseCls} />;
      case 'SQUARE':
        return <rect x={0} y={0} width={w} height={h} rx={6} fill={gradientFill} className={baseCls} />;
      case 'RECTANGLE':
        return <rect x={0} y={0} width={w} height={h} rx={8} fill={gradientFill} className={baseCls} />;
      case 'BAR':
        return (
          <>
            <rect x={0} y={0} width={w} height={h} rx={h / 2} fill={gradientFill} className={baseCls} />
            {Array.from({ length: Math.min(table.max_capacity, 12) }, (_, i) => {
              const sx = (w / (Math.min(table.max_capacity, 12) + 1)) * (i + 1);
              return <HalfMoonChair key={i} cx={sx} cy={h + chairSize + 5} angle={Math.PI} size={chairSize} colorClass={chairColor} />;
            })}
          </>
        );
      case 'COUNTER': {
        const seatCount = Math.min(table.max_capacity, 16);
        const isLandscape = w >= h;
        return (
          <>
            <rect x={0} y={0} width={w} height={h} rx={4} fill={gradientFill} className={baseCls} />
            <rect x={2} y={2} width={w - 4} height={isLandscape ? 6 : h - 4} rx={2} className="fill-white/10" />
            {isLandscape
              ? Array.from({ length: seatCount }, (_, i) => {
                  const sx = (w / (seatCount + 1)) * (i + 1);
                  return <HalfMoonChair key={i} cx={sx} cy={h + chairSize + 5} angle={Math.PI / 2} size={chairSize} colorClass={chairColor} />;
                })
              : Array.from({ length: seatCount }, (_, i) => {
                  const sy = (h / (seatCount + 1)) * (i + 1);
                  return <HalfMoonChair key={i} cx={w + chairSize + 5} cy={sy} angle={0} size={chairSize} colorClass={chairColor} />;
                })}
          </>
        );
      }
      case 'BANQUET': {
        // Wall-side bench on top, chairs on bottom
        const seatCount = Math.min(table.max_capacity, 16);
        return (
          <>
            {/* Bench / wall side (top) */}
            <rect x={0} y={0} width={w} height={h * 0.35} rx={4} fill={gradientFill} className={cn(strokeClass, "stroke-[3] opacity-60", selectedCls)} />
            {/* Table surface */}
            <rect x={0} y={h * 0.35} width={w} height={h * 0.65} rx={4} fill={gradientFill} className={baseCls} />
            {/* Chairs on the open side (bottom) */}
            {Array.from({ length: seatCount }, (_, i) => {
              const sx = (w / (seatCount + 1)) * (i + 1);
              return <HalfMoonChair key={i} cx={sx} cy={h + chairSize + 5} angle={Math.PI / 2} size={chairSize} colorClass={chairColor} />;
            })}
          </>
        );
      }
      default:
        return <rect x={0} y={0} width={w} height={h} rx={8} fill={gradientFill} className={baseCls} />;
    }
  };

  /** Selection corner handles — 4 small squares at bounding box corners */
  const renderSelectionHandles = () => {
    if (!isEditMode || !isSelected) return null;
    const handleSize = 6;
    const half = handleSize / 2;
    const corners = [
      { x: -half, y: -half },
      { x: w - half, y: -half },
      { x: -half, y: h - half },
      { x: w - half, y: h - half },
    ];
    return (
      <g>
        {corners.map((corner, i) => (
          <rect
            key={i}
            x={corner.x}
            y={corner.y}
            width={handleSize}
            height={handleSize}
            fill="white"
            className="stroke-primary stroke-[1.5]"
          />
        ))}
      </g>
    );
  };

  /** Rotation handle — line from top center upward with a grab circle */
  const renderRotationHandle = () => {
    if (!isEditMode || !isSelected) return null;
    const topCenterX = w / 2;
    const topCenterY = 0;
    const handleY = topCenterY - 20;
    return (
      <g>
        <line
          x1={topCenterX}
          y1={topCenterY}
          x2={topCenterX}
          y2={handleY}
          stroke="#C9A96E"
          strokeWidth={1.5}
        />
        <circle
          cx={topCenterX}
          cy={handleY}
          r={6}
          fill="#C9A96E"
          stroke="#C9A96E"
          strokeWidth={1}
          className="cursor-grab"
          data-rotation-handle="true"
          onMouseDown={onRotateStart}
        />
      </g>
    );
  };

  return (
    <g
      transform={`translate(${x}, ${y}) rotate(${table.rotation}, ${w / 2}, ${h / 2})`}
      onClick={onClick}
      className={cn(
        "cursor-pointer transition-all duration-150",
        isEditMode ? "" : "hover:brightness-110"
      )}
      filter="url(#tableShadow)"
    >
      {/* Hover highlight ring (non-edit, non-selected) */}
      {!isEditMode && !isSelected && (
        <rect
          x={-4} y={-4}
          width={w + 8} height={h + 8}
          rx={table.shape === 'ROUND' ? (w + 8) / 2 : 12}
          fill="transparent"
          className="stroke-transparent hover:stroke-primary/30 stroke-[2] transition-colors"
          pointerEvents="none"
        />
      )}
      {renderShape()}
      {/* Half-moon chairs for round/square tables */}
      {(table.shape === 'ROUND' || table.shape === 'SQUARE') && (
        <g>
          {Array.from({ length: Math.min(table.max_capacity, 8) }, (_, i) => {
            const angle = (2 * Math.PI * i) / Math.min(table.max_capacity, 8) - Math.PI / 2;
            const radius = Math.max(w, h) / 2 + chairSize + 5;
            const cx = w / 2 + Math.cos(angle) * radius;
            const cy = h / 2 + Math.sin(angle) * radius;
            return <HalfMoonChair key={i} cx={cx} cy={cy} angle={angle} size={chairSize} colorClass={chairColor} />;
          })}
        </g>
      )}
      {/* Rectangle chairs */}
      {table.shape === 'RECTANGLE' && (
        <g>
          {Array.from({ length: Math.max(1, Math.floor(table.max_capacity / 2)) }, (_, i) => {
            const sx = (w / (Math.floor(table.max_capacity / 2) + 1)) * (i + 1);
            return (
          <React.Fragment key={i}>
                <HalfMoonChair cx={sx} cy={-(chairSize + 3)} angle={-Math.PI / 2} size={chairSize} colorClass={chairColor} />
                <HalfMoonChair cx={sx} cy={h + chairSize + 3} angle={Math.PI / 2} size={chairSize} colorClass={chairColor} />
              </React.Fragment>
            );
          })}
        </g>
      )}
      {/* Table name */}
      <text
        x={w / 2} y={h / 2 - (guestName ? 6 : 0)}
        textAnchor="middle" dominantBaseline="middle"
        className="fill-white text-[11px] font-bold pointer-events-none select-none"
      >
        {table.name}
      </text>
      {guestName && (
        <text
          x={w / 2} y={h / 2 + 10}
          textAnchor="middle" dominantBaseline="middle"
          className="fill-white/90 text-[9px] pointer-events-none select-none"
        >
          {guestName.length > 10 ? guestName.slice(0, 10) + '…' : guestName}
        </text>
      )}
      {/* Capacity */}
      <text
        x={w / 2} y={h + (table.shape === 'BAR' || table.shape === 'COUNTER' ? chairSize * 2 + 14 : (table.shape === 'RECTANGLE' ? chairSize * 2 + 10 : chairSize + 18))}
        textAnchor="middle"
        className="fill-muted-foreground text-[9px] font-semibold pointer-events-none select-none"
      >
        {table.max_capacity} pax
      </text>
      {/* Combined badge */}
      {table.group_id && (
        <g>
          <circle cx={0} cy={0} r={8} className="fill-primary" />
          <text x={0} y={1} textAnchor="middle" dominantBaseline="middle" className="fill-primary-foreground text-[8px] font-bold pointer-events-none">🔗</text>
        </g>
      )}
      {/* Blocked badge */}
      {table.is_blocked && (
        <g>
          <circle cx={w} cy={h} r={8} className="fill-destructive" />
          <text x={w} y={h + 1} textAnchor="middle" dominantBaseline="middle" className="fill-white text-[8px] pointer-events-none">✕</text>
        </g>
      )}
      {/* Edit mode indicator */}
      {isEditMode && !table.group_id && !table.is_blocked && (
        <circle cx={w} cy={0} r={6} className="fill-primary stroke-primary-foreground stroke-1" />
      )}
      {/* Waiter initials badge */}
      {waiterInitials && (
        <g>
          <rect
            x={w - 20} y={-10}
            width={22} height={14} rx={4}
            className="fill-violet-500"
          />
          <text
            x={w - 9} y={-2}
            textAnchor="middle" dominantBaseline="middle"
            className="fill-white text-[7px] font-bold pointer-events-none select-none"
          >
            {waiterInitials}
          </text>
        </g>
      )}
      {/* Selection corner handles */}
      {renderSelectionHandles()}
      {/* Rotation handle */}
      {renderRotationHandle()}
    </g>
  );
};

export default FloorTableNode;
