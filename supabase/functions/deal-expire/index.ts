// deal-expire: Cron job to mark expired deal codes
// Schedule: hourly via Supabase dashboard or pg_cron
// Uses service role — no user auth required

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (_req) => {
  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const now = new Date().toISOString();

  const { data, error } = await db
    .from("deal_codes")
    .update({ status: "expired", updated_at: now })
    .eq("status", "active")
    .lt("expires_at", now)
    .select("id");

  const expiredCount = data?.length ?? 0;

  console.log(`deal-expire: ${expiredCount} codes expired at ${now}`);

  return new Response(
    JSON.stringify({
      expired_count: expiredCount,
      timestamp: now,
      error: error?.message ?? null,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
});
