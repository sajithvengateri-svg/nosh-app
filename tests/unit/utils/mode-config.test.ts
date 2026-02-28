import { describe, test, expect } from "vitest";
import {
  MODE_MODULES,
  MODE_FEATURES,
  isHomeCookMode,
  isFeatureAvailable,
} from "../../../packages/shared/src/lib/modeConfig";
import type { StoreMode } from "../../../packages/shared/src/types/store.types";

describe("modeConfig", () => {
  // ── isHomeCookMode ─────────────────────────────────────────────────

  describe("isHomeCookMode", () => {
    test('isHomeCookMode("home_cook") returns true', () => {
      expect(isHomeCookMode("home_cook")).toBe(true);
    });

    test('isHomeCookMode("restaurant") returns false', () => {
      expect(isHomeCookMode("restaurant")).toBe(false);
    });

    test('isHomeCookMode("cafe") returns false', () => {
      expect(isHomeCookMode("cafe")).toBe(false);
    });
  });

  // ── MODE_FEATURES ──────────────────────────────────────────────────

  describe("MODE_FEATURES", () => {
    test("MODE_FEATURES.home_cook contains the expected feature set", () => {
      const expected = [
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
      ];
      expect(MODE_FEATURES.home_cook).toEqual(expected);
    });

    test("MODE_FEATURES.restaurant is null (all features)", () => {
      expect(MODE_FEATURES.restaurant).toBeNull();
    });

    test("MODE_FEATURES.cafe is null (all features)", () => {
      expect(MODE_FEATURES.cafe).toBeNull();
    });

    test("MODE_FEATURES.bar is null (all features)", () => {
      expect(MODE_FEATURES.bar).toBeNull();
    });

    test("MODE_FEATURES.hotel is null (all features)", () => {
      expect(MODE_FEATURES.hotel).toBeNull();
    });

    test("MODE_FEATURES.catering is null (all features)", () => {
      expect(MODE_FEATURES.catering).toBeNull();
    });
  });

  // ── MODE_MODULES ───────────────────────────────────────────────────

  describe("MODE_MODULES", () => {
    test('MODE_MODULES.home_cook equals ["chef", "money", "quiet"]', () => {
      expect(MODE_MODULES.home_cook).toEqual(["chef", "money", "quiet"]);
    });

    test("MODE_MODULES.restaurant is null (all modules)", () => {
      expect(MODE_MODULES.restaurant).toBeNull();
    });
  });

  // ── isFeatureAvailable ─────────────────────────────────────────────

  describe("isFeatureAvailable", () => {
    test('isFeatureAvailable("dashboard", "home_cook") returns true', () => {
      expect(isFeatureAvailable("dashboard", "home_cook")).toBe(true);
    });

    test('isFeatureAvailable("inventory", "home_cook") returns false', () => {
      expect(isFeatureAvailable("inventory", "home_cook")).toBe(false);
    });

    test('isFeatureAvailable("inventory", "restaurant") returns true', () => {
      expect(isFeatureAvailable("inventory", "restaurant")).toBe(true);
    });

    test('isFeatureAvailable("anything", "restaurant") returns true (null = all)', () => {
      expect(isFeatureAvailable("anything", "restaurant")).toBe(true);
    });
  });
});
