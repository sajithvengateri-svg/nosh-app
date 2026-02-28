import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import type { ServiceLog, ServiceType } from "@/types/housekeeping";

// ── Fetch service logs ──────────────────────────────────────────────
export function useServiceLogs(serviceType: ServiceType) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  const { data, isLoading, error } = useQuery<ServiceLog[]>({
    queryKey: ["service-logs", orgId, serviceType],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("service_logs")
        .select("*")
        .eq("org_id", orgId)
        .eq("service_type", serviceType)
        .order("service_date", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as ServiceLog[];
    },
    enabled: !!orgId,
  });

  return { logs: data ?? [], isLoading, error };
}

// ── Fetch service dates for calendar view ───────────────────────────
export function useServiceLogDates(serviceType: ServiceType, year: number) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  const { data } = useQuery<{ serviceDates: Date[]; nextDueDate: Date | null }>({
    queryKey: ["service-log-dates", orgId, serviceType, year],
    queryFn: async () => {
      if (!orgId) return { serviceDates: [], nextDueDate: null };
      const { data, error } = await supabase
        .from("service_logs")
        .select("service_date, next_due_date, status")
        .eq("org_id", orgId)
        .eq("service_type", serviceType)
        .gte("service_date", `${year}-01-01`)
        .lte("service_date", `${year}-12-31`)
        .order("service_date", { ascending: false });
      if (error) throw error;

      const serviceDates = (data ?? []).map((d: any) => new Date(d.service_date));
      const firstWithNext = (data ?? []).find((d: any) => d.next_due_date);
      const nextDueDate = firstWithNext ? new Date(firstWithNext.next_due_date) : null;
      return { serviceDates, nextDueDate };
    },
    enabled: !!orgId,
  });

  return data ?? { serviceDates: [], nextDueDate: null };
}

// ── Fetch aggregated stats for consumption chart ────────────────────
export function useServiceLogStats(
  serviceType: ServiceType,
  dateRange: { from: Date; to: Date },
  metricKeys: string[]
) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  const { data, isLoading } = useQuery<{ month: string; [key: string]: any }[]>({
    queryKey: ["service-log-stats", orgId, serviceType, dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async () => {
      if (!orgId || metricKeys.length === 0) return [];
      const { data, error } = await supabase
        .from("service_logs")
        .select("service_date, metadata, cost")
        .eq("org_id", orgId)
        .eq("service_type", serviceType)
        .gte("service_date", dateRange.from.toISOString().split("T")[0])
        .lte("service_date", dateRange.to.toISOString().split("T")[0])
        .order("service_date", { ascending: true });
      if (error) throw error;

      // Group by month and aggregate
      const byMonth: Record<string, { count: number; cost: number; [k: string]: number }> = {};
      for (const row of data ?? []) {
        const month = (row.service_date as string).slice(0, 7); // "2026-01"
        if (!byMonth[month]) {
          byMonth[month] = { count: 0, cost: 0 };
          for (const k of metricKeys) byMonth[month][k] = 0;
        }
        byMonth[month].count++;
        byMonth[month].cost += (row as any).cost ?? 0;
        const meta = (row as any).metadata ?? {};
        for (const k of metricKeys) {
          byMonth[month][k] += Number(meta[k]) || 0;
        }
      }

      return Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, vals]) => ({ month, ...vals }));
    },
    enabled: !!orgId && metricKeys.length > 0,
  });

  return { stats: data ?? [], isLoading };
}

// ── Save a service log ──────────────────────────────────────────────
export function useSaveServiceLog() {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: {
      service_type: string;
      provider_name?: string;
      service_date: string;
      next_due_date?: string;
      cost?: number;
      notes?: string;
      invoice_file?: File;
      metadata?: Record<string, any>;
    }) => {
      const orgId = currentOrg?.id;
      if (!orgId || !user) throw new Error("Not authenticated");

      let invoiceUrl: string | null = null;
      if (values.invoice_file) {
        const ext = values.invoice_file.name.split(".").pop();
        const path = `${orgId}/housekeeping/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("invoices")
          .upload(path, values.invoice_file);
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("invoices").getPublicUrl(path);
          invoiceUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase.from("service_logs").insert({
        org_id: orgId,
        service_type: values.service_type,
        provider_name: values.provider_name || null,
        service_date: values.service_date,
        next_due_date: values.next_due_date || null,
        cost: values.cost ?? null,
        invoice_url: invoiceUrl,
        status: "completed",
        logged_by: user.id,
        logged_by_name: user.email,
        metadata: values.metadata ?? {},
        notes: values.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-logs"] });
      queryClient.invalidateQueries({ queryKey: ["service-log-dates"] });
      queryClient.invalidateQueries({ queryKey: ["service-log-stats"] });
    },
  });
}

// ── Delete a service log ────────────────────────────────────────────
export function useDeleteServiceLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("service_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-logs"] });
      queryClient.invalidateQueries({ queryKey: ["service-log-dates"] });
      queryClient.invalidateQueries({ queryKey: ["service-log-stats"] });
    },
  });
}

// ── Service schedules ───────────────────────────────────────────────
export function useServiceSchedules(serviceType: ServiceType) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["service-schedules", orgId, serviceType],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("service_schedules")
        .select("*")
        .eq("org_id", orgId)
        .eq("service_type", serviceType)
        .order("next_due_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!orgId,
  });

  return { schedules: data ?? [], isLoading };
}

export function useSaveServiceSchedule() {
  const { currentOrg } = useOrg();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: {
      id?: string;
      service_type: string;
      frequency: string;
      provider_name?: string;
      estimated_cost?: number;
      start_date: string;
      next_due_date: string;
      is_active?: boolean;
      notes?: string;
    }) => {
      const orgId = currentOrg?.id;
      if (!orgId) throw new Error("No org");

      const row = {
        org_id: orgId,
        service_type: values.service_type,
        frequency: values.frequency,
        provider_name: values.provider_name || null,
        estimated_cost: values.estimated_cost ?? null,
        start_date: values.start_date,
        next_due_date: values.next_due_date,
        is_active: values.is_active ?? true,
        notes: values.notes || null,
      };

      if (values.id) {
        const { error } = await supabase.from("service_schedules").update(row).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("service_schedules").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-schedules"] });
    },
  });
}

export function useDeleteServiceSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("service_schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-schedules"] });
    },
  });
}

// ── Service summary (KPI cards) ─────────────────────────────────────
export function useServiceSummary(serviceType: ServiceType) {
  const { logs } = useServiceLogs(serviceType);
  const { schedules } = useServiceSchedules(serviceType);

  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
  const ytdLogs = logs.filter((l) => l.service_date >= yearStart);

  const totalSpend = ytdLogs.reduce((sum, l) => sum + (l.cost ?? 0), 0);
  const entryCount = logs.length;

  let avgFrequencyDays: number | null = null;
  if (logs.length >= 2) {
    const dates = logs.map((l) => new Date(l.service_date).getTime()).sort((a, b) => b - a);
    const gaps: number[] = [];
    for (let i = 0; i < dates.length - 1; i++) {
      gaps.push((dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24));
    }
    avgFrequencyDays = Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length);
  }

  const scheduleNext = schedules.find((s) => s.is_active)?.next_due_date ?? null;
  const logNext = logs.find((l) => l.next_due_date)?.next_due_date ?? null;
  const nextDueDate = scheduleNext ?? logNext;
  const isOverdue = nextDueDate ? new Date(nextDueDate) < now : false;

  return { totalSpend, entryCount, avgFrequencyDays, nextDueDate, isOverdue };
}

// ── Price alert detection ───────────────────────────────────────────
const CPI_LIMIT = 0.05;

export function getPriceAlerts(logs: ServiceLog[]): Set<string> {
  const alertIds = new Set<string>();
  const costsWithIds = logs
    .filter((l) => l.cost != null && l.cost > 0)
    .map((l) => ({ id: l.id, cost: l.cost! }));

  if (costsWithIds.length < 2) return alertIds;

  // Compare each entry to the average of entries that came after it (older entries)
  for (let i = 0; i < costsWithIds.length; i++) {
    const olderCosts = costsWithIds.slice(i + 1, i + 7); // up to 6 older entries
    if (olderCosts.length === 0) continue;
    const avg = olderCosts.reduce((s, c) => s + c.cost, 0) / olderCosts.length;
    if (costsWithIds[i].cost > avg * (1 + CPI_LIMIT)) {
      alertIds.add(costsWithIds[i].id);
    }
  }

  return alertIds;
}
