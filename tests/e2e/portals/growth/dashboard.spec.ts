/**
 * GrowthOS Portal — Dashboard & Navigation E2E Tests
 *
 * Validates the growth dashboard loads and navigation to campaigns,
 * segments, and analytics works correctly.
 */

import { test, expect } from "../../fixtures/auth.fixture";
import { assertPageHealthy } from "../../fixtures/auth.fixture";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function navigateAndAssert(
  page: import("@playwright/test").Page,
  path: string,
  expectedText: RegExp,
) {
  await page.goto(path);
  await page.waitForLoadState("domcontentloaded");
  const content = page.locator("main, [role='main'], h1, h2, [data-testid]");
  await content.first().waitFor({ state: "visible", timeout: 15_000 });
  await assertPageHealthy(page);

  const heading = page.locator("h1, h2").filter({ hasText: expectedText }).first();
  await expect(heading).toBeVisible({ timeout: 10_000 });
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

test.describe("GrowthOS Portal — Dashboard & Navigation", () => {
  test.describe.configure({ mode: "serial" });

  test("growth dashboard loads", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/growth/dashboard", /growth|dashboard/i);
  });

  test("navigate to campaigns", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/growth/campaigns", /campaign/i);
  });

  test("navigate to segments", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/growth/segments", /segment/i);
  });

  test("navigate to analytics", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/growth/analytics", /analytics/i);
  });
});
