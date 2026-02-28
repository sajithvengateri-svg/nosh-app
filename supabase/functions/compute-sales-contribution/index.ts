import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");

    const { orgId, period = "90d" } = await req.json();
    if (!orgId) throw new Error("Missing orgId");

    // Calculate date range
    const daysMap: Record<string, number> = { "30d": 30, "90d": 90, "365d": 365 };
    const days = daysMap[period] || 90;
    const startDate = new Date(Date.now() - days * 86400000).toISOString();

    // Use service role for cross-table queries
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceClient = createClient(supabaseUrl, serviceKey);

    // Fetch completed/paid order items
    const { data: orders, error: ordersErr } = await serviceClient
      .from("pos_orders")
      .select("id")
      .eq("org_id", orgId)
      .in("status", ["COMPLETED", "PAID"])
      .gte("created_at", startDate);

    if (ordersErr) throw ordersErr;
    const orderIds = (orders || []).map((o: any) => o.id);

    if (orderIds.length === 0) {
      return new Response(JSON.stringify({ message: "No orders found", items: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch order items for those orders
    const { data: items, error: itemsErr } = await serviceClient
      .from("pos_order_items")
      .select("item_name, quantity, unit_price")
      .in("order_id", orderIds);

    if (itemsErr) throw itemsErr;

    // Aggregate revenue per item
    const itemRevenue: Record<string, { revenue: number; qty: number }> = {};
    let totalRevenue = 0;

    for (const item of items || []) {
      const name = (item.item_name || "").trim();
      if (!name) continue;
      const revenue = (item.quantity || 1) * (item.unit_price || 0);
      if (!itemRevenue[name]) itemRevenue[name] = { revenue: 0, qty: 0 };
      itemRevenue[name].revenue += revenue;
      itemRevenue[name].qty += item.quantity || 1;
      totalRevenue += revenue;
    }

    // Calculate contribution % and update menu_items
    const results: any[] = [];
    for (const [name, data] of Object.entries(itemRevenue)) {
      const pct = totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0;
      results.push({ name, revenue: data.revenue, quantity: data.qty, contribution_pct: Math.round(pct * 100) / 100 });

      // Update matching menu_items (skip forced ones)
      await serviceClient
        .from("menu_items")
        .update({ sales_contribution_pct: Math.round(pct * 100) / 100, popularity: data.qty })
        .eq("org_id", orgId)
        .ilike("name", name)
        .neq("sales_contribution_forced", true);
    }

    results.sort((a, b) => b.contribution_pct - a.contribution_pct);

    return new Response(JSON.stringify({ items: results, total_revenue: totalRevenue, period, order_count: orderIds.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("compute-sales-contribution error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
