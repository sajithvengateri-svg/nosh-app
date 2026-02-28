import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Clock, Coffee } from "lucide-react";

const SECTION_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  KITCHEN: { bg: "bg-green-50 dark:bg-green-950/30", border: "border-green-300 dark:border-green-700", text: "text-green-700 dark:text-green-400" },
  BAR: { bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-300 dark:border-purple-700", text: "text-purple-700 dark:text-purple-400" },
  FOH: { bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-300 dark:border-blue-700", text: "text-blue-700 dark:text-blue-400" },
  OTHER: { bg: "bg-muted/50", border: "border-border", text: "text-muted-foreground" },
};

export function getSectionColor(section: string | null) {
  return SECTION_COLORS[section || "OTHER"] || SECTION_COLORS.OTHER;
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m ? `${hour}:${String(m).padStart(2, "0")}${ampm}` : `${hour}${ampm}`;
}

interface ShiftTileProps {
  id: string;
  employeeName: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  section: string | null;
  cost: number;
  hours: number;
  onClick?: () => void;
}

export default function ShiftTile({
  id,
  employeeName,
  startTime,
  endTime,
  breakMinutes,
  section,
  cost,
  hours,
  onClick,
}: ShiftTileProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

  const style = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? "relative" as const : undefined,
  };

  const colors = getSectionColor(section);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg ${colors.bg} ${colors.border} border p-2 cursor-pointer select-none transition-shadow hover:shadow-md group ${isDragging ? "shadow-lg ring-2 ring-primary/30" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-1">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 opacity-0 group-hover:opacity-60 transition-opacity cursor-grab active:cursor-grabbing shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3 h-3 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-xs text-foreground truncate">{employeeName}</div>
          <div className="flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
            <span className="text-[11px] text-muted-foreground">
              {formatTime(startTime)} – {formatTime(endTime)}
            </span>
          </div>
          {breakMinutes > 0 && (
            <div className="flex items-center gap-1 mt-0.5">
              <Coffee className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
              <span className="text-[10px] text-muted-foreground">{breakMinutes}m break</span>
            </div>
          )}
          <div className="flex items-center justify-between mt-1">
            <Badge variant="outline" className={`text-[9px] px-1 py-0 h-4 ${colors.text} border-current`}>
              {section || "—"}
            </Badge>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">{hours.toFixed(1)}h</span>
              {cost > 0 && (
                <span className="text-[10px] font-semibold text-primary">${cost.toFixed(0)}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
