import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Bell, Plus, Shield, AlertTriangle, XCircle, CheckCircle2,
  Loader2, Clock, Eye, EyeOff, Trash2, Settings2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const METRICS = [
  "FOOD_COST_PCT", "BEV_COST_PCT", "LABOUR_PCT", "RENT_PCT",
  "OVERHEAD_PCT", "PRIME_COST_PCT", "NET_PROFIT_PCT", "UTILITIES_PCT",
];

const COMPARISONS = [
  { value: "ABOVE", label: "Above threshold" },
  { value: "BELOW", label: "Below threshold" },
];

const SeverityIcon = ({ s }: { s: string }) => {
  if (s === "CRITICAL") return <XCircle className="w-4 h-4 text-destructive" />;
  if (s === "WARNING") return <AlertTriangle className="w-4 h-4 text-amber-500" />;
  return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
};

const OverheadAlerts = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const qc = useQueryClient();
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    cost_category: "OVERHEAD_PCT", metric: "PERCENTAGE",
    threshold_warning: "10", threshold_critical: "15",
    comparison: "ABOVE", period: "MONTHLY",
    notify_in_app: true, notify_pos: true, notify_email: false,
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ["overhead_alerts", orgId],
    queryFn: async () => {
      const { data } = await supabase.from("overhead_alerts").select("*").eq("org_id", orgId!).order("triggered_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!orgId,
  });

  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ["overhead_alert_rules", orgId],
    queryFn: async () => {
      const { data } = await supabase.from("overhead_alert_rules").select("*").eq("org_id", orgId!).order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!orgId,
  });

  const ackMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("overhead_alerts").update({ status: "ACKNOWLEDGED", acknowledged_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["overhead_alerts"] }); toast.success("Alert acknowledged"); },
  });

  const dismissMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("overhead_alerts").update({ status: "DISMISSED" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["overhead_alerts"] }); toast.success("Alert dismissed"); },
  });

  const createRuleMut = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from("overhead_alert_rules").insert({
        org_id: orgId!, cost_category: values.cost_category, metric: values.metric,
        threshold_warning: parseFloat(values.threshold_warning) || null,
        threshold_critical: parseFloat(values.threshold_critical) || null,
        comparison: values.comparison, period: values.period,
        notify_in_app: values.notify_in_app, notify_pos: values.notify_pos,
        notify_email: values.notify_email,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["overhead_alert_rules"] });
      toast.success("Alert rule created");
      setRuleDialogOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteRuleMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("overhead_alert_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["overhead_alert_rules"] }); toast.success("Rule deleted"); },
  });

  const toggleRuleMut = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("overhead_alert_rules").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["overhead_alert_rules"] }); },
  });

  const activeAlerts = alerts.filter((a: any) => a.status === "ACTIVE");
  const pastAlerts = alerts.filter((a: any) => a.status !== "ACTIVE");

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" /> Alert Engine
          </h1>
          <p className="text-muted-foreground text-sm">Monitor cost thresholds and pattern-based alerts</p>
        </div>
        <Button onClick={() => setRuleDialogOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Add Rule</Button>
      </div>

      {/* Summary Badges */}
      <div className="flex gap-3">
        <Badge variant={activeAlerts.filter((a: any) => a.severity === "CRITICAL").length > 0 ? "destructive" : "secondary"} className="text-xs px-3 py-1.5">
          <XCircle className="w-3.5 h-3.5 mr-1" />
          {activeAlerts.filter((a: any) => a.severity === "CRITICAL").length} Critical
        </Badge>
        <Badge variant="secondary" className="text-xs px-3 py-1.5">
          <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-500" />
          {activeAlerts.filter((a: any) => a.severity === "WARNING").length} Warning
        </Badge>
        <Badge variant="secondary" className="text-xs px-3 py-1.5">
          <Shield className="w-3.5 h-3.5 mr-1" />
          {rules.filter((r: any) => r.is_active).length} Active Rules
        </Badge>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active Alerts ({activeAlerts.length})</TabsTrigger>
          <TabsTrigger value="history">History ({pastAlerts.length})</TabsTrigger>
          <TabsTrigger value="rules">Rules ({rules.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-2 mt-4">
          {alertsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : activeAlerts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" /> All clear — no active alerts
              </CardContent>
            </Card>
          ) : (
            activeAlerts.map((a: any) => (
              <Card key={a.id} className={cn("border-l-4", a.severity === "CRITICAL" ? "border-l-destructive" : "border-l-amber-500")}>
                <CardContent className="p-4 flex items-start gap-3">
                  <SeverityIcon s={a.severity} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{a.message}</p>
                    {a.pattern_insight && <p className="text-xs text-muted-foreground mt-0.5">{a.pattern_insight}</p>}
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDistanceToNow(parseISO(a.triggered_at), { addSuffix: true })}</span>
                      <span className="font-mono">Actual: {Number(a.actual_value).toFixed(1)}% | Threshold: {Number(a.threshold_value).toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => ackMut.mutate(a.id)}>
                      <Eye className="w-3 h-3 mr-1" /> Acknowledge
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => dismissMut.mutate(a.id)}>
                      <EyeOff className="w-3 h-3 mr-1" /> Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-2 mt-4">
          {pastAlerts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">No alert history yet.</CardContent>
            </Card>
          ) : (
            pastAlerts.slice(0, 20).map((a: any) => (
              <div key={a.id} className="flex items-center gap-3 px-3 py-2 rounded-md bg-muted/30">
                <SeverityIcon s={a.severity} />
                <span className="text-sm text-foreground flex-1 truncate">{a.message}</span>
                <Badge variant={a.status === "ACKNOWLEDGED" ? "secondary" : "outline"} className="text-[9px]">{a.status}</Badge>
                <span className="text-xs text-muted-foreground shrink-0">{format(parseISO(a.triggered_at), "d MMM")}</span>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="rules" className="space-y-2 mt-4">
          {rulesLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : rules.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No alert rules configured. Create rules to monitor cost thresholds.
              </CardContent>
            </Card>
          ) : (
            rules.map((r: any) => (
              <Card key={r.id} className={cn(!r.is_active && "opacity-50")}>
                <CardContent className="p-3 flex items-center gap-3">
                  <Settings2 className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{r.cost_category.replace(/_/g, " ")}</span>
                      <Badge variant="outline" className="text-[9px]">{r.comparison}</Badge>
                      <Badge variant="secondary" className="text-[9px]">{r.period}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Warning at {r.threshold_warning}% · Critical at {r.threshold_critical}%
                      {r.notify_pos && " · POS alerts"}
                      {r.notify_email && " · Email"}
                    </p>
                  </div>
                  <Switch checked={r.is_active} onCheckedChange={v => toggleRuleMut.mutate({ id: r.id, is_active: v })} />
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteRuleMut.mutate(r.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Create Rule Dialog */}
      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Alert Rule</DialogTitle>
            <DialogDescription>Set thresholds to trigger automatic alerts when costs exceed targets.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Metric</Label>
                <Select value={ruleForm.cost_category} onValueChange={v => setRuleForm(f => ({ ...f, cost_category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {METRICS.map(m => <SelectItem key={m} value={m}>{m.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Comparison</Label>
                <Select value={ruleForm.comparison} onValueChange={v => setRuleForm(f => ({ ...f, comparison: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COMPARISONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Warning Threshold (%)</Label>
                <Input type="number" value={ruleForm.threshold_warning} onChange={e => setRuleForm(f => ({ ...f, threshold_warning: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Critical Threshold (%)</Label>
                <Input type="number" value={ruleForm.threshold_critical} onChange={e => setRuleForm(f => ({ ...f, threshold_critical: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Monitoring Period</Label>
              <Select value={ruleForm.period} onValueChange={v => setRuleForm(f => ({ ...f, period: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notifications</Label>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2"><Switch checked={ruleForm.notify_in_app} onCheckedChange={v => setRuleForm(f => ({ ...f, notify_in_app: v }))} /><span className="text-sm">In-App</span></div>
                <div className="flex items-center gap-2"><Switch checked={ruleForm.notify_pos} onCheckedChange={v => setRuleForm(f => ({ ...f, notify_pos: v }))} /><span className="text-sm">POS Header</span></div>
                <div className="flex items-center gap-2"><Switch checked={ruleForm.notify_email} onCheckedChange={v => setRuleForm(f => ({ ...f, notify_email: v }))} /><span className="text-sm">Email</span></div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => createRuleMut.mutate(ruleForm)} disabled={createRuleMut.isPending}>
              {createRuleMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OverheadAlerts;
