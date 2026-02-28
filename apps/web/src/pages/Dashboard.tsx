import { useEffect, useState } from "react";
import { DEV_MODE } from "@/lib/devMode";
import { motion } from "framer-motion";
import { 
  ChefHat, 
  ClipboardCheck, 
  Package, 
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Activity
} from "lucide-react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import StatCard from "@/components/dashboard/StatCard";
import PrepListWidget from "@/components/dashboard/PrepListWidget";
import QuickActions from "@/components/dashboard/QuickActions";
import ErrorBoundary from "@/components/ErrorBoundary";
import TaskInbox from "@/components/tasks/TaskInbox";
import ActivityFeed from "@/components/activity/ActivityFeed";
import ContributionStats from "@/components/activity/ContributionStats";
import TeamFeed from "@/components/feed/TeamFeed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { MobileDeck } from "@/components/mobile/MobileDeck";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import OrgChartWidget from "@/components/dashboard/OrgChartWidget";
import InductionTracker from "@/components/onboarding/InductionTracker";
import DailyWorkflowCard from "@/components/onboarding/DailyWorkflowCard";
import AppWalkthrough from "@/components/onboarding/AppWalkthrough";
import VenueSelector from "@/components/dashboard/VenueSelector";
import CriticalFoodSafetyAlerts from "@/components/dashboard/CriticalFoodSafetyAlerts";
import { useOrg } from "@/contexts/OrgContext";
import MenuCostingNudge from "@/components/onboarding/MenuCostingNudge";
import HomeCookDashboard from "@/components/dashboard/HomeCookDashboard";
import EatSafeDashboard from "@/components/dashboard/EatSafeDashboard";
import ReferralCodeCard from "@/components/referral/ReferralCodeCard";
import SystemHealthCircle from "@/components/dashboard/SystemHealthCircle";
import ThoughtOfTheDay from "@/components/dashboard/ThoughtOfTheDay";
import TodoPanel from "@/components/tasks/TodoPanel";

interface DashboardStats {
  prepTasksTotal: number;
  prepTasksCompleted: number;
  activeRecipes: number;
  newRecipesThisWeek: number;
  lowStockItems: number;
  avgFoodCostPercent: number;
  targetFoodCost: number;
}

const Dashboard = () => {
  const { currentOrg, venues, membership, storeMode } = useOrg();
  const [stats, setStats] = useState<DashboardStats>({
    prepTasksTotal: 0,
    prepTasksCompleted: 0,
    activeRecipes: 0,
    newRecipesThisWeek: 0,
    lowStockItems: 0,
    avgFoodCostPercent: 0,
    targetFoodCost: 30,
  });
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const { profile, user } = useAuth();
  const chefFirstName = profile?.full_name?.split(" ")[0] || user?.user_metadata?.full_name?.split(" ")[0] || "Chef";
 
  const isMobile = useIsMobile();

  // Check if onboarding is needed (skip in DEV_MODE)
  useEffect(() => {
    if (!DEV_MODE && currentOrg && !(currentOrg as any).onboarding_completed) {
      setShowOnboarding(true);
    }
  }, [currentOrg]);

  // Check if walkthrough is needed (after onboarding completes)
  useEffect(() => {
    if (!showOnboarding && profile && !(profile as any).walkthrough_completed) {
      setShowWalkthrough(true);
    }
  }, [showOnboarding, profile]);

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const fetchDashboardStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [prepListsRes, recipesRes, newRecipesRes, ingredientsRes] = await Promise.all([
        supabase
          .from('prep_lists')
          .select('items, status, date')
          .order('date', { ascending: false })
          .limit(50),
        supabase
          .from('recipes')
          .select('id, cost_per_serving, sell_price, target_food_cost_percent'),
        supabase
          .from('recipes')
          .select('id')
          .gte('created_at', weekAgo),
        supabase
          .from('ingredients')
          .select('id, current_stock, par_level'),
      ]);

      const allLists = prepListsRes.data || [];
      const todayLists = allLists.filter(l => l.date === today);
      const listsToCount = todayLists.length > 0 ? todayLists : allLists.slice(0, 10);
      
      const prepTasksTotal = listsToCount.length;
      const prepTasksCompleted = listsToCount.filter(l => l.status === 'completed').length;

      const lowStockItems = (ingredientsRes.data || []).filter(
        (ing) => ing.current_stock !== null && 
                 ing.par_level !== null && 
                 Number(ing.current_stock) < Number(ing.par_level)
      ).length;

      const recipesWithCost = (recipesRes.data || []).filter(
        (r) => r.sell_price && r.sell_price > 0 && r.cost_per_serving
      );
      
      let avgFoodCostPercent = 0;
      if (recipesWithCost.length > 0) {
        const totalFoodCost = recipesWithCost.reduce((sum, r) => {
          const costPercent = ((r.cost_per_serving || 0) / (r.sell_price || 1)) * 100;
          return sum + costPercent;
        }, 0);
        avgFoodCostPercent = totalFoodCost / recipesWithCost.length;
      }

      const recipesWithTarget = (recipesRes.data || []).filter(r => r.target_food_cost_percent);
      const avgTargetFoodCost = recipesWithTarget.length > 0
        ? recipesWithTarget.reduce((sum, r) => sum + (r.target_food_cost_percent || 30), 0) / recipesWithTarget.length
        : 30;

      setStats({
        prepTasksTotal,
        prepTasksCompleted,
        activeRecipes: recipesRes.data?.length || 0,
        newRecipesThisWeek: newRecipesRes.data?.length || 0,
        lowStockItems,
        avgFoodCostPercent: Math.round(avgFoodCostPercent * 10) / 10,
        targetFoodCost: Math.round(avgTargetFoodCost),
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();

    const channel = supabase
      .channel('dashboard-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prep_lists' }, fetchDashboardStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recipes' }, fetchDashboardStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ingredients' }, fetchDashboardStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getFoodCostTrend = () => {
    if (stats.avgFoodCostPercent === 0) return "";
    if (stats.avgFoodCostPercent <= stats.targetFoodCost) return "On track";
    return "Above target";
  };

  const getFoodCostColor = (): "primary" | "accent" | "warning" | "success" => {
    if (stats.avgFoodCostPercent === 0) return "primary";
    if (stats.avgFoodCostPercent <= stats.targetFoodCost) return "success";
    return "warning";
  };

  // Home cook mode → simplified dashboard
  if (storeMode === "home_cook") {
    return (
      <AppLayout>
        {/* App Walkthrough Tour for Home Cooks */}
        <AppWalkthrough
          open={showWalkthrough}
          onComplete={() => setShowWalkthrough(false)}
        />
        <HomeCookDashboard />
      </AppLayout>
    );
  }

  // EatSafe / compliance mode → currently mobile-only via APP_VARIANT.
  // TODO: Add compliance detection for web (e.g. org.compliance_framework flag)
  if (storeMode === ("food_safety" as any)) {
    return (
      <AppLayout>
        <AppWalkthrough
          open={showWalkthrough}
          onComplete={() => setShowWalkthrough(false)}
        />
        <EatSafeDashboard />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Onboarding Wizard */}
      <OnboardingWizard
        open={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
      />

      {/* App Walkthrough Tour */}
      <AppWalkthrough
        open={showWalkthrough}
        onComplete={() => setShowWalkthrough(false)}
      />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{currentOrg?.name || "My Kitchen"}</p>
            <h1 className="page-title font-display">Hey Chef {chefFirstName} 👋</h1>
            <p className="page-subtitle">{currentDate}</p>
          </div>
          <div className="flex items-center gap-3">
            <VenueSelector selectedVenueId={selectedVenueId} onSelect={setSelectedVenueId} />
            <Link to="/housekeeping" className="relative group" title="System Health">
              <SystemHealthCircle />
            </Link>
          </div>
        </motion.div>

        {/* Thought of the Day */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <ThoughtOfTheDay />
        </motion.div>

        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="stat-scroll lg:!grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible lg:mx-0 lg:px-0 lg:pb-0"
        >
          <StatCard icon={ClipboardCheck} label="Prep Lists" value={loading ? "..." : String(stats.prepTasksTotal)} subValue={`${stats.prepTasksCompleted} completed`} trend={stats.prepTasksTotal > 0 ? `${stats.prepTasksTotal - stats.prepTasksCompleted} pending` : ""} color="primary" href="/prep" />
          <StatCard icon={ChefHat} label="Active Recipes" value={loading ? "..." : String(stats.activeRecipes)} subValue={stats.newRecipesThisWeek > 0 ? `${stats.newRecipesThisWeek} new this week` : "No new recipes"} color="accent" href="/recipes" />
          <StatCard icon={Package} label="Low Stock Items" value={loading ? "..." : String(stats.lowStockItems)} subValue={stats.lowStockItems > 0 ? "Need attention" : "Stock OK"} trend={stats.lowStockItems > 0 ? "urgent" : ""} color="warning" href="/inventory" />
          <StatCard icon={TrendingUp} label="Food Cost" value={loading ? "..." : `${stats.avgFoodCostPercent}%`} subValue={`Target: ${stats.targetFoodCost}%`} trend={getFoodCostTrend()} color={getFoodCostColor()} href="/menu-engineering" />
        </motion.div>

        {/* Mobile Card Deck */}
        {isMobile && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card-elevated p-4">
            <h2 className="section-header">Your Action Deck</h2>
            <ErrorBoundary fallbackMessage="Could not load action deck">
              <MobileDeck className="mt-2" />
            </ErrorBoundary>
          </motion.div>
        )}

        {/* Command Portal - embedded for head_chef / owner */}
        {(membership?.role === "head_chef" || membership?.role === "owner") && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}>
            <Card>
              <CardContent className="p-4">
                <TodoPanel compact />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Menu Costing Nudge */}
        {!showOnboarding && !showWalkthrough && (profile as any)?.walkthrough_completed && !(profile as any)?.menu_costing_onboarded && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <MenuCostingNudge />
          </motion.div>
        )}

        {/* Critical Food Safety Alerts */}
        <CriticalFoodSafetyAlerts />

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <QuickActions />
        </motion.div>

        {/* Task Inbox */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <TaskInbox />
        </motion.div>

        {/* Org Tree — full-width for owners/head chefs */}
        {(membership?.role === "owner" || membership?.role === "head_chef") && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.27 }}>
            <ErrorBoundary fallbackMessage="Could not load org tree">
              <OrgChartWidget expanded />
            </ErrorBoundary>
          </motion.div>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 space-y-6">
            <PrepListWidget />
            <TeamFeed />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-4">
            <InductionTracker />
            <DailyWorkflowCard />
            {/* Compact org chart for non-owners in sidebar */}
            {membership?.role !== "owner" && membership?.role !== "head_chef" && (
              <OrgChartWidget />
            )}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityFeed compact limit={8} />
              </CardContent>
            </Card>
            <ContributionStats showLeaderboard={true} showSectionCoverage={false} showMyStats={false} compact={true} />
          </motion.div>
        </div>

        {/* Referral Widget */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <ReferralCodeCard compact />
        </motion.div>

        {/* Alerts Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card-elevated p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-header mb-0">Today's Alerts</h2>
            <Link to="/food-safety" className="text-sm text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {stats.lowStockItems > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Low Stock Alert</p>
                  <p className="text-xs text-muted-foreground">{stats.lowStockItems} items below par level</p>
                </div>
                <Link to="/ingredients" className="btn-primary text-sm py-1.5 px-3">Review</Link>
              </div>
            )}
            {stats.prepTasksTotal > 0 && stats.prepTasksCompleted < stats.prepTasksTotal && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Prep Tasks Pending</p>
                  <p className="text-xs text-muted-foreground">{stats.prepTasksTotal - stats.prepTasksCompleted} tasks remaining today</p>
                </div>
                <Link to="/prep" className="text-sm text-primary hover:underline">View</Link>
              </div>
            )}
            {stats.lowStockItems === 0 && stats.prepTasksTotal === 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">No Alerts</p>
                  <p className="text-xs text-muted-foreground">Everything is running smoothly</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
