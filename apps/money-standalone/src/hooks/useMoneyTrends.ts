import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { PnLSnapshot } from "./useMoneyPnL";

export function useMoneyTrends(orgId: string | undefined, days = 30) {
  return useQuery({
    queryKey: ["money-trends", orgId, days],
    queryFn: async (): Promise<PnLSnapshot[]> => {
      if (!orgId) return [];

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from("pnl_snapshots")
        .select("*")
        .eq("org_id", orgId)
        .gte("period_start", startDate.toISOString().split("T")[0])
        .lte("period_end", endDate.toISOString().split("T")[0])
        .order("period_start", { ascending: true });

      if (error) {
        console.error("Money trends fetch error:", error);
        return [];
      }

      return (data || []) as PnLSnapshot[];
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}
