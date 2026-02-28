import { describe, test, expect } from "vitest";
import {
  MODE_FEATURES,
  MODE_MODULES,
  isFeatureAvailable,
} from "../../../packages/shared/src/lib/modeConfig";
import {
  HOME_COOK_NAV_LABELS,
} from "../../../packages/shared/src/lib/homeCookLabels";

/**
 * Known feature slugs derived from the Chef portal routes and other portals.
 * These represent the canonical set of feature keys used across the platform's
 * sidebar navigation and route definitions.
 */
const ALL_KNOWN_FEATURE_SLUGS = [
  "dashboard",
  "recipes",
  "ingredients",
  "master-yield",
  "costing",
  "inventory",
  "prep",
  "kitchen",
  "todo",
  "production",
  "marketplace",
  "menu-engineering",
  "roster",
  "allergens",
  "food-safety",
  "training",
  "invoices",
  "cheatsheets",
  "calendar",
  "kitchen-sections",
  "equipment",
  "team",
  "settings",
  "waste-log",
  "logs",
  "feedback",
  "housekeeping",
  "referral",
  "more",
  "money-lite",
  "games",
  "scanner",
  "reports",
];

/**
 * Known module keys — these map to the top-level portal/app registry
 * entries in the platform (chef, bev, clock, labour, supply, growth,
 * money, quiet, overhead, reservation, pos, vendor, admin, games).
 */
const ALL_KNOWN_MODULES = [
  "chef",
  "bev",
  "clock",
  "labour",
  "supply",
  "growth",
  "money",
  "quiet",
  "overhead",
  "reservation",
  "pos",
  "vendor",
  "admin",
  "games",
];

describe("Mode config integration — cross-reference against routes", () => {
  // ── 1. All features in MODE_FEATURES.home_cook are valid feature keys ──

  test("all features listed in MODE_FEATURES.home_cook are valid known feature keys", () => {
    const homeCookFeatures = MODE_FEATURES.home_cook;
    expect(homeCookFeatures).not.toBeNull();

    for (const feature of homeCookFeatures!) {
      expect(
        ALL_KNOWN_FEATURE_SLUGS,
        `Feature "${feature}" in MODE_FEATURES.home_cook is not a recognized feature slug`
      ).toContain(feature);
    }
  });

  // ── 2. home_cook modules are a subset of all available modules ─────

  test("MODE_MODULES.home_cook modules are a subset of all available modules", () => {
    const homeCookModules = MODE_MODULES.home_cook;
    expect(homeCookModules).not.toBeNull();

    for (const mod of homeCookModules!) {
      expect(
        ALL_KNOWN_MODULES,
        `Module "${mod}" in MODE_MODULES.home_cook is not a recognized module`
      ).toContain(mod);
    }
  });

  // ── 3. No feature key typos — cross-reference all modes ────────────

  test("no feature key typos in any mode config", () => {
    const allModes = Object.keys(MODE_FEATURES) as Array<
      keyof typeof MODE_FEATURES
    >;

    for (const mode of allModes) {
      const features = MODE_FEATURES[mode];
      if (features === null) {
        // null means all features — no keys to validate
        continue;
      }

      for (const feature of features) {
        expect(
          ALL_KNOWN_FEATURE_SLUGS,
          `Feature "${feature}" in MODE_FEATURES.${mode} is not a recognized feature slug`
        ).toContain(feature);
      }
    }
  });

  // ── 4. No module key typos — cross-reference all modes ─────────────

  test("no module key typos in any mode config", () => {
    const allModes = Object.keys(MODE_MODULES) as Array<
      keyof typeof MODE_MODULES
    >;

    for (const mode of allModes) {
      const modules = MODE_MODULES[mode];
      if (modules === null) {
        continue;
      }

      for (const mod of modules) {
        expect(
          ALL_KNOWN_MODULES,
          `Module "${mod}" in MODE_MODULES.${mode} is not a recognized module`
        ).toContain(mod);
      }
    }
  });

  // ── 5. home_cook features are a strict subset of all features ──────

  test("home_cook features are a strict subset (not the full set)", () => {
    const homeCookFeatures = MODE_FEATURES.home_cook;
    expect(homeCookFeatures).not.toBeNull();
    // home_cook should have fewer features than the full set
    expect(homeCookFeatures!.length).toBeLessThan(
      ALL_KNOWN_FEATURE_SLUGS.length
    );
  });

  // ── 6. home_cook modules are a strict subset of all modules ────────

  test("home_cook modules are a strict subset (not the full set)", () => {
    const homeCookModules = MODE_MODULES.home_cook;
    expect(homeCookModules).not.toBeNull();
    expect(homeCookModules!.length).toBeLessThan(ALL_KNOWN_MODULES.length);
  });

  // ── 7. Features gated for home_cook are actually excluded ──────────

  test("features NOT in home_cook list are correctly gated", () => {
    const homeCookFeatures = MODE_FEATURES.home_cook!;
    const excludedFeatures = ALL_KNOWN_FEATURE_SLUGS.filter(
      (f) => !homeCookFeatures.includes(f)
    );

    // At least some features should be excluded for home_cook
    expect(excludedFeatures.length).toBeGreaterThan(0);

    // Each excluded feature should report as unavailable
    for (const feature of excludedFeatures) {
      expect(
        isFeatureAvailable(feature, "home_cook"),
        `Feature "${feature}" should be gated for home_cook but isFeatureAvailable returned true`
      ).toBe(false);
    }
  });

  // ── 8. Restaurant mode has access to everything ────────────────────

  test("restaurant mode has access to all features and modules", () => {
    expect(MODE_FEATURES.restaurant).toBeNull();
    expect(MODE_MODULES.restaurant).toBeNull();

    // Verify any arbitrary feature is available
    for (const feature of ALL_KNOWN_FEATURE_SLUGS) {
      expect(isFeatureAvailable(feature, "restaurant")).toBe(true);
    }
  });

  // ── 9. HOME_COOK_NAV_LABELS keys correspond to real nav items ──────

  test("HOME_COOK_NAV_LABELS keys are recognizable navigation labels", () => {
    const knownNavLabels = [
      "Recipe Bank",
      "Ingredients",
      "Inventory",
      "Waste Log",
      "Food Safety",
      "Kitchen",
      "Prep Lists",
      "Todo List",
    ];

    for (const key of Object.keys(HOME_COOK_NAV_LABELS)) {
      expect(
        knownNavLabels,
        `HOME_COOK_NAV_LABELS key "${key}" is not a recognized nav label`
      ).toContain(key);
    }
  });
});
