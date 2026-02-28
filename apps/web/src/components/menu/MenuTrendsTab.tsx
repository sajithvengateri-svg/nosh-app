import { useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import { useMenuCostSnapshots, CostSnapshot } from "@/hooks/useMenuCostSnapshots";
import { cn } from "@/lib/utils";
import { TrendingUp, BarChart3, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

const RANGE_OPTIONS = [
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "6mo", days: 180 },
  { label: "All", days: 0 },
] as const;

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#ec4899",
];

export default function MenuTrendsTab() {
  const { snapshots, isLoading } = useMenuCostSnapshots();
  const [rangeDays, setRangeDays] = useState(90);
  const [selectedDishes, setSelectedDishes] = useState<Set<string>>(new Set());
  const [showDishFilter, setShowDishFilter] = useState(false);

  // Filter snapshots by date range
  const filtered = useMemo(() => {
    if (rangeDays === 0) return snapshots;
    const cutoff = subDays(new Date(), rangeDays);
    return snapshots.filter((s) => s.snapshotDate >= cutoff);
  }, [snapshots, rangeDays]);

  // Unique dish names
  const dishNames = useMemo(() => {
    const names = new Set(snapshots.map((s) => s.dishName));
    return Array.from(names).sort();
  }, [snapshots]);

  // Initialize selected dishes on first load
  useMemo(() => {
    if (selectedDishes.size === 0 && dishNames.length > 0) {
      setSelectedDishes(new Set(dishNames.slice(0, 5)));
    }
  }, [dishNames]);

  // 1. Aggregate FC% over time (average of all dishes per date)
  const aggregateData = useMemo(() => {
    const byDate = new Map<string, { total: number; count: number }>();
    for (const s of filtered) {
      const key = format(s.snapshotDate, "dd MMM yy");
      const entry = byDate.get(key) || { total: 0, count: 0 };
      entry.total += s.fcPercent;
      entry.count += 1;
      byDate.set(key, entry);
    }
    return Array.from(byDate.entries())
      .map(([date, { total, count }]) => ({
        date,
        avgFc: Number((total / count).toFixed(1)),
      }))
      .reverse();
  }, [filtered]);

  // 2. Per-dish trends (multi-line)
  const perDishData = useMemo(() => {
    const dates = new Map<string, Record<string, number>>();
    for (const s of filtered) {
      if (!selectedDishes.has(s.dishName)) continue;
      const key = format(s.snapshotDate, "dd MMM yy");
      if (!dates.has(key)) dates.set(key, {});
      dates.get(key)![s.dishName] = Number(s.fcPercent.toFixed(1));
    }
    return Array.from(dates.entries())
      .map(([date, values]) => ({ date, ...values }))
      .reverse();
  }, [filtered, selectedDishes]);

  // 3. Category breakdown (avg FC% per category derived from dish names)
  const categoryData = useMemo(() => {
    const byCat = new Map<string, { total: number; count: number }>();
    for (const s of filtered) {
      // We don't have category on snapshots directly, group by menu
      const key = s.menuId || "unknown";
      const entry = byCat.get(key) || { total: 0, count: 0 };
      entry.total += s.fcPercent;
      entry.count += 1;
      byCat.set(key, entry);
    }
    return Array.from(byCat.entries())
      .map(([menuId, { total, count }]) => ({
        name: menuId.slice(0, 8),
        avgFc: Number((total / count).toFixed(1)),
      }))
      .sort((a, b) => b.avgFc - a.avgFc);
  }, [filtered]);

  const toggleDish = (name: string) => {
    setSelectedDishes((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-elevated p-6 h-48 animate-pulse bg-muted/30 rounded-xl" />
        ))}
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="card-elevated p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
          <TrendingUp className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">No Trend Data Yet</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Cost snapshots are created when menus are archived. Archive a costed menu to start
          tracking trends over time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date range selector */}
      <div className="flex items-center gap-2">
        {RANGE_OPTIONS.map((opt) => (
          <Button
            key={opt.label}
            size="sm"
            variant={rangeDays === opt.days ? "default" : "outline"}
            className="h-7 px-3 text-xs rounded-full"
            onClick={() => setRangeDays(opt.days)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* 1. Aggregate FC% over time */}
      <div className="card-elevated overflow-hidden">
        <div className="p-5 border-b border-border">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <TrendingUp className="w-3 h-3" />Avg Food Cost % Over Time
          </span>
        </div>
        <div className="p-4">
          {aggregateData.length < 2 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Need at least 2 snapshots to display a chart.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={aggregateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} width={40} />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, "Avg FC%"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                />
                <ReferenceLine y={30} stroke="hsl(var(--destructive))" strokeDasharray="3 3" strokeWidth={1} label={{ value: "30%", position: "right", fontSize: 10, fill: "hsl(var(--destructive))" }} />
                <Line type="monotone" dataKey="avgFc" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Per-dish cost trends */}
      <div className="card-elevated overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <TrendingUp className="w-3 h-3" />Per-Dish FC% Trends
          </span>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowDishFilter(!showDishFilter)}>
            <Filter className="w-3 h-3 mr-1" />
            {selectedDishes.size} dishes
          </Button>
        </div>
        {showDishFilter && (
          <div className="border-b border-border px-5 py-3">
            <ScrollArea className="max-h-32">
              <div className="flex flex-wrap gap-2">
                {dishNames.map((name) => (
                  <label key={name} className="inline-flex items-center gap-1.5 text-xs cursor-pointer">
                    <Checkbox
                      checked={selectedDishes.has(name)}
                      onCheckedChange={() => toggleDish(name)}
                      className="h-3.5 w-3.5"
                    />
                    {name}
                  </label>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
        <div className="p-4">
          {perDishData.length < 2 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Select dishes and ensure at least 2 snapshots exist.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={perDishData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} width={40} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  formatter={(value: number, name: string) => [`${value}%`, name]}
                />
                <ReferenceLine y={30} stroke="hsl(var(--destructive))" strokeDasharray="3 3" strokeWidth={1} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {Array.from(selectedDishes).map((dish, i) => (
                  <Line
                    key={dish}
                    type="monotone"
                    dataKey={dish}
                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 3. Category / Menu breakdown */}
      <div className="card-elevated overflow-hidden">
        <div className="p-5 border-b border-border">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-foreground text-xs font-semibold">
            <BarChart3 className="w-3 h-3" />Avg FC% by Menu Snapshot
          </span>
        </div>
        <div className="p-4">
          {categoryData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} width={40} />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, "Avg FC%"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                />
                <ReferenceLine y={30} stroke="hsl(var(--destructive))" strokeDasharray="3 3" strokeWidth={1} />
                <Bar dataKey="avgFc" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
