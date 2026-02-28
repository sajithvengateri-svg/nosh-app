import { motion } from "framer-motion";
import { CheckCircle2, Circle, AlertTriangle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDelegatedTasks, DelegatedTask } from "@/hooks/useDelegatedTasks";
import { toast } from "sonner";

const URGENCY_LABELS: Record<string, { label: string; color: string }> = {
  priority: { label: "PRIORITY", color: "text-destructive" },
  end_of_day: { label: "End of Day", color: "text-warning" },
  within_48h: { label: "48h", color: "text-success" },
};

interface DelegatedTasksBannerProps {
  dueDate: string;
}

export function DelegatedTasksBanner({ dueDate }: DelegatedTasksBannerProps) {
  const { tasks, isLoading, toggleComplete } = useDelegatedTasks({
    assignedToMe: true,
    dueDate,
  });

  if (isLoading || tasks.length === 0) return null;

  const handleToggle = async (id: string) => {
    try {
      await toggleComplete.mutateAsync(id);
      toast.success("Task updated");
    } catch {
      toast.error("Failed to update");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground text-sm">Extra Tasks from Head Chef</h3>
        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
          {tasks.filter(t => t.status === "pending").length} pending
        </span>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => {
          const urgency = URGENCY_LABELS[task.urgency] || URGENCY_LABELS.end_of_day;
          const isDone = task.status === "completed";

          return (
            <div
              key={task.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-colors",
                isDone ? "bg-muted/50 opacity-60" : "bg-background border border-border"
              )}
            >
              <button onClick={() => handleToggle(task.id)} className="shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium", isDone && "line-through text-muted-foreground")}>
                  {task.task}
                </p>
                {task.quantity && (
                  <p className="text-xs text-muted-foreground">{task.quantity}</p>
                )}
              </div>
              <span className={cn("text-xs font-medium", urgency.color)}>
                {urgency.label}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
