import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList, Plus, CheckCircle2, Circle, Clock, User, Edit, Trash2,
  Loader2, Flag, X
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SwipeableRow } from "@/components/mobile/SwipeableRow";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";

type Shift = "before_service" | "end_of_shift" | "tomorrow";

interface PrepItem {
  id: string;
  task: string;
  type: string;
  quantity: string;
  completed: boolean;
}

interface BarPrepList {
  id: string;
  name: string;
  date: string;
  shift: string;
  items: PrepItem[];
  assigned_to: string | null;
  status: string;
  notes: string | null;
  section_id: string | null;
  org_id: string;
}

const SHIFT_CONFIG: Record<string, { label: string; color: string }> = {
  before_service: { label: "Before Service", color: "text-red-600" },
  end_of_shift: { label: "End of Shift", color: "text-amber-600" },
  tomorrow: { label: "Tomorrow", color: "text-emerald-600" },
};

const taskTypes = ["fresh_juice", "syrup", "garnish", "ice", "infusion", "prebatch"];

const defaultForm = {
  name: "", date: new Date().toISOString().split("T")[0], shift: "before_service",
  assigned_to: "", status: "pending", notes: "", items: [] as PrepItem[],
};

const BarPrep = () => {
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const isMobile = useIsMobile();
  const [lists, setLists] = useState<BarPrepList[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BarPrepList | null>(null);
  const [deleting, setDeleting] = useState<BarPrepList | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [formData, setFormData] = useState(defaultForm);
  const [newTask, setNewTask] = useState({ task: "", type: "fresh_juice", quantity: "" });

  const fetchLists = useCallback(async () => {
    if (!currentOrg?.id) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("bev_bar_prep").select("*").eq("org_id", currentOrg.id).order("date", { ascending: false });
    if (error) { toast.error("Failed to load prep lists"); console.error(error); }
    else {
      setLists((data || []).map((d: any) => ({
        ...d, items: (Array.isArray(d.items) ? d.items : []) as PrepItem[],
      })));
    }
    setLoading(false);
  }, [currentOrg?.id]);

  useEffect(() => {
    fetchLists();
    const channel = supabase
      .channel("bev-bar-prep-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "bev_bar_prep" }, fetchLists)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchLists]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) { toast.error("Name is required"); return; }
    const payload = {
      name: formData.name, date: formData.date, shift: formData.shift,
      assigned_to: formData.assigned_to || null, status: formData.status,
      notes: formData.notes || null, items: JSON.parse(JSON.stringify(formData.items)),
    };

    if (editing) {
      const { error } = await (supabase as any).from("bev_bar_prep").update(payload).eq("id", editing.id);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Prep list updated");
    } else {
      const { error } = await (supabase as any).from("bev_bar_prep").insert({ ...payload, org_id: currentOrg?.id });
      if (error) { toast.error("Failed to create"); return; }
      toast.success("Prep list created");
    }
    resetForm();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const { error } = await (supabase as any).from("bev_bar_prep").delete().eq("id", deleting.id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Deleted");
    setDeleteDialogOpen(false);
    setDeleting(null);
  };

  const toggleTask = async (list: BarPrepList, taskId: string) => {
    const updated = list.items.map(i => i.id === taskId ? { ...i, completed: !i.completed } : i);
    const allDone = updated.every(i => i.completed);
    const anyDone = updated.some(i => i.completed);

    setLists(prev => prev.map(l => l.id === list.id ? { ...l, items: updated, status: allDone ? "completed" : anyDone ? "in_progress" : "pending" } : l));

    const { error } = await (supabase as any).from("bev_bar_prep").update({
      items: JSON.parse(JSON.stringify(updated)),
      status: allDone ? "completed" : anyDone ? "in_progress" : "pending",
    }).eq("id", list.id);
    if (error) fetchLists();
  };

  const openEdit = (l: BarPrepList) => {
    setEditing(l);
    setFormData({ name: l.name, date: l.date, shift: l.shift, assigned_to: l.assigned_to || "", status: l.status, notes: l.notes || "", items: l.items });
    setDialogOpen(true);
  };

  const resetForm = () => { setDialogOpen(false); setEditing(null); setFormData(defaultForm); setNewTask({ task: "", type: "fresh_juice", quantity: "" }); };

  const addTask = () => {
    if (!newTask.task.trim()) return;
    setFormData({ ...formData, items: [...formData.items, { id: crypto.randomUUID(), task: newTask.task, type: newTask.type, quantity: newTask.quantity, completed: false }] });
    setNewTask({ task: "", type: "fresh_juice", quantity: "" });
  };

  const removeTask = (id: string) => {
    setFormData({ ...formData, items: formData.items.filter(i => i.id !== id) });
  };

  const today = new Date().toISOString().split("T")[0];
  const active = lists.filter(l => !(l.date < today && l.status === "completed"));
  const archived = lists.filter(l => l.date < today && l.status === "completed");
  const displayed = showArchived ? archived : active;

  const totalTasks = displayed.reduce((a, l) => a + l.items.length, 0);
  const completedTasks = displayed.reduce((a, l) => a + l.items.filter(i => i.completed).length, 0);
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
    pending: { icon: Circle, color: "text-muted-foreground", label: "Pending" },
    in_progress: { icon: Clock, color: "text-amber-500", label: "In Progress" },
    completed: { icon: CheckCircle2, color: "text-emerald-500", label: "Completed" },
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="w-8 h-8" /> Bar Prep
          </h1>
          <p className="text-muted-foreground">Juices, syrups, garnishes, ice & infusions</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-2" /> New Prep List</Button>
      </motion.div>

      {/* Active/Archived Toggle */}
      <div className="flex gap-2">
        <Button variant={!showArchived ? "default" : "outline"} size="sm" onClick={() => setShowArchived(false)}>Active ({active.length})</Button>
        <Button variant={showArchived ? "default" : "outline"} size="sm" onClick={() => setShowArchived(true)}>Archived ({archived.length})</Button>
      </div>

      {/* Progress */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-elevated p-5">
        <div className="flex items-center justify-between mb-4">
          <div><h2 className="font-semibold">Progress</h2><p className="text-sm text-muted-foreground">{completedTasks} of {totalTasks} tasks</p></div>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8 }}
            className="h-full bg-primary rounded-full" />
        </div>
      </motion.div>

      {/* Lists */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {displayed.map((list, idx) => {
            const sc = statusConfig[list.status] || statusConfig.pending;
            const StatusIcon = sc.icon;
            const isExpanded = expandedId === list.id;
            const done = list.items.filter(t => t.completed).length;
            const pct = list.items.length > 0 ? (done / list.items.length) * 100 : 0;

            return (
              <motion.div key={list.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * idx }}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-4 border-b border-border cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : list.id)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{list.name}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground">{format(new Date(list.date), "MMM d, yyyy")}</span>
                          <Badge variant="outline" className="text-xs">{SHIFT_CONFIG[list.shift]?.label || list.shift}</Badge>
                          {list.assigned_to && <Badge variant="outline" className="text-xs gap-1"><User className="w-3 h-3" /> {list.assigned_to}</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium", sc.color)}>
                          <StatusIcon className="w-3 h-3" /> {sc.label}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>{done}/{list.items.length} tasks</span>
                        <span>{pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <CardContent className="p-4 space-y-2">
                      {list.items.map(item => {
                        const itemContent = (
                          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <button onClick={() => toggleTask(list, item.id)}>
                              {item.completed ? <CheckCircle2 className="w-5 h-5 text-success" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
                            </button>
                            <div className="flex-1">
                              <span className={cn("text-sm", item.completed && "line-through text-muted-foreground")}>{item.task}</span>
                              {item.quantity && <span className="text-xs text-muted-foreground ml-2">({item.quantity})</span>}
                            </div>
                            <Badge variant="outline" className="text-xs">{item.type?.replace("_", " ") || "task"}</Badge>
                          </div>
                        );

                        return isMobile && !item.completed ? (
                          <SwipeableRow
                            key={item.id}
                            onSwipeRight={() => toggleTask(list, item.id)}
                            rightLabel="Done"
                          >
                            {itemContent}
                          </SwipeableRow>
                        ) : (
                          <div key={item.id}>{itemContent}</div>
                        );
                      })}
                      {list.notes && <p className="text-xs text-muted-foreground pt-2 border-t border-border">{list.notes}</p>}
                      <div className="flex gap-2 pt-2 border-t border-border">
                        <Button variant="outline" size="sm" onClick={() => openEdit(list)}><Edit className="w-3 h-3 mr-1" /> Edit</Button>
                        <Button variant="outline" size="sm" onClick={() => { setDeleting(list); setDeleteDialogOpen(true); }}
                          className="text-destructive hover:text-destructive"><Trash2 className="w-3 h-3 mr-1" /> Delete</Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            );
          })}
          {displayed.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <ClipboardList className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No prep lists. Create your first bar prep list.</p>
              <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-2" /> New Prep List</Button>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={resetForm}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Prep List" : "New Prep List"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Name *</Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., AM Bar Prep" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Date</Label>
                <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} /></div>
              <div className="space-y-2"><Label>Shift</Label>
                <Select value={formData.shift} onValueChange={v => setFormData({ ...formData, shift: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="before_service">Before Service</SelectItem>
                    <SelectItem value="end_of_shift">End of Shift</SelectItem>
                    <SelectItem value="tomorrow">Tomorrow</SelectItem>
                  </SelectContent>
                </Select></div>
            </div>
            <div className="space-y-2"><Label>Assigned To</Label>
              <Input value={formData.assigned_to} onChange={e => setFormData({ ...formData, assigned_to: e.target.value })} placeholder="Bartender name" /></div>
            <div className="space-y-2"><Label>Notes</Label>
              <Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Special instructions..." /></div>

            {/* Tasks */}
            <div className="space-y-2">
              <Label>Tasks</Label>
              {formData.items.map(item => (
                <div key={item.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                  <span className="text-sm flex-1">{item.task} {item.quantity && `(${item.quantity})`}</span>
                  <Badge variant="outline" className="text-xs">{item.type.replace("_", " ")}</Badge>
                  <button onClick={() => removeTask(item.id)} className="p-1"><X className="w-3 h-3 text-destructive" /></button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input value={newTask.task} onChange={e => setNewTask({ ...newTask, task: e.target.value })} placeholder="Task name..."
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTask())} className="flex-1" />
                <Input value={newTask.quantity} onChange={e => setNewTask({ ...newTask, quantity: e.target.value })} placeholder="Qty" className="w-20" />
                <Select value={newTask.type} onValueChange={v => setNewTask({ ...newTask, type: v })}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>{taskTypes.map(t => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
                <Button size="sm" onClick={addTask}><Plus className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSubmit}>{editing ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={() => { setDeleteDialogOpen(false); setDeleting(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Prep List</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-4">Delete <strong>{deleting?.name}</strong>? This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BarPrep;
