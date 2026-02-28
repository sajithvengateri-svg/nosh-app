import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useOrg } from "../contexts/OrgProvider";

export interface Ingredient {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
  cost_per_unit: number | null;
  supplier: string | null;
  par_level: number | null;
  current_stock: number | null;
  allergens: string[] | null;
  org_id: string | null;
}

export function useCreateIngredient() {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrg();

  return useMutation({
    mutationFn: async (ingredient: Partial<Ingredient>) => {
      const { data, error } = await supabase
        .from("ingredients")
        .insert({ ...ingredient, org_id: currentOrg?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useUpdateIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Ingredient> & { id: string }) => {
      const { data, error } = await supabase
        .from("ingredients")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useDeleteIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ingredients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}
