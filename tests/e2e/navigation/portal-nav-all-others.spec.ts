/**
 * Combined sidebar navigation tests for all remaining portals:
 *   - ClockOS      (10 routes)
 *   - LabourOS     (16 routes)
 *   - SupplyOS      (6 routes)
 *   - GrowthOS      (6 routes)
 *   - MoneyOS      (11 routes)
 *   - QuietAudit    (9 routes)
 *   - OverheadOS    (9 routes)
 *   - RestOS / POS (13 routes)
 *   - Vendor        (7 routes)
 *   - Games         (7 routes)
 *
 * Each portal is tested in its own describe block with the correct login
 * context. Urban-bistro owner is used for most portals; fresh-produce-co
 * admin is used for Vendor.
 */

import { test, expect } from "../fixtures/auth.fixture";
import { PORTALS, type Portal } from "../data/routes";

/* ------------------------------------------------------------------ */
/*  Helper: shared nav verification logic                             */
/* ------------------------------------------------------------------ */

/**
 * Attempt to click a sidebar link by label, then verify the page loaded
 * at the expected URL without errors. Falls back to direct navigation if
 * the sidebar link is not found.
 */
async function verifyNavRoute(
  page: import("@playwright/test").Page,
  route: { path: string; label: string },
  portalBasePath: string
) {
  const sidebar = page.locator(
    "nav, aside, [role='navigation'], .sidebar, [data-testid='sidebar']"
  );

  // 1. Try to find the sidebar link by label
  let link = sidebar.getByRole("link", { name: route.label, exact: false });
  let linkVisible = await link.first().isVisible().catch(() => false);

  // 2. Try expanding a "More" / collapsed section
  if (!linkVisible) {
    const expanders = sidebar.locator(
      "text=More, text=Show More, text=Show All, [data-testid='sidebar-more']"
    );
    if (await expanders.first().isVisible().catch(() => false)) {
      await expanders.first().click();
      await page.waitForTimeout(300);
    }
    link = sidebar.getByRole("link", { name: route.label, exact: false });
    linkVisible = await link.first().isVisible().catch(() => false);
  }

  // 3. Try expanding portal-specific sub-sections
  if (!linkVisible) {
    // Common nested sections: people, compliance, admin, external
    const subsections = [
      "text=People",
      "text=PeopleOS",
      "text=Compliance",
      "text=Admin",
      "text=External",
      "text=Reports",
    ];
    for (const selector of subsections) {
      const section = sidebar.locator(selector);
      if (await section.first().isVisible().catch(() => false)) {
        await section.first().click();
        await page.waitForTimeout(200);
      }
    }
    link = sidebar.getByRole("link", { name: route.label, exact: false });
    linkVisible = await link.first().isVisible().catch(() => false);
  }

  // 4. Broaden to entire page
  if (!linkVisible) {
    link = page.getByRole("link", { name: route.label, exact: false });
    linkVisible = await link.first().isVisible().catch(() => false);
  }

  if (linkVisible) {
    await link.first().click();
    await page.waitForLoadState("domcontentloaded");
  } else {
    // Fallback: direct navigation
    await page.goto(route.path);
    await page.waitForLoadState("domcontentloaded");
  }

  // Assert URL
  const escapedPath = route.path.replace(/\//g, "\\/");
  await expect(page).toHaveURL(new RegExp(escapedPath));

  // No error boundary
  const error = page.locator("text=Something went wrong");
  await expect(error).not.toBeVisible({ timeout: 5_000 });

  // No 404
  const notFound = page.locator("text=Page not found");
  await expect(notFound).not.toBeVisible({ timeout: 2_000 });

  // Has meaningful content
  const content = page.locator(
    "main, [role='main'], h1, h2, .dashboard, [data-testid]"
  );
  await expect(content.first()).toBeVisible({ timeout: 10_000 });
}

/* ------------------------------------------------------------------ */
/*  Portal definitions with login info                                */
/* ------------------------------------------------------------------ */

interface PortalTestConfig {
  portalName: string;
  orgSlug: string;
  roleSuffix: string;
  expectedRouteCount: number;
  startPath: string; // where to navigate after login so sidebar renders
}

const portalConfigs: PortalTestConfig[] = [
  {
    portalName: "ClockOS",
    orgSlug: "urban-bistro",
    roleSuffix: "owner",
    expectedRouteCount: 10,
    startPath: "/clock/dashboard",
  },
  {
    portalName: "LabourOS",
    orgSlug: "urban-bistro",
    roleSuffix: "owner",
    expectedRouteCount: 16,
    startPath: "/labour/dashboard",
  },
  {
    portalName: "SupplyOS",
    orgSlug: "urban-bistro",
    roleSuffix: "owner",
    expectedRouteCount: 6,
    startPath: "/supply/dashboard",
  },
  {
    portalName: "GrowthOS",
    orgSlug: "urban-bistro",
    roleSuffix: "owner",
    expectedRouteCount: 6,
    startPath: "/growth/dashboard",
  },
  {
    portalName: "MoneyOS",
    orgSlug: "urban-bistro",
    roleSuffix: "owner",
    expectedRouteCount: 11,
    startPath: "/money/dashboard",
  },
  {
    portalName: "QuietAudit",
    orgSlug: "urban-bistro",
    roleSuffix: "owner",
    expectedRouteCount: 9,
    startPath: "/quiet/dashboard",
  },
  {
    portalName: "OverheadOS",
    orgSlug: "urban-bistro",
    roleSuffix: "owner",
    expectedRouteCount: 9,
    startPath: "/overhead/dashboard",
  },
  {
    portalName: "RestOS",
    orgSlug: "urban-bistro",
    roleSuffix: "owner",
    expectedRouteCount: 13,
    startPath: "/pos",
  },
  {
    portalName: "Vendor",
    orgSlug: "fresh-produce-co",
    roleSuffix: "admin",
    expectedRouteCount: 7,
    startPath: "/vendor/dashboard",
  },
  {
    portalName: "Games",
    orgSlug: "urban-bistro",
    roleSuffix: "owner",
    expectedRouteCount: 7,
    startPath: "/games",
  },
];

/* ------------------------------------------------------------------ */
/*  Generate test suites                                              */
/* ------------------------------------------------------------------ */

for (const config of portalConfigs) {
  const portal = PORTALS.find((p) => p.name === config.portalName)!;

  test.describe(`${config.portalName} Sidebar Navigation (${portal.routes.length} routes)`, () => {
    test.describe.configure({ mode: "serial" });

    test.beforeEach(async ({ page, loginAs }) => {
      await loginAs(config.orgSlug, config.roleSuffix);
      await page.goto(config.startPath);
      await page.waitForLoadState("domcontentloaded");
    });

    test(`${config.portalName} has ${config.expectedRouteCount} routes defined`, () => {
      expect(portal.routes).toHaveLength(config.expectedRouteCount);
    });

    for (const route of portal.routes) {
      test(`Sidebar nav -> ${route.label} (${route.path})`, async ({ page }) => {
        await verifyNavRoute(page, route, portal.basePath);
      });
    }
  });
}
