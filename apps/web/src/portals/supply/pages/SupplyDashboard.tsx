import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, FileText, DollarSign, Building2, AlertTriangle, TrendingUp, PackageCheck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const stats = [
  { label: "Open POs", value: "12", icon: ShoppingCart, color: "text-blue-400" },
  { label: "Pending Invoices", value: "8", icon: FileText, color: "text-amber-400" },
  { label: "Spend MTD", value: "$24,680", icon: DollarSign, color: "text-emerald-400" },
  { label: "Active Suppliers", value: "18", icon: Building2, color: "text-purple-400" },
];

const recentPOs = [
  { id: "PO-2024-089", supplier: "Fresh Produce Co", total: "$1,240", status: "Sent", date: "Feb 15" },
  { id: "PO-2024-088", supplier: "Premium Meats", total: "$3,890", status: "Partial", date: "Feb 14" },
  { id: "PO-2024-087", supplier: "Dairy Direct", total: "$780", status: "Complete", date: "Feb 13" },
  { id: "PO-2024-086", supplier: "Baker's Supply", total: "$560", status: "Draft", date: "Feb 12" },
  { id: "PO-2024-085", supplier: "Seafood Market", total: "$2,100", status: "Sent", date: "Feb 11" },
];

const priceAlerts = [
  { ingredient: "Salmon Fillet", supplier: "Seafood Market", drift: "+8.2%", severity: "high" },
  { ingredient: "Olive Oil (5L)", supplier: "Mediterranean Imports", drift: "+4.1%", severity: "medium" },
  { ingredient: "Butter", supplier: "Dairy Direct", drift: "-3.5%", severity: "low" },
];

const spendBySupplier = [
  { name: "Premium Meats", spend: 8200 },
  { name: "Fresh Produce", spend: 5400 },
  { name: "Seafood Market", spend: 4100 },
  { name: "Dairy Direct", spend: 3200 },
  { name: "Baker's Supply", spend: 2100 },
  { name: "Others", spend: 1680 },
];

const receivingQueue = [
  { po: "PO-2024-089", supplier: "Fresh Produce Co", expected: "Today", items: 14 },
  { po: "PO-2024-088", supplier: "Premium Meats", expected: "Tomorrow", items: 8 },
  { po: "PO-2024-085", supplier: "Seafood Market", expected: "Feb 19", items: 6 },
];

const statusColors: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  Sent: "bg-blue-500/20 text-blue-400",
  Partial: "bg-amber-500/20 text-amber-400",
  Complete: "bg-emerald-500/20 text-emerald-400",
};

export default function SupplyDashboard() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">SupplyOS</h1>
        <p className="text-muted-foreground text-sm">Procurement, supplier orders & invoice matching</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-8 h-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent POs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" /> Recent Purchase Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentPOs.map((po) => (
              <div key={po.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{po.id}</p>
                  <p className="text-xs text-muted-foreground">{po.supplier} · {po.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{po.total}</span>
                  <Badge className={statusColors[po.status]} variant="secondary">{po.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Suppliers by Spend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Top Suppliers by Spend (MTD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={spendBySupplier} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Spend"]} />
                <Bar dataKey="spend" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Price Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Price Drift Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {priceAlerts.map((a) => (
              <div key={a.ingredient} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{a.ingredient}</p>
                  <p className="text-xs text-muted-foreground">{a.supplier}</p>
                </div>
                <Badge variant={a.severity === "high" ? "destructive" : a.severity === "medium" ? "secondary" : "outline"}>
                  {a.drift}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Receiving Queue */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <PackageCheck className="w-4 h-4" /> Receiving Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {receivingQueue.map((r) => (
              <div key={r.po} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.po}</p>
                  <p className="text-xs text-muted-foreground">{r.supplier}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-foreground">{r.expected}</p>
                  <p className="text-xs text-muted-foreground">{r.items} items</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
