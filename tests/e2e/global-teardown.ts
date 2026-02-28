import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL || "http://127.0.0.1:54321";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * Playwright global-teardown: removes all test users (matching *@chefos-test.dev)
 * and their associated orgs so the database is left clean.
 */
export default async function globalTeardown() {
  console.log("[global-teardown] Cleaning up test data...");

  // ── 1. List all test users ──────────────────────────────────────────────────
  let deletedUsers = 0;
  let page = 1;
  const perPage = 50;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      console.error("[global-teardown] Failed to list users:", error.message);
      break;
    }

    const testUsers = (data?.users ?? []).filter((u) =>
      u.email?.endsWith("@chefos-test.dev")
    );

    for (const user of testUsers) {
      // Remove related rows first (profiles, memberships, roles)
      await supabase.from("user_roles").delete().eq("user_id", user.id);
      await supabase.from("org_memberships").delete().eq("user_id", user.id);
      await supabase.from("module_permissions").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("user_id", user.id);

      // Delete the auth user
      const { error: delError } = await supabase.auth.admin.deleteUser(user.id);
      if (delError) {
        console.warn(
          `[global-teardown] Could not delete user ${user.email}:`,
          delError.message
        );
      } else {
        deletedUsers++;
      }
    }

    // If we received fewer users than perPage the list is exhausted
    hasMore = (data?.users?.length ?? 0) === perPage;
    page++;
  }

  // ── 2. Clean up test organisations ──────────────────────────────────────────
  // Test orgs use a deterministic UUID pattern: 00000000-0000-4000-a000-00000000XXXX
  const { data: testOrgs, error: orgQueryError } = await supabase
    .from("organizations")
    .select("id, slug")
    .like("id", "00000000-0000-4000-a000-%");

  let deletedOrgs = 0;

  if (orgQueryError) {
    console.warn("[global-teardown] Could not query test orgs:", orgQueryError.message);
  } else if (testOrgs && testOrgs.length > 0) {
    const orgIds = testOrgs.map((o) => o.id);

    // Remove org-scoped rows that may block deletion (cascade may handle some)
    await supabase.from("org_memberships").delete().in("org_id", orgIds);

    const { error: delOrgError } = await supabase
      .from("organizations")
      .delete()
      .in("id", orgIds);

    if (delOrgError) {
      console.warn("[global-teardown] Could not delete test orgs:", delOrgError.message);
    } else {
      deletedOrgs = testOrgs.length;
    }
  }

  // ── 3. Remove test feature_releases that were seeded ────────────────────────
  await supabase
    .from("feature_releases")
    .delete()
    .eq("release_type", "full");

  console.log(
    `[global-teardown] Cleanup complete. Removed ${deletedUsers} users and ${deletedOrgs} orgs.`
  );
}
