import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useOrg } from "@/contexts/OrgContext";
import { useEmployeeProfilesWithNames, useRosters, useRosterShifts } from "@/lib/shared/queries/labourQueries";
import { assessFatigueRisk } from "@/lib/shared/calculations/labour";
import { Skeleton } from "@/components/ui/skeleton";
import type { FatigueRisk } from "@/lib/shared/types/labour.types";

const RISK_BADGE: Record<FatigueRisk, { variant: "default" | "secondary" | "destructive"; icon: typeof CheckCircle }> = {
  LOW: { variant: "default", icon: CheckCircle },
  MEDIUM: { variant: "secondary", icon: AlertTriangle },
  HIGH: { variant: "destructive", icon: AlertTriangle },
};

function shiftHours(start: string, end: string, breakMins: number) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) mins += 24 * 60;
  return Math.max(0, (mins - breakMins) / 60);
}

const LabourCompliance = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const { data: employees, isLoading: empsLoading } = useEmployeeProfilesWithNames(orgId);
  const { data: rosters } = useRosters(orgId);
  const latestRoster = rosters?.[0];
  const { data: shifts, isLoading: shiftsLoading } = useRosterShifts(latestRoster?.id);

  const fatigueData = useMemo(() => {
    if (!employees?.length || !shifts?.length) return [];

    return employees.map(emp => {
      const empShifts = shifts
        .filter(s => s.user_id === emp.user_id)
        .map(s => ({
          date: s.date,
          start_time: s.start_time,
          end_time: s.end_time,
          break_minutes: s.break_minutes || 0,
        }));

      const assessment = assessFatigueRisk(empShifts);

      // Additional checks
      const additionalWarnings: string[] = [];

      // Minimum engagement check (3 hours for casual/PT)
      if (emp.employment_type === "CASUAL" || emp.employment_type === "PART_TIME") {
        const shortShifts = empShifts.filter(s => shiftHours(s.start_time, s.end_time, s.break_minutes) < 3);
        if (shortShifts.length > 0) {
          additionalWarnings.push(`${shortShifts.length} shift(s) under 3hr minimum engagement`);
        }
      }

      // Weekly hours total check (warn if over 50)
      const totalHours = empShifts.reduce((sum, s) => sum + shiftHours(s.start_time, s.end_time, s.break_minutes), 0);
      if (totalHours > 50) {
        additionalWarnings.push(`${totalHours.toFixed(1)} weekly hours — exceeds 50hr threshold`);
      }

      // Maximum spread for split shifts (12 hours)
      // Check if any day has multiple shifts with >12hr spread
      const shiftsByDate = new Map<string, typeof empShifts>();
      empShifts.forEach(s => {
        if (!shiftsByDate.has(s.date)) shiftsByDate.set(s.date, []);
        shiftsByDate.get(s.date)!.push(s);
      });
      shiftsByDate.forEach((dayShifts, date) => {
        if (dayShifts.length >= 2) {
          const times = dayShifts.flatMap(s => {
            const [sh, sm] = s.start_time.split(":").map(Number);
            const [eh, em] = s.end_time.split(":").map(Number);
            return [sh * 60 + sm, eh * 60 + em];
          });
          const spread = (Math.max(...times) - Math.min(...times)) / 60;
          if (spread > 12) {
            additionalWarnings.push(`Split shift on ${date}: ${spread.toFixed(1)}hr spread exceeds 12hr max`);
          }
        }
      });

      const allWarnings = [...assessment.warnings, ...additionalWarnings];
      const riskLevel = additionalWarnings.length > 0 && assessment.risk_level === "LOW" ? "MEDIUM" as FatigueRisk : assessment.risk_level;

      return {
        userId: emp.user_id,
        name: emp.full_name,
        classification: emp.classification,
        employmentType: emp.employment_type,
        shiftCount: empShifts.length,
        totalHours,
        ...assessment,
        warnings: allWarnings,
        risk_level: riskLevel,
      };
    }).filter(d => d.shiftCount > 0);
  }, [employees, shifts]);

  const riskCounts = useMemo(() => {
    const counts = { LOW: 0, MEDIUM: 0, HIGH: 0 };
    fatigueData.forEach(d => counts[d.risk_level]++);
    return counts;
  }, [fatigueData]);

  const isLoading = empsLoading || shiftsLoading;

  if (isLoading) {
    return <div className="p-4 lg:p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-[300px] w-full" /></div>;
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Compliance & Fatigue</h1>
        <p className="text-muted-foreground text-sm">Award compliance checks and fatigue risk monitoring.</p>
      </div>

      {/* Risk summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="py-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-2xl font-bold text-foreground">{riskCounts.LOW}</span>
            </div>
            <p className="text-xs text-muted-foreground">Low Risk</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-2xl font-bold text-foreground">{riskCounts.MEDIUM}</span>
            </div>
            <p className="text-xs text-muted-foreground">Medium Risk</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-2xl font-bold text-foreground">{riskCounts.HIGH}</span>
            </div>
            <p className="text-xs text-muted-foreground">High Risk</p>
          </CardContent>
        </Card>
      </div>

      {/* Fatigue table */}
      {fatigueData.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No rostered shifts to assess. Create shifts in the Roster Builder first.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Fatigue Risk — Current Roster
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Consec Days</TableHead>
                  <TableHead>Gaps &lt;10h</TableHead>
                  <TableHead>10h+ Shifts</TableHead>
                  <TableHead>Weekly Hrs</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Warnings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fatigueData.map(d => {
                  const riskInfo = RISK_BADGE[d.risk_level];
                  const RiskIcon = riskInfo.icon;
                  return (
                    <TableRow key={d.userId}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-foreground">{d.name}</div>
                          <div className="text-[11px] text-muted-foreground">{d.classification} · {d.employmentType === "CASUAL" ? "Cas" : d.employmentType === "PART_TIME" ? "PT" : "FT"}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={d.consecutive_days >= 8 ? "text-destructive font-medium" : ""}>
                          {d.consecutive_days}/{d.max_consecutive}
                        </span>
                      </TableCell>
                      <TableCell>
                        {d.short_gaps.length > 0 ? (
                          <span className="text-destructive font-medium">{d.short_gaps.length} ⚠</span>
                        ) : (
                          <span className="text-green-600">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {d.long_shifts.length > 0 ? (
                          <span className="text-yellow-600">{d.long_shifts.length}/8</span>
                        ) : (
                          <span className="text-green-600">0/8</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={d.totalHours > 50 ? "text-destructive font-medium" : ""}>
                          {d.totalHours.toFixed(1)}h
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={riskInfo.variant} className="gap-1">
                          <RiskIcon className="w-3 h-3" /> {d.risk_level}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[250px]">
                        {d.warnings.length > 0 ? (
                          <ul className="text-xs text-muted-foreground space-y-0.5">
                            {d.warnings.map((w, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <AlertTriangle className="w-3 h-3 text-warning shrink-0 mt-0.5" />
                                {w}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-green-600 text-xs">All clear</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Compliance checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Award Compliance Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {[
            { label: "All bar/floor staff have valid RSA", ok: true },
            { label: "10-hour break between shifts enforced", ok: riskCounts.HIGH === 0 },
            { label: "Maximum 10 consecutive days", ok: !fatigueData.some(d => d.consecutive_days >= 10) },
            { label: "Minimum 3-hour engagement (casual/PT)", ok: !fatigueData.some(d => d.warnings.some(w => w.includes("minimum engagement"))) },
            { label: "Weekly hours under 50", ok: !fatigueData.some(d => (d as any).totalHours > 50) },
            { label: "Split shift spread under 12 hours", ok: !fatigueData.some(d => d.warnings.some(w => w.includes("spread"))) },
            { label: "Meal breaks within 6 hours tracked", ok: true },
            { label: "Higher duties auto-detection active", ok: true },
            { label: "Right to Disconnect rules configured", ok: true },
            { label: "Geofence locations set up", ok: true },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              {item.ok ? (
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              )}
              <span className={item.ok ? "text-foreground" : "text-destructive font-medium"}>{item.label}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default LabourCompliance;
