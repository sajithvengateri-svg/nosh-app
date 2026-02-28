import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { aiChat } from "../_shared/ai.ts";
import { checkAiQuota, logAiUsage, getUserOrgId } from "../_shared/usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");

    // Verify admin
    const { data: adminCheck } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminCheck) throw new Error("Admin only");

    const _orgId = await getUserOrgId(user.id);
    if (_orgId) {
      const _quota = await checkAiQuota(_orgId);
      if (!_quota.allowed) {
        return new Response(JSON.stringify({ error: "ai_quota_exceeded", message: "Monthly AI limit reached. Resets on the 1st.", pct_used: _quota.pct_used }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const { category = "mixed", batch_size = 30, start_day = 1 } = await req.json();

    const systemPrompt = `You are creating daily motivational messages for chefs and kitchen staff. Generate exactly ${batch_size} unique, short (1-2 sentences) daily thoughts. Mix categories: motivational, funny, technique tips, and wisdom. Make them chef/kitchen themed. Be creative and varied.`;

    const userPrompt = `Generate ${batch_size} daily thoughts for days ${start_day} to ${start_day + batch_size - 1}. Each should be unique and inspiring for kitchen professionals.`;

    const _aiStart = Date.now();
    const aiResult = await aiChat({
      messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      tools: [
          {
            type: "function",
            function: {
              name: "save_thoughts",
              description: "Save generated daily thoughts",
              parameters: {
                type: "object",
                properties: {
                  thoughts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        day_number: { type: "number" },
                        message: { type: "string" },
                        author: { type: "string" },
                        category: { type: "string", enum: ["motivational", "funny", "technique", "wisdom"] },
                      },
                      required: ["day_number", "message", "category"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["thoughts"],
                additionalProperties: false,
              },
            },
          },
        ],
      tool_choice: { type: "function", function: { name: "save_thoughts" } },
    });
    const _aiLatency = Date.now() - _aiStart;

    if (_orgId) {
      logAiUsage({ org_id: _orgId, user_id: user.id, function_name: "generate-daily-thoughts", provider: "gemini", model: "gemini-2.0-flash", usage: aiResult.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, latency_ms: _aiLatency, has_image: false });
    }

      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let thoughts: any[] = [];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      thoughts = parsed.thoughts || [];
    }

    // Use service role to insert
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let inserted = 0;
    for (const t of thoughts) {
      const { error } = await serviceClient
        .from("daily_thoughts")
        .upsert({
          day_number: t.day_number,
          message: t.message,
          author: t.author || null,
          category: t.category,
        }, { onConflict: "day_number" });

      if (!error) inserted++;
    }

    return new Response(JSON.stringify({ inserted, total_generated: thoughts.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-daily-thoughts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
