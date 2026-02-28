import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireAuth } from "../_shared/auth.ts";
import { aiChat } from "../_shared/ai.ts";
import { checkAiQuota, logAiUsage, getUserOrgId } from "../_shared/usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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

    const { image_base64, product_type } = await req.json();
    if (!image_base64) {
      return new Response(JSON.stringify({ error: "image_base64 is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const prompt = `You are a food quality inspector. Analyze this image of ${product_type || "food produce"}.

Assess the following:
1. Freshness Grade: A (excellent), B (acceptable), C (borderline), or Reject
2. Visual quality indicators (color, texture, firmness, any damage)
3. Any signs of spoilage, bruising, or contamination
4. Recommended action (accept, accept with conditions, reject)

Respond in JSON format:
{
  "grade": "A" | "B" | "C" | "reject",
  "confidence": 0.0-1.0,
  "color_assessment": "description",
  "texture_assessment": "description",
  "freshness_notes": "description",
  "reject_reason": null | "reason string",
  "recommendation": "accept" | "accept_conditional" | "reject"
}`;

    const _aiStart = Date.now();
    const aiResult = await aiChat({
      messages: [{
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image_base64}` } },
        ],
      }],
      response_format: { type: "json_object" },
    });
    const _aiLatency = Date.now() - _aiStart;
    if (_orgId) {
      logAiUsage({ org_id: _orgId, user_id: authResult.user.id, function_name: "check-produce-quality", provider: "gemini", model: "gemini-2.0-flash", usage: aiResult.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, latency_ms: _aiLatency, has_image: true });
    }

    const parsed = JSON.parse(aiResult.content || "{}");

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
