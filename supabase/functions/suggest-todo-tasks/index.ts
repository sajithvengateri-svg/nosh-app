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

    const { selected_date } = await req.json();

    // Get user's org
    const { data: membership } = await supabase
      .from("org_memberships")
      .select("org_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (!membership) throw new Error("No org membership");
    const orgId = membership.org_id;

    const _quota = await checkAiQuota(orgId);
    if (!_quota.allowed) {
      return new Response(JSON.stringify({ error: "ai_quota_exceeded", message: "Monthly AI limit reached. Resets on the 1st.", pct_used: _quota.pct_used }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get recent completed todos for context
    const { data: recentTodos } = await supabase
      .from("todo_items")
      .select("title, category, priority")
      .eq("org_id", orgId)
      .eq("status", "done")
      .order("completed_at", { ascending: false })
      .limit(20);

    // Get low stock items
    const { data: lowStock } = await supabase
      .from("ingredients")
      .select("name, current_stock, par_level, unit")
      .eq("org_id", orgId)
      .not("current_stock", "is", null)
      .not("par_level", "is", null);

    const lowStockItems = (lowStock || []).filter(
      (i: any) => Number(i.current_stock) < Number(i.par_level)
    );

    const systemPrompt = `You are a kitchen task advisor. Based on recent completed tasks and stock levels, suggest 3-5 actionable tasks for today. Be specific and practical.`;

    const userPrompt = `Date: ${selected_date}
Recent completed tasks: ${JSON.stringify((recentTodos || []).map(t => t.title))}
Low stock items: ${JSON.stringify(lowStockItems.map((i: any) => `${i.name} (${i.current_stock}/${i.par_level} ${i.unit})`))}

Suggest 3-5 tasks for today.`;

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
              name: "suggest_tasks",
              description: "Return 3-5 actionable task suggestions.",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        priority: { type: "string", enum: ["low", "medium", "high"] },
                        category: { type: "string" },
                      },
                      required: ["title", "priority", "category"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["suggestions"],
                additionalProperties: false,
              },
            },
          },
        ],
      tool_choice: { type: "function", function: { name: "suggest_tasks" } },
    });
    const _aiLatency = Date.now() - _aiStart;

    logAiUsage({ org_id: orgId, user_id: user.id, function_name: "suggest-todo-tasks", provider: "gemini", model: "gemini-2.0-flash", usage: aiResult.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, latency_ms: _aiLatency, has_image: false });

    let suggestions = [];
    const toolCall = aiResult.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      suggestions = parsed.suggestions || [];
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-todo-tasks error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
