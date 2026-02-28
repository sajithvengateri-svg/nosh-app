import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface RecipeCCP {
  id: string;
  recipe_id: string;
  step_type: "prep" | "cook" | "hold" | "serve";
  target_temp: number | null;
  description: string;
  position: number;
  sort_order: number;
}

export function useRecipeCCPs(recipeId: string | undefined) {
  return useQuery<RecipeCCP[]>({
    queryKey: ["recipe-ccps", recipeId],
    queryFn: async () => {
      if (!recipeId) return [];
      const { data, error } = await supabase
        .from("recipe_ccps")
        .select("*")
        .eq("recipe_id", recipeId)
        .order("sort_order");
      if (error) throw error;
      return (data as RecipeCCP[]) || [];
    },
    enabled: !!recipeId,
  });
}

export function useUpsertCCPs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipeId,
      ccps,
    }: {
      recipeId: string;
      ccps: Omit<RecipeCCP, "id" | "recipe_id">[];
    }) => {
      // Delete all existing CCPs for this recipe
      const { error: deleteError } = await supabase
        .from("recipe_ccps")
        .delete()
        .eq("recipe_id", recipeId);
      if (deleteError) throw deleteError;

      // Insert new set
      if (ccps.length === 0) return [];
      const rows = ccps.map((ccp, idx) => ({
        recipe_id: recipeId,
        step_type: ccp.step_type,
        target_temp: ccp.target_temp,
        description: ccp.description,
        position: ccp.position,
        sort_order: idx,
      }));
      const { data, error: insertError } = await supabase
        .from("recipe_ccps")
        .insert(rows)
        .select();
      if (insertError) throw insertError;
      return (data as RecipeCCP[]) || [];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["recipe-ccps", variables.recipeId],
      });
    },
  });
}
