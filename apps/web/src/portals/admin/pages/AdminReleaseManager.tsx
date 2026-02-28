import { useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, formatDistanceToNow, isPast, subDays, isAfter } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { APP_REGISTRY, type AppEntry } from "@/lib/shared/appRegistry";
import { APP_NAV_ITEMS } from "@/lib/shared/appNavItems";
import {
  Rocket, Package, ChevronDown, ChevronRight, Calendar, Plus, Shield,
  ChefHat, Wine, Monitor, Users, Truck, TrendingUp, DollarSign,
  Brain, Store, CalendarCheck, PieChart, LayoutDashboard, ClipboardList,
  Utensils, Receipt, Menu, Wrench, Factory, AlertTriangle, LayoutGrid,
  BookOpen, GraduationCap, Fingerprint, Clock, ShieldAlert, CalendarDays,
  Megaphone, ShoppingCart, Bell, MonitorPlay, CreditCard, ScrollText,
  BarChart3, UtensilsCrossed, Settings, Upload, Atom, FlaskConical,
  FileSearch, ShieldCheck, Lightbulb, Layers, Grid3X3, Building2,
  MessageSquare, Tag, Inbox, Trash2, Zap, FileText, CalendarClock,
  Eye, EyeOff, RefreshCw, Search, Filter,
} from "lucide-react";

// ═══════════════════════════════════════════════════════
// ICON MAP
// ═══════════════════════════════════════════════════════

const ICON_MAP: Record<string, React.ElementType> = {
  ChefHat, Wine, Monitor, Users, Truck, TrendingUp, DollarSign,
  Brain, Store, Shield, CalendarCheck, PieChart, LayoutDashboard,
  ClipboardList, Utensils, Receipt, Menu, Wrench, Factory,
  AlertTriangle, Calendar, LayoutGrid, BookOpen, GraduationCap,
  Package, Fingerprint, Clock, ShieldAlert, CalendarDays, Megaphone,
  ShoppingCart, Bell, MonitorPlay, CreditCard, ScrollText, BarChart3,
  UtensilsCrossed, Settings, Upload, Atom, FlaskConical, FileSearch,
  ShieldCheck, Lightbulb, Layers, Grid3X3, Building2, MessageSquare,
  Tag, Inbox, Trash2, Rocket, Zap, Eye, EyeOff, Search, Filter,
};

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

interface FeatureRelease {
  id: string;
  module_slug: string;
  module_name: string;
  description: string | null;
  status: string;
  release_type: string;
  released_at: string | null;
  scheduled_release_at: string | null;
  version_tag: string | null;
  target_release: string | null;
  release_notes: string | null;
  sort_order: number;
  is_essential: boolean;
}

// ═══════════════════════════════════════════════════════
// STATUS COLORS
// ═══════════════════════════════════════════════════════

const statusColors: Record<string, string> = {
  development: "bg-muted text-muted-foreground",
  beta: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  released: "bg-green-500/20 text-green-700 dark:text-green-400",
};

const statusDotColors: Record<string, string> = {
  development: "bg-gray-400",
  beta: "bg-amber-500",
  released: "bg-green-500",
};

const statusLabel: Record<string, string> = {
  development: "Dev",
  beta: "Beta",
  released: "Live",
};

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

const AdminReleaseManager = () => {
  const queryClient = useQueryClient();
  const [releases, setReleases] = useState<FeatureRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("apps-features");
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [expandedApps, setExpandedApps] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // ── Data Fetching ──

  const fetchReleases = useCallback(async () => {
    const { data, error } = await supabase
      .from("feature_releases")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      toast.error("Failed to load releases");
    } else {
      setReleases((data || []) as FeatureRelease[]);
    }
    setLoading(false);
    queryClient.invalidateQueries({ queryKey: ["feature-releases"] });
  }, [queryClient]);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  // ── Toggle Logic ──

  const toggleExistingModule = async (mod: FeatureRelease) => {
    setTogglingIds((prev) => new Set(prev).add(mod.id));
    const newStatus = mod.status === "released" ? "development" : "released";
    const updates: Record<string, unknown> = {
      status: newStatus,
      released_at: newStatus === "released" ? new Date().toISOString() : null,
    };

    const { error } = await supabase
      .from("feature_releases")
      .update(updates)
      .eq("id", mod.id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`${mod.module_name} → ${newStatus === "released" ? "Live" : "Development"}`);
      await fetchReleases();
    }
    setTogglingIds((prev) => {
      const n = new Set(prev);
      n.delete(mod.id);
      return n;
    });
  };

  const createAndToggle = async (slug: string, label: string, currentlyEnabled: boolean) => {
    const tempId = `new-${slug}`;
    setTogglingIds((prev) => new Set(prev).add(tempId));
    const newStatus = currentlyEnabled ? "development" : "released";

    const { error } = await supabase.from("feature_releases").insert({
      module_slug: slug,
      module_name: label,
      status: newStatus,
      release_type: "new",
      sort_order: releases.length + 1,
      released_at: newStatus === "released" ? new Date().toISOString() : null,
    });

    if (error) {
      toast.error("Failed to create release entry");
    } else {
      toast.success(`${label} → ${newStatus === "released" ? "Live" : "Development"}`);
      await fetchReleases();
    }
    setTogglingIds((prev) => {
      const n = new Set(prev);
      n.delete(tempId);
      return n;
    });
  };

  const toggleApp = async (app: AppEntry) => {
    const appSlug = `app-${app.key}`;
    const existing = releases.find((m) => m.module_slug === appSlug);
    if (existing) {
      await toggleExistingModule(existing);
    } else {
      await createAndToggle(appSlug, app.name, true);
    }
  };

  const isAppEnabled = (app: AppEntry): boolean => {
    const appSlug = `app-${app.key}`;
    const existing = releases.find((m) => m.module_slug === appSlug);
    if (!existing) return true;
    return existing.status === "released";
  };

  const getAppStatus = (app: AppEntry): string => {
    const appSlug = `app-${app.key}`;
    const existing = releases.find((m) => m.module_slug === appSlug);
    if (!existing) return "released";
    return existing.status;
  };

  const isFeatureEnabled = (slug: string): boolean => {
    const existing = releases.find((m) => m.module_slug === slug);
    if (!existing) return true;
    return existing.status === "released";
  };

  const getFeatureStatus = (slug: string): string => {
    const existing = releases.find((m) => m.module_slug === slug);
    if (!existing) return "released";
    return existing.status;
  };

  const getFeatureVersionTag = (slug: string): string | null => {
    const existing = releases.find((m) => m.module_slug === slug);
    return existing?.version_tag || null;
  };

  const getFeatureIsEssential = (slug: string): boolean => {
    const existing = releases.find((m) => m.module_slug === slug);
    return existing?.is_essential ?? false;
  };

  const toggleFeature = async (slug: string, label: string) => {
    const existing = releases.find((m) => m.module_slug === slug);
    if (existing) {
      await toggleExistingModule(existing);
    } else {
      await createAndToggle(slug, label, true);
    }
  };

  const updateEssential = async (slug: string, isEssential: boolean) => {
    const existing = releases.find((m) => m.module_slug === slug);
    if (!existing) return;

    const { error } = await supabase
      .from("feature_releases")
      .update({ is_essential: isEssential })
      .eq("id", existing.id);

    if (error) {
      toast.error("Failed to update essential flag");
    } else {
      toast.success(`${existing.module_name} → ${isEssential ? "Essential" : "Non-essential"}`);
      await fetchReleases();
    }
  };

  // ── Bulk Actions ──

  const releaseAll = async () => {
    const devReleases = releases.filter((r) => r.status !== "released");
    if (devReleases.length === 0) {
      toast.info("All features are already released");
      return;
    }

    const { error } = await supabase
      .from("feature_releases")
      .update({ status: "released", released_at: new Date().toISOString() })
      .neq("status", "released");

    if (error) {
      toast.error("Failed to release all");
    } else {
      toast.success(`Released ${devReleases.length} features`);
      await fetchReleases();
    }
  };

  const unreleaseAll = async () => {
    const liveReleases = releases.filter((r) => r.status === "released" && !r.is_essential);
    if (liveReleases.length === 0) {
      toast.info("No non-essential features to disable");
      return;
    }

    const { error } = await supabase
      .from("feature_releases")
      .update({ status: "development", released_at: null })
      .eq("status", "released")
      .eq("is_essential", false);

    if (error) {
      toast.error("Failed to disable features");
    } else {
      toast.success(`Moved ${liveReleases.length} features to development`);
      await fetchReleases();
    }
  };

  // ── Release Management Actions ──

  const updateRelease = async (id: string, updates: Partial<FeatureRelease>) => {
    if (updates.status === "released") {
      updates.released_at = new Date().toISOString();
    }
    const { error } = await supabase
      .from("feature_releases")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast.error("Update failed");
    } else {
      toast.success("Release updated");
      await fetchReleases();
    }
  };

  const releaseNow = async (id: string) => {
    await updateRelease(id, {
      status: "released",
      released_at: new Date().toISOString(),
      scheduled_release_at: null,
    });
  };

  const scheduleRelease = async (id: string, date: Date) => {
    await updateRelease(id, {
      scheduled_release_at: date.toISOString(),
    });
  };

  const moveToBeta = async (id: string) => {
    await updateRelease(id, { status: "beta" });
  };

  const toggleExpandApp = (key: string) => {
    setExpandedApps((prev) => {
      const n = new Set(prev);
      if (n.has(key)) {
        n.delete(key);
      } else {
        n.add(key);
      }
      return n;
    });
  };

  // ── Derived Data ──

  const controllableApps = APP_REGISTRY.filter((a) => a.key !== "admin");

  const latestVersion = releases
    .filter((r) => r.version_tag)
    .sort((a, b) => {
      const parseVersion = (v: string | null) => {
        if (!v) return [0, 0, 0];
        const match = v.replace(/^v/, "").match(/^(\d+)\.(\d+)\.(\d+)/);
        if (!match) return [0, 0, 0];
        return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
      };
      const va = parseVersion(a.version_tag);
      const vb = parseVersion(b.version_tag);
      for (let i = 0; i < 3; i++) {
        if (va[i] !== vb[i]) return vb[i] - va[i];
      }
      return 0;
    })[0]?.version_tag;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Rocket className="w-10 h-10 text-primary animate-pulse mx-auto" />
          <p className="text-muted-foreground">Loading Release Manager...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Rocket className="w-8 h-8 text-primary" />
            Release Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Unified control for apps, features, and release pipeline
          </p>
        </div>
        <div className="flex items-center gap-3">
          {latestVersion && (
            <Badge variant="outline" className="text-sm font-mono px-3 py-1">
              Latest: v{latestVersion.replace(/^v/, "")}
            </Badge>
          )}
          {releases.some((r) => r.status !== "released") ? (
            <Button size="sm" onClick={releaseAll} className="gap-2 bg-green-600 hover:bg-green-700">
              <Zap className="w-4 h-4" /> Release All
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={unreleaseAll} className="gap-2 text-amber-600 border-amber-300">
              <EyeOff className="w-4 h-4" /> Dev Mode All
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={fetchReleases} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{releases.filter((r) => r.status === "released").length}</p>
                <p className="text-xs text-muted-foreground">Released</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{releases.filter((r) => r.status === "beta").length}</p>
                <p className="text-xs text-muted-foreground">Beta</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Wrench className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{releases.filter((r) => r.status === "development").length}</p>
                <p className="text-xs text-muted-foreground">In Development</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <CalendarClock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {releases.filter((r) => r.scheduled_release_at && r.status !== "released").length}
                </p>
                <p className="text-xs text-muted-foreground">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto gap-1">
          <TabsTrigger value="apps-features" className="gap-2">
            <Package className="w-4 h-4" /> Apps & Features
          </TabsTrigger>
          <TabsTrigger value="releases" className="gap-2">
            <Rocket className="w-4 h-4" /> Releases
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="w-4 h-4" /> Calendar
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════ */}
        {/* TAB 1: APPS & FEATURES                        */}
        {/* ═══════════════════════════════════════════════ */}
        <TabsContent value="apps-features" className="space-y-4 mt-4">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Filter apps & features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid gap-3">
            {controllableApps
              .filter((app) => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                if (app.name.toLowerCase().includes(q)) return true;
                if (app.key.toLowerCase().includes(q)) return true;
                const navItems = APP_NAV_ITEMS[app.key] || [];
                return navItems.some((item) => item.label.toLowerCase().includes(q));
              })
              .map((app, index) => {
                const Icon = ICON_MAP[app.iconName] || Package;
                const enabled = isAppEnabled(app);
                const appStatus = getAppStatus(app);
                const appSlug = `app-${app.key}`;
                const isToggling =
                  togglingIds.has(releases.find((m) => m.module_slug === appSlug)?.id || "") ||
                  togglingIds.has(`new-${appSlug}`);
                const isExpanded = expandedApps.has(app.key);
                const navItems = APP_NAV_ITEMS[app.key] || [];

                return (
                  <motion.div
                    key={app.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Collapsible open={isExpanded} onOpenChange={() => toggleExpandApp(app.key)}>
                      <Card className={cn(
                        "transition-all duration-200",
                        isExpanded && "ring-1 ring-primary/20"
                      )}>
                        {/* App Row */}
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${app.gradient} flex items-center justify-center shrink-0`}>
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold">{app.name}</p>
                                  <Badge className={cn("text-xs", statusColors[appStatus])}>
                                    {statusLabel[appStatus] || appStatus}
                                  </Badge>
                                  {navItems.length > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                      {navItems.length} features
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{app.subtitle}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Switch
                                checked={enabled}
                                disabled={isToggling}
                                onCheckedChange={(e) => {
                                  e; // consume
                                  toggleApp(app);
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        {/* Expanded Nav Items */}
                        <CollapsibleContent>
                          {navItems.length > 0 ? (
                            <div className="px-4 pb-4 space-y-1 border-t pt-3">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                Navigation Features
                              </p>
                              {navItems
                                .filter((item) => {
                                  if (!searchQuery) return true;
                                  return item.label.toLowerCase().includes(searchQuery.toLowerCase());
                                })
                                .map((item, idx) => {
                                  const NavIcon = ICON_MAP[item.icon] || Package;
                                  const featureEnabled = isFeatureEnabled(item.slug);
                                  const featureStatus = getFeatureStatus(item.slug);
                                  const versionTag = getFeatureVersionTag(item.slug);
                                  const isEssential = getFeatureIsEssential(item.slug);
                                  const matchedModule = releases.find((m) => m.module_slug === item.slug);
                                  const featureToggleId = matchedModule?.id || `new-${item.slug}`;
                                  const isFeatureToggling = togglingIds.has(featureToggleId);

                                  return (
                                    <motion.div
                                      key={item.slug}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: idx * 0.02 }}
                                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                    >
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <NavIcon
                                          className={cn(
                                            "w-4 h-4 shrink-0",
                                            featureEnabled ? "text-primary" : "text-muted-foreground"
                                          )}
                                        />
                                        <span
                                          className={cn(
                                            "text-sm",
                                            featureEnabled ? "font-medium" : "text-muted-foreground"
                                          )}
                                        >
                                          {item.label}
                                        </span>
                                        <Badge
                                          className={cn("text-[10px] px-1.5 py-0", statusColors[featureStatus])}
                                        >
                                          {statusLabel[featureStatus] || featureStatus}
                                        </Badge>
                                        {versionTag && (
                                          <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                                            {versionTag}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-3 shrink-0">
                                        <div
                                          className="flex items-center gap-1.5 cursor-pointer"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (matchedModule) {
                                              updateEssential(item.slug, !isEssential);
                                            }
                                          }}
                                          title="Mark as essential"
                                        >
                                          <Checkbox
                                            checked={isEssential}
                                            disabled={!matchedModule}
                                            onCheckedChange={(checked) => {
                                              updateEssential(item.slug, !!checked);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          <span className="text-[10px] text-muted-foreground">Essential</span>
                                        </div>
                                        <Switch
                                          checked={featureEnabled}
                                          disabled={isFeatureToggling}
                                          onCheckedChange={() => toggleFeature(item.slug, item.label)}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                    </motion.div>
                                  );
                                })}
                            </div>
                          ) : (
                            <div className="px-4 pb-4 border-t pt-3 text-center">
                              <Package className="w-6 h-6 mx-auto mb-1 text-muted-foreground/40" />
                              <p className="text-xs text-muted-foreground">
                                No navigation items configured for {app.name}
                              </p>
                            </div>
                          )}
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  </motion.div>
                );
              })}
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════ */}
        {/* TAB 2: RELEASES                               */}
        {/* ═══════════════════════════════════════════════ */}
        <TabsContent value="releases" className="space-y-6 mt-4">
          <ReleasesTab
            releases={releases}
            onUpdate={updateRelease}
            onReleaseNow={releaseNow}
            onSchedule={scheduleRelease}
            onMoveToBeta={moveToBeta}
            onRefresh={fetchReleases}
            latestVersion={latestVersion}
          />
        </TabsContent>

        {/* ═══════════════════════════════════════════════ */}
        {/* TAB 3: CALENDAR                               */}
        {/* ═══════════════════════════════════════════════ */}
        <TabsContent value="calendar" className="space-y-6 mt-4">
          <CalendarTab releases={releases} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// TAB 2: RELEASES TAB
// ═══════════════════════════════════════════════════════

interface ReleasesTabProps {
  releases: FeatureRelease[];
  onUpdate: (id: string, updates: Partial<FeatureRelease>) => Promise<void>;
  onReleaseNow: (id: string) => Promise<void>;
  onSchedule: (id: string, date: Date) => Promise<void>;
  onMoveToBeta: (id: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  latestVersion: string | undefined;
}

const ReleasesTab = ({
  releases,
  onUpdate,
  onReleaseNow,
  onSchedule,
  onMoveToBeta,
  onRefresh,
  latestVersion,
}: ReleasesTabProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRelease, setNewRelease] = useState({
    module_slug: "",
    module_name: "",
    description: "",
    release_type: "new" as "new" | "improvement",
  });

  const upcoming = releases.filter((r) => r.status === "development" || r.status === "beta");
  const released = releases.filter((r) => r.status === "released");

  const addRelease = async () => {
    if (!newRelease.module_slug || !newRelease.module_name) {
      toast.error("Slug and name are required");
      return;
    }

    const { error } = await supabase.from("feature_releases").insert({
      module_slug: newRelease.module_slug,
      module_name: newRelease.module_name,
      description: newRelease.description || null,
      release_type: newRelease.release_type,
      status: "development",
      sort_order: releases.length + 1,
    });

    if (error) {
      toast.error("Failed to create release");
    } else {
      toast.success("Release created");
      setShowAddForm(false);
      setNewRelease({ module_slug: "", module_name: "", description: "", release_type: "new" });
      await onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {latestVersion && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/5 border border-primary/20">
              <Tag className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">
                Latest version: v{latestVersion.replace(/^v/, "")}
              </span>
            </div>
          )}
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Release
        </Button>
      </div>

      {/* Add Release Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Release Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Slug</label>
                <Input
                  placeholder="e.g. bev-cocktails"
                  value={newRelease.module_slug}
                  onChange={(e) => setNewRelease((p) => ({ ...p, module_slug: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
                <Input
                  placeholder="e.g. Cocktail Builder"
                  value={newRelease.module_name}
                  onChange={(e) => setNewRelease((p) => ({ ...p, module_name: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
              <Input
                placeholder="Short description"
                value={newRelease.description}
                onChange={(e) => setNewRelease((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="text-xs font-medium text-muted-foreground">Type:</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="releaseType"
                    value="new"
                    checked={newRelease.release_type === "new"}
                    onChange={() => setNewRelease((p) => ({ ...p, release_type: "new" }))}
                    className="accent-primary"
                  />
                  <span className="text-sm">New Feature</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="releaseType"
                    value="improvement"
                    checked={newRelease.release_type === "improvement"}
                    onChange={() => setNewRelease((p) => ({ ...p, release_type: "improvement" }))}
                    className="accent-primary"
                  />
                  <span className="text-sm">Improvement</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={addRelease} className="gap-2">
                <Plus className="w-3.5 h-3.5" /> Create
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Upcoming ({upcoming.length})
        </h3>
        {upcoming.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Rocket className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No upcoming releases. Add one above.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((release) => (
              <ReleaseCard
                key={release.id}
                release={release}
                onUpdate={onUpdate}
                onReleaseNow={onReleaseNow}
                onSchedule={onSchedule}
                onMoveToBeta={onMoveToBeta}
              />
            ))}
          </div>
        )}
      </div>

      {/* Released */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
          <Eye className="w-4 h-4" /> Released ({released.length})
        </h3>
        {released.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No released features yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {released.map((release) => (
              <ReleaseCard
                key={release.id}
                release={release}
                onUpdate={onUpdate}
                onReleaseNow={onReleaseNow}
                onSchedule={onSchedule}
                onMoveToBeta={onMoveToBeta}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// RELEASE CARD COMPONENT
// ═══════════════════════════════════════════════════════

interface ReleaseCardProps {
  release: FeatureRelease;
  onUpdate: (id: string, updates: Partial<FeatureRelease>) => Promise<void>;
  onReleaseNow: (id: string) => Promise<void>;
  onSchedule: (id: string, date: Date) => Promise<void>;
  onMoveToBeta: (id: string) => Promise<void>;
}

const ReleaseCard = ({ release, onUpdate, onReleaseNow, onSchedule, onMoveToBeta }: ReleaseCardProps) => {
  const [versionTag, setVersionTag] = useState(release.version_tag || "");
  const [releaseNotes, setReleaseNotes] = useState(release.release_notes || "");
  const [schedOpen, setSchedOpen] = useState(false);
  const [schedDate, setSchedDate] = useState<Date | undefined>(
    release.scheduled_release_at ? new Date(release.scheduled_release_at) : undefined
  );
  const versionDebounce = useRef<ReturnType<typeof setTimeout>>();
  const notesDebounce = useRef<ReturnType<typeof setTimeout>>();

  const isScheduled = !!release.scheduled_release_at && release.status !== "released";
  const scheduledDate = release.scheduled_release_at ? new Date(release.scheduled_release_at) : null;

  const handleVersionChange = (value: string) => {
    setVersionTag(value);
    if (versionDebounce.current) clearTimeout(versionDebounce.current);
    versionDebounce.current = setTimeout(() => {
      onUpdate(release.id, { version_tag: value || null });
    }, 800);
  };

  const handleNotesChange = (value: string) => {
    setReleaseNotes(value);
    if (notesDebounce.current) clearTimeout(notesDebounce.current);
    notesDebounce.current = setTimeout(() => {
      onUpdate(release.id, { release_notes: value || null });
    }, 800);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{release.module_name}</CardTitle>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{release.module_slug}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isScheduled && scheduledDate && (
              <Badge variant="outline" className="text-[10px] gap-1">
                <Clock className="w-3 h-3" />
                {isPast(scheduledDate)
                  ? "Processing..."
                  : `In ${formatDistanceToNow(scheduledDate)}`}
              </Badge>
            )}
            <Badge className={cn("text-xs", statusColors[release.status])}>
              {release.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Description */}
        {release.description && (
          <p className="text-sm text-muted-foreground">{release.description}</p>
        )}

        {/* Version Tag */}
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Version (e.g. 2.13.0)"
            value={versionTag}
            onChange={(e) => handleVersionChange(e.target.value)}
            className="h-8 text-sm font-mono"
          />
        </div>

        {/* Release Notes */}
        <div className="flex items-start gap-2">
          <FileText className="w-4 h-4 text-muted-foreground mt-2 shrink-0" />
          <Textarea
            placeholder="Release notes..."
            value={releaseNotes}
            onChange={(e) => handleNotesChange(e.target.value)}
            className="text-sm min-h-[60px]"
          />
        </div>

        {/* Essential Toggle */}
        <div className="flex items-center gap-2">
          <Checkbox
            checked={release.is_essential}
            onCheckedChange={(checked) => onUpdate(release.id, { is_essential: !!checked })}
          />
          <label className="text-sm text-muted-foreground cursor-pointer">
            Essential feature
          </label>
          {release.is_essential && (
            <Shield className="w-3.5 h-3.5 text-primary" />
          )}
        </div>

        {/* Dates */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {release.released_at && (
            <span>Released: {format(new Date(release.released_at), "MMM d, yyyy")}</span>
          )}
          {release.scheduled_release_at && (
            <span>Scheduled: {format(new Date(release.scheduled_release_at), "MMM d, yyyy")}</span>
          )}
        </div>

        {/* Actions */}
        {release.status !== "released" && (
          <div className="flex items-center gap-2 flex-wrap pt-1 border-t">
            <Button size="sm" onClick={() => onReleaseNow(release.id)} className="gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Release Now
            </Button>

            <Popover open={schedOpen} onOpenChange={setSchedOpen}>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <CalendarClock className="w-3.5 h-3.5" />
                  {isScheduled ? "Reschedule" : "Schedule"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarPicker
                  mode="single"
                  selected={schedDate}
                  onSelect={(d) => {
                    if (d) {
                      setSchedDate(d);
                      onSchedule(release.id, d);
                      setSchedOpen(false);
                    }
                  }}
                  disabled={(d) => d < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>

            {release.status === "development" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onMoveToBeta(release.id)}
                className="gap-1.5"
              >
                <FlaskConical className="w-3.5 h-3.5" /> Move to Beta
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════
// TAB 3: CALENDAR TAB
// ═══════════════════════════════════════════════════════

const CalendarTab = ({ releases }: { releases: FeatureRelease[] }) => {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);

  const scheduled = releases
    .filter(
      (r) =>
        r.scheduled_release_at &&
        r.status !== "released" &&
        isAfter(new Date(r.scheduled_release_at), now)
    )
    .sort(
      (a, b) =>
        new Date(a.scheduled_release_at!).getTime() - new Date(b.scheduled_release_at!).getTime()
    );

  const recentlyReleased = releases
    .filter(
      (r) =>
        r.status === "released" &&
        r.released_at &&
        isAfter(new Date(r.released_at), thirtyDaysAgo)
    )
    .sort(
      (a, b) => new Date(b.released_at!).getTime() - new Date(a.released_at!).getTime()
    );

  const inDevelopment = releases
    .filter((r) => r.status === "development")
    .sort((a, b) => a.sort_order - b.sort_order);

  const inBeta = releases
    .filter((r) => r.status === "beta")
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-8">
      {/* Scheduled */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide mb-3 flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <CalendarClock className="w-4 h-4" /> Scheduled ({scheduled.length})
        </h3>
        {scheduled.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-muted-foreground text-sm">
              No scheduled releases.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {scheduled.map((r, idx) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <CalendarRow
                  release={r}
                  dotColor="bg-blue-500"
                  dateField={r.scheduled_release_at!}
                  dateLabel="Scheduled"
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Recently Released */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide mb-3 flex items-center gap-2 text-green-600 dark:text-green-400">
          <Eye className="w-4 h-4" /> Recently Released ({recentlyReleased.length})
        </h3>
        {recentlyReleased.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-muted-foreground text-sm">
              No releases in the last 30 days.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentlyReleased.map((r, idx) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <CalendarRow
                  release={r}
                  dotColor="bg-green-500"
                  dateField={r.released_at!}
                  dateLabel="Released"
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* In Beta */}
      {inBeta.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide mb-3 flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <FlaskConical className="w-4 h-4" /> Beta ({inBeta.length})
          </h3>
          <div className="space-y-2">
            {inBeta.map((r, idx) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <CalendarRow release={r} dotColor="bg-amber-500" />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* In Development */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide mb-3 flex items-center gap-2 text-muted-foreground">
          <Wrench className="w-4 h-4" /> In Development ({inDevelopment.length})
        </h3>
        {inDevelopment.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-muted-foreground text-sm">
              Nothing currently in development.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {inDevelopment.map((r, idx) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <CalendarRow release={r} dotColor="bg-gray-400" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// CALENDAR ROW COMPONENT
// ═══════════════════════════════════════════════════════

interface CalendarRowProps {
  release: FeatureRelease;
  dotColor: string;
  dateField?: string;
  dateLabel?: string;
}

const CalendarRow = ({ release, dotColor, dateField, dateLabel }: CalendarRowProps) => {
  return (
    <div className="flex items-center gap-3 border border-border rounded-lg p-3 bg-card hover:bg-muted/30 transition-colors">
      <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", dotColor)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground truncate">
            {release.module_name}
          </span>
          {release.version_tag && (
            <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
              {release.version_tag}
            </span>
          )}
          {release.is_essential && (
            <Shield className="w-3 h-3 text-primary shrink-0" />
          )}
        </div>
        {release.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{release.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge className={cn("text-xs", statusColors[release.status])}>
          {statusLabel[release.status] || release.status}
        </Badge>
        {dateField && (
          <div className="text-right">
            <p className="text-xs font-medium text-foreground">
              {format(new Date(dateField), "MMM d, yyyy")}
            </p>
            {dateLabel && (
              <p className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(dateField), { addSuffix: true })}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReleaseManager;
