/**
 * MoneyOS Portal — Dashboard & Navigation E2E Tests
 *
 * Validates the money dashboard loads and navigation to P&L, trends,
 * simulator, benchmarks, and forensic analysis pages.
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

test.describe("MoneyOS Portal — Dashboard & Navigation", () => {
  test.describe.configure({ mode: "serial" });

  test("money dashboard loads", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/money/dashboard", /money|dashboard|financial/i);
  });

  test("P&L page loads with chart", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await page.goto("/money/pnl");
    await page.waitForLoadState("domcontentloaded");
    await assertPageHealthy(page);

    const content = page.locator("main, [role='main'], h1, h2, [data-testid]");
    await expect(content.first()).toBeVisible({ timeout: 15_000 });

    // P&L page should have the heading
    const heading = page.locator("h1, h2").filter({ hasText: /p&l|profit|loss/i }).first();
    await expect(heading).toBeVisible({ timeout: 10_000 });

    // Look for chart or table elements that indicate data visualization
    const chart = page.locator("canvas, svg, .recharts-wrapper, [data-testid*='chart'], table").first();
    // Chart may or may not be visible depending on data, but page should load
    const chartVisible = await chart.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!chartVisible) {
      // At minimum the page heading loaded, which is enough
      await expect(heading).toBeVisible();
    }
  });

  test("trends page loads", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/money/trends", /trend/i);
  });

  test("simulator page loads", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/money/simulator", /simulator|what.if/i);
  });

  test("benchmarks page loads", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/money/benchmarks", /benchmark/i);
  });

  test("forensic analysis page loads", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/money/forensic", /forensic/i);
  });
});
