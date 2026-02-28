import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Store, TrendingUp, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const BevMarketplace = () => {
  const [insights, setInsights] = useState<any[]>([]);
  const [vendorPricing, setVendorPricing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [insightsRes, pricingRes] = await Promise.all([
        (supabase as any).from("bev_demand_insights").select("*").order("total_quantity", { ascending: false }).limit(20),
        (supabase as any).from("bev_vendor_pricing").select("*").eq("is_available", true).order("product_name").limit(30),
      ]);
      setInsights(insightsRes.data || []);
      setVendorPricing(pricingRes.data || []);
      setLoading(false);
    };
    load();
  }, []);

  const chartData = insights.slice(0, 10).map(i => ({ name: i.product_name || i.product_category, qty: i.total_quantity }));

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold font-display text-foreground">Beverage Marketplace</h1>
        <p className="text-sm text-muted-foreground">Demand insights and vendor deals for beverages</p>
      </motion.div>

      <Tabs defaultValue="demand">
        <TabsList>
          <TabsTrigger value="demand"><TrendingUp className="w-4 h-4 mr-1" /> Demand</TabsTrigger>
          <TabsTrigger value="deals"><Package className="w-4 h-4 mr-1" /> Vendor Pricing ({vendorPricing.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="demand">
          {loading ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
          ) : chartData.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No demand data available yet.</CardContent></Card>
          ) : (
            <Card>
              <CardHeader><CardTitle>Top Beverage Demand</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="qty" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="deals" className="space-y-2">
          {vendorPricing.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No vendor pricing available.</CardContent></Card>
          ) : (
            vendorPricing.map(v => (
              <Card key={v.id}>
                <CardContent className="pt-3 pb-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{v.product_name}</p>
                    <p className="text-xs text-muted-foreground">{v.producer || v.category} · {v.region || ""} {v.format || ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">${v.price_per_unit.toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">Min: {v.min_order_qty}</p>
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

export default BevMarketplace;
