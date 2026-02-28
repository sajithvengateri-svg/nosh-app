/**
 * Three-Tier Engine — Good / Better / Best
 *
 * Every ingredient shows three options:
 *   🟢 Good   — Gets the job done. Cheapest.
 *   🟡 Better — Quality step up. Mid-range.
 *   🔴 Best   — Premium / local / artisan.
 *
 * No judgement. No upselling. Just options.
 */

import type { RecipeIngredient, Recipe } from "../stores/recipeStore";
import type { PantryItem } from "../stores/pantryStore";
import type { SeedVendor } from "../../data/seedVendors";
import { SUPERMARKET_PRICES } from "../../data/seedSupermarketPrices";

// ── Types ──────────────────────────────────────────────────────────

export type Tier = "good" | "better" | "best";

export interface TierOption {
  tier: Tier;
  source: string;
  sourceType: "supermarket" | "vendor";
  vendorId?: string;
  productName: string;
  price: number;
  unit: string;
  rating?: number;
  ratingCount?: number;
  isLoyalty?: boolean;
  tags?: string[];
}

export interface TieredIngredient {
  ingredient: RecipeIngredient;
  category: IngredientCategory;
  options: TierOption[];
  selectedTier: Tier;
  isLocked: boolean;
}

export interface NoshBasket {
  recipeId: string;
  recipeTitle: string;
  items: TieredIngredient[];
  totals: { good: number; better: number; best: number; current: number };
}

export type IngredientCategory =
  | "protein"
  | "produce"
  | "dairy"
  | "pantry"
  | "spice"
  | "sauce"
  | "herbs"
  | "other";

// ── Helpers ────────────────────────────────────────────────────────

function normalise(name: string): string {
  return name.toLowerCase().trim().replace(/s$/, "").replace(/fresh\s+/, "");
}

/**
 * Map supermarket_section → ingredient category for tier defaults
 */
export function categoriseIngredient(
  ingredient: RecipeIngredient,
): IngredientCategory {
  const section = (ingredient.supermarket_section ?? "").toLowerCase();
  if (["meat", "deli", "seafood", "poultry"].some((s) => section.includes(s)))
    return "protein";
  if (["produce", "vegetable", "fruit"].some((s) => section.includes(s)))
    return "produce";
  if (["dairy", "cheese", "milk"].some((s) => section.includes(s)))
    return "dairy";
  if (["herbs", "herb"].some((s) => section.includes(s))) return "herbs";
  if (["spice", "seasoning"].some((s) => section.includes(s))) return "spice";
  if (["sauce", "condiment", "paste"].some((s) => section.includes(s)))
    return "sauce";
  if (
    ["pantry", "tinned", "canned", "dried", "grain", "rice", "pasta"].some(
      (s) => section.includes(s),
    )
  )
    return "pantry";
  return "other";
}

/**
 * Find matching vendor products for an ingredient
 */
function findVendorMatches(
  ingredientName: string,
  recipeCuisine: string,
  vendors: SeedVendor[],
): { vendor: SeedVendor; product: SeedVendor["products"][0] }[] {
  const norm = normalise(ingredientName);
  const matches: { vendor: SeedVendor; product: SeedVendor["products"][0] }[] =
    [];

  for (const vendor of vendors) {
    for (const product of vendor.products) {
      const prodNorm = normalise(product.name);

      // Direct name match or partial overlap
      const nameMatch = prodNorm.includes(norm) || norm.includes(prodNorm);

      // Tag match
      const tagMatch = product.tags.some(
        (t) => normalise(t).includes(norm) || norm.includes(normalise(t)),
      );

      // Cuisine affinity
      const cuisineMatch = product.pairs_with_cuisines?.includes(recipeCuisine);

      if (nameMatch || (tagMatch && cuisineMatch)) {
        matches.push({ vendor, product });
      }
    }
  }

  return matches;
}

// ── Core Functions ─────────────────────────────────────────────────

/**
 * Build three-tier options for each missing ingredient in a recipe.
 */
export function buildTieredIngredients(
  recipe: Recipe,
  vendors: SeedVendor[],
  pantryItems: PantryItem[],
): TieredIngredient[] {
  const pantrySet = new Set(pantryItems.map((i) => normalise(i.name)));

  // Only non-staple ingredients the user doesn't have
  const missing = (recipe.ingredients ?? []).filter(
    (i) => !i.is_pantry_staple && !pantrySet.has(normalise(i.name)),
  );

  return missing.map((ingredient) => {
    const norm = normalise(ingredient.name);
    const category = categoriseIngredient(ingredient);
    const options: TierOption[] = [];

    // 1. Supermarket prices (good + better)
    const superPrice = SUPERMARKET_PRICES.find(
      (sp) =>
        normalise(sp.ingredientKey).includes(norm) ||
        norm.includes(normalise(sp.ingredientKey)),
    );

    if (superPrice) {
      options.push({
        tier: "good",
        source: superPrice.good.source,
        sourceType: "supermarket",
        productName: ingredient.name,
        price: superPrice.good.price,
        unit: superPrice.good.unit,
      });

      if (superPrice.better) {
        options.push({
          tier: "better",
          source: superPrice.better.source,
          sourceType: "supermarket",
          productName: ingredient.name,
          price: superPrice.better.price,
          unit: superPrice.better.unit,
          tags: superPrice.better.tag ? [superPrice.better.tag] : undefined,
        });
      }
    } else {
      // Fallback: generate synthetic supermarket price from recipe data
      const basePrice = ingredient.estimated_cost ?? 3.0;
      options.push({
        tier: "good",
        source: "Aldi",
        sourceType: "supermarket",
        productName: ingredient.name,
        price: Math.round(basePrice * 100) / 100,
        unit: ingredient.unit ?? "each",
      });
      options.push({
        tier: "better",
        source: "Coles",
        sourceType: "supermarket",
        productName: ingredient.name,
        price: Math.round(basePrice * 1.3 * 100) / 100,
        unit: ingredient.unit ?? "each",
      });
    }

    // 2. Vendor match (best)
    const vendorMatches = findVendorMatches(
      ingredient.name,
      recipe.cuisine,
      vendors,
    );

    if (vendorMatches.length > 0) {
      // Pick the highest-rated vendor
      const best = vendorMatches.sort(
        (a, b) => b.vendor.rating - a.vendor.rating,
      )[0];
      options.push({
        tier: "best",
        source: best.vendor.name,
        sourceType: "vendor",
        vendorId: best.vendor.id,
        productName: best.product.name,
        price: best.product.price,
        unit: best.product.unit,
        rating: best.vendor.rating,
        tags: best.product.tags,
      });
    } else {
      // No vendor match — create a premium supermarket option
      const betterPrice =
        options.find((o) => o.tier === "better")?.price ??
        (ingredient.estimated_cost ?? 3.0) * 1.3;
      options.push({
        tier: "best",
        source: "Woolworths",
        sourceType: "supermarket",
        productName: `${ingredient.name} (Premium)`,
        price: Math.round(betterPrice * 1.4 * 100) / 100,
        unit: ingredient.unit ?? "each",
        tags: ["premium"],
      });
    }

    return {
      ingredient,
      category,
      options: options.sort((a, b) => a.price - b.price),
      selectedTier: "good",
      isLocked: false,
    };
  });
}

/**
 * Calculate totals for all-good, all-better, all-best, and current mix.
 */
export function calculateTotals(items: TieredIngredient[]): {
  good: number;
  better: number;
  best: number;
  current: number;
} {
  let good = 0;
  let better = 0;
  let best = 0;
  let current = 0;

  for (const item of items) {
    const goodOpt = item.options.find((o) => o.tier === "good");
    const betterOpt = item.options.find((o) => o.tier === "better");
    const bestOpt = item.options.find((o) => o.tier === "best");
    const selectedOpt = item.options.find((o) => o.tier === item.selectedTier);

    good += goodOpt?.price ?? 0;
    better += betterOpt?.price ?? goodOpt?.price ?? 0;
    best += bestOpt?.price ?? betterOpt?.price ?? 0;
    current += selectedOpt?.price ?? goodOpt?.price ?? 0;
  }

  return {
    good: Math.round(good * 100) / 100,
    better: Math.round(better * 100) / 100,
    best: Math.round(best * 100) / 100,
    current: Math.round(current * 100) / 100,
  };
}

/**
 * Apply a preset across all unlocked items.
 */
export function applyPreset(
  items: TieredIngredient[],
  preset: "tight_week" | "balanced" | "treat",
): TieredIngredient[] {
  return items.map((item) => {
    if (item.isLocked) return item;

    let tier: Tier;
    switch (preset) {
      case "tight_week":
        tier = "good";
        break;
      case "balanced":
        tier =
          item.category === "pantry" || item.category === "other"
            ? "good"
            : "better";
        break;
      case "treat":
        tier =
          item.category === "pantry" || item.category === "other"
            ? "better"
            : "best";
        break;
    }

    // Only apply if that tier option exists
    const hasOption = item.options.some((o) => o.tier === tier);
    return { ...item, selectedTier: hasOption ? tier : item.selectedTier };
  });
}

/**
 * Apply slider position (0 = all good, 1 = all best). Skips locked items.
 */
export function applySliderPosition(
  items: TieredIngredient[],
  position: number,
): TieredIngredient[] {
  const clamped = Math.max(0, Math.min(1, position));

  return items.map((item) => {
    if (item.isLocked) return item;

    let tier: Tier;
    if (clamped < 0.33) {
      tier = "good";
    } else if (clamped < 0.67) {
      tier = "better";
    } else {
      tier = "best";
    }

    const hasOption = item.options.some((o) => o.tier === tier);
    return { ...item, selectedTier: hasOption ? tier : item.selectedTier };
  });
}
