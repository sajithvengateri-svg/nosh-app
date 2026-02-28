/**
 * Weekly Shopping Engine — Ingredient Consolidation + Three-Tier Pricing
 *
 * Takes a set of recipes from a weekly plan and produces a single
 * deduplicated shopping list grouped by supermarket section, with
 * Good / Better / Best pricing tiers.
 *
 * No store imports — pure data in, list out.
 */

import type { Recipe, RecipeIngredient } from "../stores/recipeStore";
import type { PantryItem } from "../stores/pantryStore";
import type { SeedVendor } from "../../data/seedVendors";
import type { TieredIngredient, Tier } from "./tierEngine";
import { categoriseIngredient, calculateTotals } from "./tierEngine";
import { SUPERMARKET_PRICES } from "../../data/seedSupermarketPrices";
import { areUnitsCompatible, convertUnit } from "../utils/unitConversion";

// ── Types ────────────────────────────────────────────────────────

export interface ConsolidatedIngredient {
  name: string;
  normalisedName: string;
  totalQuantity: number;
  unit: string;
  supermarketSection: string;
  sourceRecipes: string[]; // recipe titles
  inPantry: boolean;
}

export interface WeeklyShoppingList {
  items: ConsolidatedIngredient[];
  tieredItems: TieredIngredient[];
  totals: { good: number; better: number; best: number; current: number };
  recipeCount: number;
  pantryItemsSkipped: number;
}

// ── Helpers ──────────────────────────────────────────────────────

function normalise(name: string): string {
  return name.toLowerCase().trim().replace(/s$/, "").replace(/fresh\s+/, "");
}

function findVendorMatches(
  ingredientName: string,
  vendors: SeedVendor[],
): { vendor: SeedVendor; product: SeedVendor["products"][0] }[] {
  const norm = normalise(ingredientName);
  const matches: { vendor: SeedVendor; product: SeedVendor["products"][0] }[] = [];

  for (const vendor of vendors) {
    for (const product of vendor.products) {
      const prodNorm = normalise(product.name);
      if (prodNorm.includes(norm) || norm.includes(prodNorm)) {
        matches.push({ vendor, product });
      }
    }
  }

  return matches;
}

// ── Core Functions ───────────────────────────────────────────────

/**
 * Consolidate ingredients from multiple recipes into a deduplicated list.
 * Groups by normalised name, sums compatible units, marks pantry items.
 */
export function consolidateWeeklyIngredients(
  recipes: Recipe[],
  pantryItems: PantryItem[],
): ConsolidatedIngredient[] {
  const pantrySet = new Set(pantryItems.map((i) => normalise(i.name)));

  // Group: normalisedName → { name, qty, unit, section, recipes }
  const groups = new Map<
    string,
    {
      displayName: string;
      quantities: { qty: number; unit: string }[];
      supermarketSection: string;
      sourceRecipes: Set<string>;
    }
  >();

  for (const recipe of recipes) {
    for (const ing of recipe.ingredients ?? []) {
      if (ing.is_pantry_staple) continue;

      const norm = normalise(ing.name);
      const existing = groups.get(norm);

      if (existing) {
        existing.quantities.push({
          qty: ing.quantity ?? 1,
          unit: ing.unit ?? "each",
        });
        existing.sourceRecipes.add(recipe.title);
      } else {
        groups.set(norm, {
          displayName: ing.name,
          quantities: [{ qty: ing.quantity ?? 1, unit: ing.unit ?? "each" }],
          supermarketSection: ing.supermarket_section ?? "other",
          sourceRecipes: new Set([recipe.title]),
        });
      }
    }
  }

  // Consolidate quantities per group
  const result: ConsolidatedIngredient[] = [];

  for (const [norm, group] of groups) {
    // Try to sum all quantities into one unit
    const firstUnit = group.quantities[0].unit;
    let canConsolidate = true;
    let totalQty = 0;

    for (const { qty, unit } of group.quantities) {
      if (unit === firstUnit) {
        totalQty += qty;
      } else if (areUnitsCompatible(unit, firstUnit)) {
        const converted = convertUnit(qty, unit, firstUnit);
        if (converted !== null) {
          totalQty += converted;
        } else {
          canConsolidate = false;
          break;
        }
      } else {
        canConsolidate = false;
        break;
      }
    }

    if (canConsolidate) {
      result.push({
        name: group.displayName,
        normalisedName: norm,
        totalQuantity: Math.round(totalQty * 100) / 100,
        unit: firstUnit,
        supermarketSection: group.supermarketSection,
        sourceRecipes: Array.from(group.sourceRecipes),
        inPantry: pantrySet.has(norm),
      });
    } else {
      // Incompatible units — list as separate line items per unit
      const unitGroups = new Map<string, number>();
      for (const { qty, unit } of group.quantities) {
        unitGroups.set(unit, (unitGroups.get(unit) ?? 0) + qty);
      }

      for (const [unit, qty] of unitGroups) {
        result.push({
          name: group.displayName,
          normalisedName: norm,
          totalQuantity: Math.round(qty * 100) / 100,
          unit,
          supermarketSection: group.supermarketSection,
          sourceRecipes: Array.from(group.sourceRecipes),
          inPantry: pantrySet.has(norm),
        });
      }
    }
  }

  // Sort by section → name
  return result.sort((a, b) => {
    const sectionCmp = a.supermarketSection.localeCompare(b.supermarketSection);
    if (sectionCmp !== 0) return sectionCmp;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Build a full weekly shopping list with three-tier pricing.
 * Filters out pantry items, applies Good/Better/Best from
 * supermarket seed data + vendor matches.
 */
export function buildWeeklyTieredList(
  recipes: Recipe[],
  pantryItems: PantryItem[],
  vendors: SeedVendor[],
): WeeklyShoppingList {
  const consolidated = consolidateWeeklyIngredients(recipes, pantryItems);

  const pantrySkipped = consolidated.filter((c) => c.inPantry);
  const toBuy = consolidated.filter((c) => !c.inPantry);

  // Build TieredIngredient for each item to buy
  const tieredItems: TieredIngredient[] = toBuy.map((item) => {
    // Create a synthetic RecipeIngredient for the tier engine
    const syntheticIng: RecipeIngredient = {
      id: item.normalisedName,
      recipe_id: "",
      name: item.name,
      quantity: item.totalQuantity,
      unit: item.unit,
      is_pantry_staple: false,
      sort_order: 0,
      supermarket_section: item.supermarketSection,
    };

    const category = categoriseIngredient(syntheticIng);
    const norm = normalise(item.name);

    // Find supermarket pricing
    const superPrice = SUPERMARKET_PRICES.find(
      (sp) =>
        normalise(sp.ingredientKey).includes(norm) ||
        norm.includes(normalise(sp.ingredientKey)),
    );

    const options: TieredIngredient["options"] = [];

    if (superPrice) {
      options.push({
        tier: "good" as Tier,
        source: superPrice.good.source,
        sourceType: "supermarket",
        productName: item.name,
        price: superPrice.good.price,
        unit: superPrice.good.unit,
      });

      if (superPrice.better) {
        options.push({
          tier: "better" as Tier,
          source: superPrice.better.source,
          sourceType: "supermarket",
          productName: item.name,
          price: superPrice.better.price,
          unit: superPrice.better.unit,
          tags: superPrice.better.tag ? [superPrice.better.tag] : undefined,
        });
      }
    } else {
      // Synthetic pricing
      const basePrice = syntheticIng.estimated_cost ?? 3.0;
      options.push({
        tier: "good" as Tier,
        source: "Aldi",
        sourceType: "supermarket",
        productName: item.name,
        price: Math.round(basePrice * 100) / 100,
        unit: item.unit,
      });
      options.push({
        tier: "better" as Tier,
        source: "Coles",
        sourceType: "supermarket",
        productName: item.name,
        price: Math.round(basePrice * 1.3 * 100) / 100,
        unit: item.unit,
      });
    }

    // Vendor match (best tier)
    const vendorMatches = findVendorMatches(item.name, vendors);
    if (vendorMatches.length > 0) {
      const best = vendorMatches.sort(
        (a, b) => b.vendor.rating - a.vendor.rating,
      )[0];
      options.push({
        tier: "best" as Tier,
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
      const betterPrice =
        options.find((o) => o.tier === "better")?.price ?? 3.9;
      options.push({
        tier: "best" as Tier,
        source: "Woolworths",
        sourceType: "supermarket",
        productName: `${item.name} (Premium)`,
        price: Math.round(betterPrice * 1.4 * 100) / 100,
        unit: item.unit,
        tags: ["premium"],
      });
    }

    return {
      ingredient: syntheticIng,
      category,
      options: options.sort((a, b) => a.price - b.price),
      selectedTier: "good" as Tier,
      isLocked: false,
    };
  });

  const totals = calculateTotals(tieredItems);

  return {
    items: consolidated,
    tieredItems,
    totals,
    recipeCount: recipes.length,
    pantryItemsSkipped: pantrySkipped.length,
  };
}
