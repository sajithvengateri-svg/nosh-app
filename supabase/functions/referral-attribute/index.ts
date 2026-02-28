import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: corsHeaders });
    }

    const { userId, referralCode, email } = await req.json();
    if (!userId || !referralCode) {
      return new Response(JSON.stringify({ error: "Missing userId or referralCode" }), { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up the referral code
    const { data: codeRow } = await supabase
      .from("referral_codes")
      .select("id, user_id, code")
      .eq("code", referralCode.toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    if (!codeRow) {
      return new Response(JSON.stringify({ error: "Invalid referral code" }), { status: 404, headers: corsHeaders });
    }

    // Don't allow self-referral
    if (codeRow.user_id === userId) {
      return new Response(JSON.stringify({ error: "Cannot refer yourself" }), { status: 400, headers: corsHeaders });
    }

    // Check if referral already exists
    const { data: existing } = await supabase
      .from("referrals")
      .select("id")
      .eq("referrer_id", codeRow.user_id)
      .eq("referred_user_id", userId)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ message: "Referral already recorded" }), { headers: corsHeaders });
    }

    // Create referral record
    const { data: referral, error: refError } = await supabase
      .from("referrals")
      .insert({
        referrer_id: codeRow.user_id,
        referred_user_id: userId,
        referral_code: codeRow.code,
        status: "signed_up",
        reward_status: "pending",
        channel: "link",
        referred_email: email || null,
      })
      .select()
      .single();

    if (refError) throw refError;

    // Create a lead from the referral
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", userId)
      .maybeSingle();

    await supabase.from("leads").insert({
      venue_name: profile?.full_name || email || "Referred User",
      contact_name: profile?.full_name || null,
      email: profile?.email || email || null,
      source: "referral",
      stage: "lead",
      notes: `Referred by code ${codeRow.code}`,
    });

    // Log activity
    await supabase.from("lead_activities").insert({
      lead_id: referral.id,
      activity_type: "referral_signup",
      content: `New sign-up via referral code ${codeRow.code}`,
    }).maybeSingle(); // ignore if lead_id doesn't match

    return new Response(JSON.stringify({ success: true, referral_id: referral.id }), { headers: corsHeaders });
  } catch (err) {
    console.error("referral-attribute error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
