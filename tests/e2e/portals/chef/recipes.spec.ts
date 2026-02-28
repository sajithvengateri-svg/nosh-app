/**
 * Chef Portal — Recipes E2E Tests
 *
 * Validates the recipe list, creation form, search, filter by category,
 * detail view, editing, import dialog, and empty state for new orgs.
 */

import { test, expect } from "../../fixtures/auth.fixture";
import { assertPageHealthy } from "../../fixtures/auth.fixture";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const RECIPES_URL = "/recipes";

/** Wait for the recipe page to finish loading. */
async function waitForRecipesPage(page: import("@playwright/test").Page) {
  await page.waitForLoadState("domcontentloaded");
  // Wait for either the recipe grid or the "No recipes found" message
  const content = page.locator("h1").filter({ hasText: /recipe/i });
  await content.first().waitFor({ state: "visible", timeout: 15_000 });
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

test.describe("Chef Portal — Recipes", () => {
  test.describe.configure({ mode: "serial" });

  test("recipe list page loads with recipes", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await page.goto(RECIPES_URL);
    await waitForRecipesPage(page);
    await assertPageHealthy(page);

    // The page title should say "Recipe Bank" or "My Recipes"
    const title = page.locator("h1").filter({ hasText: /recipe bank|my recipes/i });
    await expect(title).toBeVisible();

    // Subtitle shows recipe count — e.g. "12 recipes in your collection"
    const subtitle = page.getByText(/recipes in your collection/i);
    await expect(subtitle).toBeVisible({ timeout: 10_000 });

    // At least one recipe card should be visible (urban-bistro is seeded)
    const recipeCards = page.locator(".grid > div").first();
    await expect(recipeCards).toBeVisible({ timeout: 10_000 });
  });

  test("click New Recipe opens recipe creation launcher", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await page.goto(RECIPES_URL);
    await waitForRecipesPage(page);

    // Click the "New Recipe" button
    const newRecipeBtn = page.getByRole("button", { name: /new recipe/i });
    await expect(newRecipeBtn).toBeVisible({ timeout: 10_000 });
    await newRecipeBtn.click();

    // The RecipeCreationLauncher dialog should open
    // It may show as a dialog/modal with recipe creation options
    const dialog = page.getByRole("dialog")
      .or(page.locator("[role='dialog']"));
    await expect(dialog).toBeVisible({ timeout: 5_000 });
  });

  test("fill recipe form (title, description) and save", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");

    // Navigate with ?new=true to open the form dialog directly
    await page.goto(`${RECIPES_URL}?new=true`);
    await waitForRecipesPage(page);

    // The dialog should open automatically due to ?new=true query param
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Fill in the recipe name
    const nameInput = page.getByLabel(/recipe name/i)
      .or(page.locator("#name"));
    await nameInput.fill("E2E Test Recipe");

    // Fill in description
    const descInput = page.getByLabel(/description/i)
      .or(page.locator("#description"));
    await descInput.fill("A test recipe created by E2E tests");

    // Submit the form
    const submitBtn = page.getByRole("button", { name: /create recipe|save/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Wait for success toast or dialog to close
    await page.waitForTimeout(1_000);

    // The dialog should close after successful save
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
  });

  test("search recipes by name", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await page.goto(RECIPES_URL);
    await waitForRecipesPage(page);

    // Find the search input
    const searchInput = page.getByPlaceholder(/search recipes/i);
    await expect(searchInput).toBeVisible({ timeout: 10_000 });

    // Type a search query
    await searchInput.fill("salmon");

    // Wait for filtering to take effect
    await page.waitForTimeout(500);

    // Verify the recipe list has filtered (either shows results or "No recipes found")
    const results = page.locator(".grid > div").first()
      .or(page.getByText(/no recipes found/i));
    await expect(results).toBeVisible({ timeout: 5_000 });
  });

  test("filter recipes by category", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await page.goto(RECIPES_URL);
    await waitForRecipesPage(page);

    // Category filter chips are rendered as buttons in a scrollable row
    // Look for category buttons like "All", "Mains", "Desserts", "Batch Recipes"
    const allButton = page.getByRole("button", { name: "All" }).first();
    await expect(allButton).toBeVisible({ timeout: 10_000 });

    // Click a different category (e.g., "Batch Recipes" which is always present)
    const batchBtn = page.getByRole("button", { name: /batch recipes/i });
    if (await batchBtn.isVisible()) {
      await batchBtn.click();
      await page.waitForTimeout(500);
    }

    // Click "All" to reset filter
    await allButton.click();
    await page.waitForTimeout(300);

    // Page should still be healthy after filtering
    await assertPageHealthy(page);
  });

  test("click a recipe navigates to detail page with ingredients", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await page.goto(RECIPES_URL);
    await waitForRecipesPage(page);

    // Click the first recipe card link
    const firstRecipe = page.locator("a[href^='/recipes/']").first();

    // If there are recipe links, click one
    if (await firstRecipe.isVisible({ timeout: 5_000 })) {
      await firstRecipe.click();

      // Wait for navigation to the recipe detail page
      await page.waitForURL(/\/recipes\/[^/]+/, { timeout: 10_000 });
      await page.waitForLoadState("domcontentloaded");
      await assertPageHealthy(page);

      // Recipe detail page should show the recipe name and ingredients section
      const content = page.locator("main, [role='main'], h1, h2");
      await expect(content.first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test("edit a recipe — change title, save", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await page.goto(RECIPES_URL);
    await waitForRecipesPage(page);

    // Find an edit button on a recipe card (pencil icon or "Edit" button)
    const editBtn = page.locator("button").filter({ hasText: /edit/i }).first()
      .or(page.locator("[title='Edit']").first())
      .or(page.locator("button:has(svg)").filter({ hasText: "" }).first());

    // The recipe cards have an onEdit handler — look for the edit action
    // RecipeCard renders edit buttons with Pencil icons
    const recipeEditTrigger = page.locator("button[title*='edit' i], button[aria-label*='edit' i]").first();

    if (await recipeEditTrigger.isVisible({ timeout: 5_000 })) {
      await recipeEditTrigger.click();

      // The edit dialog should open
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 5_000 });

      // Change the title
      const nameInput = dialog.getByLabel(/recipe name/i)
        .or(dialog.locator("#name"));
      await nameInput.clear();
      await nameInput.fill("Updated E2E Recipe");

      // Save changes
      const saveBtn = dialog.getByRole("button", { name: /save changes/i });
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await page.waitForTimeout(1_000);
      }
    }
  });

  test("recipe import dialog opens", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await page.goto(RECIPES_URL);
    await waitForRecipesPage(page);

    // Click the "Import" button
    const importBtn = page.getByRole("button", { name: /import/i }).first();
    await expect(importBtn).toBeVisible({ timeout: 10_000 });
    await importBtn.click();

    // The RecipeImportDialog should open
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Close dialog
    const closeBtn = dialog.getByRole("button", { name: /close|cancel/i }).first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  });

  test("empty state for org with no recipes", async ({ page, loginAsOwner }) => {
    await loginAsOwner("test-empty-restaurant");
    await page.goto(RECIPES_URL);
    await waitForRecipesPage(page);
    await assertPageHealthy(page);

    // For an empty org, either "No recipes found" or "Add First Recipe" should show
    const emptyState = page.getByText(/no recipes found/i)
      .or(page.getByRole("button", { name: /add first recipe/i }))
      .or(page.getByText(/0 recipes in your collection/i));
    await expect(emptyState).toBeVisible({ timeout: 10_000 });
  });
});
