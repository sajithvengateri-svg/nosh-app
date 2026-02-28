/**
 * ClockOS Portal — Clock Screen & Navigation E2E Tests
 *
 * Validates the clock-in screen, timesheets, employees list,
 * and PIN management page.
 */

import { test, expect } from "../../fixtures/auth.fixture";
import { assertPageHealthy } from "../../fixtures/auth.fixture";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function waitForClockPage(page: import("@playwright/test").Page) {
  await page.waitForLoadState("domcontentloaded");
  const content = page.locator("main, [role='main'], h1, h2, [data-testid]");
  await content.first().waitFor({ state: "visible", timeout: 15_000 });
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

test.describe("ClockOS Portal — Clock Screen & Navigation", () => {
  test.describe.configure({ mode: "serial" });

  test("clock screen loads with clock-in button", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await page.goto("/clock");
    await waitForClockPage(page);
    await assertPageHealthy(page);

    // The clock screen should have a clock-in/out button or a PIN entry
    const clockAction = page.getByRole("button", { name: /clock in|clock out|start shift/i }).first()
      .or(page.getByText(/clock in|clock out|enter pin/i).first());
    await expect(clockAction).toBeVisible({ timeout: 10_000 });
  });

  test("navigate to timesheets", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await page.goto("/clock/timesheets");
    await waitForClockPage(page);
    await assertPageHealthy(page);

    const heading = page.locator("h1, h2").filter({ hasText: /timesheet/i }).first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("navigate to employees list", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await page.goto("/clock/employees");
    await waitForClockPage(page);
    await assertPageHealthy(page);

    const heading = page.locator("h1, h2").filter({ hasText: /employee/i }).first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("PIN management page loads", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await page.goto("/clock/pins");
    await waitForClockPage(page);
    await assertPageHealthy(page);

    const heading = page.locator("h1, h2").filter({ hasText: /pin/i }).first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });
});
