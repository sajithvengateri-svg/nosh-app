import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuth } from "../_shared/auth.ts";
import { aiChat } from "../_shared/ai.ts";
import { checkAiQuota, logAiUsage, getUserOrgId } from "../_shared/usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    const { items, org_id } = await req.json();
    if (!items || !org_id) {
      return new Response(JSON.stringify({ error: "Missing items or org_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch current inventory for this org
    const { data: inventory } = await supabase
      .from("inventory")
      .select("name, quantity, unit, min_stock")
      .eq("org_id", org_id);

    const inventoryMap = new Map(
      (inventory || []).map((inv: any) => [inv.name.toLowerCase(), inv])
    );

    // Build prompt for AI
    const itemsList = items.map((item: any, i: number) => {
      const inv = inventoryMap.get(item.name?.toLowerCase());
      const stockInfo = inv
        ? `Current stock: ${inv.quantity} ${inv.unit || ""}, min stock: ${inv.min_stock || 0}`
        : "Not in inventory";
      return `${i + 1}. ${item.name} - Requested: ${item.quantity || "?"} ${item.unit || ""} - ${stockInfo}`;
    }).join("\n");

    const prompt = `You are a kitchen inventory assistant. A chef has requested the following items. For each item, compare against current stock levels and recommend one of:
- "order" with recommended quantity
- "skip" if stock is sufficient
- "reduce" with adjusted quantity if partial stock exists

Items:
${itemsList}

Respond with a JSON array of objects with fields: item_name, action ("order"|"skip"|"reduce"), recommended_qty (string), note (short reason).
Only output the JSON array, no markdown.`;

    const _aiStart = Date.now();
    const aiResult = await aiChat({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });
    const _aiLatency = Date.now() - _aiStart;

    if (_orgId) {
      logAiUsage({ org_id: _orgId, user_id: authResult.user.id, function_name: "check-stock-recommendations", provider: "gemini", model: "gemini-2.0-flash", usage: aiResult.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, latency_ms: _aiLatency, has_image: false });
    }

    const content = aiResult.content || "[]";

    let recommendations;
    try {
      recommendations = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim());
    } catch {
      recommendations = items.map((item: any) => ({
        item_name: item.name,
        action: "order",
        recommended_qty: item.quantity || "",
        note: "AI parse error, defaulting to order",
      }));
    }

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
