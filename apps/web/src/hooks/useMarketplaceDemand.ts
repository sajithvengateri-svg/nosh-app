import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DemandInsight {
  id: string;
  ingredient_name: string | null;
  ingredient_category: string;
  postcode: string;
  week_ending: string;
  total_quantity: number;
  order_count: number;
  unit: string;
  avg_price_paid: number | null;
}

/**
 * Reads anonymized demand data from the demand_insights table.
 * Shows ingredient names, categories, postcodes, quantities — NO org/user/recipe info.
 */
export const useMarketplaceDemand = () => {
  return useQuery({
    queryKey: ["marketplace-demand"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("demand_insights")
        .select("*")
        .order("total_quantity", { ascending: false });

      if (error) throw error;
      return (data || []) as DemandInsight[];
    },
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Aggregates demand by category for high-level insights
 */
export const useCategoryDemand = () => {
  const { data: insights, isLoading, error } = useMarketplaceDemand();

  const categoryData = insights?.reduce((acc, item) => {
    const existing = acc.find((c) => c.category === item.ingredient_category);
    if (existing) {
      existing.total_quantity += item.total_quantity;
      existing.order_count += item.order_count;
      existing.ingredient_count += 1;
    } else {
      acc.push({
        category: item.ingredient_category,
        total_quantity: item.total_quantity,
        order_count: item.order_count,
        ingredient_count: 1,
        unit: item.unit,
      });
    }
    return acc;
  }, [] as { category: string; total_quantity: number; order_count: number; ingredient_count: number; unit: string }[]);

  return {
    data: categoryData?.sort((a, b) => b.total_quantity - a.total_quantity),
    isLoading,
    error,
  };
};
