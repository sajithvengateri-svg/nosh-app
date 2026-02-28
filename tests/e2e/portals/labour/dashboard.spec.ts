/**
 * LabourOS Portal — Dashboard & Navigation E2E Tests
 *
 * Validates the labour dashboard loads and navigation to roster,
 * payroll, employees, and PeopleOS recruitment works correctly.
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

test.describe("LabourOS Portal — Dashboard & Navigation", () => {
  test.describe.configure({ mode: "serial" });

  test("labour dashboard loads", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/labour/dashboard", /labour|dashboard/i);
  });

  test("navigate to roster", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/labour/roster", /roster/i);
  });

  test("navigate to payroll", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/labour/payroll", /payroll/i);
  });

  test("navigate to employees", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/labour/employees", /employee/i);
  });

  test("navigate to PeopleOS recruitment", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/labour/people/recruitment", /recruit/i);
  });
});
