import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth } from "../_shared/auth.ts";
import { aiChat } from "../_shared/ai.ts";
import { checkAiQuota, logAiUsage, getUserOrgId } from "../_shared/usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the Help Assistant for Queitos — a kitchen management and cooking app.

Your primary job is to help users understand and use the app. You also have general knowledge about cooking, food safety temperatures, and kitchen best practices.

Rules:
- Use the HELP CONTEXT below to give accurate, step-by-step answers about app features.
- If the help context does not cover their question, say so honestly and offer to help with what you do know.
- For cooking questions (temperatures, substitutions, techniques), answer directly from your knowledge.
- Be concise — under 150 words unless the user asks for detail.
- Use bullet points and numbered steps for clarity.
- Never fabricate app features that are not in the help context.
- You can see images the user sends — describe what you see and help accordingly.
- If someone shows you a food item, you can advise on storage, cooking temperatures, preparation tips, and safety.

HELP CONTEXT:
{HELP_CONTEXT}`;

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

    const { messages, helpContext } = await req.json();

    const systemContent = SYSTEM_PROMPT.replace(
      "{HELP_CONTEXT}",
      helpContext || "No specific articles matched. Answer from general knowledge."
    );

    const _aiStart = Date.now();
    const result = await aiChat({
      messages: [{ role: "system", content: systemContent }, ...messages],
      model: "google/gemini-3-flash-preview",
      temperature: 0.5,
    });
    const _aiLatency = Date.now() - _aiStart;

    if (_orgId) {
      logAiUsage({ org_id: _orgId, user_id: authResult.user.id, function_name: "help-chat", provider: "gemini", model: "google/gemini-3-flash-preview", usage: result.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, latency_ms: _aiLatency, has_image: false });
    }

    const content = result.content || "I couldn't generate a response.";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("help-chat error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
