/**
 * Public Booking Widget E2E Tests
 *
 * Verifies the public-facing reservation booking widget renders correctly
 * for seeded orgs, handles form submission, and shows errors for invalid slugs.
 */

import { test, expect } from "../fixtures/auth.fixture";

test.describe("Public Booking Widget", () => {
  // ── 1. Booking widget loads for a valid org ────────────────────────

  test("Public booking widget /book/urban-bistro loads with date, time, and party size fields", async ({
    page,
  }) => {
    await page.goto("/book/urban-bistro");
    await page.waitForLoadState("domcontentloaded");

    // Should not show an error page
    const error = page.locator("text=Something went wrong");
    await expect(error).not.toBeVisible({ timeout: 5_000 });

    const notFound = page.locator("text=Page not found");
    await expect(notFound).not.toBeVisible({ timeout: 3_000 });

    // Booking form should be visible
    const form = page.locator(
      "form, [data-testid='booking-form'], [data-testid='booking-widget']"
    );
    await expect(form.first()).toBeVisible({ timeout: 10_000 });

    // Date field — could be an input[type=date], a date picker trigger, or labeled input
    const dateField = page.locator(
      "input[type='date'], [data-testid='date-picker'], [aria-label*='date' i], label:has-text('Date') + input, label:has-text('Date') ~ input, input[name*='date' i], button:has-text('Date'), [placeholder*='date' i]"
    );
    await expect(dateField.first()).toBeVisible();

    // Time field
    const timeField = page.locator(
      "input[type='time'], select, [data-testid='time-picker'], [aria-label*='time' i], label:has-text('Time') + input, label:has-text('Time') ~ select, input[name*='time' i], button:has-text('Time'), [placeholder*='time' i]"
    );
    await expect(timeField.first()).toBeVisible();

    // Party size / guests field
    const partyField = page.locator(
      "input[type='number'], select, [data-testid='party-size'], [aria-label*='guest' i], [aria-label*='party' i], label:has-text('Guest') + input, label:has-text('Party') + input, label:has-text('Guest') ~ input, label:has-text('Party') ~ select, input[name*='guest' i], input[name*='party' i], [placeholder*='guest' i]"
    );
    await expect(partyField.first()).toBeVisible();
  });

  // ── 2. Submit a reservation via the booking widget ─────────────────

  test("Submit a reservation — fill form, submit, verify confirmation", async ({
    page,
  }) => {
    await page.goto("/book/urban-bistro");
    await page.waitForLoadState("domcontentloaded");

    // Wait for form to appear
    const form = page.locator(
      "form, [data-testid='booking-form'], [data-testid='booking-widget']"
    );
    await expect(form.first()).toBeVisible({ timeout: 10_000 });

    // Fill in name / contact fields if visible
    const nameInput = page.locator(
      "input[name*='name' i], [placeholder*='name' i], [aria-label*='name' i]"
    );
    if (await nameInput.first().isVisible().catch(() => false)) {
      await nameInput.first().fill("Test Guest");
    }

    const emailInput = page.locator(
      "input[type='email'], input[name*='email' i], [placeholder*='email' i]"
    );
    if (await emailInput.first().isVisible().catch(() => false)) {
      await emailInput.first().fill("testguest@example.com");
    }

    const phoneInput = page.locator(
      "input[type='tel'], input[name*='phone' i], [placeholder*='phone' i]"
    );
    if (await phoneInput.first().isVisible().catch(() => false)) {
      await phoneInput.first().fill("0400000000");
    }

    // Fill date — try input[type=date] first, then fall back to clicking a date picker
    const dateInput = page.locator("input[type='date']");
    if (await dateInput.first().isVisible().catch(() => false)) {
      // Set a date 7 days from now
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateStr = futureDate.toISOString().split("T")[0];
      await dateInput.first().fill(dateStr);
    } else {
      // Try clicking a date picker button/trigger
      const dateTrigger = page.locator(
        "[data-testid='date-picker'], button:has-text('Date'), [aria-label*='date' i]"
      );
      if (await dateTrigger.first().isVisible().catch(() => false)) {
        await dateTrigger.first().click();
        // Select a future date in the calendar popup
        const futureDay = page.locator(
          "button:has-text('15'), [aria-label*='15']"
        );
        if (await futureDay.first().isVisible().catch(() => false)) {
          await futureDay.first().click();
        }
      }
    }

    // Fill time — try select first, then input
    const timeSelect = page.locator(
      "select[name*='time' i], [data-testid='time-picker'] select"
    );
    if (await timeSelect.first().isVisible().catch(() => false)) {
      // Select the second option (first available time slot)
      const options = timeSelect.first().locator("option");
      const optionCount = await options.count();
      if (optionCount > 1) {
        const value = await options.nth(1).getAttribute("value");
        if (value) await timeSelect.first().selectOption(value);
      }
    } else {
      const timeInput = page.locator(
        "input[type='time'], input[name*='time' i]"
      );
      if (await timeInput.first().isVisible().catch(() => false)) {
        await timeInput.first().fill("19:00");
      }
    }

    // Fill party size
    const partyInput = page.locator(
      "input[name*='guest' i], input[name*='party' i], input[name*='size' i], [data-testid='party-size'] input"
    );
    if (await partyInput.first().isVisible().catch(() => false)) {
      await partyInput.first().fill("4");
    } else {
      const partySelect = page.locator(
        "select[name*='guest' i], select[name*='party' i], [data-testid='party-size'] select"
      );
      if (await partySelect.first().isVisible().catch(() => false)) {
        const options = partySelect.first().locator("option");
        const optionCount = await options.count();
        // Pick an option representing 4 guests if available
        for (let i = 0; i < optionCount; i++) {
          const text = await options.nth(i).innerText();
          if (text.includes("4")) {
            await partySelect.first().selectOption({ index: i });
            break;
          }
        }
      }
    }

    // Submit the form
    const submitButton = page.getByRole("button", {
      name: /book|reserve|confirm|submit/i,
    });
    await expect(submitButton.first()).toBeVisible();
    await submitButton.first().click();

    // Wait for confirmation or success message
    const confirmation = page.locator(
      "text=/confirm|success|thank|booked|received/i, [data-testid='confirmation'], [class*='success'], [class*='confirm']"
    );
    await expect(confirmation.first()).toBeVisible({ timeout: 15_000 });
  });

  // ── 3. Invalid org slug shows error or 404 ────────────────────────

  test("Invalid org slug /book/nonexistent shows error or 404", async ({
    page,
  }) => {
    await page.goto("/book/nonexistent");
    await page.waitForLoadState("domcontentloaded");

    // Should show some kind of error state — 404, "not found", or error message
    const errorIndicator = page.locator(
      "text=/not found|404|does not exist|no restaurant|invalid|error|unavailable/i"
    );
    const errorBoundary = page.locator("text=Something went wrong");

    // At least one error indicator should be visible
    const hasError =
      (await errorIndicator.first().isVisible({ timeout: 10_000 }).catch(() => false)) ||
      (await errorBoundary.isVisible({ timeout: 3_000 }).catch(() => false));

    // If neither explicit error is shown, the booking form itself should NOT render
    if (!hasError) {
      const form = page.locator(
        "form, [data-testid='booking-form'], [data-testid='booking-widget']"
      );
      const formVisible = await form.first().isVisible({ timeout: 3_000 }).catch(() => false);
      // Either we see an error OR the form is absent — one must be true
      expect(formVisible).toBe(false);
    } else {
      expect(hasError).toBe(true);
    }
  });
});
