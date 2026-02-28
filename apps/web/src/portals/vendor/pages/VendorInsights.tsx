import { motion } from "framer-motion";
import { useVendorAuth } from "@/hooks/useVendorAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, MapPin, Package, BarChart3 } from "lucide-react";
import { useMarketplaceDemand, useCategoryDemand } from "@/hooks/useMarketplaceDemand";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const categoryColors: Record<string, string> = {
  "Seafood": "bg-blue-500",
  "Produce": "bg-green-500",
  "Dairy": "bg-yellow-500",
  "Meat": "bg-red-500",
  "Protein": "bg-red-400",
  "Dry Goods": "bg-amber-600",
  "Pantry": "bg-orange-500",
  "Bakery": "bg-amber-400",
  "Beverages": "bg-cyan-500",
  "Other": "bg-gray-500",
};

const VendorInsights = () => {
  const { vendorProfile } = useVendorAuth();
  const { data: insights, isLoading } = useMarketplaceDemand();
  const { data: categories } = useCategoryDemand();

  const maxQuantity = Math.max(...(insights?.map(i => i.total_quantity) || [1]), 1);
  const maxCatQuantity = Math.max(...(categories?.map(c => c.total_quantity) || [1]), 1);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-primary" />
          Demand Insights
        </h1>
        <p className="text-muted-foreground mt-1">
          Live ingredient demand from chef kitchens — names, quantities, and postcodes
        </p>
      </motion.div>

      {vendorProfile?.delivery_areas && vendorProfile.delivery_areas.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 flex-wrap">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Your delivery areas:</span>
          {vendorProfile.delivery_areas.map((area) => (
            <Badge key={area} variant="secondary">{area}</Badge>
          ))}
        </motion.div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingredients Tracked</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{insights?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{categories?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Postcodes Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Set(insights?.map(i => i.postcode)).size || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Live Demand Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="ingredients" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ingredients" className="gap-2">
                <Package className="w-4 h-4" />
                By Ingredient
              </TabsTrigger>
              <TabsTrigger value="category" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                By Category
              </TabsTrigger>
            </TabsList>

            {/* Ingredients View */}
            <TabsContent value="ingredients" className="space-y-3">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-2 bg-muted rounded w-full" />
                  </div>
                ))
              ) : insights && insights.length > 0 ? (
                insights.slice(0, 25).map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", categoryColors[item.ingredient_category] || "bg-gray-500")} />
                        <span className="text-sm font-medium truncate max-w-[250px]">
                          {item.ingredient_name || item.ingredient_category}
                        </span>
                        <Badge variant="outline" className="text-xs">{item.ingredient_category}</Badge>
                        <Badge variant="secondary" className="text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          {item.postcode}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">{item.order_count} orders</span>
                        <span className="font-mono font-medium">
                          {item.total_quantity.toLocaleString(undefined, { maximumFractionDigits: 2 })} {item.unit}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.total_quantity / maxQuantity) * 100}%` }}
                        transition={{ delay: index * 0.02 + 0.1, duration: 0.4 }}
                        className={cn("h-full rounded-full", categoryColors[item.ingredient_category] || "bg-gray-500")}
                      />
                    </div>
                    {item.avg_price_paid && (
                      <p className="text-xs text-muted-foreground mt-0.5 hidden group-hover:block">
                        Avg price: ${Number(item.avg_price_paid).toFixed(2)}/{item.unit}
                      </p>
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No demand insights available yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Data will appear as chefs add ingredients</p>
                </div>
              )}
            </TabsContent>

            {/* Category View */}
            <TabsContent value="category" className="space-y-3">
              {categories?.map((cat, index) => (
                <motion.div
                  key={cat.category}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", categoryColors[cat.category] || "bg-gray-500")} />
                      <span className="text-sm font-medium">{cat.category}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">{cat.ingredient_count} items</span>
                      <span className="font-mono font-medium">
                        {cat.total_quantity.toLocaleString(undefined, { maximumFractionDigits: 2 })} {cat.unit}
                      </span>
                    </div>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(cat.total_quantity / maxCatQuantity) * 100}%` }}
                      transition={{ delay: index * 0.05 + 0.1, duration: 0.4 }}
                      className={cn("h-full rounded-full", categoryColors[cat.category] || "bg-gray-500")}
                    />
                  </div>
                </motion.div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Privacy Protected:</strong> This data shows ingredient names, quantities, and postcodes.
            No chef identities, recipe details, or business information are ever shared.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorInsights;
