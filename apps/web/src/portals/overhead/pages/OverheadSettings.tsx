import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Tags, Target, Bell, Database, Plus, Pencil, Trash2, GripVertical, Clock } from "lucide-react";
import { useOrg } from "@/contexts/OrgContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { CostType } from "@/lib/shared/types/overhead.types";

/* ─── Category CRUD ─── */
const CategorySettings = ({ orgId }: { orgId?: string }) => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editCat, setEditCat] = useState<any>(null);
  const [form, setForm] = useState({ name: "", type: "FIXED" as CostType, is_cogs: false, is_labour: false, xero_account_code: "" });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["overhead_categories", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("overhead_categories")
        .select("*")
        .eq("org_id", orgId!)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const upsertMut = useMutation({
    mutationFn: async (cat: any) => {
      if (cat.id) {
        const { error } = await supabase.from("overhead_categories").update({
          name: cat.name, type: cat.type, is_cogs: cat.is_cogs, is_labour: cat.is_labour,
          xero_account_code: cat.xero_account_code || null,
        }).eq("id", cat.id);
        if (error) throw error;
      } else {
        const maxSort = categories.length > 0 ? Math.max(...categories.map((c: any) => c.sort_order)) + 1 : 1;
        const { error } = await supabase.from("overhead_categories").insert({
          org_id: orgId, name: cat.name, type: cat.type, is_cogs: cat.is_cogs, is_labour: cat.is_labour,
          xero_account_code: cat.xero_account_code || null, sort_order: maxSort,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["overhead_categories"] }); setOpen(false); toast.success("Category saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("overhead_categories").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["overhead_categories"] }),
  });

  const openNew = () => { setEditCat(null); setForm({ name: "", type: "FIXED", is_cogs: false, is_labour: false, xero_account_code: "" }); setOpen(true); };
  const openEdit = (c: any) => { setEditCat(c); setForm({ name: c.name, type: c.type, is_cogs: c.is_cogs, is_labour: c.is_labour, xero_account_code: c.xero_account_code || "" }); setOpen(true); };

  const typeColor: Record<string, string> = { FIXED: "bg-blue-500/15 text-blue-400", VARIABLE: "bg-amber-500/15 text-amber-400", SEMI_VARIABLE: "bg-purple-500/15 text-purple-400" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Cost Categories</h3>
          <p className="text-xs text-muted-foreground">Add, rename, or deactivate overhead cost categories.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Add Category</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editCat ? "Edit" : "New"} Category</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Cleaning Supplies" /></div>
              <div><Label>Cost Type</Label>
                <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v as CostType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">Fixed</SelectItem>
                    <SelectItem value="VARIABLE">Variable</SelectItem>
                    <SelectItem value="SEMI_VARIABLE">Semi-Variable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Xero Account Code (optional)</Label><Input value={form.xero_account_code} onChange={e => setForm(p => ({ ...p, xero_account_code: e.target.value }))} placeholder="e.g. 400-100" /></div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2"><Switch checked={form.is_cogs} onCheckedChange={v => setForm(p => ({ ...p, is_cogs: v }))} /><Label className="text-sm">Counts as COGS</Label></div>
                <div className="flex items-center gap-2"><Switch checked={form.is_labour} onCheckedChange={v => setForm(p => ({ ...p, is_labour: v }))} /><Label className="text-sm">Labour-related</Label></div>
              </div>
              <Button className="w-full" disabled={!form.name.trim()} onClick={() => upsertMut.mutate({ ...form, id: editCat?.id })}>
                {editCat ? "Update" : "Create"} Category
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-1">
          {categories.map((c: any) => (
            <div key={c.id} className="flex items-center gap-3 py-2 px-3 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors">
              <GripVertical className="w-4 h-4 text-muted-foreground/40" />
              <span className={`text-sm font-medium flex-1 ${!c.is_active ? "line-through text-muted-foreground" : "text-foreground"}`}>{c.name}</span>
              <Badge variant="outline" className={`text-[10px] ${typeColor[c.type] || ""}`}>{c.type.replace("_", "-")}</Badge>
              {c.is_cogs && <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-400">COGS</Badge>}
              <Switch checked={c.is_active} onCheckedChange={v => toggleMut.mutate({ id: c.id, is_active: v })} />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
            </div>
          ))}
          {categories.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No categories yet — add one above.</p>}
        </div>
      )}
    </div>
  );
};

/* ─── Budget Targets ─── */
const BudgetTargets = ({ orgId }: { orgId?: string }) => {
  const qc = useQueryClient();
  const { data: benchmarks = [] } = useQuery({
    queryKey: ["overhead_benchmarks", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("overhead_benchmarks").select("*").eq("org_id", orgId!).order("metric");
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const updateTarget = useMutation({
    mutationFn: async ({ id, target_value }: { id: string; target_value: number }) => {
      const { error } = await supabase.from("overhead_benchmarks").update({ target_value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["overhead_benchmarks"] }); toast.success("Target updated"); },
  });

  const metrics = [
    { key: "overhead_pct_revenue", label: "Overhead % of Revenue", unit: "%", defaultTarget: 25 },
    { key: "rent_pct_revenue", label: "Rent % of Revenue", unit: "%", defaultTarget: 8 },
    { key: "utilities_pct_revenue", label: "Utilities % of Revenue", unit: "%", defaultTarget: 4 },
    { key: "insurance_annual", label: "Insurance (Annual $)", unit: "$", defaultTarget: 15000 },
    { key: "prime_cost_pct", label: "Prime Cost %", unit: "%", defaultTarget: 65 },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-foreground">Budget Targets</h3>
        <p className="text-xs text-muted-foreground">Set targets that drive alerts & dashboard colour-coding.</p>
      </div>
      <div className="space-y-2">
        {metrics.map(m => {
          const bench = benchmarks.find((b: any) => b.metric === m.key);
          const val = bench?.target_value ?? m.defaultTarget;
          return (
            <div key={m.key} className="flex items-center gap-4 py-2 px-3 rounded-lg border border-border bg-card">
              <span className="text-sm text-foreground flex-1">{m.label}</span>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  className="w-20 h-8 text-sm text-right"
                  defaultValue={val}
                  onBlur={e => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v) && bench) updateTarget.mutate({ id: bench.id, target_value: v });
                  }}
                />
                <span className="text-xs text-muted-foreground w-4">{m.unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Alert Preferences ─── */
const AlertPreferences = ({ orgId }: { orgId?: string }) => {
  const [prefs, setPrefs] = useState({
    notifyInApp: true,
    notifyEmail: true,
    notifySms: false,
    notifyPos: true,
    autoResolveAfterDays: 7,
    warningCooldownHours: 24,
    criticalCooldownHours: 4,
  });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-foreground">Alert Preferences</h3>
        <p className="text-xs text-muted-foreground">Control how and when cost alerts are delivered.</p>
      </div>
      <Card>
        <CardContent className="pt-4 space-y-4">
          <h4 className="text-sm font-medium text-foreground">Notification Channels</h4>
          {[
            { key: "notifyInApp", label: "In-App Notifications", desc: "Show alerts in the dashboard" },
            { key: "notifyEmail", label: "Email Alerts", desc: "Send critical alerts via email" },
            { key: "notifySms", label: "SMS Alerts", desc: "Text message for critical breaches" },
            { key: "notifyPos", label: "POS Header Banner", desc: "Push critical alerts to POS header" },
          ].map(ch => (
            <div key={ch.key} className="flex items-center justify-between py-1">
              <div><p className="text-sm text-foreground">{ch.label}</p><p className="text-xs text-muted-foreground">{ch.desc}</p></div>
              <Switch checked={(prefs as any)[ch.key]} onCheckedChange={v => setPrefs(p => ({ ...p, [ch.key]: v }))} />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 space-y-3">
          <h4 className="text-sm font-medium text-foreground">Cooldown & Resolution</h4>
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-foreground">Warning cooldown</p><p className="text-xs text-muted-foreground">Minimum hours between repeat warnings</p></div>
            <Input type="number" className="w-20 h-8 text-sm text-right" value={prefs.warningCooldownHours} onChange={e => setPrefs(p => ({ ...p, warningCooldownHours: +e.target.value }))} />
          </div>
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-foreground">Critical cooldown</p><p className="text-xs text-muted-foreground">Minimum hours between critical alerts</p></div>
            <Input type="number" className="w-20 h-8 text-sm text-right" value={prefs.criticalCooldownHours} onChange={e => setPrefs(p => ({ ...p, criticalCooldownHours: +e.target.value }))} />
          </div>
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-foreground">Auto-resolve after</p><p className="text-xs text-muted-foreground">Days before unacknowledged alerts auto-resolve</p></div>
            <Input type="number" className="w-20 h-8 text-sm text-right" value={prefs.autoResolveAfterDays} onChange={e => setPrefs(p => ({ ...p, autoResolveAfterDays: +e.target.value }))} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/* ─── Data Feeds ─── */
const DataFeedSettings = () => {
  const feeds = [
    { module: "LabourOS", metric: "Wage costs", status: "live", lastSync: "2 min ago", comingSoon: false },
    { module: "ChefOS", metric: "Food cost %", status: "live", lastSync: "15 min ago", comingSoon: false },
    { module: "BevOS", metric: "Beverage cost", status: "live", lastSync: "1 hr ago", comingSoon: false },
    { module: "RestOS", metric: "Revenue totals", status: "live", lastSync: "5 min ago", comingSoon: false },
    { module: "Xero", metric: "Accounting sync", status: "not_connected", lastSync: "—", comingSoon: true },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-foreground">Data Feeds & Integrations</h3>
        <p className="text-xs text-muted-foreground">Ecosystem modules that feed cost data into OverheadOS.</p>
      </div>
      <div className="space-y-2">
        {feeds.map(f => (
          <div key={f.module} className={`flex items-center gap-3 py-3 px-3 rounded-lg border border-border bg-card ${f.comingSoon ? "opacity-50" : ""}`}>
            <Database className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{f.module}</p>
              <p className="text-xs text-muted-foreground">{f.metric}</p>
            </div>
            {f.comingSoon ? (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                <Clock className="w-3 h-3 mr-1" /> Coming Soon
              </Badge>
            ) : (
              <Badge variant="outline" className={f.status === "live" ? "bg-green-500/10 text-green-400 text-[10px]" : "bg-muted text-muted-foreground text-[10px]"}>
                {f.status === "live" ? "● Live" : "Not connected"}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground w-20 text-right">{f.comingSoon ? "" : f.lastSync}</span>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="pt-4 space-y-3">
          <h4 className="text-sm font-medium text-foreground">Depreciation Defaults</h4>
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-foreground">Default method</p></div>
            <Select defaultValue="straight_line">
              <SelectTrigger className="w-44 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="straight_line">Straight Line</SelectItem>
                <SelectItem value="diminishing_value">Diminishing Value</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-foreground">Default useful life</p></div>
            <div className="flex items-center gap-1">
              <Input type="number" className="w-16 h-8 text-sm text-right" defaultValue={5} />
              <span className="text-xs text-muted-foreground">years</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/* ─── Main Settings Page ─── */
const OverheadSettings = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Overhead Settings</h1>
        <p className="text-muted-foreground text-sm">Categories, targets, alerts, and data feeds — all configurable.</p>
      </div>

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="categories" className="gap-1.5"><Tags className="w-3.5 h-3.5" /> Categories</TabsTrigger>
          <TabsTrigger value="targets" className="gap-1.5"><Target className="w-3.5 h-3.5" /> Targets</TabsTrigger>
          <TabsTrigger value="alerts" className="gap-1.5"><Bell className="w-3.5 h-3.5" /> Alerts</TabsTrigger>
          <TabsTrigger value="feeds" className="gap-1.5"><Database className="w-3.5 h-3.5" /> Data Feeds</TabsTrigger>
        </TabsList>

        <TabsContent value="categories"><CategorySettings orgId={orgId} /></TabsContent>
        <TabsContent value="targets"><BudgetTargets orgId={orgId} /></TabsContent>
        <TabsContent value="alerts"><AlertPreferences orgId={orgId} /></TabsContent>
        <TabsContent value="feeds"><DataFeedSettings /></TabsContent>
      </Tabs>
    </div>
  );
};

export default OverheadSettings;
