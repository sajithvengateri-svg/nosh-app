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

    const { orgId, date, servicePeriod = "dinner", triggerType = "manual" } = await req.json();
    if (!orgId) throw new Error("Missing orgId");

    const targetDate = date || new Date().toISOString().split("T")[0];
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceClient = createClient(supabaseUrl, serviceKey);

    // 1. Tonight's reservations
    const { data: reservations } = await serviceClient
      .from("res_reservations")
      .select("id, guest_name, party_size, time, status, dietary_notes, table_number")
      .eq("org_id", orgId)
      .eq("date", targetDate)
      .in("status", ["CONFIRMED", "SEATED"]);

    const totalCovers = (reservations || []).reduce((s: number, r: any) => s + (r.party_size || 0), 0);
    const dietaryCount = (reservations || []).filter((r: any) => r.dietary_notes?.trim()).length;

    // 2. Dish par predictions
    const { data: parPredictions } = await serviceClient
      .from("dish_par_predictions")
      .select("menu_item_name, avg_qty_per_cover, confidence")
      .eq("org_id", orgId)
      .order("avg_qty_per_cover", { ascending: false })
      .limit(15);

    const topDishes = (parPredictions || []).map((p: any) => ({
      name: p.menu_item_name,
      predicted: Math.round(p.avg_qty_per_cover * totalCovers),
    })).filter((d: any) => d.predicted > 0);

    // 3. Incomplete prep lists
    const { data: prepLists } = await serviceClient
      .from("prep_lists")
      .select("id, name, items, status")
      .eq("org_id", orgId)
      .eq("date", targetDate)
      .neq("status", "completed");

    let totalPrepItems = 0;
    let completedPrepItems = 0;
    for (const pl of prepLists || []) {
      const items = Array.isArray(pl.items) ? pl.items : [];
      totalPrepItems += items.length;
      completedPrepItems += items.filter((i: any) => i.completed).length;
    }

    // 4. Incomplete tasks
    const { data: tasks } = await serviceClient
      .from("kitchen_tasks")
      .select("id, title, priority, status")
      .eq("org_id", orgId)
      .neq("status", "completed")
      .limit(20);

    const urgentTasks = (tasks || []).filter((t: any) => t.priority === "high" || t.priority === "urgent");

    // 5. Low stock items
    const { data: ingredients } = await serviceClient
      .from("ingredients")
      .select("name, current_stock, par_level, unit")
      .eq("org_id", orgId)
      .not("current_stock", "is", null)
      .not("par_level", "is", null);

    const lowStock = (ingredients || []).filter((i: any) => Number(i.current_stock) < Number(i.par_level));

    // 6. Safety logs today
    const { data: safetyLogs } = await serviceClient
      .from("food_safety_logs")
      .select("id, status")
      .eq("org_id", orgId)
      .eq("date", targetDate);

    const criticalSafety = (safetyLogs || []).filter((l: any) => l.status === "critical").length;

    // Build context and call AI
    const contextData = {
      date: targetDate,
      service_period: servicePeriod,
      covers: totalCovers,
      reservations_count: (reservations || []).length,
      dietary_requirements: dietaryCount,
      top_predicted_dishes: topDishes.slice(0, 8),
      prep_progress: { total: totalPrepItems, completed: completedPrepItems, lists: (prepLists || []).length },
      pending_tasks: (tasks || []).length,
      urgent_tasks: urgentTasks.map((t: any) => t.title),
      low_stock: lowStock.map((i: any) => `${i.name} (${i.current_stock}/${i.par_level} ${i.unit})`),
      critical_safety_alerts: criticalSafety,
      safety_logs_today: (safetyLogs || []).length,
    };

    const systemPrompt = `You are a head chef AI assistant performing a pre-service kitchen audit. Generate a concise mobile-friendly report.`;

    const userPrompt = `Pre-service audit for ${targetDate} (${servicePeriod} service):

${JSON.stringify(contextData, null, 2)}

Return a JSON object with these fields:
- readiness_score: integer 0-100
- critical_issues: array of { title, description } — must-fix before service
- warnings: array of { title, description } — should address
- all_clear: array of strings — what's good
- recommended_actions: array of { title, description, category } — specific actions

Be concise. Each title should be under 60 chars.`;

    const _aiStart = Date.now();
    const aiResult = await aiChat({
      messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      tools: [{
          type: "function",
          function: {
            name: "audit_report",
            description: "Return the pre-service audit report",
            parameters: {
              type: "object",
              properties: {
                readiness_score: { type: "integer" },
                critical_issues: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" } }, required: ["title", "description"] } },
                warnings: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" } }, required: ["title", "description"] } },
                all_clear: { type: "array", items: { type: "string" } },
                recommended_actions: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, category: { type: "string" } }, required: ["title", "description"] } },
              },
              required: ["readiness_score", "critical_issues", "warnings", "all_clear", "recommended_actions"],
            },
          },
        }],
      tool_choice: { type: "function", function: { name: "audit_report" } },
    });

    const _aiLatency = Date.now() - _aiStart;

    if (_orgId) {
      logAiUsage({ org_id: _orgId, user_id: authResult.user.id, function_name: "chef-pre-service-audit", provider: "gemini", model: "gemini-2.0-flash", usage: aiResult.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, latency_ms: _aiLatency, has_image: false });
    }

    let report = { readiness_score: 0, critical_issues: [], warnings: [], all_clear: [], recommended_actions: [] };
    const toolCall = aiResult.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      report = JSON.parse(toolCall.function.arguments);
    }

    // Store report
    await serviceClient
      .from("chef_audit_reports")
      .upsert({
        org_id: orgId,
        audit_date: targetDate,
        service_period: servicePeriod,
        trigger_type: triggerType,
        readiness_score: report.readiness_score,
        critical_issues: report.critical_issues,
        warnings: report.warnings,
        all_clear: report.all_clear,
        recommended_actions: report.recommended_actions,
        raw_context: contextData,
      }, { onConflict: "org_id,audit_date,service_period,trigger_type" });

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chef-pre-service-audit error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
