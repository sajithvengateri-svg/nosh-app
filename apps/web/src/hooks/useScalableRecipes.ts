// Re-export ingredient costs cache from shared for backwards compatibility
export { ingredientCostsCache } from '@/lib/shared/state/productionStore';

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProductionStore } from "@/stores/productionStore";
import { ScalableRecipe, IngredientWithYield } from "@/types/production";
import { ingredientCostsCache } from '@/lib/shared/state/productionStore';

interface RecipeIngredientRow {
  id: string;
  quantity: number;
  unit: string;
  notes: string | null;
  ingredient_id: string;
  ingredients: {
    id: string;
    name: string;
    category: string;
    unit: string;
    cost_per_unit: number | null;
  };
}

/**
 * Fetches recipes from Supabase and converts them to ScalableRecipe format
 * for use in the production scaling system
 */
export const useScalableRecipes = () => {
  const setScalableRecipes = useProductionStore((state) => state.setScalableRecipes);

  const query = useQuery({
    queryKey: ["scalable-recipes"],
    queryFn: async () => {
      const { data: recipes, error: recipesError } = await supabase
        .from("recipes")
        .select(`
          id, name, category, servings, total_yield, yield_unit,
          prep_time, cook_time, sell_price, target_food_cost_percent,
          is_batch_recipe, batch_yield_quantity, batch_yield_unit
        `)
        .order("name");

      if (recipesError) throw recipesError;
      if (!recipes || recipes.length === 0) return [];

      const { data: recipeIngredients, error: ingredientsError } = await supabase
        .from("recipe_ingredients")
        .select(`
          id, recipe_id, quantity, unit, notes, ingredient_id,
          ingredients!inner ( id, name, category, unit, cost_per_unit )
        `);

      if (ingredientsError) throw ingredientsError;

      const ingredientsByRecipe = new Map<string, RecipeIngredientRow[]>();
      
      recipeIngredients?.forEach((ri) => {
        const ing = ri.ingredients as unknown as {
          id: string; name: string; category: string; unit: string; cost_per_unit: number | null;
        };
        
        if (ing && !ingredientCostsCache.has(ing.id)) {
          ingredientCostsCache.set(ing.id, {
            name: ing.name,
            price: Number(ing.cost_per_unit) || 0,
            unit: ing.unit,
          });
        }
        
        const existing = ingredientsByRecipe.get(ri.recipe_id) || [];
        existing.push(ri as unknown as RecipeIngredientRow);
        ingredientsByRecipe.set(ri.recipe_id, existing);
      });

      const scalableRecipes: ScalableRecipe[] = recipes.map((recipe) => {
        const recipeIngs = ingredientsByRecipe.get(recipe.id) || [];
        
        const ingredients: IngredientWithYield[] = recipeIngs.map((ri) => ({
          ingredientId: ri.ingredient_id,
          quantity: Number(ri.quantity) || 0,
          unit: ri.unit || "g",
          wastePercent: 5,
          cookingLossPercent: 0,
        }));

        return {
          id: recipe.id,
          name: recipe.name,
          category: recipe.category || "Main",
          baseServings: recipe.servings || 1,
          baseYieldWeight: recipe.is_batch_recipe 
            ? (recipe.batch_yield_quantity || recipe.total_yield || 1)
            : (recipe.total_yield || 1),
          yieldUnit: recipe.is_batch_recipe 
            ? (recipe.batch_yield_unit || recipe.yield_unit || "portions")
            : (recipe.yield_unit || "portions"),
          prepTime: `${recipe.prep_time || 0} min`,
          cookTime: `${recipe.cook_time || 0} min`,
          sellPrice: Number(recipe.sell_price) || 0,
          targetFoodCostPercent: Number(recipe.target_food_cost_percent) || 30,
          ingredients,
          shelfLifeDays: 3,
        };
      });

      return scalableRecipes;
    },
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (query.data) {
      setScalableRecipes(query.data);
    }
  }, [query.data, setScalableRecipes]);

  return query;
};
