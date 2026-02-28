import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// QLD postcode → nearest BOM radar station ID
const RADAR_MAP: [number, number, string][] = [
  [4000, 4299, "663"], // Brisbane / SE QLD / Gold Coast
  [4300, 4399, "663"], // Toowoomba / Darling Downs
  [4400, 4499, "663"], // Southern Downs fallback
  [4500, 4599, "663"], // Moreton Bay / Sunshine Coast
  [4600, 4669, "663"], // Wide Bay fallback
  [4670, 4699, "243"], // Bundaberg
  [4700, 4799, "223"], // Mackay
  [4800, 4809, "733"], // Bowen area
  [4810, 4869, "733"], // Townsville
  [4870, 4899, "193"], // Cairns
  [4900, 4999, "193"], // Far North QLD
];

function getRadarStation(postcode: string): string {
  const pc = parseInt(postcode, 10);
  for (const [lo, hi, id] of RADAR_MAP) {
    if (pc >= lo && pc <= hi) return id;
  }
  return "663"; // default Brisbane
}

// Map BOM icon_descriptor to simplified icon key
function mapIcon(descriptor: string | null): string {
  if (!descriptor) return "cloudy";
  const d = descriptor.toLowerCase();
  if (d.includes("storm") || d.includes("thunder")) return "storm";
  if (d.includes("rain") || d.includes("heavy")) return "rain";
  if (d.includes("shower") || d.includes("drizzle")) return "showers";
  if (d.includes("wind")) return "windy";
  if (d.includes("partly") || d.includes("mostly_sunny")) return "partly_cloudy";
  if (d.includes("sunny") || d.includes("clear") || d.includes("fine")) return "sunny";
  if (d.includes("cloud") || d.includes("overcast")) return "cloudy";
  return "cloudy";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

    // Auth check
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;


  try {
    const { postcode } = await req.json();
    if (!postcode) {
      return new Response(JSON.stringify({ error: "postcode required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bomHeaders = {
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; WeatherProxy/1.0)",
    };

    // 1. Location search
    const locRes = await fetch(
      `https://api.weather.bom.gov.au/v1/locations?search=${encodeURIComponent(postcode)}`,
      { headers: bomHeaders }
    );
    const locData = await locRes.json();
    const location = locData?.data?.[0];
    if (!location) {
      return new Response(
        JSON.stringify({ error: "Location not found for postcode" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geohash = location.geohash;
    const locationName = location.name || postcode;

    // 2. Daily forecast
    const fcRes = await fetch(
      `https://api.weather.bom.gov.au/v1/locations/${geohash}/forecasts/daily`,
      { headers: bomHeaders }
    );
    const fcData = await fcRes.json();
    const rawDays = fcData?.data || [];

    const days = rawDays.map((d: any) => ({
      date: d.date?.split("T")?.[0] || d.date,
      rain_chance: d.rain?.chance ?? d.rain_chance ?? 0,
      rain_amount: d.rain?.amount?.min != null
        ? `${d.rain.amount.min}-${d.rain.amount.max ?? "?"}mm`
        : d.rain_amount ?? "0mm",
      temp_min: d.temp_min ?? d.now?.temp_min ?? null,
      temp_max: d.temp_max ?? d.now?.temp_max ?? null,
      icon: mapIcon(d.icon_descriptor),
      short_text: d.short_text ?? d.extended_text?.substring(0, 60) ?? "",
    }));

    const radar_station_id = getRadarStation(postcode);

    return new Response(
      JSON.stringify({ location: locationName, days, radar_station_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("weather-forecast error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to fetch weather data" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
