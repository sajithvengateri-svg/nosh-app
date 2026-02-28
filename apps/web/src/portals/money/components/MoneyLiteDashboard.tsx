import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, TrendingDown, PiggyBank, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

interface CostEntry {
  revenue: number;
  foodCost: number;
  bevCost: number;
  labour: number;
  overheads: number;
}

interface ChannelRevenue {
  channel: string;
  total: number;
}

const CHANNEL_COLORS: Record<string, string> = {
  instagram: "bg-pink-500",
  facebook: "bg-blue-600",
  tiktok: "bg-foreground",
  whatsapp: "bg-green-500",
  other: "bg-muted-foreground",
};

const MoneyLiteDashboard = () => {
  const { currentOrg } = useOrg();
  const [entry, setEntry] = useState<CostEntry>({
    revenue: 0, foodCost: 0, bevCost: 0, labour: 0, overheads: 0,
  });
  const [entryId, setEntryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [channelRevenue, setChannelRevenue] = useState<ChannelRevenue[]>([]);

  // Get current week start
  const getWeekStart = () => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().split("T")[0];
  };

  // Load existing entry
  useEffect(() => {
    if (!currentOrg?.id) return;
    const weekStart = getWeekStart();

    const load = async () => {
      const { data } = await supabase
        .from("money_lite_entries")
        .select("*")
        .eq("org_id", currentOrg.id)
        .eq("period_start", weekStart)
        .eq("period_type", "weekly")
        .maybeSingle();

      if (data) {
        setEntryId(data.id);
        setEntry({
          revenue: Number(data.revenue),
          foodCost: Number(data.food_cost),
          bevCost: Number(data.bev_cost),
          labour: Number(data.labour),
          overheads: Number(data.overheads),
        });
      }

      // Load social channel revenue for this week
      const { data: socialData } = await supabase
        .from("social_orders")
        .select("channel, amount")
        .eq("org_id", currentOrg.id)
        .gte("order_date", weekStart);

      if (socialData) {
        const map: Record<string, number> = {};
        socialData.forEach(r => {
          map[r.channel] = (map[r.channel] || 0) + Number(r.amount);
        });
        setChannelRevenue(Object.entries(map).map(([channel, total]) => ({ channel, total })));
      }
    };
    load();
  }, [currentOrg?.id]);

  const save = async () => {
    if (!currentOrg?.id) return;
    setSaving(true);
    const weekStart = getWeekStart();
    const payload = {
      org_id: currentOrg.id,
      period_start: weekStart,
      period_type: "weekly" as const,
      revenue: entry.revenue,
      food_cost: entry.foodCost,
      bev_cost: entry.bevCost,
      labour: entry.labour,
      overheads: entry.overheads,
      updated_at: new Date().toISOString(),
    };

    if (entryId) {
      await supabase.from("money_lite_entries").update(payload).eq("id", entryId);
    } else {
      const { data } = await supabase.from("money_lite_entries").insert(payload).select("id").single();
      if (data) setEntryId(data.id);
    }
    setSaving(false);
    toast.success("Saved");
  };

  const totalCosts = entry.foodCost + entry.bevCost + entry.labour + entry.overheads;
  const profit = entry.revenue - totalCosts;
  const profitPct = entry.revenue > 0 ? (profit / entry.revenue) * 100 : 0;
  const foodCostPct = entry.revenue > 0 ? (entry.foodCost / entry.revenue) * 100 : 0;

  const update = (key: keyof CostEntry, value: string) => {
    setEntry(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const sections: { key: keyof CostEntry; label: string; icon: React.ElementType; color: string }[] = [
    { key: "revenue", label: "Revenue", icon: TrendingUp, color: "text-emerald-600" },
    { key: "foodCost", label: "Food Cost", icon: DollarSign, color: "text-orange-600" },
    { key: "bevCost", label: "Beverage Cost", icon: DollarSign, color: "text-purple-600" },
    { key: "labour", label: "Labour", icon: DollarSign, color: "text-blue-600" },
    { key: "overheads", label: "Overheads", icon: DollarSign, color: "text-amber-600" },
  ];

  const maxChannelRev = Math.max(...channelRevenue.map(c => c.total), 1);

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-title font-display flex items-center gap-2">
          <PiggyBank className="w-7 h-7 text-primary" />
          Money Dashboard
        </h1>
        <p className="page-subtitle">Simple cost tracking for your kitchen</p>
      </motion.div>

      {/* Cost Entry Cards */}
      <div className="space-y-3">
        {sections.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${s.color}`} />
                      <Label className="text-sm font-medium">{s.label}</Label>
                    </div>
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={entry[s.key] || ""}
                        onChange={e => update(s.key, e.target.value)}
                        className="pl-7 text-right"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Save */}
      <Button className="w-full" onClick={save} disabled={saving}>
        {saving ? "Saving..." : "Save This Week"}
      </Button>

      {/* Summary */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Revenue</span>
              <span className="font-bold text-emerald-600">${entry.revenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Costs</span>
              <span className="font-bold text-red-600">${totalCosts.toFixed(2)}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Profit</span>
              <span className={`font-bold text-lg ${profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                ${profit.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Profit %</span>
              <span className={`font-semibold ${profitPct >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {profitPct.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Food Cost %</span>
              <span className={`font-semibold ${foodCostPct <= 30 ? "text-emerald-600" : foodCostPct <= 35 ? "text-amber-600" : "text-red-600"}`}>
                {foodCostPct.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Social Channel Revenue */}
      {channelRevenue.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Social Channel Revenue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {channelRevenue.map(c => (
                <div key={c.channel} className="flex items-center gap-2">
                  <span className="text-xs w-20 capitalize text-muted-foreground">{c.channel}</span>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${CHANNEL_COLORS[c.channel] || "bg-primary"}`}
                      style={{ width: `${(c.total / maxChannelRev) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-16 text-right">${c.total.toFixed(0)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default MoneyLiteDashboard;
