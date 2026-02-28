import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { org_id, period_start, period_end, period_type = "daily" } = await req.json();
    if (!org_id || !period_start || !period_end) {
      return new Response(
        JSON.stringify({ error: "org_id, period_start, period_end required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for aggregation queries
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // --- DIRECT ROUTE: query internal tables ---

    // Revenue from pos_payments
    const { data: revenueRows } = await adminClient
      .from("pos_payments")
      .select("amount, is_refund, tip")
      .eq("org_id", org_id)
      .gte("created_at", period_start)
      .lte("created_at", period_end);

    let directRevenue = 0;
    if (revenueRows) {
      for (const r of revenueRows) {
        directRevenue += r.is_refund ? -r.amount : r.amount;
      }
    }

    // Labour from pos_shifts
    const { data: shiftRows } = await adminClient
      .from("pos_shifts")
      .select("hours")
      .eq("org_id", org_id)
      .gte("clock_in", period_start)
      .lte("clock_in", period_end);

    // Estimate: average hourly rate $30 AUD (can be refined later with employee rates)
    const AVG_HOURLY_RATE = 30;
    const SUPER_RATE = 0.115;
    let directLabourHours = 0;
    if (shiftRows) {
      for (const s of shiftRows) {
        directLabourHours += s.hours || 0;
      }
    }
    const labourWages = directLabourHours * AVG_HOURLY_RATE;
    const labourSuper = labourWages * SUPER_RATE;
    // Overtime: hours > 7.6 per shift day, simplified
    const labourOvertime = 0; // TODO: calculate per-shift overtime

    // Overheads from overhead_entries
    const { data: overheadRows } = await adminClient
      .from("overhead_entries")
      .select("amount, category:overhead_categories!inner(name)")
      .eq("org_id", org_id)
      .gte("date", period_start)
      .lte("date", period_end);

    let directOverhead = 0;
    let directOpsSupplies = 0;
    const OPS_SUPPLY_CATEGORIES = [
      "Cleaning Chemicals", "Cleaning Materials", "Packaging & Takeaway",
      "Office Supplies", "Hospitality Supplies", "Smallwares & Utensils",
      "Plates & Glassware", "Miscellaneous Supplies",
    ];
    if (overheadRows) {
      for (const o of overheadRows) {
        const catName = (o as any).category?.name || "";
        if (OPS_SUPPLY_CATEGORIES.includes(catName)) {
          directOpsSupplies += o.amount || 0;
        } else {
          directOverhead += o.amount || 0;
        }
      }
    }

    // Food waste from waste_logs (approved only)
    const { data: foodWasteRows } = await adminClient
      .from("waste_logs")
      .select("cost")
      .eq("org_id", org_id)
      .eq("module", "food")
      .eq("status", "approved")
      .gte("shift_date", period_start)
      .lte("shift_date", period_end);

    let directFoodWaste = 0;
    if (foodWasteRows) {
      for (const w of foodWasteRows) {
        directFoodWaste += w.cost || 0;
      }
    }

    // Bev waste from waste_logs (approved only)
    const { data: bevWasteRows } = await adminClient
      .from("waste_logs")
      .select("cost")
      .eq("org_id", org_id)
      .eq("module", "beverage")
      .eq("status", "approved")
      .gte("shift_date", period_start)
      .lte("shift_date", period_end);

    let directBevWaste = 0;
    if (bevWasteRows) {
      for (const w of bevWasteRows) {
        directBevWaste += w.cost || 0;
      }
    }

    // Bev COGS from pour events
    const { data: pourRows } = await adminClient
      .from("bev_pour_events")
      .select("cost_per_pour")
      .eq("org_id", org_id)
      .gte("shift_date", period_start)
      .lte("shift_date", period_end);

    let directBevCogs = 0;
    if (pourRows) {
      for (const p of pourRows) {
        directBevCogs += p.cost_per_pour || 0;
      }
    }

    // Covers from reservations
    const { data: resRows } = await adminClient
      .from("res_reservations")
      .select("party_size")
      .eq("org_id", org_id)
      .eq("status", "COMPLETED")
      .gte("date", period_start)
      .lte("date", period_end);

    let directCovers = 0;
    if (resRows) {
      for (const r of resRows) {
        directCovers += r.party_size || 0;
      }
    }

    // --- API/EMAIL ROUTE: query data_imports for anything not covered by direct ---

    const { data: importRows } = await adminClient
      .from("data_imports")
      .select("data_type, amount")
      .eq("org_id", org_id)
      .eq("status", "processed")
      .gte("period_start", period_start)
      .lte("period_end", period_end);

    const importSums: Record<string, number> = {};
    if (importRows) {
      for (const row of importRows) {
        importSums[row.data_type] = (importSums[row.data_type] || 0) + (row.amount || 0);
      }
    }

    // Merge: prefer direct data, fall back to imports
    const revenue = directRevenue || importSums["revenue"] || 0;
    const cogsBev = directBevCogs || importSums["bev_cost"] || 0;
    const cogsFood = importSums["food_cost"] || 0; // TODO: wire recipe_ingredients x pos_order_items
    const cogsWasteFood = directFoodWaste || importSums["food_waste"] || 0;
    const cogsWasteBev = directBevWaste || importSums["bev_waste"] || 0;
    const labourTotal = (labourWages + labourSuper + labourOvertime) || importSums["labour"] || 0;
    const overheadTotal = directOverhead || importSums["overhead"] || 0;
    const opsSuppliesTotal = directOpsSupplies || importSums["ops_supplies"] || 0;

    // Derived metrics
    const grossProfit = revenue - cogsFood - cogsBev - cogsWasteFood - cogsWasteBev;
    const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const primeCost = cogsFood + cogsBev + labourTotal + opsSuppliesTotal;
    const primeCostPct = revenue > 0 ? (primeCost / revenue) * 100 : 0;
    const netProfit = grossProfit - labourTotal - opsSuppliesTotal - overheadTotal;
    const netProfitPct = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    const labourPct = revenue > 0 ? (labourTotal / revenue) * 100 : 0;
    const overheadPct = revenue > 0 ? (overheadTotal / revenue) * 100 : 0;
    const opsSuppliesPct = revenue > 0 ? (opsSuppliesTotal / revenue) * 100 : 0;

    // Break-even: fixed costs / contribution margin ratio
    const fixedCosts = overheadTotal + labourTotal + opsSuppliesTotal;
    const contributionMarginRatio = revenue > 0 ? grossProfit / revenue : 0;
    const breakEvenRevenue = contributionMarginRatio > 0 ? fixedCosts / contributionMarginRatio : 0;

    // Data completeness
    const costCentres = [revenue, cogsFood, cogsBev, labourTotal, overheadTotal, opsSuppliesTotal];
    const filledCentres = costCentres.filter((v) => v > 0).length;
    const dataCompletenessPct = (filledCentres / costCentres.length) * 100;

    const snapshot = {
      org_id,
      period_start,
      period_end,
      period_type,
      revenue_total: Math.round(revenue * 100) / 100,
      cogs_food: Math.round(cogsFood * 100) / 100,
      cogs_bev: Math.round(cogsBev * 100) / 100,
      cogs_waste_food: Math.round(cogsWasteFood * 100) / 100,
      cogs_waste_bev: Math.round(cogsWasteBev * 100) / 100,
      gross_profit: Math.round(grossProfit * 100) / 100,
      gross_margin_pct: Math.round(grossMarginPct * 100) / 100,
      labour_wages: Math.round(labourWages * 100) / 100,
      labour_super: Math.round(labourSuper * 100) / 100,
      labour_overtime: Math.round(labourOvertime * 100) / 100,
      labour_total: Math.round(labourTotal * 100) / 100,
      labour_pct: Math.round(labourPct * 100) / 100,
      overhead_total: Math.round(overheadTotal * 100) / 100,
      overhead_pct: Math.round(overheadPct * 100) / 100,
      net_profit: Math.round(netProfit * 100) / 100,
      net_profit_pct: Math.round(netProfitPct * 100) / 100,
      prime_cost: Math.round(primeCost * 100) / 100,
      prime_cost_pct: Math.round(primeCostPct * 100) / 100,
      break_even_revenue: Math.round(breakEvenRevenue * 100) / 100,
      ops_supplies_cleaning: Math.round(opsSuppliesTotal * 100) / 100,
      ops_supplies_pct: Math.round(opsSuppliesPct * 100) / 100,
      data_completeness_pct: Math.round(dataCompletenessPct * 100) / 100,
      generated_at: new Date().toISOString(),
    };

    // Upsert into pnl_snapshots (unique on org_id + period_start + period_end + period_type)
    const { data: upserted, error: upsertError } = await adminClient
      .from("pnl_snapshots")
      .upsert(snapshot, {
        onConflict: "org_id,period_start,period_end,period_type",
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (upsertError) {
      // If unique constraint doesn't exist, try insert
      const { data: inserted, error: insertError } = await adminClient
        .from("pnl_snapshots")
        .insert(snapshot)
        .select()
        .single();

      if (insertError) {
        console.error("PnL snapshot insert error:", insertError);
        return new Response(JSON.stringify({ error: insertError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(inserted), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(upserted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-pnl-snapshot error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
