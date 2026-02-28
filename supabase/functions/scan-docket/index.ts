import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth } from "../_shared/auth.ts";
import { aiChat } from "../_shared/ai.ts";
import { checkAiQuota, logAiUsage, getUserOrgId } from "../_shared/usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const { image_base64, file_type, existing_ingredients } = await req.json();

    if (!image_base64) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build ingredient list for matching
    const ingredientList = (existing_ingredients || [])
      .map((i: any) => `- ID: ${i.id}, Name: "${i.name}", Unit: ${i.unit}, Cost: $${i.cost_per_unit}`)
      .join("\n");

    const systemPrompt = `You are an expert at reading supermarket receipts and dockets. Extract all purchased items from the receipt image.

For each item extract:
- name: The product name as printed on the receipt
- quantity: Number of units purchased (default 1 if not shown)
- unit_price: Price per unit in local currency
- total_price: Line total for that item

Also extract:
- store_name: The store/supermarket name
- receipt_date: The date on the receipt (ISO format YYYY-MM-DD if possible)
- receipt_total: The grand total

${ingredientList ? `Match each receipt item to the closest ingredient from this existing list. Set matched_ingredient_id and matched_ingredient_name if confident (confidence >= 0.6). Set confidence 0-1.

Existing ingredients:
${ingredientList}` : "No existing ingredients to match against. Set matched_ingredient_id to null for all items."}

You MUST call the extract_docket_data tool with the extracted data.`;

    const _aiStart = Date.now();
    const aiResult = await aiChat({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:${file_type || "image/jpeg"};base64,${image_base64}` } },
            { type: "text", text: "Extract all items from this supermarket receipt/docket." },
          ],
        },
      ],
      tools: [{ type: "function", function: { name: "extract_docket_data", description: "Return structured data extracted from a supermarket receipt.", parameters: { type: "object", properties: { store_name: { type: "string" }, receipt_date: { type: "string" }, receipt_total: { type: "number" }, items: { type: "array", items: { type: "object", properties: { name: { type: "string" }, quantity: { type: "number" }, unit_price: { type: "number" }, total_price: { type: "number" }, matched_ingredient_id: { type: "string" }, matched_ingredient_name: { type: "string" }, confidence: { type: "number" } }, required: ["name", "quantity", "unit_price", "total_price", "confidence"] } } }, required: ["store_name", "receipt_date", "receipt_total", "items"] } } }],
      tool_choice: { type: "function", function: { name: "extract_docket_data" } },
    });

    const _aiLatency = Date.now() - _aiStart;

    const toolArgs = aiResult.tool_calls?.[0]?.function.arguments;
    if (!toolArgs) throw new Error("No structured data returned from AI");
    const extracted = JSON.parse(toolArgs);

    if (_orgId) {
      logAiUsage({ org_id: _orgId, user_id: authResult.user.id, function_name: "scan-docket", provider: "gemini", model: "gemini-2.0-flash", usage: aiResult.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, latency_ms: _aiLatency, has_image: true });
    }

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-docket error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
