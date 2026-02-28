import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, AlertTriangle, CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/useOrgId";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO } from "date-fns";

interface CorrectiveAction {
  id: string;
  org_id: string;
  log_id: string | null;
  log_type: string | null;
  severity: string;
  description: string;
  action_taken: string | null;
  assigned_to: string | null;
  status: string;
  due_date: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  follow_up_notes: string | null;
  created_at: string;
}

const SEVERITY_OPTIONS = [
  { value: "critical", label: "Critical", color: "bg-destructive text-destructive-foreground" },
  { value: "major", label: "Major", color: "bg-warning text-warning-foreground" },
  { value: "minor", label: "Minor", color: "bg-muted text-muted-foreground" },
];

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export default function CorrectiveActionRegister() {
  const orgId = useOrgId();
  const { user } = useAuth();
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");

  const [form, setForm] = useState({
    severity: "minor",
    description: "",
    action_taken: "",
    assigned_to: "",
    due_date: "",
    log_type: "",
  });

  const fetchActions = useCallback(async () => {
    if (!orgId) return;
    const { data } = await supabase
      .from("corrective_actions")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });
    if (data) setActions(data as unknown as CorrectiveAction[]);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { fetchActions(); }, [fetchActions]);

  const handleCreate = async () => {
    if (!orgId || !form.description.trim()) { toast.error("Description is required"); return; }
    setSaving(true);
    const { error } = await supabase.from("corrective_actions").insert({
      org_id: orgId,
      severity: form.severity,
      description: form.description,
      action_taken: form.action_taken || null,
      assigned_to: form.assigned_to || null,
      due_date: form.due_date || null,
      log_type: form.log_type || null,
      status: "open",
    } as any);
    if (error) toast.error("Failed to create");
    else { toast.success("Corrective action recorded"); setDialogOpen(false); resetForm(); fetchActions(); }
    setSaving(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "resolved") { updates.resolved_at = new Date().toISOString(); updates.resolved_by = user?.email?.split("@")[0]; }
    await supabase.from("corrective_actions").update(updates).eq("id", id);
    fetchActions();
    toast.success("Status updated");
  };

  const resetForm = () => setForm({ severity: "minor", description: "", action_taken: "", assigned_to: "", due_date: "", log_type: "" });

  const filtered = filter === "all" ? actions : actions.filter((a) => a.status === filter);
  const openCount = actions.filter((a) => a.status === "open" || a.status === "in_progress").length;
  const criticalOpen = actions.filter((a) => a.severity === "critical" && (a.status === "open" || a.status === "in_progress")).length;

  return (
    <>
      {criticalOpen > 0 && (
        <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg px-4 py-3 font-medium mb-4">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          {criticalOpen} critical corrective action{criticalOpen > 1 ? "s" : ""} require immediate attention
        </div>
      )}

      <Card className="border-[#000080]/20">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-[#000080]">
              <AlertTriangle className="w-5 h-5" />
              Corrective Action Register
            </CardTitle>
            <CardDescription>{openCount} open action{openCount !== 1 ? "s" : ""}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" className="bg-[#000080] hover:bg-[#000080]/90 text-white" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#000080]" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No corrective actions found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[140px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs whitespace-nowrap">{format(parseISO(a.created_at), "dd/MM/yy")}</TableCell>
                      <TableCell>
                        <Badge className={SEVERITY_OPTIONS.find((s) => s.value === a.severity)?.color}>{a.severity}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{a.description}</TableCell>
                      <TableCell className="text-sm">{a.assigned_to || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={a.status === "resolved" || a.status === "closed" ? "default" : "secondary"}>
                          {a.status === "resolved" || a.status === "closed" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {a.status !== "resolved" && a.status !== "closed" && (
                          <Select value="" onValueChange={(v) => updateStatus(a.id, v)}>
                            <SelectTrigger className="h-8 text-xs w-[120px]"><SelectValue placeholder="Change…" /></SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.filter((s) => s.value !== a.status).map((s) => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Corrective Action</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Severity</Label>
              <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEVERITY_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" placeholder="What was the non-compliance issue?" />
            </div>
            <div>
              <Label>Action Taken</Label>
              <Textarea value={form.action_taken} onChange={(e) => setForm({ ...form, action_taken: e.target.value })} className="mt-1" placeholder="Corrective steps taken…" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Assigned To</Label>
                <Input value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving} className="bg-[#000080] hover:bg-[#000080]/90 text-white">
              {saving ? "Saving…" : "Create Action"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}