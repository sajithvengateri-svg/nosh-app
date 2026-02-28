import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Freemium Nudge Cron
 *
 * Runs daily (via Supabase cron or external scheduler).
 * For each free-tier org past its nudge threshold:
 *   1. Inserts an upgrade_nudge record (in-app prompt)
 *   2. After first nudge: schedules a "sneak_peek" nudge
 *   3. Logs the event in org_subscription_events
 *
 * POST /freemium-nudge-cron (called by cron, no user auth needed)
 * Headers: Authorization: Bearer <service_role_key>
 */
Deno.serve(async (req) => {
  try {
    // Only allow service role or cron calls
    const authHeader = req.headers.get("Authorization");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!authHeader || !authHeader.includes(serviceKey)) {
      return new Response(
        JSON.stringify({ error: "Unauthorized — service role key required" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const db = createClient(supabaseUrl, serviceKey);

    // Get all free-tier orgs that haven't been nudged yet (or need re-nudge)
    // Join with subscription_plans to get nudge_days threshold per product
    const { data: freeOrgs, error: orgError } = await db
      .from("organizations")
      .select("id, name, created_at, store_mode, subscription_tier, upgrade_nudge_shown_at, owner_id")
      .eq("subscription_tier", "free");

    if (orgError) throw orgError;
    if (!freeOrgs || freeOrgs.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: "No free orgs to nudge" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // Get nudge thresholds per product from subscription_plans
    const { data: plans } = await db
      .from("subscription_plans")
      .select("product_key, freemium_nudge_days, tier")
      .eq("tier", "pro");

    const nudgeDaysMap: Record<string, number> = {};
    for (const plan of (plans || [])) {
      nudgeDaysMap[(plan as any).product_key] = (plan as any).freemium_nudge_days ?? 15;
    }

    const now = new Date();
    let nudgedCount = 0;
    let sneakPeekCount = 0;

    for (const org of freeOrgs) {
      const createdAt = new Date((org as any).created_at);
      const daysSinceSignup = Math.floor(
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      const nudgeDays = nudgeDaysMap[(org as any).store_mode] ?? 15;

      // Not yet time to nudge
      if (daysSinceSignup < nudgeDays) continue;

      const orgId = (org as any).id;
      const ownerId = (org as any).owner_id;

      // Check if we've already sent a nudge today
      const today = now.toISOString().split("T")[0];
      const { data: existingNudge } = await db
        .from("upgrade_nudges")
        .select("id, nudge_type")
        .eq("org_id", orgId)
        .gte("created_at", `${today}T00:00:00`)
        .maybeSingle();

      if (existingNudge) continue;

      // Determine nudge type: first nudge is upgrade_prompt, subsequent is sneak_peek
      const { count: previousNudges } = await db
        .from("upgrade_nudges")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId)
        .eq("nudge_type", "upgrade_prompt");

      const nudgeType = (previousNudges ?? 0) > 0 ? "sneak_peek" : "upgrade_prompt";

      // Insert nudge for the org owner
      await db.from("upgrade_nudges").insert({
        org_id: orgId,
        user_id: ownerId,
        nudge_type: nudgeType,
        nudge_channel: "in_app",
        metadata: {
          days_since_signup: daysSinceSignup,
          store_mode: (org as any).store_mode,
          nudge_threshold: nudgeDays,
        },
      } as any);

      // Update org nudge timestamp
      if (!(org as any).upgrade_nudge_shown_at) {
        await db
          .from("organizations")
          .update({ upgrade_nudge_shown_at: now.toISOString() } as any)
          .eq("id", orgId);
      }

      // Log event
      await db.from("org_subscription_events").insert({
        org_id: orgId,
        event_type: "nudge_sent",
        metadata: {
          nudge_type: nudgeType,
          days_since_signup: daysSinceSignup,
        },
      } as any);

      if (nudgeType === "sneak_peek") {
        sneakPeekCount++;
      } else {
        nudgedCount++;
      }
    }

    return new Response(
      JSON.stringify({
        processed: freeOrgs.length,
        nudged: nudgedCount,
        sneak_peeks: sneakPeekCount,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("freemium-nudge-cron error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
