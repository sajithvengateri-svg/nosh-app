/**
 * Admin Portal — Dashboard & Navigation E2E Tests
 *
 * Validates the admin dashboard loads and navigation to organizations,
 * email templates, releases, CRM, sales dashboard, landing page editor,
 * and system settings.
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

test.describe("Admin Portal — Dashboard & Navigation", () => {
  test.describe.configure({ mode: "serial" });

  test("admin dashboard loads", async ({ page, loginAs }) => {
    await loginAs("queitos-hq", "admin1");
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");
    await assertPageHealthy(page);

    const content = page.locator("main, [role='main'], h1, h2, [data-testid]");
    await expect(content.first()).toBeVisible({ timeout: 15_000 });

    // Admin dashboard should show a heading or welcome
    const heading = page.locator("h1, h2").filter({ hasText: /admin|dashboard|queitos/i }).first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("navigate to organizations", async ({ page, loginAs }) => {
    await loginAs("queitos-hq", "admin1");
    await navigateAndAssert(page, "/admin/organizations", /organization/i);
  });

  test("navigate to email templates", async ({ page, loginAs }) => {
    await loginAs("queitos-hq", "admin1");
    await navigateAndAssert(page, "/admin/email-templates", /email|template/i);
  });

  test("navigate to releases", async ({ page, loginAs }) => {
    await loginAs("queitos-hq", "admin1");
    await navigateAndAssert(page, "/admin/releases", /release/i);
  });

  test("navigate to CRM", async ({ page, loginAs }) => {
    await loginAs("queitos-hq", "admin1");
    await navigateAndAssert(page, "/admin/crm", /crm/i);
  });

  test("navigate to sales dashboard", async ({ page, loginAs }) => {
    await loginAs("queitos-hq", "admin1");
    await navigateAndAssert(page, "/admin/sales", /sales|dashboard/i);
  });

  test("navigate to landing page editor", async ({ page, loginAs }) => {
    await loginAs("queitos-hq", "admin1");
    await navigateAndAssert(page, "/admin/landing-page", /landing/i);
  });

  test("navigate to system settings", async ({ page, loginAs }) => {
    await loginAs("queitos-hq", "admin1");
    await navigateAndAssert(page, "/admin/system", /system/i);
  });
});
