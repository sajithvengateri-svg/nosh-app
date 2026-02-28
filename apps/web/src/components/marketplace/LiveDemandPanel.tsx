import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Package, 
  BarChart3,
  Loader2,
  AlertCircle,
  MapPin
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMarketplaceDemand, useCategoryDemand } from "@/hooks/useMarketplaceDemand";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface LiveDemandPanelProps {
  className?: string;
  maxItems?: number;
}

const LiveDemandPanel = ({ className, maxItems = 15 }: LiveDemandPanelProps) => {
  const { data: insights, isLoading, error } = useMarketplaceDemand();
  const { data: categories } = useCategoryDemand();

  if (isLoading) {
    return (
      <div className={cn("card-elevated p-6", className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("card-elevated p-6", className)}>
        <div className="flex items-center gap-3 text-muted-foreground">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">Unable to load demand data</p>
        </div>
      </div>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <div className={cn("card-elevated p-6", className)}>
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground">No demand data available yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add ingredients to your recipes to see demand insights
          </p>
        </div>
      </div>
    );
  }

  const displayedInsights = insights.slice(0, maxItems);
  const maxQuantity = Math.max(...displayedInsights.map(i => i.total_quantity), 1);

  return (
    <div className={cn("card-elevated p-6", className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Live Ingredient Demand</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {insights.length} ingredients tracked
        </Badge>
      </div>

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
          {displayedInsights.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="group"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full", categoryColors[item.ingredient_category] || "bg-gray-500")} />
                  <span className="text-sm font-medium truncate max-w-[200px]">
                    {item.ingredient_name || item.ingredient_category}
                  </span>
                  <Badge variant="outline" className="text-xs">{item.ingredient_category}</Badge>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">
                    {item.order_count} {item.order_count === 1 ? 'order' : 'orders'}
                  </span>
                  <span className="font-mono font-medium">
                    {item.total_quantity.toLocaleString(undefined, { maximumFractionDigits: 2 })} {item.unit}
                  </span>
                </div>
              </div>
              
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.total_quantity / maxQuantity) * 100}%` }}
                  transition={{ delay: index * 0.03 + 0.1, duration: 0.4 }}
                  className={cn("h-full rounded-full", categoryColors[item.ingredient_category] || "bg-gray-500")}
                />
              </div>

              <div className="hidden group-hover:flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                {item.avg_price_paid && (
                  <span>Avg price: ${Number(item.avg_price_paid).toFixed(2)}/{item.unit}</span>
                )}
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {item.postcode}
                </span>
              </div>
            </motion.div>
          ))}
        </TabsContent>

        {/* Category View */}
        <TabsContent value="category" className="space-y-3">
          {categories?.map((cat, index) => {
            const maxCatQuantity = Math.max(...(categories?.map(c => c.total_quantity) || [1]), 1);
            return (
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
            );
          })}
        </TabsContent>
      </Tabs>

      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Aggregated ingredient demand. No account or business information is shared.
        </p>
      </div>
    </div>
  );
};

export default LiveDemandPanel;
