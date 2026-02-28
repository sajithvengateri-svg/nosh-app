/**
 * Games / Mastery Portal — Game Hub & Navigation E2E Tests
 *
 * Validates the game hub loads and navigation to gauntlet, edge,
 * onion blitz, leaderboard, and player profile.
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

test.describe("Games / Mastery Portal — Game Hub & Navigation", () => {
  test.describe.configure({ mode: "serial" });

  test("game hub loads", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await page.goto("/games");
    await page.waitForLoadState("domcontentloaded");
    await assertPageHealthy(page);

    const content = page.locator("main, [role='main'], h1, h2, [data-testid]");
    await expect(content.first()).toBeVisible({ timeout: 15_000 });

    // Game hub should show game titles or a hub heading
    const heading = page.locator("h1, h2").filter({ hasText: /game|mastery|hub|arena/i }).first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("navigate to gauntlet", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/games/gauntlet", /gauntlet/i);
  });

  test("navigate to edge", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/games/edge", /edge/i);
  });

  test("navigate to onion blitz", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/games/onion-blitz", /onion|blitz/i);
  });

  test("navigate to leaderboard", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/games/leaderboard", /leaderboard|ranking/i);
  });

  test("navigate to player profile", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await navigateAndAssert(page, "/games/profile", /profile|player|stats/i);
  });
});
