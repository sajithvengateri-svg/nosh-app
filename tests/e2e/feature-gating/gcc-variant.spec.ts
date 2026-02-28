/**
 * GCC variant feature gating tests (5 scenarios, #16-#20).
 *
 * Tests UAE/GCC-specific compliance features, currency display, halal
 * certification, and regional inspection grade systems.
 *
 * Dubai Marina Restaurant (gcc_dubai) and Abu Dhabi Grand Hotel
 * (gcc_abudhabi) are used as test organisations.
 */

import { test, expect } from "../fixtures/auth.fixture";

/* ================================================================== */
/*  Dubai Marina Restaurant (gcc_dubai variant)                       */
/* ================================================================== */

test.describe("GCC Variant - Dubai Marina Restaurant", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page, loginAsOwner }) => {
    await loginAsOwner("dubai-marina-restaurant");
  });

  // Scenario 16
  test("16. Food safety page shows GCC compliance components", async ({ page }) => {
    await page.goto("/food-safety");
    await page.waitForLoadState("domcontentloaded");

    // Page should load without errors
    const error = page.locator("text=Something went wrong");
    await expect(error).not.toBeVisible({ timeout: 5_000 });

    // GCC-specific compliance elements should be present.
    // Look for any of: "GCC", "Dubai Municipality", "HACCP", "DM", or
    // a regional compliance badge/section.
    const gccIndicators = page.locator(
      [
        "text=GCC",
        "text=Dubai Municipality",
        "text=DM Compliance",
        "text=HACCP",
        "text=Municipality",
        "text=Gulf",
        "[data-testid*='gcc']",
        "[data-testid*='dubai']",
        "[data-testid*='compliance']",
      ].join(", ")
    );

    await expect(
      gccIndicators.first(),
      "Food safety page should display GCC compliance components for Dubai org"
    ).toBeVisible({ timeout: 10_000 });
  });

  // Scenario 17
  test("17. AED currency visible in money-related pages", async ({ page }) => {
    await page.goto("/money/dashboard");
    await page.waitForLoadState("domcontentloaded");

    // Page should load
    const error = page.locator("text=Something went wrong");
    await expect(error).not.toBeVisible({ timeout: 5_000 });

    // Look for AED currency symbol or text
    const aedLocators = page.locator(
      [
        "text=AED",
        "text=\u062F.\u0625",        // Arabic Dirham symbol
        "text=Dirham",
        "[data-testid*='currency']",
        "[data-currency='AED']",
      ].join(", ")
    );

    // Also check costing pages which commonly show currency
    let found = await aedLocators.first().isVisible().catch(() => false);

    if (!found) {
      // Try costing page as alternative
      await page.goto("/costing");
      await page.waitForLoadState("domcontentloaded");

      const aedOnCosting = page.locator("text=AED, text=Dirham, text=\u062F.\u0625");
      found = await aedOnCosting.first().isVisible().catch(() => false);
    }

    if (!found) {
      // Try invoices page
      await page.goto("/invoices");
      await page.waitForLoadState("domcontentloaded");

      const aedOnInvoices = page.locator("text=AED, text=Dirham, text=\u062F.\u0625");
      found = await aedOnInvoices.first().isVisible().catch(() => false);
    }

    expect(found, "AED currency should be visible on money/costing/invoices pages for Dubai org").toBe(true);
  });

  // Scenario 18
  test("18. Halal certificate section visible", async ({ page }) => {
    // Halal certification is most likely under food-safety or compliance
    await page.goto("/food-safety");
    await page.waitForLoadState("domcontentloaded");

    const error = page.locator("text=Something went wrong");
    await expect(error).not.toBeVisible({ timeout: 5_000 });

    // Look for halal-related content
    const halalLocators = page.locator(
      [
        "text=Halal",
        "text=halal",
        "text=HALAL",
        "text=Halal Certificate",
        "text=Halal Compliance",
        "[data-testid*='halal']",
      ].join(", ")
    );

    let found = await halalLocators.first().isVisible().catch(() => false);

    if (!found) {
      // Try allergens page (halal may be listed there)
      await page.goto("/allergens");
      await page.waitForLoadState("domcontentloaded");

      const halalOnAllergens = page.locator("text=Halal, text=halal, text=HALAL");
      found = await halalOnAllergens.first().isVisible().catch(() => false);
    }

    if (!found) {
      // Try settings (halal config may be in org settings)
      await page.goto("/settings");
      await page.waitForLoadState("domcontentloaded");

      const halalOnSettings = page.locator("text=Halal, text=halal, text=HALAL");
      found = await halalOnSettings.first().isVisible().catch(() => false);
    }

    expect(
      found,
      "Halal certificate section should be visible for Dubai GCC org"
    ).toBe(true);
  });

  // Scenario 19
  test("19. Dubai-specific inspection grades visible", async ({ page }) => {
    await page.goto("/food-safety");
    await page.waitForLoadState("domcontentloaded");

    const error = page.locator("text=Something went wrong");
    await expect(error).not.toBeVisible({ timeout: 5_000 });

    // Dubai Municipality uses a grading system (A/B/C or star ratings)
    const gradeIndicators = page.locator(
      [
        "text=Inspection",
        "text=Grade",
        "text=Dubai Municipality",
        "text=DM Grade",
        "text=Inspection Score",
        "text=Rating",
        "[data-testid*='inspection']",
        "[data-testid*='grade']",
        "[data-testid*='dubai-rating']",
      ].join(", ")
    );

    let found = await gradeIndicators.first().isVisible().catch(() => false);

    if (!found) {
      // Also check the QuietAudit report which may show inspection grades
      await page.goto("/quiet/report");
      await page.waitForLoadState("domcontentloaded");

      const gradeOnAudit = page.locator(
        "text=Inspection, text=Grade, text=Dubai Municipality, text=Rating"
      );
      found = await gradeOnAudit.first().isVisible().catch(() => false);
    }

    expect(
      found,
      "Dubai-specific inspection grades should be visible for gcc_dubai org"
    ).toBe(true);
  });
});

/* ================================================================== */
/*  Abu Dhabi Grand Hotel (gcc_abudhabi variant)                      */
/* ================================================================== */

test.describe("GCC Variant - Abu Dhabi Grand Hotel", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page, loginAsOwner }) => {
    await loginAsOwner("abudhabi-grand-hotel");
  });

  // Scenario 20
  test("20. Abu Dhabi star rating system visible", async ({ page }) => {
    await page.goto("/food-safety");
    await page.waitForLoadState("domcontentloaded");

    const error = page.locator("text=Something went wrong");
    await expect(error).not.toBeVisible({ timeout: 5_000 });

    // Abu Dhabi uses a star rating system (ADFCA) for food safety
    const starRatingIndicators = page.locator(
      [
        "text=Star Rating",
        "text=star rating",
        "text=ADFCA",
        "text=Abu Dhabi",
        "text=Star",
        "text=Stars",
        "[data-testid*='star-rating']",
        "[data-testid*='adfca']",
        "[data-testid*='abudhabi']",
      ].join(", ")
    );

    let found = await starRatingIndicators.first().isVisible().catch(() => false);

    if (!found) {
      // Check the QuietAudit dashboard which may surface the rating
      await page.goto("/quiet/dashboard");
      await page.waitForLoadState("domcontentloaded");

      const starOnAudit = page.locator(
        "text=Star Rating, text=star rating, text=ADFCA, text=Abu Dhabi, text=Stars"
      );
      found = await starOnAudit.first().isVisible().catch(() => false);
    }

    if (!found) {
      // Check score report
      await page.goto("/quiet/report");
      await page.waitForLoadState("domcontentloaded");

      const starOnReport = page.locator(
        "text=Star Rating, text=star rating, text=ADFCA, text=Abu Dhabi, text=Stars"
      );
      found = await starOnReport.first().isVisible().catch(() => false);
    }

    if (!found) {
      // Check settings where region-specific rating system may be configured
      await page.goto("/settings");
      await page.waitForLoadState("domcontentloaded");

      const starOnSettings = page.locator(
        "text=Star Rating, text=star rating, text=ADFCA, text=Abu Dhabi"
      );
      found = await starOnSettings.first().isVisible().catch(() => false);
    }

    expect(
      found,
      "Abu Dhabi star rating system should be visible for gcc_abudhabi org"
    ).toBe(true);
  });
});
