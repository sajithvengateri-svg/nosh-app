import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useOrg } from "../contexts/OrgProvider";

export interface RecipeSection {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  org_id: string;
}

export function useRecipeSections() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  return useQuery<RecipeSection[]>({
    queryKey: ["recipe-sections", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("recipe_sections")
        .select("*")
        .eq("org_id", orgId)
        .order("sort_order");
      if (error) throw error;
      return (data as RecipeSection[]) || [];
    },
    enabled: !!orgId,
  });
}

export function useCreateRecipeSection() {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrg();

  return useMutation({
    mutationFn: async (section: { name: string; color: string; sort_order?: number }) => {
      const { data, error } = await supabase
        .from("recipe_sections")
        .insert({ ...section, org_id: currentOrg?.id })
        .select()
        .single();
      if (error) throw error;
      return data as RecipeSection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipe-sections"] });
    },
  });
}

export function useUpdateRecipeSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RecipeSection> & { id: string }) => {
      const { data, error } = await supabase
        .from("recipe_sections")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as RecipeSection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipe-sections"] });
    },
  });
}

export function useDeleteRecipeSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recipe_sections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipe-sections"] });
    },
  });
}
