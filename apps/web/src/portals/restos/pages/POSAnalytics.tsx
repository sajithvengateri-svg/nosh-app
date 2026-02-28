import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { usePOSOrders, usePOSPayments } from "../hooks/usePOSData";
import { format, subDays, startOfWeek, startOfMonth } from "date-fns";
import { Loader2 } from "lucide-react";

type DateRange = "today" | "week" | "month";

export default function POSAnalytics() {
  const [range, setRange] = useState<DateRange>("week");

  const startDate = useMemo(() => {
    const now = new Date();
    if (range === "today") return format(now, "yyyy-MM-dd");
    if (range === "week") return format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
    return format(startOfMonth(now), "yyyy-MM-dd");
  }, [range]);

  const { data: orders = [], isLoading: loadingOrders } = usePOSOrders();
  const { data: payments = [], isLoading: loadingPayments } = usePOSPayments(startDate);

  const isLoading = loadingOrders || loadingPayments;

  // Revenue by day
  const revenueByDay = useMemo(() => {
    const map: Record<string, { revenue: number; covers: number }> = {};
    (orders as any[]).forEach((o) => {
      if (o.created_at < startDate) return;
      const day = format(new Date(o.created_at), "EEE");
      if (!map[day]) map[day] = { revenue: 0, covers: 0 };
      map[day].revenue += Number(o.total || 0);
      map[day].covers += Number(o.cover_count || 1);
    });
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      .map((day) => ({ day, revenue: map[day]?.revenue || 0, covers: map[day]?.covers || 0 }));
  }, [orders, startDate]);

  const totalRevenue = revenueByDay.reduce((s, d) => s + d.revenue, 0);
  const totalCovers = revenueByDay.reduce((s, d) => s + d.covers, 0);
  const avgTicket = totalCovers > 0 ? totalRevenue / totalCovers : 0;

  // Top sellers from order items
  const topSellers = useMemo(() => {
    const map: Record<string, { qty: number; revenue: number }> = {};
    (orders as any[]).forEach((o) => {
      if (o.created_at < startDate) return;
      (o.items || []).forEach((item: any) => {
        const name = item.item_name || item.name || "Unknown";
        if (!map[name]) map[name] = { qty: 0, revenue: 0 };
        map[name].qty += item.quantity || 1;
        map[name].revenue += Number(item.line_total || item.unit_price || 0) * (item.quantity || 1);
      });
    });
    return Object.entries(map)
      .map(([item, v]) => ({ item, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [orders, startDate]);

  // Payment methods
  const paymentMethods = useMemo(() => {
    const map: Record<string, number> = {};
    (payments as any[]).forEach((p) => {
      const method = p.method || "Other";
      map[method] = (map[method] || 0) + Number(p.amount || 0);
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    const colors: Record<string, string> = { CARD: "hsl(346, 84%, 61%)", CASH: "hsl(215, 20%, 65%)", EFTPOS: "hsl(142, 76%, 36%)", OTHER: "hsl(280, 67%, 60%)" };
    return Object.entries(map).map(([name, value]) => ({
      name,
      value: total > 0 ? Math.round((value / total) * 100) : 0,
      color: colors[name.toUpperCase()] || "hsl(215, 20%, 50%)",
    }));
  }, [payments]);

  // Voids analysis from orders
  const voidAnalysis = useMemo(() => {
    let voids = 0, discounts = 0, refunds = 0;
    let voidCount = 0, discountCount = 0, refundCount = 0;
    (orders as any[]).forEach((o) => {
      if (o.created_at < startDate) return;
      if (o.status === "VOIDED") { voids += Number(o.total || 0); voidCount++; }
      if (Number(o.discount_amount || 0) > 0) { discounts += Number(o.discount_amount); discountCount++; }
      if (o.status === "REFUNDED") { refunds += Number(o.total || 0); refundCount++; }
    });
    return [
      { type: "Voids", count: voidCount, value: voids },
      { type: "Discounts", count: discountCount, value: discounts },
      { type: "Refunds", count: refundCount, value: refunds },
    ];
  }, [orders, startDate]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Sales Analytics</h1>
          <p className="text-sm text-slate-400">Revenue, trends, and performance insights</p>
        </div>
        <div className="flex gap-1">
          {(["today", "week", "month"] as DateRange[]).map((r) => (
            <Button
              key={r}
              variant="ghost"
              size="sm"
              onClick={() => setRange(r)}
              className={range === r ? "bg-white/10 text-white" : "text-slate-400"}
            >
              {r === "today" ? "Today" : r === "week" ? "This Week" : "This Month"}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : (
        <Tabs defaultValue="revenue">
          <TabsList className="bg-white/5">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="items">Top Sellers</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="voids">Voids & Discounts</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="mt-4 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-white/5 border-white/10"><CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-white">${totalRevenue.toLocaleString()}</p><p className="text-xs text-slate-400">{range === "today" ? "Today's" : range === "week" ? "Weekly" : "Monthly"} Revenue</p>
              </CardContent></Card>
              <Card className="bg-white/5 border-white/10"><CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-white">{totalCovers}</p><p className="text-xs text-slate-400">Total Covers</p>
              </CardContent></Card>
              <Card className="bg-white/5 border-white/10"><CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-white">${avgTicket.toFixed(2)}</p><p className="text-xs text-slate-400">Avg per Cover</p>
              </CardContent></Card>
            </div>
            <Card className="bg-white/5 border-white/10">
              <CardHeader><CardTitle className="text-sm text-white">Revenue by Day</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={revenueByDay}>
                    <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ background: "#1e293b", border: "none", color: "#fff" }} />
                    <Bar dataKey="revenue" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="items" className="mt-4">
            <Card className="bg-white/5 border-white/10">
              <CardHeader><CardTitle className="text-sm text-white">Top Sellers</CardTitle></CardHeader>
              <CardContent>
                {topSellers.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">No order data for this period</p>
                ) : (
                  <div className="space-y-2">
                    {topSellers.map((item, i) => (
                      <div key={item.item} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 w-5">#{i + 1}</span>
                          <span className="text-sm text-white">{item.item}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-slate-400">{item.qty} sold</span>
                          <span className="text-sm font-semibold text-white">${item.revenue.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <Card className="bg-white/5 border-white/10">
              <CardHeader><CardTitle className="text-sm text-white">Payment Method Breakdown</CardTitle></CardHeader>
              <CardContent className="flex justify-center">
                {paymentMethods.length === 0 ? (
                  <p className="text-sm text-slate-500 py-8">No payment data for this period</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={paymentMethods} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name} ${value}%`}>
                        {paymentMethods.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="voids" className="mt-4">
            <Card className="bg-white/5 border-white/10">
              <CardHeader><CardTitle className="text-sm text-white">Void / Discount / Refund Analysis</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {voidAnalysis.map((v) => (
                  <div key={v.type} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-sm text-white">{v.type}</span>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary" className="bg-white/10 text-slate-300">{v.count}x</Badge>
                      <span className="text-sm font-semibold text-white">${v.value.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 text-sm">
                  <span className="text-slate-400">Total Leakage</span>
                  <span className="font-bold text-rose-400">${voidAnalysis.reduce((s, v) => s + v.value, 0).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
