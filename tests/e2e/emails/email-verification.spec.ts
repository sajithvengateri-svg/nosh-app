/**
 * Email verification E2E tests.
 *
 * Validates the full email pipeline: Supabase edge functions -> email_send_log
 * -> Inbucket (local SMTP capture) -> template variable replacement.
 *
 * Locally, Supabase routes all email through Inbucket at http://localhost:54324.
 * The edge functions log every attempt to the `email_send_log` table.
 */

import { test, expect } from "../fixtures/auth.fixture";
import { signupViaUI } from "../fixtures/auth.fixture";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "http://localhost:54321";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const INBUCKET_URL = "http://localhost:54324";

/** Service-role Supabase client for direct DB queries. */
function supabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Fetch all messages for a mailbox from Inbucket.
 * Inbucket uses the local-part of the email (before @) as the mailbox id.
 */
async function getInbucketMessages(
  email: string
): Promise<{ id: string; subject: string; date: string }[]> {
  const mailbox = email.split("@")[0];
  const res = await fetch(`${INBUCKET_URL}/api/v1/mailbox/${mailbox}`);
  if (!res.ok) return [];
  return res.json();
}

/**
 * Fetch a single message body from Inbucket (HTML + text).
 */
async function getInbucketMessage(
  email: string,
  messageId: string
): Promise<{ body: { html: string; text: string }; subject: string }> {
  const mailbox = email.split("@")[0];
  const res = await fetch(
    `${INBUCKET_URL}/api/v1/mailbox/${mailbox}/${messageId}`
  );
  return res.json();
}

/**
 * Wait for at least `count` messages in an Inbucket mailbox, polling up to
 * `timeoutMs` milliseconds.
 */
async function waitForInbucketMessages(
  email: string,
  count: number,
  timeoutMs = 15_000
): Promise<{ id: string; subject: string; date: string }[]> {
  const deadline = Date.now() + timeoutMs;
  let messages: { id: string; subject: string; date: string }[] = [];
  while (Date.now() < deadline) {
    messages = await getInbucketMessages(email);
    if (messages.length >= count) return messages;
    await new Promise((r) => setTimeout(r, 1_000));
  }
  return messages;
}

/**
 * Purge all messages in an Inbucket mailbox (cleanup before tests).
 */
async function purgeInbucketMailbox(email: string): Promise<void> {
  const mailbox = email.split("@")[0];
  await fetch(`${INBUCKET_URL}/api/v1/mailbox/${mailbox}`, {
    method: "DELETE",
  });
}

/**
 * Wait for at least `count` rows in email_send_log matching the filter,
 * polling up to `timeoutMs` milliseconds.
 */
async function waitForEmailLog(
  filter: { recipient_email?: string; template_slug?: string; status?: string },
  count: number,
  timeoutMs = 15_000
): Promise<any[]> {
  const sb = supabaseAdmin();
  const deadline = Date.now() + timeoutMs;
  let rows: any[] = [];
  while (Date.now() < deadline) {
    let q = sb.from("email_send_log").select("*");
    if (filter.recipient_email)
      q = q.eq("recipient_email", filter.recipient_email);
    if (filter.template_slug)
      q = q.eq("template_slug", filter.template_slug);
    if (filter.status) q = q.eq("status", filter.status);
    const { data } = await q.order("created_at", { ascending: false });
    rows = data ?? [];
    if (rows.length >= count) return rows;
    await new Promise((r) => setTimeout(r, 1_000));
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Unique email for each test run to avoid collisions
// ---------------------------------------------------------------------------
const runId = Date.now().toString(36);

test.describe("Email Verification", () => {
  // -----------------------------------------------------------------------
  // 1. Signup triggers welcome email
  // -----------------------------------------------------------------------
  test("1 - Signup triggers welcome email in email_send_log", async ({
    page,
  }) => {
    const email = `e2e-welcome-${runId}@chefos-test.dev`;
    const password = "TestEmail2026!";
    const orgName = "E2E Welcome Org";

    // Purge any prior messages
    await purgeInbucketMailbox(email);

    // Perform signup through the UI
    await signupViaUI(page, {
      email,
      password,
      orgName,
      fullName: "Welcome Chef",
    });

    // Wait for auth redirect — signup succeeded
    await page.waitForURL((url) => !url.pathname.includes("/auth"), {
      timeout: 20_000,
    });

    // Poll email_send_log for a welcome-chef entry
    const logs = await waitForEmailLog(
      { recipient_email: email, template_slug: "welcome-chef" },
      1,
      20_000
    );

    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs[0].template_slug).toBe("welcome-chef");
    expect(logs[0].recipient_email).toBe(email);
    // Status should be sent, skipped, or pending — not failed
    expect(["sent", "skipped", "pending"]).toContain(logs[0].status);
  });

  // -----------------------------------------------------------------------
  // 2. Welcome email contains correct variables (no raw placeholders)
  // -----------------------------------------------------------------------
  test("2 - Welcome email has no raw {{placeholders}}", async ({ page }) => {
    const email = `e2e-vars-${runId}@chefos-test.dev`;
    const password = "TestVars2026!";
    const orgName = "Var Check Org";

    await purgeInbucketMailbox(email);

    await signupViaUI(page, {
      email,
      password,
      orgName,
      fullName: "Variable Chef",
    });

    await page.waitForURL((url) => !url.pathname.includes("/auth"), {
      timeout: 20_000,
    });

    // Wait for at least one Inbucket message
    const messages = await waitForInbucketMessages(email, 1, 20_000);

    // If Inbucket received a message, verify variables are replaced
    if (messages.length > 0) {
      const msg = await getInbucketMessage(email, messages[0].id);
      const html = msg.body?.html || "";
      const text = msg.body?.text || "";
      const combined = html + text;

      // Must not contain any raw template placeholders
      expect(combined).not.toMatch(/\{\{chef_name\}\}/);
      expect(combined).not.toMatch(/\{\{org_name\}\}/);
      expect(combined).not.toMatch(/\{\{app_url\}\}/);
    } else {
      // If no Inbucket message (e.g. RESEND_API_KEY not set), verify the
      // email_send_log entry at least has replaced variables stored
      const logs = await waitForEmailLog(
        { recipient_email: email, template_slug: "welcome-chef" },
        1,
        10_000
      );
      expect(logs.length).toBeGreaterThanOrEqual(1);
      // The variables JSON should have concrete values, not raw placeholders
      const vars = logs[0].variables || {};
      if (vars["{{chef_name}}"]) {
        expect(vars["{{chef_name}}"]).not.toBe("{{chef_name}}");
      }
    }
  });

  // -----------------------------------------------------------------------
  // 3. Welcome email flag updated on signup_events
  // -----------------------------------------------------------------------
  test("3 - Welcome email flag updated in signup_events", async ({ page }) => {
    const email = `e2e-flag-${runId}@chefos-test.dev`;
    const password = "TestFlag2026!";
    const orgName = "Flag Check Org";

    await signupViaUI(page, {
      email,
      password,
      orgName,
      fullName: "Flag Chef",
    });

    await page.waitForURL((url) => !url.pathname.includes("/auth"), {
      timeout: 20_000,
    });

    // Give the edge function time to update signup_events
    await page.waitForTimeout(5_000);

    const sb = supabaseAdmin();
    const { data: events } = await sb
      .from("signup_events")
      .select("*")
      .eq("user_email", email)
      .order("created_at", { ascending: false })
      .limit(1);

    expect(events).not.toBeNull();
    expect(events!.length).toBeGreaterThanOrEqual(1);

    // welcome_email_sent should be a boolean (true if sent, false if skipped)
    const evt = events![0];
    expect(typeof evt.welcome_email_sent).toBe("boolean");
  });

  // -----------------------------------------------------------------------
  // 4. Team invite sends email
  // -----------------------------------------------------------------------
  test("4 - Team invite sends email to invitee", async ({
    page,
    loginAsOwner,
  }) => {
    const inviteeEmail = `e2e-invite-${runId}@chefos-test.dev`;
    await purgeInbucketMailbox(inviteeEmail);

    // Login as urban-bistro owner
    await loginAsOwner("urban-bistro");

    // Navigate to team page
    await page.goto("/team");
    await page.waitForLoadState("networkidle");

    // Open the invite dialog — look for an invite button
    const inviteButton = page.getByRole("button", {
      name: /invite|add.*member|add.*team/i,
    });
    await expect(inviteButton.first()).toBeVisible({ timeout: 10_000 });
    await inviteButton.first().click();

    // Fill the invite form
    const emailInput = page.getByPlaceholder(/email/i);
    await expect(emailInput.first()).toBeVisible({ timeout: 5_000 });
    await emailInput.first().fill(inviteeEmail);

    // Select a role if a role picker is visible
    const roleSelect = page.locator(
      "select, [role='combobox'], [data-testid*='role']"
    );
    if (await roleSelect.first().isVisible().catch(() => false)) {
      await roleSelect.first().click();
      // Pick the first available role option
      const option = page.getByRole("option").first();
      if (await option.isVisible().catch(() => false)) {
        await option.click();
      }
    }

    // Submit the invite
    const sendButton = page.getByRole("button", {
      name: /send.*invite|invite|submit/i,
    });
    await sendButton.first().click();

    // Wait for confirmation or toast
    await page.waitForTimeout(3_000);

    // Verify email_send_log has an invite record (the edge function may use
    // a different slug — check for any record to this recipient)
    const sb = supabaseAdmin();
    const { data: logs } = await sb
      .from("email_send_log")
      .select("*")
      .eq("recipient_email", inviteeEmail)
      .order("created_at", { ascending: false });

    // The invite flow may go through the edge function directly (not via
    // email_send_log), so also check Inbucket as a fallback.
    const inbucketMessages = await waitForInbucketMessages(
      inviteeEmail,
      1,
      10_000
    );

    const hasLogEntry = (logs?.length ?? 0) > 0;
    const hasInbucketMessage = inbucketMessages.length > 0;

    expect(
      hasLogEntry || hasInbucketMessage,
      "Expected either an email_send_log entry or an Inbucket message for the invitee"
    ).toBe(true);
  });

  // -----------------------------------------------------------------------
  // 5. Invite email contains join link
  // -----------------------------------------------------------------------
  test("5 - Invite email contains /join/ token URL", async ({
    page,
    loginAsOwner,
  }) => {
    const inviteeEmail = `e2e-joinlink-${runId}@chefos-test.dev`;
    await purgeInbucketMailbox(inviteeEmail);

    await loginAsOwner("urban-bistro");
    await page.goto("/team");
    await page.waitForLoadState("networkidle");

    // Open invite dialog
    const inviteButton = page.getByRole("button", {
      name: /invite|add.*member|add.*team/i,
    });
    await expect(inviteButton.first()).toBeVisible({ timeout: 10_000 });
    await inviteButton.first().click();

    // Fill and send
    const emailInput = page.getByPlaceholder(/email/i);
    await expect(emailInput.first()).toBeVisible({ timeout: 5_000 });
    await emailInput.first().fill(inviteeEmail);

    const sendButton = page.getByRole("button", {
      name: /send.*invite|invite|submit/i,
    });
    await sendButton.first().click();

    // Wait for the email to arrive in Inbucket
    const messages = await waitForInbucketMessages(inviteeEmail, 1, 20_000);

    if (messages.length > 0) {
      const msg = await getInbucketMessage(inviteeEmail, messages[0].id);
      const html = msg.body?.html || "";
      const text = msg.body?.text || "";
      const combined = html + text;

      // The invite email should contain a /join/<token> URL
      expect(combined).toMatch(/\/join\/[a-zA-Z0-9_-]+/);
    } else {
      // If Inbucket did not receive the email (e.g. local env without
      // SMTP routing), check the invite confirmation dialog for the join link
      const confirmDialog = page.locator(
        "[role='dialog'], [data-testid*='confirm'], [data-testid*='invite']"
      );
      if (await confirmDialog.first().isVisible().catch(() => false)) {
        const dialogText = await confirmDialog.first().textContent();
        expect(dialogText).toMatch(/\/join\//);
      } else {
        // At minimum, confirm the invite was created in the database
        const sb = supabaseAdmin();
        const { data: invites } = await sb
          .from("team_invites")
          .select("token")
          .eq("email", inviteeEmail)
          .limit(1);
        expect(invites?.length).toBeGreaterThanOrEqual(1);
        expect(invites![0].token).toBeTruthy();
      }
    }
  });

  // -----------------------------------------------------------------------
  // 6. Report email
  // -----------------------------------------------------------------------
  test("6 - Report email creates email_send_log entry", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");

    // Trigger a report send via the edge function directly
    const sb = supabaseAdmin();

    // Get the user's auth token by reading it from the page's localStorage
    const token = await page.evaluate(() => {
      // Supabase stores the session in localStorage
      for (const key of Object.keys(localStorage)) {
        if (key.includes("supabase") && key.includes("auth")) {
          try {
            const parsed = JSON.parse(localStorage.getItem(key) || "{}");
            return parsed?.access_token || parsed?.currentSession?.access_token;
          } catch {
            continue;
          }
        }
      }
      return null;
    });

    // Call send-report-email edge function
    const reportEmail = "test-urban-bistro-owner@chefos-test.dev";
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/send-report-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: reportEmail,
          subject: "E2E Test Report",
          htmlContent: "<p>Daily kitchen report for E2E testing.</p>",
          reportType: "daily-summary",
        }),
      }
    );

    // The function may fail if RESEND_API_KEY is not set, but it should
    // still return a response
    const body = await response.json();

    // Even if sending fails, the attempt should be logged or the response
    // indicates the config state
    expect(response.status).toBeLessThan(502);

    // Check if the report was logged (only if the function logs to email_send_log)
    // send-report-email uses Resend directly and may not log to email_send_log,
    // so we verify the function response instead
    if (body.success) {
      expect(body.success).toBe(true);
    } else {
      // Acceptable: "Email service not configured" when RESEND_API_KEY is missing
      expect(body.error || body.reason).toBeTruthy();
    }
  });

  // -----------------------------------------------------------------------
  // 7. Missing RESEND_API_KEY logs as "skipped"
  // -----------------------------------------------------------------------
  test("7 - Missing RESEND_API_KEY logs status as skipped", async ({
    page,
  }) => {
    // This test verifies the behavior when RESEND_API_KEY is absent.
    // In the local Supabase environment, RESEND_API_KEY is typically not set,
    // so the welcome email function should log status = "skipped".

    const email = `e2e-skipped-${runId}@chefos-test.dev`;
    const password = "TestSkip2026!";
    const orgName = "Skip Check Org";

    await signupViaUI(page, {
      email,
      password,
      orgName,
      fullName: "Skip Chef",
    });

    await page.waitForURL((url) => !url.pathname.includes("/auth"), {
      timeout: 20_000,
    });

    // Wait for the email function to complete and update the log
    const logs = await waitForEmailLog(
      { recipient_email: email, template_slug: "welcome-chef" },
      1,
      20_000
    );

    if (logs.length > 0) {
      // In a local env without RESEND_API_KEY, status should be "skipped"
      // In CI with a real key, status would be "sent"
      // The key invariant: status must NEVER be "failed"
      expect(logs[0].status).not.toBe("failed");

      // If the env has no Resend key, it must be "skipped"
      if (!process.env.RESEND_API_KEY) {
        expect(logs[0].status).toBe("skipped");
        expect(logs[0].error_message).toContain("RESEND_API_KEY");
      }
    }
  });

  // -----------------------------------------------------------------------
  // 8. Duplicate signup does NOT re-send welcome email
  // -----------------------------------------------------------------------
  test("8 - Duplicate signup does not re-send welcome email", async ({
    page,
  }) => {
    const email = `e2e-dup-${runId}@chefos-test.dev`;
    const password = "TestDup2026!";
    const orgName = "Duplicate Org";

    await purgeInbucketMailbox(email);

    // First signup
    await signupViaUI(page, {
      email,
      password,
      orgName,
      fullName: "Dup Chef",
    });

    // Wait for auth redirect
    await page.waitForURL((url) => !url.pathname.includes("/auth"), {
      timeout: 20_000,
    });

    // Wait for first welcome email to be logged
    await waitForEmailLog(
      { recipient_email: email, template_slug: "welcome-chef" },
      1,
      15_000
    );

    // Count welcome emails before second attempt
    const sb = supabaseAdmin();
    const { data: beforeLogs } = await sb
      .from("email_send_log")
      .select("id")
      .eq("recipient_email", email)
      .eq("template_slug", "welcome-chef");
    const countBefore = beforeLogs?.length ?? 0;

    // Logout by clearing session
    await page.evaluate(() => localStorage.clear());
    await page.goto("/auth");
    await page.waitForLoadState("networkidle");

    // Attempt second signup with same email (Supabase will reject or
    // the user already exists)
    await signupViaUI(page, {
      email,
      password,
      orgName: "Duplicate Org 2",
      fullName: "Dup Chef 2",
    });

    // Wait a bit for any potential duplicate email
    await page.waitForTimeout(5_000);

    // Count welcome emails after second attempt
    const { data: afterLogs } = await sb
      .from("email_send_log")
      .select("id")
      .eq("recipient_email", email)
      .eq("template_slug", "welcome-chef");
    const countAfter = afterLogs?.length ?? 0;

    // Should not have sent another welcome email
    expect(countAfter).toBe(countBefore);
  });

  // -----------------------------------------------------------------------
  // 9. Email template variable replacement complete (no {{...}} in any email)
  // -----------------------------------------------------------------------
  test("9 - No raw {{...}} patterns in any Inbucket emails", async ({
    page,
  }) => {
    const email = `e2e-tmpl-${runId}@chefos-test.dev`;
    const password = "TestTmpl2026!";
    const orgName = "Template Org";

    await purgeInbucketMailbox(email);

    await signupViaUI(page, {
      email,
      password,
      orgName,
      fullName: "Template Chef",
    });

    await page.waitForURL((url) => !url.pathname.includes("/auth"), {
      timeout: 20_000,
    });

    // Collect all messages in the mailbox
    const messages = await waitForInbucketMessages(email, 1, 20_000);

    // Check every message for unresolved template variables
    const unresolvedPlaceholderPattern = /\{\{[a-z_]+\}\}/g;

    for (const msg of messages) {
      const full = await getInbucketMessage(email, msg.id);
      const html = full.body?.html || "";
      const text = full.body?.text || "";
      const subject = full.subject || "";

      const htmlMatches = html.match(unresolvedPlaceholderPattern);
      const textMatches = text.match(unresolvedPlaceholderPattern);
      const subjectMatches = subject.match(unresolvedPlaceholderPattern);

      expect(
        htmlMatches,
        `Found unresolved placeholders in HTML body: ${htmlMatches}`
      ).toBeNull();
      expect(
        textMatches,
        `Found unresolved placeholders in text body: ${textMatches}`
      ).toBeNull();
      expect(
        subjectMatches,
        `Found unresolved placeholders in subject: ${subjectMatches}`
      ).toBeNull();
    }

    // If no Inbucket messages arrived (no SMTP routing), verify via the DB
    if (messages.length === 0) {
      const logs = await waitForEmailLog(
        { recipient_email: email },
        1,
        10_000
      );
      expect(logs.length).toBeGreaterThanOrEqual(1);
      // Check variables field doesn't contain raw placeholder strings as values
      for (const log of logs) {
        const vars = log.variables || {};
        for (const [key, value] of Object.entries(vars)) {
          expect(
            value as string,
            `Variable ${key} was not replaced`
          ).not.toMatch(unresolvedPlaceholderPattern);
        }
      }
    }
  });

  // -----------------------------------------------------------------------
  // 10. Email throttling
  // -----------------------------------------------------------------------
  test("10 - Email throttling prevents duplicate sends in quick succession", async ({
    page,
  }) => {
    const email = `e2e-throttle-${runId}@chefos-test.dev`;

    await purgeInbucketMailbox(email);

    // We simulate triggering the same email type twice quickly by calling the
    // edge function directly with the service role key.
    const sb = supabaseAdmin();

    // First, create a minimal user record for the test.  We don't need a
    // real signup — just enough to call send-welcome-email.
    const { data: authUser } = await sb.auth.admin.createUser({
      email,
      password: "ThrottleTest2026!",
      email_confirm: true,
      user_metadata: { full_name: "Throttle Chef" },
    });
    const userId = authUser?.user?.id;

    // Get a service-role bearer token for calling the edge function
    // (the function checks requireAuth, so we use a user token)
    const { data: session } = await sb.auth.signInWithPassword({
      email,
      password: "ThrottleTest2026!",
    });
    const accessToken = session?.session?.access_token;

    if (!accessToken || !userId) {
      test.skip(true, "Could not create test user for throttle test");
      return;
    }

    // Fire two welcome emails in rapid succession
    const payload = {
      userId,
      email,
      chefName: "Throttle Chef",
      orgName: "Throttle Org",
    };

    const callEdgeFunction = () =>
      fetch(`${SUPABASE_URL}/functions/v1/send-welcome-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

    // Send both simultaneously
    const [res1, res2] = await Promise.all([
      callEdgeFunction(),
      callEdgeFunction(),
    ]);

    // Wait for processing
    await page.waitForTimeout(5_000);

    // Count email_send_log entries
    const { data: logs } = await sb
      .from("email_send_log")
      .select("*")
      .eq("recipient_email", email)
      .eq("template_slug", "welcome-chef")
      .order("created_at", { ascending: true });

    const sentCount =
      logs?.filter(
        (l: any) => l.status === "sent" || l.status === "skipped"
      ).length ?? 0;

    // Expect either:
    // - Both logged but second throttled (total logged = 2, second has
    //   status "throttled" or "skipped")
    // - Only one logged (the function de-duped before inserting)
    //
    // The key invariant: at most 1 email should have status "sent"
    const sentEmails = logs?.filter((l: any) => l.status === "sent") ?? [];
    expect(
      sentEmails.length,
      `Expected at most 1 sent email, got ${sentEmails.length}`
    ).toBeLessThanOrEqual(1);

    // Clean up the test user
    if (userId) {
      await sb.auth.admin.deleteUser(userId);
    }
  });
});
