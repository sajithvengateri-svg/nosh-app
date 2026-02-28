import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PnLSnapshot } from "./useMoneyPnL";
import type { EcosystemModule } from "./useEcosystemStatus";

export interface ReactorData {
  snapshot: PnLSnapshot | null;
  ecosystem: EcosystemModule[];
  alerts: ReactorAlert[];
  auditScore: number | null;
}

export interface ReactorAlert {
  id: string;
  level: "critical" | "warning" | "info";
  title: string;
  detail: string;
  module: string;
}

export function useMoneyReactor(orgId: string | undefined) {
  return useQuery({
    queryKey: ["money-reactor", orgId],
    queryFn: async (): Promise<ReactorData> => {
      if (!orgId) return { snapshot: null, ecosystem: [], alerts: [], auditScore: null };

      const today = new Date().toISOString().split("T")[0];

      // Fetch latest snapshot, ecosystem status, audit scores, and overhead alerts in parallel
      const snapshotRes = await supabase
        .from("pnl_snapshots")
        .select("*")
        .eq("org_id", orgId)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const ecoRes = await supabase
        .from("ecosystem_sync_log")
        .select("*")
        .eq("org_id", orgId);

      const auditRes = await supabase
        .from("audit_scores")
        .select("overall_score")
        .eq("org_id", orgId)
        .order("period_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let alertData: any[] = [];
      try {
        const alertQuery = supabase
          .from("overhead_alerts" as any)
          .select("*")
          .eq("org_id", orgId)
          .eq("is_resolved", false)
          .order("created_at", { ascending: false })
          .limit(10);
        const alertRes = await alertQuery;
        alertData = (alertRes as any)?.data || [];
      } catch {
        // overhead_alerts may not exist yet
      }

      const snapshot = (snapshotRes.data as PnLSnapshot) || null;
      const ecosystem = (ecoRes.data || []) as EcosystemModule[];
      const auditScore = auditRes.data?.overall_score ?? null;

      // Build alerts from snapshot thresholds + overhead alerts
      const alerts: ReactorAlert[] = [];

      if (snapshot) {
        if (snapshot.labour_pct > 32) {
          alerts.push({ id: "labour-high", level: "critical", title: "Labour above 32%", detail: `Currently ${snapshot.labour_pct.toFixed(1)}%`, module: "labouros" });
        } else if (snapshot.labour_pct > 28) {
          alerts.push({ id: "labour-warn", level: "warning", title: "Labour trending high", detail: `Currently ${snapshot.labour_pct.toFixed(1)}%`, module: "labouros" });
        }

        const foodPct = snapshot.revenue_total > 0 ? (snapshot.cogs_food / snapshot.revenue_total) * 100 : 0;
        if (foodPct > 35) {
          alerts.push({ id: "food-high", level: "critical", title: "Food cost above 35%", detail: `Currently ${foodPct.toFixed(1)}%`, module: "chefos" });
        }

        const suppliesPct = snapshot.ops_supplies_pct ?? 0;
        if (suppliesPct > 4) {
          alerts.push({ id: "supplies-high", level: "warning", title: "Supplies above 4%", detail: `Currently ${suppliesPct.toFixed(1)}%`, module: "overheados" });
        }

        if (snapshot.net_profit_pct < 5) {
          alerts.push({ id: "net-low", level: "critical", title: "Net margin under 5%", detail: `Currently ${snapshot.net_profit_pct.toFixed(1)}%`, module: "moneyos" });
        }
      }

      // Stale ecosystem alerts
      for (const mod of ecosystem) {
        if (mod.status === "stale" || mod.status === "disconnected") {
          alerts.push({
            id: `eco-${mod.module}`,
            level: mod.status === "disconnected" ? "critical" : "warning",
            title: `${mod.module} ${mod.status}`,
            detail: `Last data: ${new Date(mod.last_data_at).toLocaleString()}`,
            module: mod.module,
          });
        }
      }

      // Overhead alerts
      if (alertData.length > 0) {
        for (const a of alertData) {
          alerts.push({
            id: a.id,
            level: a.severity === "high" ? "critical" : "warning",
            title: a.title || "Overhead alert",
            detail: a.message || "",
            module: "overheados",
          });
        }
      }

      return { snapshot, ecosystem, alerts, auditScore };
    },
    enabled: !!orgId,
    staleTime: 60 * 1000,
  });
}
