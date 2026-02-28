/**
 * Seed data scenarios for each org type.
 * Maps org slugs to the sequence of seed actions that should run.
 */
import { TEST_ORGS, testEmail, TEST_PASSWORD, type TestOrg } from "./orgs";

export interface SeedAction {
  action: string;
  data?: Record<string, any>;
}

/**
 * Get the full seed sequence for an org.
 * Returns an ordered list of seed actions to run after the org is created.
 */
export function getSeedSequence(org: TestOrg): SeedAction[] {
  const actions: SeedAction[] = [];

  switch (org.seedAction) {
    case "none":
      return [];

    case "seed_home_cook":
      actions.push(
        { action: "seed_home_cook", data: { org_id: "__ORG_ID__" } },
      );
      break;

    case "seed_chiccit_full":
      // Full restaurant seed — staff, revenue, labour, overheads, pnl, bev, reservations, marketing, audit
      actions.push(
        { action: "seed_ingredients" },
        { action: "seed_recipes" },
        { action: "seed_chiccit_full", data: { org_id: "__ORG_ID__" } },
        { action: "seed_pos_menu", data: { org_id: "__ORG_ID__" } },
        { action: "seed_todo_items", data: { org_id: "__ORG_ID__", count: 50 } },
        { action: "seed_todo_recurring_rules", data: { org_id: "__ORG_ID__" } },
        { action: "seed_delegated_tasks", data: { org_id: "__ORG_ID__" } },
      );
      // Add GCC compliance for GCC orgs
      if (org.region.startsWith("gcc_")) {
        const emirate = org.region.replace("gcc_", "");
        actions.push(
          { action: "seed_gcc_compliance", data: { org_id: "__ORG_ID__", emirate } },
        );
      }
      break;

    case "seed_vendor":
      actions.push(
        { action: "seed_vendor", data: { org_id: "__ORG_ID__" } },
      );
      break;

    case "seed_admin":
      actions.push(
        { action: "seed_admin" },
        { action: "seed_feature_releases" },
        { action: "seed_email_templates" },
      );
      break;

    default:
      actions.push({ action: org.seedAction, data: { org_id: "__ORG_ID__" } });
  }

  return actions;
}

/**
 * Build the full 200-user test plan payload for the seed_200_test_plan action.
 */
export function buildTestPlanPayload() {
  return TEST_ORGS.map((org) => ({
    slug: org.slug,
    name: org.name,
    store_mode: org.storeMode,
    emirate: org.region.startsWith("gcc_") ? org.region.replace("gcc_", "") : undefined,
    seed_action: org.seedAction,
    roles: org.roles.map((r) => ({
      email: testEmail(org.slug, r.suffix),
      password: TEST_PASSWORD,
      role: r.role,
    })),
  }));
}

/**
 * Summary of what gets seeded — useful for logging.
 */
export function getSeedSummary() {
  const byVariant: Record<string, number> = {};
  const byMode: Record<string, number> = {};
  const byRegion: Record<string, number> = {};
  let totalUsers = 0;

  for (const org of TEST_ORGS) {
    byVariant[org.variant] = (byVariant[org.variant] || 0) + 1;
    byMode[org.storeMode] = (byMode[org.storeMode] || 0) + 1;
    byRegion[org.region] = (byRegion[org.region] || 0) + 1;
    totalUsers += org.roles.length;
  }

  return {
    totalOrgs: TEST_ORGS.length,
    totalUsers,
    byVariant,
    byMode,
    byRegion,
  };
}
