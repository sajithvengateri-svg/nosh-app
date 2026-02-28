"use client";

import React from "react";
import { format, parseISO } from "date-fns";
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  Wind,
  Loader2,
  MapPin,
  Droplets,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  useWeather,
  RAIN_RISK_THRESHOLD,
} from "../hooks/useWeather";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WeatherDay {
  date: string;
  temp_min: number | null;
  temp_max: number | null;
  rain_chance: number;
  rain_amount_mm: number;
  icon: string;
  short_text: string;
  wind_speed_kph: number;
}

export interface WeatherPanelProps {
  selectedDate: string; // yyyy-MM-dd
  onDateSelect?: (date: string) => void;
  compact?: boolean; // if true, show smaller cards (for sidebar placement)
}

// ---------------------------------------------------------------------------
// Icon mapping
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, LucideIcon> = {
  sunny: Sun,
  mostly_sunny: Sun,
  partly_cloudy: CloudSun,
  mostly_cloudy: Cloud,
  cloudy: Cloud,
  fog: Cloud,
  rain: CloudRain,
  showers: CloudDrizzle,
  storm: CloudLightning,
  windy: Wind,
};

function resolveWeatherIcon(icon: string): LucideIcon {
  return ICON_MAP[icon] ?? Cloud;
}

// ---------------------------------------------------------------------------
// Temperature colour helpers
// ---------------------------------------------------------------------------

function tempColor(temp: number | null): string {
  if (temp === null) return "text-muted-foreground";
  if (temp >= 35) return "text-red-600 dark:text-red-400";
  if (temp >= 28) return "text-orange-500 dark:text-orange-400";
  if (temp <= 5) return "text-blue-600 dark:text-blue-400";
  if (temp <= 12) return "text-sky-500 dark:text-sky-400";
  return "text-foreground";
}

// ---------------------------------------------------------------------------
// Rain chance colour + bar helpers
// ---------------------------------------------------------------------------

function rainChanceColor(chance: number): {
  text: string;
  bg: string;
  bar: string;
} {
  if (chance >= 70)
    return {
      text: "text-red-700 dark:text-red-400",
      bg: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
      bar: "bg-red-500 dark:bg-red-400",
    };
  if (chance >= 40)
    return {
      text: "text-amber-700 dark:text-amber-400",
      bg: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
      bar: "bg-amber-500 dark:bg-amber-400",
    };
  if (chance >= 20)
    return {
      text: "text-yellow-700 dark:text-yellow-400",
      bg: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
      bar: "bg-yellow-500 dark:bg-yellow-400",
    };
  return {
    text: "text-green-700 dark:text-green-400",
    bg: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    bar: "bg-green-500 dark:bg-green-400",
  };
}

// ---------------------------------------------------------------------------
// Outdoor risk styling
// ---------------------------------------------------------------------------

const RISK_STYLES: Record<
  "safe" | "caution" | "warning" | "danger",
  { badge: string; label: string }
> = {
  safe: {
    badge:
      "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700",
    label: "Safe",
  },
  caution: {
    badge:
      "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700",
    label: "Caution",
  },
  warning: {
    badge:
      "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700",
    label: "Warning",
  },
  danger: {
    badge:
      "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700",
    label: "Danger",
  },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RainChanceBar({
  chance,
  compact,
}: {
  chance: number;
  compact?: boolean;
}) {
  const colors = rainChanceColor(chance);
  return (
    <div className="flex items-center gap-2">
      <Droplets
        className={cn("shrink-0", colors.text, compact ? "h-3 w-3" : "h-3.5 w-3.5")}
      />
      <div className="flex flex-1 items-center gap-1.5">
        <div
          className={cn(
            "relative overflow-hidden rounded-full bg-muted",
            compact ? "h-1.5 w-12" : "h-2 w-16"
          )}
        >
          <div
            className={cn("absolute inset-y-0 left-0 rounded-full transition-all", colors.bar)}
            style={{ width: `${Math.min(chance, 100)}%` }}
          />
        </div>
        <span
          className={cn(
            "font-medium tabular-nums",
            colors.text,
            compact ? "text-[10px]" : "text-xs"
          )}
        >
          {chance}%
        </span>
      </div>
    </div>
  );
}

function ForecastCard({
  day,
  isSelected,
  compact,
  onSelect,
}: {
  day: WeatherDay;
  isSelected: boolean;
  compact?: boolean;
  onSelect?: () => void;
}) {
  const Icon = resolveWeatherIcon(day.icon);
  const parsed = parseISO(day.date);
  const dayName = format(parsed, "EEE");
  const dateLabel = format(parsed, "d MMM");
  const rainColors = rainChanceColor(day.rain_chance);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex shrink-0 flex-col items-center rounded-xl border bg-card p-3 text-card-foreground shadow-sm transition-all",
        "hover:shadow-md hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected && "border-primary ring-2 ring-primary/20 shadow-md",
        compact ? "w-[100px] gap-1.5" : "w-[130px] gap-2"
      )}
    >
      {/* Day + Date */}
      <div className="flex flex-col items-center gap-0.5">
        <span
          className={cn(
            "font-semibold uppercase tracking-wide",
            compact ? "text-[10px]" : "text-xs",
            isSelected ? "text-primary" : "text-muted-foreground"
          )}
        >
          {dayName}
        </span>
        <span
          className={cn(
            "font-medium",
            compact ? "text-[10px]" : "text-[11px]",
            "text-muted-foreground"
          )}
        >
          {dateLabel}
        </span>
      </div>

      {/* Weather Icon */}
      <Icon
        className={cn(
          "text-muted-foreground transition-colors group-hover:text-foreground",
          isSelected && "text-foreground",
          compact ? "h-7 w-7" : "h-10 w-10"
        )}
        strokeWidth={1.5}
      />

      {/* High / Low */}
      <div
        className={cn(
          "flex items-baseline gap-1 font-semibold tabular-nums",
          compact ? "text-sm" : "text-base"
        )}
      >
        <span className={tempColor(day.temp_max)}>
          {day.temp_max !== null ? `${Math.round(day.temp_max)}°` : "—"}
        </span>
        <span className="text-muted-foreground/50">/</span>
        <span
          className={cn(
            tempColor(day.temp_min),
            compact ? "text-[10px]" : "text-xs",
            "font-normal"
          )}
        >
          {day.temp_min !== null ? `${Math.round(day.temp_min)}°` : "—"}
        </span>
      </div>

      {/* Rain Chance */}
      <div className={cn("w-full", compact ? "px-0.5" : "px-1")}>
        <RainChanceBar chance={day.rain_chance} compact={compact} />
      </div>

      {/* Rain Amount */}
      {day.rain_amount_mm > 0 && (
        <span
          className={cn(
            "tabular-nums text-muted-foreground",
            compact ? "text-[10px]" : "text-[11px]"
          )}
        >
          {day.rain_amount_mm} mm
        </span>
      )}

      {/* Wind */}
      <div
        className={cn(
          "flex items-center gap-1 text-muted-foreground",
          compact ? "text-[10px]" : "text-[11px]"
        )}
      >
        <Wind className={cn(compact ? "h-2.5 w-2.5" : "h-3 w-3")} />
        <span className="tabular-nums">{Math.round(day.wind_speed_kph)} km/h</span>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function WeatherPanel({
  selectedDate,
  onDateSelect,
  compact = false,
}: WeatherPanelProps) {
  const { weather, isLoading, postcode, outdoorRiskLevel, outdoorNudgeMessage } =
    useWeather();

  // ---- Loading state ----
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Loading weather...
          </span>
        </CardContent>
      </Card>
    );
  }

  // ---- No postcode state ----
  if (!postcode) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-8">
          <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Set venue postcode in Settings for weather forecasts.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ---- No data / fetch failed state ----
  if (!weather) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-8">
          <Cloud className="h-5 w-5 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Weather data unavailable. Postcode: {postcode}
          </p>
        </CardContent>
      </Card>
    );
  }

  const riskLevel = outdoorRiskLevel(selectedDate);
  const nudgeMessage = outdoorNudgeMessage(selectedDate);
  const riskStyle = RISK_STYLES[riskLevel];

  return (
    <div className={cn("flex flex-col", compact ? "gap-3" : "gap-4")}>
      {/* ----- 7-Day Forecast ----- */}
      <Card>
        <CardHeader className={cn(compact ? "pb-2" : "pb-3")}>
          <CardTitle className={cn(compact ? "text-sm" : "text-base")}>
            7-Day Forecast
          </CardTitle>
          {weather.location && (
            <p className="text-xs text-muted-foreground">{weather.location}</p>
          )}
        </CardHeader>
        <CardContent className={cn(compact ? "pb-3" : "pb-4")}>
          <div
            className={cn(
              "flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20",
              "snap-x snap-mandatory",
              "md:flex-wrap md:overflow-x-visible md:pb-0"
            )}
          >
            {weather.days.map((day) => (
              <div key={day.date} className="snap-start">
                <ForecastCard
                  day={day}
                  isSelected={day.date === selectedDate}
                  compact={compact}
                  onSelect={
                    onDateSelect ? () => onDateSelect(day.date) : undefined
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ----- Outdoor Risk Summary ----- */}
      {(riskLevel !== "safe" || nudgeMessage) && (
        <div
          className={cn(
            "flex items-start gap-3 rounded-lg border px-4 py-3",
            riskStyle.badge
          )}
        >
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 font-semibold",
              riskStyle.badge
            )}
          >
            {riskStyle.label}
          </Badge>
          {nudgeMessage && (
            <p className="text-sm leading-snug">{nudgeMessage}</p>
          )}
        </div>
      )}

      {/* Always show the safe banner when safe and there is a nudge */}
      {riskLevel === "safe" && !nudgeMessage && (
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg border px-4 py-3",
            riskStyle.badge
          )}
        >
          <Badge
            variant="outline"
            className={cn("shrink-0 font-semibold", riskStyle.badge)}
          >
            {riskStyle.label}
          </Badge>
          <p className="text-sm leading-snug text-muted-foreground">
            Weather looks good for outdoor dining.
          </p>
        </div>
      )}

      {/* ----- BOM Radar Map ----- */}
      <Card>
        <CardHeader className={cn(compact ? "pb-2" : "pb-3")}>
          <div className="flex items-center justify-between">
            <CardTitle className={cn(compact ? "text-sm" : "text-base")}>
              Radar
            </CardTitle>
            <a
              href="https://weather.bom.gov.au/location/r3gx0n3-brisbane"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Open BOM Radar
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardHeader>
        <CardContent className={cn(compact ? "pb-3" : "pb-4")}>
          <iframe
            src="https://weather.bom.gov.au/location/r3gx0n3-brisbane"
            title="BOM Radar - Brisbane"
            className="w-full h-[300px] rounded-lg border-0"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin"
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default WeatherPanel;
