import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
};

// BCC default thresholds (mirrored from mobile app)
const BCC_TEMP_DEFAULTS: Record<string, { pass: [number, number]; warn: [number, number] }> = {
  fridge:   { pass: [0, 5],     warn: [5.1, 8] },
  freezer:  { pass: [-50, -18], warn: [-17.9, -15] },
  hot_hold: { pass: [63, 100],  warn: [60, 62.9] },
};

function getAutoStatus(
  value: number,
  config: any
): "pass" | "warning" | "fail" {
  const hasCustom = config.custom_pass_min != null && config.custom_pass_max != null;
  const t = hasCustom
    ? {
        pass: [config.custom_pass_min, config.custom_pass_max] as [number, number],
        warn: [
          config.custom_warn_min ?? config.custom_pass_max,
          config.custom_warn_max ?? config.custom_pass_max + 3,
        ] as [number, number],
      }
    : BCC_TEMP_DEFAULTS[config.location_type] ?? BCC_TEMP_DEFAULTS.fridge;

  if (value >= t.pass[0] && value <= t.pass[1]) return "pass";
  if (value >= t.warn[0] && value <= t.warn[1]) return "warning";
  return "fail";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // API key auth — sensors send X-API-Key header
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing X-API-Key header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Look up org by API key (stored in org_settings or a dedicated table)
    const { data: orgSettings, error: orgError } = await supabase
      .from("org_settings")
      .select("org_id")
      .eq("webhook_api_key", apiKey)
      .single();

    if (orgError || !orgSettings) {
      return new Response(
        JSON.stringify({ error: "Invalid API key" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orgId = orgSettings.org_id;

    // Parse body
    const body = await req.json();
    const {
      equipment_id,   // config ID or location_name
      temperature,
      unit = "C",
      timestamp,
    } = body;

    if (temperature === undefined || temperature === null) {
      return new Response(
        JSON.stringify({ error: "Missing temperature field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!equipment_id) {
      return new Response(
        JSON.stringify({ error: "Missing equipment_id field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert to Celsius if needed
    let tempC = parseFloat(temperature);
    if (unit === "F") {
      tempC = (tempC - 32) * (5 / 9);
      tempC = Math.round(tempC * 10) / 10; // 1 decimal place
    }

    // Look up config by ID first, then by location_name
    let config: any = null;
    const { data: byId } = await supabase
      .from("temp_check_config")
      .select("*")
      .eq("org_id", orgId)
      .eq("id", equipment_id)
      .eq("is_active", true)
      .single();

    if (byId) {
      config = byId;
    } else {
      // Fallback: match by location_name
      const { data: byName } = await supabase
        .from("temp_check_config")
        .select("*")
        .eq("org_id", orgId)
        .eq("location_name", equipment_id)
        .eq("is_active", true)
        .limit(1);

      if (byName && byName.length > 0) {
        // Pick the one matching current shift
        const hour = timestamp
          ? new Date(timestamp).getHours()
          : new Date().getHours();
        const currentShift = hour < 12 ? "am" : "pm";
        config = byName.find((c: any) => c.shift === currentShift) || byName[0];
      }
    }

    if (!config) {
      return new Response(
        JSON.stringify({ error: "Equipment not found", equipment_id }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate status from thresholds
    const status = getAutoStatus(tempC, config);

    // Determine date/time
    const ts = timestamp ? new Date(timestamp) : new Date();
    const date = ts.toISOString().split("T")[0];
    const time = ts.toTimeString().split(" ")[0];
    const shift = ts.getHours() < 12 ? "am" : "pm";

    // Insert into food_safety_logs
    const log = {
      log_type: "temperature",
      location: config.location_name,
      readings: {
        value: tempC.toString(),
        unit: "C",
        config_id: config.id,
        source: "webhook",
      },
      status,
      shift,
      recorded_by: null,
      recorded_by_name: "IoT Sensor",
      date,
      time,
      org_id: orgId,
      notes: null,
    };

    const { error: insertError } = await supabase
      .from("food_safety_logs")
      .insert(log);

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to log reading", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        equipment: config.location_name,
        temperature: tempC,
        unit: "C",
        status,
        shift,
        date,
        time,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
