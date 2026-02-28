import { useEffect, useState } from "react";
import { DEV_MODE } from "@/lib/devMode";
import { motion } from "framer-motion";
import {
  Wine, Beer, BarChart3, Package, AlertTriangle,
  CheckCircle2, ArrowRight, Activity, Clock, ClipboardCheck,
  Martini, Calculator,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

import { useAuth } from "@/contexts/AuthContext";

import ErrorBoundary from "@/components/ErrorBoundary";
import BevOnboardingWizard from "../components/BevOnboardingWizard";
import BevInductionTracker from "../components/BevInductionTracker";
import BevRunSheetManager from "../components/BevRunSheetManager";
import TeamFeed from "@/components/feed/TeamFeed";
import StatCard from "@/components/dashboard/StatCard";
import VenueSelector from "@/components/dashboard/VenueSelector";
import { useOrg } from "@/contexts/OrgContext";

interface BevStats {
  openBottles: number;
  cellarValue: number;
  bevCostPercent: number;
  draughtYield: number;
  variancePercent: number;
  poursToday: number;
  prepTasksPending: number;
  lowStockProducts: number;
}

const BevDashboard = () => {
  const [stats, setStats] = useState<BevStats>({
    openBottles: 0, cellarValue: 0, bevCostPercent: 0, draughtYield: 0,
    variancePercent: 0, poursToday: 0, prepTasksPending: 0, lowStockProducts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [lowStockItems, setLowStockItems] = useState<{ name: string; current: number; par: number }[]>([]);
  const { currentOrg } = useOrg();
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(" ")[0] || "Bar Manager";
  

  useEffect(() => {
    if (!DEV_MODE && currentOrg && !(currentOrg as any).onboarding_completed) {
      setShowOnboarding(true);
    }
  }, [currentOrg]);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const fetchStats = async () => {
    if (!currentOrg?.id) { setLoading(false); return; }
    try {
      const orgId = currentOrg.id;
      const today = new Date().toISOString().split("T")[0];

      const [openRes, cellarRes, poursRes, kegsRes, prepRes, lowStockRes] = await Promise.all([
        supabase.from("bev_open_bottles" as any).select("*", { count: "exact", head: true }).eq("org_id", orgId),
        supabase.from("bev_cellar" as any).select("quantity, bev_products(purchase_price)").eq("org_id", orgId),
        supabase.from("bev_pour_events" as any).select("cost_per_pour, sell_price", { count: "exact" }).eq("org_id", orgId).eq("shift_date", today),
        supabase.from("bev_keg_tracking" as any).select("theoretical_pours, actual_pours, yield_pct").eq("org_id", orgId).is("kicked_at", null),
        supabase.from("bev_bar_prep" as any).select("status", { count: "exact" }).eq("org_id", orgId).eq("date", today).neq("status", "completed"),
        supabase.from("bev_cellar" as any).select("product_id, quantity, bev_products(name, par_level)").eq("org_id", orgId),
      ]);

      // Cellar value
      let cellarValue = 0;
      if (cellarRes.data) {
        cellarRes.data.forEach((item: any) => {
          const price = item.bev_products?.purchase_price || 0;
          cellarValue += (item.quantity || 0) * price;
        });
      }

      // Bev cost % from today's pours
      let bevCostPercent = 0;
      if (poursRes.data && poursRes.data.length > 0) {
        const totalCost = poursRes.data.reduce((s: number, p: any) => s + (p.cost_per_pour || 0), 0);
        const totalRevenue = poursRes.data.reduce((s: number, p: any) => s + (p.sell_price || 0), 0);
        bevCostPercent = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0;
      }

      // Draught yield
      let draughtYield = 0;
      if (kegsRes.data && kegsRes.data.length > 0) {
        const totalYield = kegsRes.data.reduce((s: number, k: any) => s + (k.yield_pct || 0), 0);
        draughtYield = totalYield / kegsRes.data.length;
      }

      // Low stock count
      let lowStockCount = 0;
      const lowStockList: { name: string; current: number; par: number }[] = [];
      if (lowStockRes.data) {
        // Group cellar stock by product
        const stockByProduct = new Map<string, { name: string; total: number; par: number }>();
        for (const row of lowStockRes.data as any[]) {
          const par = row.bev_products?.par_level;
          if (!par || par <= 0) continue;
          const existing = stockByProduct.get(row.product_id) || { name: row.bev_products?.name || "Unknown", total: 0, par };
          existing.total += row.quantity || 0;
          stockByProduct.set(row.product_id, existing);
        }
        stockByProduct.forEach((v) => {
          if (v.total < v.par) {
            lowStockCount++;
            lowStockList.push({ name: v.name, current: v.total, par: v.par });
          }
        });
      }

      setStats({
        openBottles: openRes.count || 0,
        cellarValue,
        bevCostPercent: Math.round(bevCostPercent * 10) / 10,
        draughtYield: Math.round(draughtYield * 10) / 10,
        variancePercent: 0,
        poursToday: poursRes.count || 0,
        prepTasksPending: prepRes.count || 0,
        lowStockProducts: lowStockCount,
      });
      setLowStockItems(lowStockList);
    } catch (err) {
      console.error("Error fetching bev stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const channel = supabase
      .channel("bev-dashboard-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "bev_pour_events" }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "bev_open_bottles" }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "bev_bar_prep" }, fetchStats)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentOrg?.id]);

  const getBevCostColor = (): "primary" | "accent" | "warning" | "success" => {
    if (stats.bevCostPercent === 0) return "primary";
    if (stats.bevCostPercent <= 22) return "success";
    return "warning";
  };

  // Quick actions for bar
  const quickActions = [
    { label: "Log Pour", href: "/bev/pours", icon: BarChart3, color: "text-primary" },
    { label: "New Spec", href: "/bev/cocktails", icon: Martini, color: "text-purple-500" },
    { label: "Cost Calc", href: "/bev/costing", icon: Calculator, color: "text-orange-500" },
    { label: "Stocktake", href: "/bev/stocktake", icon: Package, color: "text-blue-500" },
    { label: "Add Product", href: "/bev/cellar", icon: Wine, color: "text-red-500" },
    { label: "Bar Prep", href: "/bev/bar-prep", icon: ClipboardCheck, color: "text-emerald-500" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <BevOnboardingWizard open={showOnboarding} onComplete={() => setShowOnboarding(false)} />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{currentOrg?.name || "My Bar"}</p>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">Hey {firstName} 🍸</h1>
          <p className="text-sm text-muted-foreground">{currentDate}</p>
        </div>
        <div className="flex items-center gap-3">
          <VenueSelector selectedVenueId={selectedVenueId} onSelect={setSelectedVenueId} />
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-medium">
            <CheckCircle2 className="w-3 h-3" /> All Systems Go
          </span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BarChart3} label="Bev Cost" value={loading ? "..." : `${stats.bevCostPercent}%`}
          subValue="Target: 22%" trend={stats.bevCostPercent <= 22 ? "On track" : "Above target"} color={getBevCostColor()} href="/bev/pours" />
        <StatCard icon={Wine} label="Open Bottles" value={loading ? "..." : String(stats.openBottles)}
          subValue="Currently open" color="accent" href="/bev/cellar" />
        <StatCard icon={Package} label="Cellar Value" value={loading ? "..." : `$${stats.cellarValue.toLocaleString()}`}
          subValue="Total stock value" color="primary" href="/bev/cellar" />
        <StatCard icon={Beer} label="Draught Yield" value={loading ? "..." : `${stats.draughtYield || 0}%`}
          subValue="Keg efficiency" color={stats.draughtYield >= 90 ? "success" : "warning"} href="/bev/draught" />
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <Link key={action.label} to={action.href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-center">
              <action.icon className={`w-6 h-6 ${action.color}`} />
              <span className="text-xs font-medium text-foreground">{action.label}</span>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Prep, Pours & Bar Wall */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 space-y-6">
          {/* Bar Prep Widget */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-primary" />
                Today's Bar Prep
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.prepTasksPending > 0 ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{stats.prepTasksPending} tasks pending</p>
                    <p className="text-xs text-muted-foreground">Juice, syrups, garnish, ice</p>
                  </div>
                  <Link to="/bev/bar-prep" className="text-sm text-primary hover:underline">View</Link>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No prep tasks for today. <Link to="/bev/bar-prep" className="text-primary hover:underline">Create one</Link></p>
              )}
            </CardContent>
          </Card>

          {/* Pours Summary */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Today's Pours
                </CardTitle>
                <Link to="/bev/pours" className="text-sm text-primary hover:underline flex items-center gap-1">
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.poursToday}</p>
                  <p className="text-xs text-muted-foreground">Total Pours</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.bevCostPercent}%</p>
                  <p className="text-xs text-muted-foreground">Bev Cost</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.openBottles}</p>
                  <p className="text-xs text-muted-foreground">Open Bottles</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Run Sheet */}
          <ErrorBoundary fallbackMessage="Could not load run sheet">
            <BevRunSheetManager />
          </ErrorBoundary>

          {/* Bar Wall - WhatsApp style messaging */}
          <ErrorBoundary fallbackMessage="Could not load bar wall">
            <TeamFeed title="Bar Wall" subtitle="Share updates, photos & bar comms" />
          </ErrorBoundary>
        </motion.div>

        {/* Right Column */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="space-y-4">
          <ErrorBoundary fallbackMessage="Could not load induction tracker">
            <BevInductionTracker />
          </ErrorBoundary>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Pour logs, stocktakes, and keg changes will appear here.</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Alerts */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="card-elevated p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Today's Alerts</h2>
          <Link to="/bev/compliance" className="text-sm text-primary hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {stats.openBottles > 5 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Open Bottle Alert</p>
                <p className="text-xs text-muted-foreground">{stats.openBottles} bottles currently open — check freshness</p>
              </div>
              <Link to="/bev/cellar" className="text-sm text-primary hover:underline">Review</Link>
            </div>
          )}
          {stats.openBottles <= 5 && stats.prepTasksPending === 0 && stats.lowStockProducts === 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">No Alerts</p>
                <p className="text-xs text-muted-foreground">Everything is running smoothly</p>
              </div>
            </div>
          )}
          {stats.lowStockProducts > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <Package className="w-5 h-5 text-destructive flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Low Stock Alert</p>
                <p className="text-xs text-muted-foreground">
                  {lowStockItems.slice(0, 3).map(i => i.name).join(", ")}
                  {lowStockItems.length > 3 ? ` +${lowStockItems.length - 3} more` : ""}
                </p>
              </div>
              <Link to="/bev/stocktake" className="text-sm text-primary hover:underline">Review</Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default BevDashboard;
