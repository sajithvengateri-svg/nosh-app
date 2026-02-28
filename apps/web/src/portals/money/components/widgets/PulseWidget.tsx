import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  revenue?: number;
  netPct?: number;
  targetNetPct?: number;
  breakEvenPct?: number;
  vsLastWeek?: number;
  vsLastMonth?: number;
}

export function PulseWidget({
  revenue = 4280,
  netPct = 26.5,
  targetNetPct = 25,
  breakEvenPct = 78,
  vsLastWeek = 8.2,
  vsLastMonth = -2.1,
}: Props) {
  const onTarget = netPct >= targetNetPct;

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Today's Pulse</p>
          <Badge variant={onTarget ? "default" : "destructive"} className="text-[10px]">
            {onTarget ? "On Target" : "Below Target"}
          </Badge>
        </div>

        <div className="text-center">
          <p className="text-4xl font-black text-foreground">${revenue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Revenue today</p>
        </div>

        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-1">
            {vsLastWeek >= 0 ? (
              <TrendingUp className="w-3 h-3 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3 h-3 text-destructive" />
            )}
            <span className={`text-xs font-semibold ${vsLastWeek >= 0 ? "text-emerald-400" : "text-destructive"}`}>
              {vsLastWeek > 0 ? "+" : ""}{vsLastWeek}%
            </span>
            <span className="text-[10px] text-muted-foreground">vs LW</span>
          </div>
          <div className="flex items-center gap-1">
            {vsLastMonth >= 0 ? (
              <TrendingUp className="w-3 h-3 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3 h-3 text-destructive" />
            )}
            <span className={`text-xs font-semibold ${vsLastMonth >= 0 ? "text-emerald-400" : "text-destructive"}`}>
              {vsLastMonth > 0 ? "+" : ""}{vsLastMonth}%
            </span>
            <span className="text-[10px] text-muted-foreground">vs LM</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Break-even progress</span>
            <span className="font-semibold text-foreground">{breakEvenPct}%</span>
          </div>
          <Progress value={breakEvenPct} className="h-2" />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Net Profit %</span>
          <span className={`text-lg font-bold ${onTarget ? "text-emerald-400" : "text-destructive"}`}>
            {netPct}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
