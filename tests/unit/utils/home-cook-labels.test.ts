import { describe, test, expect } from "vitest";
import {
  HOME_COOK_NAV_LABELS,
  HOME_COOK_ROLE_LABELS,
  HOME_COOK_PAGE_SUBTITLES,
  homeCookRoleLabel,
  homeCookNavLabel,
} from "../../../packages/shared/src/lib/homeCookLabels";

describe("homeCookLabels", () => {
  // ── HOME_COOK_NAV_LABELS ───────────────────────────────────────────

  describe("HOME_COOK_NAV_LABELS", () => {
    test('"Recipe Bank" maps to "My Recipes"', () => {
      expect(HOME_COOK_NAV_LABELS["Recipe Bank"]).toBe("My Recipes");
    });

    test('"Kitchen" maps to "My Kitchen"', () => {
      expect(HOME_COOK_NAV_LABELS["Kitchen"]).toBe("My Kitchen");
    });

    test('"Ingredients" maps to "My Pantry"', () => {
      expect(HOME_COOK_NAV_LABELS["Ingredients"]).toBe("My Pantry");
    });

    test('"Inventory" maps to "My Stock"', () => {
      expect(HOME_COOK_NAV_LABELS["Inventory"]).toBe("My Stock");
    });

    test('"Food Safety" maps to "Safety Checks"', () => {
      expect(HOME_COOK_NAV_LABELS["Food Safety"]).toBe("Safety Checks");
    });

    test('"Todo List" maps to "My To-Do Command Portal"', () => {
      expect(HOME_COOK_NAV_LABELS["Todo List"]).toBe(
        "My To-Do Command Portal"
      );
    });
  });

  // ── HOME_COOK_ROLE_LABELS ──────────────────────────────────────────

  describe("HOME_COOK_ROLE_LABELS", () => {
    test('"head_chef" maps to "Boss"', () => {
      expect(HOME_COOK_ROLE_LABELS["head_chef"]).toBe("Boss");
    });

    test('"owner" maps to "Boss"', () => {
      expect(HOME_COOK_ROLE_LABELS["owner"]).toBe("Boss");
    });

    test('"sous_chef" maps to "Helper"', () => {
      expect(HOME_COOK_ROLE_LABELS["sous_chef"]).toBe("Helper");
    });

    test('"line_chef" maps to "Helper"', () => {
      expect(HOME_COOK_ROLE_LABELS["line_chef"]).toBe("Helper");
    });

    test('"kitchen_hand" maps to "Helper"', () => {
      expect(HOME_COOK_ROLE_LABELS["kitchen_hand"]).toBe("Helper");
    });
  });

  // ── All label values are non-empty strings ─────────────────────────

  describe("label value integrity", () => {
    test("all HOME_COOK_NAV_LABELS values are non-empty strings", () => {
      for (const [key, value] of Object.entries(HOME_COOK_NAV_LABELS)) {
        expect(value).toBeTruthy();
        expect(typeof value).toBe("string");
        expect(value.trim().length).toBeGreaterThan(0);
      }
    });

    test("all HOME_COOK_ROLE_LABELS values are non-empty strings", () => {
      for (const [key, value] of Object.entries(HOME_COOK_ROLE_LABELS)) {
        expect(value).toBeTruthy();
        expect(typeof value).toBe("string");
        expect(value.trim().length).toBeGreaterThan(0);
      }
    });

    test("all HOME_COOK_PAGE_SUBTITLES values are non-empty strings", () => {
      for (const [key, value] of Object.entries(HOME_COOK_PAGE_SUBTITLES)) {
        expect(value).toBeTruthy();
        expect(typeof value).toBe("string");
        expect(value.trim().length).toBeGreaterThan(0);
      }
    });
  });

  // ── No duplicate values in nav labels ──────────────────────────────

  describe("uniqueness", () => {
    test("no duplicate values in HOME_COOK_NAV_LABELS", () => {
      const values = Object.values(HOME_COOK_NAV_LABELS);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });
  });

  // ── Helper functions ───────────────────────────────────────────────

  describe("homeCookRoleLabel", () => {
    test("resolves known role to home-cook label", () => {
      expect(homeCookRoleLabel("head_chef")).toBe("Boss");
      expect(homeCookRoleLabel("sous_chef")).toBe("Helper");
    });

    test("returns the original role string for unknown roles", () => {
      expect(homeCookRoleLabel("unknown_role")).toBe("unknown_role");
    });
  });

  describe("homeCookNavLabel", () => {
    test("resolves known nav label to home-cook label", () => {
      expect(homeCookNavLabel("Recipe Bank")).toBe("My Recipes");
      expect(homeCookNavLabel("Kitchen")).toBe("My Kitchen");
    });

    test("returns the original label for unknown labels", () => {
      expect(homeCookNavLabel("Unknown Page")).toBe("Unknown Page");
    });
  });
});
