import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart2 } from "lucide-react";
import { useServiceLogStats } from "@/hooks/useHousekeeping";
import type { ServiceConfig } from "@/types/housekeeping";

interface ServiceConsumptionChartProps {
  service: ServiceConfig;
}

export default function ServiceConsumptionChart({ service }: ServiceConsumptionChartProps) {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

  const [from, setFrom] = useState(sixMonthsAgo.toISOString().split("T")[0]);
  const [to, setTo] = useState(now.toISOString().split("T")[0]);

  const metricKeys = (service.graphMetrics ?? []).map((m) => m.key);
  const { stats, isLoading } = useServiceLogStats(
    service.key,
    { from: new Date(from), to: new Date(to) },
    metricKeys
  );

  if (!service.hasGraph || !service.graphMetrics?.length) {
    return (
      <div className="card-elevated p-8 text-center">
        <BarChart2 className="w-8 h-8 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">No graph metrics configured for this service.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Date range */}
      <div className="flex gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-8 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-8 text-xs" />
        </div>
      </div>

      {/* Chart */}
      <div className="card-elevated p-4">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">Loading...</div>
        ) : stats.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
            No data for this period. Add entries to see consumption trends.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={stats} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              {service.graphMetrics.map((metric) => (
                <Area
                  key={metric.key}
                  type="monotone"
                  dataKey={metric.key}
                  name={metric.label}
                  stroke={metric.color}
                  fill={metric.color}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Cost trend */}
      {stats.length > 0 && (
        <div className="card-elevated p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">Cost Trend</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={stats} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="cost"
                name="Cost ($)"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.1}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
