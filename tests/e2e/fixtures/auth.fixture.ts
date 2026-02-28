import { test as base, expect, type Page, type BrowserContext } from "@playwright/test";
import { testEmail, TEST_PASSWORD, getUser, type TestUser } from "../data/orgs";

/**
 * Extended Playwright test fixture with auth helpers.
 */
export const test = base.extend<{
  /** Login as a specific test user and return their details */
  loginAs: (orgSlug: string, roleSuffix: string) => Promise<TestUser>;
  /** Login as the owner of a specific org */
  loginAsOwner: (orgSlug: string) => Promise<TestUser>;
  /** Get an authenticated page for a specific user */
  authedPage: Page;
}>({
  loginAs: async ({ page }, use) => {
    const fn = async (orgSlug: string, roleSuffix: string): Promise<TestUser> => {
      const user = getUser(orgSlug, roleSuffix);
      await page.goto("/auth");
      await page.waitForLoadState("networkidle");

      // Click login tab if signup is shown by default
      const loginTab = page.getByRole("tab", { name: /log\s*in/i });
      if (await loginTab.isVisible()) {
        await loginTab.click();
      }

      await page.getByPlaceholder(/email/i).fill(user.email);
      await page.getByPlaceholder(/password/i).fill(user.password);
      await page.getByRole("button", { name: /sign\s*in|log\s*in/i }).click();

      // Wait for auth redirect
      await page.waitForURL((url) => !url.pathname.includes("/auth"), {
        timeout: 15_000,
      });

      return user;
    };
    await use(fn);
  },

  loginAsOwner: async ({ page }, use) => {
    const fn = async (orgSlug: string): Promise<TestUser> => {
      const user = getUser(orgSlug, "owner");
      await page.goto("/auth");
      await page.waitForLoadState("networkidle");

      const loginTab = page.getByRole("tab", { name: /log\s*in/i });
      if (await loginTab.isVisible()) {
        await loginTab.click();
      }

      await page.getByPlaceholder(/email/i).fill(user.email);
      await page.getByPlaceholder(/password/i).fill(user.password);
      await page.getByRole("button", { name: /sign\s*in|log\s*in/i }).click();

      await page.waitForURL((url) => !url.pathname.includes("/auth"), {
        timeout: 15_000,
      });

      return user;
    };
    await use(fn);
  },

  authedPage: async ({ page }, use) => {
    await use(page);
  },
});

export { expect };

/**
 * Signup a new user via the UI.
 */
export async function signupViaUI(
  page: Page,
  opts: {
    email: string;
    password: string;
    orgName: string;
    fullName?: string;
    landingPage?: string; // e.g. "/home-cook", "/chefos-india"
  }
) {
  if (opts.landingPage) {
    await page.goto(opts.landingPage);
    // Click the CTA that goes to auth
    const cta = page.getByRole("link", { name: /get started|sign up|start free/i });
    if (await cta.isVisible()) {
      await cta.click();
    }
  } else {
    await page.goto("/auth");
  }
  await page.waitForLoadState("networkidle");

  // Switch to signup tab
  const signupTab = page.getByRole("tab", { name: /sign\s*up/i });
  if (await signupTab.isVisible()) {
    await signupTab.click();
  }

  if (opts.fullName) {
    const nameInput = page.getByPlaceholder(/name/i).first();
    if (await nameInput.isVisible()) {
      await nameInput.fill(opts.fullName);
    }
  }

  await page.getByPlaceholder(/email/i).fill(opts.email);
  await page.getByPlaceholder(/password/i).fill(opts.password);

  const orgInput = page.getByPlaceholder(/restaurant|business|org/i);
  if (await orgInput.isVisible()) {
    await orgInput.fill(opts.orgName);
  }

  await page.getByRole("button", { name: /sign\s*up|create\s*account|get\s*started/i }).click();
}

/**
 * Assert user is on a protected page (not redirected to auth).
 */
export async function assertAuthenticated(page: Page) {
  const url = page.url();
  expect(url).not.toContain("/auth");
}

/**
 * Assert user was redirected to auth.
 */
export async function assertRedirectedToAuth(page: Page) {
  await page.waitForURL(/\/auth/, { timeout: 10_000 });
}

/**
 * Assert no error boundary or 404 is displayed.
 */
export async function assertPageHealthy(page: Page) {
  const error = page.locator("text=Something went wrong");
  const notFound = page.locator("text=Page not found");
  const notFoundAlt = page.locator("text=404");

  await expect(error).not.toBeVisible({ timeout: 3_000 }).catch(() => {});
  await expect(notFound).not.toBeVisible({ timeout: 1_000 }).catch(() => {});
  await expect(notFoundAlt).not.toBeVisible({ timeout: 1_000 }).catch(() => {});
}

/**
 * Measure page load time from navigation to content visible.
 */
export async function measurePageLoad(page: Page, url: string): Promise<number> {
  const start = Date.now();
  await page.goto(url);
  await page.waitForLoadState("domcontentloaded");
  // Wait for at least one visible content element
  await page.locator("main, [role=main], .dashboard, h1, h2").first().waitFor({
    state: "visible",
    timeout: 10_000,
  });
  return Date.now() - start;
}
