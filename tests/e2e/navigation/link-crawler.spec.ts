/**
 * Comprehensive link-crawler E2E tests.
 *
 * For every portal defined in the route map, this file:
 *   1. Logs in as the appropriate user (org + role).
 *   2. Navigates to every declared route.
 *   3. Asserts the page loads without error-boundaries or 404s.
 *   4. Confirms meaningful visible content is present.
 *   5. Measures and logs load time.
 *
 * It also includes a recursive link-discovery test that starts at /dashboard,
 * crawls every internal <a href="/..."> link, and reports broken pages.
 */

import { test, expect } from "../fixtures/auth.fixture";
import { PORTALS, PUBLIC_ROUTES, TOTAL_ROUTES, type Portal } from "../data/routes";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/** Map a portal name to the org slug + role suffix used for login. */
function credentialsForPortal(portal: Portal): { orgSlug: string; roleSuffix: string } {
  switch (portal.name) {
    case "Vendor":
      return { orgSlug: "fresh-produce-co", roleSuffix: "admin" };
    case "Admin":
      return { orgSlug: "queitos-hq", roleSuffix: "admin1" };
    default:
      // Chef, BevOS, ClockOS, LabourOS, SupplyOS, GrowthOS, MoneyOS,
      // QuietAudit, OverheadOS, ReservationOS, RestOS, Games
      return { orgSlug: "urban-bistro", roleSuffix: "owner" };
  }
}

/**
 * Assert the page is healthy: no error boundary, no 404, and at least one
 * visible content element.
 */
async function assertPageIsHealthy(page: import("@playwright/test").Page) {
  // Wait a moment for any lazy rendering
  await page.waitForLoadState("domcontentloaded");

  // Error boundary
  const errorBoundary = page.locator("text=Something went wrong");
  await expect(errorBoundary).not.toBeVisible({ timeout: 5_000 });

  // 404 / page not found
  const notFound = page.locator("text=Page not found");
  await expect(notFound).not.toBeVisible({ timeout: 2_000 });
  const notFound404 = page.locator("text=404");
  await expect(notFound404).not.toBeVisible({ timeout: 2_000 });

  // Meaningful content should be present
  const contentLocator = page.locator(
    "main, [role='main'], h1, h2, .dashboard, [data-testid]"
  );
  await expect(contentLocator.first()).toBeVisible({ timeout: 10_000 });
}

/* ------------------------------------------------------------------ */
/*  Per-portal route tests                                            */
/* ------------------------------------------------------------------ */

for (const portal of PORTALS) {
  const { orgSlug, roleSuffix } = credentialsForPortal(portal);

  test.describe(`Link Crawler - ${portal.name} (${portal.routes.length} routes)`, () => {
    // Tag so CI can filter by portal
    test.describe.configure({ mode: "serial" });

    for (const route of portal.routes) {
      test(`${route.path} loads without errors`, async ({ page, loginAs }) => {
        // Authenticate
        await loginAs(orgSlug, roleSuffix);

        // Navigate & measure
        const start = Date.now();
        await page.goto(route.path);
        await page.waitForLoadState("domcontentloaded");
        const loadMs = Date.now() - start;

        // Health assertions
        await assertPageIsHealthy(page);

        // Log timing (visible in Playwright report & console)
        // eslint-disable-next-line no-console
        console.log(
          `[${portal.name}] ${route.path} (${route.label}) loaded in ${loadMs}ms`
        );

        // Soft performance gate: warn if page takes more than 8 s
        if (loadMs > 8_000) {
          console.warn(
            `SLOW PAGE: ${route.path} took ${loadMs}ms (> 8 000 ms threshold)`
          );
        }
      });
    }
  });
}

/* ------------------------------------------------------------------ */
/*  Public routes (no auth)                                           */
/* ------------------------------------------------------------------ */

test.describe("Link Crawler - Public Routes", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route.path} loads without errors (public)`, async ({ page }) => {
      const start = Date.now();
      await page.goto(route.path);
      await page.waitForLoadState("domcontentloaded");
      const loadMs = Date.now() - start;

      // Public pages may not have <main>, so relax content check
      const errorBoundary = page.locator("text=Something went wrong");
      await expect(errorBoundary).not.toBeVisible({ timeout: 5_000 });

      // 404 check (except the auth page itself, which may redirect)
      if (route.path !== "/auth" && route.path !== "/reset-password") {
        const notFound = page.locator("text=Page not found");
        await expect(notFound).not.toBeVisible({ timeout: 2_000 });
      }

      // At least some content
      const body = page.locator("body");
      await expect(body).not.toBeEmpty();

      console.log(
        `[Public] ${route.path} (${route.label}) loaded in ${loadMs}ms`
      );
    });
  }
});

/* ------------------------------------------------------------------ */
/*  Meta: total route count sanity check                              */
/* ------------------------------------------------------------------ */

test("Route map covers expected total routes", () => {
  const counted =
    PORTALS.reduce((sum, p) => sum + p.routes.length, 0) + PUBLIC_ROUTES.length;
  expect(counted).toBe(TOTAL_ROUTES);
  console.log(`Total routes in map: ${TOTAL_ROUTES}`);
});

/* ------------------------------------------------------------------ */
/*  Recursive link discovery crawler                                  */
/* ------------------------------------------------------------------ */

test.describe("Recursive Link Discovery", () => {
  test("crawl from /dashboard and report broken links", async ({ page, loginAsOwner }) => {
    // Login as urban-bistro owner for maximum access
    await loginAsOwner("urban-bistro");

    const visited = new Set<string>();
    const broken: { url: string; reason: string }[] = [];
    const queue: string[] = ["/dashboard"];

    // Limit crawl depth to avoid infinite loops on very large apps
    const MAX_PAGES = 150;
    const INTERNAL_LINK_RE = /^\/[^/].*$/; // starts with / but not //

    while (queue.length > 0 && visited.size < MAX_PAGES) {
      const currentPath = queue.shift()!;

      // Skip if already visited
      if (visited.has(currentPath)) continue;
      visited.add(currentPath);

      try {
        const response = await page.goto(currentPath, { timeout: 15_000 });
        await page.waitForLoadState("domcontentloaded");

        // Check for HTTP errors
        if (response && response.status() >= 400) {
          broken.push({
            url: currentPath,
            reason: `HTTP ${response.status()}`,
          });
          continue;
        }

        // Check for error boundary
        const hasError = await page
          .locator("text=Something went wrong")
          .isVisible()
          .catch(() => false);
        if (hasError) {
          broken.push({ url: currentPath, reason: "Error boundary" });
          continue;
        }

        // Check for 404
        const has404 = await page
          .locator("text=Page not found")
          .isVisible()
          .catch(() => false);
        if (has404) {
          broken.push({ url: currentPath, reason: "Page not found / 404" });
          continue;
        }

        // Collect all internal links on this page
        const hrefs = await page.$$eval("a[href]", (anchors) =>
          anchors
            .map((a) => a.getAttribute("href") ?? "")
            .filter((h) => h.startsWith("/"))
        );

        for (const href of hrefs) {
          // Normalise: strip query params & hash for uniqueness
          const clean = href.split("?")[0].split("#")[0];
          if (INTERNAL_LINK_RE.test(clean) && !visited.has(clean)) {
            queue.push(clean);
          }
        }
      } catch (err) {
        broken.push({
          url: currentPath,
          reason: `Navigation error: ${(err as Error).message}`,
        });
      }
    }

    // Report
    console.log(`\n--- Link Discovery Report ---`);
    console.log(`Pages visited : ${visited.size}`);
    console.log(`Broken links  : ${broken.length}`);
    if (broken.length > 0) {
      console.table(broken);
    }
    console.log(`-----------------------------\n`);

    // Assert no broken links found
    expect(
      broken,
      `Found ${broken.length} broken link(s):\n${broken.map((b) => `  ${b.url} - ${b.reason}`).join("\n")}`
    ).toHaveLength(0);
  });
});
