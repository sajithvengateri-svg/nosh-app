/**
 * Home Cook feature gating tests (15 scenarios).
 *
 * Logs in as "home-cook-au-1" owner (store_mode=home_cook) and verifies:
 *   - Accessible routes: dashboard, recipes, kitchen, todo, food-safety,
 *     cheatsheets, settings, feedback
 *   - Gated routes (hidden or redirected): inventory, prep, production,
 *     menu-engineering, roster
 *   - UI label overrides: "My Recipes" instead of "Recipe Bank",
 *     "My Day" instead of "To Do Command Portal"
 */

import { test, expect } from "../fixtures/auth.fixture";

const HOME_COOK_ORG = "home-cook-au-1";

test.describe("Home Cook Feature Gating", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page, loginAsOwner }) => {
    await loginAsOwner(HOME_COOK_ORG);
  });

  // ── Accessible routes (scenarios 1-8) ────────────────────────────

  test("1. Can access /dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    // Should not redirect to auth
    expect(page.url()).not.toContain("/auth");

    // No error boundary
    const error = page.locator("text=Something went wrong");
    await expect(error).not.toBeVisible({ timeout: 5_000 });

    // No 404
    const notFound = page.locator("text=Page not found");
    await expect(notFound).not.toBeVisible({ timeout: 2_000 });

    // Has content
    const content = page.locator("main, [role='main'], h1, h2, .dashboard, [data-testid]");
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });

  test("2. Can access /recipes", async ({ page }) => {
    await page.goto("/recipes");
    await page.waitForLoadState("domcontentloaded");

    expect(page.url()).not.toContain("/auth");
    expect(page.url()).toContain("/recipes");

    const error = page.locator("text=Something went wrong");
    await expect(error).not.toBeVisible({ timeout: 5_000 });

    const notFound = page.locator("text=Page not found");
    await expect(notFound).not.toBeVisible({ timeout: 2_000 });

    const content = page.locator("main, [role='main'], h1, h2, [data-testid]");
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });

  test("3. Can access /kitchen", async ({ page }) => {
    await page.goto("/kitchen");
    await page.waitForLoadState("domcontentloaded");

    expect(page.url()).not.toContain("/auth");
    expect(page.url()).toContain("/kitchen");

    const error = page.locator("text=Something went wrong");
    await expect(error).not.toBeVisible({ timeout: 5_000 });

    const notFound = page.locator("text=Page not found");
    await expect(notFound).not.toBeVisible({ timeout: 2_000 });

    const content = page.locator("main, [role='main'], h1, h2, [data-testid]");
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });

  test("4. Can access /todo", async ({ page }) => {
    await page.goto("/todo");
    await page.waitForLoadState("domcontentloaded");

    expect(page.url()).not.toContain("/auth");
    expect(page.url()).toContain("/todo");

    const error = page.locator("text=Something went wrong");
    await expect(error).not.toBeVisible({ timeout: 5_000 });

    const notFound = page.locator("text=Page not found");
    await expect(notFound).not.toBeVisible({ timeout: 2_000 });

    const content = page.locator("main, [role='main'], h1, h2, [data-testid]");
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });

  test("5. Can access /food-safety", async ({ page }) => {
    await page.goto("/food-safety");
    await page.waitForLoadState("domcontentloaded");

    expect(page.url()).not.toContain("/auth");
    expect(page.url()).toContain("/food-safety");

    const error = page.locator("text=Something went wrong");
    await expect(error).not.toBeVisible({ timeout: 5_000 });

    const notFound = page.locator("text=Page not found");
    await expect(notFound).not.toBeVisible({ timeout: 2_000 });

    const content = page.locator("main, [role='main'], h1, h2, [data-testid]");
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });

  test("6. Can access /cheatsheets", async ({ page }) => {
    await page.goto("/cheatsheets");
    await page.waitForLoadState("domcontentloaded");

    expect(page.url()).not.toContain("/auth");
    expect(page.url()).toContain("/cheatsheets");

    const error = page.locator("text=Something went wrong");
    await expect(error).not.toBeVisible({ timeout: 5_000 });

    const notFound = page.locator("text=Page not found");
    await expect(notFound).not.toBeVisible({ timeout: 2_000 });

    const content = page.locator("main, [role='main'], h1, h2, [data-testid]");
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });

  test("7. Can access /settings", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("domcontentloaded");

    expect(page.url()).not.toContain("/auth");
    expect(page.url()).toContain("/settings");

    const error = page.locator("text=Something went wrong");
    await expect(error).not.toBeVisible({ timeout: 5_000 });

    const notFound = page.locator("text=Page not found");
    await expect(notFound).not.toBeVisible({ timeout: 2_000 });

    const content = page.locator("main, [role='main'], h1, h2, [data-testid]");
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });

  test("8. Can access /feedback", async ({ page }) => {
    await page.goto("/feedback");
    await page.waitForLoadState("domcontentloaded");

    expect(page.url()).not.toContain("/auth");
    expect(page.url()).toContain("/feedback");

    const error = page.locator("text=Something went wrong");
    await expect(error).not.toBeVisible({ timeout: 5_000 });

    const notFound = page.locator("text=Page not found");
    await expect(notFound).not.toBeVisible({ timeout: 2_000 });

    const content = page.locator("main, [role='main'], h1, h2, [data-testid]");
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });

  // ── Gated routes (scenarios 9-13) ────────────────────────────────

  test("9. CANNOT access /inventory (hidden or redirected)", async ({ page }) => {
    await page.goto("/inventory");
    await page.waitForLoadState("domcontentloaded");

    // The page should either redirect away from /inventory, show a 404/not-found,
    // or the sidebar should not even list "Inventory"
    const currentUrl = page.url();
    const isRedirected = !currentUrl.includes("/inventory");
    const hasNotFound = await page.locator("text=Page not found").isVisible().catch(() => false);
    const has404 = await page.locator("text=404").isVisible().catch(() => false);
    const hasAccessDenied = await page
      .locator("text=Access denied, text=Not available, text=Upgrade, text=not accessible")
      .first()
      .isVisible()
      .catch(() => false);

    expect(
      isRedirected || hasNotFound || has404 || hasAccessDenied,
      "Expected /inventory to be gated for home_cook users: " +
        "should redirect, show 404, or show access-denied message"
    ).toBe(true);

    // Additionally check the sidebar does not show an "Inventory" link
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    const sidebar = page.locator("nav, aside, [role='navigation'], .sidebar");
    const inventoryLink = sidebar.getByRole("link", { name: "Inventory", exact: false });
    const inventoryVisible = await inventoryLink.first().isVisible().catch(() => false);
    expect(inventoryVisible, "Sidebar should not show Inventory for home_cook").toBe(false);
  });

  test("10. CANNOT access /prep (hidden or redirected)", async ({ page }) => {
    await page.goto("/prep");
    await page.waitForLoadState("domcontentloaded");

    const currentUrl = page.url();
    const isRedirected = !currentUrl.includes("/prep");
    const hasNotFound = await page.locator("text=Page not found").isVisible().catch(() => false);
    const has404 = await page.locator("text=404").isVisible().catch(() => false);
    const hasAccessDenied = await page
      .locator("text=Access denied, text=Not available, text=Upgrade, text=not accessible")
      .first()
      .isVisible()
      .catch(() => false);

    expect(
      isRedirected || hasNotFound || has404 || hasAccessDenied,
      "Expected /prep to be gated for home_cook users"
    ).toBe(true);

    // Sidebar check
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    const sidebar = page.locator("nav, aside, [role='navigation'], .sidebar");
    const prepLink = sidebar.getByRole("link", { name: "Prep", exact: false });
    const prepVisible = await prepLink.first().isVisible().catch(() => false);
    expect(prepVisible, "Sidebar should not show Prep for home_cook").toBe(false);
  });

  test("11. CANNOT access /production (hidden or redirected)", async ({ page }) => {
    await page.goto("/production");
    await page.waitForLoadState("domcontentloaded");

    const currentUrl = page.url();
    const isRedirected = !currentUrl.includes("/production");
    const hasNotFound = await page.locator("text=Page not found").isVisible().catch(() => false);
    const has404 = await page.locator("text=404").isVisible().catch(() => false);
    const hasAccessDenied = await page
      .locator("text=Access denied, text=Not available, text=Upgrade, text=not accessible")
      .first()
      .isVisible()
      .catch(() => false);

    expect(
      isRedirected || hasNotFound || has404 || hasAccessDenied,
      "Expected /production to be gated for home_cook users"
    ).toBe(true);

    // Sidebar check
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    const sidebar = page.locator("nav, aside, [role='navigation'], .sidebar");
    const productionLink = sidebar.getByRole("link", { name: "Production", exact: false });
    const productionVisible = await productionLink.first().isVisible().catch(() => false);
    expect(productionVisible, "Sidebar should not show Production for home_cook").toBe(false);
  });

  test("12. CANNOT access /menu-engineering (hidden or redirected)", async ({ page }) => {
    await page.goto("/menu-engineering");
    await page.waitForLoadState("domcontentloaded");

    const currentUrl = page.url();
    const isRedirected = !currentUrl.includes("/menu-engineering");
    const hasNotFound = await page.locator("text=Page not found").isVisible().catch(() => false);
    const has404 = await page.locator("text=404").isVisible().catch(() => false);
    const hasAccessDenied = await page
      .locator("text=Access denied, text=Not available, text=Upgrade, text=not accessible")
      .first()
      .isVisible()
      .catch(() => false);

    expect(
      isRedirected || hasNotFound || has404 || hasAccessDenied,
      "Expected /menu-engineering to be gated for home_cook users"
    ).toBe(true);

    // Sidebar check
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    const sidebar = page.locator("nav, aside, [role='navigation'], .sidebar");
    const meLink = sidebar.getByRole("link", { name: "Menu Engineering", exact: false });
    const meVisible = await meLink.first().isVisible().catch(() => false);
    expect(meVisible, "Sidebar should not show Menu Engineering for home_cook").toBe(false);
  });

  test("13. CANNOT access /roster (hidden or redirected)", async ({ page }) => {
    await page.goto("/roster");
    await page.waitForLoadState("domcontentloaded");

    const currentUrl = page.url();
    const isRedirected = !currentUrl.includes("/roster");
    const hasNotFound = await page.locator("text=Page not found").isVisible().catch(() => false);
    const has404 = await page.locator("text=404").isVisible().catch(() => false);
    const hasAccessDenied = await page
      .locator("text=Access denied, text=Not available, text=Upgrade, text=not accessible")
      .first()
      .isVisible()
      .catch(() => false);

    expect(
      isRedirected || hasNotFound || has404 || hasAccessDenied,
      "Expected /roster to be gated for home_cook users"
    ).toBe(true);

    // Sidebar check
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    const sidebar = page.locator("nav, aside, [role='navigation'], .sidebar");
    const rosterLink = sidebar.getByRole("link", { name: "Roster", exact: false });
    const rosterVisible = await rosterLink.first().isVisible().catch(() => false);
    expect(rosterVisible, "Sidebar should not show Roster for home_cook").toBe(false);
  });

  // ── UI label overrides (scenarios 14-15) ─────────────────────────

  test('14. Sidebar shows "My Recipes" label (not "Recipe Bank")', async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    const sidebar = page.locator("nav, aside, [role='navigation'], .sidebar");

    // Should have "My Recipes"
    const myRecipes = sidebar.locator("text=My Recipes");
    const myRecipesVisible = await myRecipes.first().isVisible().catch(() => false);
    expect(myRecipesVisible, 'Sidebar should display "My Recipes" for home_cook').toBe(true);

    // Should NOT have "Recipe Bank"
    const recipeBank = sidebar.locator("text=Recipe Bank");
    const recipeBankVisible = await recipeBank.first().isVisible().catch(() => false);
    expect(
      recipeBankVisible,
      'Sidebar should NOT display "Recipe Bank" for home_cook'
    ).toBe(false);
  });

  test('15. Todo title shows "My Day" (not "To Do Command Portal")', async ({ page }) => {
    await page.goto("/todo");
    await page.waitForLoadState("domcontentloaded");

    // The page heading / title should say "My Day"
    const myDay = page.locator("text=My Day");
    await expect(myDay.first()).toBeVisible({ timeout: 10_000 });

    // Should NOT say "To Do Command Portal"
    const commandPortal = page.locator("text=To Do Command Portal");
    const commandPortalVisible = await commandPortal.isVisible().catch(() => false);
    expect(
      commandPortalVisible,
      'Todo page should NOT display "To Do Command Portal" for home_cook'
    ).toBe(false);
  });
});
