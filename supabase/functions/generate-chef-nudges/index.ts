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

    const { orgId, nudgeType, date } = await req.json();
    if (!orgId || !nudgeType) throw new Error("Missing orgId or nudgeType");

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceClient = createClient(supabaseUrl, serviceKey);

    const targetDate = date || new Date().toISOString().split("T")[0];

    // Get covers
    const { data: reservations } = await serviceClient
      .from("res_reservations")
      .select("party_size")
      .eq("org_id", orgId)
      .eq("date", targetDate)
      .in("status", ["CONFIRMED", "SEATED"]);

    const totalCovers = (reservations || []).reduce((s: number, r: any) => s + (r.party_size || 0), 0);

    // Get dish par predictions
    const { data: parData } = await serviceClient
      .from("dish_par_predictions")
      .select("menu_item_name, avg_qty_per_cover, confidence")
      .eq("org_id", orgId)
      .order("avg_qty_per_cover", { ascending: false })
      .limit(10);

    const topDishes = (parData || [])
      .map((p: any) => ({ name: p.menu_item_name, qty: Math.round(p.avg_qty_per_cover * totalCovers) }))
      .filter((d: any) => d.qty > 0)
      .slice(0, 5);

    const dishList = topDishes.map((d: any) => `${d.qty} ${d.name}`).join(", ");

    // Get low stock
    const { data: ingredients } = await serviceClient
      .from("ingredients")
      .select("name, current_stock, par_level")
      .eq("org_id", orgId)
      .not("current_stock", "is", null)
      .not("par_level", "is", null);

    const lowStock = (ingredients || [])
      .filter((i: any) => Number(i.current_stock) < Number(i.par_level))
      .map((i: any) => i.name);

    let title = "";
    let body = "";
    let severity: "info" | "warning" | "critical" = "info";

    if (nudgeType === "evening_prep") {
      title = `Tomorrow: ${totalCovers} covers`;
      body = totalCovers > 0
        ? `Prep needed: ${dishList || "check menu items"}. ${lowStock.length > 0 ? `Low stock: ${lowStock.slice(0, 3).join(", ")}` : "Stock levels OK."}`
        : "No reservations yet for tomorrow.";
      severity = totalCovers >= 30 ? "warning" : "info";
    } else if (nudgeType === "morning_prep") {
      // Check for overnight changes
      const { data: previousNudge } = await serviceClient
        .from("chef_nudges")
        .select("metadata")
        .eq("org_id", orgId)
        .eq("target_date", targetDate)
        .eq("nudge_type", "evening_prep")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const previousCovers = (previousNudge?.metadata as any)?.covers || 0;
      const delta = totalCovers - previousCovers;

      title = `Today: ${totalCovers} covers`;
      body = delta !== 0
        ? `Bookings ${delta > 0 ? "up" : "down"} ${Math.abs(delta)} since last night. Prep: ${dishList || "check menu items"}.`
        : `Prep: ${dishList || "check menu items"}. ${lowStock.length > 0 ? `Low stock: ${lowStock.slice(0, 3).join(", ")}` : "Stock OK."}`;
      severity = Math.abs(delta) >= 10 ? "warning" : "info";
    } else if (nudgeType === "booking_spike") {
      // Get previous count (stored in metadata of last spike check or from 2hrs ago)
      const { data: prevCheck } = await serviceClient
        .from("chef_nudges")
        .select("metadata")
        .eq("org_id", orgId)
        .eq("target_date", targetDate)
        .in("nudge_type", ["booking_spike", "morning_prep", "evening_prep"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const previousCovers = (prevCheck?.metadata as any)?.covers || 0;
      const delta = totalCovers - previousCovers;
      const pctIncrease = previousCovers > 0 ? (delta / previousCovers) * 100 : 0;

      if (delta <= 3 && pctIncrease < 20) {
        // No significant spike — don't create nudge
        return new Response(JSON.stringify({ nudge: null, message: "No significant booking change" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      title = `Booking spike! ${totalCovers} covers`;
      body = `Up ${delta} from ${previousCovers} (+${Math.round(pctIncrease)}%). Extra prep: ${dishList || "review kitchen prep"}.`;
      severity = delta >= 15 || pctIncrease >= 50 ? "critical" : "warning";
    }

    // Insert nudge
    const { data: nudge, error: nudgeErr } = await serviceClient
      .from("chef_nudges")
      .insert({
        org_id: orgId,
        nudge_type: nudgeType,
        title,
        body,
        severity,
        target_date: targetDate,
        service_period: "dinner",
        metadata: { covers: totalCovers, dish_list: topDishes, low_stock: lowStock },
        status: "pending",
      })
      .select("id, title, body, severity, nudge_type")
      .single();

    if (nudgeErr) throw nudgeErr;

    return new Response(JSON.stringify({ nudge }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-chef-nudges error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
