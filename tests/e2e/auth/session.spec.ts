import { test, expect, assertAuthenticated, assertRedirectedToAuth } from "../fixtures/auth.fixture";

test.describe("Session Persistence", () => {
  // -------------------------------------------------------------------------
  // Scenario 22 — Session persists across a page reload
  // -------------------------------------------------------------------------
  test("22: session persists across page reload", async ({
    page,
    loginAs,
  }) => {
    // Login as the Urban Bistro owner
    await loginAs("urban-bistro", "owner");
    await page.waitForURL("**/dashboard", { timeout: 15_000 });
    await assertAuthenticated(page);

    // Reload the page
    await page.reload({ waitUntil: "networkidle" });

    // After reload, user should still be on a protected page, not redirected
    // back to /auth. The dashboard (or wherever they were) should remain.
    await page.waitForLoadState("networkidle");
    expect(page.url()).not.toContain("/auth");

    // Verify that some dashboard content is visible (not a loading spinner stuck)
    const content = page.locator(
      "main, [role=main], .dashboard, h1, h2, nav"
    ).first();
    await expect(content).toBeVisible({ timeout: 10_000 });

    await assertAuthenticated(page);
  });

  // -------------------------------------------------------------------------
  // Scenario 23 — Signout clears the session
  // -------------------------------------------------------------------------
  test("23: signout clears session and redirects to auth", async ({
    page,
    loginAs,
  }) => {
    // Login first
    await loginAs("urban-bistro", "owner");
    await page.waitForURL("**/dashboard", { timeout: 15_000 });
    await assertAuthenticated(page);

    // Click the Sign Out button in the sidebar
    const signOutButton = page.getByRole("button", { name: /sign\s*out/i });

    if (await signOutButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await signOutButton.click();
    } else {
      // On mobile the sidebar might be collapsed — try the bottom nav or menu
      const menuToggle = page.getByRole("button", { name: /menu/i });
      if (await menuToggle.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await menuToggle.click();
        await page.getByRole("button", { name: /sign\s*out/i }).click();
      } else {
        // Last resort: navigate to settings and sign out from there
        await page.goto("/settings");
        await page.waitForLoadState("networkidle");
        await page.getByRole("button", { name: /sign\s*out|log\s*out/i }).click();
      }
    }

    // After signout, the user should be redirected to the auth page
    await assertRedirectedToAuth(page);

    // Attempting to navigate to a protected page should redirect back to auth
    await page.goto("/dashboard");
    await assertRedirectedToAuth(page);
  });

  // -------------------------------------------------------------------------
  // Scenario 24 — Expired or missing session redirects to auth
  // -------------------------------------------------------------------------
  test("24: expired or missing session redirects to auth", async ({
    page,
  }) => {
    // Do not login. Directly visit a protected route.
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Should be redirected to auth (ProtectedRoute handles this)
    await assertRedirectedToAuth(page);

    // Try another protected route
    await page.goto("/recipes");
    await page.waitForLoadState("networkidle");
    await assertRedirectedToAuth(page);

    // Try the settings page
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await assertRedirectedToAuth(page);

    // Verify that /inventory also redirects
    await page.goto("/inventory");
    await page.waitForLoadState("networkidle");
    await assertRedirectedToAuth(page);

    // Vendor routes should redirect to vendor auth
    await page.goto("/vendor/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForURL(/\/vendor\/auth|\/auth/, { timeout: 10_000 });

    // Admin routes should redirect to admin auth
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    await page.waitForURL(/\/admin\/auth|\/auth/, { timeout: 10_000 });
  });
});
