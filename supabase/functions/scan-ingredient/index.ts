import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth } from "../_shared/auth.ts";
import { aiChat } from "../_shared/ai.ts";
import { checkAiQuota, logAiUsage, getUserOrgId } from "../_shared/usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRODUCE_PROMPT = `You are an expert chef and ingredient identifier. Analyze this image and identify the food ingredient shown. Extract:
{
  "name": "Ingredient name (e.g. 'Fresh Salmon Fillet', 'Roma Tomatoes', 'Arborio Rice')",
  "category": "One of: Proteins, Produce, Dairy, Dry Goods, Oils, Beverages, Prepared",
  "suggested_unit": "Most appropriate unit: kg, g, L, ml, lb, oz, each, bunch, case",
  "estimated_cost_per_unit": "Estimated cost per unit as a number (AUD), or null if unknown",
  "allergens": ["Array of common allergens: e.g. 'Fish', 'Gluten', 'Dairy', 'Nuts', 'Shellfish', 'Soy', 'Eggs'"],
  "notes": "Any additional info: brand, variety, origin, storage notes"
}

Be specific with the name. Map category to the closest match from the list. Return null for fields you cannot determine.`;

const BARCODE_PROMPT = `You are an expert at reading barcodes and product labels. Analyze this image and extract:
{
  "name": "Product name if visible",
  "category": "One of: Proteins, Produce, Dairy, Dry Goods, Oils, Beverages, Prepared",
  "suggested_unit": "Most appropriate unit: kg, g, L, ml, lb, oz, each, bunch, case",
  "estimated_cost_per_unit": "Price if visible as a number, or null",
  "allergens": ["Allergens from label if visible"],
  "barcode_value": "The barcode/QR code number if readable",
  "notes": "Any other relevant info from the label: brand, weight, volume, ingredients list"
}

Focus on accuracy. Return null for fields you cannot determine.`;

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

    const { imageBase64, scanMode } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const systemPrompt = scanMode === "barcode" ? BARCODE_PROMPT : PRODUCE_PROMPT;

    const _aiStart = Date.now();
    const aiResult = await aiChat({
      messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Please analyze this image and identify the ingredient." },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
      response_format: { type: "json_object" },
    });
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const _aiLatency = Date.now() - _aiStart;

        const content = aiResult.content;

    if (!content) {
      throw new Error("No response content from AI");
    }

    const extractedData = JSON.parse(content);

    if (_orgId) {
      logAiUsage({ org_id: _orgId, user_id: authResult.user.id, function_name: "scan-ingredient", provider: "gemini", model: "gemini-2.0-flash", usage: aiResult.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, latency_ms: _aiLatency, has_image: true });
    }

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("scan-ingredient error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
