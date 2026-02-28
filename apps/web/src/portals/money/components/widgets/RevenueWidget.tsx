import { Card, CardContent } from "@/components/ui/card";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface Props {
  today?: number;
  wtd?: number;
  mtd?: number;
  avgTicket?: number;
  covers?: number;
  sparkline?: number[];
}

export function RevenueWidget({
  today = 4280,
  wtd = 22450,
  mtd = 52400,
  avgTicket = 68,
  covers = 63,
  sparkline = [3200, 4100, 3800, 4500, 5200, 6100, 4280],
}: Props) {
  const sparkData = sparkline.map((v, i) => ({ v, i }));

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Revenue</p>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-foreground">${today.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Today</p>
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">${(wtd / 1000).toFixed(1)}k</p>
            <p className="text-[10px] text-muted-foreground">WTD</p>
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">${(mtd / 1000).toFixed(1)}k</p>
            <p className="text-[10px] text-muted-foreground">MTD</p>
          </div>
        </div>

        <div className="h-12">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke="hsl(var(--primary))" fill="url(#revGrad)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{covers} covers</span>
          <span>${avgTicket} avg ticket</span>
        </div>
      </CardContent>
    </Card>
  );
}
