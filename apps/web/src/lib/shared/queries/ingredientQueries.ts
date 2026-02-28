// Ingredient queries — extracted from Ingredients.tsx

import { supabase } from "../supabaseClient";

export async function fetchIngredients() {
  return supabase.from("ingredients").select("*").order("name");
}

export async function insertIngredient(payload: Record<string, unknown>) {
  return supabase.from("ingredients").insert(payload as any);
}

export async function updateIngredient(id: string, payload: Record<string, unknown>) {
  return supabase.from("ingredients").update(payload as any).eq("id", id);
}

export async function deleteIngredient(id: string) {
  return supabase.from("ingredients").delete().eq("id", id);
}

export async function fetchIngredientStock(ingredientId: string) {
  return supabase.from("ingredients").select("current_stock").eq("id", ingredientId).single();
}

export async function updateIngredientStock(ingredientId: string, newStock: number) {
  return supabase.from("ingredients").update({ current_stock: newStock }).eq("id", ingredientId);
}

export async function fetchIngredientsBasic() {
  return supabase.from("ingredients").select("id, name, unit");
}
