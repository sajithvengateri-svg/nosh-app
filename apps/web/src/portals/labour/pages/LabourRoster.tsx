import { useState, useMemo, useCallback, useRef } from "react";
import { format, addDays, startOfWeek, subWeeks, addWeeks } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft, ChevronRight, Plus, AlertTriangle,
  LayoutTemplate, Calendar as CalendarIcon,
  Printer, Mail, Archive, Copy, Eye, EyeOff,
  History,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOrg } from "@/contexts/OrgContext";
import {
  useRosters, useRosterShifts, useCreateRoster, useCreateShift,
  useUpdateShift, useDeleteShift, useUpdateRoster,
  useEmployeeProfilesWithNames,
  useAwardRates, usePenaltyRules, usePublicHolidays, useAllowanceRates,
} from "@/lib/shared/queries/labourQueries";
import { calculateShiftPay, assessFatigueRisk } from "@/lib/shared/calculations/labour";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AddShiftDialog from "../components/AddShiftDialog";
import ShiftTile, { getSectionColor } from "../components/ShiftTile";
import RosterTemplatesDrawer from "../components/RosterTemplatesDrawer";
import RosterPrintView from "../components/RosterPrintView";

import {
  DndContext, closestCenter, DragEndEvent,
  PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";

import { useDroppable } from "@dnd-kit/core";

const SECTIONS = ["KITCHEN", "BAR", "FOH", "MANAGEMENT"];
const SECTION_EMOJI: Record<string, string> = { KITCHEN: "🍳", BAR: "🍷", FOH: "🍽", MANAGEMENT: "📊" };
const ROSTER_SECTIONS = ["ALL", ...SECTIONS];

function shiftHours(start: string, end: string, breakMins: number) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) mins += 24 * 60;
  return Math.max(0, (mins - (breakMins || 0)) / 60);
}

function DroppableCell({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <td
      ref={setNodeRef}
      className={`py-1 px-1 align-top min-w-[120px] transition-colors ${isOver ? "bg-primary/10" : ""}`}
    >
      {children}
    </td>
  );
}

const LabourRoster = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  const [rosterSection, setRosterSection] = useState<string>("ALL");

  const [periodType, setPeriodType] = useState<"WEEKLY" | "FORTNIGHTLY">("WEEKLY");
  const periodDays = periodType === "WEEKLY" ? 7 : 14;
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const weekEnd = addDays(weekStart, periodDays - 1);
  const weekDates = useMemo(
    () => Array.from({ length: periodDays }, (_, i) => addDays(weekStart, i)),
    [weekStart, periodDays]
  );

  const periodStart = format(weekStart, "yyyy-MM-dd");
  const periodEnd = format(weekEnd, "yyyy-MM-dd");

  // UI state
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [showCostings, setShowCostings] = useState(true);
  const [showPrintView, setShowPrintView] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Data queries
  const { data: rosters, isLoading: rostersLoading } = useRosters(orgId);
  const { data: employees, isLoading: empsLoading } = useEmployeeProfilesWithNames(orgId);
  const { data: awardRates } = useAwardRates();
  const { data: penaltyRules } = usePenaltyRules();
  const { data: publicHolidays } = usePublicHolidays("QLD");
  const { data: allowanceRates } = useAllowanceRates();

  const sectionFilter = rosterSection === "ALL" ? undefined : rosterSection;

  const activeRoster = useMemo(
    () => rosters?.find(r =>
      r.period_start === periodStart &&
      r.period_end === periodEnd &&
      (r as any).section === (sectionFilter || null)
    ),
    [rosters, periodStart, periodEnd, sectionFilter]
  );

  // Last 4 rosters (non-archived, sorted by date desc)
  const recentRosters = useMemo(() => {
    if (!rosters) return [];
    return rosters
      .filter(r => r.status !== "ARCHIVED")
      .sort((a, b) => b.period_start.localeCompare(a.period_start))
      .slice(0, 4);
  }, [rosters]);

  const { data: shifts } = useRosterShifts(activeRoster?.id);

  // Mutations
  const createRoster = useCreateRoster();
  const createShift = useCreateShift();
  const updateShift = useUpdateShift();
  const deleteShift = useDeleteShift();
  const updateRoster = useUpdateRoster();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDate, setDialogDate] = useState("");
  const [editingShift, setEditingShift] = useState<typeof shifts extends (infer T)[] | undefined ? T | null : null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Ensure roster exists
  const ensureRoster = async () => {
    if (activeRoster) return activeRoster.id;
    if (!orgId) return null;
    try {
      const r = await createRoster.mutateAsync({
        org_id: orgId,
        period_start: periodStart,
        period_end: periodEnd,
        period_type: periodType,
        section: sectionFilter || null,
      });
      return r.id;
    } catch {
      toast.error("Failed to create roster");
      return null;
    }
  };

  // Employee map
  const employeeMap = useMemo(() => {
    const m = new Map<string, typeof employees extends (infer T)[] | undefined ? T : never>();
    employees?.forEach(e => m.set(e.user_id, e as any));
    return m;
  }, [employees]);

  // Group employees by section, filtered by rosterSection
  const employeesBySection = useMemo(() => {
    const grouped: Record<string, typeof employees> = {};
    SECTIONS.forEach(s => { grouped[s] = []; });
    grouped["OTHER"] = [];
    employees?.forEach(emp => {
      const rawTags = emp.section_tags;
      const tags: string[] = Array.isArray(rawTags) ? rawTags.map(t => String(t)) : [];
      const section = SECTIONS.find(s => tags.includes(s)) || "OTHER";
      // If filtering by section, only include matching employees
      if (sectionFilter && section !== sectionFilter) return;
      grouped[section]!.push(emp);
    });
    return grouped;
  }, [employees, sectionFilter]);

  // Shift lookup
  const shiftMap = useMemo(() => {
    const m = new Map<string, NonNullable<typeof shifts>[number][]>();
    shifts?.forEach(s => {
      const key = `${s.user_id}_${s.date}`;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(s);
    });
    return m;
  }, [shifts]);

  // Cost calculations
  const phDates = useMemo(() => (publicHolidays || []).map(h => h.date), [publicHolidays]);

  const shiftCosts = useMemo(() => {
    if (!shifts?.length || !awardRates?.length || !employees?.length) return new Map<string, number>();
    const costs = new Map<string, number>();
    shifts.forEach(s => {
      const emp = employeeMap.get(s.user_id);
      if (!emp) return;
      try {
        const breakdown = calculateShiftPay(
          s as any, emp as any, awardRates as any, (penaltyRules || []) as any,
          phDates, [], [], 0, (allowanceRates || []) as any
        );
        costs.set(s.id, breakdown.total_gross);
      } catch { costs.set(s.id, 0); }
    });
    return costs;
  }, [shifts, awardRates, penaltyRules, phDates, allowanceRates, employeeMap, employees]);

  // Daily totals
  const dailyTotals = useMemo(() => {
    return weekDates.map(d => {
      const dateStr = format(d, "yyyy-MM-dd");
      let hours = 0, cost = 0;
      shifts?.filter(s => s.date === dateStr).forEach(s => {
        hours += shiftHours(s.start_time, s.end_time, s.break_minutes || 0);
        cost += shiftCosts.get(s.id) || 0;
      });
      return { hours: Math.round(hours * 10) / 10, cost: Math.round(cost * 100) / 100 };
    });
  }, [shifts, weekDates, shiftCosts]);

  const totalHours = dailyTotals.reduce((s, d) => s + d.hours, 0);
  const totalCost = dailyTotals.reduce((s, d) => s + d.cost, 0);
  const budget = activeRoster?.labour_budget || 0;
  const budgetStatus = budget === 0 ? "neutral" : totalCost <= budget ? "under" : "over";

  // Fatigue warnings
  const fatigueWarnings = useMemo(() => {
    if (!shifts?.length) return new Map<string, string[]>();
    const byUser = new Map<string, typeof shifts>();
    shifts.forEach(s => {
      if (!byUser.has(s.user_id)) byUser.set(s.user_id, []);
      byUser.get(s.user_id)!.push(s);
    });
    const warnings = new Map<string, string[]>();
    byUser.forEach((userShifts, userId) => {
      const assessment = assessFatigueRisk(userShifts.map(s => ({
        date: s.date, start_time: s.start_time, end_time: s.end_time,
        break_minutes: s.break_minutes || 0,
      })));
      if (assessment.warnings.length) warnings.set(userId, assessment.warnings);
    });
    return warnings;
  }, [shifts]);

  // ===================== ACTIONS =====================

  const handleSaveShift = async (data: {
    user_id: string; date: string; start_time: string; end_time: string;
    break_minutes: number; section: string; shift_type: string; notes: string;
  }) => {
    const rosterId = await ensureRoster();
    if (!rosterId || !orgId) return;
    const hrs = shiftHours(data.start_time, data.end_time, data.break_minutes);

    if (editingShift) {
      updateShift.mutate({
        id: editingShift.id, roster_id: rosterId,
        start_time: data.start_time, end_time: data.end_time,
        break_minutes: data.break_minutes, section: data.section,
        shift_type: data.shift_type, notes: data.notes || null,
        estimated_hours: Math.round(hrs * 100) / 100,
      }, {
        onSuccess: () => toast.success("Shift updated"),
        onError: () => toast.error("Failed to update shift"),
      });
    } else {
      createShift.mutate({
        roster_id: rosterId, org_id: orgId, user_id: data.user_id,
        date: data.date, start_time: data.start_time, end_time: data.end_time,
        break_minutes: data.break_minutes, section: data.section,
        shift_type: data.shift_type, notes: data.notes || undefined,
        estimated_hours: Math.round(hrs * 100) / 100,
      }, {
        onSuccess: () => toast.success("Shift added"),
        onError: () => toast.error("Failed to add shift"),
      });
    }
    setEditingShift(null);
  };

  const handleDeleteShift = (id: string) => {
    if (!activeRoster) return;
    deleteShift.mutate({ id, roster_id: activeRoster.id }, {
      onSuccess: () => toast.success("Shift removed"),
    });
  };

  const openAddShift = (date: string) => {
    setDialogDate(date);
    setEditingShift(null);
    setDialogOpen(true);
  };

  const openEditShift = (shift: NonNullable<typeof shifts>[number]) => {
    setDialogDate(shift.date);
    setEditingShift(shift);
    setDialogOpen(true);
  };

  // Archive roster
  const handleArchive = () => {
    if (!activeRoster) return;
    updateRoster.mutate({ id: activeRoster.id, status: "ARCHIVED" }, {
      onSuccess: () => toast.success("Roster archived"),
      onError: () => toast.error("Failed to archive"),
    });
  };

  // Copy roster from a past period to current
  const handleCopyRoster = async (sourceRosterId: string) => {
    const rosterId = await ensureRoster();
    if (!rosterId || !orgId) return;

    // Fetch source shifts
    const { data: sourceShifts, error } = await supabase
      .from("labour_roster_shifts")
      .select("*")
      .eq("roster_id", sourceRosterId);

    if (error || !sourceShifts?.length) {
      toast.error("No shifts to copy");
      return;
    }

    // Fetch source roster to get period_start
    const sourceRoster = rosters?.find(r => r.id === sourceRosterId);
    if (!sourceRoster) return;

    const sourceStart = new Date(sourceRoster.period_start);

    let copied = 0;
    for (const s of sourceShifts) {
      const shiftDate = new Date(s.date);
      const dayOffset = Math.round((shiftDate.getTime() - sourceStart.getTime()) / (1000 * 60 * 60 * 24));
      const newDate = format(addDays(weekStart, dayOffset), "yyyy-MM-dd");

      // Only copy if within current period
      if (dayOffset >= 0 && dayOffset < periodDays) {
        createShift.mutate({
          roster_id: rosterId, org_id: orgId, user_id: s.user_id,
          date: newDate, start_time: s.start_time, end_time: s.end_time,
          break_minutes: s.break_minutes || 0, section: s.section || undefined,
          shift_type: s.shift_type || "REGULAR",
          estimated_hours: s.estimated_hours || undefined,
        });
        copied++;
      }
    }
    toast.success(`Copied ${copied} shifts to current period`);
  };

  // Print
  const handlePrint = () => {
    setShowPrintView(true);
    setTimeout(() => window.print(), 300);
    setTimeout(() => setShowPrintView(false), 1000);
  };

  // Email roster to staff
  const handleSendEmail = async () => {
    if (!shifts?.length || !employees?.length) {
      toast.error("No shifts to send");
      return;
    }

    setSendingEmail(true);
    try {
      const allShifts = shifts.map(s => {
        const emp = employeeMap.get(s.user_id) as any;
        return {
          employee_name: emp?.full_name || "Unknown",
          employee_email: emp?.email || "",
          date: s.date,
          start_time: s.start_time,
          end_time: s.end_time,
          break_minutes: s.break_minutes || 0,
          section: s.section || "",
        };
      }).filter(s => s.employee_email);

      const uniqueEmails = new Map<string, { email: string; name: string; user_id: string }>();
      allShifts.forEach(s => {
        if (!uniqueEmails.has(s.employee_email)) {
          uniqueEmails.set(s.employee_email, {
            email: s.employee_email,
            name: s.employee_name,
            user_id: "",
          });
        }
      });

      const periodLabel = `${format(weekStart, "EEE d MMM")} — ${format(weekEnd, "EEE d MMM yyyy")}`;

      const { data, error } = await supabase.functions.invoke("send-roster-email", {
        body: {
          org_name: currentOrg?.name || "Kitchen",
          period_label: periodLabel,
          all_shifts: allShifts,
          recipients: Array.from(uniqueEmails.values()),
        },
      });

      if (error) throw error;

      const results = data?.results || [];
      const sent = results.filter((r: any) => r.success).length;
      const failed = results.filter((r: any) => !r.success).length;

      if (failed > 0) {
        toast.warning(`Sent to ${sent} staff, ${failed} failed`);
      } else {
        toast.success(`Roster emailed to ${sent} staff`);
      }
    } catch (err) {
      toast.error("Failed to send emails");
      console.error(err);
    } finally {
      setSendingEmail(false);
    }
  };

  // DnD handler
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !activeRoster) return;

    const shiftId = String(active.id);
    const targetCellId = String(over.id);

    if (!targetCellId.startsWith("cell_")) return;
    const parts = targetCellId.substring(5);
    const lastUnderscore = parts.lastIndexOf("_");
    if (lastUnderscore === -1) return;

    const newDate = parts.substring(lastUnderscore + 1);
    const newUserId = parts.substring(0, lastUnderscore);

    const shift = shifts?.find(s => s.id === shiftId);
    if (!shift) return;
    if (shift.date === newDate && shift.user_id === newUserId) return;

    updateShift.mutate({
      id: shiftId, roster_id: activeRoster.id,
      date: newDate, user_id: newUserId,
    }, {
      onSuccess: () => toast.success("Shift moved"),
      onError: () => toast.error("Failed to move shift"),
    });
  }, [activeRoster, shifts, updateShift]);

  // Apply template
  const handleApplyTemplate = async (templateShifts: unknown[]) => {
    const rosterId = await ensureRoster();
    if (!rosterId || !orgId || !employees?.length) return;

    const shiftArr = templateShifts as Array<{
      day_offset: number; start: string; end: string; break: number;
      section: string; type: string;
    }>;

    for (const ts of shiftArr) {
      const date = format(addDays(weekStart, ts.day_offset), "yyyy-MM-dd");
      const sectionEmps = employees.filter(e => {
        const tags: string[] = Array.isArray(e.section_tags) ? e.section_tags.map(t => String(t)) : [];
        return tags.includes(ts.section);
      });
      const emp = sectionEmps[0];
      if (!emp) continue;

      createShift.mutate({
        roster_id: rosterId, org_id: orgId, user_id: emp.user_id,
        date, start_time: ts.start, end_time: ts.end,
        break_minutes: ts.break || 30, section: ts.section,
        shift_type: ts.type || "REGULAR",
        estimated_hours: shiftHours(ts.start, ts.end, ts.break || 30),
      });
    }
  };

  
  const isLoading = rostersLoading || empsLoading;
  const isArchived = activeRoster?.status === "ARCHIVED";

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  // Print view
  if (showPrintView) {
    return (
      <div ref={printRef}>
        <RosterPrintView
          weekDates={weekDates}
          employees={(employees || []).map(e => ({
            user_id: e.user_id,
            full_name: (e as any).full_name || "Unknown",
            classification: e.classification,
            employment_type: e.employment_type,
            section_tags: Array.isArray(e.section_tags) ? e.section_tags.map(String) : [],
          }))}
          shifts={(shifts || []).map(s => ({
            user_id: s.user_id,
            date: s.date,
            start_time: s.start_time,
            end_time: s.end_time,
            break_minutes: s.break_minutes || 0,
            section: s.section,
            hours: shiftHours(s.start_time, s.end_time, s.break_minutes || 0),
          }))}
          periodLabel={`${format(weekStart, "EEE d MMM")} — ${format(weekEnd, "EEE d MMM yyyy")}`}
          showCostings={false}
          dailyTotals={dailyTotals}
          totalHours={totalHours}
          totalCost={totalCost}
        />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Roster Builder</h1>
          <p className="text-muted-foreground text-sm">
            {format(weekStart, "EEE d MMM")} — {format(weekEnd, "EEE d MMM yyyy")}
            {isArchived && <Badge variant="secondary" className="ml-2 text-[10px]">ARCHIVED</Badge>}
          </p>
        </div>

        {/* Section selector */}
        <div className="flex items-center rounded-lg border border-border overflow-hidden">
          {ROSTER_SECTIONS.map(s => (
            <button
              key={s}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${rosterSection === s ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
              onClick={() => setRosterSection(s)}
            >{s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}</button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Period toggle */}
          <div className="flex items-center rounded-lg border border-border overflow-hidden">
            <button
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${periodType === "WEEKLY" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
              onClick={() => setPeriodType("WEEKLY")}
            >Week</button>
            <button
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${periodType === "FORTNIGHTLY" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
              onClick={() => setPeriodType("FORTNIGHTLY")}
            >Fortnight</button>
          </div>

          <Button variant="outline" size="sm" onClick={() => setTemplatesOpen(true)}>
            <LayoutTemplate className="w-4 h-4 mr-1" /> Templates
          </Button>

          {/* Copy from recent roster */}
          {recentRosters.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <History className="w-4 h-4 mr-1" /> Copy From
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {recentRosters.map(r => (
                  <DropdownMenuItem key={r.id} onClick={() => handleCopyRoster(r.id)}>
                    <Copy className="w-3 h-3 mr-2" />
                    {r.period_start} — {r.period_end}
                    <Badge variant="secondary" className="ml-2 text-[9px]">{r.status}</Badge>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekStart(subWeeks(weekStart, periodType === "WEEKLY" ? 1 : 2))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
              Today
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekStart(addWeeks(weekStart, periodType === "WEEKLY" ? 1 : 2))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Costing toggle */}
        <div className="flex items-center gap-2 mr-auto">
          <Switch
            id="show-costings"
            checked={showCostings}
            onCheckedChange={setShowCostings}
          />
          <Label htmlFor="show-costings" className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
            {showCostings ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Costings
          </Label>
        </div>

        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-1" /> Print
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleSendEmail}
          disabled={sendingEmail || !shifts?.length}
        >
          <Mail className="w-4 h-4 mr-1" /> {sendingEmail ? "Sending..." : "Email Staff"}
        </Button>

        {activeRoster && activeRoster.status !== "ARCHIVED" && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleArchive}
          >
            <Archive className="w-4 h-4 mr-1" /> Archive
          </Button>
        )}
      </div>

      {/* Summary bar */}
      <Card>
        <CardContent className="py-3 flex flex-wrap items-center gap-4 text-sm">
          <Badge variant="secondary" className="text-[10px]">{periodType}</Badge>
          {activeRoster?.status && (
            <Badge variant={activeRoster.status === "PUBLISHED" ? "default" : activeRoster.status === "ARCHIVED" ? "outline" : "secondary"} className="text-[10px]">
              {activeRoster.status}
            </Badge>
          )}
          <div>
            <span className="text-muted-foreground">Hours:</span>{" "}
            <span className="font-semibold text-foreground">{totalHours.toFixed(1)}h</span>
          </div>
          {showCostings && (
            <div>
              <span className="text-muted-foreground">Cost:</span>{" "}
              <span className="font-semibold text-foreground">${totalCost.toFixed(0)}</span>
            </div>
          )}
          {showCostings && budget > 0 && (
            <>
              <div>
                <span className="text-muted-foreground">Budget:</span>{" "}
                <span className="font-semibold text-foreground">${budget.toLocaleString()}</span>
              </div>
              <Badge variant={budgetStatus === "over" ? "destructive" : "default"}>
                {budgetStatus === "over" ? `$${(totalCost - budget).toFixed(0)} over` : "Under budget"}
              </Badge>
            </>
          )}
        </CardContent>
      </Card>

      {/* Fatigue warnings */}
      {fatigueWarnings.size > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="py-3 space-y-1">
            {Array.from(fatigueWarnings.entries()).map(([userId, warnings]) => {
              const emp = employeeMap.get(userId);
              return warnings.map((w, i) => (
                <div key={`${userId}-${i}`} className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                  <span className="text-foreground font-medium">{(emp as any)?.full_name || "Staff"}:</span>
                  <span className="text-muted-foreground">{w}</span>
                </div>
              ));
            })}
          </CardContent>
        </Card>
      )}

      {/* Roster grid with DnD */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: periodDays * 130 + 160 }}>
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground w-40 sticky left-0 bg-card z-10">Staff</th>
                    {weekDates.map(d => {
                      const dateStr = format(d, "yyyy-MM-dd");
                      const isPH = phDates.includes(dateStr);
                      return (
                        <th key={dateStr} className={`text-center py-2 px-1 font-medium min-w-[120px] ${isPH ? "text-destructive" : "text-muted-foreground"}`}>
                          <div className="text-xs">{format(d, "EEE")}</div>
                          <div className="text-[11px]">{format(d, "d MMM")}</div>
                          {isPH && <div className="text-[9px] text-destructive">PH</div>}
                        </th>
                      );
                    })}
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground w-16">Hrs</th>
                  </tr>
                </thead>

                {(employees?.length ? [...SECTIONS, "OTHER"] : []).map(section => {
                  const sectionEmps = employeesBySection[section];
                  if (!sectionEmps?.length) return null;
                  const colors = getSectionColor(section);

                  return (
                    <tbody key={section}>
                      <tr className={`${colors.bg}`}>
                        <td colSpan={periodDays + 2} className={`py-1.5 px-3 font-semibold text-xs uppercase tracking-wider sticky left-0 z-10 ${colors.text} ${colors.bg}`}>
                          {SECTION_EMOJI[section] || "📋"} {section}
                        </td>
                      </tr>
                      {sectionEmps.map(emp => {
                        const weekHours = weekDates.reduce((sum, d) => {
                          const cellShifts = shiftMap.get(`${emp.user_id}_${format(d, "yyyy-MM-dd")}`) || [];
                          return sum + cellShifts.reduce((s2, sh) => s2 + shiftHours(sh.start_time, sh.end_time, sh.break_minutes || 0), 0);
                        }, 0);
                        const hasFatigueWarning = fatigueWarnings.has(emp.user_id);

                        return (
                          <tr key={emp.user_id} className="border-b border-border/50 hover:bg-muted/20">
                            <td className="py-1.5 px-3 sticky left-0 bg-card z-10">
                              <div className="flex items-center gap-2">
                                {hasFatigueWarning && <AlertTriangle className="w-3 h-3 text-warning shrink-0" />}
                                <div>
                                  <div className="font-medium text-foreground text-xs">{(emp as any).full_name}</div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {emp.classification} · {emp.employment_type === "CASUAL" ? "Cas" : emp.employment_type === "PART_TIME" ? "PT" : "FT"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            {weekDates.map(d => {
                              const dateStr = format(d, "yyyy-MM-dd");
                              const cellId = `cell_${emp.user_id}_${dateStr}`;
                              const cellShifts = shiftMap.get(`${emp.user_id}_${dateStr}`) || [];

                              return (
                                <DroppableCell key={dateStr} id={cellId}>
                                  <div className="space-y-1 min-h-[48px]">
                                    {cellShifts.map(shift => {
                                      const cost = shiftCosts.get(shift.id) || 0;
                                      const hrs = shiftHours(shift.start_time, shift.end_time, shift.break_minutes || 0);
                                      return (
                                        <ShiftTile
                                          key={shift.id}
                                          id={shift.id}
                                          employeeName={(employeeMap.get(shift.user_id) as any)?.full_name || "?"}
                                          startTime={shift.start_time}
                                          endTime={shift.end_time}
                                          breakMinutes={shift.break_minutes || 0}
                                          section={shift.section}
                                          cost={showCostings ? cost : 0}
                                          hours={hrs}
                                          onClick={() => !isArchived && openEditShift(shift)}
                                        />
                                      );
                                    })}
                                    {!isArchived && (
                                      <button
                                        onClick={() => openAddShift(dateStr)}
                                        className="w-full min-h-[32px] rounded-md border border-dashed border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-colors flex items-center justify-center cursor-pointer"
                                      >
                                        <Plus className="w-3 h-3 text-muted-foreground/40" />
                                      </button>
                                    )}
                                  </div>
                                </DroppableCell>
                              );
                            })}
                            <td className="text-center py-1.5 px-2 font-medium text-foreground text-xs align-top pt-3">
                              {weekHours > 0 ? weekHours.toFixed(1) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  );
                })}

                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/30 font-medium">
                    <td className="py-2 px-3 text-xs text-muted-foreground sticky left-0 bg-muted/30 z-10">TOTALS</td>
                    {dailyTotals.map((dt, i) => (
                      <td key={i} className="text-center py-2 px-1">
                        <div className="text-xs text-foreground">{dt.hours > 0 ? `${dt.hours}h` : "—"}</div>
                        {showCostings && dt.cost > 0 && <div className="text-[10px] text-primary font-semibold">${dt.cost.toFixed(0)}</div>}
                      </td>
                    ))}
                    <td className="text-center py-2 px-2 text-xs text-foreground">{totalHours.toFixed(1)}</td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>
      </DndContext>

      {!employees?.length && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No employees onboarded yet. Add employees first to build rosters.
          </CardContent>
        </Card>
      )}

      <AddShiftDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employees={(employees || []).map(e => ({
          id: e.id, user_id: e.user_id,
          full_name: (e as any).full_name || "Unknown",
          classification: e.classification,
          section_tags: Array.isArray(e.section_tags) ? e.section_tags.map(t => String(t)) : [],
        }))}
        date={dialogDate}
        onSave={handleSaveShift}
        editShift={editingShift}
        onDelete={handleDeleteShift}
      />

      {orgId && (
        <RosterTemplatesDrawer
          open={templatesOpen}
          onOpenChange={setTemplatesOpen}
          orgId={orgId}
          currentShifts={(shifts || []).map(s => ({
            user_id: s.user_id, date: s.date,
            start_time: s.start_time, end_time: s.end_time,
            break_minutes: s.break_minutes || 0, section: s.section,
            shift_type: s.shift_type || "REGULAR",
          }))}
          weekStart={periodStart}
          onApplyTemplate={handleApplyTemplate}
        />
      )}
    </div>
  );
};

export default LabourRoster;
