import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useOrg } from "../contexts/OrgProvider";
import Constants from "expo-constants";
import { isHomeCook } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";

const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;
const IS_HOME_COOK = isHomeCook(APP_VARIANT);

export interface ModuleHealth {
  module: string;
  label: string;
  lastDataAt: string | null;
  recordCount: number;
  score: number;
  status: "fresh" | "recent" | "stale" | "very_stale" | "no_data";
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

  const hoursSince = (Date.now() - new Date(lastDataAt).getTime()) / (1000 * 60 * 60);

  if (hoursSince <= 24) return { score: 100, status: "fresh" };
  if (hoursSince <= 72) return { score: 75, status: "recent" };
  if (hoursSince <= 168) return { score: 50, status: "stale" };
  if (hoursSince <= 336) return { score: 25, status: "very_stale" };
  return { score: 10, status: "very_stale" };
}

async function fetchHomeCookHealth(orgId: string): Promise<{ overallScore: number; modules: ModuleHealth[] }> {
  const results = await Promise.all(
    HOME_COOK_MODULES.map(async ({ key, label, table, dateCol }) => {
      const { count, error: countErr } = await supabase
        .from(table as any)
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId);

      const { data: latest, error: latestErr } = await supabase
        .from(table as any)
        .select(dateCol)
        .eq("org_id", orgId)
        .order(dateCol, { ascending: false })
        .limit(1)
        .single();

      const lastDataAt = (!latestErr && latest) ? (latest as any)[dateCol] : null;
      const { score, status } = calculateScore(lastDataAt);

      return {
        module: key,
        label,
        lastDataAt,
        recordCount: (!countErr && count) ? count : 0,
        score,
        status,
      } as ModuleHealth;
    })
  );

  const overallScore = results.length > 0
    ? Math.round(results.reduce((sum, m) => sum + m.score, 0) / results.length)
    : 0;

  return { overallScore, modules: results };
}

async function fetchRestaurantHealth(orgId: string): Promise<{ overallScore: number; modules: ModuleHealth[] }> {
  const { data, error } = await supabase
    .from("ecosystem_sync_log")
    .select("module, last_data_at, record_count")
    .eq("org_id", orgId);

  if (error) throw error;

  const allModules = Object.keys(MODULE_LABELS);
  const modules: ModuleHealth[] = allModules.map((mod) => {
    const row = (data || []).find((d: any) => d.module === mod);
    const { score, status } = calculateScore(row?.last_data_at || null);
    return {
      module: mod,
      label: MODULE_LABELS[mod],
      lastDataAt: row?.last_data_at || null,
      recordCount: row?.record_count || 0,
      score,
      status,
    };
  });

  const overallScore = modules.length > 0
    ? Math.round(modules.reduce((sum, m) => sum + m.score, 0) / modules.length)
    : 0;

  return { overallScore, modules };
}

export function useSystemHealth() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  return useQuery({
    queryKey: ["system-health", orgId, IS_HOME_COOK ? "home-cook" : "restaurant"],
    queryFn: async () => {
      if (!orgId) return { overallScore: 0, modules: [] as ModuleHealth[] };
      return IS_HOME_COOK ? fetchHomeCookHealth(orgId) : fetchRestaurantHealth(orgId);
    },
    enabled: !!orgId,
    staleTime: 30000,
  });
}
