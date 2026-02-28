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
  Clock, AlertTriangle, Shield, FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/useOrgId";
import { useAuth } from "@/contexts/AuthContext";
import { useEmirateDetection } from "@/hooks/useEmirateDetection";
import { useGameUnlock } from "@/hooks/useGameUnlock";
import { uaeTempStatus, formatAED } from "@/lib/shared/gccConfig";
import { format } from "date-fns";

interface Props {
  onLogSaved?: () => void;
  onNavigate?: (tab: string) => void;
}

interface BurstCard {
  key: string;
  categoryKey: string;
  label: string;
  labelAr: string;
  icon: React.ReactNode;
  logType: string;
  requiresTemp?: boolean;
  tempLabel?: string;
  isHalal?: boolean;
}

/** UAE-specific compliance burst cards — aligned with Dubai Municipality / ADAFSA / Sharjah Municipality */
const GCC_BURST_CARDS: BurstCard[] = [
  // Temperature
  { key: "fridge", categoryKey: "temperature", label: "Fridge Temps", labelAr: "حرارة الثلاجة", icon: <Snowflake className="w-6 h-6" />, logType: "fridge_temp", requiresTemp: true, tempLabel: "°C (0–5 pass)" },
  { key: "freezer", categoryKey: "temperature", label: "Freezer Temps", labelAr: "حرارة الفريزر", icon: <Snowflake className="w-6 h-6" />, logType: "freezer_temp", requiresTemp: true, tempLabel: "°C (≤ -18 pass)" },
  { key: "hot_holding", categoryKey: "temperature", label: "Hot Holding", labelAr: "الحفظ الساخن", icon: <Flame className="w-6 h-6" />, logType: "hot_holding", requiresTemp: true, tempLabel: "°C (≥ 60 pass)" },
  { key: "cooking", categoryKey: "temperature", label: "Cooking Temps", labelAr: "حرارة الطهي", icon: <Flame className="w-6 h-6" />, logType: "cooking_poultry", requiresTemp: true, tempLabel: "°C (≥ 74 pass)" },
  // Food Safety
  { key: "expiry_check", categoryKey: "food_safety", label: "Expiry Check", labelAr: "فحص الصلاحية", icon: <AlertTriangle className="w-6 h-6" />, logType: "expiry_check" },
  { key: "cross_contam", categoryKey: "food_safety", label: "Cross-Contam", labelAr: "التلوث المتبادل", icon: <Shield className="w-6 h-6" />, logType: "cross_contamination" },
  { key: "halal_cert", categoryKey: "food_safety", label: "Halal Certs", labelAr: "شهادات الحلال", icon: <FileCheck className="w-6 h-6" />, logType: "halal_verification", isHalal: true },
  // Hygiene
  { key: "staff_health", categoryKey: "hygiene", label: "Staff Health", labelAr: "صحة الموظفين", icon: <HeartPulse className="w-6 h-6" />, logType: "staff_health" },
  { key: "handwash", categoryKey: "hygiene", label: "Handwash", labelAr: "غسل اليدين", icon: <Droplets className="w-6 h-6" />, logType: "handwash_check" },
  // Cleaning
  { key: "sanitiser", categoryKey: "cleaning", label: "Sanitiser", labelAr: "المعقم", icon: <SprayCan className="w-6 h-6" />, logType: "sanitiser_check" },
  { key: "kitchen_clean", categoryKey: "cleaning", label: "Kitchen Clean", labelAr: "نظافة المطبخ", icon: <Sparkles className="w-6 h-6" />, logType: "kitchen_clean" },
  // Pest
  { key: "pest", categoryKey: "pest_control", label: "Pest Check", labelAr: "فحص الآفات", icon: <Bug className="w-6 h-6" />, logType: "pest_check" },
];

// Cards that navigate to dedicated tabs instead of opening the inline dialog
const NAVIGABLE_CARDS: Record<string, string> = {
  kitchen_clean: "cleaning",
};

export default function GCCDailyComplianceBurst({ onLogSaved, onNavigate }: Props) {
  const orgId = useOrgId();
  const { user } = useAuth();
  const { emirate, complianceFramework, config } = useEmirateDetection();
  const { refresh: refreshGameUnlock } = useGameUnlock();
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());
  const [activeCard, setActiveCard] = useState<BurstCard | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [passed, setPassed] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const doneCount = GCC_BURST_CARDS.filter((c) => completedToday.has(c.key)).length;
  const totalCount = GCC_BURST_CARDS.length;
  const allDone = doneCount === totalCount && totalCount > 0;

  const handleSave = async () => {
    if (!orgId || !activeCard) return;
    setSaving(true);

    const temp = activeCard.requiresTemp ? parseFloat(tempValue) : undefined;
    const status = activeCard.requiresTemp
      ? uaeTempStatus(activeCard.logType, temp!)
      : passed ? "pass" : "fail";

    const isWithinSafe = status === "pass";

    // Save to gcc_compliance_logs
    const { error } = await supabase.from("gcc_compliance_logs" as any).insert({
      org_id: orgId,
      user_id: user?.id,
      log_date: format(new Date(), "yyyy-MM-dd"),
      emirate,
      compliance_framework: complianceFramework,
      log_type: activeCard.logType,
      temperature_reading: temp ?? null,
      is_within_safe_zone: isWithinSafe,
      check_passed: isWithinSafe,
      severity: status === "fail" ? "critical" : status === "warning" ? "major" : null,
      notes: notes || null,
      logged_by_name: user?.email?.split("@")[0] || "Unknown",
      shift: new Date().getHours() < 12 ? "AM" : new Date().getHours() < 18 ? "PM" : "NIGHT",
    } as any);

    // Also write to daily_compliance_logs for compatibility with game unlock gate
    if (activeCard.requiresTemp) {
      await supabase.from("daily_compliance_logs").insert({
        org_id: orgId,
        log_type: activeCard.logType,
        log_date: format(new Date(), "yyyy-MM-dd"),
        shift: new Date().getHours() < 12 ? "AM" : "PM",
        temperature_reading: temp ?? null,
        is_within_safe_zone: isWithinSafe,
        visual_check_passed: null,
        requires_corrective_action: status !== "pass",
        notes: notes || null,
        logged_by: user?.id ?? null,
        logged_by_name: user?.email?.split("@")[0] || "Unknown",
      } as any);
    }

    if (error) {
      toast.error("Failed to save log");
    } else {
      setCompletedToday((prev) => new Set(prev).add(activeCard.key));
      toast.success(`${activeCard.label} logged ✓`);
      onLogSaved?.();
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
      <Card className="border-emerald-600/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <Clock className="w-5 h-5" />
              Daily Compliance — {config.name}
            </CardTitle>
            <Badge variant={allDone ? "default" : "secondary"} className={allDone ? "bg-emerald-600" : ""}>
              {doneCount}/{totalCount}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {config.regulatoryBody}
            </p>
            <span className="text-xs text-muted-foreground font-mono">AED</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {GCC_BURST_CARDS.map((card) => {
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
                      : "border-border hover:border-emerald-600/60 hover:bg-emerald-600/5 cursor-pointer active:scale-95"
                  }`}
                  disabled={done}
                >
                  {done && <CheckCircle2 className="absolute top-1 right-1 w-4 h-4 text-emerald-500" />}
                  <div className={done ? "opacity-60" : "text-emerald-700 dark:text-emerald-400"}>{card.icon}</div>
                  <span className="text-xs font-medium text-center leading-tight">{card.label}</span>
                  {card.isHalal && (
                    <span className="text-[8px] text-emerald-600 font-bold uppercase">Halal</span>
                  )}
                </button>
              );
            })}
          </div>
          {allDone && (
            <div className="mt-4 flex items-center gap-2 text-emerald-600 text-sm font-medium">
              <CheckCircle2 className="w-5 h-5" />
              All {config.name} compliance checks completed for this session!
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
              <div>
                <div>{activeCard?.label}</div>
                <div className="text-xs font-normal text-muted-foreground" dir="rtl">
                  {activeCard?.labelAr}
                </div>
              </div>
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
                      const s = uaeTempStatus(activeCard.logType, parseFloat(tempValue));
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
            ) : activeCard?.isHalal ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>All halal certificates verified and valid?</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{passed ? "Yes" : "No"}</span>
                    <Switch checked={passed} onCheckedChange={setPassed} />
                  </div>
                </div>
                {!passed && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 text-xs text-red-700 dark:text-red-400">
                    Missing or expired halal certificates is a critical violation.
                    Fine: {formatAED(10000)} – {formatAED(50000)}.
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
            {(!activeCard?.requiresTemp && !passed) || (activeCard?.requiresTemp && tempValue && uaeTempStatus(activeCard.logType, parseFloat(tempValue)) !== "pass") ? (
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
            <Button onClick={handleSave} disabled={saving || (activeCard?.requiresTemp && !tempValue.trim())} className="bg-emerald-700 hover:bg-emerald-700/90 text-white">
              {saving ? "Saving…" : "Log Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
