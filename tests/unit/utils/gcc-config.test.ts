import { describe, test, expect } from "vitest";
import {
  detectEmirate,
  getEmirateCompliance,
  UAE_TEMP_THRESHOLDS,
  uaeTempStatus,
  DM_GRADES,
  getDMGrade,
  ADAFSA_STARS,
  getADFSAStars,
  formatAED,
  formatAEDAr,
} from "../../../packages/shared/src/lib/gccConfig";

describe("gccConfig", () => {
  // ── detectEmirate ──────────────────────────────────────────────────

  describe("detectEmirate", () => {
    test('detectEmirate("Business Bay, Dubai") returns "dubai"', () => {
      expect(detectEmirate("Business Bay, Dubai")).toBe("dubai");
    });

    test('detectEmirate("Yas Island, Abu Dhabi") returns "abu_dhabi"', () => {
      expect(detectEmirate("Yas Island, Abu Dhabi")).toBe("abu_dhabi");
    });

    test('detectEmirate("Al Majaz, Sharjah") returns "sharjah"', () => {
      expect(detectEmirate("Al Majaz, Sharjah")).toBe("sharjah");
    });

    test('detectEmirate("Random city") returns "dubai" (default fallback)', () => {
      // The actual implementation defaults to "dubai" when no match is found
      expect(detectEmirate("Random city")).toBe("dubai");
    });
  });

  // ── getEmirateCompliance ───────────────────────────────────────────

  describe("getEmirateCompliance", () => {
    test('getEmirateCompliance("dubai") returns "dm"', () => {
      expect(getEmirateCompliance("dubai")).toBe("dm");
    });

    test('getEmirateCompliance("abu_dhabi") returns "adafsa"', () => {
      expect(getEmirateCompliance("abu_dhabi")).toBe("adafsa");
    });

    test('getEmirateCompliance("sharjah") returns "sm_sharjah"', () => {
      expect(getEmirateCompliance("sharjah")).toBe("sm_sharjah");
    });
  });

  // ── UAE_TEMP_THRESHOLDS & uaeTempStatus ────────────────────────────

  describe("uaeTempStatus", () => {
    test('uaeTempStatus("fridge_temp", 4) returns "pass" (below passMax of 5)', () => {
      expect(uaeTempStatus("fridge_temp", 4)).toBe("pass");
    });

    test('uaeTempStatus("fridge_temp", 7) returns "warning" (between passMax=5 and warningMax=8)', () => {
      expect(uaeTempStatus("fridge_temp", 7)).toBe("warning");
    });

    test('uaeTempStatus("fridge_temp", 10) returns "fail" (above warningMax of 8)', () => {
      expect(uaeTempStatus("fridge_temp", 10)).toBe("fail");
    });

    test('fridge_temp threshold: passMax=5, warningMax=8 exists in UAE_TEMP_THRESHOLDS', () => {
      const fridge = UAE_TEMP_THRESHOLDS.find(
        (t) => t.logType === "fridge_temp"
      );
      expect(fridge).toBeDefined();
      expect(fridge!.passMax).toBe(5);
      expect(fridge!.warningMax).toBe(8);
    });

    test('hot_holding: 60+ is pass, 57-59 is warning, below 57 is fail', () => {
      expect(uaeTempStatus("hot_holding", 65)).toBe("pass");
      expect(uaeTempStatus("hot_holding", 58)).toBe("warning");
      expect(uaeTempStatus("hot_holding", 50)).toBe("fail");
    });

    test('unknown logType returns "pass" (no threshold to violate)', () => {
      expect(uaeTempStatus("nonexistent_type", 999)).toBe("pass");
    });
  });

  // ── formatAED ──────────────────────────────────────────────────────

  describe("formatAED", () => {
    test("formatAED(1500) returns a string starting with AED and containing 1,500.00", () => {
      const result = formatAED(1500);
      expect(result).toMatch(/^AED\s/);
      expect(result).toContain("1,500.00");
    });

    test("formatAED(0) returns a string starting with AED and containing 0.00", () => {
      const result = formatAED(0);
      expect(result).toMatch(/^AED\s/);
      expect(result).toContain("0.00");
    });

    test("formatAEDAr returns Arabic-formatted string with dirham symbol", () => {
      const result = formatAEDAr(1500);
      expect(result).toContain("د.إ");
    });
  });

  // ── getDMGrade ─────────────────────────────────────────────────────

  describe("getDMGrade", () => {
    test("getDMGrade(95) returns grade A", () => {
      const grade = getDMGrade(95);
      expect(grade.grade).toBe("A");
      expect(grade.label).toBe("Excellent");
    });

    test("getDMGrade(70) returns grade B", () => {
      // 70 is within B range (70-84)
      const grade = getDMGrade(70);
      expect(grade.grade).toBe("B");
      expect(grade.label).toBe("Good");
    });

    test("getDMGrade(60) returns grade C", () => {
      // 60 is within C range (55-69)
      const grade = getDMGrade(60);
      expect(grade.grade).toBe("C");
    });

    test("getDMGrade(30) returns grade D", () => {
      // 30 is within D range (0-54)
      const grade = getDMGrade(30);
      expect(grade.grade).toBe("D");
      expect(grade.label).toBe("Poor");
    });

    test("DM_GRADES has 4 grade levels", () => {
      expect(DM_GRADES).toHaveLength(4);
    });
  });

  // ── getADFSAStars ──────────────────────────────────────────────────

  describe("getADFSAStars", () => {
    test("getADFSAStars(95) returns 5 stars", () => {
      const rating = getADFSAStars(95);
      expect(rating.stars).toBe(5);
      expect(rating.label).toBe("Outstanding");
    });

    test("getADFSAStars(50) returns 2 stars (Acceptable)", () => {
      // 50 is >= 45 minScore for 2 stars
      const rating = getADFSAStars(50);
      expect(rating.stars).toBe(2);
      expect(rating.label).toBe("Acceptable");
    });

    test("getADFSAStars(10) returns 1 star (Needs Improvement)", () => {
      const rating = getADFSAStars(10);
      expect(rating.stars).toBe(1);
      expect(rating.label).toBe("Needs Improvement");
    });

    test("ADAFSA_STARS has 5 star levels", () => {
      expect(ADAFSA_STARS).toHaveLength(5);
    });
  });
});
