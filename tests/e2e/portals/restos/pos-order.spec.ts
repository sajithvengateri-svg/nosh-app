/**
 * RestOS / POS Portal — Order Screen & Navigation E2E Tests
 *
 * Validates the POS order screen loads, KDS screen, tabs view,
 * daily close, POS analytics, and menu admin pages.
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

test.describe("RestOS / POS Portal — Order Screen & Navigation", () => {
  test.describe.configure({ mode: "serial" });

  test("POS order screen loads", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await page.goto("/pos");
    await page.waitForLoadState("domcontentloaded");
    await assertPageHealthy(page);

    // POS order screen should show categories, menu items, or an order panel
    const content = page.locator("main, [role='main'], h1, h2, [data-testid]");
    await expect(content.first()).toBeVisible({ timeout: 15_000 });

    // Look for POS-specific UI elements: category buttons, order summary, etc.
    const posElement = page.getByText(/order|menu|pos|new order/i).first()
      .or(page.locator("button, [data-testid]").first());
    await expect(posElement).toBeVisible({ timeout: 10_000 });
  });

  test("KDS screen loads", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await page.goto("/pos/kds");
    await page.waitForLoadState("domcontentloaded");
    await assertPageHealthy(page);

    const content = page.locator("main, [role='main'], h1, h2, [data-testid]");
    await expect(content.first()).toBeVisible({ timeout: 15_000 });

    // KDS = Kitchen Display System
    const heading = page.locator("h1, h2").filter({ hasText: /kds|kitchen display|orders/i }).first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("tabs view loads", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/pos/tabs", /tab/i);
  });

  test("daily close page loads", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/pos/daily-close", /daily close|end of day|close/i);
  });

  test("POS analytics loads", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/pos/analytics", /analytics|reports/i);
  });

  test("menu admin loads", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/pos/admin/menu", /menu/i);
  });
});
