import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useSpring } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { cn } from "@/lib/utils";

interface WeekSummary {
  revenue: number;
  totalCosts: number;
  profit: number;
  profitPct: number;
  foodCost: number;
  bevCost: number;
  labour: number;
  overheads: number;
}

const AnimatedNumber = ({ value, prefix = "" }: { value: number; prefix?: string }) => {
  const [displayValue, setDisplayValue] = useState(`${prefix}0`);
  const spring = useSpring(0, { stiffness: 60, damping: 20 });

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (v) => {
      setDisplayValue(`${prefix}${Math.round(v).toLocaleString()}`);
    });
    return unsubscribe;
  }, [spring, prefix]);

  return <span>{displayValue}</span>;
};

const MoneyLiteAnimatedWidget = () => {
  const { currentOrg } = useOrg();
  const [summary, setSummary] = useState<WeekSummary>({
    revenue: 0, totalCosts: 0, profit: 0, profitPct: 0,
    foodCost: 0, bevCost: 0, labour: 0, overheads: 0,
  });
  const [loaded, setLoaded] = useState(false);

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
        const food = Number(data.food_cost) || 0;
        const bev = Number(data.bev_cost) || 0;
        const lab = Number(data.labour) || 0;
        const over = Number(data.overheads) || 0;
        const costs = food + bev + lab + over;
        const prof = rev - costs;
        setSummary({
          revenue: rev,
          totalCosts: costs,
          profit: prof,
          profitPct: rev > 0 ? (prof / rev) * 100 : 0,
          foodCost: food,
          bevCost: bev,
          labour: lab,
          overheads: over,
        });
      }
      setLoaded(true);
    };
    fetchData();
  }, [currentOrg?.id]);

  const costSegments = [
    { label: "Food", value: summary.foodCost, color: "bg-warning" },
    { label: "Bev", value: summary.bevCost, color: "bg-accent" },
    { label: "Labour", value: summary.labour, color: "bg-primary" },
    { label: "Overhead", value: summary.overheads, color: "bg-secondary" },
  ];

  const totalForBar = summary.revenue || 1;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              className="p-1.5 rounded-lg bg-primary/10"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <DollarSign className="w-4 h-4 text-primary" />
            </motion.div>
            <span className="text-sm font-semibold text-foreground">Weekly P&L</span>
          </div>
          <Badge variant={summary.profit >= 0 ? "default" : "destructive"} className="text-xs gap-1">
            {summary.profit >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {summary.profitPct.toFixed(1)}%
          </Badge>
        </div>

        {/* Animated Numbers */}
        <motion.div
          className="grid grid-cols-3 gap-3 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 10 }}
          transition={{ delay: 0.2 }}
        >
          <div>
            <p className="text-xl font-bold text-success">
              <AnimatedNumber value={summary.revenue} prefix="$" />
            </p>
            <p className="text-xs text-muted-foreground">Revenue</p>
          </div>
          <div>
            <p className="text-xl font-bold text-destructive">
              <AnimatedNumber value={summary.totalCosts} prefix="$" />
            </p>
            <p className="text-xs text-muted-foreground">Costs</p>
          </div>
          <div>
            <p className={cn("text-xl font-bold", summary.profit >= 0 ? "text-success" : "text-destructive")}>
              <AnimatedNumber value={summary.profit} prefix="$" />
            </p>
            <p className="text-xs text-muted-foreground">Profit</p>
          </div>
        </motion.div>

        {/* Cost breakdown bar */}
        <div className="space-y-1.5">
          <div className="h-3 rounded-full bg-muted overflow-hidden flex">
            {costSegments.map((seg, i) => {
              const pct = (seg.value / totalForBar) * 100;
              return (
                <motion.div
                  key={seg.label}
                  className={cn(seg.color, "h-full")}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.6, ease: "easeOut" }}
                />
              );
            })}
          </div>
          <div className="flex gap-3 flex-wrap">
            {costSegments.map(seg => (
              <span key={seg.label} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className={cn("w-2 h-2 rounded-full", seg.color)} />
                {seg.label} ${seg.value.toFixed(0)}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
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

export default MoneyLiteAnimatedWidget;
