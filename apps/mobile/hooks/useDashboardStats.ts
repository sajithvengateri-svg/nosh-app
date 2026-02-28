import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useOrg } from "../contexts/OrgProvider";

export interface DashboardStats {
  recipeCount: number;
  ingredientCount: number;
  lowStockCount: number;
  newRecipesThisWeek: number;
  prepTasksTotal: number;
  prepTasksCompleted: number;
  avgFoodCostPercent: number;
  targetFoodCost: number;
}

export function useDashboardStats() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  return useQuery<DashboardStats>({
    queryKey: ["dashboard-stats", orgId],
    queryFn: async () => {
      if (!orgId)
        return {
          recipeCount: 0, ingredientCount: 0, lowStockCount: 0, newRecipesThisWeek: 0,
          prepTasksTotal: 0, prepTasksCompleted: 0, avgFoodCostPercent: 0, targetFoodCost: 30,
        };

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const today = new Date().toISOString().split("T")[0];

      const [recipesRes, ingredientsRes, newRecipesRes, prepRes, costRes] = await Promise.all([
        supabase.from("recipes").select("id", { count: "exact", head: true }).eq("org_id", orgId),
        supabase.from("ingredients").select("id, current_stock, par_level").eq("org_id", orgId),
        supabase.from("recipes").select("id", { count: "exact", head: true }).eq("org_id", orgId).gte("created_at", weekAgo.toISOString()),
        supabase.from("prep_lists").select("id, status, items, date").eq("org_id", orgId).order("date", { ascending: false }).limit(50),
        supabase.from("recipes").select("cost_per_serving, sell_price, target_food_cost_percent").eq("org_id", orgId),
      ]);

      const ingredients = ingredientsRes.data || [];
      const lowStock = ingredients.filter(
        (i) => i.par_level != null && i.current_stock != null && i.current_stock < i.par_level
      );

      // Prep stats
      const allLists = prepRes.data || [];
      const todayLists = allLists.filter((l) => l.date === today);
      const listsToCount = todayLists.length > 0 ? todayLists : allLists.slice(0, 10);
      const prepTasksTotal = listsToCount.length;
      const prepTasksCompleted = listsToCount.filter((l) => l.status === "completed").length;

      // Food cost %
      const costData = costRes.data || [];
      const recipesWithCost = costData.filter((r: any) => r.sell_price && r.sell_price > 0 && r.cost_per_serving);
      let avgFoodCostPercent = 0;
      if (recipesWithCost.length > 0) {
        const total = recipesWithCost.reduce((sum: number, r: any) => {
          return sum + ((r.cost_per_serving || 0) / (r.sell_price || 1)) * 100;
        }, 0);
        avgFoodCostPercent = Math.round((total / recipesWithCost.length) * 10) / 10;
      }
      const recipesWithTarget = costData.filter((r: any) => r.target_food_cost_percent);
      const avgTarget = recipesWithTarget.length > 0
        ? Math.round(recipesWithTarget.reduce((s: number, r: any) => s + (r.target_food_cost_percent || 30), 0) / recipesWithTarget.length)
        : 30;

      return {
        recipeCount: recipesRes.count || 0,
        ingredientCount: ingredients.length,
        lowStockCount: lowStock.length,
        newRecipesThisWeek: newRecipesRes.count || 0,
        prepTasksTotal,
        prepTasksCompleted,
        avgFoodCostPercent,
        targetFoodCost: avgTarget,
      };
    },
    enabled: !!orgId,
  });
}
