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

    const { referralId, paymentAmount } = await req.json();
    if (!referralId) {
      return new Response(JSON.stringify({ error: "Missing referralId" }), { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get referral
    const { data: referral } = await supabase
      .from("referrals")
      .select("*")
      .eq("id", referralId)
      .single();

    if (!referral) {
      return new Response(JSON.stringify({ error: "Referral not found" }), { status: 404, headers: corsHeaders });
    }

    if (referral.reward_status === "credited") {
      return new Response(JSON.stringify({ message: "Already credited" }), { headers: corsHeaders });
    }

    // Get referral settings for the tier
    const { data: settings } = await supabase
      .from("referral_settings")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    const referrerReward = settings?.referrer_reward_value ?? 20;
    const referredReward = settings?.referred_reward_value ?? 10;
    const rewardType = settings?.reward_type ?? "credit";

    // Credit the referrer
    const { data: referrerBalance } = await supabase
      .from("loyalty_credits")
      .select("balance_after")
      .eq("user_id", referral.referrer_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const newReferrerBalance = (referrerBalance?.balance_after ?? 0) + referrerReward;

    await supabase.from("loyalty_credits").insert({
      user_id: referral.referrer_id,
      amount: referrerReward,
      balance_after: newReferrerBalance,
      description: `Referral reward - friend signed up & paid`,
      source_type: "referral_reward",
      reference_id: referralId,
    });

    // Credit the referred user
    if (referral.referred_user_id) {
      const { data: referredBalance } = await supabase
        .from("loyalty_credits")
        .select("balance_after")
        .eq("user_id", referral.referred_user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const newReferredBalance = (referredBalance?.balance_after ?? 0) + referredReward;

      await supabase.from("loyalty_credits").insert({
        user_id: referral.referred_user_id,
        amount: referredReward,
        balance_after: newReferredBalance,
        description: `Welcome reward - signed up via referral`,
        source_type: "referral_welcome",
        reference_id: referralId,
      });
    }

    // Update referral status
    await supabase.from("referrals").update({
      reward_status: "credited",
      status: "paid",
      reward_value: referrerReward,
      reward_type: rewardType,
      referred_reward_value: referredReward,
      paid_at: new Date().toISOString(),
    }).eq("id", referralId);

    // Check milestone bonuses
    const { count } = await supabase
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", referral.referrer_id)
      .eq("reward_status", "credited");

    const totalReferrals = (count ?? 0) + 1;
    const milestones = settings?.milestone_bonuses as any[] || [];

    for (const milestone of milestones) {
      if (totalReferrals === milestone.count) {
        const { data: latestBal } = await supabase
          .from("loyalty_credits")
          .select("balance_after")
          .eq("user_id", referral.referrer_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        await supabase.from("loyalty_credits").insert({
          user_id: referral.referrer_id,
          amount: milestone.bonus,
          balance_after: (latestBal?.balance_after ?? 0) + milestone.bonus,
          description: `Milestone bonus: ${milestone.count} referrals!`,
          source_type: "milestone_bonus",
        });
        break;
      }
    }

    return new Response(JSON.stringify({ success: true, referrer_reward: referrerReward, referred_reward: referredReward }), { headers: corsHeaders });
  } catch (err) {
    console.error("referral-reward error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
