import { motion } from "framer-motion";
import { Calendar as CalendarIcon, GripVertical, Archive, Trash2, Camera } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import type { TodoItem } from "@/hooks/useTodoItems";

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-destructive",
  medium: "bg-warning",
  low: "bg-success",
};

interface KanbanCardProps {
  item: TodoItem;
  onMove: (id: string, newStatus: string) => void;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
  onPhotoClick?: (id: string) => void;
  canDelete: boolean;
  draggable?: boolean;
}

export function KanbanCard({ item, onMove, onDelete, onArchive, onPhotoClick, canDelete, draggable = true }: KanbanCardProps) {
  const nextStatus = item.status === "pending" ? "in_progress" : item.status === "in_progress" ? "done" : "pending";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "bg-card border border-border rounded-xl p-3 cursor-pointer hover:shadow-md transition-shadow group",
        item.status === "done" && "opacity-60"
      )}
      onClick={() => onMove(item.id, nextStatus)}
    >
      <div className="flex items-start gap-2">
        {draggable && (
          <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full shrink-0", PRIORITY_COLORS[item.priority] || "bg-muted")} />
            <span className={cn("font-medium text-sm text-foreground truncate", item.status === "done" && "line-through text-muted-foreground")}>
              {item.title}
            </span>
          </div>

          {item.description && (
            <p className="text-xs text-muted-foreground mt-1 truncate">{item.description}</p>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {item.due_date && (
              <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0">
                <CalendarIcon className="w-2.5 h-2.5" />
                {format(parseISO(item.due_date), "MMM d")}
              </Badge>
            )}
            {item.assigned_to_name && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {item.assigned_to_name}
              </Badge>
            )}
            {item.quantity && (
              <span className="text-[10px] text-muted-foreground">
                {item.quantity} {item.unit || ""}
              </span>
            )}
          </div>

          {item.photo_url && (
            <img src={item.photo_url} alt="" className="w-10 h-10 rounded-lg object-cover mt-2" />
          )}
        </div>
      </div>

      {/* Action buttons on hover */}
      <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
        {onPhotoClick && (
          <button onClick={() => onPhotoClick(item.id)} className="p-1 rounded hover:bg-muted text-muted-foreground">
            <Camera className="w-3.5 h-3.5" />
          </button>
        )}
        {onArchive && item.status !== "done" && (
          <button onClick={() => onArchive(item.id)} className="p-1 rounded hover:bg-muted text-muted-foreground" title="Archive">
            <Archive className="w-3.5 h-3.5" />
          </button>
        )}
        {canDelete && onDelete && (
          <button onClick={() => onDelete(item.id)} className="p-1 rounded hover:bg-destructive/10 text-destructive" title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
