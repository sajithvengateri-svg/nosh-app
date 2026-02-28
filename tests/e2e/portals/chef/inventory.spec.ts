/**
 * Chef Portal — Inventory E2E Tests
 *
 * Validates inventory page loading, locations, adding items,
 * searching, and low stock alerts.
 */

import { test, expect } from "../../fixtures/auth.fixture";
import { assertPageHealthy } from "../../fixtures/auth.fixture";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const INVENTORY_URL = "/inventory";

async function waitForInventoryPage(page: import("@playwright/test").Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.locator("h1").filter({ hasText: /inventory/i }).first().waitFor({
    state: "visible",
    timeout: 15_000,
  });
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

test.describe("Chef Portal — Inventory", () => {
  test.describe.configure({ mode: "serial" });

  test("inventory page loads", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await page.goto(INVENTORY_URL);
    await waitForInventoryPage(page);
    await assertPageHealthy(page);

    // Title should be "Inventory"
    const title = page.locator("h1").filter({ hasText: /inventory/i });
    await expect(title).toBeVisible();

    // Subtitle shows item count — e.g. "42 items tracked"
    const subtitle = page.getByText(/items tracked/i);
    await expect(subtitle).toBeVisible({ timeout: 10_000 });

    // Tab strip should be visible: "Food Inventory", "Smallwares", "Cleaning"
    const foodTab = page.getByRole("tab", { name: /food inventory/i });
    await expect(foodTab).toBeVisible({ timeout: 5_000 });
  });

  test("inventory locations visible", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await page.goto(INVENTORY_URL);
    await waitForInventoryPage(page);

    // The "Locations" button should be visible for non-home-cook mode
    const locationsBtn = page.getByRole("button", { name: /locations/i });
    await expect(locationsBtn).toBeVisible({ timeout: 10_000 });

    // Click to open the locations manager
    await locationsBtn.click();

    // A dialog or panel should appear for managing inventory locations
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Close it
    const closeBtn = dialog.getByRole("button", { name: /close|cancel|done/i }).first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  });

  test("add inventory item", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await page.goto(INVENTORY_URL);
    await waitForInventoryPage(page);

    // Click "Add Item" button
    const addBtn = page.getByRole("button", { name: /add item/i });
    await expect(addBtn).toBeVisible({ timeout: 10_000 });
    await addBtn.click();

    // The add item dialog should open
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Dialog title should be "Add Inventory Item"
    const dialogTitle = dialog.getByText(/add inventory item/i);
    await expect(dialogTitle).toBeVisible();

    // Fill in the form
    const nameInput = dialog.getByLabel(/item name/i).or(dialog.locator("#name"));
    await nameInput.fill("E2E Test Flour");

    const qtyInput = dialog.getByLabel(/quantity/i).or(dialog.locator("#quantity"));
    await qtyInput.fill("10");

    // Submit
    const submitBtn = dialog.getByRole("button", { name: /add item/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Wait for dialog to close (indicates success)
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
  });

  test("search inventory", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await page.goto(INVENTORY_URL);
    await waitForInventoryPage(page);

    // Find the search input
    const searchInput = page.getByPlaceholder(/search inventory/i);
    await expect(searchInput).toBeVisible({ timeout: 10_000 });

    // Type a search query
    await searchInput.fill("salmon");

    // Wait for filtering
    await page.waitForTimeout(500);

    // The table should update — either showing filtered results or empty
    const table = page.locator("table").first();
    await expect(table).toBeVisible({ timeout: 5_000 });
  });

  test("low stock alerts visible", async ({ page, loginAsOwner }) => {
    await loginAsOwner("urban-bistro");
    await page.goto(INVENTORY_URL);
    await waitForInventoryPage(page);

    // The inventory page shows alert cards for Critical, Low Stock, and Expiring items
    const criticalCard = page.getByText(/critical/i).first();
    const lowStockCard = page.getByText(/low stock/i).first();
    const expiringCard = page.getByText(/expiring/i).first();

    // At least the alert card section should be visible (even if counts are 0)
    await expect(criticalCard).toBeVisible({ timeout: 10_000 });
    await expect(lowStockCard).toBeVisible({ timeout: 5_000 });
    await expect(expiringCard).toBeVisible({ timeout: 5_000 });
  });
});
