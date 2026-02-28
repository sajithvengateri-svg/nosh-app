import { useState } from "react";
import { motion } from "framer-motion";
import {
  Camera, Upload, Mail, List, Calendar, BarChart2, Plus, FileBarChart,
  Activity, CheckCircle2, AlertTriangle, Clock, XCircle, Users, CalendarClock,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrg } from "@/contexts/OrgContext";
import { useSystemHealth, ModuleHealth } from "@/hooks/useSystemHealth";
import { useServiceLogs, useSaveServiceLog, useDeleteServiceLog, getPriceAlerts } from "@/hooks/useHousekeeping";
import { DEFAULT_SERVICES } from "@/types/housekeeping";
import type { ServiceConfig } from "@/types/housekeeping";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import InvoiceScannerDialog from "@/components/inventory/InvoiceScannerDialog";
import ServicePillNav from "@/components/housekeeping/ServicePillNav";
import ServiceEntryDialog from "@/components/housekeeping/ServiceEntryDialog";
import ServiceListView from "@/components/housekeeping/ServiceListView";
import ServiceCalendarView from "@/components/housekeeping/ServiceCalendarView";
import ServiceConsumptionChart from "@/components/housekeeping/ServiceConsumptionChart";
import AddServiceDialog from "@/components/housekeeping/AddServiceDialog";
import ServiceSummaryCards from "@/components/housekeeping/ServiceSummaryCards";
import ServiceScheduleDialog from "@/components/housekeeping/ServiceScheduleDialog";
import ServiceReportView from "@/components/housekeeping/ServiceReportView";
import SystemHealthCircle from "@/components/dashboard/SystemHealthCircle";

/* ── Data Health sub-page (preserved from original) ── */

interface HousekeepingTask {
  title: string;
  description: string;
  module: string;
  link: string;
  delegateTo?: string;
}

const TASKS: Record<string, HousekeepingTask[]> = {
  daily: [
    { title: "Complete prep lists", description: "Mark all prep items as done before end of service", module: "prep", link: "/prep" },
    { title: "Log waste", description: "Record any food waste for today's service", module: "waste-log", link: "/waste-log" },
    { title: "Check food safety temps", description: "Ensure all fridge/freezer temps are logged", module: "food-safety", link: "/food-safety" },
  ],
  weekly: [
    { title: "Update inventory counts", description: "Do a quick stock take of key items", module: "inventory", link: "/inventory", delegateTo: "Sous Chef" },
    { title: "Review recipe costs", description: "Check recipes with price alerts", module: "recipes", link: "/recipes" },
    { title: "Review team roster", description: "Confirm next week's schedule", module: "roster", link: "/roster" },
  ],
  monthly: [
    { title: "Audit allergen declarations", description: "Verify all recipe allergens are current", module: "allergens", link: "/allergens" },
    { title: "Review staff training", description: "Check certifications and training modules", module: "training", link: "/training", delegateTo: "Sous Chef" },
    { title: "Equipment maintenance check", description: "Inspect and log equipment condition", module: "equipment", link: "/equipment" },
  ],
  quarterly: [
    { title: "Full equipment audit", description: "Complete inspection of all kitchen equipment", module: "equipment", link: "/equipment" },
    { title: "Menu engineering review", description: "Analyse Stars, Ploughhorses, Puzzles, Dogs", module: "menu-engineering", link: "/menu-engineering" },
    { title: "Self-assessment food safety audit", description: "Run the BCC self-assessment checklist", module: "food-safety", link: "/food-safety" },
  ],
  yearly: [
    { title: "Supplier contract review", description: "Renegotiate pricing and terms", module: "marketplace", link: "/marketplace" },
    { title: "Full food safety audit", description: "Comprehensive council-ready audit", module: "food-safety", link: "/food-safety" },
    { title: "Update team certifications", description: "Ensure all certs are renewed", module: "training", link: "/training" },
  ],
};

const HOME_COOK_TASKS: Record<string, HousekeepingTask[]> = {
  daily: [
    { title: "Check food safety temps", description: "Log fridge and freezer temperatures", module: "food-safety", link: "/food-safety" },
    { title: "Complete cleaning checklist", description: "Tick off daily kitchen cleaning tasks", module: "cleaning", link: "/housekeeping" },
  ],
  weekly: [
    { title: "Review pantry stock", description: "Check expiry dates and restock essentials", module: "inventory", link: "/inventory" },
    { title: "Update recipes", description: "Add new recipes or update existing ones", module: "recipes", link: "/recipes" },
    { title: "Review prep lists", description: "Plan next week's meal prep", module: "prep", link: "/prep" },
  ],
  monthly: [
    { title: "Deep clean kitchen", description: "Thorough clean of all surfaces and appliances", module: "cleaning", link: "/housekeeping" },
    { title: "Review food waste", description: "Check waste logs and reduce waste patterns", module: "waste-log", link: "/waste-log" },
    { title: "Equipment check", description: "Inspect appliances and check maintenance dates", module: "equipment", link: "/equipment" },
  ],
};

function HealthScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? "hsl(var(--success))" : score >= 50 ? "hsl(var(--warning))" : "hsl(var(--destructive))";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={8} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={8}
          strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-foreground">{score}</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Health</span>
      </div>
    </div>
  );
}

function VitalSignCard({ mod }: { mod: ModuleHealth }) {
  const statusConfig = {
    fresh: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", label: "Fresh" },
    recent: { icon: Clock, color: "text-primary", bg: "bg-primary/10", label: "Recent" },
    stale: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", label: "Stale" },
    very_stale: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Very Stale" },
    no_data: { icon: XCircle, color: "text-muted-foreground", bg: "bg-muted", label: "No Data" },
  };
  const cfg = statusConfig[mod.status];
  const Icon = cfg.icon;
  const timeAgo = mod.lastDataAt ? formatTimeAgo(new Date(mod.lastDataAt)) : "Never";

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3 flex items-center gap-3">
        <div className={cn("p-1.5 rounded-lg", cfg.bg)}>
          <Icon className={cn("w-4 h-4", cfg.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate">{mod.label}</p>
          <p className="text-[10px] text-muted-foreground">{timeAgo} · {mod.recordCount} records</p>
        </div>
        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", cfg.bg, cfg.color)}>
          {cfg.label}
        </span>
      </CardContent>
    </Card>
  );
}

function formatTimeAgo(date: Date): string {
  const hours = (Date.now() - date.getTime()) / (1000 * 60 * 60);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${Math.round(hours)}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.round(days / 7)}w ago`;
  return `${Math.round(days / 30)}mo ago`;
}

function TaskCard({ task }: { task: HousekeepingTask }) {
  return (
    <Link to={task.link} className="block">
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-foreground">{task.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{task.description}</p>
            </div>
            {task.delegateTo && (
              <span className="flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                <Users className="w-2.5 h-2.5" />
                {task.delegateTo}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function DataHealthView() {
  const { currentOrg, storeMode } = useOrg();
  const isHomeCook = storeMode === "home_cook";
  const { score, moduleScores, recommendations, isLoading } = useSystemHealth(currentOrg?.id, storeMode);
  const activeTasks = isHomeCook ? HOME_COOK_TASKS : TASKS;

  return (
    <div className="space-y-5">
      {/* Health Score */}
      <Card>
        <CardContent className="p-5 flex flex-col sm:flex-row items-center gap-5">
          <HealthScoreRing score={isLoading ? 0 : score} />
          <div className="flex-1 space-y-2">
            <h2 className="text-sm font-semibold text-foreground">
              {isHomeCook ? "Usage Audit" : "System Health Score"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isHomeCook
                ? "Tracks how actively you're using your kitchen tools and logging data."
                : "Reflects how fresh and complete your data is across all modules."}
            </p>
            {recommendations.length > 0 && (
              <ul className="space-y-1 mt-2">
                {recommendations.map((rec, i) => (
                  <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                    <AlertTriangle className="w-2.5 h-2.5 text-warning mt-0.5 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vital Signs */}
      {moduleScores.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {isHomeCook ? "Data Activity" : "Data Vital Signs"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {moduleScores.map((mod) => (
              <VitalSignCard key={mod.module} mod={mod} />
            ))}
          </div>
        </div>
      )}

      {/* Reminders */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Smart Reminders</p>
        <Tabs defaultValue="daily">
          <TabsList className="inline-flex h-8 gap-1 p-0.5">
            {Object.keys(activeTasks).map((freq) => (
              <TabsTrigger key={freq} value={freq} className="h-7 px-3 text-xs rounded-full capitalize">
                {freq}
              </TabsTrigger>
            ))}
          </TabsList>
          {Object.entries(activeTasks).map(([freq, tasks]) => (
            <TabsContent key={freq} value={freq} className="space-y-2 mt-3">
              {tasks.map((task, i) => (
                <TaskCard key={i} task={task} />
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

/* ── Data Health service config (for pill nav) ── */
const DATA_HEALTH_CONFIG: ServiceConfig = {
  key: "data_health",
  label: "Health",
  icon: "Activity",
  color: "text-primary",
  hasCalendar: false,
  hasGraph: false,
  metadataFields: [],
};

/* ── Main page ── */
const Housekeeping = () => {
  const [customServices, setCustomServices] = useState<ServiceConfig[]>([]);
  const allServices = [...DEFAULT_SERVICES, ...customServices, DATA_HEALTH_CONFIG];

  const [activeService, setActiveService] = useState<string>(DEFAULT_SERVICES[0].key);
  const [viewMode, setViewMode] = useState<"list" | "calendar" | "graph" | "report">("list");
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const activeConfig = allServices.find((s) => s.key === activeService) ?? DEFAULT_SERVICES[0];
  const isDataHealth = activeService === "data_health";

  // Data hooks (always called, but only relevant for non-data-health tabs)
  const { logs, isLoading } = useServiceLogs(activeService);
  const saveLog = useSaveServiceLog();
  const deleteLog = useDeleteServiceLog();
  const priceAlertIds = getPriceAlerts(logs);

  const handleSave = async (values: Parameters<typeof saveLog.mutateAsync>[0]) => {
    await saveLog.mutateAsync(values);
    toast.success("Entry saved");
  };

  const handleDelete = (id: string) => {
    deleteLog.mutate(id, {
      onSuccess: () => toast.success("Entry deleted"),
      onError: () => toast.error("Failed to delete"),
    });
  };

  const handleAddCustom = (service: ServiceConfig) => {
    setCustomServices((prev) => [...prev, service]);
    setActiveService(service.key);
    toast.success(`Added ${service.label}`);
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-5 px-4 sm:px-0">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div>
            <h1 className="page-title font-display">Housekeeping</h1>
            <p className="page-subtitle">Manage recurring kitchen services and maintenance</p>
          </div>
          {!isDataHealth && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setIsScheduleOpen(true)}>
                <CalendarClock className="w-3.5 h-3.5 mr-1.5" />
                Schedule
              </Button>
              <Button size="sm" onClick={() => setIsEntryDialogOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Entry
              </Button>
            </div>
          )}
        </motion.div>

        {/* Pill Navigation */}
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <ServicePillNav
            services={allServices}
            active={activeService}
            onSelect={(key) => { setActiveService(key); setViewMode("list"); }}
            onAddCustom={() => setIsAddServiceOpen(true)}
          />
        </motion.div>

        {isDataHealth ? (
          /* Data Health View */
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <DataHealthView />
          </motion.div>
        ) : (
          <>
            {/* Summary Cards */}
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              <ServiceSummaryCards serviceType={activeService} />
            </motion.div>

            {/* Actions + View Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-between gap-3"
            >
              {/* Invoice actions */}
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setIsScannerOpen(true)}>
                  <Camera className="w-3 h-3 mr-1" />
                  Scan
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setIsEntryDialogOpen(true)}>
                  <Upload className="w-3 h-3 mr-1" />
                  Attach
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  <Mail className="w-3 h-3 mr-1" />
                  Email In
                </Button>
              </div>

              {/* View toggle */}
              <div className="flex bg-muted rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    viewMode === "list" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                {activeConfig.hasCalendar && (
                  <button
                    onClick={() => setViewMode("calendar")}
                    className={cn(
                      "p-1.5 rounded-md transition-colors",
                      viewMode === "calendar" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                  </button>
                )}
                {activeConfig.hasGraph && (
                  <button
                    onClick={() => setViewMode("graph")}
                    className={cn(
                      "p-1.5 rounded-md transition-colors",
                      viewMode === "graph" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setViewMode("report")}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    viewMode === "report" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <FileBarChart className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>

            {/* Active View */}
            <motion.div
              key={`${activeService}-${viewMode}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              {isLoading ? (
                <div className="card-elevated p-8 text-center text-sm text-muted-foreground">Loading...</div>
              ) : viewMode === "list" ? (
                <ServiceListView logs={logs} priceAlertIds={priceAlertIds} onDelete={handleDelete} />
              ) : viewMode === "calendar" ? (
                <ServiceCalendarView logs={logs} year={calendarYear} onYearChange={setCalendarYear} />
              ) : viewMode === "report" ? (
                <ServiceReportView logs={logs} serviceLabel={activeConfig.label} />
              ) : (
                <ServiceConsumptionChart service={activeConfig} />
              )}
            </motion.div>
          </>
        )}
      </div>

      {/* Dialogs */}
      <ServiceEntryDialog
        open={isEntryDialogOpen}
        onOpenChange={setIsEntryDialogOpen}
        service={activeConfig}
        onSave={handleSave}
      />
      <InvoiceScannerDialog
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onComplete={() => { setIsScannerOpen(false); toast.success("Invoice scanned"); }}
      />
      <AddServiceDialog
        open={isAddServiceOpen}
        onOpenChange={setIsAddServiceOpen}
        onAdd={handleAddCustom}
      />
      <ServiceScheduleDialog
        open={isScheduleOpen}
        onOpenChange={setIsScheduleOpen}
        serviceType={activeService}
      />
    </AppLayout>
  );
};

export default Housekeeping;
