import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth } from "../_shared/auth.ts";
import { aiChat } from "../_shared/ai.ts";
import { checkAiQuota, logAiUsage, getUserOrgId } from "../_shared/usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    const { referenceImageUrl, verificationImageUrl, areaName } = await req.json();
    if (!referenceImageUrl || !verificationImageUrl) {
      return new Response(
        JSON.stringify({ error: "Both reference and verification images are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const _aiStart = Date.now();
    const aiResult = await aiChat({
      messages: [
          {
            role: "system",
            content: `You are a food safety inspector AI that verifies cleaning compliance. 
Compare the reference image (showing the expected clean state) with the verification image (showing current state).
Determine if the area meets cleanliness standards.
Be strict but fair - look for:
- Visible debris, spills, or stains
- Proper organization
- Hygiene hazards
- Overall cleanliness matching reference

Respond ONLY with valid JSON in this exact format:
{
  "approved": true/false,
  "confidence": 0-100,
  "notes": "Brief explanation of decision"
}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Compare these two images of "${areaName || 'cleaning area'}". The first is the REFERENCE (expected clean state), the second is the VERIFICATION (current state to check). Determine if the current state meets the cleanliness standard shown in the reference.`
              },
              {
                type: "image_url",
                image_url: { url: referenceImageUrl }
              },
              {
                type: "image_url",
                image_url: { url: verificationImageUrl }
              }
            ]
          }
        ],
    });

    const _aiLatency = Date.now() - _aiStart;
    if (_orgId) {
      logAiUsage({ org_id: _orgId, user_id: authResult.user.id, function_name: "verify-cleaning", provider: "gemini", model: "gemini-2.0-flash", usage: aiResult.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, latency_ms: _aiLatency, has_image: true });
    }

    const content = aiResult.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response
    let result;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Default to manual review needed
      result = {
        approved: false,
        confidence: 0,
        notes: "AI could not determine verification status. Manual review required."
      };
    }

    return new Response(
      JSON.stringify({
        status: result.approved ? "approved" : "rejected",
        confidence: result.confidence,
        notes: result.notes
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Verification error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Verification failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
