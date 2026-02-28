import { useState, useEffect, useMemo } from "react";
import {
  Search,
  CheckCircle2,
  RotateCcw,
  CalendarCheck,
  PartyPopper,
  Map,
  Kanban,
  Users,
  Settings,
} from "lucide-react";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

import {
  TEST_SUITES,
  type TestSuite,
  type TestCase,
} from "../data/testPlanData";

// ---------------------------------------------------------------------------
// Icon mapping: the data file stores icon names as strings, so we map them
// to actual Lucide components here.
// ---------------------------------------------------------------------------
const SUITE_ICONS: Record<string, React.ElementType> = {
  CalendarCheck,
  PartyPopper,
  Map,
  Kanban,
  Users,
  Settings,
};

// ---------------------------------------------------------------------------
// Workflow tabs definition
// ---------------------------------------------------------------------------
const WORKFLOW_TABS = [
  { value: "all", label: "All" },
  { value: "reservation", label: "Reservation" },
  { value: "function", label: "Function" },
  { value: "service", label: "Service" },
  { value: "venueflow", label: "VenueFlow" },
  { value: "crm", label: "CRM" },
  { value: "navigation", label: "Navigation" },
] as const;

// ---------------------------------------------------------------------------
// Priority configuration
// ---------------------------------------------------------------------------
const PRIORITIES = ["all", "P0", "P1", "P2"] as const;

const priorityColor: Record<string, string> = {
  P0: "bg-red-600 text-white hover:bg-red-700",
  P1: "bg-amber-500 text-white hover:bg-amber-600",
  P2: "bg-muted text-muted-foreground hover:bg-muted/80",
};

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------
const STORAGE_KEY = "res_test_plan_state";

function loadCheckedState(): Record<string, boolean> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const ResTestPlan = () => {
  // ----- state -------------------------------------------------------------
  const [checked, setChecked] = useState<Record<string, boolean>>(loadCheckedState);
  const [workflowFilter, setWorkflowFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [expandedCase, setExpandedCase] = useState<string | null>(null);

  // Persist checked state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
  }, [checked]);

  // ----- derived data ------------------------------------------------------
  const allCases = useMemo(() => TEST_SUITES.flatMap((s) => s.cases), []);
  const totalCases = allCases.length;
  const completedCases = allCases.filter((c) => checked[c.id]).length;
  const progressPercent =
    totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0;

  const filteredSuites = useMemo(
    () =>
      TEST_SUITES.filter(
        (s) => workflowFilter === "all" || s.workflow === workflowFilter,
      )
        .map((s) => ({
          ...s,
          cases: s.cases.filter((c) => {
            if (priorityFilter !== "all" && c.priority !== priorityFilter)
              return false;
            if (searchQuery) {
              const q = searchQuery.toLowerCase();
              return (
                c.title.toLowerCase().includes(q) ||
                c.description.toLowerCase().includes(q) ||
                c.tags.some((t) => t.toLowerCase().includes(q))
              );
            }
            return true;
          }),
        }))
        .filter((s) => s.cases.length > 0),
    [workflowFilter, priorityFilter, searchQuery],
  );

  // ----- handlers ----------------------------------------------------------
  const toggleCase = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleReset = () => {
    if (window.confirm("Reset all checkboxes? This cannot be undone.")) {
      setChecked({});
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedCase((prev) => (prev === id ? null : id));
  };

  // ----- helpers -----------------------------------------------------------
  const suiteCompletedCount = (suite: TestSuite) =>
    suite.cases.filter((c) => checked[c.id]).length;

  const SuiteIcon = ({ iconName }: { iconName: string }) => {
    const Icon = SUITE_ICONS[iconName];
    if (!Icon) return null;
    return <Icon className="h-5 w-5 shrink-0" />;
  };

  // ----- render ------------------------------------------------------------
  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-5xl mx-auto pb-20">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Test Plan
          </h1>
          <p className="text-sm text-muted-foreground">
            Interactive test plan for the ResOS reservation portal.{" "}
            <span className="font-medium text-foreground">
              {completedCases}/{totalCases}
            </span>{" "}
            cases completed ({progressPercent}%)
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="shrink-0 gap-1.5"
        >
          <RotateCcw className="h-4 w-4" />
          Reset All
        </Button>
      </div>

      <Progress value={progressPercent} className="h-2" />

      {/* ── Workflow filter tabs ─────────────────────────────────────── */}
      <Tabs
        value={workflowFilter}
        onValueChange={setWorkflowFilter}
        className="w-full"
      >
        <TabsList className="flex flex-wrap h-auto gap-1">
          {WORKFLOW_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* ── Search + Priority filter ─────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cases by title, description, or tag..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1">
          {PRIORITIES.map((p) => (
            <Badge
              key={p}
              variant={priorityFilter === p ? "default" : "outline"}
              className={`cursor-pointer select-none transition-colors ${
                priorityFilter === p && p !== "all"
                  ? priorityColor[p] ?? ""
                  : ""
              }`}
              onClick={() => setPriorityFilter(p)}
            >
              {p === "all" ? "All" : p}
            </Badge>
          ))}
        </div>
      </div>

      {/* ── Test suites ──────────────────────────────────────────────── */}
      {filteredSuites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No test cases match the current filters.
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {filteredSuites.map((suite) => {
            const completed = suiteCompletedCount(suite);
            const total = suite.cases.length;

            return (
              <AccordionItem
                key={suite.id}
                value={suite.id}
                className="border rounded-lg"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-3 text-left w-full">
                    <SuiteIcon iconName={suite.icon} />
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm text-foreground">
                        {suite.name}
                      </span>
                      <p className="text-xs text-muted-foreground truncate">
                        {suite.description}
                      </p>
                    </div>
                    <Badge
                      variant={completed === total ? "default" : "secondary"}
                      className="shrink-0 tabular-nums"
                    >
                      {completed}/{total}
                    </Badge>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-4 pb-4 pt-0">
                  <div className="space-y-1">
                    {suite.cases.map((tc) => (
                      <TestCaseRow
                        key={tc.id}
                        testCase={tc}
                        isChecked={!!checked[tc.id]}
                        isExpanded={expandedCase === tc.id}
                        onToggleCheck={() => toggleCase(tc.id)}
                        onToggleExpand={() => toggleExpanded(tc.id)}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {/* ── Sticky bottom progress bar ───────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-5xl mx-auto flex items-center gap-3 px-4 py-2 lg:px-6">
          <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <Progress value={progressPercent} className="flex-1 h-2" />
          <span className="text-xs font-medium text-muted-foreground tabular-nums whitespace-nowrap">
            {completedCases}/{totalCases} ({progressPercent}%)
          </span>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// TestCaseRow sub-component
// ---------------------------------------------------------------------------
interface TestCaseRowProps {
  testCase: TestCase;
  isChecked: boolean;
  isExpanded: boolean;
  onToggleCheck: () => void;
  onToggleExpand: () => void;
}

function TestCaseRow({
  testCase,
  isChecked,
  isExpanded,
  onToggleCheck,
  onToggleExpand,
}: TestCaseRowProps) {
  const tc = testCase;

  return (
    <div
      className={`rounded-md border transition-colors ${
        isChecked
          ? "bg-muted/50 border-border/50"
          : "bg-background border-border"
      }`}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-3 py-2">
        <Checkbox
          checked={isChecked}
          onCheckedChange={onToggleCheck}
          className="shrink-0"
        />

        <button
          type="button"
          className="flex flex-1 items-center gap-2 text-left min-w-0"
          onClick={onToggleExpand}
        >
          <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
            {tc.id}
          </Badge>

          <span
            className={`text-sm flex-1 min-w-0 truncate ${
              isChecked
                ? "line-through text-muted-foreground"
                : "text-foreground"
            }`}
          >
            {tc.title}
          </span>
        </button>

        <Badge
          className={`shrink-0 text-[10px] ${priorityColor[tc.priority] ?? ""}`}
        >
          {tc.priority}
        </Badge>

        {tc.persona.map((p) => (
          <Badge
            key={p}
            variant="outline"
            className="hidden sm:inline-flex shrink-0 text-[10px]"
          >
            {p}
          </Badge>
        ))}
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="border-t px-3 py-3 space-y-3 text-sm">
          {/* Description */}
          <p className="text-muted-foreground">{tc.description}</p>

          {/* Preconditions */}
          {tc.preconditions.length > 0 && (
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-1">
                Preconditions
              </h4>
              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground text-xs">
                {tc.preconditions.map((pre, i) => (
                  <li key={i}>{pre}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Steps table */}
          {tc.steps.length > 0 && (
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-1">
                Steps
              </h4>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left px-2 py-1.5 font-medium text-muted-foreground w-10">
                        #
                      </th>
                      <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">
                        Action
                      </th>
                      <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">
                        Expected
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tc.steps.map((step) => (
                      <tr key={step.stepNumber} className="border-t">
                        <td className="px-2 py-1.5 text-muted-foreground tabular-nums">
                          {step.stepNumber}
                        </td>
                        <td className="px-2 py-1.5 text-foreground">
                          {step.action}
                        </td>
                        <td className="px-2 py-1.5 text-muted-foreground">
                          {step.expected}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Expected result */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Expected Result
            </h4>
            <p className="text-xs text-foreground">{tc.expectedResult}</p>
          </div>

          {/* Tags */}
          {tc.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {tc.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-[10px] font-normal"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ResTestPlan;
