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

    const today = new Date().toISOString().split("T")[0];

    // Get all referrals
    const { data: referrals } = await supabase.from("referrals").select("*");
    if (!referrals?.length) {
      return new Response(JSON.stringify({ message: "No referrals to aggregate" }), { headers: corsHeaders });
    }

    const totalSent = referrals.length;
    const signedUp = referrals.filter(r => ["signed_up", "paid", "credited"].includes(r.status || r.reward_status)).length;
    const paid = referrals.filter(r => r.status === "paid" || r.reward_status === "credited").length;
    const conversionRate = totalSent > 0 ? (paid / totalSent) * 100 : 0;
    const totalRewardsPaid = referrals.reduce((sum, r) => sum + (r.reward_value || 0) + (r.referred_reward_value || 0), 0);

    // Get channel breakdown
    const channels: Record<string, number> = {};
    referrals.forEach(r => {
      const ch = r.channel || "unknown";
      channels[ch] = (channels[ch] || 0) + 1;
    });

    // Get share events
    const { data: shares } = await supabase.from("referral_shares").select("channel");
    const shareChannels: Record<string, number> = {};
    shares?.forEach(s => {
      shareChannels[s.channel] = (shareChannels[s.channel] || 0) + 1;
    });

    // Upsert analytics
    await supabase.from("referral_analytics").upsert({
      period_date: today,
      period_type: "daily",
      total_referrals_sent: totalSent,
      total_signups: signedUp,
      total_conversions: paid,
      conversion_rate: Math.round(conversionRate * 100) / 100,
      total_rewards_paid: totalRewardsPaid,
      channel_breakdown: channels,
      top_referrers: [],
    }, { onConflict: "period_date,period_type" });

    return new Response(JSON.stringify({ success: true, total_sent: totalSent, conversions: paid }), { headers: corsHeaders });
  } catch (err) {
    console.error("referral-analytics-cron error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
