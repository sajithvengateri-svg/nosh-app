import { useState } from "react";
import { motion } from "framer-motion";
import { Settings2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PulseWidget } from "./widgets/PulseWidget";
import { RevenueWidget } from "./widgets/RevenueWidget";
import { CostWidget } from "./widgets/CostWidget";
import { AuditWidget } from "./widgets/AuditWidget";
import { AlertWidget } from "./widgets/AlertWidget";
import { TrendWidget } from "./widgets/TrendWidget";
import { EcosystemWidget } from "./widgets/EcosystemWidget";
import { useOrg } from "@/contexts/OrgContext";
import { useMoneyReactor } from "@/hooks/useMoneyReactor";

interface WidgetConfig {
  id: string;
  label: string;
  removable: boolean;
}

const allWidgets: WidgetConfig[] = [
  { id: "pulse", label: "Pulse", removable: false },
  { id: "revenue", label: "Revenue", removable: true },
  { id: "costs", label: "Costs", removable: true },
  { id: "audit", label: "Quiet Audit", removable: true },
  { id: "alerts", label: "Alerts", removable: true },
  { id: "trends", label: "Trends", removable: true },
  { id: "ecosystem", label: "Ecosystem", removable: true },
];

const DEFAULT_LAYOUT = allWidgets.map((w) => w.id);

function getStoredLayout(): string[] {
  try {
    const saved = localStorage.getItem("moneyDashboardLayout");
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_LAYOUT;
}

export default function MoneyMobileDashboard() {
  const [layout, setLayout] = useState<string[]>(getStoredLayout);
  const [editMode, setEditMode] = useState(false);
  const { currentOrg } = useOrg();
  const { data: reactor, isLoading } = useMoneyReactor(currentOrg?.id);

  const snap = reactor?.snapshot;
  const rev = snap?.revenue_total ?? 0;
  const foodPct = rev > 0 ? ((snap?.cogs_food ?? 0) / rev) * 100 : 0;
  const bevPct = rev > 0 ? ((snap?.cogs_bev ?? 0) / rev) * 100 : 0;
  const labPct = snap?.labour_pct ?? 0;
  const netPct = snap?.net_profit_pct ?? 0;
  const primePct = snap?.prime_cost_pct ?? 0;
  const breakEvenPct = rev > 0 && snap?.break_even_revenue ? Math.min(100, Math.round((rev / snap.break_even_revenue) * 100)) : 0;

  const alerts = (reactor?.alerts ?? []).map(a => ({
    msg: `${a.title} — ${a.detail}`, severity: a.level === "critical" ? "high" as const : "medium" as const, time: "now",
  }));

  const ecosystem = (reactor?.ecosystem ?? []).map(e => ({
    name: e.module, path: "/money/reactor", fresh: e.status === "live",
    last: new Date(e.last_data_at).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" }),
  }));

  const toggleWidget = (id: string) => {
    const config = allWidgets.find((w) => w.id === id);
    if (!config?.removable) return;
    const newLayout = layout.includes(id) ? layout.filter((l) => l !== id) : [...layout, id];
    setLayout(newLayout);
    localStorage.setItem("moneyDashboardLayout", JSON.stringify(newLayout));
  };

  const visibleWidgets = layout.map((id) => allWidgets.find((w) => w.id === id)).filter(Boolean) as WidgetConfig[];

  const renderWidget = (id: string) => {
    switch (id) {
      case "pulse": return <PulseWidget revenue={rev} netPct={Math.round(netPct * 10) / 10} breakEvenPct={breakEvenPct} />;
      case "revenue": return <RevenueWidget today={rev} />;
      case "costs": return <CostWidget costs={[
        { label: "Food", value: Math.round(foodPct * 10) / 10, target: 30 },
        { label: "Bev", value: Math.round(bevPct * 10) / 10, target: 24 },
        { label: "Labour", value: Math.round(labPct * 10) / 10, target: 30 },
      ]} primeCost={Math.round(primePct * 10) / 10} />;
      case "audit": return <AuditWidget overall={reactor?.auditScore ?? 0} />;
      case "alerts": return <AlertWidget alerts={alerts.length > 0 ? alerts : undefined} />;
      case "trends": return <TrendWidget />;
      case "ecosystem": return <EcosystemWidget modules={ecosystem.length > 0 ? ecosystem : undefined} />;
      default: return null;
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="p-4 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">MoneyOS</h1>
          <p className="text-xs text-muted-foreground">Live financial hub</p>
        </div>
        <Button variant={editMode ? "default" : "outline"} size="icon" className="h-9 w-9" onClick={() => setEditMode(!editMode)}>
          <Settings2 className="w-4 h-4" />
        </Button>
      </div>

      {editMode && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex flex-wrap gap-2">
          {allWidgets.map((w) => (
            <Button key={w.id} variant={layout.includes(w.id) ? "default" : "outline"} size="sm" className="text-xs h-7"
              disabled={!w.removable} onClick={() => toggleWidget(w.id)}>{w.label}</Button>
          ))}
        </motion.div>
      )}

      <div className="space-y-3">
        {visibleWidgets.map((w, i) => (
          <motion.div key={w.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }} className={editMode ? "animate-pulse" : ""}>
            {renderWidget(w.id)}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
