import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useOrg } from "../contexts/OrgProvider";

export interface Ingredient {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
  cost_per_unit: number | null;
  current_stock: number | null;
  par_level: number | null;
  supplier: string | null;
  allergens: string[] | null;
  org_id: string | null;
}

export function useIngredients() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  return useQuery<Ingredient[]>({
    queryKey: ["ingredients", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("ingredients")
        .select("*")
        .eq("org_id", orgId)
        .order("name");
      if (error) throw error;
      return (data as Ingredient[]) || [];
    },
    enabled: !!orgId,
  });
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
      return data as Ingredient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
    },
  });
}
