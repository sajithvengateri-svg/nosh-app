import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface PlatingStep {
  id?: string;
  recipe_id: string;
  step_number: number;
  instruction: string;
  image_url: string | null;
  sort_order: number;
}

export function useRecipePlatingSteps(recipeId: string | undefined) {
  return useQuery<PlatingStep[]>({
    queryKey: ["recipe-plating-steps", recipeId],
    queryFn: async () => {
      if (!recipeId) return [];
      const { data, error } = await supabase
        .from("recipe_plating_steps")
        .select("*")
        .eq("recipe_id", recipeId)
        .order("sort_order");
      if (error) throw error;
      return (data as PlatingStep[]) || [];
    },
    enabled: !!recipeId,
  });
}

export function useUpsertPlatingSteps() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipeId,
      steps,
    }: {
      recipeId: string;
      steps: { instruction: string; image_url: string | null; sort_order: number }[];
    }) => {
      const { error: deleteError } = await supabase
        .from("recipe_plating_steps")
        .delete()
        .eq("recipe_id", recipeId);
      if (deleteError) throw deleteError;

      if (steps.length === 0) return [];

      const rows = steps.map((step, idx) => ({
        recipe_id: recipeId,
        step_number: idx + 1,
        instruction: step.instruction,
        image_url: step.image_url,
        sort_order: step.sort_order,
      }));

      const { data, error } = await supabase
        .from("recipe_plating_steps")
        .insert(rows)
        .select();
      if (error) throw error;
      return (data as PlatingStep[]) || [];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["recipe-plating-steps", variables.recipeId] });
    },
  });
}
