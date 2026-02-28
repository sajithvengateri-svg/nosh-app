import { useEffect, useState } from "react";
import { format, differenceInMinutes } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { Users, Clock, AlertTriangle, Coffee } from "lucide-react";

interface ActiveStaff {
  user_id: string;
  full_name: string;
  classification: string;
  clock_in: string;
  section: string | null;
  onBreak: boolean;
  breakSince: string | null;
}

const ClockDashboard = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const [activeStaff, setActiveStaff] = useState<ActiveStaff[]>([]);
  const [todayStats, setTodayStats] = useState({ events: 0, lateArrivals: 0, remote: 0, rosteredHours: 0, actualHours: 0 });
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    if (!orgId) return;
    const load = async () => {
      const today = format(new Date(), "yyyy-MM-dd");

      // Active shifts
      const { data: shifts } = await supabase
        .from("clock_shifts")
        .select("user_id, clock_in, section, break_minutes")
        .eq("org_id", orgId)
        .eq("status", "ACTIVE");

      if (shifts && shifts.length > 0) {
        const userIds = shifts.map((s: any) => s.user_id);
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
        const { data: empProfiles } = await supabase.from("employee_profiles").select("user_id, classification").in("user_id", userIds);

        // Check break status
        const staffList: ActiveStaff[] = [];
        const alertList: string[] = [];

        for (const shift of shifts) {
          const prof = profiles?.find((p: any) => p.user_id === shift.user_id);
          const emp = empProfiles?.find((e: any) => e.user_id === shift.user_id);

          const { data: lastEvent } = await supabase
            .from("clock_events")
            .select("event_type, event_time")
            .eq("user_id", shift.user_id)
            .eq("shift_date", today)
            .order("event_time", { ascending: false })
            .limit(1)
            .maybeSingle();

          const onBreak = lastEvent?.event_type === "BREAK_START";
          const hoursWorked = differenceInMinutes(new Date(), new Date(shift.clock_in)) / 60;

          if (onBreak && lastEvent) {
            const breakMins = differenceInMinutes(new Date(), new Date(lastEvent.event_time));
            if (breakMins > 30) alertList.push(`${prof?.full_name} has been on break for ${breakMins} minutes (max 30)`);
          }

          if (hoursWorked >= 5 && !onBreak) {
            // Check if they've had a break
            const { count } = await supabase
              .from("clock_events")
              .select("*", { count: "exact", head: true })
              .eq("user_id", shift.user_id)
              .eq("shift_date", today)
              .eq("event_type", "BREAK_START");
            if ((count || 0) === 0) alertList.push(`${prof?.full_name} hasn't taken a meal break (${Math.floor(hoursWorked)}h+ shift)`);
          }

          staffList.push({
            user_id: shift.user_id,
            full_name: prof?.full_name || "Unknown",
            classification: emp?.classification || "",
            clock_in: shift.clock_in,
            section: shift.section,
            onBreak,
            breakSince: onBreak ? lastEvent?.event_time : null,
          });
        }

        setActiveStaff(staffList);
        setAlerts(alertList);
      } else {
        setActiveStaff([]);
      }

      // Today's stats
      const { count: eventCount } = await supabase
        .from("clock_events")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId)
        .eq("shift_date", today);

      const { count: lateCount } = await supabase
        .from("clock_events")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId)
        .eq("shift_date", today)
        .eq("event_type", "CLOCK_IN")
        .gt("late_minutes", 0);

      const { count: remoteCount } = await supabase
        .from("clock_events")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId)
        .eq("shift_date", today)
        .eq("location_type", "REMOTE");

      setTodayStats({
        events: eventCount || 0,
        lateArrivals: lateCount || 0,
        remote: remoteCount || 0,
        rosteredHours: 0,
        actualHours: activeStaff.reduce((sum, s) => sum + differenceInMinutes(new Date(), new Date(s.clock_in)) / 60, 0),
      });
    };

    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [orgId]);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">ClockOS Dashboard — Live</h1>
        <p className="text-muted-foreground">{format(new Date(), "EEEE d MMMM yyyy")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center">
          <Users className="w-5 h-5 mx-auto text-primary mb-1" />
          <p className="text-2xl font-bold text-foreground">{activeStaff.filter(s => !s.onBreak).length}</p>
          <p className="text-xs text-muted-foreground">On Site</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Coffee className="w-5 h-5 mx-auto text-accent mb-1" />
          <p className="text-2xl font-bold text-foreground">{activeStaff.filter(s => s.onBreak).length}</p>
          <p className="text-xs text-muted-foreground">On Break</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Clock className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
          <p className="text-2xl font-bold text-foreground">{todayStats.events}</p>
          <p className="text-xs text-muted-foreground">Clock Events</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <AlertTriangle className="w-5 h-5 mx-auto text-destructive mb-1" />
          <p className="text-2xl font-bold text-foreground">{todayStats.lateArrivals}</p>
          <p className="text-xs text-muted-foreground">Late Arrivals</p>
        </CardContent></Card>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" /> Alerts</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {alerts.map((a, i) => (
              <p key={i} className="text-sm text-destructive">• {a}</p>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active Staff */}
      <Card>
        <CardHeader><CardTitle>Who's Working Now</CardTitle></CardHeader>
        <CardContent>
          {activeStaff.length === 0 ? (
            <p className="text-sm text-muted-foreground">No staff currently clocked in.</p>
          ) : (
            <div className="space-y-2">
              {activeStaff.map((s) => {
                const mins = differenceInMinutes(new Date(), new Date(s.clock_in));
                const hours = Math.floor(mins / 60);
                const remainMins = mins % 60;
                return (
                  <div key={s.user_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${s.onBreak ? "bg-yellow-500" : "bg-green-500"}`} />
                      <div>
                        <p className="font-medium text-foreground">{s.full_name}</p>
                        <p className="text-xs text-muted-foreground">{s.classification}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-foreground">since {format(new Date(s.clock_in), "h:mm a")}</p>
                      <p className="text-xs text-muted-foreground">{hours}h {remainMins}m</p>
                      {s.onBreak && <Badge variant="outline" className="text-xs mt-1">On Break</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClockDashboard;
