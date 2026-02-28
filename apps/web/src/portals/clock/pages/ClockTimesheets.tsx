import { useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

interface ShiftRecord {
  id: string;
  user_id: string;
  full_name: string;
  shift_date: string;
  clock_in: string;
  clock_out: string | null;
  total_hours: number | null;
  break_minutes: number;
  paid_hours: number | null;
  status: string;
}

const ClockTimesheets = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [dateRange] = useState({ from: subDays(new Date(), 7), to: new Date() });

  useEffect(() => {
    if (!orgId) return;
    const load = async () => {
      const { data } = await supabase
        .from("clock_shifts")
        .select("*")
        .eq("org_id", orgId)
        .gte("shift_date", format(dateRange.from, "yyyy-MM-dd"))
        .lte("shift_date", format(dateRange.to, "yyyy-MM-dd"))
        .order("shift_date", { ascending: false });

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((s: any) => s.user_id))];
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);

        setShifts(data.map((s: any) => ({
          ...s,
          full_name: profiles?.find((p: any) => p.user_id === s.user_id)?.full_name || "Unknown",
        })));
      } else {
        setShifts([]);
      }
    };
    load();
  }, [orgId, dateRange]);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Timesheet Review</h1>
        <p className="text-muted-foreground">Review clock events and approve shifts for payroll</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-4 h-4" /> Last 7 Days</CardTitle></CardHeader>
        <CardContent>
          {shifts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No clock shifts recorded.</p>
          ) : (
            <div className="space-y-2">
              {shifts.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground">{s.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(s.shift_date), "EEE d MMM")} · {format(new Date(s.clock_in), "h:mm a")}
                      {s.clock_out ? ` — ${format(new Date(s.clock_out), "h:mm a")}` : " — still active"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{s.total_hours?.toFixed(1) || "—"}h</p>
                      {s.break_minutes > 0 && <p className="text-xs text-muted-foreground">{s.break_minutes}m break</p>}
                    </div>
                    <Badge variant={s.status === "COMPLETED" ? "default" : s.status === "ACTIVE" ? "secondary" : "outline"}>
                      {s.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClockTimesheets;
