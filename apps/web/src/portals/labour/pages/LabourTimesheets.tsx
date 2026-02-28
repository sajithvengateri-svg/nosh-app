import { useState, useMemo } from "react";
import { format, subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Clock, AlertTriangle, Search } from "lucide-react";
import { useOrg } from "@/contexts/OrgContext";
import { useClockEvents, useEmployeeProfilesWithNames } from "@/lib/shared/queries/labourQueries";
import { Skeleton } from "@/components/ui/skeleton";

type ClockEvent = {
  id: string;
  user_id: string;
  event_type: string;
  event_time: string;
  shift_date: string;
  geofence_result: string | null;
  device_type: string | null;
  notes: string | null;
  role_change_from: string | null;
  role_change_to: string | null;
};

interface TimesheetRow {
  userId: string;
  name: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  breakMinutes: number;
  totalHours: number;
  geofence: string | null;
  device: string | null;
  roleChanges: { from: string; to: string; time: string }[];
  missedBreak: boolean;
  status: "pending" | "approved" | "flagged";
}

function buildTimesheets(events: ClockEvent[], nameMap: Map<string, string>): TimesheetRow[] {
  const byUserDate = new Map<string, ClockEvent[]>();
  events.forEach(e => {
    const key = `${e.user_id}_${e.shift_date}`;
    if (!byUserDate.has(key)) byUserDate.set(key, []);
    byUserDate.get(key)!.push(e);
  });

  const rows: TimesheetRow[] = [];
  byUserDate.forEach((evts, key) => {
    const [userId] = key.split("_");
    const sorted = evts.sort((a, b) => a.event_time.localeCompare(b.event_time));
    const clockIn = sorted.find(e => e.event_type === "CLOCK_IN");
    const clockOut = sorted.find(e => e.event_type === "CLOCK_OUT");
    const breakStart = sorted.find(e => e.event_type === "BREAK_START");
    const breakEnd = sorted.find(e => e.event_type === "BREAK_END");
    const roleChanges = sorted
      .filter(e => e.event_type === "ROLE_CHANGE")
      .map(e => ({ from: e.role_change_from || "?", to: e.role_change_to || "?", time: e.event_time }));

    let breakMinutes = 0;
    if (breakStart && breakEnd) {
      breakMinutes = Math.round((new Date(breakEnd.event_time).getTime() - new Date(breakStart.event_time).getTime()) / 60000);
    }

    let totalHours = 0;
    if (clockIn && clockOut) {
      totalHours = Math.max(0, (new Date(clockOut.event_time).getTime() - new Date(clockIn.event_time).getTime()) / 3600000 - breakMinutes / 60);
    }

    const shiftOver6 = totalHours > 5;
    const missedBreak = shiftOver6 && breakMinutes === 0;

    rows.push({
      userId,
      name: nameMap.get(userId) || "Unknown",
      date: sorted[0].shift_date,
      clockIn: clockIn?.event_time ?? null,
      clockOut: clockOut?.event_time ?? null,
      breakStart: breakStart?.event_time ?? null,
      breakEnd: breakEnd?.event_time ?? null,
      breakMinutes,
      totalHours: Math.round(totalHours * 100) / 100,
      geofence: clockIn?.geofence_result ?? null,
      device: clockIn?.device_type ?? null,
      roleChanges,
      missedBreak,
      status: missedBreak ? "flagged" : clockIn && clockOut ? "pending" : "flagged",
    });
  });

  return rows.sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name));
}

const LabourTimesheets = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  const today = format(new Date(), "yyyy-MM-dd");
  const { data: events, isLoading: eventsLoading } = useClockEvents(orgId);
  const { data: employees, isLoading: empsLoading } = useEmployeeProfilesWithNames(orgId);

  const nameMap = useMemo(() => {
    const m = new Map<string, string>();
    employees?.forEach(e => m.set(e.user_id, e.full_name));
    return m;
  }, [employees]);

  const timesheets = useMemo(() => {
    if (!events?.length) return [];
    return buildTimesheets(events as ClockEvent[], nameMap);
  }, [events, nameMap]);

  const filtered = useMemo(() => {
    let rows = timesheets;
    if (tab === "flagged") rows = rows.filter(r => r.status === "flagged");
    if (tab === "approved") rows = rows.filter(r => r.status === "approved");
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r => r.name.toLowerCase().includes(q) || r.date.includes(q));
    }
    return rows;
  }, [timesheets, tab, search]);

  const isLoading = eventsLoading || empsLoading;

  if (isLoading) {
    return <div className="p-4 lg:p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-[300px] w-full" /></div>;
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Timesheets</h1>
          <p className="text-muted-foreground text-sm">Review clock events, breaks, and approve timesheets.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search staff or date..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All ({timesheets.length})</TabsTrigger>
          <TabsTrigger value="flagged">
            Flagged ({timesheets.filter(r => r.status === "flagged").length})
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {events?.length ? "No timesheets match filters." : "No clock events recorded yet. Timesheets appear when staff clock in."}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Clock Out</TableHead>
                      <TableHead>Break</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Flags</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((row, i) => (
                      <TableRow key={`${row.userId}-${row.date}-${i}`}>
                        <TableCell className="font-medium text-foreground">{row.name}</TableCell>
                        <TableCell className="text-muted-foreground">{row.date}</TableCell>
                        <TableCell>{row.clockIn ? format(new Date(row.clockIn), "HH:mm") : "—"}</TableCell>
                        <TableCell>{row.clockOut ? format(new Date(row.clockOut), "HH:mm") : <Badge variant="secondary">Active</Badge>}</TableCell>
                        <TableCell>{row.breakMinutes > 0 ? `${row.breakMinutes}m` : "—"}</TableCell>
                        <TableCell className="font-medium">{row.totalHours > 0 ? `${row.totalHours.toFixed(1)}h` : "—"}</TableCell>
                        <TableCell>
                          {row.geofence === "ON_SITE" && <Badge variant="default" className="text-xs">On-site</Badge>}
                          {row.geofence === "REMOTE" && <Badge variant="secondary" className="text-xs">Remote</Badge>}
                          {!row.geofence && <span className="text-muted-foreground text-xs">—</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {row.missedBreak && (
                              <Badge variant="destructive" className="text-xs gap-1">
                                <AlertTriangle className="w-3 h-3" /> No break
                              </Badge>
                            )}
                            {!row.clockOut && row.clockIn && (
                              <Badge variant="secondary" className="text-xs gap-1">
                                <Clock className="w-3 h-3" /> Open
                              </Badge>
                            )}
                            {row.roleChanges.length > 0 && (
                              <Badge variant="secondary" className="text-xs">Higher duties</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Approve">
                              <Check className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Dispute">
                              <X className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LabourTimesheets;
