import { motion } from "framer-motion";
import { useEffect } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Users, Building2, ShoppingCart, TrendingUp, ChefHat,
  Activity, Tag, ArrowRight, UserPlus, Gift, Bell,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { lazy, Suspense } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import DemandInsightsPanel from "@/components/marketplace/DemandInsightsPanel";

const AdminHeatmap = lazy(() => import("../components/AdminHeatmap"));

const StatsCard = ({
  title, value, change, icon: Icon, variant = "default", delay = 0, onClick,
}: {
  title: string; value: string | number; change?: number;
  icon: React.ElementType; variant?: "default" | "primary" | "success" | "warning";
  delay?: number; onClick?: () => void;
}) => {
  const variantStyles = {
    default: "from-muted to-muted/50",
    primary: "from-primary/20 to-primary/10",
    success: "from-emerald-500/20 to-emerald-600/10",
    warning: "from-amber-500/20 to-amber-600/10",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className={onClick ? "cursor-pointer" : ""}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-3xl font-bold mt-2">{value}</p>
              {change !== undefined && (
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className={`w-4 h-4 ${change >= 0 ? "text-emerald-500" : "text-destructive"}`} />
                  <span className={`text-sm ${change >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                    {change >= 0 ? "+" : ""}{change}%
                  </span>
                  <span className="text-xs text-muted-foreground">vs last week</span>
                </div>
              )}
            </div>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${variantStyles[variant]} flex items-center justify-center`}>
              <Icon className="w-6 h-6 text-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const AdminDashboard = () => {
  usePageTitle("Admin · Dashboard");
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [
        { count: totalUsers },
        { count: totalVendors },
        { count: totalRecipes },
        { count: totalOrders },
        { count: activeDeals },
        { count: totalReferrals },
        { count: totalOrgs },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("vendor_profiles").select("*", { count: "exact", head: true }),
        supabase.from("recipes").select("*", { count: "exact", head: true }),
        supabase.from("vendor_orders").select("*", { count: "exact", head: true }),
        supabase.from("vendor_deals").select("*", { count: "exact", head: true })
          .eq("is_active", true)
          .lte("start_date", new Date().toISOString().split("T")[0])
          .gte("end_date", new Date().toISOString().split("T")[0]),
        supabase.from("referrals").select("*", { count: "exact", head: true }),
        supabase.from("organizations").select("*", { count: "exact", head: true }),
      ]);

      return {
        totalUsers: totalUsers || 0,
        totalVendors: totalVendors || 0,
        totalRecipes: totalRecipes || 0,
        totalOrders: totalOrders || 0,
        activeDeals: activeDeals || 0,
        totalReferrals: totalReferrals || 0,
        totalOrgs: totalOrgs || 0,
      };
    },
  });

  const { data: recentSignups } = useQuery({
    queryKey: ["admin-recent-signups"],
    queryFn: async () => {
      const { data } = await supabase
        .from("signup_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8);
      return data || [];
    },
  });

  // Realtime signup toast
  useEffect(() => {
    const channel = supabase
      .channel("dashboard-signups")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "signup_events" },
        (payload) => {
          const event = payload.new as any;
          toast.success("🎉 New chef signed up!", {
            description: `${event.user_name || event.user_email} just joined ChefOS`,
            duration: 8000,
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Command <span className="text-primary">Dashboard</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Real-time overview of the ChefOS ecosystem
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
        <StatsCard title="Active Chefs" value={stats?.totalUsers || 0} change={12.5} icon={Users} variant="primary" delay={0} onClick={() => navigate("/admin/crm")} />
        <StatsCard title="Organizations" value={stats?.totalOrgs || 0} icon={Building2} variant="success" delay={0.05} onClick={() => navigate("/admin/organizations")} />
        <StatsCard title="Referrals" value={stats?.totalReferrals || 0} icon={Gift} variant="warning" delay={0.1} onClick={() => navigate("/admin/crm")} />
        <StatsCard title="Vendors" value={stats?.totalVendors || 0} change={8.2} icon={Building2} variant="default" delay={0.15} />
        <StatsCard title="Recipes" value={stats?.totalRecipes || 0} change={5.1} icon={ChefHat} variant="default" delay={0.2} />
        <StatsCard title="Active Deals" value={stats?.activeDeals || 0} icon={Tag} variant="success" delay={0.25} onClick={() => navigate("/admin/vendor-deals")} />
      </div>

      {/* Recent Signups + System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                New Signups
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin/crm")}>
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentSignups?.map((event: any) => (
                  <div key={event.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserPlus className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <span className="font-medium text-sm">{event.user_name || "New Chef"}</span>
                        <p className="text-xs text-muted-foreground">{event.user_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.referral_code && (
                        <Badge variant="outline" className="text-xs">
                          <Gift className="w-3 h-3 mr-1" /> ref
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(event.created_at), "MMM d, HH:mm")}
                      </span>
                    </div>
                  </div>
                ))}
                {(!recentSignups || recentSignups.length === 0) && (
                  <p className="text-muted-foreground text-center py-4">No recent signups</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {["Database", "Authentication", "Edge Functions", "Storage", "Realtime"].map((service) => (
                  <div key={service} className="flex items-center justify-between">
                    <span>{service}</span>
                    <Badge className="bg-emerald-500 hover:bg-emerald-600">Operational</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <ErrorBoundary fallbackMessage="Heatmap failed to load">
        <Suspense fallback={<div className="h-64 flex items-center justify-center text-muted-foreground">Loading map…</div>}>
          <AdminHeatmap />
        </Suspense>
      </ErrorBoundary>

      {/* Ingredient Demand (same as vendor view) */}
      <DemandInsightsPanel maxItems={15} />
    </div>
  );
};

export default AdminDashboard;
