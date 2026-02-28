// Recipe queries — extracted from useScalableRecipes.ts

import { supabase } from "../supabaseClient";

export async function fetchRecipesForScaling() {
  const { data, error } = await supabase
    .from("recipes")
    .select(`
      id, name, category, servings, total_yield, yield_unit,
      prep_time, cook_time, sell_price, target_food_cost_percent,
      is_batch_recipe, batch_yield_quantity, batch_yield_unit
    `)
    .order("name");
  if (error) throw error;
  return data || [];
}

export async function fetchRecipeIngredientsWithDetails() {
  const { data, error } = await supabase
    .from("recipe_ingredients")
    .select(`
      id, recipe_id, quantity, unit, notes, ingredient_id,
      ingredients!inner ( id, name, category, unit, cost_per_unit )
    `);
  if (error) throw error;
  return data || [];
}

// ─── Recipe CRUD ──────────────────────────────────

export async function fetchRecipes() {
  return supabase.from("recipes").select("*").order("created_at", { ascending: false });
}

export async function insertRecipe(payload: Record<string, unknown>) {
  return supabase.from("recipes").insert(payload as any);
}

export async function updateRecipe(id: string, payload: Record<string, unknown>) {
  return supabase.from("recipes").update(payload as any).eq("id", id);
}

export async function deleteRecipe(id: string) {
  return supabase.from("recipes").delete().eq("id", id);
}

export async function insertRecipeIngredient(payload: Record<string, unknown>) {
  return supabase.from("recipe_ingredients").insert(payload as any);
}
