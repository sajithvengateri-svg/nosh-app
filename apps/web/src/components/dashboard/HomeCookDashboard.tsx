import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ChefHat, Trash2, Package, BookOpen, AlertTriangle, Shield,
  ArrowRight, Sparkles, CheckCircle2, DollarSign, Receipt,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import DailyWorkflowCard from "@/components/onboarding/DailyWorkflowCard";
import MoneyLiteAnimatedWidget from "@/components/dashboard/MoneyLiteAnimatedWidget";
import SocialOrdersWidget from "@/components/dashboard/SocialOrdersWidget";
import ReferralCodeCard from "@/components/referral/ReferralCodeCard";
import SystemHealthCircle from "@/components/dashboard/SystemHealthCircle";
import ThoughtOfTheDay from "@/components/dashboard/ThoughtOfTheDay";
import TodoPanel from "@/components/tasks/TodoPanel";

interface HomeCookStats {
  recipeCount: number;
  ingredientCount: number;
  lowStockCount: number;
}

const HomeCookDashboard = () => {
  const { currentOrg } = useOrg();
  const { profile, user } = useAuth();
  const chefName = profile?.full_name?.split(" ")[0] || user?.user_metadata?.full_name?.split(" ")[0] || "Boss";
  const [stats, setStats] = useState<HomeCookStats>({ recipeCount: 0, ingredientCount: 0, lowStockCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [recipes, ingredients] = await Promise.all([
        supabase.from("recipes").select("id", { count: "exact", head: true }),
        supabase.from("ingredients").select("id, current_stock, par_level"),
      ]);

      const ings = ingredients.data || [];
      setStats({
        recipeCount: recipes.count || 0,
        ingredientCount: ings.length,
        lowStockCount: ings.filter(i => i.current_stock != null && i.par_level != null && Number(i.current_stock) < Number(i.par_level)).length,
      });
      setLoading(false);
    };
    fetch();
  }, []);

  const quickActions = [
    { icon: ChefHat, label: "Add Recipe", path: "/recipes/new", color: "text-orange-500" },
    { icon: Receipt, label: "Scan Docket", path: "/kitchen?tab=ingredients&docket=1", color: "text-violet-500" },
    { icon: Trash2, label: "Log Waste", path: "/waste-log", color: "text-red-500" },
    { icon: DollarSign, label: "Money", path: "/money-lite", color: "text-emerald-500" },
  ];

  const currentDate = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{currentOrg?.name || "My Kitchen"}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Hey Boss {chefName} 👋</h1>
          <p className="text-sm text-muted-foreground">{currentDate}</p>
        </div>
        <Link to="/housekeeping" title="System Health">
          <SystemHealthCircle />
        </Link>
      </motion.div>

      {/* Thought of the Day */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <ThoughtOfTheDay isHomeCook />
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map(a => (
            <Link key={a.path} to={a.path}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer active:scale-[0.97]">
                <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                  <a.icon className={`w-6 h-6 ${a.color}`} />
                  <span className="text-sm font-medium text-foreground">{a.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* My Day - Command Portal */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <Card>
          <CardContent className="p-4">
            <TodoPanel compact />
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-3 gap-4">
        <Link to="/recipes">
          <Card className="hover:shadow-md transition-shadow cursor-pointer active:scale-[0.97]">
            <CardContent className="p-4 text-center">
              <ChefHat className="w-5 h-5 mx-auto text-orange-500 mb-1" />
              <p className="text-2xl font-bold text-foreground">{loading ? "..." : stats.recipeCount}</p>
              <p className="text-xs text-muted-foreground">Recipes</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/ingredients">
          <Card className="hover:shadow-md transition-shadow cursor-pointer active:scale-[0.97]">
            <CardContent className="p-4 text-center">
              <Package className="w-5 h-5 mx-auto text-blue-500 mb-1" />
              <p className="text-2xl font-bold text-foreground">{loading ? "..." : stats.ingredientCount}</p>
              <p className="text-xs text-muted-foreground">Ingredients</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/ingredients">
          <Card className="hover:shadow-md transition-shadow cursor-pointer active:scale-[0.97]">
            <CardContent className="p-4 text-center">
              <AlertTriangle className={`w-5 h-5 mx-auto mb-1 ${stats.lowStockCount > 0 ? "text-amber-500" : "text-emerald-500"}`} />
              <p className="text-2xl font-bold text-foreground">{loading ? "..." : stats.lowStockCount}</p>
              <p className="text-xs text-muted-foreground">Low Stock</p>
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      {/* Money Lite Widget */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}>
        <MoneyLiteAnimatedWidget />
      </motion.div>

      {/* Social Orders Widget */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.19 }}>
        <SocialOrdersWidget />
      </motion.div>

      {/* Referral Widget */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.195 }}>
        <Link to="/referral">
          <ReferralCodeCard compact />
        </Link>
      </motion.div>

      {/* Low Stock Alert */}
      {stats.lowStockCount > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Low Stock Alert</p>
              <p className="text-xs text-muted-foreground">{stats.lowStockCount} items below par level</p>
            </div>
            <Link to="/ingredients"><Button size="sm" variant="outline">Review</Button></Link>
          </div>
        </motion.div>
      )}

      {/* Daily Workflow */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <ErrorBoundary fallbackMessage="Could not load daily workflow">
          <DailyWorkflowCard />
        </ErrorBoundary>
      </motion.div>

      {/* Food Safety Quick Status */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className="w-5 h-5 text-emerald-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Safety Checks</p>
              <p className="text-xs text-muted-foreground">Stay on top of your checks</p>
            </div>
            <Link to="/food-safety"><Button size="sm" variant="outline">Open Logs</Button></Link>
          </CardContent>
        </Card>
      </motion.div>

      {/* Upgrade Nudge */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card className="border-dashed">
          <CardContent className="p-4 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Need more power?</p>
              <p className="text-xs text-muted-foreground">Upgrade to ChefOS Pro for prep lists, production tracking, menu engineering & more.</p>
            </div>
            <Badge variant="secondary">Pro</Badge>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default HomeCookDashboard;
