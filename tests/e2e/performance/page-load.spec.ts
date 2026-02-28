/**
 * Performance benchmark E2E tests.
 *
 * Each test logs in as the urban-bistro owner, navigates to a page or performs
 * an action, measures the elapsed time, and asserts it stays within a target
 * budget.  Actual measurements are attached as test annotations so they appear
 * in the Playwright HTML report.
 */

import { test, expect } from "../fixtures/auth.fixture";
import { measurePageLoad, assertPageHealthy } from "../fixtures/auth.fixture";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Log & annotate a timing measurement on the current test. */
function recordTiming(
  testInfo: ReturnType<typeof test.info>,
  label: string,
  ms: number,
  targetMs: number
) {
  const status = ms <= targetMs ? "PASS" : "OVER";
  testInfo.annotations.push({
    type: "perf",
    description: `${label}: ${ms}ms (target ${targetMs}ms) [${status}]`,
  });
  console.log(
    `  [perf] ${label}: ${ms}ms / ${targetMs}ms target — ${status}`
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("Page Load Performance", () => {
  // All performance tests run serially so measurements are not polluted by
  // parallel browser activity.
  test.describe.configure({ mode: "serial" });

  // -----------------------------------------------------------------------
  // 1. Landing page cold load < 3000 ms
  // -----------------------------------------------------------------------
  test("1 - Landing page cold load < 3000ms", async ({ page }) => {
    const TARGET = 3_000;

    const start = Date.now();
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Wait for the Largest Contentful Paint candidate to be visible
    await page
      .locator("main, [role='main'], h1, h2, .hero, .landing")
      .first()
      .waitFor({ state: "visible", timeout: 10_000 });
    const elapsed = Date.now() - start;

    recordTiming(test.info(), "Landing cold load", elapsed, TARGET);
    expect(elapsed, `Landing page took ${elapsed}ms (target ${TARGET}ms)`).toBeLessThanOrEqual(TARGET);
  });

  // -----------------------------------------------------------------------
  // 2. Dashboard load (authenticated) < 2000 ms
  // -----------------------------------------------------------------------
  test("2 - Dashboard load (authenticated) < 2000ms", async ({
    page,
    loginAsOwner,
  }) => {
    const TARGET = 2_000;

    await loginAsOwner("urban-bistro");

    const start = Date.now();
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    await page
      .locator("main, [role='main'], .dashboard, h1, h2")
      .first()
      .waitFor({ state: "visible", timeout: 10_000 });
    const elapsed = Date.now() - start;

    await assertPageHealthy(page);
    recordTiming(test.info(), "Dashboard load", elapsed, TARGET);
    expect(elapsed, `Dashboard took ${elapsed}ms (target ${TARGET}ms)`).toBeLessThanOrEqual(TARGET);
  });

  // -----------------------------------------------------------------------
  // 3. SPA route transition < 500 ms
  // -----------------------------------------------------------------------
  test("3 - SPA route transition /dashboard -> /recipes < 500ms", async ({
    page,
    loginAsOwner,
  }) => {
    const TARGET = 500;

    await loginAsOwner("urban-bistro");
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Find and click the Recipes link in the sidebar / nav
    const recipesLink = page.getByRole("link", { name: /recipe/i }).first();
    await expect(recipesLink).toBeVisible({ timeout: 10_000 });

    const start = Date.now();
    await recipesLink.click();

    // Wait for the recipes page content to appear
    await page.waitForURL(/\/recipes/, { timeout: 5_000 });
    await page
      .locator("main, [role='main'], h1, h2, [data-testid]")
      .first()
      .waitFor({ state: "visible", timeout: 5_000 });
    const elapsed = Date.now() - start;

    recordTiming(test.info(), "SPA transition dash->recipes", elapsed, TARGET);
    expect(elapsed, `Transition took ${elapsed}ms (target ${TARGET}ms)`).toBeLessThanOrEqual(TARGET);
  });

  // -----------------------------------------------------------------------
  // 4. Todo page render < 1000 ms
  // -----------------------------------------------------------------------
  test("4 - Todo page with items < 1000ms", async ({
    page,
    loginAsOwner,
  }) => {
    const TARGET = 1_000;

    await loginAsOwner("urban-bistro");

    const start = Date.now();
    await page.goto("/todo");
    await page.waitForLoadState("domcontentloaded");
    await page
      .locator("main, [role='main'], h1, h2, [data-testid], .todo")
      .first()
      .waitFor({ state: "visible", timeout: 10_000 });
    const elapsed = Date.now() - start;

    await assertPageHealthy(page);
    recordTiming(test.info(), "Todo page load", elapsed, TARGET);
    expect(elapsed, `Todo took ${elapsed}ms (target ${TARGET}ms)`).toBeLessThanOrEqual(TARGET);
  });

  // -----------------------------------------------------------------------
  // 5. POS order screen < 1500 ms
  // -----------------------------------------------------------------------
  test("5 - POS order screen < 1500ms", async ({
    page,
    loginAsOwner,
  }) => {
    const TARGET = 1_500;

    await loginAsOwner("urban-bistro");

    const start = Date.now();
    await page.goto("/pos");
    await page.waitForLoadState("domcontentloaded");
    await page
      .locator("main, [role='main'], h1, h2, [data-testid], .pos")
      .first()
      .waitFor({ state: "visible", timeout: 10_000 });
    const elapsed = Date.now() - start;

    await assertPageHealthy(page);
    recordTiming(test.info(), "POS order screen", elapsed, TARGET);
    expect(elapsed, `POS took ${elapsed}ms (target ${TARGET}ms)`).toBeLessThanOrEqual(TARGET);
  });

  // -----------------------------------------------------------------------
  // 6. Kanban board with items < 800 ms
  // -----------------------------------------------------------------------
  test("6 - Kanban board on /todo < 800ms", async ({
    page,
    loginAsOwner,
  }) => {
    const TARGET = 800;

    await loginAsOwner("urban-bistro");
    await page.goto("/todo");
    await page.waitForLoadState("networkidle");

    // Look for a kanban/board toggle button
    const kanbanToggle = page.locator(
      "button:has-text('Board'), button:has-text('Kanban'), [data-testid*='kanban'], [aria-label*='board'], [aria-label*='kanban']"
    );

    if (await kanbanToggle.first().isVisible().catch(() => false)) {
      const start = Date.now();
      await kanbanToggle.first().click();

      // Wait for kanban columns to render
      await page
        .locator(
          "[data-testid*='kanban'], [data-testid*='column'], .kanban, [class*='kanban'], [class*='board-column'], [role='list']"
        )
        .first()
        .waitFor({ state: "visible", timeout: 10_000 });
      const elapsed = Date.now() - start;

      recordTiming(test.info(), "Kanban board render", elapsed, TARGET);
      expect(elapsed, `Kanban took ${elapsed}ms (target ${TARGET}ms)`).toBeLessThanOrEqual(TARGET);
    } else {
      // If no kanban toggle is found, measure the page load itself
      const loadTime = await measurePageLoad(page, "/todo");

      recordTiming(test.info(), "Todo page (no kanban toggle)", loadTime, TARGET);
      expect(loadTime, `Todo fallback took ${loadTime}ms (target ${TARGET}ms)`).toBeLessThanOrEqual(TARGET);
    }
  });

  // -----------------------------------------------------------------------
  // 7. Recipe list with many recipes < 2000 ms
  // -----------------------------------------------------------------------
  test("7 - Recipe list < 2000ms", async ({ page, loginAsOwner }) => {
    const TARGET = 2_000;

    await loginAsOwner("urban-bistro");

    const start = Date.now();
    await page.goto("/recipes");
    await page.waitForLoadState("domcontentloaded");
    await page
      .locator("main, [role='main'], h1, h2, [data-testid], .recipe")
      .first()
      .waitFor({ state: "visible", timeout: 10_000 });
    const elapsed = Date.now() - start;

    await assertPageHealthy(page);
    recordTiming(test.info(), "Recipe list load", elapsed, TARGET);
    expect(elapsed, `Recipes took ${elapsed}ms (target ${TARGET}ms)`).toBeLessThanOrEqual(TARGET);
  });

  // -----------------------------------------------------------------------
  // 8. Reservation diary < 2000 ms
  // -----------------------------------------------------------------------
  test("8 - Reservation diary < 2000ms", async ({
    page,
    loginAsOwner,
  }) => {
    const TARGET = 2_000;

    await loginAsOwner("urban-bistro");

    const start = Date.now();
    await page.goto("/reservation/diary");
    await page.waitForLoadState("domcontentloaded");
    await page
      .locator("main, [role='main'], h1, h2, [data-testid], .diary, .calendar")
      .first()
      .waitFor({ state: "visible", timeout: 10_000 });
    const elapsed = Date.now() - start;

    await assertPageHealthy(page);
    recordTiming(test.info(), "Reservation diary", elapsed, TARGET);
    expect(elapsed, `Diary took ${elapsed}ms (target ${TARGET}ms)`).toBeLessThanOrEqual(TARGET);
  });

  // -----------------------------------------------------------------------
  // 9. MoneyOS P&L chart < 2000 ms
  // -----------------------------------------------------------------------
  test("9 - MoneyOS P&L chart < 2000ms", async ({
    page,
    loginAsOwner,
  }) => {
    const TARGET = 2_000;

    await loginAsOwner("urban-bistro");

    const start = Date.now();
    await page.goto("/money/pnl");
    await page.waitForLoadState("domcontentloaded");
    await page
      .locator(
        "main, [role='main'], h1, h2, [data-testid], canvas, svg, .chart, .pnl"
      )
      .first()
      .waitFor({ state: "visible", timeout: 10_000 });
    const elapsed = Date.now() - start;

    await assertPageHealthy(page);
    recordTiming(test.info(), "MoneyOS P&L", elapsed, TARGET);
    expect(elapsed, `P&L took ${elapsed}ms (target ${TARGET}ms)`).toBeLessThanOrEqual(TARGET);
  });

  // -----------------------------------------------------------------------
  // 10. Search response < 300 ms
  // -----------------------------------------------------------------------
  test("10 - Search response on /todo < 300ms", async ({
    page,
    loginAsOwner,
  }) => {
    const TARGET = 300;

    await loginAsOwner("urban-bistro");
    await page.goto("/todo");
    await page.waitForLoadState("networkidle");

    // Find a search / filter input on the page
    const searchInput = page.locator(
      "input[type='search'], input[placeholder*='search' i], input[placeholder*='filter' i], [data-testid*='search']"
    );

    await expect(searchInput.first()).toBeVisible({ timeout: 10_000 });

    // Type a search term and measure how quickly results update
    const start = Date.now();
    await searchInput.first().fill("prep");

    // Wait for the UI to update — either a result list changes or a loading
    // indicator appears and disappears
    await page.waitForTimeout(100); // tiny debounce allowance
    await page
      .locator(
        "[data-testid*='result'], [data-testid*='todo-item'], li, tr, .task, .todo-item"
      )
      .first()
      .waitFor({ state: "visible", timeout: 5_000 })
      .catch(() => {});
    const elapsed = Date.now() - start;

    recordTiming(test.info(), "Search response", elapsed, TARGET);
    expect(elapsed, `Search took ${elapsed}ms (target ${TARGET}ms)`).toBeLessThanOrEqual(TARGET);
  });

  // -----------------------------------------------------------------------
  // 11. Dialog open < 200 ms
  // -----------------------------------------------------------------------
  test("11 - Dialog open (add task) < 200ms", async ({
    page,
    loginAsOwner,
  }) => {
    const TARGET = 200;

    await loginAsOwner("urban-bistro");
    await page.goto("/todo");
    await page.waitForLoadState("networkidle");

    // Find the add-task / new-task button
    const addButton = page.locator(
      "button:has-text('Add'), button:has-text('New'), button[aria-label*='add' i], button[aria-label*='new' i], [data-testid*='add-task'], [data-testid*='new-task']"
    );

    await expect(addButton.first()).toBeVisible({ timeout: 10_000 });

    const start = Date.now();
    await addButton.first().click();

    // Wait for the dialog / modal to become visible
    await page
      .locator(
        "[role='dialog'], [data-testid*='dialog'], [data-testid*='modal'], .dialog, .modal"
      )
      .first()
      .waitFor({ state: "visible", timeout: 5_000 });
    const elapsed = Date.now() - start;

    recordTiming(test.info(), "Dialog open", elapsed, TARGET);
    expect(elapsed, `Dialog took ${elapsed}ms (target ${TARGET}ms)`).toBeLessThanOrEqual(TARGET);
  });

  // -----------------------------------------------------------------------
  // 12. Bundle size check
  // -----------------------------------------------------------------------
  test("12 - Main JS bundle < 500 KB", async ({ page, loginAsOwner }) => {
    const TARGET_KB = 500;

    await loginAsOwner("urban-bistro");
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Collect all JS resource entries from the Performance API
    const jsEntries = await page.evaluate(() => {
      const entries = performance.getEntriesByType(
        "resource"
      ) as PerformanceResourceTiming[];
      return entries
        .filter(
          (e) =>
            e.initiatorType === "script" ||
            e.name.endsWith(".js") ||
            e.name.includes(".js?")
        )
        .map((e) => ({
          name: e.name.split("/").pop()?.split("?")[0] || e.name,
          fullUrl: e.name,
          transferSize: e.transferSize,
          encodedBodySize: e.encodedBodySize,
          decodedBodySize: e.decodedBodySize,
        }));
    });

    // Find the largest JS bundle (typically the main or vendor chunk)
    const sorted = [...jsEntries].sort(
      (a, b) => (b.transferSize || b.decodedBodySize) - (a.transferSize || a.decodedBodySize)
    );

    if (sorted.length > 0) {
      const largest = sorted[0];
      const sizeKB = Math.round(
        (largest.transferSize || largest.decodedBodySize) / 1024
      );

      test.info().annotations.push({
        type: "perf",
        description: `Largest JS bundle: ${largest.name} — ${sizeKB} KB (target ${TARGET_KB} KB)`,
      });
      console.log(
        `  [perf] Largest JS bundle: ${largest.name} — ${sizeKB} KB / ${TARGET_KB} KB target`
      );

      // Log top 5 bundles for visibility
      for (const entry of sorted.slice(0, 5)) {
        const kb = Math.round(
          (entry.transferSize || entry.decodedBodySize) / 1024
        );
        console.log(`    ${entry.name}: ${kb} KB`);
      }

      expect(
        sizeKB,
        `Largest bundle ${largest.name} is ${sizeKB} KB (target ${TARGET_KB} KB)`
      ).toBeLessThanOrEqual(TARGET_KB);
    } else {
      // No JS entries found — likely due to caching or SSR; skip gracefully
      test.info().annotations.push({
        type: "perf",
        description: "No JS resource entries found (possibly cached)",
      });
    }

    // Also check total JS payload
    const totalKB = Math.round(
      jsEntries.reduce(
        (sum, e) => sum + (e.transferSize || e.decodedBodySize),
        0
      ) / 1024
    );
    const TOTAL_TARGET_KB = 2_000;
    test.info().annotations.push({
      type: "perf",
      description: `Total JS payload: ${totalKB} KB (target ${TOTAL_TARGET_KB} KB)`,
    });
    console.log(
      `  [perf] Total JS payload: ${totalKB} KB / ${TOTAL_TARGET_KB} KB target`
    );
    expect(
      totalKB,
      `Total JS is ${totalKB} KB (target ${TOTAL_TARGET_KB} KB)`
    ).toBeLessThanOrEqual(TOTAL_TARGET_KB);
  });

  // -----------------------------------------------------------------------
  // 13. Memory after 50 navigations < 150 MB
  // -----------------------------------------------------------------------
  test("13 - Memory after 50 navigations < 150 MB", async ({
    page,
    loginAsOwner,
  }) => {
    const TARGET_MB = 150;
    const NAVIGATION_COUNT = 50;

    // This test only works in Chromium which exposes performance.memory
    const isChromium = test.info().project.name.includes("chrome");
    if (!isChromium) {
      test.skip(true, "Memory measurement requires Chromium");
      return;
    }

    await loginAsOwner("urban-bistro");

    // Define a set of routes to cycle through
    const routes = [
      "/dashboard",
      "/recipes",
      "/todo",
      "/ingredients",
      "/inventory",
      "/prep",
      "/team",
      "/settings",
      "/costing",
      "/calendar",
      "/kitchen",
      "/roster",
      "/allergens",
      "/menu-engineering",
      "/pos",
      "/money/dashboard",
      "/money/pnl",
      "/reservation/dashboard",
      "/reservation/diary",
      "/food-safety",
    ];

    // Record initial heap size
    const initialHeap = await page.evaluate(() => {
      if ((performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return null;
    });

    // Navigate through routes in a round-robin pattern
    for (let i = 0; i < NAVIGATION_COUNT; i++) {
      const route = routes[i % routes.length];
      await page.goto(route);
      await page.waitForLoadState("domcontentloaded");
      // Small pause to allow GC opportunity
      if (i % 10 === 9) {
        await page.waitForTimeout(500);
      }
    }

    // Force a GC if possible (Chromium only, via CDP)
    try {
      const cdpSession = await page.context().newCDPSession(page);
      await cdpSession.send("HeapProfiler.collectGarbage");
      await cdpSession.detach();
    } catch {
      // CDP not available — continue without forced GC
    }

    await page.waitForTimeout(1_000);

    // Measure final heap
    const finalHeap = await page.evaluate(() => {
      if ((performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return null;
    });

    if (finalHeap !== null) {
      const finalMB = Math.round(finalHeap / (1024 * 1024));
      const initialMB = initialHeap
        ? Math.round(initialHeap / (1024 * 1024))
        : 0;
      const deltaMB = finalMB - initialMB;

      test.info().annotations.push({
        type: "perf",
        description: `Heap after ${NAVIGATION_COUNT} navs: ${finalMB} MB (initial ${initialMB} MB, delta ${deltaMB} MB, target ${TARGET_MB} MB)`,
      });
      console.log(
        `  [perf] Heap: ${finalMB} MB (initial ${initialMB} MB, +${deltaMB} MB) / ${TARGET_MB} MB target`
      );

      expect(
        finalMB,
        `Heap is ${finalMB} MB after ${NAVIGATION_COUNT} navigations (target ${TARGET_MB} MB)`
      ).toBeLessThanOrEqual(TARGET_MB);
    } else {
      test.info().annotations.push({
        type: "perf",
        description:
          "performance.memory not available — skipping heap assertion",
      });
      console.log(
        "  [perf] performance.memory not available — skipping heap check"
      );
    }
  });
});
