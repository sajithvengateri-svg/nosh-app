import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Data Export (Admin CRM only)
 *
 * Exports an organization's data as JSON for backup/compliance.
 * Requires service role — triggered from admin CRM.
 *
 * POST /data-export
 * Body: { orgId, tables?: string[] }
 */

const ORG_TABLES = [
  "organizations",
  "employee_profiles",
  "ingredients",
  "recipes",
  "todo_items",
  "daily_compliance_logs",
  "food_safety_logs",
  "stocktakes",
  "suppliers",
  "invoices",
  "menu_items",
  "roster_shifts",
  "game_profiles",
  "game_scores",
  "subscription_plans",
  "org_subscription_events",
] as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { orgId, tables } = await req.json();
    if (!orgId) {
      return new Response(
        JSON.stringify({ error: "Missing orgId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const db = createClient(supabaseUrl, serviceKey);

    // Determine which tables to export
    const tablesToExport = tables?.length
      ? tables.filter((t: string) => ORG_TABLES.includes(t as any))
      : [...ORG_TABLES];

    const result: Record<string, any[]> = {};

    for (const table of tablesToExport) {
      try {
        let query = db.from(table).select("*");

        // organizations table: filter by id
        if (table === "organizations") {
          query = query.eq("id", orgId);
        } else if (table === "subscription_plans") {
          // subscription_plans is global, export all
        } else {
          // Most tables have org_id
          query = query.eq("org_id", orgId);
        }

        const { data, error } = await query.limit(10000);
        if (error) {
          result[table] = [{ _error: error.message }];
        } else {
          result[table] = data ?? [];
        }
      } catch {
        result[table] = [{ _error: "Failed to query table" }];
      }
    }

    // Log the export event
    await db.from("org_subscription_events").insert({
      org_id: orgId,
      event_type: "data_export",
      metadata: {
        tables: tablesToExport,
        row_counts: Object.fromEntries(
          Object.entries(result).map(([k, v]) => [k, v.length]),
        ),
      },
      actor_id: user.id,
    } as any);

    const exportData = {
      exported_at: new Date().toISOString(),
      org_id: orgId,
      exported_by: user.id,
      tables: result,
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="queitos-export-${orgId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
