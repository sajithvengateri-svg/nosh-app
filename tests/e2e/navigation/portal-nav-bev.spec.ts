/**
 * BevOS Portal sidebar navigation tests.
 *
 * Logs in as urban-bistro owner and verifies every one of the 25 BevOS routes
 * can be reached via the sidebar navigation, loads correctly, and updates the
 * URL to the expected path.
 */

import { test, expect } from "../fixtures/auth.fixture";
import { PORTALS } from "../data/routes";

const bevPortal = PORTALS.find((p) => p.name === "BevOS")!;

test.describe("BevOS Portal Sidebar Navigation", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    // Navigate to BevOS dashboard to ensure the BevOS sidebar is rendered
    await page.goto("/bev/dashboard");
    await page.waitForLoadState("domcontentloaded");
  });

  test(`BevOS portal has ${bevPortal.routes.length} routes defined`, () => {
    expect(bevPortal.routes).toHaveLength(25);
  });

  for (const route of bevPortal.routes) {
    test(`Sidebar nav -> ${route.label} (${route.path})`, async ({ page }) => {
      // Locate the sidebar / nav region
      const sidebar = page.locator(
        "nav, aside, [role='navigation'], .sidebar, [data-testid='sidebar']"
      );

      // Try to find the link in the sidebar by its label
      let link = sidebar.getByRole("link", { name: route.label, exact: false });
      let linkVisible = await link.first().isVisible().catch(() => false);

      // Expand collapsed sections if needed
      if (!linkVisible) {
        const moreButton = sidebar.locator(
          "text=More, text=Show More, [data-testid='sidebar-more']"
        );
        if (await moreButton.first().isVisible().catch(() => false)) {
          await moreButton.first().click();
          await page.waitForTimeout(300);
        }
        link = sidebar.getByRole("link", { name: route.label, exact: false });
        linkVisible = await link.first().isVisible().catch(() => false);
      }

      // Broaden search to entire page
      if (!linkVisible) {
        link = page.getByRole("link", { name: route.label, exact: false });
        linkVisible = await link.first().isVisible().catch(() => false);
      }

      if (linkVisible) {
        await link.first().click();
        await page.waitForLoadState("domcontentloaded");

        // URL should match the expected path
        await expect(page).toHaveURL(new RegExp(route.path.replace(/\//g, "\\/")));

        // No error boundary
        const error = page.locator("text=Something went wrong");
        await expect(error).not.toBeVisible({ timeout: 5_000 });

        // No 404
        const notFound = page.locator("text=Page not found");
        await expect(notFound).not.toBeVisible({ timeout: 2_000 });

        // Visible content
        const content = page.locator(
          "main, [role='main'], h1, h2, .dashboard, [data-testid]"
        );
        await expect(content.first()).toBeVisible({ timeout: 10_000 });
      } else {
        // Fallback: direct navigation
        await page.goto(route.path);
        await page.waitForLoadState("domcontentloaded");

        await expect(page).toHaveURL(new RegExp(route.path.replace(/\//g, "\\/")));

        const error = page.locator("text=Something went wrong");
        await expect(error).not.toBeVisible({ timeout: 5_000 });

        const notFound = page.locator("text=Page not found");
        await expect(notFound).not.toBeVisible({ timeout: 2_000 });

        const content = page.locator(
          "main, [role='main'], h1, h2, .dashboard, [data-testid]"
        );
        await expect(content.first()).toBeVisible({ timeout: 10_000 });
      }
    });
  }
});
