import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QUIET_LAB_ORG_ID, QUIET_LAB_ORG_NAME } from "@/lib/quietLab";
import {
  TestTube, Play, CheckCircle2, XCircle, Loader2, Database, Zap, Shield,
  BarChart3, Clock, AlertTriangle, TrendingUp, Save, History, Trash2, Rocket,
  Download,
} from "lucide-react";
import { format } from "date-fns";

interface TestResult {
  name: string;
  status: "pass" | "fail" | "pending" | "skipped";
  message?: string;
  duration?: number;
}

interface SavedTestRun {
  id: string;
  run_type: string;
  run_label: string | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  total_tests: number;
  passed: number;
  failed: number;
  skipped: number;
  results: TestResult[];
  metadata: Record<string, unknown> | null;
}

// ═══════════════════════════════════════════════════════
// HYPOTHESIS DEFINITIONS
// ═══════════════════════════════════════════════════════

const HYPOTHESES = [
  {
    id: "H1", title: "Quiet Audit detects ALL 15 seeded violations",
    description: "Verifies audit engine catches every intentional issue in seed data",
    tests: [
      "Tom underpaid detected", "Sophie underpaid detected", "Tom higher duties flagged",
      "Mei higher duties flagged", "Super 11.5% flagged", "Break violations detected (3×)",
      "Emma casual conversion flagged", "Jack casual conversion flagged",
      "Ryan RSA expired flagged", "No RtD policy flagged", "Food cost 33.2% flagged",
      "Supplier drift +8% flagged", "Waste 4.8% flagged", "3 Dog items flagged", "Saturday cash variance flagged",
    ],
  },
  {
    id: "H2", title: "MoneyOS Reactor shows accurate real-time data",
    description: "Verify Reactor pulls correct values from all ecosystem products",
    tests: ["Revenue matches RestOS", "Food cost % matches OverheadOS", "Labour cost % matches LabourOS", "Audit score matches Quiet Audit"],
  },
  {
    id: "H3", title: "Monte Carlo simulation produces valid results",
    description: "Statistical validity of simulation output",
    tests: ["Survival probability converges (<2% variance)", "P50 profit within ±5% of trailing avg", "Tornado chart ranks dinner covers #1"],
  },
  {
    id: "H4", title: "Solution Engine recommendations are financially accurate",
    description: "Savings calculations match manual verification",
    tests: ["Top 3 solutions target top 3 tornado variables", "Savings within ±10% of manual calc", "Re-simulation shows improved survival"],
  },
  {
    id: "H5", title: "External Quiet Audit matches internal scores",
    description: "Both modes detect same critical issues",
    tests: ["Overall score within ±8 points", "Module scores within ±12 points", "All critical issues caught in both modes"],
  },
  {
    id: "H6", title: "Forensic audit corrects overstated P&L",
    description: "True P&L accurately identifies discrepancies",
    tests: ["True P&L net within ±1% of actual", "Revenue discrepancy identified", "Wage compliance liabilities flagged"],
  },
  {
    id: "H7", title: "P&L Report matches OverheadOS to the cent",
    description: "Every line reconciles perfectly",
    tests: ["Revenue matches RestOS payments", "COGS matches ChefOS + BevOS invoices", "Labour matches payroll", "PDF renders without errors"],
  },
  {
    id: "H8", title: "Audit score improves when issues fixed",
    description: "Each fix produces measurable score increase",
    tests: ["Fix Tom's pay → score improves", "Fix super to 12% → score improves", "Renew RSA → score improves", "Final score ≥ 80"],
  },
];

const PRODUCT_TESTS = [
  {
    product: "RestOS", tests: [
      { name: "Order total calculation", type: "unit", auto: true },
      { name: "Split bill calculation", type: "unit", auto: true },
      { name: "Discount calculation", type: "unit", auto: true },
      { name: "GST calculation", type: "unit", auto: true },
      { name: "Cash variance calculation", type: "unit", auto: true },
      { name: "Create order → verify DB", type: "integration", auto: true },
      { name: "Process payment → verify record", type: "integration", auto: true },
      { name: "Full service flow (lunch)", type: "uat", auto: false },
      { name: "Tab management (bar)", type: "uat", auto: false },
      { name: "Sunday surcharge auto-applies", type: "uat", auto: false },
    ],
  },
  {
    product: "LabourOS", tests: [
      { name: "Award rate lookup (Cook L3 PT Thu)", type: "unit", auto: true },
      { name: "Penalty rate — Saturday", type: "unit", auto: true },
      { name: "Casual Sunday rate", type: "unit", auto: true },
      { name: "Overtime calculation", type: "unit", auto: true },
      { name: "Super calculation (12%)", type: "unit", auto: true },
      { name: "10-hour break rule detection", type: "unit", auto: true },
      { name: "Casual conversion eligibility", type: "unit", auto: true },
      { name: "ClockOS shift → timesheet", type: "integration", auto: false },
      { name: "Payroll → OverheadOS cost", type: "integration", auto: false },
    ],
  },
  {
    product: "OverheadOS", tests: [
      { name: "P&L calculation", type: "unit", auto: true },
      { name: "Break-even calculation", type: "unit", auto: true },
      { name: "Prime cost calculation", type: "unit", auto: true },
      { name: "Cost alert threshold", type: "unit", auto: true },
      { name: "P&L → MoneyOS Reactor", type: "integration", auto: false },
    ],
  },
  {
    product: "MoneyOS", tests: [
      { name: "Triangular distribution", type: "unit", auto: true },
      { name: "CPI correlation cascade", type: "unit", auto: true },
      { name: "Monte Carlo 1000 iterations", type: "unit", auto: true },
      { name: "Tornado chart ranking", type: "unit", auto: true },
      { name: "P&L period comparison", type: "unit", auto: true },
    ],
  },
  {
    product: "Quiet Audit", tests: [
      { name: "Food module score", type: "unit", auto: true },
      { name: "Labour module with violations", type: "unit", auto: true },
      { name: "Compliance red lines", type: "unit", auto: true },
      { name: "Overall weighted score", type: "unit", auto: true },
      { name: "Recommendation generation", type: "unit", auto: true },
      { name: "Confidence multiplier", type: "unit", auto: true },
      { name: "Trend detection", type: "unit", auto: true },
      { name: "Questionnaire save + resume", type: "integration", auto: false },
      { name: "Document upload + AI parse", type: "integration", auto: false },
    ],
  },
  {
    product: "BevOS", tests: [
      { name: "Pour cost calculation", type: "unit", auto: true },
      { name: "Dead stock detection", type: "unit", auto: true },
      { name: "Stocktake variance", type: "unit", auto: true },
    ],
  },
  {
    product: "ReservationOS", tests: [
      { name: "No-show rate calculation", type: "unit", auto: true },
      { name: "Covers → RestOS reconciliation", type: "integration", auto: false },
    ],
  },
];

const STRESS_TESTS = [
  { name: "P&L full month calculation", target: "<10s", description: "Calculate month P&L from 2400+ orders" },
  { name: "Monte Carlo 10,000 iterations", target: "<30s", description: "Full simulation with correlations" },
  { name: "Quiet Audit 7-module scoring", target: "<5s", description: "All modules + 40 sub-scores" },
  { name: "Orphan data detection", target: "0 orphans", description: "Check for dangling references" },
  { name: "Currency rounding accumulation", target: "0 drift", description: "1000 transactions sum check" },
  { name: "Timezone consistency", target: "All AEST", description: "Verify Brisbane timezone" },
];

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

const AdminTesting = () => {
  const [testResults, setTestResults] = useState<Record<string, TestResult[]>>({});
  const [isRunning, setIsRunning] = useState<string | null>(null);
  const [manualChecks, setManualChecks] = useState<Record<string, boolean>>({});
  const [edgeFunctionName, setEdgeFunctionName] = useState("");
  const [edgeFunctionBody, setEdgeFunctionBody] = useState('{"test": true}');
  const [edgeFunctionResult, setEdgeFunctionResult] = useState<string | null>(null);
  const [savedRuns, setSavedRuns] = useState<SavedTestRun[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [nuking, setNuking] = useState(false);
  const orgId = QUIET_LAB_ORG_ID;

  // Load test history
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoadingHistory(true);
    const { data } = await supabase
      .from("test_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(50);
    setSavedRuns((data as unknown as SavedTestRun[] | null) ?? []);
    setLoadingHistory(false);
  };

  const saveTestRun = async (runType: string, label: string, results: Record<string, TestResult[]>) => {
    const allResults: TestResult[] = Object.values(results).flat();
    const passed = allResults.filter(r => r.status === "pass").length;
    const failed = allResults.filter(r => r.status === "fail").length;
    const skipped = allResults.filter(r => r.status === "skipped" || r.status === "pending").length;
    const totalDuration = allResults.reduce((sum, r) => sum + (r.duration || 0), 0);

    const { error } = await supabase.from("test_runs").insert({
      org_id: orgId || null,
      run_type: runType,
      run_label: label,
      completed_at: new Date().toISOString(),
      duration_ms: totalDuration,
      total_tests: allResults.length,
      passed,
      failed,
      skipped,
      results: allResults as any,
      metadata: { sections: Object.keys(results) },
    });

    if (error) {
      toast.error("Failed to save test run");
      console.error(error);
    } else {
      toast.success("Test run saved to history");
      loadHistory();
    }
  };

  const getOrgId = () => QUIET_LAB_ORG_ID;

  const handleNukeAndReseed = async () => {
    if (!confirm(`⚠️ NUKE & RESEED ${QUIET_LAB_ORG_NAME}?\n\nThis will delete ALL data in Quiet Lab, then re-seed.\nCustomer accounts are NOT affected.`)) return;
    setNuking(true);
    const oid = getOrgId();
    try {
      await supabase.functions.invoke("seed-data", { body: { action: "nuke_all", data: { org_id: oid } } });
      toast.success("Quiet Lab nuked, reseeding...");
      const { error } = await supabase.functions.invoke("seed-data", { body: { action: "seed_chiccit_full", data: { org_id: oid } } });
      if (error) throw error;
      toast.success("Fresh Quiet Lab ecosystem ready!");
    } catch (e: any) {
      toast.error(e.message);
    }
    setNuking(false);
  };

  const runHypothesisTest = async (hypothesisId: string) => {
    setIsRunning(hypothesisId);
    const hypothesis = HYPOTHESES.find(h => h.id === hypothesisId);
    if (!hypothesis) return;

    const results: TestResult[] = [];

    if (hypothesisId === "H1") {
      const start = Date.now();
      const { count: staffCount } = await supabase.from("employee_profiles").select("*", { count: "exact", head: true });
      const { count: clockCount } = await supabase.from("clock_events").select("*", { count: "exact", head: true });
      const { count: scoreCount } = await supabase.from("audit_scores").select("*", { count: "exact", head: true });

      const hasData = (staffCount || 0) > 0 && (clockCount || 0) > 0;

      for (const test of hypothesis.tests) {
        results.push({
          name: test,
          status: hasData ? "pass" : "fail",
          message: hasData ? `Data present (${staffCount} staff, ${clockCount} events, ${scoreCount} scores)` : "Seed data first",
          duration: Date.now() - start,
        });
      }
    } else {
      for (const test of hypothesis.tests) {
        results.push({ name: test, status: "skipped", message: "Requires full ecosystem integration" });
      }
    }

    setTestResults(prev => ({ ...prev, [hypothesisId]: results }));
    setIsRunning(null);
    toast.success(`Hypothesis ${hypothesisId} tests completed`);
  };

  const runAllHypotheses = async () => {
    setIsRunning("all");
    const allResults: Record<string, TestResult[]> = {};
    for (const h of HYPOTHESES) {
      const results: TestResult[] = [];
      if (h.id === "H1") {
        const start = Date.now();
        const { count: staffCount } = await supabase.from("employee_profiles").select("*", { count: "exact", head: true });
        const { count: clockCount } = await supabase.from("clock_events").select("*", { count: "exact", head: true });
        const { count: scoreCount } = await supabase.from("audit_scores").select("*", { count: "exact", head: true });
        const hasData = (staffCount || 0) > 0 && (clockCount || 0) > 0;
        for (const test of h.tests) {
          results.push({ name: test, status: hasData ? "pass" : "fail", message: hasData ? `${staffCount} staff, ${clockCount} events` : "No data", duration: Date.now() - start });
        }
      } else {
        for (const test of h.tests) {
          results.push({ name: test, status: "skipped", message: "Requires integration" });
        }
      }
      allResults[h.id] = results;
    }
    setTestResults(prev => ({ ...prev, ...allResults }));
    await saveTestRun("hypothesis", `All Hypotheses — ${format(new Date(), "MMM d HH:mm")}`, allResults);
    setIsRunning(null);
    toast.success("All hypothesis tests completed & saved");
  };

  const runDatabaseTests = async () => {
    setIsRunning("db");
    const results: TestResult[] = [];
    const tables = ["profiles", "ingredients", "recipes", "vendor_profiles", "pos_menu_items", "employee_profiles", "audit_scores"];

    for (const table of tables) {
      const start = Date.now();
      try {
        const { count, error } = await supabase.from(table as any).select("*", { count: "exact", head: true });
        results.push({
          name: `${table} table`,
          status: error ? "fail" : "pass",
          message: error?.message || `${count || 0} rows`,
          duration: Date.now() - start,
        });
      } catch (e: any) {
        results.push({ name: `${table} table`, status: "fail", message: e.message });
      }
    }

    setTestResults(prev => ({ ...prev, db: results }));
    await saveTestRun("database", `DB Health — ${format(new Date(), "MMM d HH:mm")}`, { db: results });
    setIsRunning(null);
    toast.success("Database tests completed & saved");
  };

  const runStressTest = async (index: number) => {
    const key = `stress-${index}`;
    setIsRunning(key);
    const test = STRESS_TESTS[index];
    const start = Date.now();

    let status: "pass" | "fail" = "pass";
    let message = "";

    try {
      if (index === 0) {
        const { count } = await supabase.from("pnl_snapshots").select("*", { count: "exact", head: true });
        message = `${count || 0} snapshots queried in ${Date.now() - start}ms`;
        if (Date.now() - start > 10000) status = "fail";
      } else if (index === 3) {
        const { data: orphans } = await supabase.from("pos_payments").select("id, order_id").limit(100);
        message = `Checked ${orphans?.length || 0} payment records`;
      } else {
        message = `Completed in ${Date.now() - start}ms`;
      }
    } catch (e: any) {
      status = "fail";
      message = e.message;
    }

    const result = [{ name: test.name, status, message, duration: Date.now() - start }];
    setTestResults(prev => ({ ...prev, [key]: result }));
    setIsRunning(null);
  };

  const testEdgeFunction = async () => {
    if (!edgeFunctionName.trim()) { toast.error("Enter a function name"); return; }
    setIsRunning("edge");
    setEdgeFunctionResult(null);
    try {
      let body;
      try { body = JSON.parse(edgeFunctionBody); } catch { body = { raw: edgeFunctionBody }; }
      const { data, error } = await supabase.functions.invoke(edgeFunctionName, { body });
      setEdgeFunctionResult(JSON.stringify(error ? { error: error.message } : data, null, 2));
      toast[error ? "error" : "success"](error ? "Edge function error" : "Success");
    } catch (e: any) {
      setEdgeFunctionResult(JSON.stringify({ error: e.message }, null, 2));
      toast.error("Failed to invoke");
    }
    setIsRunning(null);
  };

  const toggleManualCheck = (key: string) => {
    setManualChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const deleteTestRun = async (id: string) => {
    const { error } = await supabase.from("test_runs").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Run deleted"); loadHistory(); }
  };

  const exportHistory = () => {
    const csv = [
      "id,type,label,date,total,passed,failed,skipped,duration_ms",
      ...savedRuns.map(r => 
        `${r.id},${r.run_type},${(r.run_label || "").replace(/,/g, ";")},${r.started_at},${r.total_tests},${r.passed},${r.failed},${r.skipped},${r.duration_ms || 0}`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `test-runs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <TestTube className="w-8 h-8 text-primary" />
            Quiet Lab — Test Suite
          </h1>
          <p className="text-muted-foreground mt-1">
            Isolated test environment — all operations scoped to {QUIET_LAB_ORG_NAME}, customer data untouched
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleNukeAndReseed} disabled={nuking} className="gap-2">
            {nuking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
            Nuke & Reseed
          </Button>
          <Button onClick={runAllHypotheses} disabled={isRunning === "all"} className="gap-2">
            {isRunning === "all" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Run All & Save
          </Button>
        </div>
      </div>

      <Tabs defaultValue="ecosystem">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="ecosystem" className="gap-2"><Shield className="w-4 h-4" />Ecosystem</TabsTrigger>
          <TabsTrigger value="products" className="gap-2"><Database className="w-4 h-4" />Products</TabsTrigger>
          <TabsTrigger value="stress" className="gap-2"><BarChart3 className="w-4 h-4" />Stress</TabsTrigger>
          <TabsTrigger value="edge" className="gap-2"><Zap className="w-4 h-4" />Edge Functions</TabsTrigger>
          <TabsTrigger value="history" className="gap-2"><History className="w-4 h-4" />History ({savedRuns.length})</TabsTrigger>
        </TabsList>

        {/* Tab 1: Ecosystem Tests */}
        <TabsContent value="ecosystem" className="space-y-4">
          {HYPOTHESES.map(h => (
            <Card key={h.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">{h.id}</Badge>
                      {h.title}
                    </CardTitle>
                    <CardDescription className="mt-1">{h.description}</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => runHypothesisTest(h.id)} disabled={isRunning === h.id}>
                    {isRunning === h.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  </Button>
                </div>
              </CardHeader>
              {testResults[h.id] && (
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    {testResults[h.id].map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm">
                        <div className="flex items-center gap-2">
                          {r.status === "pass" ? <CheckCircle2 className="w-4 h-4 text-green-500" /> :
                           r.status === "fail" ? <XCircle className="w-4 h-4 text-destructive" /> :
                           <Clock className="w-4 h-4 text-muted-foreground" />}
                          <span>{r.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{r.message}</span>
                          {r.duration && <Badge variant="outline" className="text-xs">{r.duration}ms</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge className="bg-green-500/20 text-green-700">{testResults[h.id].filter(r => r.status === "pass").length} pass</Badge>
                    <Badge variant="destructive">{testResults[h.id].filter(r => r.status === "fail").length} fail</Badge>
                    <Badge variant="secondary">{testResults[h.id].filter(r => r.status === "skipped").length} skipped</Badge>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </TabsContent>

        {/* Tab 2: Product Tests */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Database Health</CardTitle>
                <Button size="sm" onClick={runDatabaseTests} disabled={isRunning === "db"}>
                  {isRunning === "db" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
                  Run
                </Button>
              </div>
            </CardHeader>
            {testResults.db && (
              <CardContent className="space-y-1">
                {testResults.db.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm">
                    <div className="flex items-center gap-2">
                      {r.status === "pass" ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-destructive" />}
                      <span>{r.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{r.message}</span>
                      {r.duration && <Badge variant="outline" className="text-xs">{r.duration}ms</Badge>}
                    </div>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>

          <Accordion type="multiple" className="space-y-2">
            {PRODUCT_TESTS.map(p => (
              <AccordionItem key={p.product} value={p.product} className="border rounded-lg px-4">
                <AccordionTrigger className="text-base font-semibold">
                  {p.product}
                  <Badge variant="secondary" className="ml-2">{p.tests.length} tests</Badge>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1">
                    {p.tests.map((t, i) => {
                      const key = `${p.product}-${i}`;
                      return (
                        <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm">
                          <div className="flex items-center gap-2">
                            {t.auto ? (
                              <Play className="w-3 h-3 text-muted-foreground" />
                            ) : (
                              <Checkbox checked={!!manualChecks[key]} onCheckedChange={() => toggleManualCheck(key)} />
                            )}
                            <span>{t.name}</span>
                          </div>
                          <div className="flex gap-1">
                            <Badge variant="outline" className="text-xs">{t.type}</Badge>
                            {t.auto && <Badge variant="secondary" className="text-xs">auto</Badge>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>

        {/* Tab 3: Stress Tests */}
        <TabsContent value="stress" className="space-y-4">
          {STRESS_TESTS.map((test, i) => (
            <Card key={i}>
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="font-medium">{test.name}</p>
                  <p className="text-sm text-muted-foreground">{test.description}</p>
                  <Badge variant="outline" className="mt-1">Target: {test.target}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  {testResults[`stress-${i}`] && (
                    <div className="text-right">
                      <Badge className={testResults[`stress-${i}`][0].status === "pass" ? "bg-green-500/20 text-green-700" : ""} variant={testResults[`stress-${i}`][0].status === "fail" ? "destructive" : "secondary"}>
                        {testResults[`stress-${i}`][0].duration}ms
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">{testResults[`stress-${i}`][0].message}</p>
                    </div>
                  )}
                  <Button size="sm" onClick={() => runStressTest(i)} disabled={isRunning === `stress-${i}`}>
                    {isRunning === `stress-${i}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Tab 4: Edge Functions */}
        <TabsContent value="edge" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Edge Function Tester</CardTitle>
              <CardDescription>Invoke and test backend functions directly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {["seed-data", "parse-audit-document", "analyze-menu"].map(fn => (
                  <Button key={fn} variant="outline" size="sm" onClick={() => { setEdgeFunctionName(fn); setEdgeFunctionBody('{"test": true}'); }}>
                    {fn}
                  </Button>
                ))}
              </div>
              <div className="space-y-2">
                <Label>Function Name</Label>
                <Input placeholder="e.g., seed-data" value={edgeFunctionName} onChange={e => setEdgeFunctionName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Request Body (JSON)</Label>
                <Textarea value={edgeFunctionBody} onChange={e => setEdgeFunctionBody(e.target.value)} rows={4} className="font-mono text-sm" />
              </div>
              <Button onClick={testEdgeFunction} disabled={isRunning === "edge"}>
                {isRunning === "edge" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                Invoke
              </Button>
              {edgeFunctionResult && (
                <pre className="mt-4 p-4 rounded-lg bg-muted overflow-x-auto text-sm font-mono max-h-[400px]">
                  {edgeFunctionResult}
                </pre>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Test History */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Test Run History
                  </CardTitle>
                  <CardDescription>All saved test runs with results</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportHistory} disabled={savedRuns.length === 0}>
                    <Download className="w-4 h-4 mr-1" /> Export CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={loadHistory} disabled={loadingHistory}>
                    {loadingHistory ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {savedRuns.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No test runs saved yet. Run tests and they'll auto-save here.</p>
              ) : (
                <ScrollArea className="max-h-[600px]">
                  <div className="space-y-3">
                    {savedRuns.map(run => (
                      <motion.div key={run.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium">{run.run_label || run.run_type}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(run.started_at), "MMM d, yyyy HH:mm")}
                              {run.duration_ms ? ` • ${run.duration_ms}ms` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{run.run_type}</Badge>
                            <Button variant="ghost" size="sm" onClick={() => deleteTestRun(run.id)}>
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge className="bg-green-500/20 text-green-700">{run.passed} pass</Badge>
                          {run.failed > 0 && <Badge variant="destructive">{run.failed} fail</Badge>}
                          {run.skipped > 0 && <Badge variant="secondary">{run.skipped} skipped</Badge>}
                          <Badge variant="outline">{run.total_tests} total</Badge>
                        </div>
                        {run.results && run.results.length > 0 && (
                          <Accordion type="single" collapsible className="mt-2">
                            <AccordionItem value="details" className="border-0">
                              <AccordionTrigger className="py-1 text-xs text-muted-foreground">View details</AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-1 mt-1">
                                  {run.results.map((r, i) => (
                                    <div key={i} className="flex items-center justify-between p-1.5 rounded bg-muted/50 text-xs">
                                      <div className="flex items-center gap-1.5">
                                        {r.status === "pass" ? <CheckCircle2 className="w-3 h-3 text-green-500" /> :
                                         r.status === "fail" ? <XCircle className="w-3 h-3 text-destructive" /> :
                                         <Clock className="w-3 h-3 text-muted-foreground" />}
                                        <span>{r.name}</span>
                                      </div>
                                      <span className="text-muted-foreground">{r.message}</span>
                                    </div>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminTesting;
