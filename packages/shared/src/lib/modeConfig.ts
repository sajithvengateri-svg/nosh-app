import type { StoreMode, AppVariant, ComplianceFramework } from "../types/store.types.ts";
import {
  VARIANT_REGISTRY,
  STREAMS,
  getBaseFeatures,
  getReleaseModules,
  getCompliance,
  isCompliance,
} from "./variantRegistry.ts";

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
    "companion",
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

// ── Variant-level config (derived from registry) ────────────────────

/** Base features available at launch per app variant */
export const VARIANT_BASE_FEATURES: Record<AppVariant, string[] | null> =
  Object.fromEntries(
    Object.keys(VARIANT_REGISTRY).map((k) => [k, getBaseFeatures(k as AppVariant)])
  ) as Record<AppVariant, string[] | null>;

/** Modules that can be progressively released (shared across all EatSafe variants) */
export const EATSAFE_RELEASE_MODULES: string[] = STREAMS.eatsafe.releaseModules;

/** @deprecated Use getReleaseModules() from variantRegistry instead */
export const INDIA_RELEASE_MODULES: string[] = STREAMS.eatsafe.releaseModules;
/** @deprecated Use getReleaseModules() from variantRegistry instead */
export const UAE_RELEASE_MODULES: string[] = STREAMS.eatsafe.releaseModules;

/** Lookup: release-eligible modules per variant */
export const VARIANT_RELEASE_MODULES: Partial<Record<AppVariant, string[]>> =
  Object.fromEntries(
    Object.entries(VARIANT_REGISTRY)
      .map(([k, v]) => [k, getReleaseModules(k as AppVariant)])
      .filter(([_, mods]) => (mods as string[]).length > 0)
  );

/** Which compliance framework each variant uses */
export const VARIANT_COMPLIANCE: Record<AppVariant, ComplianceFramework> =
  Object.fromEntries(
    Object.keys(VARIANT_REGISTRY).map((k) => [k, getCompliance(k as AppVariant)])
  ) as Record<AppVariant, ComplianceFramework>;

/** Variants that launch as compliance-first */
export const COMPLIANCE_VARIANTS: AppVariant[] =
  (Object.keys(VARIANT_REGISTRY) as AppVariant[]).filter((k) => isCompliance(k));

/** Whether this variant is a compliance-first variant */
export function isComplianceVariant(variant: AppVariant): boolean {
  return isCompliance(variant);
}

// ── Helper functions ────────────────────────────────────────────────

/** Whether this mode supports team features */
export function modeSupportsTeam(mode: StoreMode): boolean {
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

/** Check if a feature is available for a given variant (base level) */
export function isVariantFeature(featureSlug: string, variant: AppVariant): boolean {
  const allowed = VARIANT_BASE_FEATURES[variant];
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

/** Is this variant the GCC/UAE build? */
export function isGCCVariant(variant: AppVariant): boolean {
  return variant === "gcc_uae";
}
