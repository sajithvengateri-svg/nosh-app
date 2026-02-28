import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const metrics = ["Revenue", "Food %", "Labour %", "Net %"];
const periods = ["7d", "30d", "90d"];

const mockData: Record<string, Record<string, { day: string; value: number }[]>> = {
  Revenue: {
    "7d": [
      { day: "Mon", value: 3800 }, { day: "Tue", value: 4100 }, { day: "Wed", value: 3600 },
      { day: "Thu", value: 4500 }, { day: "Fri", value: 5200 }, { day: "Sat", value: 6100 }, { day: "Sun", value: 4800 },
    ],
    "30d": Array.from({ length: 30 }, (_, i) => ({ day: `${i + 1}`, value: 3500 + Math.random() * 3000 })),
    "90d": Array.from({ length: 12 }, (_, i) => ({ day: `W${i + 1}`, value: 28000 + Math.random() * 15000 })),
  },
  "Food %": {
    "7d": [
      { day: "Mon", value: 30.1 }, { day: "Tue", value: 31.2 }, { day: "Wed", value: 29.8 },
      { day: "Thu", value: 32.5 }, { day: "Fri", value: 31.0 }, { day: "Sat", value: 33.2 }, { day: "Sun", value: 30.5 },
    ],
    "30d": Array.from({ length: 30 }, (_, i) => ({ day: `${i + 1}`, value: 28 + Math.random() * 6 })),
    "90d": Array.from({ length: 12 }, (_, i) => ({ day: `W${i + 1}`, value: 29 + Math.random() * 5 })),
  },
  "Labour %": {
    "7d": [
      { day: "Mon", value: 27.5 }, { day: "Tue", value: 28.1 }, { day: "Wed", value: 29.0 },
      { day: "Thu", value: 27.8 }, { day: "Fri", value: 26.5 }, { day: "Sat", value: 25.2 }, { day: "Sun", value: 28.8 },
    ],
    "30d": Array.from({ length: 30 }, (_, i) => ({ day: `${i + 1}`, value: 25 + Math.random() * 5 })),
    "90d": Array.from({ length: 12 }, (_, i) => ({ day: `W${i + 1}`, value: 26 + Math.random() * 4 })),
  },
  "Net %": {
    "7d": [
      { day: "Mon", value: 24.2 }, { day: "Tue", value: 25.8 }, { day: "Wed", value: 23.1 },
      { day: "Thu", value: 26.5 }, { day: "Fri", value: 28.0 }, { day: "Sat", value: 27.2 }, { day: "Sun", value: 25.5 },
    ],
    "30d": Array.from({ length: 30 }, (_, i) => ({ day: `${i + 1}`, value: 22 + Math.random() * 8 })),
    "90d": Array.from({ length: 12 }, (_, i) => ({ day: `W${i + 1}`, value: 23 + Math.random() * 6 })),
  },
};

export function TrendWidget() {
  const [metric, setMetric] = useState("Revenue");
  const [period, setPeriod] = useState("7d");

  const data = mockData[metric]?.[period] || [];
  const isRevenue = metric === "Revenue";

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Trends</p>

        {/* Metric toggles */}
        <div className="flex gap-1 flex-wrap">
          {metrics.map((m) => (
            <Button key={m} variant={metric === m ? "default" : "outline"} size="sm" className="text-[10px] h-6 px-2" onClick={() => setMetric(m)}>
              {m}
            </Button>
          ))}
        </div>

        {/* Period toggles */}
        <div className="flex gap-1">
          {periods.map((p) => (
            <Button key={p} variant={period === p ? "secondary" : "ghost"} size="sm" className="text-[10px] h-5 px-2" onClick={() => setPeriod(p)}>
              {p}
            </Button>
          ))}
        </div>

        {/* Chart */}
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
              <YAxis hide domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                formatter={(value: number) => [isRevenue ? `$${value.toLocaleString()}` : `${value.toFixed(1)}%`, metric]}
              />
              <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="url(#trendGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
