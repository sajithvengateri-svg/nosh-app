import type { StoreMode } from "./types/store.types";

/**
 * Defines which app‐registry keys are available per store mode.
 * `null` means "all modules available".
 */
export const MODE_MODULES: Record<StoreMode, string[] | null> = {
  home_cook: ["chef", "money", "quiet"],
  food_safety: ["chef", "quiet"],
  restaurant: null,
  cafe: null,
  bar: null,
  hotel: null,
  catering: null,
};

/**
 * Feature‐level slugs allowed per mode (for sidebar/nav filtering).
 * `null` means all features available.
 */
export const MODE_FEATURES: Record<StoreMode, string[] | null> = {
  home_cook: [
    "dashboard",
    "recipes",
    "kitchen",
    "todo",
    "food-safety",
    "cheatsheets",
    "money-lite",
    "settings",
    "feedback",
    "games",
  ],
  food_safety: [
    "dashboard",
    "food-safety",
    "training",
    "settings",
    "feedback",
  ],
  restaurant: null,
  cafe: null,
  bar: null,
  hotel: null,
  catering: null,
};

/** Whether this mode supports team features */
export function modeSupportsTeam(mode: StoreMode): boolean {
  // All modes support teams; home_cook has an optional solo toggle
  return true;
}

/** Check if an app key is available in a given mode */
export function isAppAvailable(appKey: string, mode: StoreMode): boolean {
  const allowed = MODE_MODULES[mode];
  return allowed === null || allowed.includes(appKey);
}

/** Check if a feature slug is available in a given mode */
export function isFeatureAvailable(featureSlug: string, mode: StoreMode): boolean {
  const allowed = MODE_FEATURES[mode];
  return allowed === null || allowed.includes(featureSlug);
}

/** Is this mode the "lite" home cook experience? */
export function isHomeCookMode(mode: StoreMode): boolean {
  return mode === "home_cook";
}

/** Is this mode the food safety / compliance experience? */
export function isEatSafeMode(mode: StoreMode): boolean {
  return mode === "food_safety";
}
