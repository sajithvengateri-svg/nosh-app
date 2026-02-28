import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuth } from "../_shared/auth.ts";
import { aiChat } from "../_shared/ai.ts";
import { checkAiQuota, logAiUsage, getUserOrgId } from "../_shared/usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RSA_SYSTEM = `You are an expert RSA (Responsible Service of Alcohol) training assistant for Australian hospitality venues. 
You help staff learn about:
- Signs of intoxication and how to identify them
- Refusal techniques (CARE method)
- ID verification procedures
- Legal obligations and penalties under Australian liquor licensing laws
- Incident reporting requirements
- Duty of care responsibilities
Keep answers concise, practical, and focused on Australian regulations. Use scenario-based examples when helpful.`;

const FOOD_SAFETY_SYSTEM = `You are an expert Food Safety training assistant for Australian hospitality venues.
You help staff learn about:
- Temperature danger zone (5°C-60°C) and the 2-hour/4-hour rule
- Cross-contamination prevention
- Allergen management (Australia's 10 major allergens)
- Personal hygiene standards
- HACCP principles and food safety plans
- Cleaning and sanitising procedures
Keep answers concise, practical, and focused on Australian food safety standards.`;

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

    const { messages, training_type, material_id } = await req.json();

    // Build context-aware system prompt
    let systemPrompt = training_type === "rsa" ? RSA_SYSTEM : FOOD_SAFETY_SYSTEM;

    // If material_id provided, inject that module's card content as context
    // If no material_id, inject all org training content for general Q&A
    if (_orgId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const adminClient = createClient(supabaseUrl, serviceKey);

      let trainingContext = "";
      if (material_id) {
        const { data } = await adminClient
          .from("training_materials")
          .select("title, cards, content")
          .eq("id", material_id)
          .single();
        if (data?.cards) {
          const cards = Array.isArray(data.cards) ? data.cards : [];
          trainingContext = cards.map((c: any) => `${c.title}: ${c.content}`).join("\n");
          systemPrompt += `\n\nYou also have access to this specific training module "${data.title}":\n${trainingContext.slice(0, 4000)}`;
        }
      } else {
        const { data } = await adminClient
          .from("training_materials")
          .select("title, cards, content")
          .eq("org_id", _orgId)
          .eq("processing_status", "ready")
          .limit(10);
        if (data?.length) {
          trainingContext = data.map((m: any) => {
            const cards = Array.isArray(m.cards) ? m.cards : [];
            return `## ${m.title}\n${cards.map((c: any) => `${c.title}: ${c.content}`).join("\n")}`;
          }).join("\n\n").slice(0, 6000);
          systemPrompt += `\n\nYou have access to the venue's training content:\n${trainingContext}`;
        }
      }
    }

    const _aiStart = Date.now();
    const aiResult = await aiChat({
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    });
    const _aiLatency = Date.now() - _aiStart;

    if (_orgId) {
      logAiUsage({ org_id: _orgId, user_id: authResult.user.id, function_name: "training-ai-chat", provider: "gemini", model: "gemini-2.0-flash", usage: aiResult.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, latency_ms: _aiLatency, has_image: false });
    }

    const reply = aiResult.content || "Sorry, I couldn't generate a response.";

    return new Response(JSON.stringify({ reply }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("training-ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
