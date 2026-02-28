import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert, Clock, LogOut, Edit, Plus, KeyRound } from "lucide-react";

const ClockOverride = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [action, setAction] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    const load = async () => {
      const { data } = await supabase
        .from("employee_profiles")
        .select("user_id, classification")
        .eq("org_id", orgId)
        .eq("is_active", true);
      if (data) {
        const userIds = data.map((e: any) => e.user_id);
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
        setEmployees(data.map((e: any) => ({
          ...e,
          full_name: profiles?.find((p: any) => p.user_id === e.user_id)?.full_name || "Unknown",
        })));
      }
    };
    load();
  }, [orgId]);

  const performOverride = async (eventType: string) => {
    if (!selectedEmployee || !overrideReason || !orgId || !user) {
      toast({ title: "Required", description: "Select employee and enter reason.", variant: "destructive" });
      return;
    }

    await supabase.from("clock_events").insert({
      org_id: orgId,
      user_id: selectedEmployee,
      event_type: `OVERRIDE_${eventType}`,
      event_time: new Date().toISOString(),
      shift_date: format(new Date(), "yyyy-MM-dd"),
      device_type: "BROWSER",
      override_by: user.id,
      override_reason: overrideReason,
      compliance_status: "VALID",
    });

    if (eventType === "CLOCK_IN") {
      await supabase.from("clock_shifts").insert({
        org_id: orgId,
        user_id: selectedEmployee,
        shift_date: format(new Date(), "yyyy-MM-dd"),
        clock_in: new Date().toISOString(),
        status: "ACTIVE",
        notes: `Manager override: ${overrideReason}`,
      });
    } else if (eventType === "CLOCK_OUT") {
      const { data: active } = await supabase
        .from("clock_shifts")
        .select("id, clock_in, break_minutes")
        .eq("org_id", orgId)
        .eq("user_id", selectedEmployee)
        .eq("status", "ACTIVE")
        .maybeSingle();

      if (active) {
        const hours = (Date.now() - new Date(active.clock_in).getTime()) / 3600000;
        await supabase.from("clock_shifts").update({
          clock_out: new Date().toISOString(),
          status: "COMPLETED",
          total_hours: Math.round(hours * 100) / 100,
          paid_hours: Math.round(Math.max(0, hours - (active.break_minutes || 0) / 60) * 100) / 100,
        }).eq("id", active.id);
      }
    }

    toast({ title: "Override applied", description: `${eventType} override for employee logged.` });
    setAction(null);
    setOverrideReason("");
    setSelectedEmployee("");
  };

  const overrideActions = [
    { key: "CLOCK_IN", label: "Manual Clock-In", desc: "Staff forgot PIN / device was down", icon: Clock },
    { key: "CLOCK_OUT", label: "Manual Clock-Out", desc: "Staff left without clocking out", icon: LogOut },
    { key: "EDIT", label: "Edit Clock Time", desc: "Correct wrong time", icon: Edit },
    { key: "ADD_SHIFT", label: "Add Missed Shift", desc: "Entire shift missed from system", icon: Plus },
    { key: "RESET_PIN", label: "Reset Staff PIN", desc: "Generate temporary PIN", icon: KeyRound },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldAlert className="w-6 h-6" /> Manager Override
        </h1>
        <p className="text-muted-foreground">All overrides are logged in audit trail with manager ID + reason</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {overrideActions.map((oa) => {
          const Icon = oa.icon;
          return (
            <Card key={oa.key} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setAction(oa.key)}>
              <CardContent className="p-4 flex items-start gap-3">
                <Icon className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">{oa.label}</p>
                  <p className="text-xs text-muted-foreground">{oa.desc}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!action} onOpenChange={(o) => !o && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{overrideActions.find(a => a.key === action)?.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.user_id} value={e.user_id}>{e.full_name} — {e.classification}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea placeholder="Reason for override (required)" value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} />
            <Button className="w-full" disabled={!selectedEmployee || !overrideReason} onClick={() => action && performOverride(action)}>
              Apply Override
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClockOverride;
