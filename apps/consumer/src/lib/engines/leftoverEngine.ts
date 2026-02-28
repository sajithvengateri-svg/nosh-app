/**
 * Leftover Intelligence Engine
 *
 * Tracks remaining portions after cooking, suggests recipes
 * that use leftover ingredients, and flags expiring items.
 */

import type { Recipe } from "../stores/recipeStore";

// ── Types ──────────────────────────────────────────────────────────

export interface LeftoverPortion {
  id: string;
  recipeId: string;
  recipeTitle: string;
  portionsRemaining: number;
  useBy: string | null;
  status: "available" | "used" | "discarded";
  createdAt: string;
}

export interface LeftoverSuggestion {
  recipe: Recipe;
  matchScore: number;
  matchedIngredients: string[];
}

// ── Core Functions ─────────────────────────────────────────────────

/**
 * Calculate leftover portions after cooking.
 */
export function calculateLeftovers(
  recipeServes: number,
  householdSize: number,
): number {
  const remaining = recipeServes - householdSize;
  return Math.max(0, remaining);
}

/**
 * Suggest recipes that could use leftover ingredients.
 * Scores based on ingredient overlap with the source recipe.
 */
export function suggestLeftoverRecipes(
  leftovers: LeftoverPortion[],
  allRecipes: Recipe[],
): LeftoverSuggestion[] {
  if (leftovers.length === 0) return [];

  const leftoverRecipeIds = new Set(leftovers.map((l) => l.recipeId));

  // Collect ingredient names from leftover source recipes
  const leftoverIngredients = new Set<string>();
  for (const recipe of allRecipes) {
    if (leftoverRecipeIds.has(recipe.id)) {
      for (const ing of recipe.ingredients ?? []) {
        leftoverIngredients.add(ing.name.toLowerCase());
      }
    }
  }

  if (leftoverIngredients.size === 0) return [];

  const suggestions: LeftoverSuggestion[] = [];

  for (const recipe of allRecipes) {
    if (leftoverRecipeIds.has(recipe.id)) continue;

    const matched: string[] = [];
    for (const ing of recipe.ingredients ?? []) {
      if (leftoverIngredients.has(ing.name.toLowerCase())) {
        matched.push(ing.name);
      }
    }

    if (matched.length >= 2) {
      const total = recipe.ingredients?.length ?? 1;
      suggestions.push({
        recipe,
        matchScore: matched.length / total,
        matchedIngredients: matched,
      });
    }
  }

  return suggestions.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
}

/**
 * Get leftovers that expire within N days.
 */
export function getExpiringLeftovers(
  leftovers: LeftoverPortion[],
  daysAhead: number = 2,
): LeftoverPortion[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + daysAhead);

  return leftovers.filter((l) => {
    if (l.status !== "available" || !l.useBy) return false;
    return new Date(l.useBy) <= cutoff;
  });
}
