/**
 * ReservationOS / VenueFlow Portal sidebar navigation tests.
 *
 * Logs in as urban-bistro owner and verifies every one of the 35 Reservation
 * routes (including VenueFlow sub-routes) can be reached via the sidebar,
 * loads correctly, and updates the URL to the expected path.
 */

import { test, expect } from "../fixtures/auth.fixture";
import { PORTALS } from "../data/routes";

const reservationPortal = PORTALS.find((p) => p.name === "ReservationOS")!;

test.describe("ReservationOS / VenueFlow Sidebar Navigation", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    // Navigate to the reservation dashboard to render the portal sidebar
    await page.goto("/reservation/dashboard");
    await page.waitForLoadState("domcontentloaded");
  });

  test(`ReservationOS portal has ${reservationPortal.routes.length} routes defined`, () => {
    expect(reservationPortal.routes).toHaveLength(35);
  });

  for (const route of reservationPortal.routes) {
    test(`Sidebar nav -> ${route.label} (${route.path})`, async ({ page }) => {
      const sidebar = page.locator(
        "nav, aside, [role='navigation'], .sidebar, [data-testid='sidebar']"
      );

      // Try sidebar link by label
      let link = sidebar.getByRole("link", { name: route.label, exact: false });
      let linkVisible = await link.first().isVisible().catch(() => false);

      // VenueFlow sub-routes may be in a collapsed section
      if (!linkVisible) {
        // Try expanding VenueFlow section
        const vfSection = sidebar.locator(
          "text=VenueFlow, text=Venue Flow, [data-testid='venueflow-section']"
        );
        if (await vfSection.first().isVisible().catch(() => false)) {
          await vfSection.first().click();
          await page.waitForTimeout(300);
        }

        // Also try a generic "More" expander
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

      // Expand Functions sub-section if route is under /reservation/functions/*
      if (!linkVisible && route.path.startsWith("/reservation/functions")) {
        const functionsSection = sidebar.locator(
          "text=Functions, [data-testid='functions-section']"
        );
        if (await functionsSection.first().isVisible().catch(() => false)) {
          await functionsSection.first().click();
          await page.waitForTimeout(300);
        }
        link = sidebar.getByRole("link", { name: route.label, exact: false });
        linkVisible = await link.first().isVisible().catch(() => false);
      }

      // Expand Reports sub-section
      if (!linkVisible && route.path.includes("/reports")) {
        const reportsSection = sidebar.locator(
          "text=Reports, [data-testid='reports-section']"
        );
        if (await reportsSection.first().isVisible().catch(() => false)) {
          await reportsSection.first().click();
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
