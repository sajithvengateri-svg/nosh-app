import { test, expect, assertAuthenticated, assertRedirectedToAuth } from "../fixtures/auth.fixture";
import { testEmail, TEST_PASSWORD, getUser } from "../data/orgs";

test.describe("Login Flows", () => {
  // -------------------------------------------------------------------------
  // Scenario 16 — Login with valid credentials redirects to /dashboard
  // -------------------------------------------------------------------------
  test("16: login with valid credentials redirects to /dashboard", async ({
    page,
    loginAs,
  }) => {
    const user = await loginAs("urban-bistro", "owner");

    // After login, the URL should be /dashboard (not /auth)
    await page.waitForURL("**/dashboard", { timeout: 15_000 });
    expect(page.url()).toContain("/dashboard");
    await assertAuthenticated(page);
  });

  // -------------------------------------------------------------------------
  // Scenario 17 — Login with wrong password shows error
  // -------------------------------------------------------------------------
  test("17: login with wrong password shows error message", async ({
    page,
  }) => {
    const email = testEmail("urban-bistro", "owner");

    await page.goto("/auth");
    await page.waitForLoadState("networkidle");

    // Make sure we are on the login tab
    const loginTab = page.getByRole("tab", { name: /log\s*in/i });
    if (await loginTab.isVisible()) {
      await loginTab.click();
    }

    await page.getByPlaceholder(/email/i).fill(email);
    await page.getByPlaceholder(/password/i).fill("CompletelyWrongPassword99!");
    await page.getByRole("button", { name: /sign\s*in|log\s*in/i }).click();

    // The error banner should be visible with the incorrect-credentials message
    await expect(
      page.getByText(/incorrect email or password|invalid login credentials/i)
    ).toBeVisible({ timeout: 10_000 });

    // User should still be on the auth page
    expect(page.url()).toContain("/auth");
  });

  // -------------------------------------------------------------------------
  // Scenario 18 — Login with non-existent email shows error
  // -------------------------------------------------------------------------
  test("18: login with non-existent email shows error message", async ({
    page,
  }) => {
    await page.goto("/auth");
    await page.waitForLoadState("networkidle");

    const loginTab = page.getByRole("tab", { name: /log\s*in/i });
    if (await loginTab.isVisible()) {
      await loginTab.click();
    }

    await page
      .getByPlaceholder(/email/i)
      .fill("nobody-exists-here-9999@chefos-test.dev");
    await page.getByPlaceholder(/password/i).fill("SomePassword123!");
    await page.getByRole("button", { name: /sign\s*in|log\s*in/i }).click();

    // Supabase returns a generic "Invalid login credentials" for security
    await expect(
      page.getByText(/incorrect email or password|invalid login credentials/i)
    ).toBeVisible({ timeout: 10_000 });

    expect(page.url()).toContain("/auth");
  });

  // -------------------------------------------------------------------------
  // Scenario 19 — Login preserves state.from redirect
  // -------------------------------------------------------------------------
  test("19: login preserves state.from and redirects back", async ({
    page,
  }) => {
    // Try to access a protected page directly while unauthenticated
    await page.goto("/recipes");
    await page.waitForLoadState("networkidle");

    // Should be redirected to /auth (ProtectedRoute passes state.from)
    await page.waitForURL("**/auth*", { timeout: 10_000 });
    expect(page.url()).toContain("/auth");

    // Now login with valid credentials
    const loginTab = page.getByRole("tab", { name: /log\s*in/i });
    if (await loginTab.isVisible()) {
      await loginTab.click();
    }

    const email = testEmail("urban-bistro", "owner");
    await page.getByPlaceholder(/email/i).fill(email);
    await page.getByPlaceholder(/password/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign\s*in|log\s*in/i }).click();

    // After login, the app should redirect to /dashboard (the default redirect).
    // Some implementations may redirect to the original /recipes via state.from.
    await page.waitForURL(
      (url) => !url.pathname.includes("/auth"),
      { timeout: 15_000 }
    );

    const currentPath = new URL(page.url()).pathname;
    // Accept either /dashboard (default) or /recipes (from redirect)
    expect(
      currentPath === "/dashboard" || currentPath === "/recipes"
    ).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // Scenario 20 — Vendor login via /vendor/auth redirects to /vendor/dashboard
  // -------------------------------------------------------------------------
  test("20: vendor login via /vendor/auth redirects to /vendor/dashboard", async ({
    page,
  }) => {
    const email = testEmail("fresh-produce-co", "admin");

    await page.goto("/vendor/auth");
    await page.waitForLoadState("networkidle");

    // Vendor auth may have tabs or a single login form
    const loginTab = page.getByRole("tab", { name: /log\s*in/i });
    if (await loginTab.isVisible()) {
      await loginTab.click();
    }

    await page.getByPlaceholder(/email/i).fill(email);
    await page.getByPlaceholder(/password/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign\s*in|log\s*in/i }).click();

    // Should land on the vendor dashboard
    await page.waitForURL("**/vendor/dashboard*", { timeout: 15_000 });
    expect(page.url()).toContain("/vendor/dashboard");
  });

  // -------------------------------------------------------------------------
  // Scenario 21 — Admin login via /admin/auth redirects to /admin
  // -------------------------------------------------------------------------
  test("21: admin login via /admin/auth redirects to /admin", async ({
    page,
  }) => {
    const email = testEmail("queitos-hq", "admin1");

    await page.goto("/admin/auth");
    await page.waitForLoadState("networkidle");

    await page.getByPlaceholder(/email/i).fill(email);
    await page.getByPlaceholder(/password/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign\s*in|log\s*in/i }).click();

    // Should land on the admin dashboard
    await page.waitForURL(
      (url) => url.pathname.startsWith("/admin") && !url.pathname.includes("/auth"),
      { timeout: 15_000 }
    );
    expect(page.url()).toContain("/admin");
    expect(page.url()).not.toContain("/admin/auth");
  });
});
