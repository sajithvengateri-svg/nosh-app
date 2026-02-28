import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useOrg } from "../contexts/OrgProvider";

export interface Recipe {
  id: string;
  name: string;
  description: string | null;
  category: string;
  prep_time: number | null;
  cook_time: number | null;
  servings: number | null;
  cost_per_serving: number | null;
  sell_price: number | null;
  target_food_cost_percent: number | null;
  image_url: string | null;
  tasting_notes: string | null;
  recipe_type: string;
  is_batch_recipe: boolean | null;
  allergens: string[] | null;
  ingredients: any;
  instructions: any;
  total_yield: number | null;
  yield_unit: string | null;
  shelf_life_days: number;
  shelf_life_hours: number;
  storage_temp: string | null;
  storage_notes: string | null;
  created_at: string;
  org_id: string | null;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  ingredient_id: string | null;
  quantity: number;
  unit: string;
  notes: string | null;
  ingredients?: {
    id: string;
    name: string;
    unit: string;
    cost_per_unit: number | null;
  } | null;
}

export function useRecipes() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  return useQuery<Recipe[]>({
    queryKey: ["recipes", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as Recipe[]) || [];
    },
    enabled: !!orgId,
  });
}

export function useRecipe(id: string | undefined) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  return useQuery<Recipe | null>({
    queryKey: ["recipe", id, orgId],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Recipe;
    },
    enabled: !!id && !!orgId,
  });
}

export function useRecipeIngredients(recipeId: string | undefined) {
  return useQuery<RecipeIngredient[]>({
    queryKey: ["recipe-ingredients", recipeId],
    queryFn: async () => {
      if (!recipeId) return [];
      const { data, error } = await supabase
        .from("recipe_ingredients")
        .select("*, ingredients(id, name, unit, cost_per_unit)")
        .eq("recipe_id", recipeId);
      if (error) throw error;
      return (data as RecipeIngredient[]) || [];
    },
    enabled: !!recipeId,
  });
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrg();

  return useMutation({
    mutationFn: async (recipe: Partial<Recipe>) => {
      const { data, error } = await supabase
        .from("recipes")
        .insert({ ...recipe, org_id: currentOrg?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Recipe> & { id: string }) => {
      const { data, error } = await supabase
        .from("recipes")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["recipe", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useUploadRecipeImage() {
  return useMutation({
    mutationFn: async ({ recipeId, uri }: { recipeId?: string; uri: string }) => {
      const ext = uri.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${recipeId || Date.now()}_${Date.now()}.${ext}`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const { error: uploadError } = await supabase.storage
        .from("recipe-images")
        .upload(fileName, blob, { contentType: `image/${ext}`, upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("recipe-images")
        .getPublicUrl(fileName);
      return urlData.publicUrl;
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recipes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}
