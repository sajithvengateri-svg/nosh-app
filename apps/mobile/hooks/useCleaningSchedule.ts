import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useOrg } from "../contexts/OrgProvider";
import { useAuth } from "../contexts/AuthProvider";

// ── Types ────────────────────────────────────────────────────────────
export type Shift = "opening" | "midday" | "closing";

export interface CleaningTask {
  id: string;
  org_id: string;
  task_name: string;
  area: string;
  frequency: string; // "daily" | "weekly" | "monthly"
  method: string | null;
  sanitiser_required: boolean;
  responsible_role: string;
  is_active: boolean;
  shift: Shift;
  scheduled_time: string | null;
  sort_order: number;
  auto_tick_source: string | null;
  weekly_day: string | null; // "monday" | "tuesday" | ... | "sunday"
}

export interface CleaningCompletion {
  id: string;
  schedule_id: string;
  org_id: string;
  completed_by: string;
  completed_at: string;
  sanitiser_concentration_ppm: number | null;
  photo_url: string | null;
  notes: string | null;
  signed_off_by: string | null;
  signed_off_at: string | null;
  is_auto: boolean;
}

// ── Default tasks seed ──────────────────────────────────────────────
export const DEFAULT_CLEANING_TASKS: Omit<CleaningTask, "id" | "org_id">[] = [
  // Opening — 08:30
  { task_name: "Clean back area", area: "Kitchen", frequency: "daily", method: "Sweep, mop with sanitiser", sanitiser_required: true, responsible_role: "any", is_active: true, shift: "opening", scheduled_time: "08:30", sort_order: 1, auto_tick_source: null, weekly_day: null },
  { task_name: "Dispose used cooking oil", area: "Kitchen", frequency: "daily", method: "Drain into waste oil container", sanitiser_required: false, responsible_role: "any", is_active: true, shift: "opening", scheduled_time: "08:30", sort_order: 2, auto_tick_source: null, weekly_day: null },
  { task_name: "Mop kitchen", area: "Floors", frequency: "daily", method: "Sweep then mop with floor cleaner", sanitiser_required: false, responsible_role: "any", is_active: true, shift: "opening", scheduled_time: "08:30", sort_order: 3, auto_tick_source: null, weekly_day: null },
  { task_name: "Clean down dishwashing area", area: "Dish Pit", frequency: "daily", method: "Scrub benches, rinse machine", sanitiser_required: true, responsible_role: "any", is_active: true, shift: "opening", scheduled_time: "08:30", sort_order: 4, auto_tick_source: null, weekly_day: null },
  { task_name: "Mop cold room", area: "Cool Room", frequency: "daily", method: "Sweep, mop with sanitiser", sanitiser_required: true, responsible_role: "any", is_active: true, shift: "opening", scheduled_time: "08:30", sort_order: 5, auto_tick_source: null, weekly_day: null },
  { task_name: "Restaurant dining room cleaning", area: "FOH", frequency: "daily", method: "Vacuum, wipe tables, clean windows", sanitiser_required: false, responsible_role: "foh", is_active: true, shift: "opening", scheduled_time: "08:00", sort_order: 6, auto_tick_source: null, weekly_day: null },

  // Midday — 11:30 / 15:30
  { task_name: "Wash/sanitise bench tops", area: "Kitchen", frequency: "daily", method: "Spray and wipe with sanitiser", sanitiser_required: true, responsible_role: "any", is_active: true, shift: "midday", scheduled_time: "11:30", sort_order: 10, auto_tick_source: null, weekly_day: null },
  { task_name: "Sweep/mop kitchen", area: "Floors", frequency: "daily", method: "Sweep then mop", sanitiser_required: false, responsible_role: "any", is_active: true, shift: "midday", scheduled_time: "11:30", sort_order: 11, auto_tick_source: null, weekly_day: null },
  { task_name: "Clean down dishwashing area (PM)", area: "Dish Pit", frequency: "daily", method: "Scrub benches, clear filters", sanitiser_required: true, responsible_role: "any", is_active: true, shift: "midday", scheduled_time: "15:30", sort_order: 12, auto_tick_source: null, weekly_day: null },
  { task_name: "Clean back area (PM)", area: "Kitchen", frequency: "daily", method: "Sweep and mop", sanitiser_required: false, responsible_role: "any", is_active: true, shift: "midday", scheduled_time: "15:30", sort_order: 13, auto_tick_source: null, weekly_day: null },
  { task_name: "Sweep/mop cold room (PM)", area: "Cool Room", frequency: "daily", method: "Sweep and mop with sanitiser", sanitiser_required: true, responsible_role: "any", is_active: true, shift: "midday", scheduled_time: "15:30", sort_order: 14, auto_tick_source: null, weekly_day: null },
  { task_name: "Dispose garbage/change bin liners", area: "Bins", frequency: "daily", method: "Empty bins, replace liners, clean bin if needed", sanitiser_required: false, responsible_role: "any", is_active: true, shift: "midday", scheduled_time: "15:30", sort_order: 15, auto_tick_source: null, weekly_day: null },

  // Closing — 21:30
  { task_name: "Sweep/mop kitchen (close)", area: "Floors", frequency: "daily", method: "Sweep, scrub, mop", sanitiser_required: false, responsible_role: "any", is_active: true, shift: "closing", scheduled_time: "21:30", sort_order: 20, auto_tick_source: null, weekly_day: null },
  { task_name: "Clean down dishwashing area (close)", area: "Dish Pit", frequency: "daily", method: "Deep clean machine, scrub benches", sanitiser_required: true, responsible_role: "any", is_active: true, shift: "closing", scheduled_time: "21:30", sort_order: 21, auto_tick_source: null, weekly_day: null },
  { task_name: "Wash/sanitise bench tops (close)", area: "Kitchen", frequency: "daily", method: "Spray, wipe, sanitise all surfaces", sanitiser_required: true, responsible_role: "any", is_active: true, shift: "closing", scheduled_time: "21:30", sort_order: 22, auto_tick_source: null, weekly_day: null },
  { task_name: "Clean down fridges/benchtops/sanitise", area: "Cool Room", frequency: "daily", method: "Wipe shelves, check spillages, sanitise handles", sanitiser_required: true, responsible_role: "any", is_active: true, shift: "closing", scheduled_time: "21:30", sort_order: 23, auto_tick_source: "temp_check", weekly_day: null },
  { task_name: "Clean grills", area: "Equipment", frequency: "daily", method: "Scrub grill plates, degrease", sanitiser_required: false, responsible_role: "chef", is_active: true, shift: "closing", scheduled_time: "21:30", sort_order: 24, auto_tick_source: null, weekly_day: null },
  { task_name: "Wash walls/tiles", area: "Kitchen", frequency: "daily", method: "Spray and wipe down all wall tiles", sanitiser_required: false, responsible_role: "any", is_active: true, shift: "closing", scheduled_time: "21:30", sort_order: 25, auto_tick_source: null, weekly_day: null },
  { task_name: "Sweep/scrub/mop kitchen floor (close)", area: "Floors", frequency: "daily", method: "Full floor scrub", sanitiser_required: false, responsible_role: "any", is_active: true, shift: "closing", scheduled_time: "21:30", sort_order: 26, auto_tick_source: null, weekly_day: null },
  { task_name: "Sweep/scrub/mop receiving/back area", area: "Kitchen", frequency: "daily", method: "Sweep and scrub receiving dock", sanitiser_required: false, responsible_role: "any", is_active: true, shift: "closing", scheduled_time: "21:30", sort_order: 27, auto_tick_source: "receiving_log", weekly_day: null },
  { task_name: "Sweep/scrub/mop cold room (close)", area: "Cool Room", frequency: "daily", method: "Full cold room floor clean", sanitiser_required: true, responsible_role: "any", is_active: true, shift: "closing", scheduled_time: "21:30", sort_order: 28, auto_tick_source: null, weekly_day: null },
  { task_name: "Dispose garbage/wash bins/change liners", area: "Bins", frequency: "daily", method: "Empty all bins, wash inside, new liners", sanitiser_required: false, responsible_role: "any", is_active: true, shift: "closing", scheduled_time: "21:30", sort_order: 29, auto_tick_source: null, weekly_day: null },
  { task_name: "Clean down equipment and sanitise", area: "Equipment", frequency: "daily", method: "Wipe all equipment surfaces, sanitise", sanitiser_required: true, responsible_role: "any", is_active: true, shift: "closing", scheduled_time: "21:30", sort_order: 30, auto_tick_source: null, weekly_day: null },
  { task_name: "Grills degreasing", area: "Equipment", frequency: "daily", method: "Apply degreaser, scrub, rinse", sanitiser_required: false, responsible_role: "chef", is_active: true, shift: "closing", scheduled_time: "21:30", sort_order: 31, auto_tick_source: null, weekly_day: null },
  { task_name: "Restaurant/bar equipment cleaning", area: "FOH", frequency: "daily", method: "Clean all bar and restaurant equipment", sanitiser_required: false, responsible_role: "foh", is_active: true, shift: "closing", scheduled_time: "21:30", sort_order: 32, auto_tick_source: null, weekly_day: null },

  // Weekly
  { task_name: "Kitchen hoods cleaning", area: "Equipment", frequency: "weekly", method: "Degrease and wash hood filters and canopy", sanitiser_required: false, responsible_role: "any", is_active: true, shift: "closing", scheduled_time: null, sort_order: 40, auto_tick_source: null, weekly_day: "thursday" },
  { task_name: "Dishwasher descaling", area: "Dish Pit", frequency: "weekly", method: "Run descaling cycle, clean filters", sanitiser_required: false, responsible_role: "any", is_active: true, shift: "closing", scheduled_time: null, sort_order: 41, auto_tick_source: null, weekly_day: "sunday" },
  { task_name: "Cold room shelves cleaning/sanitising", area: "Cool Room", frequency: "weekly", method: "Remove items, clean all shelves, sanitise", sanitiser_required: true, responsible_role: "any", is_active: true, shift: "closing", scheduled_time: null, sort_order: 42, auto_tick_source: null, weekly_day: "sunday" },
  { task_name: "Garbage bins cleaning/sanitising", area: "Bins", frequency: "weekly", method: "Deep clean all bins, sanitise", sanitiser_required: true, responsible_role: "any", is_active: true, shift: "closing", scheduled_time: null, sort_order: 43, auto_tick_source: null, weekly_day: "sunday" },
];

// ── Hook: useCleaningTasks ──────────────────────────────────────────
export function useCleaningTasks() {
  const { currentOrg } = useOrg();
  const { isDevBypass } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();
  const queryKey = ["cleaning-schedules", orgId];

  const { data, isLoading, refetch } = useQuery<CleaningTask[]>({
    queryKey,
    queryFn: async () => {
      if (!orgId) return [];
      if (isDevBypass) {
        return queryClient.getQueryData<CleaningTask[]>(queryKey) ??
          DEFAULT_CLEANING_TASKS.map((t, i) => ({
            ...t,
            id: `dev-ct-${i}`,
            org_id: orgId,
          }));
      }
      const { data, error } = await supabase
        .from("bcc_cleaning_schedules")
        .select("*")
        .eq("org_id", orgId)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data as unknown as CleaningTask[]) || [];
    },
    enabled: !!orgId,
  });

  return { tasks: data ?? [], isLoading, refetch, queryKey };
}

// ── Hook: useCleaningCompletions ────────────────────────────────────
export function useCleaningCompletions(dateFilter?: string) {
  const { currentOrg } = useOrg();
  const { isDevBypass } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();
  const date = dateFilter || new Date().toISOString().split("T")[0];
  const queryKey = ["cleaning-completions", orgId, date];

  const { data, isLoading, refetch } = useQuery<CleaningCompletion[]>({
    queryKey,
    queryFn: async () => {
      if (!orgId) return [];
      if (isDevBypass) return queryClient.getQueryData<CleaningCompletion[]>(queryKey) ?? [];
      const dayStart = `${date}T00:00:00`;
      const dayEnd = `${date}T23:59:59`;
      const { data, error } = await supabase
        .from("bcc_cleaning_completions")
        .select("*")
        .eq("org_id", orgId)
        .gte("completed_at", dayStart)
        .lte("completed_at", dayEnd);
      if (error) throw error;
      return (data as unknown as CleaningCompletion[]) || [];
    },
    enabled: !!orgId,
  });

  return { completions: data ?? [], isLoading, refetch, queryKey, date };
}

// ── Hook: useCleaningMonthCompletions ───────────────────────────────
export function useCleaningMonthCompletions(year: number, month: number) {
  const { currentOrg } = useOrg();
  const { isDevBypass } = useAuth();
  const orgId = currentOrg?.id;
  const queryKey = ["cleaning-month-completions", orgId, year, month];

  const monthStart = `${year}-${String(month).padStart(2, "0")}-01T00:00:00`;
  const nextMonth = month === 12 ? `${year + 1}-01-01T00:00:00` : `${year}-${String(month + 1).padStart(2, "0")}-01T00:00:00`;

  const { data, isLoading, refetch } = useQuery<CleaningCompletion[]>({
    queryKey,
    queryFn: async () => {
      if (!orgId) return [];
      if (isDevBypass) return [];
      const { data, error } = await supabase
        .from("bcc_cleaning_completions")
        .select("*")
        .eq("org_id", orgId)
        .gte("completed_at", monthStart)
        .lt("completed_at", nextMonth);
      if (error) throw error;
      return (data as unknown as CleaningCompletion[]) || [];
    },
    enabled: !!orgId,
  });

  return { completions: data ?? [], isLoading, refetch };
}

// ── Hook: useAutoTickSources ────────────────────────────────────────
// Checks today's food safety activity to auto-complete related cleaning
export function useAutoTickSources(date?: string) {
  const { currentOrg } = useOrg();
  const { isDevBypass } = useAuth();
  const orgId = currentOrg?.id;
  const d = date || new Date().toISOString().split("T")[0];
  const queryKey = ["auto-tick-sources", orgId, d];

  const { data, isLoading } = useQuery<Set<string>>({
    queryKey,
    queryFn: async () => {
      if (!orgId) return new Set<string>();
      if (isDevBypass) return new Set(["temp_check", "receiving_log"]);

      const sources = new Set<string>();

      // Check temp logs for today
      const { data: tempLogs } = await supabase
        .from("food_safety_logs")
        .select("id")
        .eq("org_id", orgId)
        .eq("log_type", "temperature")
        .eq("date", d)
        .limit(1);
      if (tempLogs && tempLogs.length > 0) sources.add("temp_check");

      // Check receiving logs for today
      const { data: recvLogs } = await supabase
        .from("daily_compliance_logs")
        .select("id")
        .eq("org_id", orgId)
        .eq("log_type", "receiving")
        .eq("log_date", d)
        .limit(1);
      if (recvLogs && recvLogs.length > 0) sources.add("receiving_log");

      return sources;
    },
    enabled: !!orgId,
    refetchInterval: 60_000, // re-check every minute
  });

  return { activeSources: data ?? new Set<string>(), isLoading };
}

// ── Mutation: complete a task ───────────────────────────────────────
export function useCompleteCleaningTask() {
  const { currentOrg } = useOrg();
  const { user, isDevBypass } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      scheduleId: string;
      ppm?: number;
      photoUrl?: string;
      notes?: string;
      isAuto?: boolean;
    }) => {
      const orgId = currentOrg?.id;
      if (!orgId || !user) throw new Error("Not authenticated");

      if (isDevBypass) {
        const date = new Date().toISOString().split("T")[0];
        const qk = ["cleaning-completions", orgId, date];
        queryClient.setQueryData<CleaningCompletion[]>(qk, (prev) => [
          ...(prev ?? []),
          {
            id: `dev-cc-${Date.now()}`,
            schedule_id: input.scheduleId,
            org_id: orgId,
            completed_by: user.email ?? "dev",
            completed_at: new Date().toISOString(),
            sanitiser_concentration_ppm: input.ppm ?? null,
            photo_url: input.photoUrl ?? null,
            notes: input.notes ?? null,
            signed_off_by: null,
            signed_off_at: null,
            is_auto: input.isAuto ?? false,
          },
        ]);
        return;
      }

      const { error } = await supabase.from("bcc_cleaning_completions").insert({
        schedule_id: input.scheduleId,
        org_id: orgId,
        completed_by: user.email,
        sanitiser_concentration_ppm: input.ppm ?? null,
        photo_url: input.photoUrl ?? null,
        notes: input.notes ?? null,
        is_auto: input.isAuto ?? false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cleaning-completions"] });
      queryClient.invalidateQueries({ queryKey: ["cleaning-month-completions"] });
    },
  });
}

// ── Mutation: manager sign-off ──────────────────────────────────────
export function useSignOffCleaning() {
  const { user, isDevBypass } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (completionIds: string[]) => {
      if (!user) throw new Error("Not authenticated");
      if (completionIds.length === 0) return;

      if (isDevBypass) {
        // Update in cache
        queryClient.setQueriesData<CleaningCompletion[]>(
          { queryKey: ["cleaning-completions"] },
          (prev) =>
            prev?.map((c) =>
              completionIds.includes(c.id)
                ? { ...c, signed_off_by: user.email ?? "dev", signed_off_at: new Date().toISOString() }
                : c
            )
        );
        return;
      }

      const { error } = await supabase
        .from("bcc_cleaning_completions")
        .update({
          signed_off_by: user.email,
          signed_off_at: new Date().toISOString(),
        })
        .in("id", completionIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cleaning-completions"] });
    },
  });
}

// ── Mutation: seed defaults ─────────────────────────────────────────
export function useSeedCleaningTasks() {
  const { currentOrg } = useOrg();
  const { isDevBypass } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const orgId = currentOrg?.id;
      if (!orgId) throw new Error("No org selected");

      if (isDevBypass) {
        queryClient.setQueryData<CleaningTask[]>(
          ["cleaning-schedules", orgId],
          DEFAULT_CLEANING_TASKS.map((t, i) => ({ ...t, id: `dev-ct-${i}`, org_id: orgId }))
        );
        return;
      }

      const rows = DEFAULT_CLEANING_TASKS.map((t) => ({ ...t, org_id: orgId }));
      const { error } = await supabase.from("bcc_cleaning_schedules").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cleaning-schedules"] });
    },
  });
}

// ── Helpers ─────────────────────────────────────────────────────────
const DAYS_MAP: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

export function isTaskDueOnDate(task: CleaningTask, date: Date): boolean {
  if (task.frequency === "daily") return true;
  if (task.frequency === "weekly" && task.weekly_day) {
    return date.getDay() === (DAYS_MAP[task.weekly_day] ?? -1);
  }
  if (task.frequency === "monthly") return date.getDate() === 1;
  return true;
}

export function getShiftLabel(shift: Shift): string {
  return shift === "opening" ? "Opening" : shift === "midday" ? "Midday" : "Closing";
}

export function getShiftTime(shift: Shift): string {
  return shift === "opening" ? "8:00 AM" : shift === "midday" ? "11:30 AM" : "9:30 PM";
}
