/**
 * Smart Defaults Engine
 *
 * Learns user tier preferences from their selection history
 * and auto-applies intelligent defaults on Nosh Run start.
 *
 * Logic:
 *   - Reads ds_user_tier_preferences (per-category counts)
 *   - Picks most-chosen tier per category when confidence is high
 *   - Confidence threshold: ≥60% AND total selections ≥3
 *   - Falls back to "good" when no confident default
 */

import { supabase } from "../supabase";
import type { Tier, TieredIngredient, IngredientCategory } from "./tierEngine";

// ── Types ──────────────────────────────────────────────────────────

interface TierPreferenceRow {
  ingredient_category: string;
  default_tier: Tier;
  times_chosen_good: number;
  times_chosen_better: number;
  times_chosen_best: number;
}

export interface SmartDefaults {
  /** Per-category default tier */
  categoryDefaults: Record<IngredientCategory, Tier>;
  /** Whether we have enough data to be confident */
  hasData: boolean;
}

const CONFIDENCE_THRESHOLD = 0.6;
const MIN_SELECTIONS = 3;

// ── Time Awareness ──────────────────────────────────────────────

interface TimeContext {
  hour: number;
  dayOfWeek: number;
  isWeekend: boolean;
}

/**
 * Bias tier defaults based on time of day and day of week.
 * Weekday evenings (5-8pm) → bias toward "good" (quick/cheap).
 * Weekends → allow "best" more liberally.
 */
export function applyTimeAwareness(
  defaults: SmartDefaults,
  ctx: TimeContext,
): SmartDefaults {
  if (!defaults.hasData) return defaults;

  const adjusted = { ...defaults.categoryDefaults };
  const isWeekdayEvening = !ctx.isWeekend && ctx.hour >= 17 && ctx.hour <= 20;

  for (const cat of Object.keys(adjusted) as IngredientCategory[]) {
    if (isWeekdayEvening && adjusted[cat] === "best") {
      // Weeknight rush — downgrade best to better
      adjusted[cat] = "better";
    }
    // Weekend: no downgrade — let learned preferences stand
  }

  return { categoryDefaults: adjusted, hasData: defaults.hasData };
}

// ── Detailed Confidence ─────────────────────────────────────────

export interface CategoryConfidence {
  category: IngredientCategory;
  tier: Tier;
  totalSelections: number;
  confidence: number;
  isUsual: boolean;
}

/**
 * Returns per-category confidence details from the DB.
 */
export async function getDetailedConfidence(): Promise<CategoryConfidence[]> {
  try {
    const { data, error } = await supabase
      .from("ds_user_tier_preferences")
      .select("ingredient_category, default_tier, times_chosen_good, times_chosen_better, times_chosen_best");

    if (error || !data) return [];

    return (data as TierPreferenceRow[]).map((row) => {
      const total = row.times_chosen_good + row.times_chosen_better + row.times_chosen_best;
      const counts: [Tier, number][] = [
        ["good", row.times_chosen_good],
        ["better", row.times_chosen_better],
        ["best", row.times_chosen_best],
      ];
      const [topTier, topCount] = counts.sort((a, b) => b[1] - a[1])[0];
      const confidence = total > 0 ? topCount / total : 0;

      return {
        category: row.ingredient_category as IngredientCategory,
        tier: topTier,
        totalSelections: total,
        confidence,
        isUsual: confidence >= CONFIDENCE_THRESHOLD && total >= MIN_SELECTIONS,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Wipe all learned tier preferences and smart defaults logs.
 */
export async function resetSmartDefaults(): Promise<void> {
  await Promise.all([
    supabase.from("ds_user_tier_preferences").delete().neq("ingredient_category", ""),
    supabase.from("ds_smart_defaults_log").delete().neq("id", ""),
  ]);
}

// ── Core Functions ─────────────────────────────────────────────────

/**
 * Fetch user tier preferences from the DB and compute smart defaults.
 */
export async function buildSmartDefaults(): Promise<SmartDefaults> {
  const fallback: SmartDefaults = {
    categoryDefaults: {
      protein: "good",
      produce: "good",
      dairy: "good",
      pantry: "good",
      spice: "good",
      sauce: "good",
      herbs: "good",
      other: "good",
    },
    hasData: false,
  };

  try {
    const { data, error } = await supabase
      .from("ds_user_tier_preferences")
      .select("ingredient_category, default_tier, times_chosen_good, times_chosen_better, times_chosen_best");

    if (error || !data || data.length === 0) return fallback;

    const defaults = { ...fallback.categoryDefaults };
    let hasAnyData = false;

    for (const row of data as TierPreferenceRow[]) {
      const category = row.ingredient_category as IngredientCategory;
      const total = row.times_chosen_good + row.times_chosen_better + row.times_chosen_best;

      if (total < MIN_SELECTIONS) continue;

      // Pick the tier with highest selection count
      const counts: [Tier, number][] = [
        ["good", row.times_chosen_good],
        ["better", row.times_chosen_better],
        ["best", row.times_chosen_best],
      ];
      const [topTier, topCount] = counts.sort((a, b) => b[1] - a[1])[0];

      // Only apply if confidence is above threshold
      if (topCount / total >= CONFIDENCE_THRESHOLD) {
        defaults[category] = topTier;
        hasAnyData = true;
      }
    }

    return { categoryDefaults: defaults, hasData: hasAnyData };
  } catch {
    return fallback;
  }
}

/**
 * Apply smart defaults to a basket's tiered ingredients.
 * Only applies to unlocked items. Respects existing locks.
 */
export function applySmartDefaults(
  items: TieredIngredient[],
  defaults: SmartDefaults,
): TieredIngredient[] {
  if (!defaults.hasData) return items;

  return items.map((item) => {
    if (item.isLocked) return item;

    const preferredTier = defaults.categoryDefaults[item.category] ?? "good";
    const hasOption = item.options.some((o) => o.tier === preferredTier);

    return hasOption ? { ...item, selectedTier: preferredTier } : item;
  });
}

/**
 * Record a user's tier selection for learning.
 * Called when a Nosh Run completes — records all final tier choices.
 */
export async function recordTierSelections(
  items: TieredIngredient[],
): Promise<void> {
  // Group selections by category
  const categorySelections = new Map<IngredientCategory, Tier[]>();

  for (const item of items) {
    const existing = categorySelections.get(item.category) ?? [];
    existing.push(item.selectedTier);
    categorySelections.set(item.category, existing);
  }

  // Upsert each category's counts
  for (const [category, selections] of categorySelections) {
    const good = selections.filter((t) => t === "good").length;
    const better = selections.filter((t) => t === "better").length;
    const best = selections.filter((t) => t === "best").length;

    // Most-chosen tier becomes the default
    const counts: [Tier, number][] = [
      ["good", good],
      ["better", better],
      ["best", best],
    ];
    const topTier = counts.sort((a, b) => b[1] - a[1])[0][0];

    await supabase.from("ds_user_tier_preferences").upsert(
      {
        ingredient_category: category,
        default_tier: topTier,
        times_chosen_good: good,
        times_chosen_better: better,
        times_chosen_best: best,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,ingredient_category" },
    );
  }
}
