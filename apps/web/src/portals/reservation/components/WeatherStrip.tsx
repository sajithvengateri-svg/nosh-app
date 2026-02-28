/**
 * WeatherStrip — compact 7-day forecast strip + outdoor nudges for the dashboard.
 *
 * Shows:
 *  - 7-day mini forecast cards (icon, temp, rain %)
 *  - Outdoor risk badges
 *  - High-temp nudge when today's max ≥ 32°C
 *  - Rain nudge when rain chance ≥ 40%
 *  - AI Nudge toggle (enables/disables weather-based booking nudges)
 */
import { useState, useEffect } from "react";
import {
  Sun, CloudSun, Cloud, CloudRain, CloudDrizzle, CloudLightning,
  Wind, Droplets, AlertTriangle, ShieldCheck,
  Loader2, MapPin, BrainCircuit, ChevronDown, ChevronUp, ShieldOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import {
  useWeather,
  RAIN_RISK_THRESHOLD,
  HIGH_RAIN_THRESHOLD,
  WARM_TEMP_THRESHOLD,
  HIGH_TEMP_THRESHOLD,
} from "../hooks/useWeather";

// ─── Icon map ──────────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  sunny: Sun,
  mostly_sunny: Sun,
  partly_cloudy: CloudSun,
  mostly_cloudy: Cloud,
  cloudy: Cloud,
  rain: CloudRain,
  showers: CloudDrizzle,
  storm: CloudLightning,
  windy: Wind,
  fog: Cloud,
};

const getRainColor = (pct: number) => {
  if (pct < 20) return "text-emerald-500";
  if (pct < RAIN_RISK_THRESHOLD) return "text-yellow-500";
  if (pct < HIGH_RAIN_THRESHOLD) return "text-amber-500";
  return "text-red-500";
};

const getTempColor = (temp: number | null) => {
  if (!temp) return "text-muted-foreground";
  if (temp >= HIGH_TEMP_THRESHOLD) return "text-red-500";
  if (temp >= WARM_TEMP_THRESHOLD) return "text-orange-500";
  if (temp >= 25) return "text-amber-500";
  return "text-muted-foreground";
};

const riskBadge = (level: "safe" | "caution" | "warning" | "danger") => {
  switch (level) {
    case "danger": return { label: "High Risk", className: "bg-red-100 text-red-700 border-red-200" };
    case "warning": return { label: "Caution", className: "bg-amber-100 text-amber-700 border-amber-200" };
    case "caution": return { label: "Mild", className: "bg-yellow-50 text-yellow-700 border-yellow-200" };
    default: return { label: "Clear", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
};

// ─── WeatherStrip ──────────────────────────────────────────
interface WeatherStripProps {
  selectedDate: string;
  className?: string;
  /** Tables from dashboard — used for outdoor table blocking nudge */
  tables?: Array<{ id: string; name: string; zone: string; is_blocked: boolean }>;
  /** Callback to block all outdoor tables */
  onBlockOutdoorTables?: () => void;
}

export default function WeatherStrip({ selectedDate, className, tables, onBlockOutdoorTables }: WeatherStripProps) {
  const {
    weather,
    isLoading,
    postcode,
    outdoorRiskLevel,
    outdoorNudgeMessage,
  } = useWeather();

  const [aiNudgeEnabled, setAiNudgeEnabled] = useState(() => {
    try { return localStorage.getItem("cc_ai_nudge") !== "false"; } catch { return true; }
  });

  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    try { localStorage.setItem("cc_ai_nudge", String(aiNudgeEnabled)); } catch {}
  }, [aiNudgeEnabled]);

  if (!postcode || postcode === "0000") {
    return (
      <div className={cn("px-3 py-2 bg-muted/30 border-b border-border flex items-center gap-2 text-xs text-muted-foreground", className)}>
        <MapPin className="w-3.5 h-3.5" />
        Set venue postcode in Settings for weather forecasts
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn("px-3 py-2 bg-muted/30 border-b border-border flex items-center gap-2 text-xs text-muted-foreground", className)}>
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Loading weather...
      </div>
    );
  }

  if (!weather || weather.days.length === 0) {
    return null;
  }

  const selectedDayWeather = weather.days.find((d) => d.date === selectedDate);
  const risk = outdoorRiskLevel(selectedDate);
  const nudgeMsg = aiNudgeEnabled ? outdoorNudgeMessage(selectedDate) : null;
  const badge = riskBadge(risk);

  return (
    <div className={cn("border-b border-border bg-muted/20", className)}>
      {/* Compact strip */}
      <div className="px-3 py-1.5 flex items-center gap-2">
        {/* Today summary */}
        {selectedDayWeather && (
          <>
            {(() => {
              const Icon = ICON_MAP[selectedDayWeather.icon] || Cloud;
              return <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />;
            })()}
            <span className="text-xs font-medium truncate">
              {selectedDayWeather.short_text}
            </span>
            <span className={cn("text-xs font-bold", getTempColor(selectedDayWeather.temp_max))}>
              {selectedDayWeather.temp_max != null ? `${selectedDayWeather.temp_max}°` : "—"}
            </span>
            <div className="flex items-center gap-0.5">
              <Droplets className={cn("w-3 h-3", getRainColor(selectedDayWeather.rain_chance))} />
              <span className={cn("text-xs font-bold", getRainColor(selectedDayWeather.rain_chance))}>
                {selectedDayWeather.rain_chance}%
              </span>
            </div>
          </>
        )}

        <div className="flex-1" />

        {/* Outdoor risk badge */}
        <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 h-4", badge.className)}>
          {risk !== "safe" && <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />}
          {risk === "safe" && <ShieldCheck className="w-2.5 h-2.5 mr-0.5" />}
          {badge.label}
        </Badge>

        {/* AI Nudge toggle */}
        <div className="flex items-center gap-1 border-l border-border pl-2 ml-1">
          <BrainCircuit className="w-3 h-3 text-muted-foreground" />
          <span className="text-[9px] text-muted-foreground">AI</span>
          <Switch
            checked={aiNudgeEnabled}
            onCheckedChange={setAiNudgeEnabled}
            className="h-3.5 w-7 data-[state=checked]:bg-primary"
          />
        </div>

        {/* Expand toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </Button>
      </div>

      {/* AI Nudge banner */}
      {nudgeMsg && (
        <div className="px-3 pb-1.5">
          <div className={cn(
            "rounded-md px-2 py-1 text-[10px] flex items-start gap-1.5",
            risk === "danger" ? "bg-red-50 text-red-700 border border-red-200" :
            risk === "warning" ? "bg-amber-50 text-amber-700 border border-amber-200" :
            "bg-blue-50 text-blue-700 border border-blue-200"
          )}>
            <BrainCircuit className="w-3 h-3 flex-shrink-0 mt-0.5" />
            <span>{nudgeMsg}</span>
          </div>
        </div>
      )}

      {/* Expanded: 7-day forecast strip */}
      {expanded && (
        <div className="px-3 pb-2">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {weather.days.slice(0, 7).map((day) => {
              const Icon = ICON_MAP[day.icon] || Cloud;
              const isSelected = day.date === selectedDate;
              const dayRisk = outdoorRiskLevel(day.date);
              return (
                <div
                  key={day.date}
                  className={cn(
                    "flex-shrink-0 rounded-md border px-2 py-1.5 text-center min-w-[56px] transition-colors",
                    isSelected ? "border-primary bg-primary/5" : "border-border bg-background",
                    dayRisk === "danger" && "border-red-200 bg-red-50/50",
                    dayRisk === "warning" && "border-amber-200 bg-amber-50/50",
                  )}
                >
                  <p className="text-[9px] text-muted-foreground font-medium">
                    {format(parseISO(day.date), "EEE")}
                  </p>
                  <p className="text-[9px] text-muted-foreground">
                    {format(parseISO(day.date), "d/M")}
                  </p>
                  <Icon className="w-4 h-4 mx-auto my-0.5 text-muted-foreground" />
                  <div className="flex items-center justify-center gap-0.5">
                    <Droplets className={cn("w-2.5 h-2.5", getRainColor(day.rain_chance))} />
                    <span className={cn("text-[10px] font-bold", getRainColor(day.rain_chance))}>
                      {day.rain_chance}%
                    </span>
                  </div>
                  <p className={cn("text-[9px] font-medium", getTempColor(day.temp_max))}>
                    {day.temp_min ?? "—"}°/{day.temp_max ?? "—"}°
                  </p>
                  {dayRisk !== "safe" && (
                    <AlertTriangle className="w-2.5 h-2.5 mx-auto text-amber-500 mt-0.5" />
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[9px] text-muted-foreground text-right mt-1">
            {weather.location} · Updated {format(parseISO(weather.fetchedAt), "h:mma")}
          </p>

          {/* Outdoor table blocking nudge — only when risk is high */}
          {aiNudgeEnabled && risk === "danger" && tables && tables.length > 0 && (() => {
            const outdoorUnblocked = tables.filter((t) => t.zone === "OUTDOOR" && !t.is_blocked);
            if (outdoorUnblocked.length === 0) return null;
            return (
              <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-2.5 py-2">
                <div className="flex items-start gap-2">
                  <ShieldOff className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-red-700">
                      {outdoorUnblocked.length} outdoor table{outdoorUnblocked.length !== 1 ? "s" : ""} still open
                    </p>
                    <p className="text-[9px] text-red-600 mt-0.5">
                      High rain probability — consider blocking outdoor tables as indoor backup.
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {outdoorUnblocked.slice(0, 6).map((t) => (
                        <Badge key={t.id} variant="outline" className="text-[8px] px-1 py-0 border-red-200 text-red-600">
                          {t.name}
                        </Badge>
                      ))}
                      {outdoorUnblocked.length > 6 && (
                        <span className="text-[8px] text-red-500">+{outdoorUnblocked.length - 6} more</span>
                      )}
                    </div>
                  </div>
                  {onBlockOutdoorTables && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-6 text-[10px] px-2 flex-shrink-0"
                      onClick={onBlockOutdoorTables}
                    >
                      Block All
                    </Button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
