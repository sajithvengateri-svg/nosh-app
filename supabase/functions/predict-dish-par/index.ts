import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

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

    const { orgId, date, coverCount } = await req.json();
    if (!orgId) throw new Error("Missing orgId");

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceClient = createClient(supabaseUrl, serviceKey);

    const targetDate = date || new Date().toISOString().split("T")[0];
    const targetDow = DAY_NAMES[new Date(targetDate).getDay()];

    // Get tonight's covers if not provided
    let covers = coverCount;
    if (!covers) {
      const { data: res } = await serviceClient
        .from("res_reservations")
        .select("party_size")
        .eq("org_id", orgId)
        .eq("date", targetDate)
        .in("status", ["CONFIRMED", "SEATED"]);
      covers = (res || []).reduce((s: number, r: any) => s + (r.party_size || 0), 0);
    }

    if (!covers || covers === 0) {
      return new Response(JSON.stringify({ predictions: [], covers: 0, message: "No covers for this date" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // First check historical_sales_daily (uploaded CSV data)
    const lookbackStart = new Date(Date.now() - 365 * 86400000).toISOString().split("T")[0];
    const { data: historicalSales } = await serviceClient
      .from("historical_sales_daily")
      .select("sale_date, item_name, quantity_sold, covers")
      .eq("org_id", orgId)
      .gte("sale_date", lookbackStart);

    // Also get POS data for the same period
    const { data: posOrders } = await serviceClient
      .from("pos_orders")
      .select("id, created_at")
      .eq("org_id", orgId)
      .in("status", ["COMPLETED", "PAID"])
      .gte("created_at", lookbackStart + "T00:00:00");

    const orderIds = (posOrders || []).map((o: any) => o.id);
    const orderDates: Record<string, string> = {};
    for (const o of posOrders || []) {
      orderDates[o.id] = o.created_at.split("T")[0];
    }

    let posItems: any[] = [];
    if (orderIds.length > 0) {
      const { data } = await serviceClient
        .from("pos_order_items")
        .select("order_id, item_name, quantity")
        .in("order_id", orderIds);
      posItems = data || [];
    }

    // Get daily covers from reservations
    const { data: dailyRes } = await serviceClient
      .from("res_reservations")
      .select("date, party_size")
      .eq("org_id", orgId)
      .gte("date", lookbackStart)
      .in("status", ["CONFIRMED", "SEATED", "COMPLETED"]);

    const dailyCovers: Record<string, number> = {};
    for (const r of dailyRes || []) {
      if (!dailyCovers[r.date]) dailyCovers[r.date] = 0;
      dailyCovers[r.date] += r.party_size || 0;
    }

    // Aggregate: item → { totalQty, totalCovers, dayQty: { dow: { totalQty, count } } }
    const itemStats: Record<string, { totalQty: number; totalCovers: number; dayData: Record<string, { qty: number; count: number }> }> = {};

    // From POS data
    for (const item of posItems) {
      const name = (item.item_name || "").trim();
      if (!name) continue;
      const orderDate = orderDates[item.order_id];
      if (!orderDate) continue;
      const dayCov = dailyCovers[orderDate] || 0;
      if (dayCov === 0) continue; // skip days without cover data

      if (!itemStats[name]) itemStats[name] = { totalQty: 0, totalCovers: 0, dayData: {} };
      itemStats[name].totalQty += item.quantity || 1;
      itemStats[name].totalCovers += dayCov;

      const dow = DAY_NAMES[new Date(orderDate).getDay()];
      if (!itemStats[name].dayData[dow]) itemStats[name].dayData[dow] = { qty: 0, count: 0 };
      itemStats[name].dayData[dow].qty += item.quantity || 1;
      itemStats[name].dayData[dow].count += 1;
    }

    // From historical CSV data
    for (const row of historicalSales || []) {
      const name = (row.item_name || "").trim();
      if (!name) continue;
      const dayCov = row.covers || dailyCovers[row.sale_date] || 0;
      if (dayCov === 0) continue;

      if (!itemStats[name]) itemStats[name] = { totalQty: 0, totalCovers: 0, dayData: {} };
      itemStats[name].totalQty += row.quantity_sold || 0;
      itemStats[name].totalCovers += dayCov;

      const dow = DAY_NAMES[new Date(row.sale_date).getDay()];
      if (!itemStats[name].dayData[dow]) itemStats[name].dayData[dow] = { qty: 0, count: 0 };
      itemStats[name].dayData[dow].qty += row.quantity_sold || 0;
      itemStats[name].dayData[dow].count += 1;
    }

    // Calculate predictions
    const predictions: any[] = [];
    for (const [name, stats] of Object.entries(itemStats)) {
      if (stats.totalCovers === 0) continue;
      const avgPerCover = stats.totalQty / stats.totalCovers;

      // Day-of-week adjustment
      let dowWeight = 1.0;
      const dowData = stats.dayData[targetDow];
      if (dowData && dowData.count >= 3) {
        const dowAvg = dowData.qty / dowData.count;
        const overallAvg = stats.totalQty / Object.values(stats.dayData).reduce((s, d) => s + d.count, 0);
        if (overallAvg > 0) dowWeight = dowAvg / overallAvg;
      }

      const predicted = Math.round(avgPerCover * covers * dowWeight);
      if (predicted <= 0) continue;

      // Confidence based on data points
      const dataPoints = Object.values(stats.dayData).reduce((s, d) => s + d.count, 0);
      const confidence = dataPoints >= 90 ? "high" : dataPoints >= 30 ? "medium" : "low";

      predictions.push({
        item_name: name,
        predicted_qty: predicted,
        avg_per_cover: Math.round(avgPerCover * 1000) / 1000,
        dow_weight: Math.round(dowWeight * 100) / 100,
        confidence,
        data_points: dataPoints,
      });

      // Upsert to dish_par_predictions
      await serviceClient
        .from("dish_par_predictions")
        .upsert({
          org_id: orgId,
          menu_item_name: name,
          avg_qty_per_cover: avgPerCover,
          total_historical_qty: stats.totalQty,
          total_historical_covers: stats.totalCovers,
          confidence,
          day_of_week_weights: Object.fromEntries(
            Object.entries(stats.dayData).map(([d, v]) => [d, v.count > 0 ? v.qty / v.count : 0])
          ),
          last_trained_at: new Date().toISOString(),
        }, { onConflict: "org_id,menu_item_name" });
    }

    predictions.sort((a, b) => b.predicted_qty - a.predicted_qty);

    return new Response(JSON.stringify({ predictions, covers, date: targetDate, day: targetDow }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("predict-dish-par error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
