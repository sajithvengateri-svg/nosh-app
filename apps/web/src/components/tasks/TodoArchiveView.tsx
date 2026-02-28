import { useState, useMemo } from "react";
import { useTodoItems, TodoItem } from "@/hooks/useTodoItems";
import { format, parseISO, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArchiveRestore, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Range = "7d" | "30d" | "all";

const TodoArchiveView = () => {
  const { todos, updateTodo, deleteTodo } = useTodoItems();
  const [range, setRange] = useState<Range>("30d");

  const archived = useMemo(() => {
    const items = todos.filter(t => t.archived_at);
    const now = new Date();
    if (range === "7d") return items.filter(t => parseISO(t.archived_at!) >= subDays(now, 7));
    if (range === "30d") return items.filter(t => parseISO(t.archived_at!) >= subDays(now, 30));
    return items;
  }, [todos, range]);

  const grouped = useMemo(() => {
    const map = new Map<string, TodoItem[]>();
    archived.forEach(item => {
      const key = item.due_date || "No date";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [archived]);

  const handleRestore = async (id: string) => {
    try {
      await updateTodo.mutateAsync({ id, archived_at: null } as any);
      toast.success("Restored");
    } catch { toast.error("Failed to restore"); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTodo.mutateAsync(id);
      toast.success("Deleted");
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["7d", "30d", "all"] as Range[]).map(r => (
          <Button key={r} variant={range === r ? "default" : "outline"} size="sm" onClick={() => setRange(r)}>
            {r === "7d" ? "7 days" : r === "30d" ? "30 days" : "All"}
          </Button>
        ))}
      </div>

      {archived.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No archived tasks</p>
      ) : (
        grouped.map(([date, items]) => (
          <div key={date} className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {date === "No date" ? date : format(parseISO(date), "EEE d MMM yyyy")}
            </p>
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
                <span className="text-sm text-muted-foreground truncate flex-1">{item.title}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRestore(item.id)}>
                  <ArchiveRestore className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
};

export default TodoArchiveView;
