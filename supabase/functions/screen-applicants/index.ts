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

    const { position, applicants } = await req.json();

    const results = [];

    for (const applicant of applicants) {
      const prompt = `You are an HR screening assistant for the hospitality industry.

Position: ${position.title}
Section: ${position.section}
Classification: ${position.classification || "Not specified"}
Requirements: ${position.requirements || "Not specified"}
Description: ${position.description || "Not specified"}

Applicant: ${applicant.full_name}
Resume/Cover Letter: ${applicant.cover_letter || "No text provided"}

Score this applicant 0-100 on fit for this role and provide a brief summary.`;

    const _aiStart = Date.now();
    const aiResult = await aiChat({
      messages: [
            { role: "system", content: "You are an HR screening assistant. Return structured scoring." },
            { role: "user", content: prompt },
          ],
      tools: [{
            type: "function",
            function: {
              name: "score_applicant",
              description: "Score an applicant for a position",
              parameters: {
                type: "object",
                properties: {
                  overall_score: { type: "number", description: "0-100 fit score" },
                  summary: { type: "string", description: "2-3 sentence summary of strengths/gaps" },
                  experience: { type: "number", description: "0-100 experience score" },
                  skills_match: { type: "number", description: "0-100 skills match score" },
                  availability: { type: "number", description: "0-100 availability score" },
                  cultural_fit: { type: "number", description: "0-100 cultural fit score" },
                },
                required: ["overall_score", "summary", "experience", "skills_match", "availability", "cultural_fit"],
                additionalProperties: false,
              },
            },
          }],
      tool_choice: { type: "function", function: { name: "score_applicant" } },
    });

      const _aiLatency = Date.now() - _aiStart;
      if (_orgId) {
        logAiUsage({ org_id: _orgId, user_id: authResult.user.id, function_name: "screen-applicants", provider: "gemini", model: "gemini-2.0-flash", usage: aiResult.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, latency_ms: _aiLatency, has_image: false });
      }

      const toolCall = aiResult.tool_calls?.[0];
      if (toolCall) {
        const scoring = JSON.parse(toolCall.function.arguments);
        results.push({ applicant_id: applicant.id, ...scoring });
      } else {
        results.push({ applicant_id: applicant.id, error: "No structured response" });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("screen-applicants error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
