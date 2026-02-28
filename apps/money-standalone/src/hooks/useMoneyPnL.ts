import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface PnLSnapshot {
  id: string;
  org_id: string;
  period_start: string;
  period_end: string;
  period_type: string;
  revenue_total: number;
  cogs_food: number;
  cogs_bev: number;
  cogs_waste_food: number;
  cogs_waste_bev: number;
  gross_profit: number;
  gross_margin_pct: number;
  labour_wages: number;
  labour_super: number;
  labour_overtime: number;
  labour_total: number;
  labour_pct: number;
  overhead_total: number;
  overhead_pct: number;
  net_profit: number;
  net_profit_pct: number;
  prime_cost: number;
  prime_cost_pct: number;
  break_even_revenue: number;
  ops_supplies_cleaning: number;
  ops_supplies_pct: number;
  data_completeness_pct: number;
  generated_at: string;
}

export function useMoneyPnL(orgId: string | undefined, periodStart: string, periodEnd: string, periodType = "daily") {
  return useQuery({
    queryKey: ["pnl-snapshot", orgId, periodStart, periodEnd, periodType],
    queryFn: async (): Promise<PnLSnapshot | null> => {
      if (!orgId) return null;

      const { data: existing } = await supabase
        .from("pnl_snapshots")
        .select("*")
        .eq("org_id", orgId)
        .eq("period_start", periodStart)
        .eq("period_end", periodEnd)
        .eq("period_type", periodType)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) return existing as PnLSnapshot;

      const { data, error } = await supabase.functions.invoke("generate-pnl-snapshot", {
        body: { org_id: orgId, period_start: periodStart, period_end: periodEnd, period_type: periodType },
      });

      if (error) {
        console.error("PnL snapshot generation failed:", error);
        return null;
      }

      return data as PnLSnapshot;
    },
    enabled: !!orgId && !!periodStart && !!periodEnd,
    staleTime: 5 * 60 * 1000,
  });
}
