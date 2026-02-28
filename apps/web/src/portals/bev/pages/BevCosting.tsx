import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calculator, TrendingDown, AlertTriangle } from "lucide-react";
import BevCostCalculator from "../components/BevCostCalculator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";

interface SpecMargin {
  id: string;
  name: string;
  category: string;
  storedCost: number;
  liveCost: number;
  sellPrice: number;
  gpPercent: number;
  costDelta: number;
}

const GP_THRESHOLD = 75;

const BevCosting = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const [specs, setSpecs] = useState<SpecMargin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    const fetchMargins = async () => {
      setLoading(true);
      // Fetch specs + their ingredients with linked product prices
      const { data: specData } = await (supabase as any)
        .from("bev_cocktail_specs")
        .select("id, name, category, cost_price, sell_price")
        .eq("org_id", orgId);

      const { data: ingredientData } = await (supabase as any)
        .from("bev_cocktail_ingredients")
        .select("spec_id, quantity_ml, cost, bev_products(purchase_price, bottle_size_ml)")
        .eq("org_id", orgId);

      if (!specData) { setLoading(false); return; }

      // Group ingredients by spec
      const ingredientsBySpec = new Map<string, any[]>();
      for (const ing of (ingredientData || [])) {
        const list = ingredientsBySpec.get(ing.spec_id) || [];
        list.push(ing);
        ingredientsBySpec.set(ing.spec_id, list);
      }

      const results: SpecMargin[] = specData.map((spec: any) => {
        const ings = ingredientsBySpec.get(spec.id) || [];
        // Calculate live cost from current product prices
        let liveCost = 0;
        for (const ing of ings) {
          const bottlePrice = ing.bev_products?.purchase_price || 0;
          const bottleSize = ing.bev_products?.bottle_size_ml || 750;
          const perMl = bottleSize > 0 ? bottlePrice / bottleSize : 0;
          liveCost += perMl * (ing.quantity_ml || 0);
        }
        // If no ingredients linked, fall back to stored cost
        if (ings.length === 0) liveCost = spec.cost_price || 0;
        const sellPrice = spec.sell_price || 0;
        const gpPercent = sellPrice > 0 ? ((sellPrice - liveCost) / sellPrice) * 100 : 0;
        return {
          id: spec.id,
          name: spec.name,
          category: spec.category,
          storedCost: spec.cost_price || 0,
          liveCost: Math.round(liveCost * 100) / 100,
          sellPrice,
          gpPercent: Math.round(gpPercent * 10) / 10,
          costDelta: Math.round((liveCost - (spec.cost_price || 0)) * 100) / 100,
        };
      });

      // Sort: worst GP first
      results.sort((a, b) => a.gpPercent - b.gpPercent);
      setSpecs(results);
      setLoading(false);
    };
    fetchMargins();
  }, [orgId]);

  const atRisk = specs.filter(s => s.gpPercent < GP_THRESHOLD);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold font-display flex items-center gap-2 text-foreground">
          <Calculator className="w-6 h-6 text-primary" />
          Beverage Cost Calculator
        </h1>
        <p className="text-sm text-muted-foreground">Quick cost calculations & live margin tracking</p>
      </motion.div>

      <Tabs defaultValue="calculator">
        <TabsList>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="margin-watch">
            Margin Watch
            {atRisk.length > 0 && (
              <Badge variant="destructive" className="ml-1.5 text-[10px] px-1.5 py-0">{atRisk.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator">
          <BevCostCalculator isOpen={true} onClose={() => {}} embedded />
        </TabsContent>

        <TabsContent value="margin-watch" className="space-y-4">
          {atRisk.length > 0 && (
            <Card className="border-destructive/50">
              <CardContent className="pt-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <span className="font-medium text-sm">{atRisk.length} spec{atRisk.length !== 1 ? "s" : ""} below {GP_THRESHOLD}% GP</span>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Loading specs...</CardContent></Card>
          ) : specs.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No cocktail specs found. Create specs to track margins.</CardContent></Card>
          ) : (
            specs.map(spec => (
              <Card key={spec.id} className={spec.gpPercent < GP_THRESHOLD ? "border-destructive/30" : ""}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{spec.name}</p>
                      <Badge variant="secondary" className="text-[10px]">{spec.category}</Badge>
                    </div>
                    <span className={`text-sm font-bold ${spec.gpPercent < GP_THRESHOLD ? "text-destructive" : "text-emerald-600"}`}>
                      {spec.gpPercent}% GP
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Cost: ${spec.liveCost.toFixed(2)}</span>
                    <span>Sell: ${spec.sellPrice.toFixed(2)}</span>
                    {spec.costDelta !== 0 && (
                      <span className={`flex items-center gap-0.5 ${spec.costDelta > 0 ? "text-destructive" : "text-emerald-600"}`}>
                        <TrendingDown className={`w-3 h-3 ${spec.costDelta > 0 ? "rotate-180" : ""}`} />
                        {spec.costDelta > 0 ? "+" : ""}${spec.costDelta.toFixed(2)} vs stored
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BevCosting;
