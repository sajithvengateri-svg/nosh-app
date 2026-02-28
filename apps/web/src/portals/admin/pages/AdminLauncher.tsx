import { useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Rocket, ChefHat, Zap, Package, ExternalLink, Pencil, Check, X,
  LayoutDashboard, ClipboardList, Utensils, Receipt, Menu,
  Wrench, Users, Factory, Store, AlertTriangle, Calendar,
  LayoutGrid, BookOpen, Shield, GraduationCap, Wine,
  Monitor, CalendarCheck, PieChart, TrendingUp, DollarSign,
  Brain, Truck, Eye, EyeOff, Fingerprint, Clock,
  ShieldAlert, CalendarDays, Megaphone, ShoppingCart,
  Bell, MonitorPlay, CreditCard, ScrollText, BarChart3,
  UtensilsCrossed, Settings, Upload, Atom, FlaskConical,
  FileSearch, ShieldCheck, Lightbulb, Layers, Grid3X3,
  Building2, MessageSquare, Tag, Inbox, Trash2,
} from "lucide-react";
import { APP_REGISTRY, type AppEntry } from "@/lib/shared/appRegistry";

const ICON_MAP: Record<string, React.ElementType> = {
  ChefHat, Wine, Monitor, Users, Truck, TrendingUp, DollarSign,
  Brain, Store, Shield, CalendarCheck, PieChart, Pencil, Check, X,
  LayoutDashboard, ClipboardList, Utensils, Receipt, Menu,
  Wrench, Factory, AlertTriangle, Calendar, LayoutGrid,
  BookOpen, GraduationCap, Package, Fingerprint, Clock,
  ShieldAlert, CalendarDays, Megaphone, ShoppingCart,
  Bell, MonitorPlay, CreditCard, ScrollText, BarChart3,
  UtensilsCrossed, Settings, Upload, Atom, FlaskConical,
  FileSearch, ShieldCheck, Lightbulb, Layers, Grid3X3,
  Building2, MessageSquare, Tag, Inbox, Trash2,
};

// Complete nav items for every app
const APP_NAV_ITEMS: Record<string, { slug: string; label: string; icon: string }[]> = {
  chef: [
    { slug: "dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { slug: "prep", label: "Prep Lists", icon: "ClipboardList" },
    { slug: "recipes", label: "Recipes", icon: "ChefHat" },
    { slug: "ingredients", label: "Ingredients", icon: "Utensils" },
    { slug: "invoices", label: "Invoices", icon: "Receipt" },
    { slug: "menu-engineering", label: "Menu Engineering", icon: "Menu" },
    { slug: "equipment", label: "Equipment", icon: "Wrench" },
    { slug: "team", label: "Team", icon: "Users" },
    { slug: "inventory", label: "Inventory", icon: "Package" },
    { slug: "production", label: "Production", icon: "Factory" },
    { slug: "marketplace", label: "Marketplace", icon: "Store" },
    { slug: "allergens", label: "Allergens", icon: "AlertTriangle" },
    { slug: "roster", label: "Roster", icon: "Users" },
    { slug: "calendar", label: "Calendar", icon: "Calendar" },
    { slug: "kitchen-sections", label: "Sections", icon: "LayoutGrid" },
    { slug: "cheatsheets", label: "Cheatsheets", icon: "BookOpen" },
    { slug: "food-safety", label: "Food Safety", icon: "Shield" },
    { slug: "training", label: "Training", icon: "GraduationCap" },
    { slug: "waste-log", label: "Waste Log", icon: "Trash2" },
  ],
  bevos: [
    { slug: "bev-dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { slug: "bev-cellar", label: "Cellar", icon: "Wine" },
    { slug: "bev-cocktails", label: "Cocktails", icon: "Wine" },
    { slug: "bev-pours", label: "Pours", icon: "TrendingUp" },
    { slug: "bev-bar-prep", label: "Bar Prep", icon: "ClipboardList" },
    { slug: "bev-stocktake", label: "Stocktake", icon: "Package" },
    { slug: "bev-draught", label: "Draught", icon: "Wine" },
    { slug: "bev-coravin", label: "Coravin", icon: "Wine" },
    { slug: "bev-engineering", label: "Engineering", icon: "TrendingUp" },
    { slug: "bev-invoices", label: "Invoices", icon: "Receipt" },
    { slug: "bev-compliance", label: "Compliance", icon: "Shield" },
    { slug: "bev-team", label: "Team", icon: "Users" },
    { slug: "bev-coffee", label: "Coffee", icon: "Wine" },
    { slug: "bev-training", label: "Training", icon: "GraduationCap" },
    { slug: "bev-marketplace", label: "Marketplace", icon: "Store" },
  ],
  posos: [
    { slug: "pos-main", label: "POS", icon: "ShoppingCart" },
    { slug: "pos-kds", label: "KDS", icon: "MonitorPlay" },
    { slug: "pos-tabs", label: "Tabs", icon: "CreditCard" },
    { slug: "pos-functions", label: "Functions", icon: "CalendarDays" },
    { slug: "pos-compliance", label: "Compliance", icon: "Shield" },
    { slug: "pos-audit", label: "Audit Log", icon: "ScrollText" },
    { slug: "pos-analytics", label: "Analytics", icon: "BarChart3" },
    { slug: "pos-menu", label: "Menu Admin", icon: "UtensilsCrossed" },
    { slug: "pos-staff", label: "Staff Admin", icon: "Users" },
    { slug: "pos-store", label: "Store Settings", icon: "Settings" },
  ],
  reservation: [
    { slug: "res-dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { slug: "res-diary", label: "Diary", icon: "BookOpen" },
    { slug: "res-floor", label: "Floor Plan", icon: "Grid3X3" },
    { slug: "res-bookings", label: "Bookings", icon: "CalendarCheck" },
    { slug: "res-settings", label: "Settings", icon: "Menu" },
  ],
  labour: [
    { slug: "labour-dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { slug: "labour-roster", label: "Roster", icon: "CalendarDays" },
    { slug: "labour-timesheets", label: "Timesheets", icon: "Clock" },
    { slug: "labour-payroll", label: "Payroll", icon: "DollarSign" },
    { slug: "labour-people", label: "People", icon: "Users" },
  ],
  supply: [
    { slug: "supply-dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { slug: "supply-orders", label: "Orders", icon: "ShoppingCart" },
    { slug: "supply-suppliers", label: "Suppliers", icon: "Building2" },
    { slug: "supply-receiving", label: "Receiving", icon: "Package" },
    { slug: "supply-price-watch", label: "Price Watch", icon: "TrendingUp" },
  ],
  growth: [
    { slug: "growth-dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { slug: "growth-campaigns", label: "Campaigns", icon: "Megaphone" },
    { slug: "growth-calendar", label: "Calendar", icon: "CalendarDays" },
    { slug: "growth-segments", label: "Segments", icon: "Users" },
    { slug: "growth-analytics", label: "Analytics", icon: "Menu" },
  ],
  overhead: [
    { slug: "overhead-dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { slug: "overhead-costs", label: "Costs", icon: "Receipt" },
    { slug: "overhead-alerts", label: "Alerts", icon: "Bell" },
    { slug: "overhead-recurring", label: "Recurring", icon: "TrendingUp" },
    { slug: "overhead-settings", label: "Settings", icon: "Menu" },
  ],
  money: [
    { slug: "money-reactor", label: "Reactor", icon: "Atom" },
    { slug: "money-pnl", label: "P&L", icon: "BarChart3" },
    { slug: "money-trends", label: "Trends", icon: "TrendingUp" },
    { slug: "money-simulator", label: "Scenarios", icon: "FlaskConical" },
    { slug: "money-solutions", label: "Solutions", icon: "Lightbulb" },
    { slug: "money-audit", label: "Quiet Audit", icon: "ShieldCheck" },
    { slug: "money-forensic", label: "Forensic", icon: "FileSearch" },
    { slug: "money-portfolio", label: "Portfolio", icon: "Layers" },
    { slug: "money-settings", label: "Settings", icon: "Settings" },
  ],
  quiet: [
    { slug: "quiet-dashboard", label: "Dashboard", icon: "Brain" },
    { slug: "quiet-recommendations", label: "Recommendations", icon: "Lightbulb" },
    { slug: "quiet-external-new", label: "New Audit", icon: "ClipboardList" },
    { slug: "quiet-report", label: "Report", icon: "FileSearch" },
  ],
  vendor: [
    { slug: "vendor-dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { slug: "vendor-insights", label: "Demand Insights", icon: "TrendingUp" },
    { slug: "vendor-pricing", label: "Pricing", icon: "DollarSign" },
    { slug: "vendor-deals", label: "Deals", icon: "Tag" },
    { slug: "vendor-orders", label: "Orders", icon: "Inbox" },
    { slug: "vendor-messages", label: "Messages", icon: "MessageSquare" },
  ],
  // EatSafe Brisbane progressive release modules (these can be toggled on per-org)
  eatsafe: [
    { slug: "eatsafe-dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { slug: "eatsafe-food-safety", label: "Food Safety", icon: "ShieldCheck" },
    { slug: "eatsafe-scanner", label: "Scanner", icon: "FileSearch" },
    { slug: "eatsafe-reports", label: "Reports", icon: "BarChart3" },
    { slug: "eatsafe-recipes", label: "Recipes (Wave 1)", icon: "ChefHat" },
    { slug: "eatsafe-ingredients", label: "Ingredients (Wave 1)", icon: "Utensils" },
    { slug: "eatsafe-prep", label: "Prep Lists (Wave 2)", icon: "ClipboardList" },
    { slug: "eatsafe-kitchen-sections", label: "Kitchen Sections (Wave 2)", icon: "LayoutGrid" },
    { slug: "eatsafe-team", label: "Team (Wave 3)", icon: "Users" },
    { slug: "eatsafe-training", label: "Training (Wave 3)", icon: "GraduationCap" },
    { slug: "eatsafe-roster", label: "Roster (Wave 3)", icon: "CalendarDays" },
    { slug: "eatsafe-inventory", label: "Inventory (Wave 4)", icon: "Package" },
    { slug: "eatsafe-production", label: "Production (Wave 4)", icon: "Factory" },
    { slug: "eatsafe-invoices", label: "Invoices (Wave 4)", icon: "Receipt" },
    { slug: "eatsafe-marketplace", label: "Marketplace (Wave 4)", icon: "Store" },
  ],
};

interface FeatureRelease {
  id: string;
  module_slug: string;
  module_name: string;
  description: string | null;
  status: string;
  release_type: string;
  sort_order: number;
  released_at: string | null;
}

const statusColors: Record<string, string> = {
  development: "bg-muted text-muted-foreground",
  beta: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  released: "bg-green-500/20 text-green-700 dark:text-green-400",
};

const AdminLauncher = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [modules, setModules] = useState<FeatureRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [editingApp, setEditingApp] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);
  const fetchModules = useCallback(async () => {
    const { data, error } = await supabase
      .from("feature_releases")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      toast.error("Failed to load modules");
    } else {
      setModules(data || []);
    }
    setLoading(false);
    // Invalidate the shared hook so PortalSelect picks up changes
    queryClient.invalidateQueries({ queryKey: ["feature-releases"] });
  }, [queryClient]);

  useEffect(() => { fetchModules(); }, [fetchModules]);

  // Toggle an existing module
  const toggleExistingModule = async (mod: FeatureRelease) => {
    setTogglingIds(prev => new Set(prev).add(mod.id));
    const newStatus = mod.status === "released" ? "development" : "released";
    const updates: Record<string, any> = {
      status: newStatus,
      released_at: newStatus === "released" ? new Date().toISOString() : null,
    };

    const { error } = await supabase
      .from("feature_releases")
      .update(updates)
      .eq("id", mod.id);

    if (error) {
      toast.error("Failed to update");
    } else {
      toast.success(`${mod.module_name} → ${newStatus === "released" ? "Enabled" : "Disabled"}`);
      await fetchModules();
    }
    setTogglingIds(prev => { const n = new Set(prev); n.delete(mod.id); return n; });
  };

  // Create a new feature_releases entry and toggle it
  const createAndToggle = async (slug: string, label: string, currentlyEnabled: boolean) => {
    const tempId = `new-${slug}`;
    setTogglingIds(prev => new Set(prev).add(tempId));
    const newStatus = currentlyEnabled ? "development" : "released";

    const { error } = await supabase
      .from("feature_releases")
      .insert({
        module_slug: slug,
        module_name: label,
        status: newStatus,
        release_type: "new",
        sort_order: modules.length + 1,
        released_at: newStatus === "released" ? new Date().toISOString() : null,
      });

    if (error) {
      toast.error("Failed to create module entry");
    } else {
      toast.success(`${label} → ${newStatus === "released" ? "Enabled" : "Disabled"}`);
      await fetchModules();
    }
    setTogglingIds(prev => { const n = new Set(prev); n.delete(tempId); return n; });
  };

  // Toggle app-level (uses a special slug like "app-chef")
  const toggleApp = async (app: AppEntry) => {
    const appSlug = `app-${app.key}`;
    const existing = modules.find(m => m.module_slug === appSlug);
    if (existing) {
      await toggleExistingModule(existing);
    } else {
      // No entry exists = app defaults to enabled. First toggle disables it.
      await createAndToggle(appSlug, app.name, true);
    }
  };

  const isAppEnabled = (app: AppEntry): boolean => {
    const appSlug = `app-${app.key}`;
    const existing = modules.find(m => m.module_slug === appSlug);
    if (!existing) return true; // Default: enabled
    return existing.status === "released";
  };

  const getAppDisplayName = (app: AppEntry): string => {
    const appSlug = `app-${app.key}`;
    const existing = modules.find(m => m.module_slug === appSlug);
    return existing?.module_name || app.name;
  };

  const startEditing = (app: AppEntry) => {
    setEditingApp(app.key);
    setEditName(getAppDisplayName(app));
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const saveAppName = async (app: AppEntry) => {
    const trimmed = editName.trim();
    if (!trimmed) { setEditingApp(null); return; }

    const appSlug = `app-${app.key}`;
    const existing = modules.find(m => m.module_slug === appSlug);

    if (existing) {
      const { error } = await supabase
        .from("feature_releases")
        .update({ module_name: trimmed })
        .eq("id", existing.id);
      if (error) { toast.error("Failed to rename"); } 
      else { toast.success(`Renamed to ${trimmed}`); await fetchModules(); }
    } else {
      // Create the entry with custom name
      const { error } = await supabase
        .from("feature_releases")
        .insert({
          module_slug: appSlug,
          module_name: trimmed,
          status: "released",
          release_type: "new",
          sort_order: modules.length + 1,
        });
      if (error) { toast.error("Failed to save name"); }
      else { toast.success(`Saved as ${trimmed}`); await fetchModules(); }
    }
    setEditingApp(null);
  };
  const releasedCount = modules.filter(m => m.status === "released").length;
  const progress = modules.length ? (releasedCount / modules.length) * 100 : 0;

  const controllableApps = APP_REGISTRY.filter(a => a.key !== 'admin');

  if (loading) return <div className="p-6 text-muted-foreground">Loading modules...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Rocket className="w-8 h-8 text-primary" />
          Launch Control
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage all .iT OS apps and their navigation
        </p>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Module Readiness</CardTitle>
              <CardDescription>
                {releasedCount} of {modules.length} modules tracked
              </CardDescription>
            </div>
            <Badge variant={progress === 100 ? "default" : "secondary"}>
              {progress.toFixed(0)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>

      {/* Tabs: Overview + Per-App */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {controllableApps.map(app => (
            <TabsTrigger key={app.key} value={app.key} className="text-xs">
              {app.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Apps</CardTitle>
              <CardDescription>Enable/disable entire apps across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {controllableApps.map((app, index) => {
                  const Icon = ICON_MAP[app.iconName] || Package;
                  const enabled = isAppEnabled(app);
                  const appSlug = `app-${app.key}`;
                  const isToggling = togglingIds.has(modules.find(m => m.module_slug === appSlug)?.id || `new-${appSlug}`);

                  return (
                    <motion.div
                      key={app.key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${app.gradient} flex items-center justify-center shrink-0`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        {editingApp === app.key ? (
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Input
                              ref={editInputRef}
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveAppName(app);
                                if (e.key === "Escape") setEditingApp(null);
                              }}
                              className="h-8 text-sm"
                            />
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => saveAppName(app)}>
                              <Check className="w-4 h-4 text-green-500" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setEditingApp(null)}>
                              <X className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-medium">{getAppDisplayName(app)}</p>
                              <p className="text-xs text-muted-foreground">{app.subtitle}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); startEditing(app); }}>
                              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={enabled ? statusColors.released : statusColors.development}>
                          {enabled ? "Live" : "Off"}
                        </Badge>
                        <Switch
                          checked={enabled}
                          disabled={isToggling}
                          onCheckedChange={() => toggleApp(app)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTab(app.key)}
                        >
                          <Wrench className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => navigate(app.entryRoute)}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Per-App Tabs */}
        {controllableApps.map(app => {
          const Icon = ICON_MAP[app.iconName] || Package;
          const navItems = APP_NAV_ITEMS[app.key] || [];
          const appEnabled = isAppEnabled(app);
          const appSlug = `app-${app.key}`;
          const appTogglingId = modules.find(m => m.module_slug === appSlug)?.id || `new-${appSlug}`;

          return (
            <TabsContent key={app.key} value={app.key} className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${app.gradient} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle>{getAppDisplayName(app)}</CardTitle>
                      <CardDescription>{app.subtitle}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* App-Level Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                    <div>
                      <p className="font-medium">App Enabled</p>
                      <p className="text-xs text-muted-foreground">Toggle the entire {app.name} app</p>
                    </div>
                    <Switch
                      checked={appEnabled}
                      disabled={togglingIds.has(appTogglingId)}
                      onCheckedChange={() => toggleApp(app)}
                    />
                  </div>

                  {/* Nav Items */}
                  {navItems.length > 0 ? (
                    <div>
                      <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                        Navigation Items
                      </h3>
                      <div className="grid gap-2 md:grid-cols-2">
                        {navItems.map((item, idx) => {
                          const NavIcon = ICON_MAP[item.icon] || Package;
                          const matchedModule = modules.find(m => m.module_slug === item.slug);
                          const isEnabled = matchedModule ? matchedModule.status === "released" : true;
                          const toggleId = matchedModule?.id || `new-${item.slug}`;

                          return (
                            <motion.div
                              key={item.slug}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.02 }}
                              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <NavIcon className={`w-4 h-4 ${isEnabled ? "text-primary" : "text-muted-foreground"}`} />
                                <span className={`text-sm ${isEnabled ? "font-medium" : "text-muted-foreground"}`}>
                                  {item.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {isEnabled ? (
                                  <Eye className="w-3.5 h-3.5 text-green-500" />
                                ) : (
                                  <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                                )}
                                <Switch
                                  checked={isEnabled}
                                  disabled={togglingIds.has(toggleId)}
                                  onCheckedChange={() => {
                                    if (matchedModule) {
                                      toggleExistingModule(matchedModule);
                                    } else {
                                      createAndToggle(item.slug, item.label, true);
                                    }
                                  }}
                                />
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Navigation items will appear here as {app.name} is developed</p>
                    </div>
                  )}

                  {/* Quick Launch */}
                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => navigate(app.entryRoute)}
                      className="w-full"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open {app.name}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default AdminLauncher;
