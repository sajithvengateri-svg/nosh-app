/**
 * SupplyOS Portal — Dashboard & Navigation E2E Tests
 *
 * Validates the supply dashboard loads and navigation to purchase orders,
 * suppliers, receiving, and price watch works correctly.
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

test.describe("SupplyOS Portal — Dashboard & Navigation", () => {
  test.describe.configure({ mode: "serial" });

  test("supply dashboard loads", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/supply/dashboard", /supply|dashboard/i);
  });

  test("navigate to purchase orders", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/supply/orders", /order|purchase/i);
  });

  test("navigate to suppliers", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/supply/suppliers", /supplier/i);
  });

  test("navigate to receiving", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/supply/receiving", /receiv/i);
  });

  test("price watch page loads", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/supply/price-watch", /price/i);
  });
});
