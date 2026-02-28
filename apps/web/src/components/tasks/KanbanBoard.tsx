import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { KanbanCard } from "./KanbanCard";
import type { TodoItem } from "@/hooks/useTodoItems";

interface KanbanBoardProps {
  todos: TodoItem[];
  onMove: (id: string, newStatus: string) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onPhotoClick: (id: string) => void;
  canDelete: boolean;
  category: "tasks" | "shopping";
}

const COLUMNS = [
  { key: "pending", label: "To Do", color: "border-muted-foreground/30" },
  { key: "in_progress", label: "In Progress", color: "border-warning/50" },
  { key: "done", label: "Done", color: "border-success/50" },
] as const;

export function KanbanBoard({ todos, onMove, onDelete, onArchive, onPhotoClick, canDelete, category }: KanbanBoardProps) {
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [archiveSearch, setArchiveSearch] = useState("");

  const filtered = todos.filter(t =>
    category === "shopping" ? t.category === "shopping" : t.category !== "shopping"
  );

  const columns = useMemo(() => {
    const map: Record<string, TodoItem[]> = { pending: [], in_progress: [], done: [] };
    filtered.forEach(t => {
      if (t.archived_at) return; // skip archived
      if (map[t.status]) map[t.status].push(t);
      else map.pending.push(t);
    });
    return map;
  }, [filtered]);

  const archivedItems = useMemo(() => {
    const items = filtered.filter(t => t.archived_at);
    if (!archiveSearch) return items;
    const q = archiveSearch.toLowerCase();
    return items.filter(t => t.title.toLowerCase().includes(q));
  }, [filtered, archiveSearch]);

  return (
    <div className="space-y-4">
      {/* Kanban columns */}
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
        {COLUMNS.map(col => (
          <div key={col.key} className={cn("flex-shrink-0 w-72 sm:w-80 snap-center")}>
            <div className={cn("flex items-center gap-2 mb-3 pb-2 border-b-2", col.color)}>
              <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
              <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                {columns[col.key]?.length || 0}
              </span>
            </div>
            <div className="space-y-2 min-h-[200px]">
              <AnimatePresence mode="popLayout">
                {(columns[col.key] || []).map(item => (
                  <KanbanCard
                    key={item.id}
                    item={item}
                    onMove={onMove}
                    onDelete={onDelete}
                    onArchive={onArchive}
                    onPhotoClick={onPhotoClick}
                    canDelete={canDelete}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      {/* Archived section */}
      <div className="border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => setArchivedOpen(!archivedOpen)}
          className="w-full flex items-center gap-2 p-3 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          <ChevronRight className={cn("w-4 h-4 transition-transform", archivedOpen && "rotate-90")} />
          Archived ({archivedItems.length})
        </button>
        {archivedOpen && (
          <div className="p-3 pt-0 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={archiveSearch}
                onChange={e => setArchiveSearch(e.target.value)}
                placeholder="Search archived..."
                className="pl-8 h-8 text-xs"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2 max-h-60 overflow-y-auto">
              {archivedItems.map(item => (
                <KanbanCard
                  key={item.id}
                  item={item}
                  onMove={onMove}
                  onDelete={onDelete}
                  canDelete={canDelete}
                  draggable={false}
                />
              ))}
              {archivedItems.length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center col-span-2">No archived items</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
