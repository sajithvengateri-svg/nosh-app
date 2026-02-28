import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth } from "../_shared/auth.ts";
import { aiChat } from "../_shared/ai.ts";
import { checkAiQuota, logAiUsage, getUserOrgId } from "../_shared/usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are BevAI, an expert bar and beverage assistant for BevOS — a professional bar management platform.

Your expertise covers:
1. **Cocktail Creation & Specs**: Classic and modern cocktails, spec cards, method steps, garnish, glassware, ice types, difficulty ratings
2. **Wine Intelligence**: Varietals, regions, vintages, cellaring windows, food pairings, serve temperatures, Coravin usage, BTG margin optimisation
3. **Draught & Beer**: Keg management, line cleaning, pour yield, tap assignments, beer styles, serve temperatures
4. **Coffee Program**: Espresso dial-in (dose, yield, time, TDS), grind calibration, brew ratios, roast freshness
5. **Pour Cost & Costing**: Pour cost calculations, GP margins, cocktail costing, keg yield analysis, waste reduction
6. **Bar Prep**: Syrup batches, fresh juice yield, garnish prep, ice production, infusions, pre-batch cocktails
7. **Stocktake & Variance**: Guided counts, variance reporting, waste/breakage tracking, cellar value
8. **Training**: Flash cards for cocktails, wine, coffee, spirits knowledge, bar technique

Guidelines:
- Use bar terminology: Bar Manager (not Head Chef), Products (not Ingredients), Cellar (not Inventory), Spec Book (not Recipe Bank), Flash Cards (not Cheatsheets)
- Be concise — bartenders are busy during service
- Use metric (ml, litres, °C) primarily
- For cocktail specs, include: method, glassware, ice, garnish, and costing
- When discussing wine, reference vintage, region, and serve temp
- Keep responses under 200 words unless more detail is requested.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

    // Auth check
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;


  try {
    const _orgId = await getUserOrgId(authResult.user.id);
    if (_orgId) {
      const _quota = await checkAiQuota(_orgId);
      if (!_quota.allowed) {
        return new Response(JSON.stringify({ error: "ai_quota_exceeded", message: "Monthly AI limit reached. Resets on the 1st.", pct_used: _quota.pct_used }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const { messages } = await req.json();

    const _aiStart = Date.now();
    const result = await aiChat({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
      model: "google/gemini-3-flash-preview",
    });
    const _aiLatency = Date.now() - _aiStart;

    if (_orgId) {
      logAiUsage({ org_id: _orgId, user_id: authResult.user.id, function_name: "bev-ai-chat", provider: "gemini", model: "google/gemini-3-flash-preview", usage: result.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, latency_ms: _aiLatency, has_image: false });
    }

    const content = result.content || "I couldn't generate a response.";

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("bev-ai-chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
