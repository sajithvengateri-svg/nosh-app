import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useOrg } from "../contexts/OrgProvider";

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
  ops_supplies_cleaning: number;
  ops_supplies_pct: number;
  break_even_revenue: number;
  data_completeness_pct: number;
  generated_at: string;
}

export interface EcosystemModule {
  id: string;
  module: string;
  org_id: string;
  status: string;
  source_type: string;
  record_count: number;
  last_data_at: string;
}

export interface ReactorAlert {
  id: string;
  level: "critical" | "warning" | "info";
  title: string;
  detail: string;
  module: string;
}

export interface MoneyDashboardData {
  snapshot: PnLSnapshot | null;
  ecosystem: EcosystemModule[];
  alerts: ReactorAlert[];
  auditScore: number | null;
}

export function useMoneyDashboard() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  return useQuery<MoneyDashboardData>({
    queryKey: ["money-dashboard", orgId],
    queryFn: async (): Promise<MoneyDashboardData> => {
      if (!orgId) return { snapshot: null, ecosystem: [], alerts: [], auditScore: null };

      // Fetch snapshot, ecosystem status, and audit scores in parallel
      const [snapshotRes, ecoRes, auditRes] = await Promise.all([
        supabase
          .from("pnl_snapshots")
          .select("*")
          .eq("org_id", orgId)
          .order("generated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("ecosystem_sync_log")
          .select("*")
          .eq("org_id", orgId),
        supabase
          .from("audit_scores")
          .select("overall_score")
          .eq("org_id", orgId)
          .order("period_date", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const snapshot = (snapshotRes.data as PnLSnapshot) || null;
      const ecosystem = (ecoRes.data || []) as EcosystemModule[];
      const auditScore = auditRes.data?.overall_score ?? null;

      // Build alerts from snapshot thresholds
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
        } else if (foodPct > 30) {
          alerts.push({ id: "food-warn", level: "warning", title: "Food cost trending high", detail: `Currently ${foodPct.toFixed(1)}%`, module: "chefos" });
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
            detail: `Last data: ${new Date(mod.last_data_at).toLocaleDateString()}`,
            module: mod.module,
          });
        }
      }

      return { snapshot, ecosystem, alerts, auditScore };
    },
    enabled: !!orgId,
    staleTime: 60_000,
  });
}
