import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReportMetricCardProps {
  label: string;
  value: string | number;
  previousValue?: number;
  icon: React.ReactNode;
  format?: "number" | "percentage" | "minutes" | "currency";
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatValue(
  value: string | number,
  fmt?: "number" | "percentage" | "minutes" | "currency",
): string {
  if (typeof value === "string") return value;
  switch (fmt) {
    case "percentage":
      return `${value.toFixed(1)}%`;
    case "minutes":
      return `${value} min`;
    case "currency":
      return `$${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    case "number":
    default:
      return value.toLocaleString();
  }
}

function computeTrend(
  current: string | number,
  previous?: number,
): { direction: "up" | "down" | "flat"; pct: number } | null {
  if (previous === undefined || previous === null) return null;
  const cur = typeof current === "string" ? parseFloat(current) : current;
  if (isNaN(cur) || previous === 0) return null;
  const pct = ((cur - previous) / Math.abs(previous)) * 100;
  if (Math.abs(pct) < 0.1) return { direction: "flat", pct: 0 };
  return { direction: pct > 0 ? "up" : "down", pct: Math.abs(pct) };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ReportMetricCard: React.FC<ReportMetricCardProps> = ({
  label,
  value,
  previousValue,
  icon,
  format,
  className,
}) => {
  const trend = computeTrend(value, previousValue);

  return (
    <Card className={cn("w-[120px] shrink-0", className)}>
      <CardContent className="p-3 flex flex-col gap-1">
        {/* Icon + Label */}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <span className="shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5">{icon}</span>
          <span className="text-[11px] font-medium truncate">{label}</span>
        </div>

        {/* Value */}
        <p className="text-lg font-bold leading-tight tracking-tight">
          {formatValue(value, format)}
        </p>

        {/* Trend */}
        {trend && trend.direction !== "flat" && (
          <span
            className={cn(
              "text-[11px] font-medium flex items-center gap-0.5",
              trend.direction === "up" ? "text-green-600" : "text-red-600",
            )}
          >
            {trend.direction === "up" ? "\u2191" : "\u2193"}
            {trend.pct.toFixed(1)}%
          </span>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportMetricCard;
