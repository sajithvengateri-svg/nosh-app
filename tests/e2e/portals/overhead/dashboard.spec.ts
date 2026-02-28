/**
 * OverheadOS Portal — Dashboard & Navigation E2E Tests
 *
 * Validates the overhead dashboard loads and navigation to costs,
 * add new cost form, recurring, assets, and breakeven pages.
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

test.describe("OverheadOS Portal — Dashboard & Navigation", () => {
  test.describe.configure({ mode: "serial" });

  test("overhead dashboard loads", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/overhead/dashboard", /overhead|dashboard/i);
  });

  test("navigate to costs", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/overhead/costs", /cost/i);
  });

  test("add new cost form", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await page.goto("/overhead/costs/new");
    await page.waitForLoadState("domcontentloaded");
    await assertPageHealthy(page);

    const content = page.locator("main, [role='main'], h1, h2, [data-testid]");
    await expect(content.first()).toBeVisible({ timeout: 15_000 });

    // Should show a form for adding a new cost
    const heading = page.locator("h1, h2").filter({ hasText: /add cost|new cost|create/i }).first();
    await expect(heading).toBeVisible({ timeout: 10_000 });

    // The form should have input fields
    const formField = page.locator("input, select, textarea, [role='combobox']").first();
    await expect(formField).toBeVisible({ timeout: 5_000 });
  });

  test("navigate to recurring", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/overhead/recurring", /recurring/i);
  });

  test("navigate to assets", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/overhead/assets", /asset/i);
  });

  test("navigate to breakeven", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/overhead/breakeven", /breakeven|break.even/i);
  });
});
