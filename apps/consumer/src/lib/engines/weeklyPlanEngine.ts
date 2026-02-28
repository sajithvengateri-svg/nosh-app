/**
 * Weekly Plan Engine — Pure utility functions
 *
 * Generates a personality-aware 7-day dinner plan using a greedy fill
 * algorithm with variety constraints. Reuses scoring from
 * personalityEngine + pantry matching from ingredientSuggestionEngine.
 *
 * No store imports — pure data in, plan out.
 */

import type { Recipe } from "../stores/recipeStore";
import type { PantryItem } from "../stores/pantryStore";
import type {
  PersonalityType,
  PersonalityConstraints,
} from "./personalityEngine";
import {
  getDailyConstraints,
  scoreRecipeForPersonality,
} from "./personalityEngine";
import { matchRecipesToPantry } from "./ingredientSuggestionEngine";

// ── Types ────────────────────────────────────────────────────────

export type DayMode = "usual" | "mix_it_up" | "go_nuts" | "skip" | "leftover";

export interface PlanDay {
  dayOfWeek: number; // 0=Sun, 6=Sat
  date: string; // YYYY-MM-DD
  dayMode: DayMode;
  recipe: Recipe | null;
  usesLeftoversFrom?: string; // recipe title of source
  score: number;
}

export interface WeeklyPlanProposal {
  days: PlanDay[];
  totalEstimatedCost: number;
  pantryUtilisation: number; // 0-1
}

export interface PlanConstraints {
  personalityType: PersonalityType;
  personalityConstraints: PersonalityConstraints;
  dayModes: Record<number, DayMode>; // dayOfWeek → mode
  excludeRecipeIds: string[];
}

// ── Helpers ──────────────────────────────────────────────────────

function isWeekend(dayOfWeek: number): boolean {
  return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * Build an array of { date, dayOfWeek } for 7 consecutive days
 * starting from weekStartDate (expected Monday).
 */
function buildWeekDays(weekStartDate: string): { date: string; dayOfWeek: number }[] {
  const start = new Date(weekStartDate + "T00:00:00");
  const days: { date: string; dayOfWeek: number }[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    days.push({
      date: `${yyyy}-${mm}-${dd}`,
      dayOfWeek: d.getDay(), // 0=Sun … 6=Sat
    });
  }

  return days;
}

// ── Scoring ──────────────────────────────────────────────────────

/**
 * Score a recipe for a specific plan day (0-60 scale).
 *
 * Components:
 *  - Personality fit:  0-20 (from personalityEngine)
 *  - Pantry match:     0-20 (matchPercent / 5)
 *  - Day mode bonus:   0-20
 *  - Variety penalty:  -10 per recent cuisine repeat
 */
function scoreRecipeForDay(
  recipe: Recipe,
  dayOfWeek: number,
  weekend: boolean,
  constraints: PlanConstraints,
  pantryMatchPercent: number,
  usedCuisines: string[],
  usedRecipeIds: Set<string>,
): number {
  // Skip already-used recipes
  if (usedRecipeIds.has(recipe.id)) return -1;

  // Time fit check — must fit daily constraints
  const daily = getDailyConstraints(
    constraints.personalityType,
    dayOfWeek,
    weekend,
  );
  const maxTime = weekend
    ? daily.maxCookTimeWeekend
    : daily.maxCookTimeWeekday;

  if (recipe.total_time_minutes > maxTime + 15) return -1; // hard cutoff with 15 min grace

  let score = 0;

  // Personality score (0-20)
  score += scoreRecipeForPersonality(
    recipe,
    constraints.personalityType,
    constraints.personalityConstraints,
  );

  // Pantry match bonus (0-20)
  score += Math.round(pantryMatchPercent / 5);

  // Day mode bonus (0-20)
  const dayMode =
    constraints.dayModes[dayOfWeek] ?? "usual";

  switch (dayMode) {
    case "mix_it_up":
      if ((recipe.adventure_level ?? 1) >= 3) score += 15;
      else if ((recipe.adventure_level ?? 1) >= 2) score += 5;
      break;
    case "go_nuts":
      if ((recipe.adventure_level ?? 1) >= 4) score += 20;
      else if ((recipe.spice_level ?? 0) >= 3) score += 15;
      else if ((recipe.adventure_level ?? 1) >= 3) score += 10;
      break;
    case "usual":
      // Slight bonus for lower adventure (comfort food)
      if ((recipe.adventure_level ?? 1) <= 2) score += 5;
      break;
  }

  // Variety penalty — penalise if same cuisine appeared in last 2 days
  const lastTwo = usedCuisines.slice(-2);
  const cuisineLower = (recipe.cuisine ?? "").toLowerCase();
  for (const prev of lastTwo) {
    if (prev === cuisineLower) score -= 10;
  }

  // Time efficiency bonus — within daily limit is great
  if (recipe.total_time_minutes <= maxTime) {
    score += 3;
  }

  return Math.max(score, 0);
}

// ── Main Functions ───────────────────────────────────────────────

/**
 * Generate a 7-day plan proposal.
 *
 * Uses a greedy fill: for each day, score all eligible recipes and
 * pick the highest-scoring one. Ensures variety by tracking used
 * cuisines and recipe IDs.
 */
export function generateWeeklyPlan(
  recipes: Recipe[],
  pantryItems: PantryItem[],
  constraints: PlanConstraints,
  weekStartDate: string,
): WeeklyPlanProposal {
  const weekDays = buildWeekDays(weekStartDate);

  // Pre-compute pantry match for all recipes
  const pantryMatches = matchRecipesToPantry(recipes, pantryItems);
  const pantryMap = new Map<string, number>();
  for (const m of pantryMatches) {
    pantryMap.set(m.recipe.id, m.matchPercent);
  }

  // Build eligible recipe pool (exclude blacklisted)
  const excludeSet = new Set(constraints.excludeRecipeIds);
  const pool = recipes.filter((r) => !excludeSet.has(r.id));

  const usedRecipeIds = new Set<string>();
  const usedCuisines: string[] = [];
  const days: PlanDay[] = [];

  // Track leftover source for "leftover" day mode
  let lastCookedRecipe: Recipe | null = null;

  for (const { date, dayOfWeek } of weekDays) {
    const dayMode = constraints.dayModes[dayOfWeek] ?? "usual";

    // Skip day
    if (dayMode === "skip") {
      days.push({
        dayOfWeek,
        date,
        dayMode,
        recipe: null,
        score: 0,
      });
      continue;
    }

    // Leftover day — link to nearest prior cooked day
    if (dayMode === "leftover") {
      if (lastCookedRecipe && lastCookedRecipe.leftover_ideas.length > 0) {
        days.push({
          dayOfWeek,
          date,
          dayMode,
          recipe: null,
          usesLeftoversFrom: lastCookedRecipe.title,
          score: 0,
        });
      } else {
        // No suitable leftover source — treat as usual
        // Fall through to normal scoring below
        const fallback = pickBestRecipe(
          pool,
          dayOfWeek,
          isWeekend(dayOfWeek),
          constraints,
          pantryMap,
          usedCuisines,
          usedRecipeIds,
          false,
        );

        if (fallback) {
          usedRecipeIds.add(fallback.recipe.id);
          usedCuisines.push((fallback.recipe.cuisine ?? "").toLowerCase());
          lastCookedRecipe = fallback.recipe;
          days.push({
            dayOfWeek,
            date,
            dayMode: "usual",
            recipe: fallback.recipe,
            score: fallback.score,
          });
        } else {
          days.push({ dayOfWeek, date, dayMode, recipe: null, score: 0 });
        }
        continue;
      }
      continue;
    }

    // Normal day — score and pick
    const best = pickBestRecipe(
      pool,
      dayOfWeek,
      isWeekend(dayOfWeek),
      constraints,
      pantryMap,
      usedCuisines,
      usedRecipeIds,
      false,
    );

    if (best) {
      usedRecipeIds.add(best.recipe.id);
      usedCuisines.push((best.recipe.cuisine ?? "").toLowerCase());
      lastCookedRecipe = best.recipe;
      days.push({
        dayOfWeek,
        date,
        dayMode,
        recipe: best.recipe,
        score: best.score,
      });
    } else {
      // Relax constraints and try again
      const relaxed = pickBestRecipe(
        pool,
        dayOfWeek,
        isWeekend(dayOfWeek),
        constraints,
        pantryMap,
        usedCuisines,
        usedRecipeIds,
        true,
      );

      if (relaxed) {
        usedRecipeIds.add(relaxed.recipe.id);
        usedCuisines.push((relaxed.recipe.cuisine ?? "").toLowerCase());
        lastCookedRecipe = relaxed.recipe;
        days.push({
          dayOfWeek,
          date,
          dayMode,
          recipe: relaxed.recipe,
          score: relaxed.score,
        });
      } else {
        days.push({ dayOfWeek, date, dayMode, recipe: null, score: 0 });
      }
    }
  }

  // Compute aggregate stats
  const cookedDays = days.filter((d) => d.recipe);
  const totalEstimatedCost = cookedDays.reduce(
    (sum, d) =>
      sum + (d.recipe?.cost_per_serve ?? 5) * (d.recipe?.serves ?? 2),
    0,
  );

  const totalPantryMatch = cookedDays.reduce(
    (sum, d) => sum + (pantryMap.get(d.recipe!.id) ?? 0),
    0,
  );
  const pantryUtilisation =
    cookedDays.length > 0
      ? Math.round((totalPantryMatch / cookedDays.length) * 100) / 10000
      : 0;

  return { days, totalEstimatedCost, pantryUtilisation };
}

/**
 * Swap one day with the next-best alternative recipe.
 */
export function swapDay(
  proposal: WeeklyPlanProposal,
  dayIndex: number,
  recipes: Recipe[],
  pantryItems: PantryItem[],
  constraints: PlanConstraints,
): WeeklyPlanProposal {
  const day = proposal.days[dayIndex];
  if (!day || day.dayMode === "skip" || day.dayMode === "leftover") {
    return proposal;
  }

  // Pre-compute pantry matches
  const pantryMatches = matchRecipesToPantry(recipes, pantryItems);
  const pantryMap = new Map<string, number>();
  for (const m of pantryMatches) {
    pantryMap.set(m.recipe.id, m.matchPercent);
  }

  // Collect already-used recipe IDs (excluding the day being swapped)
  const usedRecipeIds = new Set<string>();
  for (let i = 0; i < proposal.days.length; i++) {
    if (i === dayIndex) continue;
    if (proposal.days[i].recipe) {
      usedRecipeIds.add(proposal.days[i].recipe!.id);
    }
  }

  // Also exclude the current recipe so we get something different
  if (day.recipe) {
    usedRecipeIds.add(day.recipe.id);
  }

  // Build cuisine history from surrounding days
  const usedCuisines: string[] = [];
  for (let i = Math.max(0, dayIndex - 2); i < dayIndex; i++) {
    if (proposal.days[i].recipe) {
      usedCuisines.push(
        (proposal.days[i].recipe!.cuisine ?? "").toLowerCase(),
      );
    }
  }

  const excludeSet = new Set(constraints.excludeRecipeIds);
  const pool = recipes.filter((r) => !excludeSet.has(r.id));

  const best = pickBestRecipe(
    pool,
    day.dayOfWeek,
    isWeekend(day.dayOfWeek),
    constraints,
    pantryMap,
    usedCuisines,
    usedRecipeIds,
    false,
  );

  if (!best) {
    // Try relaxed
    const relaxed = pickBestRecipe(
      pool,
      day.dayOfWeek,
      isWeekend(day.dayOfWeek),
      constraints,
      pantryMap,
      usedCuisines,
      usedRecipeIds,
      true,
    );
    if (!relaxed) return proposal; // No alternative found

    const newDays = [...proposal.days];
    newDays[dayIndex] = { ...day, recipe: relaxed.recipe, score: relaxed.score };
    return recomputeStats(newDays, pantryMap);
  }

  const newDays = [...proposal.days];
  newDays[dayIndex] = { ...day, recipe: best.recipe, score: best.score };
  return recomputeStats(newDays, pantryMap);
}

// ── Internal helpers ─────────────────────────────────────────────

function pickBestRecipe(
  pool: Recipe[],
  dayOfWeek: number,
  weekend: boolean,
  constraints: PlanConstraints,
  pantryMap: Map<string, number>,
  usedCuisines: string[],
  usedRecipeIds: Set<string>,
  relaxed: boolean,
): { recipe: Recipe; score: number } | null {
  let bestRecipe: Recipe | null = null;
  let bestScore = -1;

  for (const recipe of pool) {
    const pantryPercent = pantryMap.get(recipe.id) ?? 0;

    let score = scoreRecipeForDay(
      recipe,
      dayOfWeek,
      weekend,
      constraints,
      pantryPercent,
      relaxed ? [] : usedCuisines, // relax = ignore cuisine history
      usedRecipeIds,
    );

    if (score < 0) continue;

    if (score > bestScore) {
      bestScore = score;
      bestRecipe = recipe;
    }
  }

  return bestRecipe ? { recipe: bestRecipe, score: bestScore } : null;
}

function recomputeStats(
  days: PlanDay[],
  pantryMap: Map<string, number>,
): WeeklyPlanProposal {
  const cookedDays = days.filter((d) => d.recipe);
  const totalEstimatedCost = cookedDays.reduce(
    (sum, d) =>
      sum + (d.recipe?.cost_per_serve ?? 5) * (d.recipe?.serves ?? 2),
    0,
  );
  const totalPantryMatch = cookedDays.reduce(
    (sum, d) => sum + (pantryMap.get(d.recipe!.id) ?? 0),
    0,
  );
  const pantryUtilisation =
    cookedDays.length > 0
      ? Math.round((totalPantryMatch / cookedDays.length) * 100) / 10000
      : 0;

  return { days, totalEstimatedCost, pantryUtilisation };
}
