import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVendorAuth } from "@/hooks/useVendorAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Star, Tag, Package, BarChart3, Eye, ShoppingCart, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const VendorBetaAnalytics = () => {
  const { vendorProfile } = useVendorAuth();

  const { data: products = [] } = useQuery({
    queryKey: ["vendor-analytics-products", vendorProfile?.id],
    enabled: !!vendorProfile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("vendor_beta_products")
        .select("*")
        .eq("vendor_id", vendorProfile!.id);
      return data || [];
    },
  });

  const { data: deals = [] } = useQuery({
    queryKey: ["vendor-analytics-deals", vendorProfile?.id],
    enabled: !!vendorProfile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("vendor_beta_deals")
        .select("*")
        .eq("vendor_id", vendorProfile!.id);
      return data || [];
    },
  });

  const { data: demand = [] } = useQuery({
    queryKey: ["vendor-analytics-demand", vendorProfile?.id],
    enabled: !!vendorProfile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("vendor_beta_demand")
        .select("*")
        .eq("vendor_id", vendorProfile!.id);
      return data || [];
    },
  });

  // Stats
  const totalProducts = products.length;
  const inStock = products.filter((p) => p.in_stock).length;
  const dualPriced = products.filter((p) => p.price_homechef && p.price_chefos).length;
  const activeDeals = deals.filter((d) => d.status === "active").length;
  const totalImpressions = deals.reduce((s, d) => s + (d.impressions || 0), 0);
  const totalClicks = deals.reduce((s, d) => s + (d.clicks || 0), 0);
  const totalRedemptions = deals.reduce((s, d) => s + (d.redemptions || 0), 0);
  const convRate = totalImpressions > 0 ? ((totalRedemptions / totalImpressions) * 100).toFixed(1) : "0";
  const totalDemand = demand.reduce((s, d) => s + (d.demand_count || 0), 0);
  const score = vendorProfile?.quality_score ?? 0;

  const scoreColor = score >= 70 ? "text-emerald-400" : score >= 40 ? "text-yellow-400" : "text-red-400";
  const scoreBg = score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          Beta Analytics
        </h1>
        <p className="text-muted-foreground mt-1">Your performance in the ChefOS beta</p>
      </div>

      {/* Quality Score */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="currentColor" strokeWidth="2" className="text-muted"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" strokeWidth="2" strokeDasharray={`${score}, 100`}
                  className={cn(scoreBg.replace("bg-", "stroke-"))}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn("text-xl font-bold", scoreColor)}>{score}</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Quality Score</h3>
              <p className="text-sm text-muted-foreground">
                Based on onboarding, engagement, catalogue, deals, and responsiveness
              </p>
              <div className="flex gap-2 mt-2">
                {["Onboarding", "Engagement", "Catalogue", "Deals", "Responsiveness"].map((label) => (
                  <Badge key={label} variant="outline" className="text-[10px]">{label}: /20</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Products", value: totalProducts, icon: Package, sub: `${inStock} in stock` },
          { label: "Dual Priced", value: dualPriced, icon: RefreshCw, sub: `of ${totalProducts}` },
          { label: "Active Deals", value: activeDeals, icon: Tag, sub: `${totalRedemptions} redeemed` },
          { label: "Total Demand", value: totalDemand, icon: TrendingUp, sub: "ingredient requests" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
                </div>
                <stat.icon className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Deal performance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Deal Performance Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 text-center p-3 rounded-lg bg-muted/30">
              <Eye className="w-5 h-5 mx-auto text-blue-400" />
              <p className="text-2xl font-bold mt-1">{totalImpressions}</p>
              <p className="text-[10px] text-muted-foreground">Impressions</p>
            </div>
            <span className="text-muted-foreground">→</span>
            <div className="flex-1 text-center p-3 rounded-lg bg-muted/30">
              <Star className="w-5 h-5 mx-auto text-yellow-400" />
              <p className="text-2xl font-bold mt-1">{totalClicks}</p>
              <p className="text-[10px] text-muted-foreground">Clicks</p>
            </div>
            <span className="text-muted-foreground">→</span>
            <div className="flex-1 text-center p-3 rounded-lg bg-muted/30">
              <ShoppingCart className="w-5 h-5 mx-auto text-emerald-400" />
              <p className="text-2xl font-bold mt-1">{totalRedemptions}</p>
              <p className="text-[10px] text-muted-foreground">Redemptions</p>
            </div>
            <span className="text-muted-foreground">→</span>
            <div className="flex-1 text-center p-3 rounded-lg bg-muted/30">
              <TrendingUp className="w-5 h-5 mx-auto text-primary" />
              <p className="text-2xl font-bold mt-1">{convRate}%</p>
              <p className="text-[10px] text-muted-foreground">Conversion</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorBetaAnalytics;
