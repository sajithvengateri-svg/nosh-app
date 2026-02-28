/**
 * BevOS Portal — Dashboard & Navigation E2E Tests
 *
 * Validates that the BevOS dashboard loads for a bar org and that
 * navigation to key sub-pages (cellar, cocktails, wine, draught, coffee) works.
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
  await expect(content.first()).toBeVisible({ timeout: 15_000 });
  await assertPageHealthy(page);

  const heading = page.locator("h1, h2").filter({ hasText: expectedText }).first();
  await expect(heading).toBeVisible({ timeout: 10_000 });
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

test.describe("BevOS Portal — Dashboard & Navigation", () => {
  test.describe.configure({ mode: "serial" });

  test("BevOS dashboard loads", async ({ page, loginAsOwner }) => {
    await loginAsOwner("cocktail-lounge");
    await page.goto("/bev/dashboard");
    await page.waitForLoadState("domcontentloaded");
    await assertPageHealthy(page);

    const content = page.locator("main, [role='main'], h1, h2, [data-testid]");
    await expect(content.first()).toBeVisible({ timeout: 15_000 });
  });

  test("navigate to cellar", async ({ page, loginAsOwner }) => {
    await loginAsOwner("cocktail-lounge");
    await navigateAndAssert(page, "/bev/cellar", /cellar/i);
  });

  test("navigate to cocktails", async ({ page, loginAsOwner }) => {
    await loginAsOwner("cocktail-lounge");
    await navigateAndAssert(page, "/bev/cocktails", /cocktail/i);
  });

  test("navigate to wine intelligence", async ({ page, loginAsOwner }) => {
    await loginAsOwner("cocktail-lounge");
    await navigateAndAssert(page, "/bev/wine", /wine/i);
  });

  test("navigate to draught manager", async ({ page, loginAsOwner }) => {
    await loginAsOwner("cocktail-lounge");
    await navigateAndAssert(page, "/bev/draught", /draught/i);
  });

  test("navigate to coffee program", async ({ page, loginAsOwner }) => {
    await loginAsOwner("cocktail-lounge");
    await navigateAndAssert(page, "/bev/coffee", /coffee/i);
  });
});
