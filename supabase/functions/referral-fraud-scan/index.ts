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
    // Auth check — require authenticated user
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

    const supabase = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const flags: Array<{ referrer_id: string; reason: string; referral_ids: string[] }> = [];

    // 1. Rapid referrals: >5 referrals in 24h from same referrer
    const { data: referrals } = await supabase
      .from("referrals")
      .select("id, referrer_id, referred_email, created_at, reward_status")
      .order("created_at", { ascending: false })
      .limit(500);

    if (!referrals?.length) {
      return new Response(JSON.stringify({ message: "No referrals to scan", flags: [] }), { headers: corsHeaders });
    }

    // Group by referrer
    const byReferrer: Record<string, typeof referrals> = {};
    referrals.forEach(r => {
      if (!byReferrer[r.referrer_id]) byReferrer[r.referrer_id] = [];
      byReferrer[r.referrer_id].push(r);
    });

    const now = Date.now();
    const DAY_MS = 86400000;

    for (const [referrerId, refs] of Object.entries(byReferrer)) {
      // Check rapid referrals (>5 in 24h)
      const last24h = refs.filter(r => now - new Date(r.created_at).getTime() < DAY_MS);
      if (last24h.length > 5) {
        flags.push({
          referrer_id: referrerId,
          reason: `Rapid referrals: ${last24h.length} in 24 hours`,
          referral_ids: last24h.map(r => r.id),
        });
      }

      // Check domain clustering (>3 referrals with same email domain)
      const domains: Record<string, string[]> = {};
      refs.forEach(r => {
        if (r.referred_email) {
          const domain = r.referred_email.split("@")[1];
          if (domain) {
            if (!domains[domain]) domains[domain] = [];
            domains[domain].push(r.id);
          }
        }
      });

      for (const [domain, ids] of Object.entries(domains)) {
        if (ids.length > 3 && !["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com"].includes(domain)) {
          flags.push({
            referrer_id: referrerId,
            reason: `Domain cluster: ${ids.length} referrals from @${domain}`,
            referral_ids: ids,
          });
        }
      }

      // Check self-referral patterns (same email prefix patterns)
      const emailPrefixes = refs
        .filter(r => r.referred_email)
        .map(r => r.referred_email!.split("@")[0].replace(/[0-9]+$/, ""));
      
      const prefixCounts: Record<string, number> = {};
      emailPrefixes.forEach(p => { prefixCounts[p] = (prefixCounts[p] || 0) + 1; });
      
      for (const [prefix, count] of Object.entries(prefixCounts)) {
        if (count > 3) {
          flags.push({
            referrer_id: referrerId,
            reason: `Similar email pattern: ${count} referrals with prefix "${prefix}"`,
            referral_ids: refs.filter(r => r.referred_email?.split("@")[0].replace(/[0-9]+$/, "") === prefix).map(r => r.id),
          });
        }
      }
    }

    // Flag suspicious referrals
    for (const flag of flags) {
      for (const refId of flag.referral_ids) {
        await supabase.from("referrals").update({
          reward_status: "flagged",
          notes: flag.reason,
        }).eq("id", refId).eq("reward_status", "pending");
      }
    }

    return new Response(JSON.stringify({ success: true, flags_found: flags.length, flags }), { headers: corsHeaders });
  } catch (err) {
    console.error("referral-fraud-scan error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
