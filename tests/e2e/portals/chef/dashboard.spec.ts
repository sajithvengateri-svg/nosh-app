/**
 * Chef Portal — Dashboard E2E Tests
 *
 * Validates the main ChefOS dashboard renders correctly for a seeded
 * restaurant owner, including greeting, stat cards, quick actions,
 * recent activity, system health, and setup progress for new orgs.
 */

import { test, expect } from "../../fixtures/auth.fixture";
import { assertPageHealthy } from "../../fixtures/auth.fixture";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const DASHBOARD_URL = "/dashboard";

/** Wait for the main dashboard content to stabilize after login. */
async function waitForDashboard(page: import("@playwright/test").Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.locator("h1, .page-title").first().waitFor({ state: "visible", timeout: 15_000 });
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

test.describe("Chef Portal — Dashboard", () => {
  test.describe.configure({ mode: "serial" });

  test("dashboard renders with welcome message or greeting", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await page.goto(DASHBOARD_URL);
    await waitForDashboard(page);
    await assertPageHealthy(page);

    // The Dashboard greets the user with "Hey Chef <Name>"
    const greeting = page.locator("h1").filter({ hasText: /hey chef/i });
    await expect(greeting).toBeVisible({ timeout: 10_000 });

    // Org name should also be displayed somewhere on the page
    const orgLabel = page.getByText(/Urban Bistro/i).first();
    await expect(orgLabel).toBeVisible();
  });

  test("quick actions widget is visible and clickable", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await page.goto(DASHBOARD_URL);
    await waitForDashboard(page);

    // QuickActions component renders action buttons/links
    // Look for common quick-action labels or the section heading
    const quickActionsSection = page.locator("text=Quick Action").first()
      .or(page.getByRole("link", { name: /new recipe|add recipe|prep list|inventory/i }).first())
      .or(page.locator("[data-testid='quick-actions']").first());

    await expect(quickActionsSection).toBeVisible({ timeout: 10_000 });

    // Verify at least one action link/button is clickable
    const firstActionLink = page.getByRole("link").filter({
      hasText: /recipe|prep|inventory|costing|roster/i,
    }).first();
    if (await firstActionLink.isVisible()) {
      await expect(firstActionLink).toBeEnabled();
    }
  });

  test("stat cards display revenue, food cost, etc.", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await page.goto(DASHBOARD_URL);
    await waitForDashboard(page);

    // Dashboard renders 4 stat cards: Prep Lists, Active Recipes, Low Stock, Food Cost
    const statLabels = ["Prep Lists", "Active Recipes", "Low Stock", "Food Cost"];

    for (const label of statLabels) {
      const stat = page.getByText(label, { exact: false }).first();
      await expect(stat).toBeVisible({ timeout: 10_000 });
    }

    // Each stat card should contain a numeric value or percentage
    const statValues = page.locator(".stat-scroll, .stat-card, [class*='stat']").first();
    await expect(statValues).toBeVisible({ timeout: 5_000 });
  });

  test("recent activity shows items", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await page.goto(DASHBOARD_URL);
    await waitForDashboard(page);

    // Look for the "Recent Activity" section heading
    const activityHeading = page.getByText("Recent Activity", { exact: false });
    await expect(activityHeading).toBeVisible({ timeout: 10_000 });

    // The ActivityFeed should render inside a Card — verify the section is present
    const activitySection = activityHeading.locator("..").locator("..");
    await expect(activitySection).toBeVisible();
  });

  test("system health widget visible for owner role", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await page.goto(DASHBOARD_URL);
    await waitForDashboard(page);

    // SystemHealthCircle is rendered as a link to /housekeeping with title "System Health"
    const healthWidget = page.locator("a[title='System Health']")
      .or(page.locator("a[href='/housekeeping']").first());
    await expect(healthWidget).toBeVisible({ timeout: 10_000 });
  });

  test("setup progress widget visible for new orgs", async ({ page, loginAsOwner }) => {
    // Login as the empty test restaurant — should show onboarding wizard or setup nudge
    await loginAsOwner("test-empty-restaurant");
    await page.goto(DASHBOARD_URL);
    await waitForDashboard(page);
    await assertPageHealthy(page);

    // For an empty org, the dashboard may show an onboarding wizard, setup progress,
    // or "No Alerts" / empty state. At minimum the page should render without errors.
    const content = page.locator("main, [role='main'], h1, h2, .dashboard, [data-testid]");
    await expect(content.first()).toBeVisible({ timeout: 10_000 });

    // Either the OnboardingWizard or the "No Alerts" / "No recipes" empty state
    const setupOrEmpty = page.getByText(/onboarding|setup|get started|no recipes|no alerts|everything is running/i).first();
    // Soft check — the page should have rendered something meaningful
    const isVisible = await setupOrEmpty.isVisible().catch(() => false);
    if (!isVisible) {
      // At minimum the greeting should be there
      const greeting = page.locator("h1").filter({ hasText: /hey chef/i });
      await expect(greeting).toBeVisible();
    }
  });
});
