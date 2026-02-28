import { useQuery } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { addDays, format } from "date-fns";

// ─── Types ────────────────────────────────────────────────
export interface WeatherDay {
  date: string;               // yyyy-MM-dd
  temp_min: number | null;
  temp_max: number | null;
  rain_chance: number;         // 0–100
  rain_amount_mm: number;
  icon: WeatherIcon;
  short_text: string;
  wind_speed_kph: number;
}

export interface WeatherHourly {
  time: string;                // ISO string
  temp: number;
  rain_chance: number;         // 0–100
  rain_mm: number;
  icon: WeatherIcon;
  wind_speed_kph: number;
}

export type WeatherIcon =
  | "sunny" | "partly_cloudy" | "cloudy" | "rain"
  | "showers" | "storm" | "windy" | "fog";

export interface WeatherData {
  location: string;
  postcode: string;
  days: WeatherDay[];
  hourly: WeatherHourly[];
  fetchedAt: string;
}

// ─── Nudge thresholds ─────────────────────────────────────
export const RAIN_RISK_THRESHOLD = 40;       // % chance → start nudging
export const HIGH_RAIN_THRESHOLD = 70;       // % chance → strong warning
export const HIGH_TEMP_THRESHOLD = 35;       // °C → suggest indoors
export const WARM_TEMP_THRESHOLD = 32;       // °C → gentle nudge

// ─── WMO weather code → icon mapping ─────────────────────
function wmoToIcon(code: number): WeatherIcon {
  if (code <= 1) return "sunny";
  if (code <= 3) return "partly_cloudy";
  if (code <= 48) return "cloudy";  // fog codes
  if (code <= 57) return "showers"; // drizzle
  if (code <= 67) return "rain";
  if (code <= 77) return "showers"; // snow-like
  if (code <= 82) return "rain";    // rain showers
  if (code >= 95) return "storm";
  return "cloudy";
}

function wmoToText(code: number): string {
  if (code === 0) return "Clear sky";
  if (code === 1) return "Mainly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code >= 45 && code <= 48) return "Fog";
  if (code >= 51 && code <= 55) return "Drizzle";
  if (code >= 56 && code <= 57) return "Freezing drizzle";
  if (code >= 61 && code <= 65) return "Rain";
  if (code >= 66 && code <= 67) return "Freezing rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code >= 85 && code <= 86) return "Snow showers";
  if (code >= 95) return "Thunderstorm";
  return "Unknown";
}

// ─── BOM API fetch ────────────────────────────────────────
async function fetchBomForecast(postcode: string): Promise<WeatherData | null> {
  try {
    // 1. Resolve postcode → geohash
    const searchRes = await fetch(
      `https://api.weather.bom.gov.au/v1/locations?search=${encodeURIComponent(postcode)}`
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const loc = searchData?.data?.[0];
    if (!loc) return null;

    const geohash = loc.geohash.substring(0, 6);
    const locationName = `${loc.name}, ${loc.state}`;

    // 2. Fetch daily + hourly in parallel
    const [dailyRes, hourlyRes] = await Promise.all([
      fetch(`https://api.weather.bom.gov.au/v1/locations/${geohash}/forecasts/daily`),
      fetch(`https://api.weather.bom.gov.au/v1/locations/${geohash}/forecasts/hourly`),
    ]);

    if (!dailyRes.ok || !hourlyRes.ok) return null;

    const dailyData = await dailyRes.json();
    const hourlyData = await hourlyRes.json();

    const days: WeatherDay[] = (dailyData.data || []).map((d: any) => ({
      date: d.date?.slice(0, 10) ?? "",
      temp_min: d.temp_min ?? null,
      temp_max: d.temp_max ?? null,
      rain_chance: d.rain?.chance ?? 0,
      rain_amount_mm: d.rain?.amount?.max ?? 0,
      icon: d.icon_descriptor ? (d.icon_descriptor.replace(/\s/g, "_") as WeatherIcon) : "cloudy",
      short_text: d.short_text ?? "",
      wind_speed_kph: d.wind?.speed_kilometre ?? 0,
    }));

    const hourly: WeatherHourly[] = (hourlyData.data || []).slice(0, 48).map((h: any) => ({
      time: h.time ?? "",
      temp: h.temp ?? 0,
      rain_chance: h.rain?.chance ?? 0,
      rain_mm: h.rain?.amount?.max ?? 0,
      icon: h.icon_descriptor ? (h.icon_descriptor.replace(/\s/g, "_") as WeatherIcon) : "cloudy",
      wind_speed_kph: h.wind?.speed_kilometre ?? 0,
    }));

    return {
      location: locationName,
      postcode,
      days,
      hourly,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// ─── AU postcode → lat/lon lookup ────────────────────────
// Covers all major Australian postcode ranges with city-level precision
function postcodeToLatLon(postcode: string): { lat: number; lon: number; name: string } {
  const pc = parseInt(postcode, 10);
  // QLD specific — Bar Alto is in Brisbane Powerhouse (New Farm, 4005)
  if (pc >= 4000 && pc <= 4014) return { lat: -27.4698, lon: 153.0251, name: "Brisbane CBD" };
  if (pc >= 4050 && pc <= 4069) return { lat: -27.4310, lon: 153.0480, name: "Brisbane Inner North" };
  if (pc >= 4100 && pc <= 4125) return { lat: -27.5000, lon: 153.0380, name: "Brisbane South" };
  if (pc >= 4150 && pc <= 4179) return { lat: -27.4800, lon: 153.0990, name: "Brisbane East" };
  if (pc >= 4200 && pc <= 4230) return { lat: -27.6300, lon: 153.1000, name: "Redland/Logan" };
  if (pc >= 4300 && pc <= 4350) return { lat: -27.6100, lon: 152.7600, name: "Ipswich" };
  if (pc >= 4500 && pc <= 4560) return { lat: -27.2400, lon: 152.9600, name: "Moreton Bay" };
  if (pc >= 4550 && pc <= 4575) return { lat: -26.6800, lon: 153.0400, name: "Sunshine Coast" };
  if (pc >= 4210 && pc <= 4230) return { lat: -28.0000, lon: 153.4300, name: "Gold Coast" };
  if (pc >= 4000 && pc <= 4999) return { lat: -27.4698, lon: 153.0251, name: "Queensland" };
  // NSW
  if (pc >= 2000 && pc <= 2050) return { lat: -33.8688, lon: 151.2093, name: "Sydney CBD" };
  if (pc >= 2000 && pc <= 2999) return { lat: -33.8688, lon: 151.2093, name: "Sydney area" };
  // VIC
  if (pc >= 3000 && pc <= 3050) return { lat: -37.8136, lon: 144.9631, name: "Melbourne CBD" };
  if (pc >= 3000 && pc <= 3999) return { lat: -37.8136, lon: 144.9631, name: "Melbourne area" };
  // SA
  if (pc >= 5000 && pc <= 5999) return { lat: -34.9285, lon: 138.6007, name: "Adelaide area" };
  // WA
  if (pc >= 6000 && pc <= 6999) return { lat: -31.9505, lon: 115.8605, name: "Perth area" };
  // TAS
  if (pc >= 7000 && pc <= 7999) return { lat: -42.8821, lon: 147.3272, name: "Hobart area" };
  // NT
  if (pc >= 800 && pc <= 899) return { lat: -12.4634, lon: 130.8456, name: "Darwin area" };
  // ACT
  if (pc >= 2600 && pc <= 2618) return { lat: -35.2809, lon: 149.1300, name: "Canberra" };
  return { lat: -27.4698, lon: 153.0251, name: "Australia" };
}

// ─── Open-Meteo (primary — no CORS issues) ───────────────
async function fetchOpenMeteoForecast(postcode: string): Promise<WeatherData | null> {
  try {
    const { lat, lon, name: locationName } = postcodeToLatLon(postcode);

    const url = new URL("https://api.open-meteo.com/v1/bom");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set("hourly", "temperature_2m,precipitation_probability,precipitation,rain,weather_code,wind_speed_10m");
    url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,rain_sum,weather_code,wind_speed_10m_max");
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("forecast_days", "7");

    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();

    const days: WeatherDay[] = (data.daily?.time || []).map((date: string, i: number) => ({
      date,
      temp_min: data.daily.temperature_2m_min?.[i] ?? null,
      temp_max: data.daily.temperature_2m_max?.[i] ?? null,
      rain_chance: data.daily.precipitation_probability_max?.[i] ?? Math.min(100, Math.round((data.daily.precipitation_sum?.[i] ?? 0) * 20)),
      rain_amount_mm: data.daily.rain_sum?.[i] ?? 0,
      icon: wmoToIcon(data.daily.weather_code?.[i] ?? 0),
      short_text: wmoToText(data.daily.weather_code?.[i] ?? 0),
      wind_speed_kph: data.daily.wind_speed_10m_max?.[i] ?? 0,
    }));

    const hourly: WeatherHourly[] = (data.hourly?.time || []).slice(0, 48).map((time: string, i: number) => ({
      time,
      temp: data.hourly.temperature_2m?.[i] ?? 0,
      rain_chance: data.hourly.precipitation_probability?.[i] ?? Math.min(100, Math.round((data.hourly.precipitation?.[i] ?? 0) * 30)),
      rain_mm: data.hourly.rain?.[i] ?? 0,
      icon: wmoToIcon(data.hourly.weather_code?.[i] ?? 0),
      wind_speed_kph: data.hourly.wind_speed_10m?.[i] ?? 0,
    }));

    return {
      location: locationName,
      postcode,
      days,
      hourly,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// ─── Supabase edge function (existing weather-forecast) ───
async function fetchEdgeFunctionForecast(postcode: string): Promise<WeatherData | null> {
  try {
    const { data, error } = await supabase.functions.invoke("weather-forecast", {
      body: { postcode },
    });
    if (error || !data) return null;
    return {
      location: data.location ?? postcode,
      postcode,
      days: (data.days || []).map((d: any) => ({
        date: d.date,
        temp_min: d.temp_min ?? null,
        temp_max: d.temp_max ?? null,
        rain_chance: d.rain_chance ?? 0,
        rain_amount_mm: parseFloat(d.rain_amount) || 0,
        icon: (d.icon ?? "cloudy") as WeatherIcon,
        short_text: d.short_text ?? "",
        wind_speed_kph: 0,
      })),
      hourly: [],
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// ─── Main hook ────────────────────────────────────────────
export function useWeather() {
  const { venues } = useOrg();
  const postcode = venues?.[0]?.postcode ?? null;

  const { data, isLoading, error } = useQuery<WeatherData | null>({
    queryKey: ["weather_bom", postcode],
    queryFn: async () => {
      if (!postcode || postcode === "0000") return null;

      // Open-Meteo first — no CORS issues, uses BOM model for AU
      const omData = await fetchOpenMeteoForecast(postcode);
      if (omData && omData.days.length > 0) return omData;

      // Fallback: existing Edge Function (server-side, can call BOM API)
      const edgeData = await fetchEdgeFunctionForecast(postcode);
      if (edgeData && edgeData.days.length > 0) return edgeData;

      // Last resort: direct BOM API (may fail due to CORS in browser)
      const bomData = await fetchBomForecast(postcode);
      return bomData;
    },
    enabled: !!postcode && postcode !== "0000",
    staleTime: 30 * 60 * 1000,  // 30 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // ─── Derived nudges ──────────────────────────────────────
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayWeather = data?.days.find((d) => d.date === todayStr) ?? null;

  const hasRainRisk = (todayWeather?.rain_chance ?? 0) >= RAIN_RISK_THRESHOLD;
  const hasHighRain = (todayWeather?.rain_chance ?? 0) >= HIGH_RAIN_THRESHOLD;
  const hasHighTemp = (todayWeather?.temp_max ?? 0) >= HIGH_TEMP_THRESHOLD;
  const hasWarmTemp = (todayWeather?.temp_max ?? 0) >= WARM_TEMP_THRESHOLD;

  // Get weather for a specific date
  const getWeatherForDate = (date: string) =>
    data?.days.find((d) => d.date === date) ?? null;

  // Get hourly forecast for a specific date
  const getHourlyForDate = (date: string) =>
    (data?.hourly ?? []).filter((h) => h.time.startsWith(date));

  // Outdoor risk level
  const outdoorRiskLevel = (date?: string): "safe" | "caution" | "warning" | "danger" => {
    const weather = date ? getWeatherForDate(date) : todayWeather;
    if (!weather) return "safe";
    const rainPct = weather.rain_chance;
    const tempMax = weather.temp_max ?? 0;
    if (rainPct >= HIGH_RAIN_THRESHOLD || tempMax >= HIGH_TEMP_THRESHOLD) return "danger";
    if (rainPct >= RAIN_RISK_THRESHOLD || tempMax >= WARM_TEMP_THRESHOLD) return "warning";
    if (rainPct >= 20 || tempMax >= 30) return "caution";
    return "safe";
  };

  // Generate nudge message for outdoor bookings
  const outdoorNudgeMessage = (date?: string): string | null => {
    const weather = date ? getWeatherForDate(date) : todayWeather;
    if (!weather) return null;
    const messages: string[] = [];

    if (weather.rain_chance >= HIGH_RAIN_THRESHOLD) {
      messages.push(`${weather.rain_chance}% chance of rain — consider moving outdoor guests indoors`);
    } else if (weather.rain_chance >= RAIN_RISK_THRESHOLD) {
      messages.push(`${weather.rain_chance}% rain chance — have backup indoor tables ready`);
    }

    if ((weather.temp_max ?? 0) >= HIGH_TEMP_THRESHOLD) {
      messages.push(`High of ${weather.temp_max}°C — suggest shaded or indoor seating`);
    } else if ((weather.temp_max ?? 0) >= WARM_TEMP_THRESHOLD) {
      messages.push(`Warm day (${weather.temp_max}°C) — offer guests indoor options`);
    }

    return messages.length > 0 ? messages.join(". ") : null;
  };

  // Widget customer-facing message
  const widgetWeatherMessage = (date?: string): string | null => {
    const weather = date ? getWeatherForDate(date) : todayWeather;
    if (!weather) return null;

    if (weather.rain_chance >= HIGH_RAIN_THRESHOLD) {
      return "Light showers possible — don't worry, we have cozy indoor and covered backup spaces for you!";
    }
    if (weather.rain_chance >= RAIN_RISK_THRESHOLD) {
      return "There's a chance of rain — we have backup covered areas just in case!";
    }
    if ((weather.temp_max ?? 0) >= HIGH_TEMP_THRESHOLD) {
      return `It's going to be a hot one (${weather.temp_max}°C)! We have air-conditioned indoor seating available.`;
    }
    return null;
  };

  return {
    weather: data,
    isLoading,
    error,
    postcode,
    todayWeather,
    hasRainRisk,
    hasHighRain,
    hasHighTemp,
    hasWarmTemp,
    getWeatherForDate,
    getHourlyForDate,
    outdoorRiskLevel,
    outdoorNudgeMessage,
    widgetWeatherMessage,
  };
}
