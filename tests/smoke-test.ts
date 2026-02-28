#!/usr/bin/env npx tsx
/**
 * Standalone Smoke Test for ChefOS Beta
 *
 * Runs against a live deployment (or local dev).
 * Logs in as admin, visits every major route, checks for errors.
 * Generates a markdown fault report.
 *
 * Usage:
 *   npx tsx tests/smoke-test.ts                           # against localhost:5173
 *   BASE_URL=https://queitos.vercel.app npx tsx tests/smoke-test.ts  # against prod
 */

import { chromium, Browser, Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";
const EMAIL = process.env.TEST_EMAIL || "admin@chefos.app";
const PASSWORD = process.env.TEST_PASSWORD || "ChefOS2026x";

// All routes extracted from App.tsx — grouped by portal
const ROUTES = {
  Public: [
    "/", "/home-cook", "/launch", "/taste", "/vendor-landing",
    "/food-safety", "/chefos-india", "/chefos-gcc", "/money-landing",
    "/terms", "/privacy", "/faq", "/auth",
  ],
  Chef: [
    "/dashboard", "/recipes", "/ingredients", "/master-yield", "/costing",
    "/inventory", "/prep", "/kitchen", "/todo", "/production",
    "/marketplace", "/menu-engineering", "/roster", "/allergens",
    "/food-safety", "/training", "/invoices", "/cheatsheets",
    "/calendar", "/kitchen-sections", "/equipment", "/team",
    "/settings", "/waste-log", "/logs", "/feedback", "/money-lite",
    "/referral", "/housekeeping", "/more",
  ],
  BevOS: [
    "/bev/dashboard", "/bev/cellar", "/bev/wine", "/bev/draught",
    "/bev/cocktails", "/bev/coffee", "/bev/pours", "/bev/bar-prep",
    "/bev/stocktake", "/bev/coravin", "/bev/flash-cards", "/bev/ai",
    "/bev/costing", "/bev/team", "/bev/invoices", "/bev/equipment",
    "/bev/production", "/bev/calendar", "/bev/training", "/bev/compliance",
    "/bev/marketplace", "/bev/engineering", "/bev/stations",
    "/bev/waste-log", "/bev/settings",
  ],
  RestOS: [
    "/pos", "/pos/kds", "/pos/tabs", "/pos/functions",
    "/pos/daily-close", "/pos/waste", "/pos/compliance", "/pos/audit",
    "/pos/analytics", "/pos/admin/menu", "/pos/admin/staff",
    "/pos/admin/store", "/pos/admin/import",
  ],
  ClockOS: [
    "/clock", "/clock/dashboard", "/clock/timesheets", "/clock/override",
    "/clock/induction", "/clock/onboarding", "/clock/employees",
    "/clock/devices", "/clock/pins", "/clock/settings",
  ],
  LabourOS: [
    "/labour/dashboard", "/labour/roster", "/labour/timesheets",
    "/labour/leave", "/labour/payroll", "/labour/employees",
    "/labour/compliance", "/labour/compliance/certs", "/labour/settings",
    "/labour/people", "/labour/people/recruitment",
    "/labour/people/directory", "/labour/people/onboarding",
    "/labour/people/reviews", "/labour/people/warnings",
    "/labour/people/settings",
  ],
  SupplyOS: [
    "/supply/dashboard", "/supply/orders", "/supply/suppliers",
    "/supply/receiving", "/supply/price-watch", "/supply/settings",
  ],
  GrowthOS: [
    "/growth/dashboard", "/growth/campaigns", "/growth/calendar",
    "/growth/segments", "/growth/analytics", "/growth/settings",
  ],
  MoneyOS: [
    "/money/dashboard", "/money/reactor", "/money/pnl",
    "/money/trends", "/money/benchmarks", "/money/simulator",
    "/money/solutions", "/money/audit", "/money/forensic",
    "/money/portfolio", "/money/settings",
  ],
  OverheadOS: [
    "/overhead/dashboard", "/overhead/costs", "/overhead/recurring",
    "/overhead/assets", "/overhead/alerts", "/overhead/benchmarks",
    "/overhead/breakeven", "/overhead/settings",
  ],
  QuietAudit: [
    "/quiet/dashboard", "/quiet/recommendations", "/quiet/history",
    "/quiet/report", "/quiet/external/new", "/quiet/external/upload",
    "/quiet/simulation", "/quiet/findings", "/quiet/settings",
  ],
  ResOS: [
    "/reservation/dashboard", "/reservation/diary", "/reservation/floor",
    "/reservation/reservations", "/reservation/waitlist",
    "/reservation/shows", "/reservation/guests",
    "/reservation/functions", "/reservation/functions/crm",
    "/reservation/functions/spaces", "/reservation/forecast",
    "/reservation/settings", "/reservation/widget",
    "/reservation/function-widget",
    "/reservation/venueflow/dashboard", "/reservation/venueflow/pipeline",
    "/reservation/venueflow/calendar", "/reservation/venueflow/menus",
    "/reservation/venueflow/beverages", "/reservation/venueflow/proposals",
    "/reservation/venueflow/leads", "/reservation/venueflow/referrals",
    "/reservation/venueflow/reactivation", "/reservation/venueflow/analytics",
    "/reservation/venueflow/csv-import", "/reservation/venueflow/automations",
    "/reservation/venueflow/integrations", "/reservation/venueflow/reports",
    "/reservation/reports/generate", "/reservation/reports/efficiency",
    "/reservation/help", "/reservation/training",
    "/reservation/voice-agent",
  ],
  Games: [
    "/games", "/games/onion-blitz", "/games/alley-cat",
    "/games/leaderboard", "/games/profile",
  ],
  Admin: [
    "/admin", "/admin/crm", "/admin/analytics", "/admin/marketing",
    "/admin/testing", "/admin/seed", "/admin/releases",
    "/admin/organizations", "/admin/email-templates",
    "/admin/beta", "/admin/help", "/admin/help-links",
    "/admin/app-launch", "/admin/landing-page",
    "/admin/site-pages", "/admin/system", "/admin/settings",
    "/admin/accounting", "/admin/ai-usage", "/admin/quotas",
    "/admin/fixed-costs", "/admin/rates",
    "/admin/sales", "/admin/sales/crm", "/admin/sales/plans",
    "/admin/sales/settings", "/admin/sales/analytics",
    "/admin/sales/referrals", "/admin/sales/leads",
    "/admin/vendor-deals", "/admin/ideas",
  ],
};

interface Result {
  portal: string;
  route: string;
  status: "OK" | "CRASH" | "EMPTY" | "SLOW" | "CONSOLE_ERROR" | "TIMEOUT" | "REDIRECT";
  loadMs: number;
  errors: string[];
}

async function login(page: Page): Promise<boolean> {
  try {
    await page.goto(`${BASE_URL}/auth`, { timeout: 15000 });
    await page.waitForLoadState("domcontentloaded");

    // Fill login form
    await page.fill('input[type="email"], input[name="email"]', EMAIL);
    await page.fill('input[type="password"], input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL("**/dashboard**", { timeout: 15000 }).catch(() => {});

    // Accept terms if modal appears
    const termsCheckbox = page.locator("#terms-agree");
    if (await termsCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      await termsCheckbox.click();
      await page.click("text=Accept & Continue");
      await page.waitForTimeout(2000);
    }

    return true;
  } catch (err) {
    console.error("Login failed:", (err as Error).message);
    return false;
  }
}

async function testRoute(page: Page, portal: string, route: string): Promise<Result> {
  const result: Result = {
    portal,
    route,
    status: "OK",
    loadMs: 0,
    errors: [],
  };

  const consoleErrors: string[] = [];
  const handler = (msg: any) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  };
  page.on("console", handler);

  try {
    const start = Date.now();
    const response = await page.goto(`${BASE_URL}${route}`, { timeout: 20000 });
    await page.waitForLoadState("domcontentloaded");
    result.loadMs = Date.now() - start;

    // Check HTTP status
    if (response && response.status() >= 400) {
      result.status = "CRASH";
      result.errors.push(`HTTP ${response.status()}`);
      return result;
    }

    // Check if redirected to auth (not logged in)
    if (page.url().includes("/auth") && !route.includes("/auth")) {
      result.status = "REDIRECT";
      result.errors.push("Redirected to /auth");
      return result;
    }

    // Check for error boundary
    const hasError = await page.locator("text=Something went wrong").isVisible({ timeout: 3000 }).catch(() => false);
    if (hasError) {
      result.status = "CRASH";
      result.errors.push("Error boundary triggered");
      return result;
    }

    // Check for 404
    const has404 = await page.locator("text=Page not found").isVisible({ timeout: 2000 }).catch(() => false);
    if (has404) {
      result.status = "CRASH";
      result.errors.push("Page not found (404)");
      return result;
    }

    // Check for empty page (only spinner visible after 5s)
    const hasContent = await page.locator("main, [role='main'], h1, h2, table, .card, [class*='dashboard']").first().isVisible({ timeout: 8000 }).catch(() => false);
    if (!hasContent) {
      result.status = "EMPTY";
      result.errors.push("No meaningful content after 8s");
    }

    // Check for slow load
    if (result.loadMs > 8000 && result.status === "OK") {
      result.status = "SLOW";
      result.errors.push(`Loaded in ${result.loadMs}ms (>8s)`);
    }

    // Check console errors
    if (consoleErrors.length > 0 && result.status === "OK") {
      result.status = "CONSOLE_ERROR";
      result.errors = consoleErrors.slice(0, 3); // keep top 3
    }
  } catch (err) {
    result.status = "TIMEOUT";
    result.errors.push((err as Error).message);
  }

  page.off("console", handler);
  return result;
}

async function run() {
  console.log(`\nChefOS Smoke Test`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Login: ${EMAIL}`);
  console.log(`─`.repeat(60));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login first (skip for public routes)
  const loggedIn = await login(page);
  if (!loggedIn) {
    console.error("FATAL: Could not log in. Aborting.");
    await browser.close();
    process.exit(1);
  }
  console.log("Logged in successfully.\n");

  const allResults: Result[] = [];
  const totalRoutes = Object.values(ROUTES).flat().length;
  let tested = 0;

  for (const [portal, routes] of Object.entries(ROUTES)) {
    console.log(`\n[${ portal }] Testing ${routes.length} routes...`);

    for (const route of routes) {
      tested++;
      const result = await testRoute(page, portal, route);
      allResults.push(result);

      const icon = result.status === "OK" ? "." :
                   result.status === "REDIRECT" ? "R" :
                   result.status === "SLOW" ? "S" :
                   result.status === "CONSOLE_ERROR" ? "C" :
                   result.status === "EMPTY" ? "E" :
                   result.status === "CRASH" ? "X" : "T";
      process.stdout.write(icon);
    }
  }

  await browser.close();

  // Generate report
  const issues = allResults.filter(r => r.status !== "OK" && r.status !== "REDIRECT");
  const crashes = allResults.filter(r => r.status === "CRASH");
  const empties = allResults.filter(r => r.status === "EMPTY");
  const slows = allResults.filter(r => r.status === "SLOW");
  const consoleErrs = allResults.filter(r => r.status === "CONSOLE_ERROR");
  const timeouts = allResults.filter(r => r.status === "TIMEOUT");
  const redirects = allResults.filter(r => r.status === "REDIRECT");
  const oks = allResults.filter(r => r.status === "OK");

  const report = `# ChefOS Smoke Test Report
**Date:** ${new Date().toISOString().split("T")[0]}
**Target:** ${BASE_URL}
**Login:** ${EMAIL}

## Summary
| Metric | Count |
|--------|-------|
| Total Routes Tested | ${totalRoutes} |
| OK | ${oks.length} |
| Crashes (Error Boundary / 404) | ${crashes.length} |
| Empty Pages | ${empties.length} |
| Slow (>8s) | ${slows.length} |
| Console Errors | ${consoleErrs.length} |
| Timeouts | ${timeouts.length} |
| Auth Redirects | ${redirects.length} |

## Pass Rate: ${((oks.length / totalRoutes) * 100).toFixed(1)}%

${crashes.length > 0 ? `## CRASHES
| Portal | Route | Error |
|--------|-------|-------|
${crashes.map(r => `| ${r.portal} | ${r.route} | ${r.errors.join("; ")} |`).join("\n")}
` : ""}
${empties.length > 0 ? `## EMPTY PAGES
| Portal | Route | Notes |
|--------|-------|-------|
${empties.map(r => `| ${r.portal} | ${r.route} | ${r.errors.join("; ")} |`).join("\n")}
` : ""}
${slows.length > 0 ? `## SLOW PAGES (>8s)
| Portal | Route | Load Time |
|--------|-------|-----------|
${slows.map(r => `| ${r.portal} | ${r.route} | ${r.loadMs}ms |`).join("\n")}
` : ""}
${consoleErrs.length > 0 ? `## CONSOLE ERRORS
| Portal | Route | Errors |
|--------|-------|--------|
${consoleErrs.map(r => `| ${r.portal} | ${r.route} | ${r.errors.join("; ").substring(0, 200)} |`).join("\n")}
` : ""}
${timeouts.length > 0 ? `## TIMEOUTS
| Portal | Route | Error |
|--------|-------|-------|
${timeouts.map(r => `| ${r.portal} | ${r.route} | ${r.errors.join("; ").substring(0, 200)} |`).join("\n")}
` : ""}
${redirects.length > 0 ? `## AUTH REDIRECTS
These routes redirected to /auth (may need different permissions):
${redirects.map(r => `- \`${r.route}\` (${r.portal})`).join("\n")}
` : ""}

## All Routes by Portal
${Object.entries(ROUTES).map(([portal, routes]) => {
  const portalResults = allResults.filter(r => r.portal === portal);
  const portalOk = portalResults.filter(r => r.status === "OK").length;
  return `### ${portal} (${portalOk}/${routes.length} OK)
${portalResults.map(r => `- [${r.status}] \`${r.route}\` ${r.loadMs}ms${r.errors.length ? " — " + r.errors[0] : ""}`).join("\n")}`;
}).join("\n\n")}
`;

  // Write report
  const reportDir = path.join(__dirname, "reports");
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, "smoke-report.md");
  fs.writeFileSync(reportPath, report);

  // Also write JSON
  const jsonPath = path.join(reportDir, "smoke-report.json");
  fs.writeFileSync(jsonPath, JSON.stringify(allResults, null, 2));

  console.log(`\n\n${"═".repeat(60)}`);
  console.log(`SMOKE TEST COMPLETE`);
  console.log(`${"═".repeat(60)}`);
  console.log(`Total: ${totalRoutes} | OK: ${oks.length} | Issues: ${issues.length}`);
  console.log(`Crashes: ${crashes.length} | Empty: ${empties.length} | Slow: ${slows.length}`);
  console.log(`Report: ${reportPath}`);
  console.log(`${"═".repeat(60)}\n`);

  if (crashes.length > 0) {
    console.log("CRITICAL — Crashes found:");
    crashes.forEach(r => console.log(`  ${r.route}: ${r.errors.join(", ")}`));
  }

  process.exit(issues.length > 0 ? 1 : 0);
}

run().catch(err => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});
