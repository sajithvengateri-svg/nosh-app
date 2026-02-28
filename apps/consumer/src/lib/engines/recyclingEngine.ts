/**
 * Recipe Recycling Engine
 *
 * Cooldown rules:
 * - Swiped left (dismissed): permanent (never resurface)
 * - Cooked, rated >= 4: 21 days
 * - Cooked, rated 3: 30 days
 * - Cooked, rated <= 2: 60 days
 * - Favourited: never auto-resurface (user explicitly saved)
 *
 * Mistake check:
 * - If a dismissed recipe's cuisine matches user preferences,
 *   log it as a "mismatch dismiss" for the companion to ask about later.
 */

export interface MismatchDismiss {
  recipeId: string;
  recipeTitle: string;
  cuisine: string;
  dismissedAt: string; // ISO date
}

export interface RecipeCooldown {
  recipeId: string;
  reason: "dismissed" | "cooked" | "favourited";
  rating?: number;
  cooldownUntil: Date;
  recycledCount: number;
}

interface CooldownInput {
  reason: "dismissed" | "cooked" | "favourited";
  rating?: number;
}

export function calculateCooldownDate(input: CooldownInput): Date {
  const now = new Date();
  let days: number;

  switch (input.reason) {
    case "dismissed":
      days = 14;
      break;
    case "favourited":
      // Favourited recipes never auto-resurface
      days = 365 * 10; // effectively never
      break;
    case "cooked":
      if (input.rating !== undefined) {
        if (input.rating >= 4) days = 21;
        else if (input.rating === 3) days = 30;
        else days = 60;
      } else {
        days = 21; // default if no rating given
      }
      break;
    default:
      days = 14;
  }

  const cooldownDate = new Date(now);
  cooldownDate.setDate(cooldownDate.getDate() + days);
  return cooldownDate;
}

export function isRecipeInCooldown(
  recipeId: string,
  cooldowns: Map<string, RecipeCooldown>
): boolean {
  const cooldown = cooldowns.get(recipeId);
  if (!cooldown) return false;
  return new Date() < cooldown.cooldownUntil;
}

export function filterRecycledRecipes(
  recipeIds: string[],
  cooldowns: Map<string, RecipeCooldown>,
  favouriteIds: Set<string>
): string[] {
  return recipeIds.filter((id) => {
    // Favourited recipes are always hidden from feed recycling
    if (favouriteIds.has(id)) return false;
    return !isRecipeInCooldown(id, cooldowns);
  });
}

export function getRecycleBadge(
  cooldown: RecipeCooldown | undefined
): string | null {
  if (!cooldown) return null;
  if (cooldown.recycledCount === 0) return null;

  // Only show badge for recycled recipes that have returned from cooldown
  const now = new Date();
  if (now < cooldown.cooldownUntil) return null;

  if (cooldown.reason === "cooked" && cooldown.rating && cooldown.rating >= 4) {
    return "Back by popular demand";
  }
  return "Try again?";
}

/**
 * Check if a dismissed recipe is a "mismatch" — user likes this cuisine
 * but swiped it away. Returns a MismatchDismiss if so, null otherwise.
 */
export function checkDismissMismatch(
  recipeId: string,
  recipeTitle: string,
  recipeCuisine: string,
  userCuisinePrefs: string[],
  likedCuisines: string[],
): MismatchDismiss | null {
  if (!recipeCuisine) return null;
  const lower = recipeCuisine.toLowerCase();
  const allPreferred = [
    ...userCuisinePrefs.map((c) => c.toLowerCase()),
    ...likedCuisines.map((c) => c.toLowerCase()),
  ];
  if (allPreferred.includes(lower)) {
    return {
      recipeId,
      recipeTitle,
      cuisine: recipeCuisine,
      dismissedAt: new Date().toISOString(),
    };
  }
  return null;
}

/**
 * Find mismatches that are old enough to ask about (14+ days).
 */
export function getMatureMismatches(
  mismatches: MismatchDismiss[],
  minAgeDays = 14,
): MismatchDismiss[] {
  const cutoff = Date.now() - minAgeDays * 24 * 60 * 60 * 1000;
  return mismatches.filter((m) => new Date(m.dismissedAt).getTime() < cutoff);
}
