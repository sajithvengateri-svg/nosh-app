import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { 
  Store, 
  Search, 
  Filter, 
  TrendingUp, 
  Tag, 
  MessageSquare, 
  Star, 
  MapPin,
  Clock,
  DollarSign,
  BarChart3,
  Lock,
  Bell,
  Percent
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import LiveDemandPanel from "@/components/marketplace/LiveDemandPanel";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays } from "date-fns";

interface VendorDeal {
  id: string;
  title: string;
  description: string | null;
  discount_percent: number | null;
  discount_amount: number | null;
  min_order_value: number | null;
  start_date: string;
  end_date: string;
  applicable_categories: string[] | null;
  business_name: string;
}

// Placeholder suppliers - will be populated from vendor_profiles
const placeholderSuppliers = [
  { 
    id: "1", 
    name: "Lorem Ipsum", 
    category: "Produce", 
    rating: 0, 
    location: "Consectetur",
    deliveryDays: ["Dies", "Lunae"],
    dealsCount: 0,
    verified: false
  },
  { 
    id: "2", 
    name: "Dolor Sit Amet", 
    category: "Seafood", 
    rating: 0, 
    location: "Adipiscing",
    deliveryDays: ["Martis"],
    dealsCount: 0,
    verified: false
  },
  { 
    id: "3", 
    name: "Consectetur Elit", 
    category: "Meat", 
    rating: 0, 
    location: "Tempor",
    deliveryDays: ["Mercurii"],
    dealsCount: 0,
    verified: false
  },
  { 
    id: "4", 
    name: "Sed Do Eiusmod", 
    category: "Dairy", 
    rating: 0, 
    location: "Incididunt",
    deliveryDays: ["Iovis"],
    dealsCount: 0,
    verified: false
  },
];

const placeholderPriceComparison: {
  ingredient: string;
  suppliers: { name: string; price: number; unit: string }[];
}[] = [];

const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("demand");
  const [vendorCount, setVendorCount] = useState(0);

  // Fetch live vendor deals
  const { data: deals, isLoading: dealsLoading } = useQuery({
    queryKey: ["vendor-deals-marketplace"],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("vendor_deals")
        .select(`
          id,
          title,
          description,
          discount_percent,
          discount_amount,
          min_order_value,
          start_date,
          end_date,
          applicable_categories,
          vendor_profiles!inner (
            business_name
          )
        `)
        .eq("is_active", true)
        .lte("start_date", today)
        .gte("end_date", today)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((deal) => ({
        id: deal.id,
        title: deal.title,
        description: deal.description,
        discount_percent: deal.discount_percent,
        discount_amount: deal.discount_amount,
        min_order_value: deal.min_order_value,
        start_date: deal.start_date,
        end_date: deal.end_date,
        applicable_categories: deal.applicable_categories,
        business_name: (deal.vendor_profiles as { business_name: string })?.business_name || "Vendor",
      })) as VendorDeal[];
    },
  });

  useEffect(() => {
    const fetchVendorCount = async () => {
      const { count } = await supabase
        .from("vendor_profiles")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved");
      setVendorCount(count || 0);
    };
    fetchVendorCount();
  }, []);

  const getDaysRemaining = (endDate: string) => {
    const days = differenceInDays(new Date(endDate), new Date());
    if (days <= 0) return "Expires today";
    if (days === 1) return "1 day left";
    return `${days} days left`;
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Marketplace</h1>
            <p className="text-muted-foreground">Connect with suppliers, compare prices, get deals</p>
          </div>
          <Badge variant="secondary" className="w-fit gap-2">
            <Lock className="w-3 h-3" />
            Recipe data protected
          </Badge>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search suppliers, ingredients, or deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Bell className="w-4 h-4" />
          </Button>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="demand" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Demand</span>
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="gap-2">
              <Store className="w-4 h-4" />
              <span className="hidden sm:inline">Suppliers</span>
            </TabsTrigger>
            <TabsTrigger value="deals" className="gap-2">
              <Tag className="w-4 h-4" />
              <span className="hidden sm:inline">Deals</span>
              {deals && deals.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                  {deals.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="compare" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Compare</span>
            </TabsTrigger>
          </TabsList>

          {/* Demand Insights Tab */}
          <TabsContent value="demand" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Live Ingredient Demand
                </CardTitle>
                <CardDescription>
                  Real-time ingredient usage from recipes. Shows quantities and categories only - no account information.
                </CardDescription>
              </CardHeader>
            </Card>

            <LiveDemandPanel maxItems={20} />
          </TabsContent>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="space-y-4">
            {placeholderSuppliers.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {placeholderSuppliers.map((supplier) => (
                  <motion.div
                    key={supplier.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    className="card-elevated p-4 cursor-pointer opacity-60"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                          <Store className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-muted-foreground">{supplier.name}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground">{supplier.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Star className="w-4 h-4" />
                        <span className="text-sm">—</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {supplier.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {supplier.deliveryDays.join(", ")}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Store className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No suppliers connected yet</p>
              </div>
            )}

            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">
                {vendorCount > 0 
                  ? `${vendorCount} approved vendors in the marketplace` 
                  : "Supplier connections coming soon..."}
              </p>
              <p className="text-xs mt-1">Connect with local suppliers to get the best deals</p>
            </div>
          </TabsContent>

          {/* Deals Tab (formerly Specials) */}
          <TabsContent value="deals" className="space-y-4">
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  Live Vendor Deals
                </CardTitle>
                <CardDescription>
                  Active deals from vendors. Synced in real-time during testing.
                </CardDescription>
              </CardHeader>
            </Card>

            {dealsLoading ? (
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card-elevated p-4 animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/3" />
                        <div className="h-3 bg-muted rounded w-1/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : deals && deals.length > 0 ? (
              <div className="grid gap-4">
                {deals.map((deal, index) => (
                  <motion.div
                    key={deal.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="card-elevated p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                        {deal.discount_percent ? (
                          <Percent className="w-6 h-6 text-success" />
                        ) : (
                          <DollarSign className="w-6 h-6 text-success" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{deal.title}</h3>
                          {deal.applicable_categories && deal.applicable_categories.length > 0 && (
                            deal.applicable_categories.map((cat) => (
                              <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>
                            ))
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{deal.business_name}</p>
                        {deal.description && (
                          <p className="text-sm text-muted-foreground mt-1">{deal.description}</p>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          {deal.discount_percent ? (
                            <span className="text-lg font-bold text-success">
                              {deal.discount_percent}% OFF
                            </span>
                          ) : deal.discount_amount ? (
                            <span className="text-lg font-bold text-success">
                              ${deal.discount_amount.toFixed(2)} OFF
                            </span>
                          ) : null}
                        </div>
                        {deal.min_order_value && deal.min_order_value > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Min. order ${deal.min_order_value}
                          </p>
                        )}
                        <p className="text-xs text-warning mt-1">
                          {getDaysRemaining(deal.end_date)}
                        </p>
                      </div>

                      <Button variant="outline" size="sm">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Contact
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Tag className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No active deals</p>
                <p className="text-sm mt-1">Deals will appear here when vendors post them</p>
              </div>
            )}
          </TabsContent>

          {/* Compare Tab */}
          <TabsContent value="compare" className="space-y-4">
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Price Comparison
                </CardTitle>
                <CardDescription>
                  Compare prices across suppliers for your most-used ingredients
                </CardDescription>
              </CardHeader>
            </Card>

            {placeholderPriceComparison.length > 0 ? (
              <div className="space-y-4">
                {placeholderPriceComparison.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="card-elevated p-4"
                  >
                    <h3 className="font-semibold mb-3">{item.ingredient}</h3>
                    <div className="grid gap-2">
                      {item.suppliers
                        .sort((a, b) => a.price - b.price)
                        .map((supplier, sIdx) => (
                          <div 
                            key={sIdx}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-lg",
                              sIdx === 0 && "bg-success/10"
                            )}
                          >
                            <span className={cn(
                              "text-sm",
                              sIdx === 0 ? "font-medium" : "text-muted-foreground"
                            )}>
                              {supplier.name}
                              {sIdx === 0 && (
                                <Badge variant="secondary" className="ml-2 text-xs">Best Price</Badge>
                              )}
                            </span>
                            <span className={cn(
                              "font-mono",
                              sIdx === 0 ? "font-bold text-success" : "text-muted-foreground"
                            )}>
                              ${supplier.price.toFixed(2)}/{supplier.unit}
                            </span>
                          </div>
                        ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No price data available</p>
                <p className="text-sm mt-1">Connect suppliers to compare prices</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Data Privacy Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="card-elevated p-4 bg-muted/30"
        >
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium text-sm">Your Data is Protected</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Your recipes remain completely private. Only anonymized, aggregated ingredient 
                usage data may be shared with suppliers to help them understand 
                market demand. No chef or business information is ever disclosed.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Marketplace;
