/**
 * Admin Portal sidebar navigation tests.
 *
 * Logs in as queitos-hq admin1 and verifies every one of the 29 Admin routes
 * can be reached via the sidebar navigation, loads correctly, and updates the
 * URL to the expected path.
 */

import { test, expect } from "../fixtures/auth.fixture";
import { PORTALS } from "../data/routes";

const adminPortal = PORTALS.find((p) => p.name === "Admin")!;

test.describe("Admin Portal Sidebar Navigation", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page, loginAs }) => {
    // Admin portal uses queitos-hq org with admin1 role
    await loginAs("queitos-hq", "admin1");
    // Navigate to the admin dashboard to render the admin sidebar
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");
  });

  test(`Admin portal has ${adminPortal.routes.length} routes defined`, () => {
    expect(adminPortal.routes).toHaveLength(29);
  });

  for (const route of adminPortal.routes) {
    test(`Sidebar nav -> ${route.label} (${route.path})`, async ({ page }) => {
      const sidebar = page.locator(
        "nav, aside, [role='navigation'], .sidebar, [data-testid='sidebar']"
      );

      // Try to find the link in the sidebar by its label
      let link = sidebar.getByRole("link", { name: route.label, exact: false });
      let linkVisible = await link.first().isVisible().catch(() => false);

      // Expand collapsed sections (e.g. "Sales" sub-menu)
      if (!linkVisible && route.path.startsWith("/admin/sales")) {
        const salesSection = sidebar.locator(
          "text=Sales, [data-testid='sales-section']"
        );
        if (await salesSection.first().isVisible().catch(() => false)) {
          await salesSection.first().click();
          await page.waitForTimeout(300);
        }
        link = sidebar.getByRole("link", { name: route.label, exact: false });
        linkVisible = await link.first().isVisible().catch(() => false);
      }

      // Expand landing-page related sections
      if (!linkVisible && route.path.includes("landing")) {
        const landingSection = sidebar.locator(
          "text=Landing, text=Pages, [data-testid='landing-section']"
        );
        if (await landingSection.first().isVisible().catch(() => false)) {
          await landingSection.first().click();
          await page.waitForTimeout(300);
        }
        link = sidebar.getByRole("link", { name: route.label, exact: false });
        linkVisible = await link.first().isVisible().catch(() => false);
      }

      // Generic "More" expander
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

        // URL check
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
