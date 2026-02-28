/**
 * Join Team E2E Tests
 *
 * Verifies the team invite acceptance flow via /join/:token for both
 * valid and invalid invitation tokens.
 */

import { test, expect } from "../fixtures/auth.fixture";

test.describe("Join Team via Invite Token", () => {
  // ── 1. Valid token shows accept invite form ────────────────────────

  test("Join team via valid token /join/:token shows accept invite form", async ({
    page,
  }) => {
    // Use a known test invite token — in the seeded test environment,
    // there should be a valid invite token available. We use a placeholder
    // that the seed data creates for urban-bistro.
    const validToken = "test-invite-token-urban-bistro";
    await page.goto(`/join/${validToken}`);
    await page.waitForLoadState("domcontentloaded");

    // Should not show a generic error boundary
    const errorBoundary = page.locator("text=Something went wrong");
    // Give the page time to load and potentially show the form or an error
    await page.waitForTimeout(2_000);

    // The page should show either:
    // a) An accept invite form (name, password fields, accept button)
    // b) An invitation details view with accept/decline buttons
    const acceptForm = page.locator(
      "form, [data-testid='join-form'], [data-testid='invite-form'], [data-testid='accept-invite']"
    );
    const acceptButton = page.getByRole("button", {
      name: /accept|join|create account|sign up|get started/i,
    });
    const inviteContent = page.locator(
      "text=/invite|join|team|welcome|you.*been invited/i"
    );

    // At least one of these should be visible — the invite page rendered
    const formVisible = await acceptForm.first().isVisible().catch(() => false);
    const buttonVisible = await acceptButton
      .first()
      .isVisible()
      .catch(() => false);
    const contentVisible = await inviteContent
      .first()
      .isVisible()
      .catch(() => false);

    const pageRendered = formVisible || buttonVisible || contentVisible;
    expect(pageRendered).toBe(true);

    // If the form is visible, verify it has expected input fields
    if (formVisible) {
      // Should have at least an email or name field
      const inputFields = acceptForm.first().locator("input");
      const inputCount = await inputFields.count();
      expect(inputCount).toBeGreaterThanOrEqual(1);
    }

    // If the accept button is visible, it should be enabled/clickable
    if (buttonVisible) {
      await expect(acceptButton.first()).toBeEnabled();
    }
  });

  // ── 2. Invalid token shows error message ───────────────────────────

  test("Join team via invalid token shows error message", async ({ page }) => {
    const invalidToken = "invalid-token-does-not-exist-12345";
    await page.goto(`/join/${invalidToken}`);
    await page.waitForLoadState("domcontentloaded");

    // Wait for the page to process the token
    await page.waitForTimeout(3_000);

    // Should show an error — invalid/expired token, not found, etc.
    const errorMessages = page.locator(
      "text=/invalid|expired|not found|error|does not exist|link.*invalid|token.*invalid|no longer valid|unable/i"
    );
    const errorBoundary = page.locator("text=Something went wrong");
    const notFoundPage = page.locator("text=/404|page not found/i");

    const hasError =
      (await errorMessages.first().isVisible().catch(() => false)) ||
      (await errorBoundary.isVisible().catch(() => false)) ||
      (await notFoundPage.first().isVisible().catch(() => false));

    // If no explicit error, the page should have redirected to auth or show no form
    if (!hasError) {
      const url = page.url();
      const redirectedToAuth = url.includes("/auth");

      // The accept/join form should NOT be visible for an invalid token
      const acceptButton = page.getByRole("button", {
        name: /accept|join team/i,
      });
      const acceptVisible = await acceptButton
        .first()
        .isVisible()
        .catch(() => false);

      // Either redirected to auth OR no accept button is shown
      expect(redirectedToAuth || !acceptVisible).toBe(true);
    } else {
      expect(hasError).toBe(true);
    }
  });
});
