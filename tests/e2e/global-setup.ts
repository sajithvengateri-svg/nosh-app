import { createClient } from "@supabase/supabase-js";
import { TEST_ORGS, testEmail, TEST_PASSWORD, getAllTestUsers } from "../data/orgs";
import { ALL_CHEF_NAV } from "../../apps/web/src/lib/chefNavItems";

const SUPABASE_URL =
  process.env.SUPABASE_URL || "http://127.0.0.1:54321";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * All unique module slugs used across the chef nav items.
 * These are marked as "released" so the sidebar renders them during tests.
 */
const ALL_MODULE_SLUGS = [...new Set(ALL_CHEF_NAV.map((item) => item.module))];

/**
 * Playwright global-setup: seeds the test database with users, orgs, memberships,
 * and feature releases so the E2E suite can run against realistic data.
 */
export default async function globalSetup() {
  console.log("[global-setup] Starting database seed...");

  // ── 1. Create orgs ──────────────────────────────────────────────────────────
  for (const org of TEST_ORGS) {
    // Upsert so re-runs don't fail
    const { error: orgError } = await supabase
      .from("organizations")
      .upsert(
        {
          id: orgIdFromInt(org.id),
          slug: org.slug,
          name: org.name,
          store_mode: org.storeMode,
          owner_id: "00000000-0000-0000-0000-000000000000", // placeholder, updated below
        },
        { onConflict: "slug" }
      );

    if (orgError) {
      console.error(`[global-setup] Failed to upsert org "${org.slug}":`, orgError.message);
    }
  }

  // ── 2. Create users and memberships ──────────────────────────────────────────
  let totalCreated = 0;

  for (const org of TEST_ORGS) {
    const orgUuid = orgIdFromInt(org.id);
    let ownerUserId: string | null = null;

    for (const roleEntry of org.roles) {
      const email = testEmail(org.slug, roleEntry.suffix);

      // Create auth user (idempotent: if user exists we retrieve them)
      let userId: string;
      const { data: createData, error: createError } =
        await supabase.auth.admin.createUser({
          email,
          password: TEST_PASSWORD,
          email_confirm: true,
          user_metadata: {
            full_name: displayName(org.name, roleEntry.suffix),
            org_name: org.name,
            store_mode: org.storeMode,
          },
        });

      if (createError) {
        // User may already exist from a prior run
        if (createError.message?.includes("already been registered")) {
          const { data: listData } = await supabase.auth.admin.listUsers({
            page: 1,
            perPage: 1,
          });
          // Lookup by email from a targeted query
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          const existing = existingUsers?.users?.find(
            (u) => u.email === email
          );
          if (!existing) {
            console.error(`[global-setup] Cannot find existing user ${email}`);
            continue;
          }
          userId = existing.id;
        } else {
          console.error(`[global-setup] Failed to create user ${email}:`, createError.message);
          continue;
        }
      } else {
        userId = createData.user.id;
      }

      totalCreated++;

      // Track owner for org ownership
      if (roleEntry.suffix === "owner" || roleEntry.suffix === "admin1") {
        ownerUserId = userId;
      }

      // Upsert profile
      await supabase.from("profiles").upsert(
        {
          user_id: userId,
          full_name: displayName(org.name, roleEntry.suffix),
          email,
          position: roleEntry.role,
        },
        { onConflict: "user_id" }
      );

      // Upsert org membership
      await supabase.from("org_memberships").upsert(
        {
          user_id: userId,
          org_id: orgUuid,
          role: roleEntry.role,
          is_active: true,
          member_status: "active",
        },
        { onConflict: "user_id,org_id" }
      );

      // Upsert user_roles row (used by AuthContext)
      await supabase.from("user_roles").upsert(
        {
          user_id: userId,
          role: roleEntry.role,
        },
        { onConflict: "user_id" }
      );
    }

    // Update org owner_id to the actual owner user
    if (ownerUserId) {
      await supabase
        .from("organizations")
        .update({ owner_id: ownerUserId })
        .eq("id", orgUuid);
    }

    // ── 3. Seed data via edge function if needed ──────────────────────────────
    if (org.seedAction && org.seedAction !== "none") {
      try {
        const { error: fnError } = await supabase.functions.invoke("seed-data", {
          body: {
            action: org.seedAction,
            org_id: orgUuid,
            org_slug: org.slug,
            store_mode: org.storeMode,
            region: org.region,
            venues: org.venues ?? 1,
          },
        });
        if (fnError) {
          console.warn(
            `[global-setup] seed-data function warning for "${org.slug}":`,
            fnError.message
          );
        }
      } catch (err: any) {
        console.warn(
          `[global-setup] seed-data invocation failed for "${org.slug}":`,
          err?.message ?? err
        );
      }
    }
  }

  // ── 4. Mark all modules as released ─────────────────────────────────────────
  const releaseRows = ALL_MODULE_SLUGS.map((slug, i) => ({
    module_slug: slug,
    module_name: slug
      .split("-")
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" "),
    status: "released",
    release_type: "full",
    sort_order: i,
    released_at: new Date().toISOString(),
  }));

  const { error: releaseError } = await supabase
    .from("feature_releases")
    .upsert(releaseRows, { onConflict: "module_slug" });

  if (releaseError) {
    console.error("[global-setup] Failed to upsert feature_releases:", releaseError.message);
  }

  console.log(
    `[global-setup] Seed complete. Created/verified ${totalCreated} users across ${TEST_ORGS.length} orgs. Released ${ALL_MODULE_SLUGS.length} modules.`
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Convert a small integer org ID (1-40) into a deterministic UUID so tests can
 * reference orgs without querying the DB first.
 */
function orgIdFromInt(id: number): string {
  const hex = id.toString(16).padStart(12, "0");
  return `00000000-0000-4000-a000-${hex}`;
}

/**
 * Build a human-readable display name from the org name and role suffix.
 */
function displayName(orgName: string, suffix: string): string {
  const label = suffix
    .replace(/([0-9]+)/, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return `${label} — ${orgName}`;
}
