// deal-redeem: Two-step deal code validation and redemption
// Step 1: POST { code } → returns deal info + consumer first name
// Step 2: POST { code, transaction_amount, confirm: true } → marks redeemed

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuth } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Auth — vendor must be logged in
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let body: { code?: string; transaction_amount?: number; confirm?: boolean };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { code, transaction_amount, confirm } = body;

  if (!code || typeof code !== "string") {
    return jsonResponse({ error: "Missing code" }, 400);
  }

  // Normalise code: uppercase, trim, strip dashes
  const normalised = code.replace(/-/g, "").toUpperCase().trim();

  if (!/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/.test(normalised)) {
    return jsonResponse({ error: "Invalid code format" }, 400);
  }

  // Look up the deal code with joined deal + vendor info
  const { data: dealCode, error: lookupErr } = await db
    .from("deal_codes")
    .select(
      `*, vendor_deals(title, description, discount_percent, discount_amount, min_order_value), vendor_profiles!deal_codes_vendor_id_fkey(business_name)`
    )
    .eq("code", normalised)
    .single();

  if (lookupErr || !dealCode) {
    return jsonResponse({ error: "Code not found" }, 404);
  }

  // Check status
  if (dealCode.status === "redeemed") {
    return jsonResponse({ error: "Code already redeemed" }, 400);
  }
  if (dealCode.status === "expired") {
    return jsonResponse({ error: "Code has expired" }, 400);
  }

  // Check expiry (auto-expire if past)
  if (new Date(dealCode.expires_at) < new Date()) {
    await db
      .from("deal_codes")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", dealCode.id);
    return jsonResponse({ error: "Code has expired" }, 400);
  }

  // Verify this vendor owns the deal
  const { data: vendorProfile } = await db
    .from("vendor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!vendorProfile || vendorProfile.id !== dealCode.vendor_id) {
    return jsonResponse({ error: "This code is not for your store" }, 403);
  }

  // Get consumer first name for the confirm screen
  const { data: consumerProfile } = await db
    .from("profiles")
    .select("full_name")
    .eq("id", dealCode.user_id)
    .maybeSingle();

  const consumerFirstName =
    consumerProfile?.full_name?.split(" ")[0] ?? "Customer";

  // ── Step 1: Validate only ──
  if (!confirm) {
    return jsonResponse({
      valid: true,
      deal_code_id: dealCode.id,
      code: dealCode.code,
      consumer_first_name: consumerFirstName,
      deal: dealCode.vendor_deals,
      vendor: dealCode.vendor_profiles,
      claimed_at: dealCode.claimed_at,
      expires_at: dealCode.expires_at,
    });
  }

  // ── Step 2: Confirm redemption ──
  if (transaction_amount === undefined || transaction_amount === null) {
    return jsonResponse({ error: "Missing transaction_amount" }, 400);
  }

  if (typeof transaction_amount !== "number" || transaction_amount < 0) {
    return jsonResponse({ error: "Invalid transaction_amount" }, 400);
  }

  const { error: updateErr } = await db
    .from("deal_codes")
    .update({
      status: "redeemed",
      redeemed_at: new Date().toISOString(),
      scanned_by: user.id,
      transaction_amount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", dealCode.id)
    .eq("status", "active"); // guard against double-redeem

  if (updateErr) {
    return jsonResponse({ error: "Failed to redeem" }, 500);
  }

  return jsonResponse({
    success: true,
    redeemed: true,
    deal_title: dealCode.vendor_deals?.title,
    transaction_amount,
    consumer_first_name: consumerFirstName,
  });
});
