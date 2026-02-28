import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEcosystemStatus, EcosystemModule } from "./useEcosystemStatus";

export interface ModuleHealth {
  module: string;
  label: string;
  score: number;
  status: "fresh" | "recent" | "stale" | "very_stale" | "no_data";
  lastDataAt: string | null;
  recordCount: number;
}

export interface SystemHealth {
  score: number;
  moduleScores: ModuleHealth[];
  stalestModules: ModuleHealth[];
  recommendations: string[];
  isLoading: boolean;
}

const MODULE_LABELS: Record<string, string> = {
  chefos: "Recipes & Ingredients",
  bevos: "Beverage Program",
  restos: "POS & Revenue",
  overheados: "Overheads",
  labouros: "Labour & Roster",
  reservationos: "Reservations",
};

/** Home cook modules — query actual data tables instead of ecosystem_sync_log */
const HOME_COOK_MODULES: { key: string; label: string; table: string; dateCol: string }[] = [
  { key: "recipes", label: "My Recipes", table: "recipes", dateCol: "updated_at" },
  { key: "ingredients", label: "My Pantry", table: "ingredients", dateCol: "updated_at" },
  { key: "food_safety", label: "Safety Checks", table: "food_safety_logs", dateCol: "created_at" },
  { key: "prep_lists", label: "Prep Lists", table: "prep_lists", dateCol: "updated_at" },
  { key: "cleaning", label: "Cleaning", table: "bcc_cleaning_completions", dateCol: "completed_at" },
  { key: "waste", label: "Waste Tracking", table: "waste_logs", dateCol: "created_at" },
];

function calculateScore(lastDataAt: string | null): { score: number; status: ModuleHealth["status"] } {
  if (!lastDataAt) return { score: 0, status: "no_data" };

  const hoursAgo = (Date.now() - new Date(lastDataAt).getTime()) / (1000 * 60 * 60);

  if (hoursAgo <= 24) return { score: 100, status: "fresh" };
  if (hoursAgo <= 72) return { score: 75, status: "recent" };
  if (hoursAgo <= 168) return { score: 50, status: "stale" };
  if (hoursAgo <= 336) return { score: 25, status: "very_stale" };
  return { score: 10, status: "very_stale" };
}

function scoreModule(mod: EcosystemModule | undefined): { score: number; status: ModuleHealth["status"] } {
  if (!mod?.last_data_at) return { score: 0, status: "no_data" };
  return calculateScore(mod.last_data_at);
}

function buildRecommendations(moduleScores: ModuleHealth[]): string[] {
  const stalestModules = [...moduleScores]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  const recommendations: string[] = [];
  stalestModules.forEach((m) => {
    if (m.status === "no_data") {
      recommendations.push(`No data yet for ${m.label}. Start logging to improve your score.`);
    } else if (m.status === "very_stale") {
      recommendations.push(`${m.label} hasn't been updated in over a week. Time for a quick update.`);
    } else if (m.status === "stale") {
      recommendations.push(`${m.label} data is getting stale. Schedule a quick update.`);
    }
  });
  return recommendations;
}

/** Home cook health — queries real data tables directly */
function useHomeCookHealth(orgId: string | undefined): SystemHealth {
  const { data, isLoading } = useQuery({
    queryKey: ["system-health-home-cook", orgId],
    queryFn: async (): Promise<ModuleHealth[]> => {
      if (!orgId) return [];

      const results = await Promise.all(
        HOME_COOK_MODULES.map(async ({ key, label, table, dateCol }) => {
          const { count } = await supabase
            .from(table as any)
            .select("*", { count: "exact", head: true })
            .eq("org_id", orgId);

          const { data: latest } = await supabase
            .from(table as any)
            .select(dateCol)
            .eq("org_id", orgId)
            .order(dateCol, { ascending: false })
            .limit(1)
            .single();

          const lastDataAt = latest ? (latest as any)[dateCol] : null;
          const { score, status } = calculateScore(lastDataAt);

          return { module: key, label, lastDataAt, recordCount: count ?? 0, score, status } as ModuleHealth;
        })
      );

      return results;
    },
    enabled: !!orgId,
    staleTime: 30000,
  });

  return useMemo(() => {
    const moduleScores = data || [];
    const avgScore = moduleScores.length > 0
      ? Math.round(moduleScores.reduce((sum, m) => sum + m.score, 0) / moduleScores.length)
      : 0;
    const stalestModules = [...moduleScores].sort((a, b) => a.score - b.score).slice(0, 3);
    const recommendations = buildRecommendations(moduleScores);
    return { score: avgScore, moduleScores, stalestModules, recommendations, isLoading };
  }, [data, isLoading]);
}

/** Restaurant health — reads from ecosystem_sync_log */
function useRestaurantHealth(orgId: string | undefined): SystemHealth {
  const { data: modules, isLoading } = useEcosystemStatus(orgId);

  return useMemo(() => {
    if (!modules || modules.length === 0) {
      return {
        score: 0,
        moduleScores: [],
        stalestModules: [],
        recommendations: ["Start adding data to your modules to build your health score."],
        isLoading,
      };
    }

    const moduleScores: ModuleHealth[] = modules.map((mod) => {
      const { score, status } = scoreModule(mod);
      return {
        module: mod.module,
        label: MODULE_LABELS[mod.module] || mod.module,
        score,
        status,
        lastDataAt: mod.last_data_at,
        recordCount: mod.record_count,
      };
    });

    const avgScore = moduleScores.length > 0
      ? Math.round(moduleScores.reduce((sum, m) => sum + m.score, 0) / moduleScores.length)
      : 0;
    const stalestModules = [...moduleScores].sort((a, b) => a.score - b.score).slice(0, 3);
    const recommendations = buildRecommendations(moduleScores);

    return { score: avgScore, moduleScores, stalestModules, recommendations, isLoading };
  }, [modules, isLoading]);
}

export function useSystemHealth(orgId: string | undefined, storeMode?: string): SystemHealth {
  const isHomeCook = storeMode === "home_cook";
  const homeCookResult = useHomeCookHealth(isHomeCook ? orgId : undefined);
  const restaurantResult = useRestaurantHealth(isHomeCook ? undefined : orgId);
  return isHomeCook ? homeCookResult : restaurantResult;
}
