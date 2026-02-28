import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Thermometer, HeartPulse, Droplets, SprayCan, Sparkles, Bug,
  Package, Flame, Snowflake, Wind, Truck, MonitorCheck, CheckCircle2,
  Clock, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/useOrgId";
import { useAuth } from "@/contexts/AuthContext";
import { useGameUnlock } from "@/hooks/useGameUnlock";
import { format } from "date-fns";

interface Props {
  sectionToggles: Record<string, boolean>;
  onLogSaved?: () => void;
  onNavigate?: (tab: string) => void;
}

interface BurstCard {
  key: string;
  sectionKey: string;
  label: string;
  icon: React.ReactNode;
  logType: string;
  requiresTemp?: boolean;
  tempLabel?: string;
}

const BURST_CARDS: BurstCard[] = [
  { key: "fridge", sectionKey: "fridge_temps", label: "Fridge Temps", icon: <Snowflake className="w-6 h-6" />, logType: "fridge_temp", requiresTemp: true, tempLabel: "°C (0–5 pass)" },
  { key: "freezer", sectionKey: "freezer_temps", label: "Freezer Temps", icon: <Snowflake className="w-6 h-6" />, logType: "freezer_temp", requiresTemp: true, tempLabel: "°C (≤ -18 pass)" },
  { key: "staff_health", sectionKey: "staff_health", label: "Staff Health", icon: <HeartPulse className="w-6 h-6" />, logType: "staff_health" },
  { key: "handwash", sectionKey: "handwash_stations", label: "Handwash", icon: <Droplets className="w-6 h-6" />, logType: "handwash_check" },
  { key: "sanitiser", sectionKey: "sanitiser_check", label: "Sanitiser", icon: <SprayCan className="w-6 h-6" />, logType: "sanitiser_check" },
  { key: "kitchen_clean", sectionKey: "kitchen_clean", label: "Kitchen Clean", icon: <Sparkles className="w-6 h-6" />, logType: "kitchen_clean" },
  { key: "pest", sectionKey: "pest_check", label: "Pest Check", icon: <Bug className="w-6 h-6" />, logType: "pest_check" },
  { key: "receiving", sectionKey: "receiving_logs", label: "Receiving", icon: <Package className="w-6 h-6" />, logType: "receiving" },
  { key: "cooking", sectionKey: "cooking_logs", label: "Cooking", icon: <Flame className="w-6 h-6" />, logType: "cooking_temp", requiresTemp: true, tempLabel: "°C (≥75 pass)" },
  { key: "cooling", sectionKey: "cooling_logs", label: "Cooling", icon: <Wind className="w-6 h-6" />, logType: "cooling_temp", requiresTemp: true, tempLabel: "°C" },
  { key: "reheating", sectionKey: "reheating_logs", label: "Reheating", icon: <Flame className="w-6 h-6" />, logType: "reheating_temp", requiresTemp: true, tempLabel: "°C (≥75 pass)" },
  { key: "display", sectionKey: "display_monitoring", label: "Display", icon: <MonitorCheck className="w-6 h-6" />, logType: "display_temp", requiresTemp: true, tempLabel: "°C" },
  { key: "transport", sectionKey: "transport_logs", label: "Transport", icon: <Truck className="w-6 h-6" />, logType: "transport_temp", requiresTemp: true, tempLabel: "°C" },
];

function autoStatus(logType: string, temp?: number): "pass" | "warning" | "fail" {
  if (temp === undefined || isNaN(temp)) return "pass";
  switch (logType) {
    case "fridge_temp": return temp <= 5 ? "pass" : temp <= 8 ? "warning" : "fail";
    case "freezer_temp": return temp <= -18 ? "pass" : temp <= -15 ? "warning" : "fail";
    case "cooking_temp":
    case "reheating_temp": return temp >= 75 ? "pass" : temp >= 60 ? "warning" : "fail";
    default: return "pass";
  }
}

// Cards that navigate to dedicated tabs instead of opening the inline dialog
const NAVIGABLE_CARDS: Record<string, string> = {
  receiving: "receiving",
  kitchen_clean: "cleaning",
};

export default function DailyComplianceBurst({ sectionToggles, onLogSaved, onNavigate }: Props) {
  const orgId = useOrgId();
  const { user } = useAuth();
  const { refresh: refreshGameUnlock } = useGameUnlock();
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());
  const [activeCard, setActiveCard] = useState<BurstCard | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [passed, setPassed] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const visibleCards = BURST_CARDS.filter((c) => sectionToggles[c.sectionKey] !== false);
  const doneCount = visibleCards.filter((c) => completedToday.has(c.key)).length;
  const totalCount = visibleCards.length;
  const allDone = doneCount === totalCount && totalCount > 0;

  const handleSave = async () => {
    if (!orgId || !activeCard) return;
    setSaving(true);

    const temp = activeCard.requiresTemp ? parseFloat(tempValue) : undefined;
    const status = activeCard.requiresTemp
      ? autoStatus(activeCard.logType, temp)
      : passed ? "pass" : "fail";

    const isWithinSafe = status === "pass";

    const { error } = await supabase.from("daily_compliance_logs").insert({
      org_id: orgId,
      log_type: activeCard.logType,
      log_date: format(new Date(), "yyyy-MM-dd"),
      shift: new Date().getHours() < 12 ? "AM" : "PM",
      temperature_reading: temp ?? null,
      is_within_safe_zone: isWithinSafe,
      visual_check_passed: activeCard.requiresTemp ? null : passed,
      requires_corrective_action: status !== "pass",
      notes: notes || null,
      logged_by: user?.id ?? null,
      logged_by_name: user?.email?.split("@")[0] || "Unknown",
    } as any);

    if (error) {
      toast.error("Failed to save log");
    } else {
      setCompletedToday((prev) => new Set(prev).add(activeCard.key));
      toast.success(`${activeCard.label} logged`);
      onLogSaved?.();
      // Refresh game unlock gate — check if this log completes a compliance task
      refreshGameUnlock();
    }

    setActiveCard(null);
    setTempValue("");
    setPassed(true);
    setNotes("");
    setSaving(false);
  };

  return (
    <>
      <Card className="border-[#000080]/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-[#000080]">
              <Clock className="w-5 h-5" />
              60-Second Compliance Burst
            </CardTitle>
            <Badge variant={allDone ? "default" : "secondary"} className={allDone ? "bg-emerald-600" : ""}>
              {doneCount}/{totalCount}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Tap each card to log today's prescribed activities</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {visibleCards.map((card) => {
              const done = completedToday.has(card.key);
              return (
                <button
                  key={card.key}
                  onClick={() => {
                    if (done) return;
                    const navTarget = NAVIGABLE_CARDS[card.key];
                    if (navTarget && onNavigate) {
                      onNavigate(navTarget);
                    } else {
                      setActiveCard(card);
                    }
                  }}
                  className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl p-4 min-h-[88px] transition-all border-2 touch-manipulation ${
                    done
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                      : "border-border hover:border-[#000080]/60 hover:bg-[#000080]/5 cursor-pointer active:scale-95"
                  }`}
                  disabled={done}
                >
                  {done && <CheckCircle2 className="absolute top-1 right-1 w-4 h-4 text-emerald-500" />}
                  <div className={done ? "opacity-60" : "text-[#000080]"}>{card.icon}</div>
                  <span className="text-xs font-medium text-center leading-tight">{card.label}</span>
                </button>
              );
            })}
          </div>
          {allDone && (
            <div className="mt-4 flex items-center gap-2 text-emerald-600 text-sm font-medium">
              <CheckCircle2 className="w-5 h-5" />
              All compliance checks completed for this session!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Dialog */}
      <Dialog open={!!activeCard} onOpenChange={(o) => !o && setActiveCard(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {activeCard?.icon}
              {activeCard?.label}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {activeCard?.requiresTemp ? (
              <div>
                <Label>Temperature {activeCard.tempLabel}</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  placeholder="Enter reading"
                  className="mt-1 text-lg h-12"
                  autoFocus
                />
                {tempValue && (
                  <div className="mt-2">
                    {(() => {
                      const s = autoStatus(activeCard.logType, parseFloat(tempValue));
                      return (
                        <Badge variant={s === "pass" ? "default" : s === "warning" ? "secondary" : "destructive"}
                          className={s === "pass" ? "bg-emerald-600" : ""}>
                          {s.toUpperCase()}
                        </Badge>
                      );
                    })()}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <Label>Check passed?</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{passed ? "Pass" : "Fail"}</span>
                  <Switch checked={passed} onCheckedChange={setPassed} />
                </div>
              </div>
            )}
            {(!activeCard?.requiresTemp && !passed) || (activeCard?.requiresTemp && tempValue && autoStatus(activeCard.logType, parseFloat(tempValue)) !== "pass") ? (
              <div>
                <Label>Corrective Action / Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Describe corrective action taken..." className="mt-1" />
              </div>
            ) : (
              <div>
                <Label>Notes (optional)</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" className="mt-1" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveCard(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || (activeCard?.requiresTemp && !tempValue.trim())} className="bg-[#000080] hover:bg-[#000080]/90 text-white">
              {saving ? "Saving…" : "Log Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}