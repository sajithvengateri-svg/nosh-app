import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgId } from "@/hooks/useOrgId";
import { toast } from "sonner";

export interface WasteLog {
  id: string;
  org_id: string;
  module: "food" | "beverage";
  item_type: string;
  item_id: string | null;
  item_name: string;
  quantity: number;
  unit: string;
  cost: number;
  reason: string;
  notes: string | null;
  logged_by: string;
  logged_by_name: string;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  shift_date: string;
  created_at: string;
}

export type WasteLogInsert = {
  module: "food" | "beverage";
  item_type: string;
  item_id?: string | null;
  item_name: string;
  quantity: number;
  unit: string;
  cost: number;
  reason: string;
  notes?: string | null;
  shift_date?: string;
};

const FOOD_REASONS = [
  "expired", "spoiled", "overproduction", "dropped",
  "contaminated", "wrong_order", "quality",
] as const;

const BEV_REASONS = [
  "expired", "spoiled", "breakage", "spillage",
  "comp", "staff_drink", "over_pour", "quality",
] as const;

export const WASTE_REASONS = {
  food: FOOD_REASONS,
  beverage: BEV_REASONS,
};

export const REASON_LABELS: Record<string, string> = {
  expired: "Expired",
  spoiled: "Spoiled",
  overproduction: "Overproduction",
  dropped: "Dropped",
  contaminated: "Contaminated",
  wrong_order: "Wrong Order",
  quality: "Quality Issue",
  breakage: "Breakage",
  spillage: "Spillage",
  comp: "Comp / Complimentary",
  staff_drink: "Staff Drink",
  over_pour: "Over Pour",
  other: "Other",
};

export function useWasteLogs(module?: "food" | "beverage", filters?: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  reason?: string;
}) {
  const orgId = useOrgId();

  return useQuery({
    queryKey: ["waste-logs", orgId, module, filters],
    queryFn: async () => {
      if (!orgId) return [];
      let q = supabase
        .from("waste_logs")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(500);

      if (module) q = q.eq("module", module);
      if (filters?.status) q = q.eq("status", filters.status);
      if (filters?.reason) q = q.eq("reason", filters.reason);
      if (filters?.dateFrom) q = q.gte("shift_date", filters.dateFrom);
      if (filters?.dateTo) q = q.lte("shift_date", filters.dateTo);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as WasteLog[];
    },
    enabled: !!orgId,
  });
}

export function useCreateWasteLog() {
  const qc = useQueryClient();
  const orgId = useOrgId();
  const { profile, user } = useAuth();

  return useMutation({
    mutationFn: async (input: WasteLogInsert) => {
      if (!orgId || !user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("waste_logs").insert({
        org_id: orgId,
        module: input.module,
        item_type: input.item_type,
        item_id: input.item_id || null,
        item_name: input.item_name,
        quantity: input.quantity,
        unit: input.unit,
        cost: input.cost,
        reason: input.reason,
        notes: input.notes || null,
        shift_date: input.shift_date || new Date().toISOString().split("T")[0],
        logged_by: user.id,
        logged_by_name: profile?.full_name || "Unknown",
        status: "pending",
      } as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["waste-logs"] });
      toast.success("Waste logged successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useReviewWasteLog() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ ids, action, rejectionReason }: {
      ids: string[];
      action: "approved" | "rejected";
      rejectionReason?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("waste_logs")
        .update({
          status: action,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          ...(rejectionReason ? { rejection_reason: rejectionReason } : {}),
        } as any)
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["waste-logs"] });
      toast.success(`${v.ids.length} item(s) ${v.action}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useWasteStats(module?: "food" | "beverage", dateFrom?: string, dateTo?: string) {
  const orgId = useOrgId();

  return useQuery({
    queryKey: ["waste-stats", orgId, module, dateFrom, dateTo],
    queryFn: async () => {
      if (!orgId) return null;
      let q = supabase
        .from("waste_logs")
        .select("*")
        .eq("org_id", orgId)
        .eq("status", "approved");

      if (module) q = q.eq("module", module);
      if (dateFrom) q = q.gte("shift_date", dateFrom);
      if (dateTo) q = q.lte("shift_date", dateTo);

      const { data, error } = await q;
      if (error) throw error;
      const logs = (data ?? []) as WasteLog[];

      const totalCost = logs.reduce((s, l) => s + (l.cost || 0), 0);
      const totalItems = logs.length;

      // By reason
      const byReason: Record<string, number> = {};
      logs.forEach((l) => {
        byReason[l.reason] = (byReason[l.reason] || 0) + l.cost;
      });

      // By item (top offenders)
      const byItem: Record<string, { name: string; cost: number; count: number }> = {};
      logs.forEach((l) => {
        if (!byItem[l.item_name]) byItem[l.item_name] = { name: l.item_name, cost: 0, count: 0 };
        byItem[l.item_name].cost += l.cost;
        byItem[l.item_name].count += 1;
      });

      // By staff
      const byStaff: Record<string, { name: string; cost: number; count: number }> = {};
      logs.forEach((l) => {
        if (!byStaff[l.logged_by]) byStaff[l.logged_by] = { name: l.logged_by_name, cost: 0, count: 0 };
        byStaff[l.logged_by].cost += l.cost;
        byStaff[l.logged_by].count += 1;
      });

      // Daily trend
      const byDate: Record<string, number> = {};
      logs.forEach((l) => {
        byDate[l.shift_date] = (byDate[l.shift_date] || 0) + l.cost;
      });

      return {
        totalCost,
        totalItems,
        byReason: Object.entries(byReason).map(([reason, cost]) => ({ reason, cost })).sort((a, b) => b.cost - a.cost),
        byItem: Object.values(byItem).sort((a, b) => b.cost - a.cost).slice(0, 20),
        byStaff: Object.values(byStaff).sort((a, b) => b.cost - a.cost),
        dailyTrend: Object.entries(byDate).map(([date, cost]) => ({ date, cost })).sort((a, b) => a.date.localeCompare(b.date)),
      };
    },
    enabled: !!orgId,
  });
}
