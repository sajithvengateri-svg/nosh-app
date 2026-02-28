import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth } from "../_shared/auth.ts";
import { aiChat } from "../_shared/ai.ts";
import { checkAiQuota, logAiUsage, getUserOrgId } from "../_shared/usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Ingredient {
  id: string;
  name: string;
  unit: string;
}

interface ExtractedItem {
  name: string;
  quantity: number;
  unit: string;
  price?: number;
  matched_ingredient_id?: string;
  matched_ingredient_name?: string;
  confidence: number;
}

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
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build ingredient list for context
    const ingredientNames = (existing_ingredients as Ingredient[])
      .map((i) => i.name)
      .join(", ");

    const systemPrompt = `You are an expert at extracting item data from supplier invoices for restaurant inventory management.

Extract all food items and ingredients from this invoice image. For each item, provide:
- name: The item name (normalized, e.g., "Fresh Salmon Fillet" not "SALMON FLT 1KG")
- quantity: The numerical quantity
- unit: The unit (kg, g, L, ml, each, case, etc.)
- price: The unit price if visible (optional)

Try to match each extracted item to one of these existing ingredients in our database:
${ingredientNames}

Return a JSON object with an "items" array. Each item should have:
{
  "name": "extracted item name",
  "quantity": number,
  "unit": "string",
  "price": number or null,
  "matched_ingredient_id": "id if matched" or null,
  "matched_ingredient_name": "name if matched" or null,
  "confidence": 0.0 to 1.0 (how confident you are in the extraction and match)
}`;

    const _aiStart = Date.now();
    const result = await aiChat({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract all items from this invoice. Here are the existing ingredients with their IDs for matching:\n${JSON.stringify(existing_ingredients)}`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${file_type || "image/jpeg"};base64,${image_base64}`,
              },
            },
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_invoice_items",
            description: "Extract items from an invoice image",
            parameters: {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      quantity: { type: "number" },
                      unit: { type: "string" },
                      price: { type: "number" },
                      matched_ingredient_id: { type: "string" },
                      matched_ingredient_name: { type: "string" },
                      confidence: { type: "number" },
                    },
                    required: ["name", "quantity", "unit", "confidence"],
                  },
                },
              },
              required: ["items"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "extract_invoice_items" } },
    });

    const _aiLatency = Date.now() - _aiStart;

    if (_orgId) {
      logAiUsage({ org_id: _orgId, user_id: authResult.user.id, function_name: "extract-invoice", provider: "gemini", model: "gemini-2.0-flash", usage: result.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, latency_ms: _aiLatency, has_image: true });
    }

    const toolCallArgs = result.tool_calls?.[0]?.function.arguments;
    if (!toolCallArgs) {
      throw new Error("No tool call response from AI");
    }

    const extractedData = JSON.parse(toolCallArgs);

    return new Response(JSON.stringify(extractedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Invoice extraction error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
