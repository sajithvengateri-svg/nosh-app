/**
 * Vendor Portal — Dashboard & Navigation E2E Tests
 *
 * Validates the vendor dashboard loads and navigation to insights,
 * pricing, orders, deals, messages, and settings.
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

test.describe("Vendor Portal — Dashboard & Navigation", () => {
  test.describe.configure({ mode: "serial" });

  test("vendor dashboard loads", async ({ page, loginAs }) => {
    await loginAs("fresh-produce-co", "admin");
    await navigateAndAssert(page, "/vendor/dashboard", /vendor|dashboard/i);
  });

  test("navigate to insights", async ({ page, loginAs }) => {
    await loginAs("fresh-produce-co", "admin");
    await navigateAndAssert(page, "/vendor/insights", /insight/i);
  });

  test("navigate to pricing", async ({ page, loginAs }) => {
    await loginAs("fresh-produce-co", "admin");
    await navigateAndAssert(page, "/vendor/pricing", /pricing/i);
  });

  test("navigate to orders", async ({ page, loginAs }) => {
    await loginAs("fresh-produce-co", "admin");
    await navigateAndAssert(page, "/vendor/orders", /order/i);
  });

  test("navigate to deals", async ({ page, loginAs }) => {
    await loginAs("fresh-produce-co", "admin");
    await navigateAndAssert(page, "/vendor/deals", /deal/i);
  });

  test("navigate to messages", async ({ page, loginAs }) => {
    await loginAs("fresh-produce-co", "admin");
    await navigateAndAssert(page, "/vendor/messages", /message/i);
  });

  test("navigate to settings", async ({ page, loginAs }) => {
    await loginAs("fresh-produce-co", "admin");
    await navigateAndAssert(page, "/vendor/settings", /setting/i);
  });
});
