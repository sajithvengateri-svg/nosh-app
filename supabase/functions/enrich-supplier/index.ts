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

    const { supplier_name, location } = await req.json();
    if (!supplier_name) {
      return new Response(JSON.stringify({ error: "supplier_name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const prompt = `You are a food service industry expert in Australia. Find information about the food supplier "${supplier_name}"${location ? ` located near ${location}` : ""}.

Return the following information in JSON format. If you cannot find specific information, use null for that field:
{
  "website": "https://...",
  "ordering_url": "https://... (their online ordering platform URL)",
  "social_links": {
    "instagram": "URL or null",
    "facebook": "URL or null",
    "linkedin": "URL or null"
  },
  "phone": "phone number or null",
  "email": "contact email or null",
  "abn": "Australian Business Number or null",
  "delivery_days": ["Mon", "Wed", "Fri"],
  "minimum_order": 150,
  "payment_terms": "30 days net",
  "description": "Brief description of the supplier"
}`;

    const _aiStart = Date.now();
    const aiResult = await aiChat({
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });
    const _aiLatency = Date.now() - _aiStart;
    if (_orgId) {
      logAiUsage({ org_id: _orgId, user_id: authResult.user.id, function_name: "enrich-supplier", provider: "gemini", model: "gemini-2.0-flash", usage: aiResult.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, latency_ms: _aiLatency, has_image: false });
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
