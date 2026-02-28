"use client";

import React from "react";
import { motion } from "framer-motion";
import { useDroppable } from "@dnd-kit/core";
import {
  UserCheck,
  Armchair,
  ClipboardList,
  ChefHat,
  Receipt,
  DoorOpen,
} from "lucide-react";
import type { JourneyStage } from "@/lib/shared/types/res.types";

// ---------------------------------------------------------------------------
// Stage configuration
// ---------------------------------------------------------------------------

export const JOURNEY_STAGES = [
  { key: "ARRIVING" as const, label: "Arriving", color: "bg-blue-500", icon: UserCheck },
  { key: "SEATED" as const, label: "Seated", color: "bg-green-500", icon: Armchair },
  { key: "ORDERED" as const, label: "Ordered", color: "bg-indigo-500", icon: ClipboardList },
  { key: "IN_SERVICE" as const, label: "In Service", color: "bg-orange-500", icon: ChefHat },
  { key: "BILL" as const, label: "Bill", color: "bg-amber-400", icon: Receipt },
  { key: "LEFT" as const, label: "Left", color: "bg-gray-400", icon: DoorOpen },
] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EnhancedJourneyBarProps {
  counts: Record<JourneyStage, number>;
  activeFilter: JourneyStage | null;
  onStageClick: (stage: JourneyStage | null) => void;
}

// ---------------------------------------------------------------------------
// Individual droppable segment
// ---------------------------------------------------------------------------

interface SegmentProps {
  stageKey: JourneyStage;
  label: string;
  color: string;
  icon: React.ElementType;
  count: number;
  isActive: boolean;
  widthPercent: number;
  index: number;
  onClick: () => void;
}

function DroppableSegment({
  stageKey,
  label,
  color,
  icon: Icon,
  count,
  isActive,
  widthPercent,
  index,
  onClick,
}: SegmentProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `journey-${stageKey}`,
  });

  const isEmpty = count === 0;

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3, ease: "easeOut" }}
      style={{ width: `${widthPercent}%` }}
      className="flex flex-col items-center min-w-[48px]"
    >
      {/* Bar segment */}
      <motion.button
        type="button"
        onClick={onClick}
        animate={{
          scale: isOver ? 1.05 : 1,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={[
          "w-full h-10 rounded-md flex items-center justify-center gap-1 text-sm font-semibold transition-all cursor-pointer select-none",
          isEmpty ? "bg-muted text-muted-foreground/50" : `${color} text-white`,
          isActive ? "ring-2 ring-offset-2 ring-primary" : "",
          isOver ? "ring-2 ring-offset-1 ring-white/80 shadow-lg" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span>{count}</span>
      </motion.button>

      {/* Label below */}
      <span
        className={[
          "text-[10px] leading-tight mt-1 truncate max-w-full text-center",
          isActive ? "font-semibold text-foreground" : "text-muted-foreground",
        ].join(" ")}
      >
        {label}
      </span>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

function EnhancedJourneyBar({
  counts,
  activeFilter,
  onStageClick,
}: EnhancedJourneyBarProps) {
  const total = JOURNEY_STAGES.reduce((sum, s) => sum + (counts[s.key] ?? 0), 0);

  // Compute proportional widths — give every stage a minimum so empties are
  // still visible and droppable.
  const MIN_PERCENT = 8;
  const widths = JOURNEY_STAGES.map((s) => {
    if (total === 0) return 100 / JOURNEY_STAGES.length;
    const raw = ((counts[s.key] ?? 0) / total) * 100;
    return Math.max(raw, MIN_PERCENT);
  });
  // Normalise so they sum to 100
  const widthSum = widths.reduce((a, b) => a + b, 0);
  const normalised = widths.map((w) => (w / widthSum) * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="w-full space-y-2"
    >
      {/* Segmented bar */}
      <div className="flex items-start gap-1.5">
        {JOURNEY_STAGES.map((stage, i) => (
          <DroppableSegment
            key={stage.key}
            stageKey={stage.key}
            label={stage.label}
            color={stage.color}
            icon={stage.icon}
            count={counts[stage.key] ?? 0}
            isActive={activeFilter === stage.key}
            widthPercent={normalised[i]}
            index={i}
            onClick={() =>
              onStageClick(activeFilter === stage.key ? null : stage.key)
            }
          />
        ))}
      </div>

      {/* Legend row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-0.5">
        {JOURNEY_STAGES.map((stage) => {
          const count = counts[stage.key] ?? 0;
          return (
            <span
              key={stage.key}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
            >
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  count > 0 ? stage.color : "bg-muted"
                }`}
              />
              {stage.label}
              <span className="font-medium text-foreground">{count}</span>
            </span>
          );
        })}
        <span className="ml-auto text-[11px] font-medium text-muted-foreground">
          Total: {total}
        </span>
      </div>
    </motion.div>
  );
}

export default EnhancedJourneyBar;
