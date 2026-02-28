/**
 * Smart Ingredient Suggestion Engine
 *
 * Architecture:
 * ┌──────────────┐     ┌──────────────────┐     ┌───────────────────┐
 * │ Pantry Store  │────▶│  Suggestion       │────▶│  Feed / Companion │
 * │ Recipe Store  │     │  Engine           │     │  Smart Bubbles    │
 * │ Cook Log      │     │                  │     │  Shopping List    │
 * └──────────────┘     └──────────────────┘     └───────────────────┘
 *
 * Capabilities:
 * 1. "You can make X" — recipes matchable from current pantry
 * 2. "Use it before it goes" — expiry-driven recipe suggestions
 * 3. "Swap X for Y" — intelligent substitution suggestions
 * 4. "You're missing X" — shopping list nudges for near-complete recipes
 * 5. "Pairs well with" — ingredient affinity scoring
 * 6. "Buy once, cook twice" — batch intelligence across recipes
 */

import type { Recipe, RecipeIngredient } from "../stores/recipeStore";
import type { PantryItem } from "../stores/pantryStore";

// ── Types ──────────────────────────────────────────────────────────

export interface IngredientMatch {
  recipe: Recipe;
  have: string[];        // ingredients user has
  missing: string[];     // ingredients user needs
  matchPercent: number;  // 0-100
  nearComplete: boolean; // missing <= 2 non-staple items
}

export interface SubstitutionSuggestion {
  original: string;
  substitute: string;
  notes: string;
  confidence: "high" | "medium" | "low";
}

export interface ExpiryAlert {
  item: PantryItem;
  daysUntilExpiry: number;
  suggestedRecipes: Recipe[];
}

export interface BatchSuggestion {
  sharedIngredient: string;
  recipes: Recipe[];
  savings: string; // "Buy 1kg chicken, cook 2 meals"
}

export interface PairingSuggestion {
  ingredient: string;
  pairsWith: string[];
  cuisine: string;
}

// ── Substitution Knowledge Base ────────────────────────────────────

const SUBSTITUTIONS: Record<string, SubstitutionSuggestion[]> = {
  // Proteins
  "chicken thighs": [
    { original: "chicken thighs", substitute: "chicken breast", notes: "Slightly drier, reduce cook time by 3 min", confidence: "high" },
    { original: "chicken thighs", substitute: "tofu", notes: "Press firm tofu 20 min first. Vegan swap.", confidence: "medium" },
  ],
  "chicken breast": [
    { original: "chicken breast", substitute: "chicken thighs", notes: "More forgiving, juicier. Add 2 min cook time.", confidence: "high" },
  ],
  "pork belly": [
    { original: "pork belly", substitute: "pork shoulder", notes: "Leaner, still works. Slice thin.", confidence: "high" },
    { original: "pork belly", substitute: "bacon", notes: "Different texture but smoky flavour works.", confidence: "medium" },
  ],
  "pork mince": [
    { original: "pork mince", substitute: "chicken mince", notes: "Lighter flavour, works well.", confidence: "high" },
    { original: "pork mince", substitute: "mushrooms", notes: "Finely diced. Vegan swap. Add soy sauce for umami.", confidence: "medium" },
  ],
  "beef sirloin": [
    { original: "beef sirloin", substitute: "rump steak", notes: "Cheaper cut, slice extra thin.", confidence: "high" },
    { original: "beef sirloin", substitute: "flank steak", notes: "Great flavour, must slice against the grain.", confidence: "high" },
  ],
  "pork sausages": [
    { original: "pork sausages", substitute: "chicken sausages", notes: "Lighter, still browns well.", confidence: "high" },
    { original: "pork sausages", substitute: "plant sausages", notes: "Vegan swap. Brown before adding to stew.", confidence: "medium" },
  ],
  "chorizo": [
    { original: "chorizo", substitute: "smoked paprika + bacon", notes: "2 tsp paprika + 100g bacon mimics chorizo flavour.", confidence: "medium" },
  ],
  "pancetta": [
    { original: "pancetta", substitute: "bacon", notes: "Almost identical in this context.", confidence: "high" },
  ],
  "spam": [
    { original: "spam", substitute: "ham", notes: "Slice thick, pan-fry for similar texture.", confidence: "high" },
    { original: "spam", substitute: "hot dogs", notes: "Classic army stew alternative.", confidence: "high" },
  ],

  // Dairy
  "cream": [
    { original: "cream", substitute: "coconut cream", notes: "Dairy-free. Slightly sweeter, works beautifully in curries.", confidence: "high" },
    { original: "cream", substitute: "yoghurt", notes: "Tangier. Add off-heat to prevent splitting.", confidence: "medium" },
  ],
  "cheddar": [
    { original: "cheddar", substitute: "gruyere", notes: "Nuttier, melts beautifully.", confidence: "high" },
    { original: "cheddar", substitute: "red leicester", notes: "Similar melt, more colour.", confidence: "high" },
  ],
  "parmesan": [
    { original: "parmesan", substitute: "pecorino", notes: "Sharper, saltier. Use slightly less.", confidence: "high" },
    { original: "parmesan", substitute: "nutritional yeast", notes: "Vegan swap. 2 tbsp per 30g parmesan.", confidence: "medium" },
  ],
  "butter": [
    { original: "butter", substitute: "olive oil", notes: "Different flavour profile but works. Use same volume.", confidence: "medium" },
    { original: "butter", substitute: "ghee", notes: "Higher smoke point, nutty flavour. Perfect swap.", confidence: "high" },
  ],

  // Sauces & Pastes
  "doubanjiang": [
    { original: "doubanjiang", substitute: "gochujang + miso", notes: "1 tbsp each. Not identical but captures fermented chilli essence.", confidence: "medium" },
  ],
  "gochugaru": [
    { original: "gochugaru", substitute: "chilli flakes + paprika", notes: "1:1 mix. Less fruity but good heat.", confidence: "medium" },
  ],
  "fish sauce": [
    { original: "fish sauce", substitute: "soy sauce", notes: "Less funky but provides salt and umami.", confidence: "medium" },
    { original: "fish sauce", substitute: "soy sauce + lime juice", notes: "Closer approximation. 1 tbsp soy + squeeze lime per tbsp fish sauce.", confidence: "medium" },
  ],
  "coconut milk": [
    { original: "coconut milk", substitute: "cream", notes: "Not dairy-free but creamy. Different flavour.", confidence: "medium" },
  ],
  "green curry paste": [
    { original: "green curry paste", substitute: "red curry paste", notes: "Different heat profile but same technique.", confidence: "high" },
  ],
  "kimchi": [
    { original: "kimchi", substitute: "sauerkraut + gochugaru", notes: "German-Korean fusion hack. Add chilli flakes.", confidence: "low" },
  ],

  // Herbs (generally interchangeable within families)
  "fresh coriander": [
    { original: "fresh coriander", substitute: "fresh parsley", notes: "For coriander-haters. Different flavour, same freshness.", confidence: "high" },
  ],
  "fresh Thai basil": [
    { original: "fresh Thai basil", substitute: "regular basil", notes: "Less anise flavour but still aromatic.", confidence: "medium" },
  ],
  "fresh mint": [
    { original: "fresh mint", substitute: "fresh Thai basil", notes: "Different but complementary in Vietnamese dishes.", confidence: "medium" },
  ],
};

// ── Ingredient Pairing Knowledge ───────────────────────────────────

const PAIRINGS: PairingSuggestion[] = [
  { ingredient: "chicken", pairsWith: ["lemon", "garlic", "thyme", "ginger", "soy sauce"], cuisine: "multi" },
  { ingredient: "pork", pairsWith: ["apple", "sage", "ginger", "soy sauce", "kimchi"], cuisine: "multi" },
  { ingredient: "beef", pairsWith: ["onion", "red wine", "mushroom", "star anise", "ginger"], cuisine: "multi" },
  { ingredient: "tofu", pairsWith: ["soy sauce", "ginger", "sesame oil", "chilli", "spring onion"], cuisine: "Asian" },
  { ingredient: "chickpeas", pairsWith: ["cumin", "lemon", "garlic", "coriander", "tomato"], cuisine: "Indian" },
  { ingredient: "coconut milk", pairsWith: ["lemongrass", "lime leaf", "chilli", "fish sauce", "basil"], cuisine: "Thai" },
  { ingredient: "pasta", pairsWith: ["garlic", "olive oil", "parmesan", "basil", "tomato"], cuisine: "Italian" },
  { ingredient: "rice", pairsWith: ["soy sauce", "sesame oil", "ginger", "spring onion", "egg"], cuisine: "Asian" },
  { ingredient: "potato", pairsWith: ["butter", "cream", "rosemary", "garlic", "mustard"], cuisine: "English" },
  { ingredient: "tomato", pairsWith: ["basil", "garlic", "olive oil", "oregano", "mozzarella"], cuisine: "Italian" },
];

// ── Core Functions ─────────────────────────────────────────────────

function normalise(name: string): string {
  return name.toLowerCase().trim().replace(/s$/, "").replace(/fresh\s+/, "");
}

/**
 * Match recipes to current pantry — "What can I cook tonight?"
 */
export function matchRecipesToPantry(
  recipes: Recipe[],
  pantryItems: PantryItem[],
): IngredientMatch[] {
  const pantrySet = new Set(pantryItems.map((i) => normalise(i.name)));

  return recipes
    .map((recipe) => {
      const nonStaple = (recipe.ingredients ?? []).filter((i) => !i.is_pantry_staple);
      const have: string[] = [];
      const missing: string[] = [];

      for (const ing of nonStaple) {
        if (pantrySet.has(normalise(ing.name))) {
          have.push(ing.name);
        } else {
          missing.push(ing.name);
        }
      }

      const total = nonStaple.length || 1;
      const matchPercent = Math.round((have.length / total) * 100);

      return {
        recipe,
        have,
        missing,
        matchPercent,
        nearComplete: missing.length <= 2,
      };
    })
    .sort((a, b) => b.matchPercent - a.matchPercent);
}

/**
 * Find recipes that use ingredients about to expire
 */
export function getExpiryAlerts(
  recipes: Recipe[],
  pantryItems: PantryItem[],
  daysThreshold = 3,
): ExpiryAlert[] {
  const now = new Date();
  const alerts: ExpiryAlert[] = [];

  for (const item of pantryItems) {
    if (!item.expiry_date) continue;

    const expiry = new Date(item.expiry_date);
    const daysUntil = Math.floor((expiry.getTime() - now.getTime()) / 86400000);

    if (daysUntil <= daysThreshold && daysUntil >= 0) {
      const normName = normalise(item.name);
      const matching = recipes.filter((r) =>
        r.ingredients?.some((i) => normalise(i.name) === normName)
      );

      if (matching.length > 0) {
        alerts.push({
          item,
          daysUntilExpiry: daysUntil,
          suggestedRecipes: matching.slice(0, 3),
        });
      }
    }
  }

  return alerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
}

/**
 * Get substitution suggestions for a given ingredient
 */
export function getSubstitutions(ingredientName: string): SubstitutionSuggestion[] {
  const norm = normalise(ingredientName);

  // Direct match
  if (SUBSTITUTIONS[norm]) return SUBSTITUTIONS[norm];

  // Partial match
  for (const [key, subs] of Object.entries(SUBSTITUTIONS)) {
    if (norm.includes(key) || key.includes(norm)) {
      return subs;
    }
  }

  return [];
}

/**
 * Find batch cooking opportunities — buy once, cook twice
 */
export function getBatchSuggestions(
  recipes: Recipe[],
  pantryItems: PantryItem[],
): BatchSuggestion[] {
  // Find expensive/protein ingredients shared across multiple recipes
  const ingredientToRecipes = new Map<string, Recipe[]>();

  for (const recipe of recipes) {
    for (const ing of recipe.ingredients ?? []) {
      if (ing.is_pantry_staple) continue;
      if (!ing.supermarket_section || !["meat", "deli", "seafood"].includes(ing.supermarket_section)) continue;

      const norm = normalise(ing.name);
      const existing = ingredientToRecipes.get(norm) ?? [];
      existing.push(recipe);
      ingredientToRecipes.set(norm, existing);
    }
  }

  const suggestions: BatchSuggestion[] = [];

  for (const [ingredient, recs] of ingredientToRecipes) {
    if (recs.length >= 2) {
      suggestions.push({
        sharedIngredient: ingredient,
        recipes: recs.slice(0, 3),
        savings: `Buy ${ingredient} once, cook ${recs.length} meals this week`,
      });
    }
  }

  return suggestions;
}

/**
 * Get ingredient pairings for recipe building
 */
export function getPairings(ingredientName: string): PairingSuggestion | null {
  const norm = normalise(ingredientName);
  return PAIRINGS.find((p) => norm.includes(p.ingredient) || p.ingredient.includes(norm)) ?? null;
}

/**
 * Generate smart shopping suggestions for near-complete recipes
 */
export function getShoppingSuggestions(
  recipes: Recipe[],
  pantryItems: PantryItem[],
  maxMissing = 3,
): { recipe: Recipe; missingItems: RecipeIngredient[] }[] {
  const pantrySet = new Set(pantryItems.map((i) => normalise(i.name)));

  return recipes
    .map((recipe) => {
      const nonStaple = (recipe.ingredients ?? []).filter((i) => !i.is_pantry_staple);
      const missingItems = nonStaple.filter((i) => !pantrySet.has(normalise(i.name)));
      return { recipe, missingItems };
    })
    .filter((r) => r.missingItems.length > 0 && r.missingItems.length <= maxMissing)
    .sort((a, b) => a.missingItems.length - b.missingItems.length);
}
