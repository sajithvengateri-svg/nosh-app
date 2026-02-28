import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Health Check
 *
 * Public endpoint for uptime monitoring (UptimeRobot, Better Uptime, etc.)
 * Verifies DB connectivity with a simple SELECT 1.
 *
 * GET /health-check → { status: "ok", ts, db: true }
 */
Deno.serve(async () => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(supabaseUrl, serviceKey);

    // Simple DB connectivity check
    const start = Date.now();
    const { error } = await db.from("subscription_plans").select("id").limit(1);
    const dbLatency = Date.now() - start;

    if (error) {
      return new Response(
        JSON.stringify({
          status: "degraded",
          ts: new Date().toISOString(),
          db: false,
          error: error.message,
        }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        status: "ok",
        ts: new Date().toISOString(),
        db: true,
        db_latency_ms: dbLatency,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        status: "error",
        ts: new Date().toISOString(),
        db: false,
        error: (e as Error).message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
