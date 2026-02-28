import { useMemo } from "react";
import { format } from "date-fns";
import { CostSnapshot } from "@/hooks/useMenuCostSnapshots";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts";

interface DishTrendPopoverProps {
  dishName: string;
  currentFcPercent: number;
  trendData: CostSnapshot[];
}

export default function DishTrendPopover({ dishName, currentFcPercent, trendData }: DishTrendPopoverProps) {
  if (trendData.length === 0) return null;

  const lastSnapshot = trendData[trendData.length - 1];
  const diff = currentFcPercent - lastSnapshot.fcPercent;
  const isUp = diff > 0.5;
  const isDown = diff < -0.5;

  const chartData = useMemo(() => {
    const points = trendData.map(s => ({
      date: format(s.snapshotDate, "dd MMM"),
      fcPercent: Number(s.fcPercent.toFixed(1)),
    }));
    points.push({
      date: "Now",
      fcPercent: Number(currentFcPercent.toFixed(1)),
    });
    return points;
  }, [trendData, currentFcPercent]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={cn(
          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium transition-colors hover:bg-muted",
          isUp ? "text-destructive" : isDown ? "text-success" : "text-muted-foreground"
        )}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : isDown ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {Math.abs(diff) > 0.5 && `${diff > 0 ? "+" : ""}${diff.toFixed(1)}%`}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" side="left">
        <p className="text-sm font-semibold mb-1">{dishName} — FC% History</p>
        <p className="text-xs text-muted-foreground mb-3">
          Current: <span className={cn("font-medium", currentFcPercent > 30 ? "text-destructive" : "text-success")}>{currentFcPercent.toFixed(1)}%</span>
        </p>
        {chartData.length <= 2 ? (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {trendData.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-xs border-b pb-1 last:border-0">
                <span className="text-muted-foreground">{format(s.snapshotDate, "dd MMM yy")}</span>
                <div className="flex gap-3">
                  <span>Sell ${s.sellPrice.toFixed(2)}</span>
                  <span>Cost ${s.foodCost.toFixed(2)}</span>
                  <span className={cn("font-medium", s.fcPercent > 30 ? "text-destructive" : "text-success")}>
                    {s.fcPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} width={35} />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)}%`, "FC%"]}
                contentStyle={{ fontSize: 12, borderRadius: 8, backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              />
              <ReferenceLine y={30} stroke="hsl(var(--destructive))" strokeDasharray="3 3" strokeWidth={1} />
              <Line type="monotone" dataKey="fcPercent" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </PopoverContent>
    </Popover>
  );
}
