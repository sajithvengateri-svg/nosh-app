import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const today = new Date();
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay(); // 1=Mon..7=Sun
    const dayOfMonth = today.getDate();
    const todayStr = today.toISOString().split("T")[0];

    // Get all active rules
    const { data: rules, error } = await supabase
      .from("todo_recurring_rules")
      .select("*")
      .eq("is_active", true);

    if (error) throw error;

    let created = 0;

    for (const rule of rules || []) {
      // Check if this rule should fire today
      let shouldFire = false;
      if (rule.recurrence_type === "daily") {
        shouldFire = true;
      } else if (rule.recurrence_type === "weekly" && rule.recurrence_days?.length) {
        shouldFire = rule.recurrence_days.includes(dayOfWeek);
      } else if (rule.recurrence_type === "monthly" && rule.recurrence_day_of_month) {
        shouldFire = rule.recurrence_day_of_month === dayOfMonth;
      }

      if (!shouldFire) continue;

      // Check for duplicates
      const { data: existing } = await supabase
        .from("todo_items")
        .select("id")
        .eq("org_id", rule.org_id)
        .eq("title", rule.title)
        .eq("due_date", todayStr)
        .limit(1);

      if (existing && existing.length > 0) continue;

      // Insert todo
      const { error: insertError } = await supabase
        .from("todo_items")
        .insert({
          org_id: rule.org_id,
          title: rule.title,
          description: rule.description,
          category: rule.category,
          priority: rule.priority,
          quantity: rule.quantity,
          unit: rule.unit,
          due_date: todayStr,
          source_type: "recurring",
          created_by: rule.created_by,
          assigned_to_name: rule.auto_assign_name,
        });

      if (insertError) {
        console.error(`Failed to create todo for rule ${rule.id}:`, insertError);
        continue;
      }

      // Auto-delegate if configured
      if (rule.auto_delegate && rule.auto_assign_to) {
        await supabase.from("delegated_tasks").insert({
          org_id: rule.org_id,
          title: rule.title,
          description: rule.description,
          category: rule.category,
          priority: rule.priority,
          due_date: todayStr,
          assigned_to: rule.auto_assign_to,
          assigned_to_name: rule.auto_assign_name,
          assigned_by: rule.created_by,
          status: "pending",
        });
      }

      created++;
    }

    return new Response(JSON.stringify({ created, total_rules: rules?.length || 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-recurring-todos error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
