/**
 * Feed Algorithm — The brain of NOSH
 *
 * Rules enforced:
 * 1. Feed-first: always produces cards, never empty
 * 2. Every recipe is workflow cards (scored, not filtered here)
 * 3. Companion never blocks feed (separate system)
 * 4. One vessel rule: reject multi-vessel recipes
 * 5. Pantry match on every recipe card
 * 6. Vendor cards max 1 in 10, contextual only
 * 7. First card is ALWAYS a recipe (Tonight's Pick)
 * 8. Never more than 3 recipe cards in a row without a different type
 * 9. Wine/cocktail cards appear AFTER recipe cards
 * 10. Weekend feeds lean adventure; weeknight feeds lean quick
 */

import type { FeedCardItem, FeedCardType } from "./FeedCard";
import type { Recipe } from "../../lib/stores/recipeStore";
import type { PantryItem } from "../../lib/stores/pantryStore";
import type { PersonalityType, PersonalityConstraints, RecipePersonalityTags } from "../../lib/engines/personalityEngine";
import type { RecipeCooldown } from "../../lib/engines/recyclingEngine";
import { isRecipeInCooldown } from "../../lib/engines/recyclingEngine";

// ── Context ────────────────────────────────────────────────────────

export interface FeedContext {
  // Time
  hour: number;           // 0-23
  dayOfWeek: number;      // 0=Sun, 6=Sat
  month: number;          // 0-11

  // User profile
  cuisinePrefs: string[];
  adventureLevel: number; // 1-4
  spiceLevel: number;     // 1-4
  weeknightMaxMinutes: number;
  weekendMaxMinutes: number;
  budgetPreference: "tight" | "moderate" | "flexible";

  // Pantry
  pantryItems: PantryItem[];

  // History
  recentCookIds: string[];  // last 14 days
  dismissedIds: string[];
  likedCuisines: string[];  // from cook log
  cooldowns?: Map<string, RecipeCooldown>;
  favouriteIds?: Set<string>;

  // Personality
  personalityType?: PersonalityType;
  personalityConstraints?: PersonalityConstraints;

  // Cook groups
  groupShareCards?: FeedCardItem[];

  // Nudge / DNA milestone cards
  noshDnaCards?: FeedCardItem[];
}

// ── Scoring ────────────────────────────────────────────────────────

interface ScoredCard {
  card: FeedCardItem;
  score: number;
}

const SEASON_MAP: Record<number, string[]> = {
  0: ["summer"], 1: ["summer"], 2: ["autumn"],
  3: ["autumn"], 4: ["winter"], 5: ["winter"],
  6: ["winter"], 7: ["winter"], 8: ["spring"],
  9: ["spring"], 10: ["summer"], 11: ["summer"],
};

function normalise(name: string): string {
  return name.toLowerCase().trim().replace(/s$/, "");
}

function getPantryMatch(recipe: Recipe, pantryItems: PantryItem[]): { have: number; total: number } {
  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    return { have: 0, total: 0 };
  }

  const pantryNormalised = new Set(pantryItems.map((i) => normalise(i.name)));
  const nonStaple = recipe.ingredients.filter((i) => !i.is_pantry_staple);
  let have = 0;

  for (const ing of nonStaple) {
    if (pantryNormalised.has(normalise(ing.name))) have++;
  }

  return { have, total: nonStaple.length };
}

function scoreRecipe(recipe: Recipe, ctx: FeedContext): number {
  let score = 0;
  const isWeekend = ctx.dayOfWeek === 0 || ctx.dayOfWeek === 6;
  const maxMinutes = isWeekend ? ctx.weekendMaxMinutes : ctx.weeknightMaxMinutes;

  // ── Relevance (0-30) ──
  // Cuisine preference match
  if (ctx.cuisinePrefs.includes(recipe.cuisine)) score += 15;
  if (ctx.likedCuisines.includes(recipe.cuisine)) score += 10;
  // Time fit
  if (recipe.total_time_minutes <= maxMinutes) score += 5;

  // ── Pantry match (0-20) ──
  const match = getPantryMatch(recipe, ctx.pantryItems);
  if (match.total > 0) {
    score += Math.round((match.have / match.total) * 20);
  }

  // ── Freshness (0-15) — penalise recently cooked ──
  if (ctx.recentCookIds.includes(recipe.id)) {
    score -= 15;
  }

  // ── Engagement prediction (0-15) ──
  if (recipe.avg_rating >= 4) score += 8;
  if (recipe.cooked_count > 50) score += 4;
  if (recipe.likes_count > 20) score += 3;

  // ── Diversity (0-10) ──
  // Adventure nudge on weekends
  if (isWeekend && recipe.adventure_level >= 3) score += 6;
  // Budget match
  if (ctx.budgetPreference === "tight" && recipe.cost_per_serve && recipe.cost_per_serve <= 4) score += 4;

  // ── Seasonality (0-10) ──
  const currentSeasons = SEASON_MAP[ctx.month] ?? [];
  if (recipe.season_tags.some((t) => currentSeasons.includes(t)) || recipe.season_tags.includes("all-year")) {
    score += 10;
  }

  // ── Time-of-day ──
  // Evening (17-21): dinner recipes score higher
  if (ctx.hour >= 17 && ctx.hour <= 21) score += 5;
  // Quick meals score higher on weeknights after 6pm
  if (!isWeekend && ctx.hour >= 18 && recipe.total_time_minutes <= 20) score += 5;

  // ── Spice match ──
  if (Math.abs(recipe.spice_level - ctx.spiceLevel) <= 1) score += 3;

  // ── Personality fit (0-20) ──
  if (ctx.personalityType && ctx.personalityConstraints) {
    const pc = ctx.personalityConstraints;
    // Time fit for personality (0-8)
    if (recipe.total_time_minutes <= pc.maxCookTimeWeekday) score += 8;
    else if (recipe.total_time_minutes <= pc.maxCookTimeWeekday + 10) score += 4;

    // Ingredient count fit (0-4)
    const ingCount = recipe.ingredients?.length ?? 8;
    if (ingCount <= pc.maxIngredients) score += 4;

    // Personality tag match (0-8)
    const tags = recipe.personality_tags as RecipePersonalityTags | undefined;
    if (tags) {
      const myTags = tags[ctx.personalityType];
      if (myTags?.eligible) score += 8;
    }
  }

  return Math.max(0, score);
}

// ── Assembly ───────────────────────────────────────────────────────

export function assembleFeed(
  recipes: Recipe[],
  ctx: FeedContext,
  vendorCards: FeedCardItem[] = [],
  tipCards: FeedCardItem[] = [],
  drinkCards: FeedCardItem[] = [],
  expiryCards: FeedCardItem[] = [],
): FeedCardItem[] {
  // ── RULE: One vessel — filter out any multi-vessel ──
  // (enforced at DB level, but double-check)
  const validRecipes = recipes.filter((r) => {
    if (ctx.dismissedIds.includes(r.id)) return false;
    // Use cooldown system if available
    if (ctx.cooldowns && isRecipeInCooldown(r.id, ctx.cooldowns)) return false;
    return true;
  });

  // Score all recipes
  const scored: ScoredCard[] = validRecipes.map((recipe) => {
    const pantryMatch = getPantryMatch(recipe, ctx.pantryItems);
    return {
      score: scoreRecipe(recipe, ctx),
      card: {
        id: recipe.id,
        type: "recipe" as FeedCardType,
        score: scoreRecipe(recipe, ctx),
        data: {
          id: recipe.id,
          title: recipe.title,
          description: recipe.description,
          hero_image_url: recipe.hero_image_url,
          cuisine: recipe.cuisine,
          vessel: recipe.vessel,
          total_time_minutes: recipe.total_time_minutes,
          serves: recipe.serves,
          cost_per_serve: recipe.cost_per_serve,
          spice_level: recipe.spice_level,
          chef_name: recipe.chef_name,
          avg_rating: recipe.avg_rating,
          cooked_count: recipe.cooked_count,
          // RULE: Pantry match is everywhere
          pantry_match: pantryMatch.total > 0 ? pantryMatch : undefined,
          personality_tags: recipe.personality_tags,
        },
      },
    };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // ── RULE: First card is ALWAYS a recipe (Tonight's Pick) ──
  const feed: FeedCardItem[] = [];
  if (scored.length > 0) {
    feed.push(scored[0].card);
  }

  // Interleave non-recipe cards
  let recipeIdx = 1;
  let consecutiveRecipes = 1;
  let tipIdx = 0;
  let drinkIdx = 0;
  let vendorCount = 0;
  let totalCards = 1;
  const maxCards = 30; // initial batch

  // Add expiry alerts near the top (if any)
  if (expiryCards.length > 0) {
    feed.push(expiryCards[0]);
    totalCards++;
  }

  // Add lifecycle guide card (if not completed)
  feed.push({
    id: "lifecycle_guide_1",
    type: "lifecycle_guide" as FeedCardType,
    data: { id: "lg1" },
  });
  totalCards++;

  // Add Nosh DNA milestone cards (if any)
  if (ctx.noshDnaCards && ctx.noshDnaCards.length > 0) {
    for (const dna of ctx.noshDnaCards) {
      feed.push(dna);
      totalCards++;
    }
  }

  // Add group shares (if any)
  if (ctx.groupShareCards && ctx.groupShareCards.length > 0) {
    for (const share of ctx.groupShareCards.slice(0, 2)) {
      feed.push(share);
      totalCards++;
    }
  }

  // Add weekly planner card
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const plannerDays = weekDays.map((dayName, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return {
      day: dayName,
      date: `${d.getDate()} ${monthNames[d.getMonth()]}`,
      recipe: undefined as string | undefined,
      isToday: d.toDateString() === now.toDateString(),
    };
  });

  // Pre-fill some days with top-scored recipes for a richer default
  const topRecipes = scored.slice(0, 4).map((s) => (s.card.data as any).title as string);
  if (topRecipes.length >= 1) plannerDays[0].recipe = topRecipes[0];
  if (topRecipes.length >= 2) plannerDays[1].recipe = topRecipes[1];
  if (topRecipes.length >= 3) plannerDays[3].recipe = topRecipes[2];
  if (topRecipes.length >= 4) plannerDays[5].recipe = topRecipes[3];

  feed.push({
    id: "weekly_planner_1",
    type: "weekly_planner" as FeedCardType,
    data: {
      id: "wp1",
      week_label: "This Week",
      days: plannerDays,
    },
  });
  totalCards++;

  // ── Photo gallery card — always present ──
  feed.push({
    id: "photo_gallery_1",
    type: "photo_gallery" as FeedCardType,
    data: { id: "pg1" },
  });
  totalCards++;

  while (totalCards < maxCards && recipeIdx < scored.length) {
    // ── RULE: Max 3 recipes in a row without a different type ──
    if (consecutiveRecipes >= 3) {
      // Insert a non-recipe card
      if (drinkIdx < drinkCards.length) {
        // ── RULE: Wine/cocktail after recipe cards ──
        feed.push(drinkCards[drinkIdx++]);
        consecutiveRecipes = 0;
        totalCards++;
      } else if (tipIdx < tipCards.length) {
        feed.push(tipCards[tipIdx++]);
        consecutiveRecipes = 0;
        totalCards++;
      }
    }

    // ── RULE: Vendor cards max 1 in 10, contextual ──
    if (
      vendorCards.length > vendorCount &&
      totalCards > 0 &&
      totalCards % 10 === 9
    ) {
      feed.push(vendorCards[vendorCount++]);
      consecutiveRecipes = 0;
      totalCards++;
      continue;
    }

    // Add next recipe
    if (recipeIdx < scored.length) {
      feed.push(scored[recipeIdx++].card);
      consecutiveRecipes++;
      totalCards++;
    }
  }

  return feed;
}
