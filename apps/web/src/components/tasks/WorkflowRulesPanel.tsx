import { useState } from "react";
import { Plus, Pause, Play, Trash2, Loader2, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useTodoRecurringRules, RecurringRule } from "@/hooks/useTodoRecurringRules";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface WorkflowRulesPanelProps {
  isHomeCook?: boolean;
}

const WorkflowRulesPanel = ({ isHomeCook = false }: WorkflowRulesPanelProps) => {
  const { rules, isLoading, addRule, updateRule, deleteRule } = useTodoRecurringRules();
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [recurrenceType, setRecurrenceType] = useState<"daily" | "weekly" | "monthly">("daily");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [priority, setPriority] = useState("medium");
  const [autoDelegate, setAutoDelegate] = useState(false);

  const handleAdd = async () => {
    if (!title.trim()) return;
    try {
      await addRule.mutateAsync({
        title: title.trim(),
        recurrence_type: recurrenceType,
        recurrence_days: recurrenceType === "weekly" ? selectedDays : null,
        recurrence_day_of_month: recurrenceType === "monthly" ? dayOfMonth : null,
        priority,
        auto_delegate: autoDelegate,
      });
      setTitle(""); setAddOpen(false);
      toast.success(isHomeCook ? "Routine added!" : "Workflow created");
    } catch { toast.error("Failed to create"); }
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const toggleActive = async (rule: RecurringRule) => {
    try {
      await updateRule.mutateAsync({ id: rule.id, is_active: !rule.is_active });
    } catch { toast.error("Failed to update"); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRule.mutateAsync(id);
      toast.success("Deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const getRecurrenceLabel = (rule: RecurringRule) => {
    if (rule.recurrence_type === "daily") return "Every day";
    if (rule.recurrence_type === "weekly" && rule.recurrence_days?.length) {
      return rule.recurrence_days.map(d => DAYS[d - 1]).join(", ");
    }
    if (rule.recurrence_type === "monthly") return `Day ${rule.recurrence_day_of_month} monthly`;
    return rule.recurrence_type;
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isHomeCook ? "Set up repeating tasks that auto-create" : "Recurring tasks that auto-generate"}
        </p>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> {isHomeCook ? "Add Routine" : "Add Rule"}
        </Button>
      </div>

      {rules.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Repeat className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">{isHomeCook ? "No routines yet" : "No workflow rules yet"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map(rule => (
            <div key={rule.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{rule.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="secondary" className="text-xs">{getRecurrenceLabel(rule)}</Badge>
                  <Badge variant="outline" className="text-xs capitalize">{rule.priority}</Badge>
                  {rule.auto_delegate && <Badge variant="outline" className="text-xs">Auto-delegate</Badge>}
                </div>
              </div>
              <button onClick={() => toggleActive(rule)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                {rule.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button onClick={() => handleDelete(rule.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Rule Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{isHomeCook ? "New Routine" : "New Workflow Rule"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input placeholder="Task title" value={title} onChange={e => setTitle(e.target.value)} autoFocus />

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Recurrence</p>
              <div className="flex gap-2">
                {(["daily", "weekly", "monthly"] as const).map(t => (
                  <button key={t} onClick={() => setRecurrenceType(t)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize border transition-all ${
                      recurrenceType === t ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"
                    }`}>{t}</button>
                ))}
              </div>
            </div>

            {recurrenceType === "weekly" && (
              <div className="flex gap-1 flex-wrap">
                {DAYS.map((d, i) => (
                  <button key={d} onClick={() => toggleDay(i + 1)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedDays.includes(i + 1) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>{d}</button>
                ))}
              </div>
            )}

            {recurrenceType === "monthly" && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Day</span>
                <Input type="number" min={1} max={31} value={dayOfMonth} onChange={e => setDayOfMonth(Number(e.target.value))} className="w-20" />
              </div>
            )}

            <div className="flex gap-2">
              {(["high", "medium", "low"] as const).map(p => (
                <button key={p} onClick={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize border transition-all ${
                    priority === p ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"
                  }`}>{p}</button>
              ))}
            </div>

            <label className="flex items-center justify-between py-2">
              <span className="text-sm text-foreground">{isHomeCook ? "Auto-share" : "Auto-delegate"}</span>
              <Switch checked={autoDelegate} onCheckedChange={setAutoDelegate} />
            </label>
          </div>
          <DialogFooter>
            <Button onClick={handleAdd} disabled={!title.trim() || addRule.isPending} className="w-full">
              {addRule.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {isHomeCook ? "Add Routine" : "Add Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkflowRulesPanel;
