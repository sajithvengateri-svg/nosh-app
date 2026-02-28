import { useState, useEffect } from "react";
import { ClipboardList, Plus, Save, Send, Check, Clock, Trash2, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import { format } from "date-fns";

const SHIFTS = ["open", "service", "close", "all_day"];
const PRIORITIES = ["low", "normal", "high", "urgent"];

interface RunSheet {
  id: string;
  title: string;
  date: string;
  shift: string;
  status: string;
  posted_to_wall: boolean;
  is_template: boolean;
  template_name: string | null;
  notes: string | null;
  created_at: string;
}

interface RunSheetTask {
  id: string;
  run_sheet_id: string;
  task: string;
  assigned_to: string | null;
  status: string;
  priority: string;
  sort_order: number;
  completed_at: string | null;
  notes: string | null;
}

const BevRunSheetManager = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const [sheets, setSheets] = useState<RunSheet[]>([]);
  const [templates, setTemplates] = useState<RunSheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<RunSheet | null>(null);
  const [tasks, setTasks] = useState<RunSheetTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [newForm, setNewForm] = useState({ title: "Service Run Sheet", shift: "service", date: new Date().toISOString().split("T")[0], from_template: "" });
  const [templateName, setTemplateName] = useState("");
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("normal");

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    const [sheetsRes, templatesRes] = await Promise.all([
      (supabase as any).from("bev_run_sheets").select("*").eq("org_id", orgId).eq("is_template", false).order("date", { ascending: false }).limit(20),
      (supabase as any).from("bev_run_sheets").select("*").eq("org_id", orgId).eq("is_template", true).order("template_name"),
    ]);
    setSheets(sheetsRes.data || []);
    setTemplates(templatesRes.data || []);
    setLoading(false);
  };

  const loadTasks = async (sheetId: string) => {
    const { data } = await (supabase as any).from("bev_run_sheet_tasks").select("*").eq("run_sheet_id", sheetId).order("sort_order");
    setTasks(data || []);
  };

  useEffect(() => { load(); }, [orgId]);

  useEffect(() => {
    if (selectedSheet) loadTasks(selectedSheet.id);
  }, [selectedSheet?.id]);

  const createSheet = async () => {
    if (!orgId) return;
    // If from template, copy tasks
    const { data: sheetData, error } = await (supabase as any).from("bev_run_sheets").insert({
      org_id: orgId, title: newForm.title, shift: newForm.shift, date: newForm.date,
    }).select().single();
    if (error) { toast.error("Failed to create run sheet"); return; }

    if (newForm.from_template) {
      const { data: templateTasks } = await (supabase as any).from("bev_run_sheet_tasks")
        .select("task, assigned_to, priority, sort_order, notes").eq("run_sheet_id", newForm.from_template);
      if (templateTasks?.length) {
        const newTasks = templateTasks.map((t: any, i: number) => ({
          run_sheet_id: sheetData.id, org_id: orgId, task: t.task,
          assigned_to: t.assigned_to, priority: t.priority, sort_order: t.sort_order || i, notes: t.notes,
        }));
        await (supabase as any).from("bev_run_sheet_tasks").insert(newTasks);
      }
    }

    toast.success("Run sheet created!");
    setShowNewDialog(false);
    setNewForm({ title: "Service Run Sheet", shift: "service", date: new Date().toISOString().split("T")[0], from_template: "" });
    load();
    setSelectedSheet(sheetData);
  };

  const addTask = async () => {
    if (!selectedSheet || !newTaskText.trim() || !orgId) return;
    const { error } = await (supabase as any).from("bev_run_sheet_tasks").insert({
      run_sheet_id: selectedSheet.id, org_id: orgId, task: newTaskText.trim(),
      assigned_to: newTaskAssignee || null, priority: newTaskPriority, sort_order: tasks.length,
    });
    if (error) { toast.error("Failed to add task"); return; }
    setNewTaskText("");
    setNewTaskAssignee("");
    setNewTaskPriority("normal");
    loadTasks(selectedSheet.id);
  };

  const toggleTask = async (task: RunSheetTask) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    await (supabase as any).from("bev_run_sheet_tasks").update({
      status: newStatus, completed_at: newStatus === "completed" ? new Date().toISOString() : null,
    }).eq("id", task.id);
    loadTasks(selectedSheet!.id);
  };

  const deleteTask = async (id: string) => {
    await (supabase as any).from("bev_run_sheet_tasks").delete().eq("id", id);
    loadTasks(selectedSheet!.id);
  };

  const postToWall = async () => {
    if (!selectedSheet) return;
    await (supabase as any).from("bev_run_sheets").update({ posted_to_wall: true, status: "active" }).eq("id", selectedSheet.id);
    toast.success("Run sheet posted to the wall!");
    setSelectedSheet({ ...selectedSheet, posted_to_wall: true, status: "active" });
    load();
  };

  const saveAsTemplate = async () => {
    if (!selectedSheet || !templateName.trim() || !orgId) return;
    const { data: tmpl, error } = await (supabase as any).from("bev_run_sheets").insert({
      org_id: orgId, title: selectedSheet.title, shift: selectedSheet.shift,
      is_template: true, template_name: templateName.trim(), status: "template",
    }).select().single();
    if (error) { toast.error("Failed to save template"); return; }
    // Copy tasks
    if (tasks.length > 0) {
      const newTasks = tasks.map((t, i) => ({
        run_sheet_id: tmpl.id, org_id: orgId, task: t.task,
        assigned_to: t.assigned_to, priority: t.priority, sort_order: i, notes: t.notes,
      }));
      await (supabase as any).from("bev_run_sheet_tasks").insert(newTasks);
    }
    toast.success("Template saved!");
    setShowSaveTemplateDialog(false);
    setTemplateName("");
    load();
  };

  const completedCount = tasks.filter(t => t.status === "completed").length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  if (selectedSheet) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" onClick={() => { setSelectedSheet(null); setTasks([]); }}>← Back</Button>
            <h2 className="text-lg font-bold mt-1">{selectedSheet.title}</h2>
            <p className="text-xs text-muted-foreground">
              {format(new Date(selectedSheet.date), "dd MMM yyyy")} · {selectedSheet.shift} · {completedCount}/{tasks.length} done ({progress}%)
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog}>
              <DialogTrigger asChild><Button variant="outline" size="sm"><Save className="w-4 h-4 mr-1" /> Save Template</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Save as Template</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Template Name</Label><Input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="e.g. Friday Service" /></div>
                  <Button onClick={saveAsTemplate} className="w-full">Save Template</Button>
                </div>
              </DialogContent>
            </Dialog>
            {!selectedSheet.posted_to_wall && (
              <Button size="sm" onClick={postToWall}><Send className="w-4 h-4 mr-1" /> Post to Wall</Button>
            )}
          </div>
        </div>

        {selectedSheet.posted_to_wall && (
          <Badge variant="default" className="mb-2">📌 Posted to Wall</Badge>
        )}

        {/* Add task */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex gap-2">
              <Input value={newTaskText} onChange={e => setNewTaskText(e.target.value)} placeholder="Add task..." className="flex-1"
                onKeyDown={e => e.key === "Enter" && addTask()} />
              <Input value={newTaskAssignee} onChange={e => setNewTaskAssignee(e.target.value)} placeholder="Assign to..." className="w-32" />
              <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
              <Button onClick={addTask} size="icon"><Plus className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>

        {/* Task list */}
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <Card><CardContent className="py-6 text-center text-muted-foreground text-sm">No tasks yet. Add your first task above.</CardContent></Card>
          ) : (
            tasks.map(t => (
              <Card key={t.id} className={t.status === "completed" ? "opacity-60" : ""}>
                <CardContent className="pt-3 pb-3 flex items-center gap-3">
                  <Checkbox checked={t.status === "completed"} onCheckedChange={() => toggleTask(t)} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${t.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{t.task}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {t.assigned_to && <span className="text-xs text-muted-foreground">{t.assigned_to}</span>}
                      {t.priority !== "normal" && <Badge variant={t.priority === "urgent" ? "destructive" : t.priority === "high" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">{t.priority}</Badge>}
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteTask(t.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Run Sheets</h2>
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Run Sheet</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Run Sheet</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={newForm.title} onChange={e => setNewForm({ ...newForm, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Shift</Label>
                  <Select value={newForm.shift} onValueChange={v => setNewForm({ ...newForm, shift: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SHIFTS.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Date</Label><Input type="date" value={newForm.date} onChange={e => setNewForm({ ...newForm, date: e.target.value })} /></div>
              </div>
              {templates.length > 0 && (
                <div>
                  <Label>From Template (optional)</Label>
                  <Select value={newForm.from_template} onValueChange={v => setNewForm({ ...newForm, from_template: v })}>
                    <SelectTrigger><SelectValue placeholder="Start blank" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Start blank</SelectItem>
                      {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.template_name || t.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={createSheet} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates */}
      {templates.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Saved Templates</p>
          <div className="flex gap-2 flex-wrap">
            {templates.map(t => (
              <Badge key={t.id} variant="outline" className="cursor-pointer" onClick={() => {
                setNewForm({ ...newForm, from_template: t.id, title: t.template_name || t.title, shift: t.shift });
                setShowNewDialog(true);
              }}>
                <Copy className="w-3 h-3 mr-1" /> {t.template_name || t.title}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Recent sheets */}
      {loading ? (
        <Card><CardContent className="py-6 text-center text-muted-foreground text-sm">Loading...</CardContent></Card>
      ) : sheets.length === 0 ? (
        <Card><CardContent className="py-6 text-center text-muted-foreground text-sm">No run sheets yet. Create your first daily run sheet.</CardContent></Card>
      ) : (
        sheets.map(s => (
          <Card key={s.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setSelectedSheet(s)}>
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{s.title}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(s.date), "dd MMM yyyy")} · {s.shift}</p>
              </div>
              <div className="flex items-center gap-2">
                {s.posted_to_wall && <Badge variant="default" className="text-[10px]">📌 Wall</Badge>}
                <Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default BevRunSheetManager;
