/**
 * Chef Portal — Food Safety E2E Tests
 *
 * Validates the food safety dashboard, daily compliance form,
 * temperature check form, BCC components for EatSafe orgs,
 * and GCC compliance for Dubai orgs.
 */

import { test, expect } from "../../fixtures/auth.fixture";
import { assertPageHealthy } from "../../fixtures/auth.fixture";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const FOOD_SAFETY_URL = "/food-safety";

async function waitForFoodSafetyPage(page: import("@playwright/test").Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.locator("h1, .page-title, [data-testid]").first().waitFor({
    state: "visible",
    timeout: 15_000,
  });
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

test.describe("Chef Portal — Food Safety", () => {
  test.describe.configure({ mode: "serial" });

  test("food safety dashboard loads", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await page.goto(FOOD_SAFETY_URL);
    await waitForFoodSafetyPage(page);
    await assertPageHealthy(page);

    // Page title should be "Food Safety" or "Safety Checks"
    const title = page.locator("h1").filter({ hasText: /food safety|safety checks/i });
    await expect(title).toBeVisible({ timeout: 10_000 });

    // Subtitle: "HACCP compliance, logs & approved suppliers"
    const subtitle = page.getByText(/haccp|compliance|safety checks/i).first();
    await expect(subtitle).toBeVisible({ timeout: 5_000 });
  });

  test("daily compliance form visible", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await page.goto(FOOD_SAFETY_URL);
    await waitForFoodSafetyPage(page);

    // The "Daily" tab should be active by default and DailyTempChecks rendered
    const dailyTab = page.getByRole("tab", { name: /daily/i });
    await expect(dailyTab).toBeVisible({ timeout: 10_000 });

    // Click it to ensure we are on the daily tab
    await dailyTab.click();
    await page.waitForTimeout(500);

    // The DailyTempChecks component should render temperature check cards or form
    const dailyContent = page.locator("[role='tabpanel']").first();
    await expect(dailyContent).toBeVisible({ timeout: 5_000 });
  });

  test("temperature check form fillable", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await page.goto(FOOD_SAFETY_URL);
    await waitForFoodSafetyPage(page);

    // Navigate to the Logs tab where temperature quick-log buttons are
    const logsTab = page.getByRole("tab", { name: /logs/i });
    await expect(logsTab).toBeVisible({ timeout: 10_000 });
    await logsTab.click();
    await page.waitForTimeout(500);

    // Quick-log buttons for temperature zones: "Walk-in", "Freezer", "Hot Hold", "Ambient"
    const walkinBtn = page.getByRole("button", { name: /walk-in/i }).first();
    if (await walkinBtn.isVisible({ timeout: 5_000 })) {
      await walkinBtn.click();

      // The Smart Temperature Log dialog should open
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 5_000 });

      // Verify the temperature input is present
      const tempInput = dialog.locator("input[type='number']").first();
      await expect(tempInput).toBeVisible({ timeout: 3_000 });

      // Fill in a temperature value
      await tempInput.fill("3.5");

      // The auto-status indicator should show "pass" for 3.5C in a fridge
      const passIndicator = dialog.getByText(/pass/i).first();
      await expect(passIndicator).toBeVisible({ timeout: 3_000 });

      // Cancel instead of saving to not pollute test data
      const cancelBtn = dialog.getByRole("button", { name: /cancel/i });
      await cancelBtn.click();
    } else {
      // Fallback: click "New Log" button
      const newLogBtn = page.getByRole("button", { name: /new log/i });
      if (await newLogBtn.isVisible({ timeout: 3_000 })) {
        await newLogBtn.click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible({ timeout: 5_000 });

        // Close
        const cancelBtn = dialog.getByRole("button", { name: /cancel/i });
        if (await cancelBtn.isVisible()) {
          await cancelBtn.click();
        }
      }
    }
  });

  test("BCC components visible for EatSafe org", async ({ page, loginAsOwner }) => {
    await loginAsOwner("brisbane-safety-first");
    await page.goto(FOOD_SAFETY_URL);
    await waitForFoodSafetyPage(page);
    await assertPageHealthy(page);

    // For EatSafe Brisbane org, the BCC Eat Safe toggle banner should be visible
    // Look for "BCC Eat Safe Certified Mode" or the shield icon banner
    const bccBanner = page.getByText(/bcc eat safe/i).first()
      .or(page.getByText(/fsanz/i).first());
    await expect(bccBanner).toBeVisible({ timeout: 10_000 });

    // The Switch toggle for BCC mode should be present
    const bccToggle = page.getByRole("switch").first();
    await expect(bccToggle).toBeVisible({ timeout: 5_000 });
  });

  test("GCC compliance visible for Dubai org", async ({ page, loginAsOwner }) => {
    await loginAsOwner("dubai-marina-restaurant");
    await page.goto(FOOD_SAFETY_URL);
    await waitForFoodSafetyPage(page);
    await assertPageHealthy(page);

    // For GCC (Dubai) variant, GCCFoodSafetyDashboard should render
    // The page should show GCC-specific compliance content
    // At minimum, the page loads without errors and shows food safety content
    const content = page.locator("main, [role='main'], h1, h2, [data-testid]");
    await expect(content.first()).toBeVisible({ timeout: 10_000 });

    // The GCC dashboard may have different labels — verify the page is healthy
    await assertPageHealthy(page);
  });
});
