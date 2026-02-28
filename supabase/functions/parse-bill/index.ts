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

    const { billText, billImage } = await req.json();
    
    if (!billText && !billImage) {
      return new Response(
        JSON.stringify({ error: "Either bill text or bill image is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (billText && (typeof billText !== "string" || billText.trim().length < 10)) {
      return new Response(
        JSON.stringify({ error: "Bill text must be at least 10 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const _aiStart = Date.now();
    const result = await aiChat({
      messages: [
        {
          role: "system",
          content: `You are a bill/invoice parser for a hospitality business. Extract structured data from bill text or bill images.
Return a JSON object using the tool provided. Be precise with amounts. If any field is uncertain, set confidence to "low".
Categories: Rent, Utilities, Insurance, Merchant Fees, Marketing, Subscriptions, Equipment, Licenses, Professional Services, Depreciation, Other.
For anomaly detection: flag if amount seems unusually high or low for the category, if dates seem wrong, or if the bill text is ambiguous/garbled. If the image is blurry or hard to read, flag that as an anomaly.`,
        },
        {
          role: "user",
          content: billImage
            ? [
                { type: "text", text: "Extract the bill/invoice details from this image:" },
                { type: "image_url", image_url: { url: billImage } },
              ]
            : billText,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_bill",
            description: "Extract structured cost data from a bill or invoice",
            parameters: {
              type: "object",
              properties: {
                supplier_name: { type: "string", description: "Name of the supplier/provider" },
                category: {
                  type: "string",
                  enum: ["Rent", "Utilities", "Insurance", "Merchant Fees", "Marketing", "Subscriptions", "Equipment", "Licenses", "Professional Services", "Depreciation", "Other"],
                },
                amount: { type: "number", description: "Total amount due in AUD" },
                date: { type: "string", description: "Bill/invoice date in YYYY-MM-DD format" },
                due_date: { type: "string", description: "Payment due date in YYYY-MM-DD if found" },
                description: { type: "string", description: "Brief description of the charge" },
                confidence: {
                  type: "string",
                  enum: ["high", "medium", "low"],
                  description: "Confidence in the extraction accuracy",
                },
                anomalies: {
                  type: "array",
                  items: { type: "string" },
                  description: "List of potential anomalies or issues detected (e.g. 'Amount seems unusually high for utilities', 'Date appears to be in the future')",
                },
              },
              required: ["supplier_name", "category", "amount", "date", "description", "confidence", "anomalies"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "extract_bill" } },
    });

    const _aiLatency = Date.now() - _aiStart;

    if (_orgId) {
      logAiUsage({ org_id: _orgId, user_id: authResult.user.id, function_name: "parse-bill", provider: "gemini", model: "gemini-2.0-flash", usage: result.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, latency_ms: _aiLatency, has_image: true });
    }

    const toolCallArgs = result.tool_calls?.[0]?.function.arguments;
    if (!toolCallArgs) {
      return new Response(JSON.stringify({ error: "AI did not return structured data" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extracted = JSON.parse(toolCallArgs);

    return new Response(JSON.stringify({ success: true, data: extracted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-bill error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
