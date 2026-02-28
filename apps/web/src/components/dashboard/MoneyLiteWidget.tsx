import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";

interface WeekSummary {
  revenue: number;
  totalCosts: number;
  profit: number;
  profitPct: number;
}

const MoneyLiteWidget = () => {
  const { currentOrg } = useOrg();
  const [summary, setSummary] = useState<WeekSummary>({ revenue: 0, totalCosts: 0, profit: 0, profitPct: 0 });

  useEffect(() => {
    if (!currentOrg?.id) return;

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const startStr = weekStart.toISOString().split("T")[0];

    const fetchData = async () => {
      const { data } = await supabase
        .from("money_lite_entries")
        .select("*")
        .eq("org_id", currentOrg.id)
        .gte("period_start", startStr)
        .limit(1)
        .maybeSingle();

      if (data) {
        const rev = Number(data.revenue) || 0;
        const costs = Number(data.food_cost) + Number(data.bev_cost) + Number(data.labour) + Number(data.overheads);
        const prof = rev - costs;
        setSummary({
          revenue: rev,
          totalCosts: costs,
          profit: prof,
          profitPct: rev > 0 ? (prof / rev) * 100 : 0,
        });
      }
    };
    fetchData();
  }, [currentOrg?.id]);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-medium text-foreground">Money This Week</span>
          </div>
          <Badge variant={summary.profit >= 0 ? "default" : "destructive"} className="text-xs">
            {summary.profitPct.toFixed(1)}%
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center mb-3">
          <div>
            <p className="text-lg font-bold text-emerald-600">${summary.revenue.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Revenue</p>
          </div>
          <div>
            <p className="text-lg font-bold text-red-500">${summary.totalCosts.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Costs</p>
          </div>
          <div>
            <p className={`text-lg font-bold ${summary.profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              ${summary.profit.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">Profit</p>
          </div>
        </div>
        <Link to="/money-lite">
          <Button variant="outline" size="sm" className="w-full gap-2">
            Open Money Dashboard
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default MoneyLiteWidget;
