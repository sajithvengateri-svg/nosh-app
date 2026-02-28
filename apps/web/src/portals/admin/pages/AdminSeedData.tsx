import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QUIET_LAB_ORG_ID, QUIET_LAB_ORG_NAME } from "@/lib/quietLab";
import {
  Database, Play, Loader2, ChefHat, Package, Users, Building2, Tag,
  Trash2, DollarSign, CalendarDays, BarChart3, Megaphone, Shield, Wine,
  Clock, AlertTriangle, CheckCircle2, Rocket, MapPin, FlaskConical,
} from "lucide-react";

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

interface SeedOption {
  id: string;
  label: string;
  icon: React.ElementType;
  count: string;
  group: "original" | "chiccit";
  description: string;
}

interface SeededIssue {
  id: number;
  issue: string;
  module: string;
  severity: "critical" | "warning" | "info";
}

// ═══════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════

const SEED_OPTIONS: SeedOption[] = [
  { id: "ingredients", label: "Ingredients", icon: Package, count: "~15", group: "original", description: "Base kitchen ingredients" },
  { id: "recipes", label: "Recipes", icon: ChefHat, count: "~5", group: "original", description: "Sample recipes with links" },
  { id: "demand", label: "Demand Insights", icon: Tag, count: "~7", group: "original", description: "Market demand data" },
  { id: "pos_menu", label: "POS Menu & Drinks", icon: Building2, count: "~36", group: "original", description: "Full POS menu with mods" },
  { id: "chiccit_staff", label: "Staff (22)", icon: Users, count: "22", group: "chiccit", description: "22 staff with compliance issues" },
  { id: "chiccit_revenue", label: "Revenue (90 days)", icon: DollarSign, count: "~1400", group: "chiccit", description: "90 days POS orders + payments" },
  { id: "chiccit_labour", label: "Labour (90 days)", icon: Clock, count: "~1600", group: "chiccit", description: "Clock events with OT + violations" },
  { id: "chiccit_overheads", label: "Overheads", icon: Building2, count: "~56", group: "chiccit", description: "Recurring + 3 months entries" },
  { id: "chiccit_pnl", label: "P&L Snapshots", icon: BarChart3, count: "~78", group: "chiccit", description: "Daily snapshots with cost creep" },
  { id: "chiccit_bev", label: "BevOS Cellar", icon: Wine, count: "~10", group: "chiccit", description: "Products + cellar + stocktake" },
  { id: "chiccit_reservations", label: "Reservations", icon: CalendarDays, count: "~700", group: "chiccit", description: "90 days bookings + no-shows" },
  { id: "chiccit_marketing", label: "Marketing", icon: Megaphone, count: "~5", group: "chiccit", description: "Campaigns (no Tue/Wed gap)" },
  { id: "chiccit_audit_scores", label: "Audit Scores", icon: Shield, count: "~78", group: "chiccit", description: "Daily scores (wrong compliance)" },
];

const SEEDED_ISSUES: SeededIssue[] = [
  { id: 1, issue: "Tom underpaid ($23.80 vs $25.05 award rate)", module: "Labour / Compliance", severity: "critical" },
  { id: 2, issue: "Sophie underpaid ($28.50 vs $29.43 casual L1)", module: "Labour / Compliance", severity: "critical" },
  { id: 3, issue: "Tom doing higher duties (L3 work at L2 pay)", module: "Labour", severity: "warning" },
  { id: 4, issue: "Mei doing higher duties (L3 work at L2 pay)", module: "Labour", severity: "warning" },
  { id: 5, issue: "Super at 11.5% not 12%", module: "Compliance", severity: "critical" },
  { id: 6, issue: "3× 10-hour break violations", module: "Labour", severity: "critical" },
  { id: 7, issue: "Emma not offered casual conversion (8+ months)", module: "Compliance", severity: "warning" },
  { id: 8, issue: "Jack not offered casual conversion (7+ months)", module: "Compliance", severity: "warning" },
  { id: 9, issue: "Ryan's RSA expired", module: "Compliance", severity: "critical" },
  { id: 10, issue: "No Right to Disconnect policy", module: "Compliance", severity: "warning" },
  { id: 11, issue: "Food cost creeping to 33.2%", module: "Food", severity: "warning" },
  { id: 12, issue: "Bakery supplier +8% price drift", module: "Food", severity: "info" },
  { id: 13, issue: "Waste trending to 4.8%", module: "Food", severity: "warning" },
  { id: 14, issue: "3 Dog menu items", module: "Food", severity: "info" },
  { id: 15, issue: "Saturday cash variance 2.8%", module: "Service", severity: "warning" },
];

const CLEAR_TABLES = [
  { table: "audit_scores", label: "Audit Scores" },
  { table: "pnl_snapshots", label: "P&L Snapshots" },
  { table: "pos_orders", label: "POS Orders" },
  { table: "pos_payments", label: "POS Payments" },
  { table: "clock_events", label: "Clock Events" },
  { table: "overhead_entries", label: "Overhead Entries" },
  { table: "overhead_recurring", label: "Overhead Recurring" },
  { table: "bev_products", label: "BevOS Products" },
  { table: "bev_cellar", label: "BevOS Cellar" },
  { table: "bev_stocktakes", label: "BevOS Stocktakes" },
  { table: "res_reservations", label: "Reservations" },
  { table: "growth_campaigns", label: "Marketing Campaigns" },
  { table: "employee_profiles", label: "Employee Profiles" },
  { table: "employee_documents", label: "Employee Documents" },
  { table: "ingredients", label: "Ingredients" },
  { table: "recipes", label: "Recipes" },
  { table: "pos_menu_items", label: "POS Menu Items" },
  { table: "pos_categories", label: "POS Categories" },
];

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

const AdminSeedData = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedingAll, setSeedingAll] = useState(false);
  const [nuking, setNuking] = useState(false);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);

  // Always use Quiet Lab org — never the user's real org
  const org_id = QUIET_LAB_ORG_ID;

  const toggleSection = (id: string) => {
    setSelectedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const runSeedAction = async (actionId: string) => {
    const actionMap: Record<string, string> = {
      ingredients: "seed_ingredients",
      recipes: "seed_recipes",
      demand: "seed_demand_insights",
      pos_menu: "seed_pos_menu",
      chiccit_staff: "seed_chiccit_staff",
      chiccit_revenue: "seed_chiccit_revenue",
      chiccit_labour: "seed_chiccit_labour",
      chiccit_overheads: "seed_chiccit_overheads",
      chiccit_pnl: "seed_chiccit_pnl",
      chiccit_bev: "seed_chiccit_bev",
      chiccit_reservations: "seed_chiccit_reservations",
      chiccit_marketing: "seed_chiccit_marketing",
      chiccit_audit_scores: "seed_chiccit_audit_scores",
    };

    const action = actionMap[actionId];
    if (!action) return null;

    const needsOrg = actionId === "pos_menu" || actionId.startsWith("chiccit_");
    const body: any = { action };
    if (needsOrg) body.data = { org_id };

    const { data, error } = await supabase.functions.invoke("seed-data", { body });
    if (error) throw new Error(error.message);
    if (!data?.success) throw new Error(data?.error || "Unknown error");
    return data;
  };

  const handleSeed = async () => {
    if (selectedSections.length === 0) {
      toast.error("Select at least one section to seed");
      return;
    }
    setIsSeeding(true);
    const results: string[] = [];
    for (const section of selectedSections) {
      try {
        const data = await runSeedAction(section);
        if (data) results.push(`${section}: ${data.count || 'done'}`);
      } catch (e: any) {
        toast.error(`Failed: ${section} — ${e.message}`);
      }
    }
    if (results.length > 0) toast.success(`Seeded: ${results.join(", ")}`);
    setIsSeeding(false);
  };

  const handleSeedEverything = async () => {
    setSeedingAll(true);
    try {
      const { data, error } = await supabase.functions.invoke("seed-data", {
        body: { action: "seed_chiccit_full", data: { org_id } },
      });
      if (error) throw error;
      toast.success("Full CHICC.iT ecosystem seeded into Quiet Lab!");
    } catch (e: any) {
      toast.error(`Seed failed: ${e.message}`);
    }
    setSeedingAll(false);
  };

  const handleNukeAll = async () => {
    if (!confirm(`⚠️ NUKE ALL DATA in ${QUIET_LAB_ORG_NAME}?\n\nThis will delete ALL operational data in the Quiet Lab test org.\nCustomer accounts are NOT affected.\n\nThis cannot be undone.`)) return;
    setNuking(true);
    try {
      const { data, error } = await supabase.functions.invoke("seed-data", {
        body: { action: "nuke_all", data: { org_id } },
      });
      if (error) throw error;
      if (!data?.success && data?.errors?.length > 0) {
        toast.warning(`Nuked ${data.cleared} tables, ${data.errors.length} errors`);
      } else {
        toast.success(`Nuked ${data?.cleared || 'all'} tables in Quiet Lab — fresh slate`);
      }
    } catch (e: any) {
      toast.error(`Nuke failed: ${e.message}`);
    }
    setNuking(false);
  };

  const handleNukeAndReseed = async () => {
    if (!confirm(`⚠️ NUKE & RESEED ${QUIET_LAB_ORG_NAME}?\n\nThis will:\n1. Delete ALL data in Quiet Lab\n2. Re-seed full CHICC.iT ecosystem\n\nCustomer accounts are NOT affected.`)) return;
    setNuking(true);
    try {
      await supabase.functions.invoke("seed-data", {
        body: { action: "nuke_all", data: { org_id } },
      });
      toast.success("Quiet Lab cleared, now reseeding...");
      const { data, error } = await supabase.functions.invoke("seed-data", {
        body: { action: "seed_chiccit_full", data: { org_id } },
      });
      if (error) throw error;
      toast.success("Full nuke & reseed complete in Quiet Lab!");
    } catch (e: any) {
      toast.error(`Nuke & Reseed failed: ${e.message}`);
    }
    setNuking(false);
  };

  const handleClearData = async (table: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("seed-data", {
        body: { action: "clear_table", data: { table, org_id } },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Unknown error");
      toast.success(`Cleared ${table} in Quiet Lab`);
    } catch (e: any) {
      toast.error(`Failed: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Database className="w-8 h-8 text-primary" />
          Ecosystem Seed Data
        </h1>
        <p className="text-muted-foreground mt-1">
          Populate the database with CHICC.iT Brisbane test data — 90 days, 15 intentional issues
        </p>
      </div>

      {/* Quiet Lab Banner */}
      <QuietLabBanner />

      {/* Venue Profile */}
      <VenueProfileCard />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Seed Sections */}
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Seed Sections</CardTitle>
                  <CardDescription>Select data types to populate in Quiet Lab</CardDescription>
                </div>
                <Button onClick={handleSeedEverything} disabled={seedingAll || isSeeding} variant="default" className="gap-2">
                  {seedingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                  Seed Everything
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground">Original Seeds</p>
              {SEED_OPTIONS.filter(o => o.group === "original").map(option => (
                <SeedRow key={option.id} option={option} checked={selectedSections.includes(option.id)} onToggle={() => toggleSection(option.id)} />
              ))}
              <Separator />
              <p className="text-sm font-medium text-muted-foreground">CHICC.iT Ecosystem Seeds</p>
              {SEED_OPTIONS.filter(o => o.group === "chiccit").map(option => (
                <SeedRow key={option.id} option={option} checked={selectedSections.includes(option.id)} onToggle={() => toggleSection(option.id)} />
              ))}

              <Button onClick={handleSeed} disabled={isSeeding || selectedSections.length === 0} className="w-full mt-4">
                {isSeeding ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Seeding...</> : <><Play className="w-4 h-4 mr-2" />Seed Selected ({selectedSections.length})</>}
              </Button>
            </CardContent>
          </Card>

          {/* Data Status Grid */}
          <Card>
            <CardHeader><CardTitle>Data Status (Quiet Lab)</CardTitle></CardHeader>
            <CardContent><DataStatusGrid orgId={org_id} /></CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Seeded Issues Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Seeded Issues ({SEEDED_ISSUES.length})
              </CardTitle>
              <CardDescription>Intentional problems for audit detection testing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
              {SEEDED_ISSUES.map(issue => (
                <div key={issue.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 text-sm">
                  <span className="font-mono text-muted-foreground w-5 shrink-0">#{issue.id}</span>
                  <div className="flex-1">
                    <p>{issue.issue}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{issue.module}</Badge>
                      <Badge variant={issue.severity === "critical" ? "destructive" : "secondary"} className="text-xs">
                        {issue.severity}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Clear Data */}
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Scoped to Quiet Lab only — customer data safe</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Button variant="destructive" className="w-full gap-2" onClick={handleNukeAll} disabled={nuking}>
                  {nuking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Nuke Quiet Lab Data
                </Button>
                <Button variant="outline" className="w-full gap-2 border-destructive text-destructive hover:bg-destructive/10" onClick={handleNukeAndReseed} disabled={nuking}>
                  {nuking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                  Nuke & Reseed Fresh
                </Button>
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground font-medium">Per-table clear (Quiet Lab)</p>
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {CLEAR_TABLES.map(item => (
                <Button key={item.table} variant="outline" size="sm" className="w-full justify-start text-destructive hover:bg-destructive/10" onClick={() => handleClearData(item.table)}>
                  <Trash2 className="w-3 h-3 mr-2" />{item.label}
                </Button>
              ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════

const QuietLabBanner = () => (
  <Card className="border-primary/30 bg-primary/5">
    <CardContent className="pt-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <FlaskConical className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            {QUIET_LAB_ORG_NAME}
            <Badge variant="outline" className="text-xs font-mono">ISOLATED</Badge>
          </h3>
          <p className="text-sm text-muted-foreground">
            All seeding, nuking & testing runs exclusively in Quiet Lab. Customer and beta accounts are never touched.
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const VenueProfileCard = () => (
  <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
    <CardContent className="pt-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
          <MapPin className="w-7 h-7 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold">CHICC.iT Brisbane</h3>
          <p className="text-sm text-muted-foreground">Casual Dining — Italian Wine Bar</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { label: "Seats", value: "60" },
            { label: "Trading", value: "6 days" },
            { label: "Staff", value: "22" },
            { label: "Weekly Rev", value: "$42k" },
          ].map(s => (
            <div key={s.label} className="px-3">
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

const SeedRow = ({ option, checked, onToggle }: { option: SeedOption; checked: boolean; onToggle: () => void }) => (
  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
    <div className="flex items-center gap-3">
      <Checkbox id={option.id} checked={checked} onCheckedChange={onToggle} />
      <option.icon className="w-4 h-4 text-muted-foreground" />
      <div>
        <Label htmlFor={option.id} className="cursor-pointer font-medium">{option.label}</Label>
        <p className="text-xs text-muted-foreground">{option.description}</p>
      </div>
    </div>
    <Badge variant="secondary" className="text-xs">{option.count}</Badge>
  </motion.div>
);

const DataStatusGrid = ({ orgId }: { orgId: string }) => {
  const [counts, setCounts] = useState<Record<string, number>>({});

  React.useEffect(() => {
    const fetchCounts = async () => {
      // Filter by org_id where possible to show only Quiet Lab data
      const [ingredients, recipes, staff, orders, payments, clockEvts, ohEntries, pnl, bevProds, res, campaigns, scores, posItems] = await Promise.all([
        supabase.from("ingredients").select("*", { count: "exact", head: true }).eq("org_id", orgId),
        supabase.from("recipes").select("*", { count: "exact", head: true }),
        supabase.from("employee_profiles").select("*", { count: "exact", head: true }).eq("org_id", orgId),
        supabase.from("pos_orders").select("*", { count: "exact", head: true }).eq("org_id", orgId),
        supabase.from("pos_payments").select("*", { count: "exact", head: true }).eq("org_id", orgId),
        supabase.from("clock_events").select("*", { count: "exact", head: true }).eq("org_id", orgId),
        supabase.from("overhead_entries").select("*", { count: "exact", head: true }).eq("org_id", orgId),
        supabase.from("pnl_snapshots").select("*", { count: "exact", head: true }).eq("org_id", orgId),
        supabase.from("bev_products").select("*", { count: "exact", head: true }).eq("org_id", orgId),
        supabase.from("res_reservations").select("*", { count: "exact", head: true }).eq("org_id", orgId),
        supabase.from("growth_campaigns").select("*", { count: "exact", head: true }).eq("org_id", orgId),
        supabase.from("audit_scores").select("*", { count: "exact", head: true }).eq("org_id", orgId),
        supabase.from("pos_menu_items").select("*", { count: "exact", head: true }).eq("org_id", orgId),
      ]);
      setCounts({
        ingredients: ingredients.count || 0,
        recipes: recipes.count || 0,
        staff: staff.count || 0,
        orders: orders.count || 0,
        payments: payments.count || 0,
        clockEvents: clockEvts.count || 0,
        overheadEntries: ohEntries.count || 0,
        pnlSnapshots: pnl.count || 0,
        bevProducts: bevProds.count || 0,
        reservations: res.count || 0,
        campaigns: campaigns.count || 0,
        auditScores: scores.count || 0,
        posItems: posItems.count || 0,
      });
    };
    fetchCounts();
  }, [orgId]);

  const items = [
    { label: "Staff", count: counts.staff, icon: Users },
    { label: "Orders", count: counts.orders, icon: DollarSign },
    { label: "Payments", count: counts.payments, icon: DollarSign },
    { label: "Clock Events", count: counts.clockEvents, icon: Clock },
    { label: "Overhead Entries", count: counts.overheadEntries, icon: Building2 },
    { label: "P&L Snapshots", count: counts.pnlSnapshots, icon: BarChart3 },
    { label: "Bev Products", count: counts.bevProducts, icon: Wine },
    { label: "Reservations", count: counts.reservations, icon: CalendarDays },
    { label: "Campaigns", count: counts.campaigns, icon: Megaphone },
    { label: "Audit Scores", count: counts.auditScores, icon: Shield },
    { label: "Ingredients", count: counts.ingredients, icon: Package },
    { label: "Recipes", count: counts.recipes, icon: ChefHat },
    { label: "POS Items", count: counts.posItems, icon: Tag },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {items.map(item => (
        <div key={item.label} className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
          <item.icon className="w-5 h-5 text-muted-foreground mb-1" />
          <p className="text-xl font-bold">{item.count ?? "—"}</p>
          <p className="text-xs text-muted-foreground text-center">{item.label}</p>
        </div>
      ))}
    </div>
  );
};

export default AdminSeedData;
