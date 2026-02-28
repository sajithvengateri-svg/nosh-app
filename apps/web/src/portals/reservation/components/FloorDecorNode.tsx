import React from "react";

/**
 * SVG Decoration Colours — Intentionally Hardcoded
 *
 * The 18 hex colours in this file (#C9A96E, #374151, #1f2937, #6B7280,
 * #9CA3AF, #7C3AED, #EC4899, #B45309, #3B82F6, #EF4444, plus rgba variants)
 * are SVG fill/stroke values for floor-plan decorative elements (walls, doors,
 * pillars, stages, etc.). They are part of the graphic illustration, not the
 * app theme, and cannot use CSS custom properties in inline SVG attributes.
 *
 * #C9A96E is the selection highlight (copper/gold), consistent with the brand
 * but applied as an SVG stroke — not a themed UI element.
 *
 * Do not replace these with CSS variables or design tokens.
 */

export type DecorElementType = 'WALL' | 'DOOR' | 'PILLAR' | 'STAGE' | 'DANCE_FLOOR' | 'BAR_COUNTER' | 'HOST_STAND' | 'BATHROOM' | 'KITCHEN' | 'STAIRS';

export interface DecorElement {
  id: string;
  type: DecorElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  label?: string;
}

// Default dimensions per type
export const DECOR_DEFAULTS: Record<DecorElementType, { width: number; height: number; label: string }> = {
  WALL: { width: 200, height: 8, label: 'Wall' },
  DOOR: { width: 60, height: 60, label: 'Door' },
  PILLAR: { width: 30, height: 30, label: 'Pillar' },
  STAGE: { width: 300, height: 150, label: 'Stage' },
  DANCE_FLOOR: { width: 250, height: 250, label: 'Dance Floor' },
  BAR_COUNTER: { width: 250, height: 40, label: 'Bar' },
  HOST_STAND: { width: 50, height: 50, label: 'Host' },
  BATHROOM: { width: 80, height: 80, label: 'WC' },
  KITCHEN: { width: 200, height: 100, label: 'Kitchen' },
  STAIRS: { width: 80, height: 120, label: 'Stairs' },
};

interface FloorDecorNodeProps {
  element: DecorElement;
  isSelected?: boolean;
  isEditMode?: boolean;
  onClick?: () => void;
}

const FloorDecorNode: React.FC<FloorDecorNodeProps> = ({ element, isSelected, isEditMode, onClick }) => {
  const { x, y, width: w, height: h, type, rotation, label } = element;
  const selectedStroke = isSelected ? '#C9A96E' : undefined;
  const selectedWidth = isSelected ? 3 : undefined;

  const renderDecor = () => {
    switch (type) {
      case 'WALL':
        return (
          <rect x={0} y={0} width={w} height={h} rx={2}
            fill="#374151" stroke={selectedStroke || '#1f2937'} strokeWidth={selectedWidth || 1} />
        );
      case 'DOOR':
        return (
          <g>
            {/* Door arc */}
            <path d={`M 0 ${h} A ${w} ${h} 0 0 1 ${w} 0`} fill="none" stroke={selectedStroke || '#6B7280'} strokeWidth={selectedWidth || 2} strokeDasharray="6 3" />
            {/* Door line */}
            <line x1={0} y1={h} x2={0} y2={0} stroke={selectedStroke || '#6B7280'} strokeWidth={selectedWidth || 2} />
            <line x1={0} y1={0} x2={w * 0.3} y2={0} stroke={selectedStroke || '#6B7280'} strokeWidth={selectedWidth || 2} />
          </g>
        );
      case 'PILLAR':
        return (
          <circle cx={w / 2} cy={h / 2} r={Math.min(w, h) / 2}
            fill="#9CA3AF" stroke={selectedStroke || '#6B7280'} strokeWidth={selectedWidth || 2} />
        );
      case 'STAGE':
        return (
          <g>
            <rect x={0} y={0} width={w} height={h} rx={6}
              fill="rgba(124,58,237,0.12)" stroke={selectedStroke || '#7C3AED'} strokeWidth={selectedWidth || 2} />
            <text x={w / 2} y={h / 2} textAnchor="middle" dominantBaseline="middle" fill="#7C3AED" fontSize={14} fontWeight="bold" pointerEvents="none">
              {label || 'Stage'}
            </text>
          </g>
        );
      case 'DANCE_FLOOR':
        return (
          <g>
            <rect x={0} y={0} width={w} height={h} rx={8}
              fill="rgba(236,72,153,0.08)" stroke={selectedStroke || '#EC4899'} strokeWidth={selectedWidth || 2} strokeDasharray="8 4" />
            {/* Checkerboard pattern hint */}
            {Array.from({ length: Math.floor(w / 40) }, (_, i) =>
              Array.from({ length: Math.floor(h / 40) }, (_, j) => (
                (i + j) % 2 === 0 ? (
                  <rect key={`${i}-${j}`} x={i * 40 + 4} y={j * 40 + 4} width={36} height={36} rx={2}
                    fill="rgba(236,72,153,0.06)" pointerEvents="none" />
                ) : null
              ))
            )}
            <text x={w / 2} y={h / 2} textAnchor="middle" dominantBaseline="middle" fill="#EC4899" fontSize={12} fontWeight="bold" pointerEvents="none">
              {label || 'Dance Floor'}
            </text>
          </g>
        );
      case 'BAR_COUNTER':
        return (
          <g>
            <rect x={0} y={0} width={w} height={h} rx={h / 2}
              fill="rgba(180,83,9,0.15)" stroke={selectedStroke || '#B45309'} strokeWidth={selectedWidth || 2} />
            <rect x={4} y={4} width={w - 8} height={4} rx={2} fill="rgba(180,83,9,0.1)" pointerEvents="none" />
            <text x={w / 2} y={h / 2 + 1} textAnchor="middle" dominantBaseline="middle" fill="#B45309" fontSize={10} fontWeight="bold" pointerEvents="none">
              {label || 'Bar'}
            </text>
          </g>
        );
      case 'HOST_STAND':
        return (
          <g>
            <rect x={0} y={0} width={w} height={h} rx={6}
              fill="rgba(59,130,246,0.12)" stroke={selectedStroke || '#3B82F6'} strokeWidth={selectedWidth || 2} />
            <text x={w / 2} y={h / 2} textAnchor="middle" dominantBaseline="middle" fill="#3B82F6" fontSize={10} fontWeight="bold" pointerEvents="none">
              Host
            </text>
          </g>
        );
      case 'BATHROOM':
        return (
          <g>
            <rect x={0} y={0} width={w} height={h} rx={4}
              fill="rgba(107,114,128,0.1)" stroke={selectedStroke || '#6B7280'} strokeWidth={selectedWidth || 2} />
            <text x={w / 2} y={h / 2} textAnchor="middle" dominantBaseline="middle" fill="#6B7280" fontSize={14} fontWeight="bold" pointerEvents="none">
              WC
            </text>
          </g>
        );
      case 'KITCHEN':
        return (
          <g>
            <rect x={0} y={0} width={w} height={h} rx={4}
              fill="rgba(239,68,68,0.08)" stroke={selectedStroke || '#EF4444'} strokeWidth={selectedWidth || 2} strokeDasharray="12 4" />
            <text x={w / 2} y={h / 2} textAnchor="middle" dominantBaseline="middle" fill="#EF4444" fontSize={12} fontWeight="bold" pointerEvents="none">
              Kitchen
            </text>
          </g>
        );
      case 'STAIRS':
        return (
          <g>
            <rect x={0} y={0} width={w} height={h} rx={4}
              fill="rgba(107,114,128,0.08)" stroke={selectedStroke || '#6B7280'} strokeWidth={selectedWidth || 2} />
            {/* Stair lines */}
            {Array.from({ length: Math.floor(h / 15) }, (_, i) => (
              <line key={i} x1={4} y1={i * 15 + 10} x2={w - 4} y2={i * 15 + 10}
                stroke="#9CA3AF" strokeWidth={1} pointerEvents="none" />
            ))}
            <text x={w / 2} y={h - 8} textAnchor="middle" fill="#6B7280" fontSize={9} pointerEvents="none">
              Stairs
            </text>
          </g>
        );
      default:
        return (
          <rect x={0} y={0} width={w} height={h} rx={4}
            fill="rgba(107,114,128,0.1)" stroke={selectedStroke || '#6B7280'} strokeWidth={selectedWidth || 1} />
        );
    }
  };

  return (
    <g
      transform={`translate(${x}, ${y}) rotate(${rotation}, ${w / 2}, ${h / 2})`}
      onClick={onClick}
      style={{ cursor: isEditMode ? 'move' : 'default' }}
    >
      {renderDecor()}
      {/* Edit mode resize handle */}
      {isEditMode && isSelected && (
        <g>
          {/* Corner handles */}
          {[[0, 0], [w, 0], [0, h], [w, h]].map(([hx, hy], i) => (
            <rect key={i} x={hx - 4} y={hy - 4} width={8} height={8} rx={2}
              fill="white" stroke="#C9A96E" strokeWidth={2} />
          ))}
        </g>
      )}
    </g>
  );
};

export default FloorDecorNode;
