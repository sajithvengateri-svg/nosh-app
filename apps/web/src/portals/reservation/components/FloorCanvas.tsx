import React, { useRef, useState, useCallback, useMemo, useEffect } from "react";
import FloorTableNode, { type TableDisplayStatus } from "./FloorTableNode";
import FloorDecorNode, { type DecorElement } from "./FloorDecorNode";
import type { ResTable, ResFloorLayout, ResReservation, TableZone } from "@/lib/shared/types/res.types";
import type { SmartGuide } from "../utils/canvasUtils";

export interface FloorZoneRegion {
  id: string;
  zone: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
}

interface FloorCanvasProps {
  tables: ResTable[];
  layout?: ResFloorLayout | null;
  reservations?: ResReservation[];
  zones?: FloorZoneRegion[];
  decorElements?: DecorElement[];
  isEditMode?: boolean;
  selectedTableId?: string | null;
  selectedTableIds?: Set<string>;
  selectedZoneId?: string | null;
  selectedDecorId?: string | null;
  viewport?: ViewportState;
  isPanning?: boolean;
  gridSize?: number;
  smartGuides?: SmartGuide[];
  onTableClick?: (table: ResTable, shiftKey: boolean) => void;
  onTableDrag?: (tableId: string, x: number, y: number) => void;
  onTableRotate?: (tableId: string, angle: number) => void;
  onTableZoneChange?: (tableId: string, zone: TableZone) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onZoneClick?: (zoneId: string) => void;
  onZoneDrag?: (zoneId: string, x: number, y: number) => void;
  onZoneResize?: (zoneId: string, w: number, h: number) => void;
  onDecorClick?: (id: string) => void;
  onDecorDrag?: (id: string, x: number, y: number) => void;
  onLassoSelect?: (tableIds: string[]) => void;
  onCanvasClick?: () => void;
  onWheel?: (e: React.WheelEvent) => void;
  onTableAction?: (tableId: string, action: string) => void;
  waiterMap?: Record<string, string>;
  floorActionMode?: 'radial' | 'popover';
}

const ZONE_COLOR_MAP: Record<string, { bg: string; border: string; text: string }> = {
  'rgba(59,130,246,0.25)': { bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.25)', text: 'rgba(59,130,246,0.8)' },
  'rgba(34,197,94,0.25)': { bg: 'rgba(34,197,94,0.06)', border: 'rgba(34,197,94,0.25)', text: 'rgba(34,197,94,0.8)' },
  'rgba(168,85,247,0.25)': { bg: 'rgba(168,85,247,0.06)', border: 'rgba(168,85,247,0.25)', text: 'rgba(168,85,247,0.8)' },
  'rgba(234,179,8,0.25)': { bg: 'rgba(234,179,8,0.06)', border: 'rgba(234,179,8,0.25)', text: 'rgba(234,179,8,0.8)' },
  'rgba(239,68,68,0.25)': { bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.25)', text: 'rgba(239,68,68,0.8)' },
  'rgba(107,114,128,0.25)': { bg: 'rgba(107,114,128,0.06)', border: 'rgba(107,114,128,0.25)', text: 'rgba(107,114,128,0.8)' },
};

function getColorSet(color: string) {
  return ZONE_COLOR_MAP[color] ?? { bg: color.replace(/[\d.]+\)$/, '0.06)'), border: color, text: color.replace(/[\d.]+\)$/, '0.8)') };
}

function getTableStatus(table: ResTable, reservations: ResReservation[]): { status: TableDisplayStatus; guestName?: string } {
  if (table.is_blocked) return { status: 'BLOCKED' };
  const seated = reservations.find(r => r.table_id === table.id && r.status === 'SEATED');
  if (seated) {
    const guest = (seated as any).res_guests;
    const name = guest
      ? `${guest.first_name} ${guest.last_name}`
      : (seated as any).guest_name || undefined;
    if ((seated as any).notes?.includes('[BILL_DROPPED]')) {
      return { status: 'BILL', guestName: name };
    }
    return { status: 'OCCUPIED', guestName: name };
  }
  const confirmed = reservations.find(r => r.table_id === table.id && r.status === 'CONFIRMED');
  if (confirmed) {
    const guest = (confirmed as any).res_guests;
    const name = guest
      ? `${guest.first_name} ${guest.last_name}`
      : (confirmed as any).guest_name || undefined;
    return { status: 'RESERVED', guestName: name };
  }
  if (!table.is_active) return { status: 'BLOCKED' };
  return { status: 'AVAILABLE' };
}

function getCombineLinks(tables: ResTable[]) {
  const groups = new Map<string, ResTable[]>();
  tables.forEach(t => {
    if (t.group_id && t.x_position != null) {
      const arr = groups.get(t.group_id) ?? [];
      arr.push(t);
      groups.set(t.group_id, arr);
    }
  });
  const links: { x1: number; y1: number; x2: number; y2: number }[] = [];
  groups.forEach(grp => {
    for (let i = 0; i < grp.length - 1; i++) {
      const a = grp[i], b = grp[i + 1];
      links.push({
        x1: (a.x_position ?? 0) + a.width / 2,
        y1: (a.y_position ?? 0) + a.height / 2,
        x2: (b.x_position ?? 0) + b.width / 2,
        y2: (b.y_position ?? 0) + b.height / 2,
      });
    }
  });
  return links;
}

type DragTarget =
  | { type: 'table'; id: string }
  | { type: 'zone'; id: string }
  | { type: 'zone-resize'; id: string }
  | { type: 'table-rotate'; id: string }
  | { type: 'decor'; id: string }
  | { type: 'lasso' };

interface LassoRect {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

/* ------------------------------------------------------------------ */
/*  Action definitions per table status                               */
/* ------------------------------------------------------------------ */

interface MenuAction {
  key: string;
  label: string;
  icon: string;
  color: string;
  primary?: boolean;
}

/*
 * Intentional status-specific action colours — these map to reservation
 * workflow semantics (green = positive, red = destructive, amber = billing,
 * blue = booking, violet = assignment, gray = neutral/cancel).  They are
 * used as SVG fill colours in the RadialMenu and as button backgrounds
 * in PopoverCard, so they must remain hardcoded hex values.
 */
const ACTIONS_BY_STATUS: Record<string, MenuAction[]> = {
  AVAILABLE: [
    { key: 'walkin', label: 'Walk-in', icon: '\u{1F6B6}', color: '#22c55e', primary: true },
    { key: 'book', label: 'Book', icon: '\u{1F4C5}', color: '#3b82f6' },
    { key: 'block', label: 'Block', icon: '\u{1F6AB}', color: '#ef4444' },
    { key: 'assign', label: 'Assign', icon: '\u{1F464}', color: '#8b5cf6' },
  ],
  RESERVED: [
    { key: 'seat', label: 'Seat Guest', icon: '\u{1FA91}', color: '#22c55e', primary: true },
    { key: 'noshow', label: 'No Show', icon: '\u{1F6AB}', color: '#ef4444' },
    { key: 'cancel', label: 'Cancel', icon: '\u274C', color: '#6b7280' },
    { key: 'assign', label: 'Assign', icon: '\u{1F464}', color: '#8b5cf6' },
  ],
  OCCUPIED: [
    { key: 'bill', label: 'Drop Bill', icon: '\u{1F4B3}', color: '#f59e0b', primary: true },
    { key: 'left', label: 'Left', icon: '\u{1F44B}', color: '#6b7280' },
    { key: 'assign', label: 'Assign', icon: '\u{1F464}', color: '#8b5cf6' },
    { key: 'block', label: 'Block', icon: '\u{1F6AB}', color: '#ef4444' },
  ],
  BILL: [
    { key: 'left', label: 'Mark Left', icon: '\u{1F44B}', color: '#22c55e', primary: true },
    { key: 'assign', label: 'Assign', icon: '\u{1F464}', color: '#8b5cf6' },
    { key: 'block', label: 'Block', icon: '\u{1F6AB}', color: '#ef4444' },
  ],
  BLOCKED: [
    { key: 'unblock', label: 'Unblock', icon: '\u2705', color: '#22c55e', primary: true },
  ],
};

function getActionsForStatus(status: TableDisplayStatus): MenuAction[] {
  return ACTIONS_BY_STATUS[status] ?? ACTIONS_BY_STATUS['AVAILABLE']!;
}

/* ------------------------------------------------------------------ */
/*  SVG arc helpers                                                    */
/* ------------------------------------------------------------------ */

function describeArc(cx: number, cy: number, innerR: number, outerR: number, startAngle: number, endAngle: number): string {
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;

  const x1Outer = cx + outerR * Math.cos(toRad(startAngle));
  const y1Outer = cy + outerR * Math.sin(toRad(startAngle));
  const x2Outer = cx + outerR * Math.cos(toRad(endAngle));
  const y2Outer = cy + outerR * Math.sin(toRad(endAngle));

  const x1Inner = cx + innerR * Math.cos(toRad(endAngle));
  const y1Inner = cy + innerR * Math.sin(toRad(endAngle));
  const x2Inner = cx + innerR * Math.cos(toRad(startAngle));
  const y2Inner = cy + innerR * Math.sin(toRad(startAngle));

  const arcSweep = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    `M ${x1Outer} ${y1Outer}`,
    `A ${outerR} ${outerR} 0 ${arcSweep} 1 ${x2Outer} ${y2Outer}`,
    `L ${x1Inner} ${y1Inner}`,
    `A ${innerR} ${innerR} 0 ${arcSweep} 0 ${x2Inner} ${y2Inner}`,
    'Z',
  ].join(' ');
}

function arcMidpoint(cx: number, cy: number, r: number, startAngle: number, endAngle: number): { x: number; y: number } {
  const midAngle = (startAngle + endAngle) / 2;
  const rad = ((midAngle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/* ------------------------------------------------------------------ */
/*  RadialMenu — SVG inline radial menu around a table                */
/* ------------------------------------------------------------------ */

interface RadialMenuProps {
  table: ResTable;
  status: TableDisplayStatus;
  reservation: ResReservation | null;
  onAction: (action: string) => void;
  onClose: () => void;
}

const RadialMenu: React.FC<RadialMenuProps> = ({ table, status, onAction, onClose }) => {
  const cx = (table.x_position ?? 0) + table.width / 2;
  const cy = (table.y_position ?? 0) + table.height / 2;
  const actions = getActionsForStatus(status);
  const count = actions.length;
  const innerR = 36;
  const outerR = 72;
  const gap = 4; // degrees gap between segments
  const segAngle = 360 / count;

  return (
    <g className="radial-menu">
      {/* Semi-transparent overlay behind the menu — click to close */}
      <rect
        x={cx - 120}
        y={cy - 120}
        width={240}
        height={240}
        fill="rgba(0,0,0,0.25)"
        rx={12}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{ cursor: 'pointer' }}
      />

      {actions.map((action, i) => {
        const startAngle = i * segAngle + gap / 2;
        const endAngle = (i + 1) * segAngle - gap / 2;
        const path = describeArc(cx, cy, innerR, outerR, startAngle, endAngle);
        const midR = (innerR + outerR) / 2;
        const mid = arcMidpoint(cx, cy, midR, startAngle, endAngle);
        const labelMid = arcMidpoint(cx, cy, outerR + 12, startAngle, endAngle);

        return (
          <g
            key={action.key}
            className="radial-menu-segment"
            onClick={(e) => {
              e.stopPropagation();
              onAction(action.key);
              onClose();
            }}
            style={{ cursor: 'pointer' }}
          >
            <path
              d={path}
              fill={action.color}
              opacity={0.85}
              stroke="white"
              strokeWidth={1.5}
            />
            <text
              x={mid.x}
              y={mid.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={14}
              pointerEvents="none"
            >
              {action.icon}
            </text>
            <text
              x={labelMid.x}
              y={labelMid.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="currentColor"
              className="fill-foreground"
              fontSize={9}
              fontWeight={600}
              pointerEvents="none"
            >
              {action.label}
            </text>
          </g>
        );
      })}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/*  PopoverCard — foreignObject card positioned near a table          */
/* ------------------------------------------------------------------ */

interface PopoverCardProps {
  table: ResTable;
  status: TableDisplayStatus;
  guestName?: string;
  reservation: ResReservation | null;
  waiterInitials?: string;
  onAction: (action: string) => void;
  onClose: () => void;
}

const PopoverCard: React.FC<PopoverCardProps> = ({ table, status, guestName, reservation, waiterInitials, onAction, onClose }) => {
  const tx = (table.x_position ?? 0) + table.width + 12;
  const ty = (table.y_position ?? 0) - 10;
  const cardW = 240;
  const actions = getActionsForStatus(status);
  const primaryAction = actions.find(a => a.primary);
  const secondaryActions = actions.filter(a => !a.primary);
  const pax = reservation?.party_size ?? table.min_capacity ?? 0;
  const cardH = 180 + (secondaryActions.length > 0 ? 36 : 0);

  /*
   * Intentional status-specific badge colours — each maps to a reservation
   * status semantic (green = available, blue = reserved, red = occupied,
   * yellow = bill/dessert, gray = blocked).  Used inside SVG foreignObject
   * where Tailwind classes are unreliable, so hardcoded hex is required.
   */
  const STATUS_BADGES: Record<string, { bg: string; text: string }> = {
    AVAILABLE: { bg: '#dcfce7', text: '#166534' },
    RESERVED: { bg: '#dbeafe', text: '#1e40af' },
    OCCUPIED: { bg: '#fee2e2', text: '#991b1b' },
    BILL: { bg: '#fef9c3', text: '#854d0e' },
    BLOCKED: { bg: '#f3f4f6', text: '#374151' },
    DESSERT: { bg: '#fef3c7', text: '#92400e' },
  };

  const badge = STATUS_BADGES[status] ?? STATUS_BADGES['AVAILABLE']!;

  return (
    <foreignObject x={tx} y={ty} width={cardW} height={cardH}>
      <div
        // @ts-expect-error -- xmlns is needed for foreignObject in SVG but React types don't include it
        xmlns="http://www.w3.org/1999/xhtml"
        style={{
          width: cardW,
          background: 'hsl(var(--popover))',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
          padding: 14,
          fontFamily: 'system-ui, sans-serif',
          fontSize: 13,
          color: 'hsl(var(--popover-foreground))',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={{
            position: 'absolute', top: 8, right: 10, background: 'none', border: 'none',
            fontSize: 16, cursor: 'pointer', color: 'hsl(var(--muted-foreground))', lineHeight: 1,
          }}
        >
          \u2715
        </button>

        {/* Header: table name + zone */}
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>
          {table.name}
          {table.zone && <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', fontWeight: 400, marginLeft: 6 }}>{table.zone}</span>}
        </div>

        {/* Info row: guest + pax + status + waiter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          <span style={{
            display: 'inline-block', padding: '2px 8px', borderRadius: 6,
            fontSize: 10, fontWeight: 600, background: badge.bg, color: badge.text,
          }}>
            {status}
          </span>
          {guestName && <span style={{ fontSize: 12 }}>{guestName}</span>}
          {pax > 0 && <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{pax} pax</span>}
          {waiterInitials && (
            <span style={{ fontSize: 10, background: '#8b5cf6', color: 'white', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
              {waiterInitials}
            </span>
          )}
        </div>

        {/* Primary action — big prominent button */}
        {primaryAction && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction(primaryAction.key);
              onClose();
            }}
            style={{
              width: '100%',
              height: 40,
              borderRadius: 8,
              border: 'none',
              background: primaryAction.color,
              color: 'white',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              marginBottom: secondaryActions.length > 0 ? 8 : 0,
            }}
          >
            {primaryAction.icon} {primaryAction.label}
          </button>
        )}

        {/* Secondary actions — small row */}
        {secondaryActions.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {secondaryActions.map(action => (
              <button
                key={action.key}
                onClick={(e) => {
                  e.stopPropagation();
                  onAction(action.key);
                  onClose();
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--muted))',
                  color: 'hsl(var(--foreground))',
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                {action.icon} {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </foreignObject>
  );
};

/* ------------------------------------------------------------------ */
/*  FloorCanvas component                                              */
/* ------------------------------------------------------------------ */

const FloorCanvas = ({
  tables,
  layout,
  reservations = [],
  zones = [],
  decorElements = [],
  isEditMode = false,
  selectedTableId,
  selectedTableIds,
  selectedZoneId,
  selectedDecorId,
  viewport,
  isPanning = false,
  gridSize = 100,
  smartGuides = [],
  onTableClick,
  onTableDrag,
  onTableRotate,
  onTableZoneChange,
  onDragStart,
  onDragEnd,
  onZoneClick,
  onZoneDrag,
  onZoneResize,
  onDecorClick,
  onDecorDrag,
  onLassoSelect,
  onCanvasClick,
  onWheel,
  onTableAction,
  waiterMap,
  floorActionMode,
}: FloorCanvasProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragTarget, setDragTarget] = useState<DragTarget | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [lassoRect, setLassoRect] = useState<LassoRect | null>(null);
  const [menuTableId, setMenuTableId] = useState<string | null>(null);

  // Close the radial/popover menu on Escape key
  useEffect(() => {
    if (!menuTableId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuTableId(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [menuTableId]);

  const canvasW = layout?.canvas_width ?? 1200;
  const canvasH = layout?.canvas_height ?? 800;

  const zoom = viewport?.zoom ?? 1;
  const panX = viewport?.panX ?? 0;
  const panY = viewport?.panY ?? 0;

  const getSvgPoint = useCallback((e: React.MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM()?.inverse();
    if (!ctm) return null;
    const svgPt = pt.matrixTransform(ctm);
    return {
      x: (svgPt.x - panX) / zoom,
      y: (svgPt.y - panY) / zoom,
    };
  }, [zoom, panX, panY]);

  const handleTableMouseDown = useCallback((e: React.MouseEvent, table: ResTable) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    const svgP = getSvgPoint(e);
    if (!svgP) return;
    setOffset({ x: svgP.x - (table.x_position ?? 0), y: svgP.y - (table.y_position ?? 0) });
    setDragTarget({ type: 'table', id: table.id });
    onDragStart?.();
  }, [isEditMode, getSvgPoint, onDragStart]);

  const handleTableRotateMouseDown = useCallback((e: React.MouseEvent, table: ResTable) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    setDragTarget({ type: 'table-rotate', id: table.id });
    onDragStart?.();
  }, [isEditMode, onDragStart]);

  const handleZoneMouseDown = useCallback((e: React.MouseEvent, zone: FloorZoneRegion) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    const svgP = getSvgPoint(e);
    if (!svgP) return;
    setOffset({ x: svgP.x - zone.x, y: svgP.y - zone.y });
    setDragTarget({ type: 'zone', id: zone.id });
    onZoneClick?.(zone.id);
    onDragStart?.();
  }, [isEditMode, getSvgPoint, onZoneClick, onDragStart]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, zone: FloorZoneRegion) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    const svgP = getSvgPoint(e);
    if (!svgP) return;
    setOffset({ x: svgP.x - zone.width, y: svgP.y - zone.height });
    setDragTarget({ type: 'zone-resize', id: zone.id });
    onDragStart?.();
  }, [isEditMode, getSvgPoint, onDragStart]);

  const handleDecorMouseDown = useCallback((e: React.MouseEvent, element: DecorElement) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    const svgP = getSvgPoint(e);
    if (!svgP) return;
    setOffset({ x: svgP.x - element.x, y: svgP.y - element.y });
    setDragTarget({ type: 'decor', id: element.id });
    onDecorClick?.(element.id);
    onDragStart?.();
  }, [isEditMode, getSvgPoint, onDecorClick, onDragStart]);

  const handleSvgMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as SVGElement;
    if (target.tagName === 'svg' || target.classList.contains('canvas-bg')) {
      // Always close the radial/popover menu on canvas click
      setMenuTableId(null);
      onCanvasClick?.();
      if (isEditMode && onLassoSelect) {
        const svgP = getSvgPoint(e);
        if (!svgP) return;
        setLassoRect({ startX: svgP.x, startY: svgP.y, currentX: svgP.x, currentY: svgP.y });
        setDragTarget({ type: 'lasso' });
      }
    }
  }, [isEditMode, getSvgPoint, onCanvasClick, onLassoSelect]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragTarget || !isEditMode) return;
    const svgP = getSvgPoint(e);
    if (!svgP) return;

    if (dragTarget.type === 'table') {
      onTableDrag?.(dragTarget.id, svgP.x - offset.x, svgP.y - offset.y);
    } else if (dragTarget.type === 'zone') {
      onZoneDrag?.(dragTarget.id, Math.max(0, svgP.x - offset.x), Math.max(0, svgP.y - offset.y));
    } else if (dragTarget.type === 'zone-resize') {
      onZoneResize?.(dragTarget.id, Math.max(100, svgP.x - offset.x), Math.max(80, svgP.y - offset.y));
    } else if (dragTarget.type === 'decor') {
      onDecorDrag?.(dragTarget.id, svgP.x - offset.x, svgP.y - offset.y);
    } else if (dragTarget.type === 'table-rotate') {
      const table = tables.find(t => t.id === dragTarget.id);
      if (table && onTableRotate) {
        const centerX = (table.x_position ?? 0) + table.width / 2;
        const centerY = (table.y_position ?? 0) + table.height / 2;
        let angle = Math.atan2(svgP.y - centerY, svgP.x - centerX) * 180 / Math.PI + 90;
        if (e.shiftKey) {
          angle = Math.round(angle / 15) * 15;
        }
        angle = ((angle % 360) + 360) % 360;
        onTableRotate(dragTarget.id, angle);
      }
    } else if (dragTarget.type === 'lasso' && lassoRect) {
      setLassoRect(prev => prev ? { ...prev, currentX: svgP.x, currentY: svgP.y } : null);
    }
  }, [dragTarget, isEditMode, offset, getSvgPoint, lassoRect, tables, onTableDrag, onZoneDrag, onZoneResize, onDecorDrag, onTableRotate]);

  const handleMouseUp = useCallback(() => {
    if (dragTarget?.type === 'table' && onTableZoneChange) {
      const table = tables.find(t => t.id === dragTarget.id);
      if (table) {
        const cx = (table.x_position ?? 0) + table.width / 2;
        const cy = (table.y_position ?? 0) + table.height / 2;
        const region = zones.find(r => cx >= r.x && cx <= r.x + r.width && cy >= r.y && cy <= r.y + r.height);
        if (region && region.zone !== table.zone) {
          onTableZoneChange(dragTarget.id, region.zone as TableZone);
        }
      }
    }

    if (dragTarget?.type === 'lasso' && lassoRect && onLassoSelect) {
      const lx = Math.min(lassoRect.startX, lassoRect.currentX);
      const ly = Math.min(lassoRect.startY, lassoRect.currentY);
      const lw = Math.abs(lassoRect.currentX - lassoRect.startX);
      const lh = Math.abs(lassoRect.currentY - lassoRect.startY);

      const selectedIds = tables.filter(t => {
        if (t.x_position == null || t.y_position == null) return false;
        const tx = t.x_position;
        const ty = t.y_position;
        const tw = t.width;
        const th = t.height;
        return tx < lx + lw && tx + tw > lx && ty < ly + lh && ty + th > ly;
      }).map(t => t.id);

      onLassoSelect(selectedIds);
    }

    setDragTarget(null);
    setLassoRect(null);
    onDragEnd?.();
  }, [dragTarget, tables, zones, lassoRect, onTableZoneChange, onLassoSelect, onDragEnd]);

  const isTableSelected = useCallback((tableId: string) => {
    if (selectedTableId === tableId) return true;
    if (selectedTableIds && selectedTableIds.has(tableId)) return true;
    return false;
  }, [selectedTableId, selectedTableIds]);

  const cursorStyle = useMemo(() => {
    if (isPanning) return 'grabbing';
    if (viewport && !dragTarget) return 'grab';
    return isEditMode ? 'crosshair' : 'default';
  }, [isPanning, viewport, dragTarget, isEditMode]);

  const majorGridInterval = gridSize * 4;

  const minorGridLines = useMemo(() => {
    const lines: React.ReactNode[] = [];
    const vCount = Math.floor(canvasW / gridSize);
    const hCount = Math.floor(canvasH / gridSize);
    for (let i = 1; i <= vCount; i++) {
      if ((i * gridSize) % majorGridInterval === 0) continue;
      lines.push(
        <line key={`mv${i}`} x1={i * gridSize} y1={0} x2={i * gridSize} y2={canvasH} stroke="currentColor" className="opacity-5" />
      );
    }
    for (let i = 1; i <= hCount; i++) {
      if ((i * gridSize) % majorGridInterval === 0) continue;
      lines.push(
        <line key={`mh${i}`} x1={0} y1={i * gridSize} x2={canvasW} y2={i * gridSize} stroke="currentColor" className="opacity-5" />
      );
    }
    return lines;
  }, [canvasW, canvasH, gridSize, majorGridInterval]);

  const majorGridLines = useMemo(() => {
    const lines: React.ReactNode[] = [];
    const vCount = Math.floor(canvasW / majorGridInterval);
    const hCount = Math.floor(canvasH / majorGridInterval);
    for (let i = 1; i <= vCount; i++) {
      lines.push(
        <line key={`Mv${i}`} x1={i * majorGridInterval} y1={0} x2={i * majorGridInterval} y2={canvasH} stroke="currentColor" className="opacity-15" />
      );
    }
    for (let i = 1; i <= hCount; i++) {
      lines.push(
        <line key={`Mh${i}`} x1={0} y1={i * majorGridInterval} x2={canvasW} y2={i * majorGridInterval} stroke="currentColor" className="opacity-15" />
      );
    }
    return lines;
  }, [canvasW, canvasH, majorGridInterval]);

  const lassoRenderRect = useMemo(() => {
    if (!lassoRect) return null;
    return {
      x: Math.min(lassoRect.startX, lassoRect.currentX),
      y: Math.min(lassoRect.startY, lassoRect.currentY),
      width: Math.abs(lassoRect.currentX - lassoRect.startX),
      height: Math.abs(lassoRect.currentY - lassoRect.startY),
    };
  }, [lassoRect]);

  return (
    <div className="w-full overflow-auto rounded-lg border border-border bg-muted/30">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${canvasW} ${canvasH}`}
        className="w-full h-auto min-h-[400px]"
        style={{ cursor: cursorStyle }}
        onMouseDown={handleSvgMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={onWheel}
      >
        {/*
          * Intentional status-specific SVG gradient fills — these provide the
          * table fill colours on the floor plan canvas.  Each gradient maps to
          * a reservation status (available=green, occupied=red, dessert=amber,
          * reserved=blue, bill=yellow, blocked=gray).  Referenced via
          * url(#grad-{status}) in FloorTableNode.  Must remain hardcoded hex
          * as SVG gradients cannot use CSS custom properties reliably.
          */}
        <defs>
          <filter id="tableShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx={0} dy={2} stdDeviation={3} floodOpacity={0.15} />
          </filter>
          <linearGradient id="grad-available" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="grad-occupied" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
          <linearGradient id="grad-dessert" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="grad-reserved" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="grad-bill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fcd34d" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="grad-blocked" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#9ca3af" />
            <stop offset="100%" stopColor="#6b7280" />
          </linearGradient>
        </defs>

        {/* Canvas background rect for click detection */}
        <rect
          x={0} y={0} width={canvasW} height={canvasH}
          fill="transparent"
          className="canvas-bg"
        />

        {layout?.background_url && (
          <image href={layout.background_url} x={0} y={0} width={canvasW} height={canvasH} preserveAspectRatio="xMidYMid slice" opacity={0.3} />
        )}

        {/* Viewport transform group */}
        <g transform={`translate(${panX},${panY}) scale(${zoom})`}>

          {/* Grid lines in edit mode */}
          {isEditMode && (
            <g>
              {minorGridLines}
              {majorGridLines}
            </g>
          )}

          {/* Zone regions */}
          {zones.map(zone => {
            const colors = getColorSet(zone.color);
            const isSelected = selectedZoneId === zone.id;
            const tableCount = tables.filter(t => t.zone === zone.zone).length;
            return (
              <g key={zone.id}>
                <rect
                  x={zone.x} y={zone.y} width={zone.width} height={zone.height}
                  rx={12}
                  fill={colors.bg}
                  stroke={isSelected ? colors.text : colors.border}
                  strokeWidth={isSelected ? 3 : 2}
                  strokeDasharray={isSelected ? undefined : "8 4"}
                  onMouseDown={(e) => handleZoneMouseDown(e, zone)}
                  style={{ cursor: isEditMode ? 'move' : 'default' }}
                />
                {/* Zone label */}
                <text
                  x={zone.x + 14} y={zone.y + 24}
                  fill={colors.text}
                  fontSize={14}
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {zone.label}
                </text>
                {/* Table count */}
                <text
                  x={zone.x + zone.width - 14} y={zone.y + 24}
                  textAnchor="end"
                  fill={colors.text}
                  fontSize={11}
                  pointerEvents="none"
                >
                  {tableCount} tables
                </text>
                {/* Resize handle (bottom-right corner) */}
                {isEditMode && (
                  <g
                    onMouseDown={(e) => handleResizeMouseDown(e, zone)}
                    style={{ cursor: 'nwse-resize' }}
                  >
                    <rect
                      x={zone.x + zone.width - 18} y={zone.y + zone.height - 18}
                      width={16} height={16} rx={3}
                      fill={colors.border} opacity={0.8}
                    />
                    <path
                      d={`M${zone.x + zone.width - 12} ${zone.y + zone.height - 5} L${zone.x + zone.width - 5} ${zone.y + zone.height - 12}`}
                      stroke={colors.text} strokeWidth={2} fill="none"
                    />
                    <path
                      d={`M${zone.x + zone.width - 8} ${zone.y + zone.height - 5} L${zone.x + zone.width - 5} ${zone.y + zone.height - 8}`}
                      stroke={colors.text} strokeWidth={2} fill="none"
                    />
                  </g>
                )}
              </g>
            );
          })}

          {/* Decor elements (between zones and tables) */}
          {decorElements.map(element => (
            <g
              key={element.id}
              onMouseDown={(e) => handleDecorMouseDown(e, element)}
            >
              <FloorDecorNode
                element={element}
                isSelected={selectedDecorId === element.id}
                isEditMode={isEditMode}
                onClick={() => onDecorClick?.(element.id)}
              />
            </g>
          ))}

          {/* Combined table links */}
          {getCombineLinks(tables).map((link, i) => (
            <line key={`link-${i}`} x1={link.x1} y1={link.y1} x2={link.x2} y2={link.y2} strokeWidth={3} strokeDasharray="8 4" className="stroke-primary opacity-60" />
          ))}

          {/* Smart guides */}
          {smartGuides.map((guide, i) => (
            guide.type === 'h' ? (
              <line
                key={`sg-${i}`}
                x1={0} y1={guide.position} x2={canvasW} y2={guide.position}
                stroke="#3b82f6"
                strokeWidth={1}
                strokeDasharray="6 3"
                opacity={0.6}
                pointerEvents="none"
              />
            ) : (
              <line
                key={`sg-${i}`}
                x1={guide.position} y1={0} x2={guide.position} y2={canvasH}
                stroke="#3b82f6"
                strokeWidth={1}
                strokeDasharray="6 3"
                opacity={0.6}
                pointerEvents="none"
              />
            )
          ))}

          {/* Tables */}
          {tables.filter(t => t.x_position != null && t.y_position != null).map((table) => {
            const { status, guestName } = getTableStatus(table, reservations);
            const selected = isTableSelected(table.id);
            return (
              <g
                key={table.id}
                onMouseDown={(e) => handleTableMouseDown(e, table)}
                style={{ cursor: isEditMode ? 'grab' : 'pointer' }}
                filter="url(#tableShadow)"
              >
                <FloorTableNode
                  table={table}
                  status={status}
                  guestName={guestName}
                  waiterInitials={waiterMap?.[table.id]}
                  isSelected={selected}
                  isEditMode={isEditMode}
                  onClick={() => {
                    if (!isEditMode && onTableAction) {
                      setMenuTableId(table.id);
                      onTableClick?.(table, false);
                    } else {
                      onTableClick?.(table, false);
                    }
                  }}
                />
                {/* Rotation handle for selected tables in edit mode */}
                {isEditMode && selected && onTableRotate && (
                  <g
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleTableRotateMouseDown(e, table);
                    }}
                    style={{ cursor: 'crosshair' }}
                  >
                    <line
                      x1={(table.x_position ?? 0) + table.width / 2}
                      y1={(table.y_position ?? 0) - 8}
                      x2={(table.x_position ?? 0) + table.width / 2}
                      y2={(table.y_position ?? 0) - 28}
                      stroke="#3b82f6"
                      strokeWidth={2}
                    />
                    <circle
                      cx={(table.x_position ?? 0) + table.width / 2}
                      cy={(table.y_position ?? 0) - 32}
                      r={6}
                      fill="#3b82f6"
                      stroke="white"
                      strokeWidth={2}
                    />
                  </g>
                )}
              </g>
            );
          })}

          {/* Lasso selection rect */}
          {lassoRenderRect && (
            <rect
              x={lassoRenderRect.x}
              y={lassoRenderRect.y}
              width={lassoRenderRect.width}
              height={lassoRenderRect.height}
              fill="rgba(59,130,246,0.08)"
              stroke="#3b82f6"
              strokeWidth={1}
              strokeDasharray="6 3"
              pointerEvents="none"
            />
          )}

          {tables.length === 0 && zones.length === 0 && (
            <text x={canvasW / 2} y={canvasH / 2} textAnchor="middle" className="fill-muted-foreground text-lg">
              {isEditMode ? "Add zones and tables to get started" : "No tables configured"}
            </text>
          )}

          {/* Radial / Popover menu for table actions */}
          {menuTableId && !isEditMode && (() => {
            const menuTable = tables.find(t => t.id === menuTableId);
            if (!menuTable) return null;
            const { status, guestName } = getTableStatus(menuTable, reservations ?? []);
            const menuRes = (reservations ?? []).find(
              r => r.table_id === menuTableId && (r.status === 'SEATED' || r.status === 'CONFIRMED')
            ) ?? null;

            const handleMenuAction = (action: string) => {
              onTableAction?.(menuTableId, action);
            };
            const handleMenuClose = () => {
              setMenuTableId(null);
            };

            if (floorActionMode === 'popover' || floorActionMode !== 'radial') {
              return (
                <g>
                  {/* Full-canvas transparent backdrop — click to close */}
                  <rect
                    x={0} y={0} width={canvasW} height={canvasH}
                    fill="transparent"
                    onClick={(e) => { e.stopPropagation(); handleMenuClose(); }}
                    style={{ cursor: 'default' }}
                  />
                  <PopoverCard
                    table={menuTable}
                    status={status}
                    guestName={guestName}
                    reservation={menuRes}
                    waiterInitials={waiterMap?.[menuTableId]}
                    onAction={handleMenuAction}
                    onClose={handleMenuClose}
                  />
                </g>
              );
            }
            return (
              <RadialMenu
                table={menuTable}
                status={status}
                reservation={menuRes}
                onAction={handleMenuAction}
                onClose={handleMenuClose}
              />
            );
          })()}

        </g>
      </svg>
    </div>
  );
};

export default FloorCanvas;
