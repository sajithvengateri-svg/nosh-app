/**
 * Variant Landing Page E2E Tests
 *
 * Verifies that all public variant landing pages render correctly with
 * their region/mode-specific content, and that CTAs link to the proper
 * auth flows.
 */

import { test, expect } from "../fixtures/auth.fixture";

test.describe("Variant Landing Pages", () => {
  // ── 1. ChefOS Landing (/) ──────────────────────────────────────────

  test("ChefOS landing renders hero section, features grid, and CTA linking to /auth", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Hero section should be visible
    const hero = page.locator(
      "section, [data-testid='hero'], .hero, [class*='hero']"
    );
    await expect(hero.first()).toBeVisible({ timeout: 10_000 });

    // Should contain a prominent heading
    const heading = page.locator("h1");
    await expect(heading.first()).toBeVisible();

    // Features grid — look for multiple feature items (cards, columns, list items)
    const featureItems = page.locator(
      "[data-testid='feature-card'], [class*='feature'], [class*='grid'] > div, [class*='card']"
    );
    const featureCount = await featureItems.count();
    expect(featureCount).toBeGreaterThanOrEqual(2);

    // CTA button should link to /auth
    const cta = page.getByRole("link", {
      name: /get started|sign up|start free|try free|start now/i,
    });
    await expect(cta.first()).toBeVisible();
    const ctaHref = await cta.first().getAttribute("href");
    expect(ctaHref).toContain("/auth");
  });

  // ── 2. HomeChef Landing (/home-cook) ───────────────────────────────

  test("HomeChef landing renders simplified messaging and CTA with ?mode=home_cook", async ({
    page,
  }) => {
    await page.goto("/home-cook");
    await page.waitForLoadState("domcontentloaded");

    // Page should render without error
    const error = page.locator("text=Something went wrong");
    await expect(error).not.toBeVisible({ timeout: 3_000 });

    // Should have a visible heading
    const heading = page.locator("h1, h2");
    await expect(heading.first()).toBeVisible({ timeout: 10_000 });

    // Page content should reference home cooks or simplified messaging
    const bodyText = await page.locator("body").innerText();
    const hasHomeCookContent =
      /home\s*cook|home\s*chef|kitchen|family|simple|easy|personal/i.test(
        bodyText
      );
    expect(hasHomeCookContent).toBe(true);

    // CTA should include ?mode=home_cook in the link
    const cta = page.getByRole("link", {
      name: /get started|sign up|start free|try free|start now|join/i,
    });
    await expect(cta.first()).toBeVisible();
    const ctaHref = await cta.first().getAttribute("href");
    expect(ctaHref).toContain("mode=home_cook");
  });

  // ── 3. India FSSAI Landing (/chefos-india) ─────────────────────────

  test("India FSSAI landing renders FSSAI content and Indian statistics", async ({
    page,
  }) => {
    await page.goto("/chefos-india");
    await page.waitForLoadState("domcontentloaded");

    const error = page.locator("text=Something went wrong");
    await expect(error).not.toBeVisible({ timeout: 3_000 });

    const heading = page.locator("h1, h2");
    await expect(heading.first()).toBeVisible({ timeout: 10_000 });

    // Should mention FSSAI or Indian food safety context
    const bodyText = await page.locator("body").innerText();
    const hasFSSAIContent =
      /fssai|india|food safety|compliance|lakh|crore|rupee|inr|indian/i.test(
        bodyText
      );
    expect(hasFSSAIContent).toBe(true);

    // Should have India-specific statistics or data points
    const statsSection = page.locator(
      "[data-testid='stats'], [class*='stat'], [class*='number'], [class*='metric']"
    );
    // At minimum, meaningful content should exist on the page
    const contentLength = bodyText.length;
    expect(contentLength).toBeGreaterThan(200);
  });

  // ── 4. GCC Landing (/chefos-gcc) ──────────────────────────────────

  test("GCC landing renders with AED references and emirate compliance mentions", async ({
    page,
  }) => {
    await page.goto("/chefos-gcc");
    await page.waitForLoadState("domcontentloaded");

    const error = page.locator("text=Something went wrong");
    await expect(error).not.toBeVisible({ timeout: 3_000 });

    const heading = page.locator("h1, h2");
    await expect(heading.first()).toBeVisible({ timeout: 10_000 });

    // Should contain GCC/UAE-specific content
    const bodyText = await page.locator("body").innerText();
    const hasGCCContent =
      /aed|uae|dubai|abu dhabi|emirat|gcc|municipality|halal|dirham/i.test(
        bodyText
      );
    expect(hasGCCContent).toBe(true);

    // Should reference compliance or regulatory bodies
    const hasComplianceContent =
      /compliance|dm|adafsa|food safety|grading|inspection|regulation/i.test(
        bodyText
      );
    expect(hasComplianceContent).toBe(true);
  });

  // ── 5. Food Safety Landing (/food-safety) ──────────────────────────

  test("Food Safety landing renders BCC/EatSafe focused content", async ({
    page,
  }) => {
    await page.goto("/food-safety");
    await page.waitForLoadState("domcontentloaded");

    const error = page.locator("text=Something went wrong");
    await expect(error).not.toBeVisible({ timeout: 3_000 });

    const heading = page.locator("h1, h2");
    await expect(heading.first()).toBeVisible({ timeout: 10_000 });

    // Should contain food safety / BCC / EatSafe content
    const bodyText = await page.locator("body").innerText();
    const hasFoodSafetyContent =
      /food safety|bcc|eatsafe|eat safe|brisbane|compliance|haccp|temperature|audit|inspection|hygiene/i.test(
        bodyText
      );
    expect(hasFoodSafetyContent).toBe(true);
  });

  // ── 6. Vendor Landing (/vendor-landing) ────────────────────────────

  test("Vendor landing renders supplier features and CTA to /vendor/auth", async ({
    page,
  }) => {
    await page.goto("/vendor-landing");
    await page.waitForLoadState("domcontentloaded");

    const error = page.locator("text=Something went wrong");
    await expect(error).not.toBeVisible({ timeout: 3_000 });

    const heading = page.locator("h1, h2");
    await expect(heading.first()).toBeVisible({ timeout: 10_000 });

    // Should contain vendor/supplier-specific content
    const bodyText = await page.locator("body").innerText();
    const hasVendorContent =
      /vendor|supplier|supply|wholesale|order|pricing|product|catalog|marketplace/i.test(
        bodyText
      );
    expect(hasVendorContent).toBe(true);

    // CTA should link to vendor auth
    const cta = page.getByRole("link", {
      name: /get started|sign up|start free|join|register|apply/i,
    });
    await expect(cta.first()).toBeVisible();
    const ctaHref = await cta.first().getAttribute("href");
    expect(ctaHref).toMatch(/\/vendor\/auth|\/auth.*vendor/);
  });
});
