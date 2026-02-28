import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, BarChart3, Lightbulb, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { calculatePourCost, calculateBTGMargin } from "@/lib/shared/calculations/bevCost";
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, ZAxis } from "recharts";
import BevCostCalculator from "../components/BevCostCalculator";
import { useState as useCalcState } from "react";

const BevEngineering = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCalc, setShowCalc] = useCalcState(false);

  useEffect(() => {
    if (!orgId) return;
    const load = async () => {
      setLoading(true);
      const { data } = await (supabase as any).from("bev_products").select("*").eq("org_id", orgId).order("name");
      setProducts(data || []);
      setLoading(false);
    };
    load();
  }, [orgId]);

  // Calculate matrix data
  const analyzed = products
    .filter(p => p.sell_price > 0 && p.purchase_price > 0)
    .map(p => {
      const pourCost = p.bottle_size_ml && p.pour_size_ml ? calculatePourCost(p.purchase_price, p.bottle_size_ml, p.pour_size_ml) : p.purchase_price;
      const margin = calculateBTGMargin(pourCost, p.sell_price);
      const popularity = p.pours_per_unit || 1; // placeholder
      const quadrant = margin >= 65 && popularity >= 5 ? "Star" : margin >= 65 ? "Puzzle" : popularity >= 5 ? "Plowhorse" : "Dog";
      return { ...p, pourCost, margin, popularity, quadrant };
    });

  const stars = analyzed.filter(a => a.quadrant === "Star");
  const plowhorses = analyzed.filter(a => a.quadrant === "Plowhorse");
  const puzzles = analyzed.filter(a => a.quadrant === "Puzzle");
  const dogs = analyzed.filter(a => a.quadrant === "Dog");

  const scatterData = analyzed.map(a => ({ x: a.popularity, y: a.margin, z: a.sell_price, name: a.name }));

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold font-display text-foreground">Drinks Engineering</h1>
        <p className="text-sm text-muted-foreground">BTG analysis, cocktail matrix, and pricing optimization</p>
      </motion.div>

      {/* Quadrant Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{stars.length}</p><p className="text-xs text-muted-foreground">⭐ Stars</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{plowhorses.length}</p><p className="text-xs text-muted-foreground">🐎 Plowhorses</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{puzzles.length}</p><p className="text-xs text-muted-foreground">🧩 Puzzles</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{dogs.length}</p><p className="text-xs text-muted-foreground">🐕 Dogs</p></CardContent></Card>
      </div>

      <Tabs defaultValue="matrix">
        <TabsList>
          <TabsTrigger value="matrix"><BarChart3 className="w-4 h-4 mr-1" /> Matrix</TabsTrigger>
          <TabsTrigger value="btg"><TrendingUp className="w-4 h-4 mr-1" /> BTG Analysis</TabsTrigger>
          <TabsTrigger value="calc" onClick={() => setShowCalc(true)}>
            <Calculator className="w-4 h-4 mr-1" /> Calculator
          </TabsTrigger>
          <TabsTrigger value="ai"><Lightbulb className="w-4 h-4 mr-1" /> Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix">
          {loading ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
          ) : analyzed.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Add products with pricing to see the drinks engineering matrix.</CardContent></Card>
          ) : (
            <Card>
              <CardHeader><CardTitle>Popularity vs Margin</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <XAxis dataKey="x" name="Popularity" />
                    <YAxis dataKey="y" name="Margin %" unit="%" />
                    <ZAxis dataKey="z" range={[40, 200]} />
                    <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(v: any, name: string) => [name === "y" ? `${v}%` : v, name === "y" ? "Margin" : name === "x" ? "Popularity" : "Price"]} />
                    <Scatter data={scatterData} fill="hsl(var(--primary))" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="btg" className="space-y-2">
          {analyzed.sort((a, b) => b.margin - a.margin).map(a => (
            <Card key={a.id}>
              <CardContent className="pt-3 pb-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{a.name}</p>
                  <p className="text-xs text-muted-foreground">Cost: ${a.pourCost.toFixed(2)} · Sell: ${a.sell_price.toFixed(2)} · {a.main_category}</p>
                </div>
                <div className="text-right">
                  <Badge variant={a.margin >= 70 ? "default" : a.margin >= 60 ? "secondary" : "destructive"}>{a.margin.toFixed(1)}% GP</Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">{a.quadrant}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="calc">
          <BevCostCalculator isOpen={true} onClose={() => {}} embedded />
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="w-5 h-5" /> Quick Insights</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {dogs.length > 0 && <p className="text-sm">🐕 <strong>{dogs.length} Dogs</strong> — low margin, low popularity. Consider removing or repricing: {dogs.slice(0, 3).map(d => d.name).join(", ")}</p>}
              {puzzles.length > 0 && <p className="text-sm">🧩 <strong>{puzzles.length} Puzzles</strong> — high margin but low popularity. Promote these: {puzzles.slice(0, 3).map(d => d.name).join(", ")}</p>}
              {stars.length > 0 && <p className="text-sm">⭐ <strong>{stars.length} Stars</strong> — keep these prominent on your menu: {stars.slice(0, 3).map(d => d.name).join(", ")}</p>}
              {analyzed.length === 0 && <p className="text-sm text-muted-foreground">Add drink products with pricing to get AI insights.</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BevEngineering;
