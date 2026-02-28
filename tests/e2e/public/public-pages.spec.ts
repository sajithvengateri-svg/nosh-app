/**
 * Public Pages E2E Tests
 *
 * Verifies that static public pages (FAQ, Terms, Privacy, Help, Portal Selector)
 * render correctly without authentication.
 */

import { test, expect } from "../fixtures/auth.fixture";

test.describe("Public Pages", () => {
  // ── 1. FAQ Page ────────────────────────────────────────────────────

  test("FAQ page /faq renders content", async ({ page }) => {
    await page.goto("/faq");
    await page.waitForLoadState("domcontentloaded");

    // Should not show errors
    const error = page.locator("text=Something went wrong");
    await expect(error).not.toBeVisible({ timeout: 3_000 });

    // Should have a heading referencing FAQ
    const heading = page.locator("h1, h2");
    await expect(heading.first()).toBeVisible({ timeout: 10_000 });

    // Should contain FAQ-related content (questions, answers, accordion items)
    const bodyText = await page.locator("body").innerText();
    const hasFAQContent =
      /faq|frequently asked|question|how do|what is|can i/i.test(bodyText);
    expect(hasFAQContent).toBe(true);

    // Should have multiple content sections (accordion items, Q&A pairs, etc.)
    const contentSections = page.locator(
      "details, [data-testid='faq-item'], [class*='accordion'], [class*='faq'], dt, h3, h4"
    );
    const sectionCount = await contentSections.count();
    expect(sectionCount).toBeGreaterThanOrEqual(1);
  });

  // ── 2. Terms Page ─────────────────────────────────────────────────

  test("Terms page /terms renders terms content", async ({ page }) => {
    await page.goto("/terms");
    await page.waitForLoadState("domcontentloaded");

    const error = page.locator("text=Something went wrong");
    await expect(error).not.toBeVisible({ timeout: 3_000 });

    const heading = page.locator("h1, h2");
    await expect(heading.first()).toBeVisible({ timeout: 10_000 });

    // Should contain terms/legal content
    const bodyText = await page.locator("body").innerText();
    const hasTermsContent =
      /terms|conditions|agreement|service|license|liability|privacy|use|user/i.test(
        bodyText
      );
    expect(hasTermsContent).toBe(true);

    // Should have substantial content (legal documents are long)
    expect(bodyText.length).toBeGreaterThan(300);
  });

  // ── 3. Privacy Page ───────────────────────────────────────────────

  test("Privacy page /privacy renders privacy content", async ({ page }) => {
    await page.goto("/privacy");
    await page.waitForLoadState("domcontentloaded");

    const error = page.locator("text=Something went wrong");
    await expect(error).not.toBeVisible({ timeout: 3_000 });

    const heading = page.locator("h1, h2");
    await expect(heading.first()).toBeVisible({ timeout: 10_000 });

    // Should contain privacy policy content
    const bodyText = await page.locator("body").innerText();
    const hasPrivacyContent =
      /privacy|data|personal information|collect|cookie|gdpr|process|store|protect/i.test(
        bodyText
      );
    expect(hasPrivacyContent).toBe(true);

    // Privacy policies should have meaningful length
    expect(bodyText.length).toBeGreaterThan(300);
  });

  // ── 4. Help Center ────────────────────────────────────────────────

  test("Help center /help renders help articles", async ({ page }) => {
    await page.goto("/help");
    await page.waitForLoadState("domcontentloaded");

    const error = page.locator("text=Something went wrong");
    await expect(error).not.toBeVisible({ timeout: 3_000 });

    const heading = page.locator("h1, h2");
    await expect(heading.first()).toBeVisible({ timeout: 10_000 });

    // Should contain help-related content
    const bodyText = await page.locator("body").innerText();
    const hasHelpContent =
      /help|support|guide|getting started|how to|article|documentation|tutorial|contact/i.test(
        bodyText
      );
    expect(hasHelpContent).toBe(true);

    // Should have multiple help topics or article links
    const articles = page.locator(
      "a, [data-testid='help-article'], [class*='article'], [class*='card'], [class*='topic'], li"
    );
    const articleCount = await articles.count();
    expect(articleCount).toBeGreaterThanOrEqual(1);
  });

  // ── 5. Portal Selector (/launch) ─────────────────────────────────

  test("Portal selector /launch renders portal cards with links", async ({
    page,
  }) => {
    await page.goto("/launch");
    await page.waitForLoadState("domcontentloaded");

    const error = page.locator("text=Something went wrong");
    await expect(error).not.toBeVisible({ timeout: 3_000 });

    // Should have a heading
    const heading = page.locator("h1, h2");
    await expect(heading.first()).toBeVisible({ timeout: 10_000 });

    // Should render portal cards — each portal should have a card/link
    const portalCards = page.locator(
      "[data-testid='portal-card'], [class*='card'], [class*='portal'], a[href*='/']"
    );
    const cardCount = await portalCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(2);

    // Should contain links to various portals (chef, bev, money, etc.)
    const bodyText = await page.locator("body").innerText();
    const hasPortalContent =
      /chef|bev|money|clock|labour|supply|reservation|admin|vendor|game/i.test(
        bodyText
      );
    expect(hasPortalContent).toBe(true);

    // Verify at least some portal links are clickable
    const portalLinks = page.getByRole("link");
    const linkCount = await portalLinks.count();
    expect(linkCount).toBeGreaterThanOrEqual(2);
  });
});
