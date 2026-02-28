import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Timer, CheckCircle2, Plus, Clock, AlertTriangle, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBatchResting, RestingTimer } from "@/hooks/useBatchResting";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/useOrgId";
import { differenceInMilliseconds, formatDistanceToNow } from "date-fns";

const RESTING_TYPES = ["Proofing", "Curing", "Resting", "Brining", "Aging", "Fermenting"];

function getTimerProgress(timer: RestingTimer) {
  const elapsed = differenceInMilliseconds(new Date(), new Date(timer.started_at));
  const totalMs = (timer.target_duration_hours || 1) * 3600000;
  return Math.min(100, (elapsed / totalMs) * 100);
}

function getTimerStatus(timer: RestingTimer) {
  if (timer.status === "completed") return "completed";
  const progress = getTimerProgress(timer);
  if (progress >= 100) return "overdue";
  if (progress >= 75) return "almost";
  return "resting";
}

function getTimerColor(status: string) {
  switch (status) {
    case "completed": return "text-success";
    case "overdue": return "text-destructive";
    case "almost": return "text-warning";
    default: return "text-primary";
  }
}

function getProgressColor(status: string) {
  switch (status) {
    case "completed": return "[&>div]:bg-success";
    case "overdue": return "[&>div]:bg-destructive";
    case "almost": return "[&>div]:bg-warning";
    default: return "[&>div]:bg-primary";
  }
}

function isCheckDue(timer: RestingTimer) {
  if (!timer.check_intervals_hours || timer.check_intervals_hours <= 0) return false;
  if (timer.status === "completed") return false;
  const lastCheck = timer.last_check_at ? new Date(timer.last_check_at) : new Date(timer.started_at);
  const msSinceCheck = differenceInMilliseconds(new Date(), lastCheck);
  return msSinceCheck >= timer.check_intervals_hours * 3600000;
}

function formatDuration(hours: number) {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours}h`;
  const d = Math.floor(hours / 24);
  const h = Math.round(hours % 24);
  return h > 0 ? `${d}d ${h}h` : `${d}d`;
}

const BatchRestingTracker = () => {
  const { timers, loading, startTimer, logCheck, completeTimer } = useBatchResting();
  const orgId = useOrgId();
  const [showStart, setShowStart] = useState(false);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [form, setForm] = useState({
    recipe_id: "",
    recipe_name: "",
    batch_code: "",
    resting_type: "Resting",
    target_duration_hours: 0,
    check_intervals_hours: 0,
    notes: "",
  });
  const [, setTick] = useState(0);

  // Re-render every 30s for live countdowns
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  // Load recipes with requires_resting
  useEffect(() => {
    if (!orgId) return;
    (supabase as any)
      .from("recipes")
      .select("id, name, resting_type, resting_duration_hours, requires_resting")
      .eq("org_id", orgId)
      .eq("requires_resting", true)
      .order("name")
      .then(({ data }: any) => setRecipes(data || []));
  }, [orgId]);

  const handleRecipeSelect = (recipeId: string) => {
    const r = recipes.find((rec: any) => rec.id === recipeId);
    if (r) {
      setForm(f => ({
        ...f,
        recipe_id: r.id,
        recipe_name: r.name,
        resting_type: r.resting_type || "Resting",
        target_duration_hours: Number(r.resting_duration_hours) || 0,
      }));
    }
  };

  const handleStart = () => {
    if (!form.recipe_name || !form.batch_code || form.target_duration_hours <= 0) return;
    startTimer({
      recipe_id: form.recipe_id || undefined,
      recipe_name: form.recipe_name,
      batch_code: form.batch_code,
      resting_type: form.resting_type,
      target_duration_hours: form.target_duration_hours,
      check_intervals_hours: form.check_intervals_hours || undefined,
      notes: form.notes || undefined,
    });
    setShowStart(false);
    setForm({ recipe_id: "", recipe_name: "", batch_code: "", resting_type: "Resting", target_duration_hours: 0, check_intervals_hours: 0, notes: "" });
  };

  const activeTimers = timers.filter(t => t.status !== "completed");
  const completedTimers = timers.filter(t => t.status === "completed");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Resting & Curing Timers</h3>
          {activeTimers.length > 0 && (
            <Badge variant="outline">{activeTimers.length} active</Badge>
          )}
        </div>
        <Dialog open={showStart} onOpenChange={setShowStart}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Start Resting</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Start Resting Timer</DialogTitle></DialogHeader>
            <div className="space-y-4">
              {recipes.length > 0 && (
                <div>
                  <Label>Recipe (optional)</Label>
                  <Select value={form.recipe_id} onValueChange={handleRecipeSelect}>
                    <SelectTrigger><SelectValue placeholder="Select recipe..." /></SelectTrigger>
                    <SelectContent>
                      {recipes.map((r: any) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Recipe Name *</Label>
                  <Input value={form.recipe_name} onChange={e => setForm(f => ({ ...f, recipe_name: e.target.value }))} placeholder="e.g. Bresaola" />
                </div>
                <div>
                  <Label>Batch Code *</Label>
                  <Input value={form.batch_code} onChange={e => setForm(f => ({ ...f, batch_code: e.target.value }))} placeholder="e.g. B-001" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Resting Type</Label>
                  <Select value={form.resting_type} onValueChange={v => setForm(f => ({ ...f, resting_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RESTING_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Duration (hours) *</Label>
                  <Input type="number" min="0.5" step="0.5" value={form.target_duration_hours || ""} onChange={e => setForm(f => ({ ...f, target_duration_hours: +e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Check Interval (hours, 0 = none)</Label>
                <Input type="number" min="0" step="1" value={form.check_intervals_hours || ""} onChange={e => setForm(f => ({ ...f, check_intervals_hours: +e.target.value }))} placeholder="e.g. 12" />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any notes..." />
              </div>
              <Button onClick={handleStart} className="w-full" disabled={!form.recipe_name || !form.batch_code || form.target_duration_hours <= 0}>
                <Timer className="w-4 h-4 mr-2" /> Start Timer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Timers */}
      {loading ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
      ) : activeTimers.length === 0 && completedTimers.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No resting timers. Start one for items that need proofing, curing, brining, etc.</CardContent></Card>
      ) : (
        <>
          {activeTimers.map((timer, idx) => {
            const status = getTimerStatus(timer);
            const progress = getTimerProgress(timer);
            const checkDue = isCheckDue(timer);
            const remaining = timer.expected_end_at
              ? differenceInMilliseconds(new Date(timer.expected_end_at), new Date())
              : 0;

            return (
              <motion.div
                key={timer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="border">
                  <CardContent className="py-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{timer.recipe_name}</p>
                        {timer.batch_code && (
                          <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{timer.batch_code}</span>
                        )}
                        <Badge variant="outline" className="capitalize">{timer.resting_type}</Badge>
                        {checkDue && (
                          <Badge className="bg-warning text-warning-foreground">
                            <AlertTriangle className="w-3 h-3 mr-1" /> Check Due
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => logCheck(timer.id)}>
                          <Eye className="w-3.5 h-3.5 mr-1" /> Check
                        </Button>
                        <Button size="sm" variant="default" onClick={() => completeTimer(timer.id)}>
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Complete
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Progress value={Math.min(progress, 100)} className={`h-2 ${getProgressColor(status)}`} />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatDuration(timer.target_duration_hours)} total</span>
                        <span className={getTimerColor(status)}>
                          {remaining > 0
                            ? `${formatDistanceToNow(new Date(timer.expected_end_at!))} remaining`
                            : "Ready / Overdue"}
                        </span>
                      </div>
                    </div>

                    {timer.check_count > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {timer.check_count} check{timer.check_count > 1 ? "s" : ""} logged
                        {timer.last_check_at && ` · Last: ${formatDistanceToNow(new Date(timer.last_check_at), { addSuffix: true })}`}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {/* Completed */}
          {completedTimers.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground mt-4">Completed</p>
              {completedTimers.slice(0, 5).map(timer => (
                <Card key={timer.id} className="border opacity-60">
                  <CardContent className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <span className="text-sm font-medium">{timer.recipe_name}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">{timer.resting_type}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {timer.actual_end_at && formatDistanceToNow(new Date(timer.actual_end_at), { addSuffix: true })}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BatchRestingTracker;
