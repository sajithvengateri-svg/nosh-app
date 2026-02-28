import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const trendData = [
  { week: "W1", produce: 100, dairy: 100, meat: 100, seafood: 100 },
  { week: "W2", produce: 101, dairy: 99, meat: 102, seafood: 101 },
  { week: "W3", produce: 103, dairy: 100, meat: 103, seafood: 104 },
  { week: "W4", produce: 102, dairy: 101, meat: 105, seafood: 103 },
  { week: "W5", produce: 105, dairy: 102, meat: 104, seafood: 106 },
  { week: "W6", produce: 104, dairy: 103, meat: 108, seafood: 108 },
  { week: "W7", produce: 107, dairy: 102, meat: 107, seafood: 112 },
  { week: "W8", produce: 108, dairy: 104, meat: 110, seafood: 110 },
];

const alerts = [
  { ingredient: "Salmon Fillet", category: "Seafood", drift: 8.2, supplier: "Seafood Market", benchmark: "$38/kg", current: "$41.12/kg" },
  { ingredient: "Olive Oil 5L", category: "Pantry", drift: 4.1, supplier: "Mediterranean Imports", benchmark: "$28", current: "$29.15" },
  { ingredient: "Scotch Fillet", category: "Meat", drift: 6.5, supplier: "Premium Meats", benchmark: "$52/kg", current: "$55.38/kg" },
  { ingredient: "Butter 250g", category: "Dairy", drift: -3.5, supplier: "Dairy Direct", benchmark: "$4.20", current: "$4.05" },
  { ingredient: "Flour 12.5kg", category: "Bakery", drift: 2.1, supplier: "Baker's Supply", benchmark: "$14", current: "$14.29" },
];

const comparisonMatrix = [
  { ingredient: "Salmon Fillet", fresh: "$42/kg", premium: "—", seafood: "$41/kg", med: "—", best: "Seafood Market" },
  { ingredient: "Chicken Breast", fresh: "—", premium: "$14/kg", seafood: "—", med: "—", best: "Premium Meats" },
  { ingredient: "Roma Tomatoes", fresh: "$4.50/kg", premium: "—", seafood: "—", med: "$5.20/kg", best: "Fresh Produce" },
  { ingredient: "Olive Oil 5L", fresh: "—", premium: "—", seafood: "—", med: "$29.15", best: "Med. Imports" },
  { ingredient: "Butter 250g", fresh: "—", premium: "—", seafood: "—", med: "—", best: "Dairy Direct" },
];

export default function SupplyPriceWatch() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Price Watch</h1>
        <p className="text-muted-foreground text-sm">Track price trends and detect supplier drift</p>
      </div>

      <Tabs defaultValue="trends">
        <TabsList>
          <TabsTrigger value="trends">Price Trends</TabsTrigger>
          <TabsTrigger value="alerts">Drift Alerts</TabsTrigger>
          <TabsTrigger value="compare">Supplier Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Category Price Index (8 weeks, base = 100)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[95, 115]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="produce" stroke="#22c55e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="dairy" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="meat" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="seafood" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-4 space-y-3">
          {alerts.map((a) => (
            <Card key={a.ingredient}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {a.drift > 0 ? <TrendingUp className="w-5 h-5 text-destructive" /> : <TrendingDown className="w-5 h-5 text-emerald-400" />}
                  <div>
                    <p className="font-semibold text-foreground">{a.ingredient}</p>
                    <p className="text-xs text-muted-foreground">{a.supplier} · {a.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <p className="text-sm text-foreground">{a.current}</p>
                    <p className="text-xs text-muted-foreground">Benchmark: {a.benchmark}</p>
                  </div>
                  <Badge variant={Math.abs(a.drift) > 5 ? "destructive" : "secondary"}>
                    {a.drift > 0 ? "+" : ""}{a.drift}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="compare" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Supplier Price Comparison</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium">Ingredient</th>
                      <th className="text-center py-2 text-muted-foreground font-medium">Fresh Produce</th>
                      <th className="text-center py-2 text-muted-foreground font-medium">Premium Meats</th>
                      <th className="text-center py-2 text-muted-foreground font-medium">Seafood Mkt</th>
                      <th className="text-center py-2 text-muted-foreground font-medium">Med. Imports</th>
                      <th className="text-center py-2 text-muted-foreground font-medium">Best</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonMatrix.map((r) => (
                      <tr key={r.ingredient} className="border-b border-border">
                        <td className="py-2 font-medium text-foreground">{r.ingredient}</td>
                        <td className="py-2 text-center text-muted-foreground">{r.fresh}</td>
                        <td className="py-2 text-center text-muted-foreground">{r.premium}</td>
                        <td className="py-2 text-center text-muted-foreground">{r.seafood}</td>
                        <td className="py-2 text-center text-muted-foreground">{r.med}</td>
                        <td className="py-2 text-center"><Badge variant="outline">{r.best}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
