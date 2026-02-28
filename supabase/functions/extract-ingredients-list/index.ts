import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth } from "../_shared/auth.ts";
import { aiChat } from "../_shared/ai.ts";
import { checkAiQuota, logAiUsage, getUserOrgId } from "../_shared/usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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

    const { file_base64, file_type, file_name } = await req.json();
    if (!file_base64) throw new Error("No file provided");

    const isImage = file_type?.startsWith("image/") || false;
    const isPDF = file_type === "application/pdf" || file_name?.toLowerCase().endsWith(".pdf");

    const systemPrompt = `You are a kitchen ingredient extraction assistant. Extract all ingredients from the provided file.
For each ingredient, return: name, category (one of: Proteins, Produce, Dairy, Dry Goods, Oils, Beverages, Prepared), unit (one of: kg, g, L, ml, lb, oz, each, bunch, case), and cost_per_unit (number, 0 if unknown).
Handle CSV, Excel data, handwritten lists, printed lists, and product images.
If you see a product (e.g. a can of beans, a tomato), identify the ingredient name.`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    if (isImage || isPDF) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: `Extract all ingredients from this ${isPDF ? "PDF" : "image"}. It could be a handwritten list, printed list, spreadsheet screenshot, product photo, or label.` },
          { type: "image_url", image_url: { url: `data:${file_type || "image/jpeg"};base64,${file_base64}` } },
        ],
      });
    } else {
      // CSV/text-based - decode and send as text
      const textContent = atob(file_base64);
      messages.push({
        role: "user",
        content: `Extract all ingredients from this file (${file_name}):\n\n${textContent.substring(0, 15000)}`,
      });
    }

    const _aiStart = Date.now();
    const result = await aiChat({
      messages: messages as any,
      tools: [
        {
          type: "function",
          function: {
            name: "extract_ingredients",
            description: "Return the list of extracted ingredients",
            parameters: {
              type: "object",
              properties: {
                ingredients: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      category: { type: "string", enum: ["Proteins", "Produce", "Dairy", "Dry Goods", "Oils", "Beverages", "Prepared"] },
                      unit: { type: "string", enum: ["kg", "g", "L", "ml", "lb", "oz", "each", "bunch", "case"] },
                      cost_per_unit: { type: "number" },
                    },
                    required: ["name", "category", "unit"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["ingredients"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "extract_ingredients" } },
    });

    const _aiLatency = Date.now() - _aiStart;

    let ingredients: any[] = [];

    const toolCallArgs = result.tool_calls?.[0]?.function.arguments;
    if (toolCallArgs) {
      try {
        const parsed = JSON.parse(toolCallArgs);
        ingredients = parsed.ingredients || [];
      } catch {
        console.error("Failed to parse tool call arguments");
      }
    }

    if (_orgId) {
      logAiUsage({ org_id: _orgId, user_id: authResult.user.id, function_name: "extract-ingredients-list", provider: "gemini", model: "gemini-2.0-flash", usage: result.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, latency_ms: _aiLatency, has_image: false });
    }

    return new Response(JSON.stringify({ ingredients }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("extract-ingredients-list error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
