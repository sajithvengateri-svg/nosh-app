import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Sync AI Rates
 *
 * Upserts known AI provider pricing into ai_cost_rates.
 * Run on deploy or via cron (weekly). Rates are hardcoded here
 * because providers don't expose a JSON pricing API.
 *
 * POST /sync-ai-rates (no auth required — internal/cron only)
 */

const RATES = [
  // Gemini
  { provider: "gemini", model: "gemini-2.0-flash", input_cost_per_1k: 0.000075, output_cost_per_1k: 0.000300, image_cost_per_call: 0.000040 },
  { provider: "gemini", model: "gemini-3-flash", input_cost_per_1k: 0.000075, output_cost_per_1k: 0.000300, image_cost_per_call: 0.000040 },
  { provider: "gemini", model: "gemini-2.5-pro", input_cost_per_1k: 0.00125, output_cost_per_1k: 0.01000, image_cost_per_call: 0.000650 },
  // OpenAI
  { provider: "openai", model: "gpt-4o-mini", input_cost_per_1k: 0.000150, output_cost_per_1k: 0.000600, image_cost_per_call: 0.000070 },
  { provider: "openai", model: "gpt-4o", input_cost_per_1k: 0.002500, output_cost_per_1k: 0.010000, image_cost_per_call: 0.003600 },
  // Anthropic
  { provider: "anthropic", model: "claude-sonnet-4-20250514", input_cost_per_1k: 0.003000, output_cost_per_1k: 0.015000, image_cost_per_call: 0.004800 },
  { provider: "anthropic", model: "claude-haiku-3-5", input_cost_per_1k: 0.000800, output_cost_per_1k: 0.004000, image_cost_per_call: 0.001600 },
];

Deno.serve(async (_req) => {
  try {
    const db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const today = new Date().toISOString().slice(0, 10);
    let upserted = 0;

    for (const rate of RATES) {
      // Close any existing open-ended rate for this provider/model
      await db
        .from("ai_cost_rates")
        .update({ effective_until: today })
        .eq("provider", rate.provider)
        .eq("model", rate.model)
        .is("effective_until", null)
        .neq("input_cost_per_1k", rate.input_cost_per_1k);

      // Upsert current rate
      const { error } = await db.from("ai_cost_rates").upsert(
        {
          provider: rate.provider,
          model: rate.model,
          input_cost_per_1k: rate.input_cost_per_1k,
          output_cost_per_1k: rate.output_cost_per_1k,
          image_cost_per_call: rate.image_cost_per_call,
          source: "auto_sync",
          effective_from: today,
          effective_until: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "provider,model,effective_from" },
      );

      if (!error) upserted++;
    }

    return new Response(
      JSON.stringify({ success: true, rates_synced: upserted, total: RATES.length }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("sync-ai-rates error:", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
