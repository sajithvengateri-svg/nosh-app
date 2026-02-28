import { useState, useCallback, useEffect, useRef } from "react";
import { useRecipeStore } from "../lib/stores/recipeStore";
import { usePantryStore } from "../lib/stores/pantryStore";
import { useFeedStore } from "../lib/stores/feedStore";
import { useFavouritesStore } from "../lib/stores/favouritesStore";
import { usePersonalityStore } from "../lib/stores/personalityStore";
import { assembleFeed, FeedContext } from "../features/feed/feedAlgorithm";
import { useAuth } from "../contexts/AuthProvider";
import { supabase } from "../lib/supabase";
import type { RecipeCooldown } from "../lib/engines/recyclingEngine";

/**
 * useFeedEngine — connects recipeStore + pantryStore + profile → feedAlgorithm → feedStore
 *
 * Call `refreshFeed()` to re-score and rebuild the card list.
 * The hook auto-refreshes when recipes, pantry, or profile change.
 */
export function useFeedEngine() {
  const { profile } = useAuth();

  const recipes = useRecipeStore((s) => s.recipes);
  const fetchRecipes = useRecipeStore((s) => s.fetchRecipes);
  const isLoadingRecipes = useRecipeStore((s) => s.isLoading);

  const pantryItems = usePantryStore((s) => s.items);
  const fetchPantry = usePantryStore((s) => s.fetchPantry);

  const cards = useFeedStore((s) => s.cards);
  const setCards = useFeedStore((s) => s.setCards);
  const dismissedIds = useFeedStore((s) => s.dismissedIds);

  const cookLog = useFavouritesStore((s) => s.cookLog);

  const personalityProfile = usePersonalityStore((s) => s.profile);
  const personalityConstraints = usePersonalityStore((s) => s.constraints);
  const fetchPersonality = usePersonalityStore((s) => s.fetchProfile);

  const [cooldowns, setCooldowns] = useState<Map<string, RecipeCooldown>>(new Map());
  const hasInitialised = useRef(false);

  // Build context from current state + user profile
  const buildContext = useCallback((): FeedContext => {
    const now = new Date();

    // Recent cook IDs from cook log (last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const recentCookIds = cookLog
      .filter((c) => new Date(c.cooked_at) >= fourteenDaysAgo)
      .map((c) => c.recipe_id);

    // Liked cuisines from cook log (rated 4+)
    const likedCuisines = [
      ...new Set(
        cookLog
          .filter((c) => c.rating && c.rating >= 4 && c.recipe?.cuisine)
          .map((c) => c.recipe!.cuisine)
      ),
    ];

    return {
      hour: now.getHours(),
      dayOfWeek: now.getDay(),
      month: now.getMonth(),

      // User profile preferences (from onboarding)
      cuisinePrefs: profile?.cuisine_preferences ?? [],
      adventureLevel: profile?.adventure_level ?? 2,
      spiceLevel: profile?.spice_level ?? 2,
      weeknightMaxMinutes: profile?.weeknight_max_minutes ?? 30,
      weekendMaxMinutes: profile?.weekend_max_minutes ?? 60,
      budgetPreference: profile?.budget_preference ?? "moderate",

      pantryItems,
      recentCookIds,
      dismissedIds: Array.from(dismissedIds),
      likedCuisines,

      // Personality
      personalityType: personalityProfile?.primary,
      personalityConstraints: personalityConstraints ?? undefined,

      // Cooldowns
      cooldowns: cooldowns.size > 0 ? cooldowns : undefined,
    };
  }, [pantryItems, dismissedIds, profile, cookLog, personalityProfile, personalityConstraints, cooldowns]);

  // Re-assemble feed
  const refreshFeed = useCallback(() => {
    if (recipes.length === 0) return;

    const ctx = buildContext();
    const feed = assembleFeed(recipes, ctx);
    setCards(feed);
  }, [recipes, buildContext, setCards]);

  // Fetch cooldowns from DB
  const fetchCooldowns = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("ds_recipe_cooldowns")
      .select("recipe_id, reason, rating, cooldown_until")
      .gte("cooldown_until", today);

    if (data && data.length > 0) {
      const map = new Map<string, RecipeCooldown>();
      for (const row of data) {
        map.set(row.recipe_id, {
          recipeId: row.recipe_id,
          reason: row.reason,
          rating: row.rating ?? undefined,
          cooldownUntil: new Date(row.cooldown_until),
          recycledCount: 0,
        });
      }
      setCooldowns(map);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    if (!hasInitialised.current) {
      hasInitialised.current = true;
      fetchRecipes();
      fetchPantry();
      fetchPersonality();
      fetchCooldowns();
    }
  }, [fetchRecipes, fetchPantry, fetchPersonality, fetchCooldowns]);

  // Re-build feed when recipes, pantry, or profile change
  useEffect(() => {
    if (recipes.length > 0) {
      refreshFeed();
    }
  }, [recipes, pantryItems, profile, personalityProfile, refreshFeed]);

  return {
    cards,
    isLoading: isLoadingRecipes,
    refreshFeed,
  };
}
