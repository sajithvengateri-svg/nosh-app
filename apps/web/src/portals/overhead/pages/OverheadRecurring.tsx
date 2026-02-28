import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import {
  RotateCw, Plus, Pencil, Trash2, Pause, Play, Calendar, DollarSign,
  Building2, Loader2, AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format, parseISO, isPast } from "date-fns";
import { cn } from "@/lib/utils";

const FREQUENCIES = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "FORTNIGHTLY", label: "Fortnightly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "ANNUALLY", label: "Annually" },
];

const OverheadRecurring = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    description: "", supplier_name: "", amount: "", frequency: "MONTHLY",
    category_id: "", start_date: format(new Date(), "yyyy-MM-dd"), end_date: "", auto_generate: true,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["overhead_categories", orgId],
    queryFn: async () => {
      const { data } = await supabase.from("overhead_categories").select("*").eq("org_id", orgId!).eq("is_active", true).order("sort_order");
      return data ?? [];
    },
    enabled: !!orgId,
  });

  const { data: recurring = [], isLoading } = useQuery({
    queryKey: ["overhead_recurring", orgId],
    queryFn: async () => {
      const { data } = await supabase.from("overhead_recurring").select("*, overhead_categories(name, type)").eq("org_id", orgId!).order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!orgId,
  });

  const saveMut = useMutation({
    mutationFn: async (values: any) => {
      const payload = {
        org_id: orgId!,
        description: values.description,
        supplier_name: values.supplier_name || null,
        amount: parseFloat(values.amount),
        frequency: values.frequency,
        category_id: values.category_id,
        start_date: values.start_date,
        end_date: values.end_date || null,
        auto_generate: values.auto_generate,
        next_due_date: values.start_date,
      };
      if (editing) {
        const { error } = await supabase.from("overhead_recurring").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("overhead_recurring").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["overhead_recurring"] });
      toast.success(editing ? "Recurring cost updated" : "Recurring cost created");
      closeDialog();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("overhead_recurring").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["overhead_recurring"] });
      toast.success("Recurring cost deleted");
    },
  });

  const toggleMut = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("overhead_recurring").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["overhead_recurring"] });
      toast.success("Status updated");
    },
  });

  const openNew = () => {
    setEditing(null);
    setForm({ description: "", supplier_name: "", amount: "", frequency: "MONTHLY", category_id: categories[0]?.id || "", start_date: format(new Date(), "yyyy-MM-dd"), end_date: "", auto_generate: true });
    setDialogOpen(true);
  };

  const openEdit = (r: any) => {
    setEditing(r);
    setForm({
      description: r.description, supplier_name: r.supplier_name || "", amount: String(r.amount),
      frequency: r.frequency, category_id: r.category_id, start_date: r.start_date,
      end_date: r.end_date || "", auto_generate: r.auto_generate,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditing(null); };

  const totalMonthly = recurring.filter((r: any) => r.is_active).reduce((sum: number, r: any) => {
    const amt = Number(r.amount);
    switch (r.frequency) {
      case "WEEKLY": return sum + amt * 4.33;
      case "FORTNIGHTLY": return sum + amt * 2.17;
      case "MONTHLY": return sum + amt;
      case "QUARTERLY": return sum + amt / 3;
      case "ANNUALLY": return sum + amt / 12;
      default: return sum + amt;
    }
  }, 0);

  const totalAnnual = totalMonthly * 12;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <RotateCw className="w-6 h-6 text-primary" /> Recurring Costs
          </h1>
          <p className="text-muted-foreground text-sm">Manage recurring overhead definitions that auto-generate entries</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Add Recurring</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Active Recurring</p>
            <p className="text-2xl font-bold font-mono text-foreground">{recurring.filter((r: any) => r.is_active).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Monthly Commitment</p>
            <p className="text-2xl font-bold font-mono text-foreground">${totalMonthly.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Annual Commitment</p>
            <p className="text-2xl font-bold font-mono text-foreground">${totalAnnual.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : recurring.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No recurring costs yet. Add your first to start tracking.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">All Recurring Costs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recurring.map((r: any) => {
                const overdue = r.next_due_date && isPast(parseISO(r.next_due_date));
                const catName = r.overhead_categories?.name || "Uncategorized";
                return (
                  <div key={r.id} className={cn("flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors", !r.is_active && "opacity-50")}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">{r.description}</span>
                        <Badge variant="secondary" className="text-[9px]">{catName}</Badge>
                        <Badge variant="outline" className="text-[9px]">{FREQUENCIES.find(f => f.value === r.frequency)?.label}</Badge>
                        {r.auto_generate && <Badge variant="default" className="text-[9px] bg-primary/10 text-primary border-0">Auto</Badge>}
                        {!r.is_active && <Badge variant="destructive" className="text-[9px]">Paused</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        {r.supplier_name && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{r.supplier_name}</span>}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Next: {r.next_due_date ? format(parseISO(r.next_due_date), "d MMM yyyy") : "—"}
                          {overdue && r.is_active && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-sm font-bold text-foreground shrink-0 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />{Number(r.amount).toLocaleString()}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleMut.mutate({ id: r.id, is_active: !r.is_active })}>
                        {r.is_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMut.mutate(r.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Recurring Cost" : "Add Recurring Cost"}</DialogTitle>
            <DialogDescription>Define a cost that repeats on a schedule.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Description *</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Lease - Main Venue" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount ($) *</Label>
                <Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label>Frequency</Label>
                <Select value={form.frequency} onValueChange={v => setForm(f => ({ ...f, frequency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Supplier</Label>
                <Input value={form.supplier_name} onChange={e => setForm(f => ({ ...f, supplier_name: e.target.value }))} placeholder="Optional" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date (optional)</Label>
                <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.auto_generate} onCheckedChange={v => setForm(f => ({ ...f, auto_generate: v }))} />
              <Label>Auto-generate cost entries when due</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={() => saveMut.mutate(form)} disabled={!form.description || !form.amount || !form.category_id || saveMut.isPending}>
              {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OverheadRecurring;
