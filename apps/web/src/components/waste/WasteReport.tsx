import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWasteStats, useWasteLogs, REASON_LABELS } from "@/hooks/useWasteLogs";
import { format, subDays, startOfWeek, startOfMonth } from "date-fns";
import { Download, TrendingDown, DollarSign, Package, Users } from "lucide-react";
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Legend } from "recharts";

const COLORS = ["hsl(var(--destructive))", "hsl(var(--primary))", "hsl(var(--accent))", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4"];

interface WasteReportProps {
  module?: "food" | "beverage";
}

const WasteReport = ({ module }: WasteReportProps) => {
  const today = new Date().toISOString().split("T")[0];
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(today);

  const { data: stats, isLoading } = useWasteStats(module, dateFrom, dateTo);
  const { data: allLogs = [] } = useWasteLogs(module, { dateFrom, dateTo });

  const exportCSV = () => {
    if (!allLogs.length) return;
    const headers = ["Date", "Item", "Module", "Quantity", "Unit", "Cost", "Reason", "Status", "Logged By", "Notes"];
    const rows = allLogs.map((l) => [
      l.shift_date, l.item_name, l.module, l.quantity, l.unit, l.cost.toFixed(2),
      REASON_LABELS[l.reason] || l.reason, l.status, l.logged_by_name, l.notes || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `waste-report-${dateFrom}-to-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Date filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">From</label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">To</label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} disabled={!allLogs.length}>
          <Download className="w-4 h-4 mr-1" /> Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-destructive" />
            <div>
              <p className="text-xl font-bold text-foreground">${stats?.totalCost.toFixed(2) || "0.00"}</p>
              <p className="text-xs text-muted-foreground">Total Waste Cost</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Package className="w-8 h-8 text-primary" />
            <div>
              <p className="text-xl font-bold text-foreground">{stats?.totalItems || 0}</p>
              <p className="text-xs text-muted-foreground">Items Wasted</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingDown className="w-8 h-8 text-accent-foreground" />
            <div>
              <p className="text-xl font-bold text-foreground">{stats?.byReason?.[0]?.reason ? REASON_LABELS[stats.byReason[0].reason] : "—"}</p>
              <p className="text-xs text-muted-foreground">Top Reason</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <p className="text-xl font-bold text-foreground">{stats?.byStaff?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Staff Involved</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Daily Waste Cost</CardTitle></CardHeader>
          <CardContent>
            {stats?.dailyTrend && stats.dailyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <Tooltip />
                  <Area type="monotone" dataKey="cost" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive) / 0.2)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data</p>
            )}
          </CardContent>
        </Card>

        {/* By Reason Pie */}
        <Card>
          <CardHeader><CardTitle className="text-sm">By Reason</CardTitle></CardHeader>
          <CardContent>
            {stats?.byReason && stats.byReason.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={stats.byReason.map((r) => ({ ...r, name: REASON_LABELS[r.reason] || r.reason }))}
                    dataKey="cost"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats.byReason.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Offenders + Staff */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Top Wasted Items</CardTitle></CardHeader>
          <CardContent>
            {stats?.byItem && stats.byItem.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {stats.byItem.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-1 border-b border-border last:border-0">
                    <span className="text-sm text-foreground">{item.name}</span>
                    <div className="text-right">
                      <span className="text-sm font-medium text-destructive">${item.cost.toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground ml-2">({item.count}x)</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">By Staff Member</CardTitle></CardHeader>
          <CardContent>
            {stats?.byStaff && stats.byStaff.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.byStaff} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                  <Bar dataKey="cost" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WasteReport;
