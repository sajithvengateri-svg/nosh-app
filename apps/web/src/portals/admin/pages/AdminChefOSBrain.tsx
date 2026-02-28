import { useState, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Brain,
  Users,
  Globe,
  Rocket,
  Bug,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  Calendar,
  FlaskConical,
  AlertTriangle,
  Truck,
  TrendingUp,
  Zap,
  MessageSquare,
  Send,
  RefreshCw,
  Plus,
  Loader2,
  Shield,
  ChefHat,
  Home,
  Store,
  Target,
  Activity,
  Package,
  Tag,
  Eye,
  MousePointer,
  ShoppingCart,
} from "lucide-react";

// ─── Constants ──────────────────────────────────────────────────────────────

const BETA_START = new Date("2025-03-01");
const BETA_END = new Date("2025-03-31");

const VARIANTS = [
  "chefos_au", "homechef_au", "eatsafe_au",
  "chefos_in", "homechef_in", "eatsafe_in",
  "chefos_uae", "homechef_uae", "eatsafe_uae",
  "chefos_uk", "homechef_uk", "eatsafe_uk",
  "chefos_sg", "homechef_sg", "eatsafe_sg",
  "chefos_us", "homechef_us", "eatsafe_us",
];

const TEST_SECTIONS = [
  { id: "auth-1.1", section: "Auth", label: "Landing Page", cases: ["auth-1.1.1","auth-1.1.2","auth-1.1.3","auth-1.1.4","auth-1.1.5"] },
  { id: "auth-1.2", section: "Auth", label: "Sign Up", cases: ["auth-1.2.1","auth-1.2.2","auth-1.2.3","auth-1.2.4","auth-1.2.5","auth-1.2.6","auth-1.2.7","auth-1.2.8","auth-1.2.9","auth-1.2.10","auth-1.2.11"] },
  { id: "auth-1.3", section: "Auth", label: "Email Confirmation", cases: ["auth-1.3.1","auth-1.3.2","auth-1.3.3","auth-1.3.4"] },
  { id: "auth-1.4", section: "Auth", label: "Login", cases: ["auth-1.4.1","auth-1.4.2","auth-1.4.3","auth-1.4.4","auth-1.4.5","auth-1.4.6","auth-1.4.7","auth-1.4.8","auth-1.4.9","auth-1.4.10","auth-1.4.11","auth-1.4.12"] },
  { id: "auth-1.5", section: "Auth", label: "Forgot Password", cases: ["auth-1.5.1","auth-1.5.2","auth-1.5.3","auth-1.5.4","auth-1.5.5","auth-1.5.6","auth-1.5.7"] },
  { id: "auth-1.6", section: "Auth", label: "Session", cases: ["auth-1.6.1","auth-1.6.2","auth-1.6.3"] },
  { id: "dashboard-2", section: "Dashboard", label: "Dashboard", cases: ["dashboard-2.1","dashboard-2.2","dashboard-2.3","dashboard-2.4","dashboard-2.5","dashboard-2.6","dashboard-2.7","dashboard-2.8"] },
  { id: "recipes-3", section: "Recipes", label: "Recipes", cases: ["recipes-3.1","recipes-3.2","recipes-3.3","recipes-3.4","recipes-3.5","recipes-3.6","recipes-3.7","recipes-3.8","recipes-3.9","recipes-3.10","recipes-3.11","recipes-3.12","recipes-3.13"] },
  { id: "prep-4", section: "Prep", label: "Prep Lists", cases: ["prep-4.1","prep-4.2","prep-4.3","prep-4.4","prep-4.5","prep-4.6"] },
  { id: "safety-5", section: "Food Safety", label: "Food Safety", cases: ["safety-5.1","safety-5.2","safety-5.3","safety-5.4"] },
  { id: "kitchen-6", section: "Kitchen", label: "Kitchen / Todo", cases: ["kitchen-6.1","kitchen-6.2"] },
  { id: "settings-7", section: "Settings", label: "Settings", cases: ["settings-7.1","settings-7.2","settings-7.3","settings-7.4","settings-7.5"] },
  { id: "referral-8", section: "Referral", label: "Referral / Share", cases: ["referral-8.1","referral-8.2","referral-8.3","referral-8.4","referral-8.5"] },
  { id: "games-9", section: "Games", label: "Games / Mastery", cases: ["games-9.1","games-9.2","games-9.3"] },
  { id: "web-10", section: "Web", label: "Web App", cases: ["web-10.1","web-10.2","web-10.3","web-10.4","web-10.5","web-10.6","web-10.7","web-10.8"] },
  { id: "variant-11", section: "Variant", label: "Cross-Variant", cases: ["variant-11.1","variant-11.2","variant-11.3","variant-11.4","variant-11.5"] },
  { id: "devmode-12", section: "DevMode", label: "Dev Mode Checks", cases: ["devmode-12.1","devmode-12.2","devmode-12.3","devmode-12.4","devmode-12.5","devmode-12.6"] },
  { id: "vendor-1", section: "Vendor", label: "Vendor Onboarding", cases: ["vendor-1.1","vendor-1.2","vendor-1.3","vendor-1.4","vendor-1.5"] },
  { id: "vendor-2", section: "Vendor", label: "Vendor Catalogue", cases: ["vendor-2.1","vendor-2.2","vendor-2.3","vendor-2.4","vendor-2.5"] },
  { id: "vendor-3", section: "Vendor", label: "Vendor Demand", cases: ["vendor-3.1","vendor-3.2","vendor-3.3","vendor-3.4","vendor-3.5"] },
  { id: "vendor-4", section: "Vendor", label: "Vendor Deals", cases: ["vendor-4.1","vendor-4.2","vendor-4.3","vendor-4.4","vendor-4.5"] },
  { id: "vendor-5", section: "Vendor", label: "Vendor Analytics", cases: ["vendor-5.1","vendor-5.2","vendor-5.3","vendor-5.4","vendor-5.5"] },
];

const ALL_CASES = TEST_SECTIONS.flatMap((s) => s.cases);

const TIMELINE = [
  { week: "Week 1", dates: "Mar 1-7", label: "Onboard & Auth", tasks: ["Onboard testers + vendors", "Auth testing all streams", "Vendor catalogue upload", "Baseline analytics"] },
  { week: "Week 2", dates: "Mar 8-14", label: "Core Features", tasks: ["Recipes, prep, food safety", "Vendor demand heatmap live", "Team sync testing", "Kitchen / todo flows"] },
  { week: "Week 3", dates: "Mar 15-21", label: "Payments & Deals", tasks: ["Payment testing ($1/₹1/1AED)", "Vendor deals testing", "Referral system", "Games / mastery"] },
  { week: "Week 4", dates: "Mar 22-28", label: "Engine Testing", tasks: ["AI usage metering", "Share credits & referrals", "Vendor analytics review", "Cross-variant checks"] },
  { week: "Final", dates: "Mar 29-31", label: "Go/No-Go", tasks: ["Final regression pass", "P1 bug review", "Vendor sign-off", "Go/no-go decision"] },
];

const REGIONS = ["au", "in", "uae", "uk", "sg", "us", "admin"];
const STREAMS = ["chefos", "homechef", "eatsafe", "vendor", "team"];

// ─── Helpers ────────────────────────────────────────────────────────────────

function daysRemaining() {
  const now = new Date();
  if (now > BETA_END) return 0;
  if (now < BETA_START) return differenceInDays(BETA_END, BETA_START);
  return differenceInDays(BETA_END, now);
}

function statusColor(s: string) {
  if (s === "pass") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (s === "fail") return "bg-red-500/20 text-red-400 border-red-500/30";
  if (s === "blocked") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
}

function severityColor(s: string) {
  if (s === "P1") return "destructive";
  if (s === "P2") return "default";
  if (s === "P3") return "secondary";
  return "outline";
}

// ─── Component ──────────────────────────────────────────────────────────────

const AdminChefOSBrain = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // ─── Queries ──────────────────────────────────────────────────────────────

  const { data: goChecks = [] } = useQuery({
    queryKey: ["brain-go-checks"],
    queryFn: async () => {
      const { data } = await supabase.from("test_plan_go_checks").select("*").order("id");
      return data || [];
    },
  });

  const { data: testerTargets = [] } = useQuery({
    queryKey: ["brain-tester-targets"],
    queryFn: async () => {
      const { data } = await supabase.from("test_plan_tester_targets").select("*").order("region").order("stream");
      return data || [];
    },
  });

  const { data: testResults = [] } = useQuery({
    queryKey: ["brain-test-results"],
    queryFn: async () => {
      const { data } = await supabase.from("test_plan_results").select("*");
      return data || [];
    },
  });

  const { data: bugs = [] } = useQuery({
    queryKey: ["brain-bugs"],
    queryFn: async () => {
      const { data } = await supabase.from("test_plan_bugs").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: analyticsEvents = [] } = useQuery({
    queryKey: ["brain-analytics-summary"],
    queryFn: async () => {
      const { data } = await supabase
        .from("beta_analytics_events")
        .select("variant, event_type, page, action, duration_ms, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      return data || [];
    },
  });

  const { data: brainInsights = [] } = useQuery({
    queryKey: ["brain-insights"],
    queryFn: async () => {
      const { data } = await supabase
        .from("brain_insights")
        .select("*")
        .order("insight_date", { ascending: false })
        .limit(30);
      return data || [];
    },
  });

  const { data: vendorProfiles = [] } = useQuery({
    queryKey: ["brain-vendor-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("vendor_beta_profiles").select("*").order("vendor_name");
      return data || [];
    },
  });

  const { data: vendorProducts = [] } = useQuery({
    queryKey: ["brain-vendor-products"],
    queryFn: async () => {
      const { data } = await supabase.from("vendor_beta_products").select("*");
      return data || [];
    },
  });

  const { data: vendorDeals = [] } = useQuery({
    queryKey: ["brain-vendor-deals"],
    queryFn: async () => {
      const { data } = await supabase.from("vendor_beta_deals").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  // ─── Derived stats ───────────────────────────────────────────────────────

  const totalTesters = useMemo(
    () => testerTargets.reduce((sum, t) => sum + (t.target_count || 0), 0),
    [testerTargets]
  );
  const actualTesters = useMemo(
    () => testerTargets.reduce((sum, t) => sum + (t.actual_count || 0), 0),
    [testerTargets]
  );

  const passedTests = testResults.filter((r) => r.status === "pass").length;
  const totalPossible = ALL_CASES.length * VARIANTS.length;
  const passRate = totalPossible > 0 ? Math.round((passedTests / totalPossible) * 100) : 0;
  const p1Bugs = bugs.filter((b) => b.severity === "P1" && b.status === "open").length;
  const goChecksPass = goChecks.filter((c) => c.passed).length;
  const goChecksTotal = goChecks.length;

  // ─── Mutations ────────────────────────────────────────────────────────────

  const toggleGoCheck = useCallback(async (id: string, passed: boolean) => {
    const { error } = await supabase
      .from("test_plan_go_checks")
      .update({ passed, checked_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    queryClient.invalidateQueries({ queryKey: ["brain-go-checks"] });
  }, [queryClient]);

  const updateTesterCount = useCallback(async (id: string, actual_count: number) => {
    const { error } = await supabase
      .from("test_plan_tester_targets")
      .update({ actual_count, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    queryClient.invalidateQueries({ queryKey: ["brain-tester-targets"] });
    toast.success("Updated");
  }, [queryClient]);

  const updateTargetCount = useCallback(async (id: string, target_count: number) => {
    const { error } = await supabase
      .from("test_plan_tester_targets")
      .update({ target_count, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    queryClient.invalidateQueries({ queryKey: ["brain-tester-targets"] });
    toast.success("Target updated");
  }, [queryClient]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Brain className="w-8 h-8 text-primary" />
          ChefOS Brain
        </h1>
        <p className="text-muted-foreground mt-1">
          Beta Test Command Center — March 1-31 · {daysRemaining()} days remaining
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="gap-1.5"><Rocket className="w-3.5 h-3.5" />Overview</TabsTrigger>
          <TabsTrigger value="testers" className="gap-1.5"><Users className="w-3.5 h-3.5" />Testers</TabsTrigger>
          <TabsTrigger value="tests" className="gap-1.5"><FlaskConical className="w-3.5 h-3.5" />Test Cases</TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1.5"><Calendar className="w-3.5 h-3.5" />Timeline</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" />Analytics</TabsTrigger>
          <TabsTrigger value="vendor" className="gap-1.5"><Store className="w-3.5 h-3.5" />Vendor Command</TabsTrigger>
          <TabsTrigger value="brain" className="gap-1.5"><Zap className="w-3.5 h-3.5" />AI Brain</TabsTrigger>
          <TabsTrigger value="bugs" className="gap-1.5"><Bug className="w-3.5 h-3.5" />Bugs</TabsTrigger>
        </TabsList>

        {/* ═══════ TAB 1: OVERVIEW ═══════ */}
        <TabsContent value="overview">
          <OverviewTab
            totalTesters={totalTesters}
            actualTesters={actualTesters}
            passRate={passRate}
            p1Bugs={p1Bugs}
            goChecks={goChecks}
            goChecksPass={goChecksPass}
            goChecksTotal={goChecksTotal}
            vendorProfiles={vendorProfiles}
            toggleGoCheck={toggleGoCheck}
          />
        </TabsContent>

        {/* ═══════ TAB 2: TESTERS ═══════ */}
        <TabsContent value="testers">
          <TesterMatrixTab
            testerTargets={testerTargets}
            updateTesterCount={updateTesterCount}
            updateTargetCount={updateTargetCount}
          />
        </TabsContent>

        {/* ═══════ TAB 3: TEST CASES ═══════ */}
        <TabsContent value="tests">
          <TestCasesTab testResults={testResults} queryClient={queryClient} />
        </TabsContent>

        {/* ═══════ TAB 4: TIMELINE ═══════ */}
        <TabsContent value="timeline">
          <TimelineTab />
        </TabsContent>

        {/* ═══════ TAB 5: ANALYTICS ═══════ */}
        <TabsContent value="analytics">
          <AnalyticsTab events={analyticsEvents} />
        </TabsContent>

        {/* ═══════ TAB 6: VENDOR COMMAND ═══════ */}
        <TabsContent value="vendor">
          <VendorCommandTab
            vendors={vendorProfiles}
            products={vendorProducts}
            deals={vendorDeals}
          />
        </TabsContent>

        {/* ═══════ TAB 7: AI BRAIN ═══════ */}
        <TabsContent value="brain">
          <AIBrainTab insights={brainInsights} />
        </TabsContent>

        {/* ═══════ TAB 8: BUGS ═══════ */}
        <TabsContent value="bugs">
          <BugTrackerTab bugs={bugs} queryClient={queryClient} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// TAB COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

// ─── Overview Tab ───────────────────────────────────────────────────────────

function OverviewTab({
  totalTesters, actualTesters, passRate, p1Bugs,
  goChecks, goChecksPass, goChecksTotal, vendorProfiles, toggleGoCheck,
}: {
  totalTesters: number; actualTesters: number; passRate: number; p1Bugs: number;
  goChecks: any[]; goChecksPass: number; goChecksTotal: number;
  vendorProfiles: any[]; toggleGoCheck: (id: string, passed: boolean) => void;
}) {
  const kpis = [
    { label: "Target Testers", value: totalTesters, icon: Users, color: "text-blue-400" },
    { label: "Actual Testers", value: actualTesters, icon: Target, color: "text-emerald-400" },
    { label: "Countries", value: 6, icon: Globe, color: "text-purple-400" },
    { label: "App Streams", value: 3, icon: Rocket, color: "text-orange-400" },
    { label: "Vendors", value: vendorProfiles.length || 5, icon: Store, color: "text-cyan-400" },
    { label: "Pass Rate", value: `${passRate}%`, icon: CheckCircle2, color: "text-emerald-400" },
    { label: "Days Left", value: daysRemaining(), icon: Clock, color: "text-yellow-400" },
    { label: "P1 Bugs", value: p1Bugs, icon: Bug, color: p1Bugs > 0 ? "text-red-400" : "text-emerald-400" },
  ];

  return (
    <div className="space-y-6 mt-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                  </div>
                  <kpi.icon className={cn("w-6 h-6", kpi.color)} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Progress bar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Go/No-Go Checks</span>
              <span className="font-mono">{goChecksPass}/{goChecksTotal}</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${goChecksTotal > 0 ? (goChecksPass / goChecksTotal) * 100 : 0}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Go/No-Go Checklist */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" /> Go / No-Go Checklist
          </CardTitle>
          <CardDescription>All must pass before App Store submission</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {goChecks.map((check) => (
              <div
                key={check.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border",
                  check.passed ? "border-emerald-500/30 bg-emerald-500/5" : "border-muted"
                )}
              >
                <Switch
                  checked={check.passed}
                  onCheckedChange={(v) => toggleGoCheck(check.id, v)}
                />
                <span className={cn("flex-1 text-sm", check.passed && "line-through text-muted-foreground")}>
                  {check.label}
                </span>
                {check.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tester Matrix Tab ──────────────────────────────────────────────────────

function TesterMatrixTab({
  testerTargets, updateTesterCount, updateTargetCount,
}: {
  testerTargets: any[];
  updateTesterCount: (id: string, v: number) => void;
  updateTargetCount: (id: string, v: number) => void;
}) {
  const regionLabels: Record<string, string> = { au: "Australia", in: "India", uae: "UAE", uk: "UK", sg: "Singapore", us: "USA", admin: "Admin Team" };

  const grouped = useMemo(() => {
    const map: Record<string, Record<string, any>> = {};
    for (const t of testerTargets) {
      if (!map[t.region]) map[t.region] = {};
      map[t.region][t.stream] = t;
    }
    return map;
  }, [testerTargets]);

  function cell(region: string, stream: string) {
    const t = grouped[region]?.[stream];
    if (!t) return <TableCell className="text-center text-muted-foreground">—</TableCell>;
    const pct = t.target_count > 0 ? t.actual_count / t.target_count : 0;
    const bg = pct >= 1 ? "bg-emerald-500/10" : pct > 0 ? "bg-yellow-500/10" : "";
    return (
      <TableCell className={cn("text-center", bg)}>
        <div className="flex items-center justify-center gap-1">
          <Input
            type="number"
            className="w-12 h-7 text-center text-xs p-0"
            value={t.actual_count}
            onChange={(e) => updateTesterCount(t.id, parseInt(e.target.value) || 0)}
            min={0}
          />
          <span className="text-[10px] text-muted-foreground">/</span>
          <Input
            type="number"
            className="w-12 h-7 text-center text-xs p-0"
            value={t.target_count}
            onChange={(e) => updateTargetCount(t.id, parseInt(e.target.value) || 0)}
            min={0}
          />
        </div>
      </TableCell>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" /> Tester Matrix
          </CardTitle>
          <CardDescription>Actual / Target — edit inline and it saves to Supabase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Region</TableHead>
                  <TableHead className="text-center"><ChefHat className="w-4 h-4 mx-auto" /><span className="text-[10px]">ChefOS</span></TableHead>
                  <TableHead className="text-center"><Home className="w-4 h-4 mx-auto" /><span className="text-[10px]">HomeChef</span></TableHead>
                  <TableHead className="text-center"><Shield className="w-4 h-4 mx-auto" /><span className="text-[10px]">EatSafe</span></TableHead>
                  <TableHead className="text-center"><Truck className="w-4 h-4 mx-auto" /><span className="text-[10px]">Vendor</span></TableHead>
                  <TableHead className="text-center"><Users className="w-4 h-4 mx-auto" /><span className="text-[10px]">Team</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {REGIONS.map((region) => (
                  <TableRow key={region}>
                    <TableCell className="font-medium">{regionLabels[region] || region.toUpperCase()}</TableCell>
                    {STREAMS.map((stream) => cell(region, stream))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Test Cases Tab ─────────────────────────────────────────────────────────

function TestCasesTab({ testResults, queryClient }: { testResults: any[]; queryClient: any }) {
  const [filterSection, setFilterSection] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterVariant, setFilterVariant] = useState("all");

  const resultMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const r of testResults) m[`${r.case_id}:${r.variant}`] = r.status;
    return m;
  }, [testResults]);

  const sections = useMemo(() => [...new Set(TEST_SECTIONS.map((s) => s.section))], []);

  const filteredSections = useMemo(() => {
    if (filterSection === "all") return TEST_SECTIONS;
    return TEST_SECTIONS.filter((s) => s.section === filterSection);
  }, [filterSection]);

  const updateResult = useCallback(async (caseId: string, variant: string, status: string) => {
    const { error } = await supabase
      .from("test_plan_results")
      .upsert({ case_id: caseId, variant, status, tested_at: new Date().toISOString() }, { onConflict: "case_id,variant" });
    if (error) { toast.error(error.message); return; }
    queryClient.invalidateQueries({ queryKey: ["brain-test-results"] });
  }, [queryClient]);

  return (
    <div className="space-y-4 mt-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterSection} onValueChange={setFilterSection}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Section" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            {sections.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pass">Pass</SelectItem>
            <SelectItem value="fail">Fail</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterVariant} onValueChange={setFilterVariant}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Variant" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Variants</SelectItem>
            {VARIANTS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Test case sections */}
      {filteredSections.map((sec) => (
        <Card key={sec.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{sec.label}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32 text-xs">Case</TableHead>
                    {(filterVariant === "all" ? VARIANTS.slice(0, 6) : [filterVariant]).map((v) => (
                      <TableHead key={v} className="text-center text-[10px] px-1">{v.replace("_", "\n")}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sec.cases.map((caseId) => {
                    const variants = filterVariant === "all" ? VARIANTS.slice(0, 6) : [filterVariant];
                    const show = filterStatus === "all" || variants.some((v) => (resultMap[`${caseId}:${v}`] || "pending") === filterStatus);
                    if (!show) return null;
                    return (
                      <TableRow key={caseId}>
                        <TableCell className="text-xs font-mono">{caseId}</TableCell>
                        {variants.map((v) => {
                          const st = resultMap[`${caseId}:${v}`] || "pending";
                          return (
                            <TableCell key={v} className="text-center p-1">
                              <button
                                onClick={() => {
                                  const next = st === "pending" ? "pass" : st === "pass" ? "fail" : st === "fail" ? "blocked" : "pending";
                                  updateResult(caseId, v, next);
                                }}
                                className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium", statusColor(st))}
                              >
                                {st}
                              </button>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Timeline Tab ───────────────────────────────────────────────────────────

function TimelineTab() {
  const now = new Date();
  const dayOfMonth = now.getMonth() === 2 ? now.getDate() : 0;

  return (
    <div className="space-y-4 mt-4">
      {TIMELINE.map((week, i) => {
        const weekStart = [1, 8, 15, 22, 29][i];
        const weekEnd = [7, 14, 21, 28, 31][i];
        const isActive = dayOfMonth >= weekStart && dayOfMonth <= weekEnd;
        const isPast = dayOfMonth > weekEnd;

        return (
          <motion.div key={week.week} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className={cn(isActive && "border-primary ring-1 ring-primary/20", isPast && "opacity-60")}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                    isActive ? "bg-primary text-primary-foreground" : isPast ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground"
                  )}>
                    {isPast ? <CheckCircle2 className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{week.week}: {week.label}</h3>
                      <Badge variant={isActive ? "default" : "outline"} className="text-[10px]">{week.dates}</Badge>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {week.tasks.map((task) => (
                        <li key={task} className="text-sm text-muted-foreground flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Analytics Tab ──────────────────────────────────────────────────────────

function AnalyticsTab({ events }: { events: any[] }) {
  const [filterRegion, setFilterRegion] = useState("all");
  const [filterStream, setFilterStream] = useState("all");

  const filtered = useMemo(() => {
    let f = events;
    if (filterRegion !== "all") f = f.filter((e) => e.variant?.includes(filterRegion));
    if (filterStream !== "all") f = f.filter((e) => e.variant?.startsWith(filterStream));
    return f;
  }, [events, filterRegion, filterStream]);

  // Page usage
  const pageUsage = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of filtered) {
      if (e.page) map[e.page] = (map[e.page] || 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 15);
  }, [filtered]);

  // Action usage
  const actionUsage = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of filtered) {
      if (e.action) map[e.action] = (map[e.action] || 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 15);
  }, [filtered]);

  // Average session time
  const avgSession = useMemo(() => {
    const sessions = filtered.filter((e) => e.event_type === "session_end" && e.duration_ms);
    if (sessions.length === 0) return 0;
    return Math.round(sessions.reduce((s, e) => s + (e.duration_ms || 0), 0) / sessions.length / 1000);
  }, [filtered]);

  // Deep-dive pages
  const deepDivePages = ["food-safety", "prep-lists", "team-sync"];

  return (
    <div className="space-y-6 mt-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterRegion} onValueChange={setFilterRegion}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Region" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {["au","in","uae","uk","sg","us"].map((r) => <SelectItem key={r} value={r}>{r.toUpperCase()}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStream} onValueChange={setFilterStream}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Stream" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Streams</SelectItem>
            <SelectItem value="chefos">ChefOS</SelectItem>
            <SelectItem value="homechef">HomeChef</SelectItem>
            <SelectItem value="eatsafe">EatSafe</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{filtered.length}</p>
              </div>
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Session</p>
                <p className="text-2xl font-bold">{avgSession}s</p>
              </div>
              <Clock className="w-6 h-6 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Unique Pages</p>
                <p className="text-2xl font-bold">{pageUsage.length}</p>
              </div>
              <BarChart3 className="w-6 h-6 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Pages + Top Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            {pageUsage.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events yet</p>
            ) : (
              <div className="space-y-2">
                {pageUsage.map(([page, count]) => (
                  <div key={page} className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1">{page}</span>
                    <Badge variant="secondary" className="ml-2">{count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {actionUsage.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events yet</p>
            ) : (
              <div className="space-y-2">
                {actionUsage.map(([action, count]) => (
                  <div key={action} className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1">{action}</span>
                    <Badge variant="secondary" className="ml-2">{count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Deep Dives */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Feature Deep Dives</CardTitle>
          <CardDescription>Food Safety · Prep Lists · Team Sync</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {deepDivePages.map((page) => {
              const pageEvents = filtered.filter((e) => e.page?.includes(page));
              const actions = pageEvents.filter((e) => e.event_type === "action");
              const avgDur = pageEvents.filter((e) => e.duration_ms).reduce((s, e) => s + (e.duration_ms || 0), 0);
              const avgTime = pageEvents.filter((e) => e.duration_ms).length > 0
                ? Math.round(avgDur / pageEvents.filter((e) => e.duration_ms).length / 1000) : 0;
              return (
                <div key={page} className="p-3 rounded-lg border">
                  <h4 className="font-medium text-sm capitalize">{page.replace("-", " ")}</h4>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <p>Views: {pageEvents.filter((e) => e.event_type === "page_view").length}</p>
                    <p>Actions: {actions.length}</p>
                    <p>Avg Time: {avgTime}s</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Vendor Command Tab ─────────────────────────────────────────────────────

function VendorCommandTab({ vendors, products, deals }: { vendors: any[]; products: any[]; deals: any[] }) {
  return (
    <div className="space-y-6 mt-4">
      {/* Vendor Health Grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Store className="w-5 h-5" /> Vendor Health Grid
          </CardTitle>
          <CardDescription>5 vendors × quality score</CardDescription>
        </CardHeader>
        <CardContent>
          {vendors.length === 0 ? (
            <p className="text-sm text-muted-foreground">No vendors onboarded yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {vendors.map((v) => {
                const vProducts = products.filter((p) => p.vendor_id === v.id);
                const vDeals = deals.filter((d) => d.vendor_id === v.id);
                const score = v.quality_score || 0;
                const scoreColor = score >= 70 ? "text-emerald-400" : score >= 40 ? "text-yellow-400" : "text-red-400";
                return (
                  <div key={v.id} className="p-4 rounded-lg border space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm truncate">{v.vendor_name}</h4>
                      <span className={cn("text-lg font-bold", scoreColor)}>{score}</span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>{v.vendor_type} · {v.postcode || "—"}</p>
                      <p>ABN: {v.abn_verified ? "✓ Verified" : "Pending"}</p>
                      <p>Products: {vProducts.length}</p>
                      <p>Deals: {vDeals.filter((d) => d.status === "active").length} active</p>
                      <p>Onboarded: {v.onboarded_at ? format(new Date(v.onboarded_at), "MMM d") : "Not yet"}</p>
                    </div>
                    {/* Score bar */}
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-yellow-500" : "bg-red-500")} style={{ width: `${score}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deal Performance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Tag className="w-5 h-5" /> Deal Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deals created yet</p>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead className="text-center"><Eye className="w-3.5 h-3.5 mx-auto" /></TableHead>
                    <TableHead className="text-center"><MousePointer className="w-3.5 h-3.5 mx-auto" /></TableHead>
                    <TableHead className="text-center"><ShoppingCart className="w-3.5 h-3.5 mx-auto" /></TableHead>
                    <TableHead>Conv %</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deals.map((deal) => {
                    const vendor = vendors.find((v) => v.id === deal.vendor_id);
                    const conv = deal.impressions > 0 ? ((deal.redemptions / deal.impressions) * 100).toFixed(1) : "0";
                    return (
                      <TableRow key={deal.id}>
                        <TableCell className="text-sm">{vendor?.vendor_name || "—"}</TableCell>
                        <TableCell className="text-sm">{deal.deal_type}</TableCell>
                        <TableCell className="text-sm font-mono">{deal.deal_value}</TableCell>
                        <TableCell className="text-xs">{deal.target_apps?.join(", ")}</TableCell>
                        <TableCell className="text-center text-sm">{deal.impressions}</TableCell>
                        <TableCell className="text-center text-sm">{deal.clicks}</TableCell>
                        <TableCell className="text-center text-sm">{deal.redemptions}</TableCell>
                        <TableCell className="text-sm font-mono">{conv}%</TableCell>
                        <TableCell>
                          <Badge variant={deal.status === "active" ? "default" : "secondary"}>{deal.status}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product catalogue summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5" /> Catalogue Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vendors.length === 0 ? (
            <p className="text-sm text-muted-foreground">No vendors yet</p>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-center">Products</TableHead>
                    <TableHead className="text-center">In Stock</TableHead>
                    <TableHead className="text-center">Dual Priced</TableHead>
                    <TableHead className="text-center">Organic</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.map((v) => {
                    const vp = products.filter((p) => p.vendor_id === v.id);
                    const inStock = vp.filter((p) => p.in_stock).length;
                    const dualPriced = vp.filter((p) => p.price_homechef && p.price_chefos).length;
                    const organic = vp.filter((p) => p.is_organic).length;
                    return (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium text-sm">{v.vendor_name}</TableCell>
                        <TableCell className="text-center">{vp.length}</TableCell>
                        <TableCell className="text-center">{inStock}</TableCell>
                        <TableCell className="text-center">{dualPriced}</TableCell>
                        <TableCell className="text-center">{organic}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── AI Brain Tab ───────────────────────────────────────────────────────────

function AIBrainTab({ insights }: { insights: any[] }) {
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const triggerDailyAnalysis = useCallback(async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("brain-daily-analysis", { body: { force: true } });
      if (error) throw error;
      toast.success("Daily analysis generated");
    } catch (err: any) {
      toast.error(`Analysis failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  }, []);

  const sendChat = useCallback(async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: msg }]);
    setChatLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("brain-daily-analysis", {
        body: { mode: "chat", question: msg },
      });
      if (error) throw error;
      setChatMessages((prev) => [...prev, { role: "assistant", content: data?.answer || "No response" }]);
    } catch (err: any) {
      setChatMessages((prev) => [...prev, { role: "assistant", content: `Error: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput]);

  return (
    <div className="space-y-6 mt-4">
      {/* Daily insights */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5" /> Daily Insights
              </CardTitle>
              <CardDescription>AI-generated summaries from beta data</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={triggerDailyAnalysis} disabled={generating}>
              {generating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
              Generate Now
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <p className="text-sm text-muted-foreground">No insights yet — click "Generate Now" or wait for the daily cron</p>
          ) : (
            <div className="space-y-4">
              {insights.slice(0, 7).map((insight) => {
                const result = insight.result as any;
                return (
                  <div key={insight.id} className="p-4 rounded-lg border space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{format(new Date(insight.insight_date), "MMM d, yyyy")}</Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {insight.provider} · {insight.prompt_tokens ?? 0}+{insight.completion_tokens ?? 0} tokens
                      </span>
                    </div>
                    {result?.summary && <p className="text-sm">{result.summary}</p>}
                    {result?.highlights && (
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {(result.highlights as string[]).map((h, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    )}
                    {result?.recommendations && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Recommendations:</p>
                        <ul className="text-sm space-y-1">
                          {(result.recommendations as string[]).map((r, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 mt-0.5 flex-shrink-0" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat interface */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" /> Ask the Brain
          </CardTitle>
          <CardDescription>
            Ask questions about beta data — "which users haven't logged a temp in 5 days?"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Messages */}
            {chatMessages.length > 0 && (
              <div className="max-h-80 overflow-y-auto space-y-3 p-3 rounded-lg border bg-muted/30">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                      msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-3 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Ask about beta data..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                disabled={chatLoading}
              />
              <Button size="sm" onClick={sendChat} disabled={chatLoading || !chatInput.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Bug Tracker Tab ────────────────────────────────────────────────────────

function BugTrackerTab({ bugs, queryClient }: { bugs: any[]; queryClient: any }) {
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterBugStatus, setFilterBugStatus] = useState("all");
  const [showAddBug, setShowAddBug] = useState(false);
  const [newBug, setNewBug] = useState({ title: "", severity: "P3", variant: "", note: "" });

  const filtered = useMemo(() => {
    let f = bugs;
    if (filterSeverity !== "all") f = f.filter((b) => b.severity === filterSeverity);
    if (filterBugStatus !== "all") f = f.filter((b) => b.status === filterBugStatus);
    return f;
  }, [bugs, filterSeverity, filterBugStatus]);

  const addBug = useCallback(async () => {
    if (!newBug.title.trim()) { toast.error("Title required"); return; }
    const { error } = await supabase.from("test_plan_bugs").insert({
      title: newBug.title.trim(),
      severity: newBug.severity,
      variant: newBug.variant || null,
      note: newBug.note || null,
    });
    if (error) { toast.error(error.message); return; }
    setNewBug({ title: "", severity: "P3", variant: "", note: "" });
    setShowAddBug(false);
    queryClient.invalidateQueries({ queryKey: ["brain-bugs"] });
    toast.success("Bug added");
  }, [newBug, queryClient]);

  const updateBugStatus = useCallback(async (id: string, status: string) => {
    const { error } = await supabase.from("test_plan_bugs").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    queryClient.invalidateQueries({ queryKey: ["brain-bugs"] });
  }, [queryClient]);

  const p1Count = bugs.filter((b) => b.severity === "P1" && b.status === "open").length;

  return (
    <div className="space-y-4 mt-4">
      {/* P1 warning */}
      {p1Count > 0 && (
        <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-sm font-medium text-red-400">{p1Count} P1 bug{p1Count > 1 ? "s" : ""} open — blocks go-live</span>
        </div>
      )}

      {/* Filters + Add */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Severity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="P1">P1</SelectItem>
            <SelectItem value="P2">P2</SelectItem>
            <SelectItem value="P3">P3</SelectItem>
            <SelectItem value="P4">P4</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterBugStatus} onValueChange={setFilterBugStatus}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="fixed">Fixed</SelectItem>
            <SelectItem value="wontfix">Won't Fix</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => setShowAddBug(true)}>
          <Plus className="w-4 h-4 mr-1" /> Report Bug
        </Button>
      </div>

      {/* Bug table */}
      <Card>
        <CardContent className="p-0">
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-20">Severity</TableHead>
                  <TableHead className="w-28">Variant</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-28">Date</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {bugs.length === 0 ? "No bugs reported yet" : "No bugs match filters"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((bug) => (
                    <TableRow key={bug.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{bug.title}</p>
                          {bug.note && <p className="text-xs text-muted-foreground mt-0.5">{bug.note}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={severityColor(bug.severity) as any}>{bug.severity}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{bug.variant || "—"}</TableCell>
                      <TableCell>
                        <Select value={bug.status} onValueChange={(v) => updateBugStatus(bug.id, v)}>
                          <SelectTrigger className="h-7 text-xs w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="fixed">Fixed</SelectItem>
                            <SelectItem value="wontfix">Won't Fix</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {bug.created_at ? format(new Date(bug.created_at), "MMM d HH:mm") : "—"}
                      </TableCell>
                      <TableCell>
                        {bug.status === "open" && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => updateBugStatus(bug.id, "fixed")}>
                            Mark Fixed
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add bug dialog */}
      <Dialog open={showAddBug} onOpenChange={setShowAddBug}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Bug</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Bug title"
              value={newBug.title}
              onChange={(e) => setNewBug((p) => ({ ...p, title: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Select value={newBug.severity} onValueChange={(v) => setNewBug((p) => ({ ...p, severity: v }))}>
                <SelectTrigger><SelectValue placeholder="Severity" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="P1">P1 — Critical</SelectItem>
                  <SelectItem value="P2">P2 — Major</SelectItem>
                  <SelectItem value="P3">P3 — Minor</SelectItem>
                  <SelectItem value="P4">P4 — Trivial</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newBug.variant} onValueChange={(v) => setNewBug((p) => ({ ...p, variant: v }))}>
                <SelectTrigger><SelectValue placeholder="Variant" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {VARIANTS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder="Notes (optional)"
              value={newBug.note}
              onChange={(e) => setNewBug((p) => ({ ...p, note: e.target.value }))}
            />
            <Button onClick={addBug} className="w-full">Submit Bug</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminChefOSBrain;
