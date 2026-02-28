import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Thermometer,
  Truck,
  ShieldCheck,
  ClipboardCheck,
  ScanLine,
  FileBarChart,
  Zap,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";
import StatCard from "@/components/dashboard/StatCard";
import CriticalFoodSafetyAlerts from "@/components/dashboard/CriticalFoodSafetyAlerts";
import ErrorBoundary from "@/components/ErrorBoundary";
import TaskInbox from "@/components/tasks/TaskInbox";
import VenueSelector from "@/components/dashboard/VenueSelector";
import ThoughtOfTheDay from "@/components/dashboard/ThoughtOfTheDay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { VARIANT_REGISTRY, getRegion } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";

interface SafetyStats {
  tempChecksToday: number;
  tempChecksPassed: number;
  receivingLogsToday: number;
  receivingPassed: number;
  complianceScore: number;
  openAlerts: number;
}

const EatSafeDashboard = () => {
  const { currentOrg } = useOrg();
  const { profile, user } = useAuth();
  const { variant } = useFeatureGate();
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [stats, setStats] = useState<SafetyStats>({
    tempChecksToday: 0,
    tempChecksPassed: 0,
    receivingLogsToday: 0,
    receivingPassed: 0,
    complianceScore: 0,
    openAlerts: 0,
  });
  const [loading, setLoading] = useState(true);

  const chefFirstName = profile?.full_name?.split(" ")[0] || user?.user_metadata?.full_name?.split(" ")[0] || "Manager";

  // Get region-specific compliance label
  const regionConfig = (() => {
    try {
      return getRegion(variant as AppVariant);
    } catch {
      return null;
    }
  })();
  const complianceLabel = regionConfig?.compliance?.toUpperCase() || "Food Safety";

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    if (!currentOrg?.id) return;

    const fetchStats = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];

        const [tempRes, receivingRes, alertsRes, burstRes] = await Promise.all([
          supabase
            .from("food_safety_logs")
            .select("id, status")
            .eq("org_id", currentOrg.id)
            .eq("log_type", "temperature")
            .gte("created_at", `${today}T00:00:00`)
            .lte("created_at", `${today}T23:59:59`),
          supabase
            .from("food_safety_logs")
            .select("id, status")
            .eq("org_id", currentOrg.id)
            .eq("log_type", "receiving")
            .gte("created_at", `${today}T00:00:00`)
            .lte("created_at", `${today}T23:59:59`),
          supabase
            .from("food_safety_alerts")
            .select("id")
            .eq("org_id", currentOrg.id)
            .is("acknowledged_at", null),
          supabase
            .from("daily_compliance_logs")
            .select("id, status")
            .eq("org_id", currentOrg.id)
            .gte("logged_at", `${today}T00:00:00`)
            .lte("logged_at", `${today}T23:59:59`),
        ]);

        const temps = tempRes.data || [];
        const receiving = receivingRes.data || [];
        const openAlerts = alertsRes.data?.length || 0;
        const bursts = burstRes.data || [];

        const tempPassed = temps.filter((t: any) => t.status === "pass").length;
        const recPassed = receiving.filter((r: any) => r.status === "pass").length;

        // Simple compliance score: % of today's checks that passed
        const totalChecks = temps.length + receiving.length + bursts.length;
        const totalPassed = tempPassed + recPassed + bursts.filter((b: any) => b.status === "pass").length;
        const score = totalChecks > 0 ? Math.round((totalPassed / totalChecks) * 100) : 0;

        setStats({
          tempChecksToday: temps.length,
          tempChecksPassed: tempPassed,
          receivingLogsToday: receiving.length,
          receivingPassed: recPassed,
          complianceScore: score,
          openAlerts,
        });
      } catch (error) {
        console.error("Error fetching safety stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    const channel = supabase
      .channel("eatsafe-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "food_safety_logs" }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "food_safety_alerts" }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_compliance_logs" }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrg?.id]);

  const getScoreColor = (): "success" | "warning" | "primary" => {
    if (stats.complianceScore >= 80) return "success";
    if (stats.complianceScore >= 50) return "warning";
    return "primary";
  };

  const quickActions = [
    { icon: Thermometer, label: "Log Temp", path: "/food-safety", color: "bg-primary" },
    { icon: ScanLine, label: "Scan Docket", path: "/scanner", color: "bg-accent" },
    { icon: Zap, label: "Daily Burst", path: "/food-safety", color: "bg-amber-500" },
    { icon: FileBarChart, label: "Reports", path: "/reports", color: "bg-emerald-600" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {currentOrg?.name || "My Venue"} · {complianceLabel}
          </p>
          <h1 className="page-title font-display">Dashboard</h1>
          <p className="page-subtitle">{currentDate}</p>
        </div>
        <div className="flex items-center gap-3">
          <VenueSelector selectedVenueId={selectedVenueId} onSelect={setSelectedVenueId} />
        </div>
      </motion.div>

      {/* Thought of the Day */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <ThoughtOfTheDay />
      </motion.div>

      {/* Food Safety Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="stat-scroll lg:!grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible lg:mx-0 lg:px-0 lg:pb-0"
      >
        <StatCard
          icon={Thermometer}
          label="Temp Checks"
          value={loading ? "..." : String(stats.tempChecksToday)}
          subValue={`${stats.tempChecksPassed} passed`}
          trend={stats.tempChecksToday === 0 ? "Not started" : stats.tempChecksPassed < stats.tempChecksToday ? "Failures" : ""}
          color={stats.tempChecksPassed < stats.tempChecksToday && stats.tempChecksToday > 0 ? "warning" : "primary"}
          href="/food-safety"
        />
        <StatCard
          icon={Truck}
          label="Receiving"
          value={loading ? "..." : String(stats.receivingLogsToday)}
          subValue={`${stats.receivingPassed} passed`}
          trend={stats.receivingLogsToday === 0 ? "No deliveries" : ""}
          color="accent"
          href="/food-safety?tab=receiving"
        />
        <StatCard
          icon={ShieldCheck}
          label="Compliance"
          value={loading ? "..." : `${stats.complianceScore}%`}
          subValue="Today's score"
          trend={stats.complianceScore >= 80 ? "On track" : stats.complianceScore > 0 ? "Needs attention" : ""}
          color={getScoreColor()}
          href="/food-safety"
        />
        <StatCard
          icon={AlertTriangle}
          label="Open Alerts"
          value={loading ? "..." : String(stats.openAlerts)}
          subValue={stats.openAlerts === 0 ? "All clear" : "Unacknowledged"}
          trend={stats.openAlerts > 0 ? "urgent" : ""}
          color={stats.openAlerts > 0 ? "warning" : "success"}
          href="/food-safety"
        />
      </motion.div>

      {/* Critical Food Safety Alerts */}
      <CriticalFoodSafetyAlerts />

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="card-elevated p-4 lg:p-5">
          <h2 className="section-header">Quick Actions</h2>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory sm:grid sm:grid-cols-4 sm:overflow-visible sm:mx-0 sm:px-0 sm:pb-0 scrollbar-hide">
            {quickActions.map((action) => (
              <motion.div key={action.label} whileTap={{ scale: 0.95 }} className="snap-start shrink-0 w-[calc(33%-0.5rem)] sm:w-auto">
                <Link
                  to={action.path}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-muted/50 active:bg-muted transition-colors"
                >
                  <div className={`p-3 rounded-xl ${action.color} text-primary-foreground`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-center whitespace-nowrap">{action.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Task Inbox */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <TaskInbox />
      </motion.div>

      {/* Today's Compliance Summary */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card-elevated p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-header mb-0">Today's Status</h2>
          <Link to="/food-safety" className="text-sm text-primary hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {stats.openAlerts > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Critical Alerts</p>
                <p className="text-xs text-muted-foreground">{stats.openAlerts} unacknowledged alert{stats.openAlerts !== 1 ? "s" : ""}</p>
              </div>
              <Link to="/food-safety" className="btn-primary text-sm py-1.5 px-3">Review</Link>
            </div>
          )}
          {stats.tempChecksToday === 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <Thermometer className="w-5 h-5 text-warning flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Temperature Checks</p>
                <p className="text-xs text-muted-foreground">No temp checks recorded today</p>
              </div>
              <Link to="/food-safety" className="text-sm text-primary hover:underline">Log Now</Link>
            </div>
          )}
          {stats.tempChecksToday > 0 && stats.tempChecksPassed === stats.tempChecksToday && stats.openAlerts === 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">All Clear</p>
                <p className="text-xs text-muted-foreground">All checks passing, no open alerts</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default EatSafeDashboard;
