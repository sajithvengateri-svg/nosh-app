import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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

    const { messages, org_slug, current_step } = await req.json();

    // Load venue context
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const { data: widgetConfig } = await supabase
      .from("res_widget_config")
      .select("venue_name, faq_answers, org_id")
      .eq("org_slug", org_slug)
      .eq("is_active", true)
      .maybeSingle();

    let operatingHoursText = "";
    if (widgetConfig?.org_id) {
      const { data: settings } = await supabase
        .from("res_settings")
        .select("operating_hours")
        .eq("org_id", widgetConfig.org_id)
        .maybeSingle();
      if (settings?.operating_hours) {
        const hours = settings.operating_hours as Record<string, any>;
        operatingHoursText = Object.entries(hours)
          .map(([day, h]: [string, any]) => `${day}: ${h.open || "closed"} - ${h.close || "closed"}`)
          .join(", ");
      }
    }

    const faqText = widgetConfig?.faq_answers
      ? Object.entries(widgetConfig.faq_answers as Record<string, string>)
          .filter(([_, v]) => v)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\n")
      : "";

    const venueName = widgetConfig?.venue_name || "our restaurant";

    const systemPrompt = `You are a warm, professional AI concierge for ${venueName}. You help guests complete their reservation booking.

The guest is currently on the "${current_step}" step of the booking process.

Your personality:
- Warm and welcoming, like a real maître d'
- Concise — keep responses under 3 sentences unless asked for detail
- Gently nudge guests toward completing their booking
- If they seem unsure about a time, suggest quieter periods
- For special occasions, offer to note special arrangements

Operating hours: ${operatingHoursText || "Check with the venue directly."}

${faqText ? `FAQ answers:\n${faqText}` : ""}

If you don't know specific venue details, say "I'd recommend contacting us directly for that — would you like our number?" rather than guessing.

Never make up menu items, prices, or policies you don't have information about.`;

    const _aiStart = Date.now();
    const aiResult = await aiChat({
      messages: [
          { role: "system", content: systemPrompt },
          ...(messages || []),
        ],
    });
    const _aiLatency = Date.now() - _aiStart;

    if (_orgId) {
      logAiUsage({ org_id: _orgId, user_id: authResult.user.id, function_name: "widget-chat", provider: "gemini", model: "gemini-2.0-flash", usage: aiResult.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, latency_ms: _aiLatency, has_image: false });
    }

      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      throw new Error("AI gateway error");
    }

        const reply = aiResult.content || "I'm sorry, I couldn't process that.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("widget-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
