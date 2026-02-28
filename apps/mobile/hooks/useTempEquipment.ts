import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useOrg } from "../contexts/OrgProvider";
import { useAuth } from "../contexts/AuthProvider";

// ── Types ────────────────────────────────────────────────────────────

export type LocationType = "fridge" | "freezer" | "hot_hold";

export interface TempEquipmentConfig {
  id: string;
  org_id: string;
  location_name: string;
  location_type: LocationType;
  shift: "am" | "pm";
  sort_order: number;
  is_active: boolean;
  custom_pass_min: number | null;
  custom_pass_max: number | null;
  custom_warn_min: number | null;
  custom_warn_max: number | null;
  input_method: "any" | "manual" | "camera" | "webhook";
  webhook_endpoint: string | null;
  display_name: string | null;
}

export interface TempCheckLog {
  id: string;
  org_id: string;
  log_type: string;
  date: string;
  time: string;
  shift: string;
  location: string | null;
  readings: { value: string; unit: string; config_id?: string } | null;
  status: string;
  recorded_by: string;
  recorded_by_name: string;
  notes: string | null;
}

// ── BCC Default Thresholds ──────────────────────────────────────────

export const BCC_TEMP_DEFAULTS: Record<LocationType, { pass: [number, number]; warn: [number, number] }> = {
  fridge:   { pass: [0, 5],     warn: [5.1, 8] },
  freezer:  { pass: [-50, -18], warn: [-17.9, -15] },
  hot_hold: { pass: [63, 100],  warn: [60, 62.9] },
};

export function getThresholds(config: TempEquipmentConfig) {
  if (config.custom_pass_min != null && config.custom_pass_max != null) {
    return {
      pass: [config.custom_pass_min, config.custom_pass_max] as [number, number],
      warn: [config.custom_warn_min ?? config.custom_pass_max, config.custom_warn_max ?? config.custom_pass_max + 3] as [number, number],
    };
  }
  return BCC_TEMP_DEFAULTS[config.location_type] ?? BCC_TEMP_DEFAULTS.fridge;
}

export function getAutoStatus(value: number, config: TempEquipmentConfig): "pass" | "warning" | "fail" {
  const t = getThresholds(config);
  if (value >= t.pass[0] && value <= t.pass[1]) return "pass";
  if (value >= t.warn[0] && value <= t.warn[1]) return "warning";
  return "fail";
}

// ── Auto-seed Defaults ──────────────────────────────────────────────

export const DEFAULT_CONFIGS: Omit<TempEquipmentConfig, "id" | "org_id" | "is_active" | "custom_pass_min" | "custom_pass_max" | "custom_warn_min" | "custom_warn_max" | "input_method" | "webhook_endpoint" | "display_name">[] = [
  // 4 Fridges
  { location_name: "Fridge 1",      location_type: "fridge",   shift: "am", sort_order: 1 },
  { location_name: "Fridge 1",      location_type: "fridge",   shift: "pm", sort_order: 2 },
  { location_name: "Fridge 2",      location_type: "fridge",   shift: "am", sort_order: 3 },
  { location_name: "Fridge 2",      location_type: "fridge",   shift: "pm", sort_order: 4 },
  { location_name: "Fridge 3",      location_type: "fridge",   shift: "am", sort_order: 5 },
  { location_name: "Fridge 3",      location_type: "fridge",   shift: "pm", sort_order: 6 },
  { location_name: "Fridge 4",      location_type: "fridge",   shift: "am", sort_order: 7 },
  { location_name: "Fridge 4",      location_type: "fridge",   shift: "pm", sort_order: 8 },
  // 2 Freezers
  { location_name: "Freezer 1",     location_type: "freezer",  shift: "am", sort_order: 9 },
  { location_name: "Freezer 1",     location_type: "freezer",  shift: "pm", sort_order: 10 },
  { location_name: "Freezer 2",     location_type: "freezer",  shift: "am", sort_order: 11 },
  { location_name: "Freezer 2",     location_type: "freezer",  shift: "pm", sort_order: 12 },
  // 2 Hot Holds
  { location_name: "Hot Hold 1",    location_type: "hot_hold", shift: "am", sort_order: 13 },
  { location_name: "Hot Hold 1",    location_type: "hot_hold", shift: "pm", sort_order: 14 },
  { location_name: "Hot Hold 2",    location_type: "hot_hold", shift: "am", sort_order: 15 },
  { location_name: "Hot Hold 2",    location_type: "hot_hold", shift: "pm", sort_order: 16 },
];

// ── Hook: useTempEquipment (Read configs) ───────────────────────────

export function useTempEquipment() {
  const { currentOrg } = useOrg();
  const { isDevBypass } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();
  const queryKey = ["temp-equipment-config", orgId];

  const { data, isLoading, refetch } = useQuery<TempEquipmentConfig[]>({
    queryKey,
    queryFn: async () => {
      if (!orgId) return [];
      if (isDevBypass) {
        return queryClient.getQueryData<TempEquipmentConfig[]>(queryKey) ?? [];
      }
      const { data, error } = await supabase
        .from("temp_check_config")
        .select("*")
        .eq("org_id", orgId)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data as unknown as TempEquipmentConfig[]) || [];
    },
    enabled: !!orgId,
  });

  // Auto-seed default equipment when org has none configured
  const seeded = useRef(false);
  useEffect(() => {
    if (!isLoading && data && data.length === 0 && orgId && !seeded.current) {
      seeded.current = true;
      const rows = DEFAULT_CONFIGS.map((c) => ({ ...c, org_id: orgId }));
      if (isDevBypass) {
        queryClient.setQueryData<TempEquipmentConfig[]>(queryKey, () =>
          DEFAULT_CONFIGS.map((c, i) => ({
            ...c,
            id: `dev-cfg-seed-${i}`,
            org_id: orgId,
            is_active: true,
            custom_pass_min: null,
            custom_pass_max: null,
            custom_warn_min: null,
            custom_warn_max: null,
            input_method: "any" as const,
            webhook_endpoint: null,
            display_name: null,
          }))
        );
      } else {
        supabase
          .from("temp_check_config")
          .insert(rows)
          .then(() => refetch());
      }
    }
  }, [isLoading, data, orgId]);

  return { configs: data ?? [], isLoading, refetch, queryKey };
}

// ── Hook: useTempEquipmentMutations (CRUD) ──────────────────────────

export function useTempEquipmentMutations() {
  const { currentOrg } = useOrg();
  const { isDevBypass } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();
  const queryKey = ["temp-equipment-config", orgId];

  const devSetCache = (updater: (prev: TempEquipmentConfig[]) => TempEquipmentConfig[]) => {
    queryClient.setQueryData<TempEquipmentConfig[]>(queryKey, (prev) => updater(prev ?? []));
  };
  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const addConfig = useMutation({
    mutationFn: async (input: Partial<TempEquipmentConfig>) => {
      if (!orgId) throw new Error("No org selected");
      if (isDevBypass) {
        devSetCache((prev) => [
          ...prev,
          { ...input, id: `dev-cfg-${Date.now()}`, org_id: orgId, is_active: true } as TempEquipmentConfig,
        ]);
        return;
      }
      const { error } = await supabase.from("temp_check_config").insert({ ...input, org_id: orgId });
      if (error) throw error;
    },
    onSuccess: () => { if (!isDevBypass) invalidate(); },
  });

  const updateConfig = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TempEquipmentConfig> & { id: string }) => {
      if (!orgId) throw new Error("No org selected");
      if (isDevBypass) {
        devSetCache((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
        return;
      }
      const { error } = await supabase.from("temp_check_config").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { if (!isDevBypass) invalidate(); },
  });

  const deleteConfig = useMutation({
    mutationFn: async (id: string) => {
      if (isDevBypass) {
        devSetCache((prev) => prev.filter((c) => c.id !== id));
        return;
      }
      const { error } = await supabase.from("temp_check_config").update({ is_active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { if (!isDevBypass) invalidate(); },
  });

  const seedDefaults = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No org selected");
      if (isDevBypass) {
        devSetCache(() =>
          DEFAULT_CONFIGS.map((c, i) => ({
            ...c,
            id: `dev-cfg-seed-${i}`,
            org_id: orgId,
            is_active: true,
            custom_pass_min: null,
            custom_pass_max: null,
            custom_warn_min: null,
            custom_warn_max: null,
            input_method: "any" as const,
            webhook_endpoint: null,
            display_name: null,
          }))
        );
        return;
      }
      const rows = DEFAULT_CONFIGS.map((c) => ({ ...c, org_id: orgId }));
      const { error } = await supabase.from("temp_check_config").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => { if (!isDevBypass) invalidate(); },
  });

  return { addConfig, updateConfig, deleteConfig, seedDefaults };
}

// ── Hook: useTempCheckLogs (Read today's logs) ──────────────────────

export function useTempCheckLogs(dateFilter?: string, shiftFilter?: "am" | "pm") {
  const { currentOrg } = useOrg();
  const { isDevBypass } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();
  const date = dateFilter || new Date().toISOString().split("T")[0];
  const shift = shiftFilter || (new Date().getHours() < 12 ? "am" : "pm");
  const queryKey = ["temp-check-logs", orgId, date, shift];

  const { data, isLoading, refetch } = useQuery<TempCheckLog[]>({
    queryKey,
    queryFn: async () => {
      if (!orgId) return [];
      if (isDevBypass) {
        return queryClient.getQueryData<TempCheckLog[]>(queryKey) ?? [];
      }
      const { data, error } = await supabase
        .from("food_safety_logs")
        .select("*")
        .eq("org_id", orgId)
        .eq("log_type", "temperature")
        .eq("date", date)
        .order("time", { ascending: false });
      if (error) throw error;
      // Filter by shift (stored in readings or shift column)
      return ((data as unknown as TempCheckLog[]) || []).filter((l) =>
        l.shift === shift || (l.readings as any)?.shift === shift
      );
    },
    enabled: !!orgId,
  });

  return { logs: data ?? [], isLoading, refetch, queryKey, date, shift };
}

// ── Hook: useTempCheckHistory (Browse past logs) ────────────────────

export function useTempCheckHistory(filters: {
  dateFrom?: string;
  dateTo?: string;
  userName?: string;
}) {
  const { currentOrg } = useOrg();
  const { isDevBypass } = useAuth();
  const orgId = currentOrg?.id;
  const queryKey = ["temp-check-history", orgId, filters];

  const { data, isLoading, refetch } = useQuery<TempCheckLog[]>({
    queryKey,
    queryFn: async () => {
      if (!orgId) return [];
      if (isDevBypass) return [];

      let query = supabase
        .from("food_safety_logs")
        .select("*")
        .eq("org_id", orgId)
        .eq("log_type", "temperature")
        .order("date", { ascending: false })
        .order("time", { ascending: false })
        .limit(200);

      if (filters.dateFrom) query = query.gte("date", filters.dateFrom);
      if (filters.dateTo) query = query.lte("date", filters.dateTo);
      if (filters.userName) {
        query = query.ilike("recorded_by_name", `%${filters.userName}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as TempCheckLog[]) || [];
    },
    enabled: !!orgId && !!(filters.dateFrom || filters.dateTo || filters.userName),
  });

  return { logs: data ?? [], isLoading, refetch };
}

// ── Hook: useCreateTempCheckLog (Log a reading) ─────────────────────

export function useCreateTempCheckLog() {
  const { currentOrg } = useOrg();
  const { user, isDevBypass } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      config: TempEquipmentConfig;
      value: number;
      shift: "am" | "pm";
      corrective_action?: string;
      source?: "manual" | "camera" | "webhook";
    }) => {
      const orgId = currentOrg?.id;
      if (!orgId || !user) throw new Error("Not authenticated");

      const status = getAutoStatus(input.value, input.config);
      const now = new Date();
      const date = now.toISOString().split("T")[0];
      const time = now.toTimeString().split(" ")[0];

      const log = {
        log_type: "temperature",
        location: input.config.location_name,
        readings: {
          value: input.value.toString(),
          unit: "C",
          config_id: input.config.id,
          source: input.source || "manual",
        },
        status,
        shift: input.shift,
        recorded_by: user.id,
        recorded_by_name: user.email,
        date,
        time,
        org_id: orgId,
        notes: input.corrective_action || null,
      };

      if (isDevBypass) {
        const queryKey = ["temp-check-logs", orgId, date, input.shift];
        queryClient.setQueryData<TempCheckLog[]>(queryKey, (prev) => [
          ...(prev ?? []),
          { ...log, id: `dev-log-${Date.now()}` } as unknown as TempCheckLog,
        ]);
        return;
      }

      const { error } = await supabase.from("food_safety_logs").insert(log);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["temp-check-logs"] });
      queryClient.invalidateQueries({ queryKey: ["food-safety-temps"] });
      queryClient.invalidateQueries({ queryKey: ["food-safety-logs"] });
    },
  });
}
