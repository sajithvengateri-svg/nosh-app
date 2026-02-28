import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QUIET_LAB_ORG_ID, QUIET_LAB_ORG_NAME } from "@/lib/quietLab";
import {
  Settings, Shield, Database, Bell, Globe, Palette, FlaskConical,
  ToggleLeft, Building2, Users, Loader2, Save, RefreshCw, Eye, EyeOff,
  Megaphone, ChefHat, Wine, Clock, DollarSign, CalendarDays, BarChart3,
  Package, Zap, CheckCircle2, AlertTriangle, Smartphone, Heart,
} from "lucide-react";
import MobileNavConfigurator from "../components/MobileNavConfigurator";
import HomeCookSettingsTab from "../components/HomeCookSettingsTab";
import SidebarNavSettings from "@/portals/reservation/components/SidebarNavSettings";

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

interface FeatureModule {
  id: string;
  module_slug: string;
  module_name: string;
  status: string;
  release_type: string;
}

interface OrgInfo {
  id: string;
  name: string;
  slug: string;
  subscription_tier: string | null;
  max_venues: number | null;
  max_members: number | null;
  settings: Record<string, unknown> | null;
}

// ═══════════════════════════════════════════════════════
// MODULE ICON MAP
// ═══════════════════════════════════════════════════════

const moduleIcons: Record<string, React.ElementType> = {
  dashboard: BarChart3,
  recipes: ChefHat,
  ingredients: Package,
  "bev-dashboard": Wine,
  "restos-dashboard": Building2,
  "clock-dashboard": Clock,
  "labour-dashboard": DollarSign,
  "reservation-dashboard": CalendarDays,
  "overhead-dashboard": DollarSign,
  "money-dashboard": DollarSign,
  "growth-dashboard": Megaphone,
  "quiet-dashboard": Shield,
  "supply-dashboard": Package,
};

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

const AdminSettings = () => {
  const [modules, setModules] = useState<FeatureModule[]>([]);
  const [orgs, setOrgs] = useState<OrgInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [modulesRes, orgsRes] = await Promise.all([
      supabase.from("feature_releases").select("*").order("sort_order", { ascending: true }),
      supabase.from("organizations").select("id, name, slug, subscription_tier, max_venues, max_members, settings"),
    ]);
    setModules((modulesRes.data as FeatureModule[]) || []);
    setOrgs((orgsRes.data as OrgInfo[]) || []);
    setLoading(false);
  };

  const toggleModuleStatus = async (mod: FeatureModule) => {
    const newStatus = mod.status === "released" ? "development" : "released";
    const { error } = await supabase
      .from("feature_releases")
      .update({ status: newStatus })
      .eq("id", mod.id);
    if (error) {
      toast.error(`Failed to update ${mod.module_name}`);
    } else {
      toast.success(`${mod.module_name} → ${newStatus}`);
      setModules(prev => prev.map(m => m.id === mod.id ? { ...m, status: newStatus } : m));
    }
  };

  const updateOrgTier = async (orgId: string, tier: string) => {
    const { error } = await supabase
      .from("organizations")
      .update({ subscription_tier: tier })
      .eq("id", orgId);
    if (error) {
      toast.error("Failed to update tier");
    } else {
      toast.success("Subscription tier updated");
      setOrgs(prev => prev.map(o => o.id === orgId ? { ...o, subscription_tier: tier } : o));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="w-8 h-8 text-primary" />
            Control Center Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Platform configuration, feature flags, organization management
          </p>
        </div>
        <Button variant="outline" onClick={loadData} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      <Tabs defaultValue="orgs">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="orgs" className="gap-2"><Building2 className="w-4 h-4" />Organizations</TabsTrigger>
          <TabsTrigger value="home-cook" className="gap-2"><Heart className="w-4 h-4" />Home Cook</TabsTrigger>
          <TabsTrigger value="lab" className="gap-2"><FlaskConical className="w-4 h-4" />Quiet Lab</TabsTrigger>
          <TabsTrigger value="platform" className="gap-2"><Globe className="w-4 h-4" />Platform</TabsTrigger>
          <TabsTrigger value="mobile-ui" className="gap-2"><Smartphone className="w-4 h-4" />Mobile UI</TabsTrigger>
          <TabsTrigger value="web-sidebar" className="gap-2"><Globe className="w-4 h-4" />Web Sidebar</TabsTrigger>
        </TabsList>

        {/* ── Organizations ── */}
        <TabsContent value="orgs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Organizations
              </CardTitle>
              <CardDescription>Manage subscription tiers and limits per organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {orgs.map(org => (
                <div key={org.id} className="p-4 rounded-lg border bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold flex items-center gap-2">
                        {org.name}
                        {org.id === QUIET_LAB_ORG_ID && (
                          <Badge variant="outline" className="text-xs font-mono">LAB</Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">{org.slug}</p>
                    </div>
                    <Badge variant={org.subscription_tier === "pro" ? "default" : "secondary"}>
                      {org.subscription_tier || "free"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Subscription Tier</Label>
                      <Select
                        value={org.subscription_tier || "free"}
                        onValueChange={(v) => updateOrgTier(org.id, v)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="starter">Starter</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Max Venues</Label>
                      <p className="text-lg font-bold mt-1">{org.max_venues ?? "∞"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Max Members</Label>
                      <p className="text-lg font-bold mt-1">{org.max_members ?? "∞"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Home Cook ── */}
        <TabsContent value="home-cook" className="space-y-4">
          <HomeCookSettingsTab />
        </TabsContent>

        {/* ── Quiet Lab ── */}
        <TabsContent value="lab" className="space-y-4">
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-primary" />
                {QUIET_LAB_ORG_NAME}
              </CardTitle>
              <CardDescription>
                Isolated test environment — all seeding, nuking & testing scoped here
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard
                  icon={Shield}
                  title="Customer Protection"
                  description="Seed/nuke operations are hardwired to Quiet Lab org. Beta and customer accounts cannot be affected."
                  status="active"
                />
                <InfoCard
                  icon={Database}
                  title="Data Isolation"
                  description="All test data is scoped by org_id. Quiet Lab data never leaks to production orgs."
                  status="active"
                />
                <InfoCard
                  icon={Zap}
                  title="Pre-Release Validation"
                  description="Test new features against seeded data before pushing updates to customer accounts."
                  status="active"
                />
                <InfoCard
                  icon={BarChart3}
                  title="Test History"
                  description="All test runs are persisted in the test_runs table with full result details."
                  status="active"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Quiet Lab Org ID</Label>
                <code className="block p-2 rounded bg-muted text-xs font-mono">{QUIET_LAB_ORG_ID}</code>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => window.location.href = "/admin/seed"} className="gap-2">
                  <Database className="w-4 h-4" /> Seed Data
                </Button>
                <Button variant="outline" onClick={() => window.location.href = "/admin/testing"} className="gap-2">
                  <FlaskConical className="w-4 h-4" /> Test Suite
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Platform ── */}
        <TabsContent value="platform" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Dev Mode</p>
                    <p className="text-xs text-muted-foreground">Currently <strong>{false ? "ON" : "OFF"}</strong> — auth is enforced</p>
                  </div>
                  <Badge variant="default">Production</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Email Confirmation</p>
                    <p className="text-xs text-muted-foreground">Users must verify email before login</p>
                  </div>
                  <Badge variant="outline">Required</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Role-Based Access</p>
                    <p className="text-xs text-muted-foreground">admin, owner, head_chef, line_chef roles</p>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Database
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Row Level Security</p>
                    <p className="text-xs text-muted-foreground">All tables protected by org_id scoping</p>
                  </div>
                  <Badge variant="default">Enforced</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Realtime</p>
                    <p className="text-xs text-muted-foreground">Live data subscriptions</p>
                  </div>
                  <Badge variant="outline">Available</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Edge Functions</p>
                    <p className="text-xs text-muted-foreground">Backend compute layer</p>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Email (Resend)</p>
                    <p className="text-xs text-muted-foreground">Transactional emails via Resend API</p>
                  </div>
                  <Badge variant="default">Configured</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Push Notifications</p>
                    <p className="text-xs text-muted-foreground">Mobile push via Capacitor</p>
                  </div>
                  <Badge variant="secondary">Planned</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">SMS</p>
                    <p className="text-xs text-muted-foreground">SMS notifications</p>
                  </div>
                  <Badge variant="secondary">Planned</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Deployment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Published URL</p>
                    <p className="text-xs text-muted-foreground font-mono">chefos.ai</p>
                  </div>
                  <Badge variant="default">Live</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Capacitor (iOS/Android)</p>
                    <p className="text-xs text-muted-foreground">Native app wrappers</p>
                  </div>
                  <Badge variant="outline">Configured</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Mobile UI ── */}
        <TabsContent value="mobile-ui" className="space-y-4">
          <MobileNavConfigurator />
        </TabsContent>

        <TabsContent value="web-sidebar" className="space-y-4">
          <SidebarNavSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════

const InfoCard = ({ icon: Icon, title, description, status }: {
  icon: React.ElementType;
  title: string;
  description: string;
  status: "active" | "inactive";
}) => (
  <div className="p-4 rounded-lg border bg-card">
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="font-medium text-sm">{title}</p>
          <CheckCircle2 className="w-4 h-4 text-primary" />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  </div>
);

export default AdminSettings;
