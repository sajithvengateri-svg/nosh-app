// Onboarding queries — extracted from OnboardingWizard.tsx, useInduction.ts

import { supabase } from "../supabaseClient";

export async function insertOrgVenues(venues: Record<string, unknown>[]) {
  return supabase.from("org_venues").insert(venues as any);
}

export async function upsertInductionProgress(payload: Record<string, unknown>) {
  return supabase.from("induction_progress" as any).upsert(payload);
}

export async function fetchSetupCounts(orgId: string) {
  return Promise.all([
    supabase.from("recipes").select("*", { count: "exact", head: true }).eq("org_id", orgId),
    supabase.from("ingredients").select("*", { count: "exact", head: true }).eq("org_id", orgId),
    supabase.from("kitchen_sections").select("*", { count: "exact", head: true }).eq("org_id", orgId),
    supabase.from("section_stock_templates" as any).select("*", { count: "exact", head: true }),
    supabase.from("invoice_scans").select("*", { count: "exact", head: true }).eq("org_id", orgId),
    supabase.from("menus").select("*", { count: "exact", head: true }).eq("org_id", orgId),
    supabase.from("equipment_inventory").select("*", { count: "exact", head: true }).eq("org_id", orgId),
    supabase.from("cleaning_inventory").select("*", { count: "exact", head: true }).eq("org_id", orgId),
    supabase.from("nightly_stock_counts").select("*", { count: "exact", head: true }).eq("org_id", orgId),
  ]);
}

// ─── Referrals (Auth.tsx) ─────────────────────────

export async function fetchReferralCode(code: string) {
  // Use public view to validate code without exposing user_id
  return supabase.from("referral_codes_public" as any).select("code").eq("code", code).maybeSingle();
}

export async function insertReferral(payload: Record<string, unknown>) {
  return supabase.from("referrals").insert(payload as any);
}

export async function updateSignupEvent(userId: string, referralCode: string) {
  return supabase.from("signup_events").update({ referral_code: referralCode }).eq("user_id", userId);
}
