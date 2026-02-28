import { useState, useEffect, useRef } from "react";
import {
  Thermometer, Plus, Trash2, CheckCircle2, AlertTriangle, Clock,
  Settings, Archive, Camera, Loader2, Snowflake, Flame, Wind, Truck, Save, X, GripVertical, UserCheck
} from "lucide-react";
import { isHomeCookMode } from "@/lib/shared/modeConfig";
import type { StoreMode } from "@/lib/shared/types/store.types";
import { useFoodSafetyDuties } from "@/hooks/useFoodSafetyDuties";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";

// ─── Types ────────────────────────────────────────
type LocationType = "fridge" | "freezer" | "hot_hold" | "ambient" | "delivery_cold" | "delivery_frozen";

interface CheckConfig {
  id: string;
  org_id: string;
  location_name: string;
  location_type: string;
  shift: string;
  sort_order: number;
  is_active: boolean;
}

interface TempEntry {
  configId: string;
  locationName: string;
  locationType: LocationType;
  value: string;
  status: "pass" | "warning" | "fail" | null;
  saved: boolean;
  logId?: string;
}

interface ArchiveRow {
  id: string;
  month: string;
  total_checks: number;
  pass_count: number;
  warning_count: number;
  fail_count: number;
  archived_at: string;
}

// ─── Temp Zone Logic ──────────────────────────────
const TEMP_ZONES: Record<LocationType, { label: string; icon: React.ReactNode; pass: [number, number]; warning: [number, number] }> = {
  fridge: { label: "Fridge / Walk-in", icon: <Snowflake className="w-4 h-4" />, pass: [0, 5], warning: [5.1, 8] },
  freezer: { label: "Freezer", icon: <Snowflake className="w-4 h-4" />, pass: [-50, -18], warning: [-17.9, -15] },
  hot_hold: { label: "Hot Hold", icon: <Flame className="w-4 h-4" />, pass: [63, 100], warning: [60, 62.9] },
  ambient: { label: "Ambient", icon: <Wind className="w-4 h-4" />, pass: [15, 25], warning: [25.1, 30] },
  delivery_cold: { label: "Delivery (Cold)", icon: <Truck className="w-4 h-4" />, pass: [0, 5], warning: [5.1, 8] },
  delivery_frozen: { label: "Delivery (Frozen)", icon: <Truck className="w-4 h-4" />, pass: [-50, -18], warning: [-17.9, -12] },
};

const getAutoStatus = (temp: number, locationType: LocationType): "pass" | "warning" | "fail" => {
  const zone = TEMP_ZONES[locationType];
  if (!zone) return "pass";
  if (temp >= zone.pass[0] && temp <= zone.pass[1]) return "pass";
  if (temp >= zone.warning[0] && temp <= zone.warning[1]) return "warning";
  return "fail";
};

const statusColors = {
  pass: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  fail: "bg-destructive/10 text-destructive border-destructive/20",
};

// ─── Default Locations ────────────────────────────
const DEFAULT_LOCATIONS = [
  { name: "Walk-in Fridge", type: "fridge", shift: "am" },
  { name: "Walk-in Fridge", type: "fridge", shift: "pm" },
  { name: "Freezer 1", type: "freezer", shift: "am" },
  { name: "Freezer 1", type: "freezer", shift: "pm" },
  { name: "Hot Hold", type: "hot_hold", shift: "am" },
  { name: "Hot Hold", type: "hot_hold", shift: "pm" },
  { name: "Prep Fridge", type: "fridge", shift: "am" },
  { name: "Prep Fridge", type: "fridge", shift: "pm" },
];

const HOME_COOK_DEFAULTS = [
  { name: "Fridge 1", type: "fridge", shift: "am" },
  { name: "Fridge 2", type: "fridge", shift: "am" },
  { name: "Freezer 1", type: "freezer", shift: "am" },
  { name: "Freezer 2", type: "freezer", shift: "am" },
];

const HOME_COOK_LOCATION_TYPES: LocationType[] = ["fridge", "freezer"];

// ─── Component ────────────────────────────────────
const DailyTempChecks = () => {
  const { user, canEdit } = useAuth();
  const { currentOrg, storeMode } = useOrg();
  const isHomeCook = isHomeCookMode(storeMode);
  const hasEdit = canEdit("food-safety");
  const { resolveDuty } = useFoodSafetyDuties();
  const [shift, setShift] = useState<"am" | "pm">(() => {
    if (isHomeCookMode(storeMode)) return "am"; // home cooks always "am"
    const hour = new Date().getHours();
    return hour < 14 ? "am" : "pm";
  });
  const [configs, setConfigs] = useState<CheckConfig[]>([]);
  const [entries, setEntries] = useState<TempEntry[]>([]);
  const [todayLogs, setTodayLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newLocName, setNewLocName] = useState("");
  const [newLocType, setNewLocType] = useState<LocationType>("fridge");
  const [newLocShift, setNewLocShift] = useState<"am" | "pm" | "both">("both");

  // Archive
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archives, setArchives] = useState<ArchiveRow[]>([]);
  const [archiveMonth, setArchiveMonth] = useState(format(new Date(), "yyyy-MM"));
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [monthlyLogs, setMonthlyLogs] = useState<any[]>([]);

  // AI snap
  const [isSnapping, setIsSnapping] = useState<string | null>(null);
  const snapRef = useRef<HTMLInputElement>(null);
  const [snapTargetIdx, setSnapTargetIdx] = useState<number | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    fetchConfigs();
  }, [currentOrg?.id]);

  useEffect(() => {
    if (configs.length > 0) fetchTodayLogs();
  }, [configs, shift]);

  const fetchConfigs = async () => {
    if (!currentOrg?.id) { setLoading(false); return; }
    setLoading(true);

    const { data, error } = await supabase
      .from("temp_check_config")
      .select("*")
      .eq("org_id", currentOrg.id)
      .eq("is_active", true)
      .order("sort_order");

    if (error) {
      console.error("Config fetch error:", error);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      // Seed defaults
      await seedDefaults();
      return;
    }

    setConfigs(data as CheckConfig[]);
    setLoading(false);
  };

  const seedDefaults = async () => {
    if (!currentOrg?.id) return;
    const defaults = isHomeCook ? HOME_COOK_DEFAULTS : DEFAULT_LOCATIONS;
    const inserts = defaults.map((loc, i) => ({
      org_id: currentOrg.id,
      location_name: loc.name,
      location_type: loc.type,
      shift: loc.shift,
      sort_order: i,
      is_active: true,
    }));

    await supabase.from("temp_check_config").insert(inserts as any);
    fetchConfigs();
  };

  const fetchTodayLogs = async () => {
    if (!currentOrg?.id) return;

    const { data } = await supabase
      .from("food_safety_logs")
      .select("*")
      .eq("org_id", currentOrg.id)
      .eq("log_type", "temperature")
      .eq("date", today)
      .eq("shift", shift);

    const logs = (data || []) as any[];
    setTodayLogs(logs);

    // Build entries from shift configs
    const shiftConfigs = configs.filter(c => c.shift === shift);
    const newEntries: TempEntry[] = shiftConfigs.map(cfg => {
      const existing = logs.find(l => {
        const readings = l.readings as Record<string, any> | null;
        return readings?.config_id === cfg.id;
      });
      return {
        configId: cfg.id,
        locationName: cfg.location_name,
        locationType: cfg.location_type as LocationType,
        value: existing ? String((existing.readings as any)?.value || "") : "",
        status: existing ? (existing.status as any) : null,
        saved: !!existing,
        logId: existing?.id,
      };
    });
    setEntries(newEntries);
  };

  const handleTempChange = (idx: number, val: string) => {
    const updated = [...entries];
    const num = parseFloat(val);
    updated[idx] = {
      ...updated[idx],
      value: val,
      status: isNaN(num) ? null : getAutoStatus(num, updated[idx].locationType),
      saved: false,
    };
    setEntries(updated);
  };

  const handleSnapPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || snapTargetIdx === null) return;

    setIsSnapping(entries[snapTargetIdx].configId);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("read-temp-display", {
        body: { image_base64: base64, file_type: file.type },
      });

      if (error) throw error;
      if (data?.temperature !== undefined) {
        handleTempChange(snapTargetIdx, String(data.temperature));
        toast.success(`AI read: ${data.temperature}°${data.unit || "C"}`);
      } else {
        toast.error("Could not read temperature");
      }
    } catch {
      toast.error("Failed to read temperature");
    } finally {
      setIsSnapping(null);
      setSnapTargetIdx(null);
    }
  };

  const handleSaveAll = async () => {
    const toSave = entries.filter(e => e.value.trim() && !e.saved);
    if (toSave.length === 0) {
      toast.info("All checks already saved");
      return;
    }

    setSaving(true);
    let savedCount = 0;

    for (const entry of toSave) {
      const num = parseFloat(entry.value);
      const status = isNaN(num) ? "pass" : getAutoStatus(num, entry.locationType);

      const payload = {
        log_type: "temperature" as const,
        location: entry.locationName,
        readings: { value: entry.value, unit: "C", location_type: entry.locationType, config_id: entry.configId },
        status,
        shift,
        recorded_by: user?.id,
        recorded_by_name: user?.email?.split("@")[0] || "Unknown",
        date: today,
        time: new Date().toTimeString().split(" ")[0],
        org_id: currentOrg?.id || null,
      };

      const { error } = await supabase.from("food_safety_logs").insert(payload as any);
      if (!error) savedCount++;
    }

    toast.success(`${savedCount} temperature checks saved`);
    setSaving(false);
    fetchTodayLogs();
  };

  // ─── Settings ───────────────────────────────────
  const handleAddLocation = async () => {
    if (!newLocName.trim() || !currentOrg?.id) return;

    const shifts = isHomeCook ? ["am"] : (newLocShift === "both" ? ["am", "pm"] : [newLocShift]);
    const inserts = shifts.map((s, i) => ({
      org_id: currentOrg.id,
      location_name: newLocName,
      location_type: newLocType,
      shift: s,
      sort_order: configs.length + i,
      is_active: true,
    }));

    const { error } = await supabase.from("temp_check_config").insert(inserts as any);
    if (error) { toast.error("Failed to add location"); return; }

    toast.success("Location added");
    setNewLocName("");
    fetchConfigs();
  };

  const handleRemoveConfig = async (id: string) => {
    await supabase.from("temp_check_config").update({ is_active: false } as any).eq("id", id);
    toast.success("Location removed");
    fetchConfigs();
  };

  // ─── Archive ────────────────────────────────────
  const fetchArchives = async () => {
    if (!currentOrg?.id) return;
    const { data } = await supabase
      .from("temp_check_archives")
      .select("*")
      .eq("org_id", currentOrg.id)
      .order("month", { ascending: false });
    setArchives((data || []) as ArchiveRow[]);
  };

  const fetchMonthlyLogs = async (month: string) => {
    if (!currentOrg?.id) return;
    setArchiveLoading(true);
    const start = `${month}-01`;
    const endDate = format(endOfMonth(new Date(`${month}-01`)), "yyyy-MM-dd");

    const { data } = await supabase
      .from("food_safety_logs")
      .select("*")
      .eq("org_id", currentOrg.id)
      .eq("log_type", "temperature")
      .gte("date", start)
      .lte("date", endDate)
      .order("date")
      .order("time");

    setMonthlyLogs(data || []);
    setArchiveLoading(false);
  };

  const handleArchiveMonth = async () => {
    if (!currentOrg?.id) return;

    const passCount = monthlyLogs.filter(l => l.status === "pass").length;
    const warnCount = monthlyLogs.filter(l => l.status === "warning").length;
    const failCount = monthlyLogs.filter(l => l.status === "fail").length;

    const { error } = await supabase.from("temp_check_archives").insert({
      org_id: currentOrg.id,
      month: archiveMonth,
      sheet_data: monthlyLogs,
      total_checks: monthlyLogs.length,
      pass_count: passCount,
      warning_count: warnCount,
      fail_count: failCount,
      archived_by: user?.id,
    } as any);

    if (error) { toast.error("Failed to archive"); return; }
    toast.success(`Archived ${archiveMonth} — ${monthlyLogs.length} records`);
    fetchArchives();
  };

  const openArchive = () => {
    setArchiveOpen(true);
    fetchArchives();
    fetchMonthlyLogs(archiveMonth);
  };

  // ─── Computed ───────────────────────────────────
  const shiftConfigs = configs.filter(c => c.shift === shift);
  const completedCount = entries.filter(e => e.saved).length;
  const totalCount = shiftConfigs.length;
  const allSaved = entries.every(e => e.saved || !e.value.trim());
  const hasUnsaved = entries.some(e => e.value.trim() && !e.saved);

  // Group month logs by date for the master sheet
  const monthDays = (() => {
    try {
      const start = startOfMonth(new Date(`${archiveMonth}-01`));
      const end = endOfMonth(start);
      return eachDayOfInterval({ start, end });
    } catch { return []; }
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Daily Temp Checks</h3>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, d MMMM yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={openArchive} className="gap-1.5">
            <Archive className="w-4 h-4" /> Monthly Sheet
          </Button>
          {hasEdit && (
            <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)} className="gap-1.5">
              <Settings className="w-4 h-4" /> Customise
            </Button>
          )}
        </div>
      </div>

      {/* On Duty Badge */}
      {(() => {
        const duty = resolveDuty(shift);
        if (!duty.user_id) return null;
        return (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
            <UserCheck className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">On duty:</span>
            <Avatar className="h-5 w-5">
              <AvatarImage src={duty.avatar_url || undefined} />
              <AvatarFallback className="text-[10px] bg-primary/10">
                {duty.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground">{duty.full_name} ({shift.toUpperCase()})</span>
          </div>
        );
      })()}

      {/* AM / PM Tabs (hidden for home cooks — they see a single daily check) */}
      {isHomeCook ? (
        <div className="space-y-3 mt-4">
          {/* Progress */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-success rounded-full transition-all"
                style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
            <span className="text-muted-foreground font-medium">
              {completedCount}/{totalCount}
            </span>
          </div>

          {/* Check Entries */}
          {entries.length === 0 ? (
            <div className="card-elevated p-8 text-center">
              <Thermometer className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="font-medium">No locations configured</p>
              <p className="text-sm text-muted-foreground">Click Customise to add a fridge or freezer</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, idx) => {
                const zone = TEMP_ZONES[entry.locationType];
                return (
                  <div
                    key={entry.configId}
                    className={cn(
                      "card-elevated p-3 flex items-center gap-3 transition-all",
                      entry.saved && "opacity-75"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg",
                      entry.status ? statusColors[entry.status].split(" ")[0] : "bg-muted"
                    )}>
                      {zone?.icon || <Thermometer className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{entry.locationName}</p>
                      <p className="text-xs text-muted-foreground">{zone?.label}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="°C"
                        value={entry.value}
                        onChange={(e) => handleTempChange(idx, e.target.value)}
                        disabled={entry.saved}
                        className="w-20 h-8 text-sm text-center"
                      />
                      {!entry.saved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={isSnapping !== null}
                          onClick={() => {
                            setSnapTargetIdx(idx);
                            snapRef.current?.click();
                          }}
                        >
                          {isSnapping === entry.configId ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Camera className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                    {entry.status && (
                      <Badge variant="outline" className={cn("text-xs capitalize", statusColors[entry.status])}>
                        {entry.status}
                      </Badge>
                    )}
                    {entry.saved && (
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Save all button */}
          {hasUnsaved && hasEdit && (
            <Button onClick={handleSaveAll} disabled={saving} className="w-full gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Daily Checks
            </Button>
          )}

          {completedCount === totalCount && totalCount > 0 && (
            <div className="card-elevated p-4 text-center bg-success/5 border-success/20">
              <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-1" />
              <p className="font-medium text-success">All daily checks complete ✓</p>
            </div>
          )}
        </div>
      ) : (
      <Tabs value={shift} onValueChange={(v) => setShift(v as "am" | "pm")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="am" className="gap-2">
            ☀️ AM Check
            <Badge variant="secondary" className="text-xs">
              {configs.filter(c => c.shift === "am").length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pm" className="gap-2">
            🌙 PM Check
            <Badge variant="secondary" className="text-xs">
              {configs.filter(c => c.shift === "pm").length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={shift} className="mt-4 space-y-3">
          {/* Progress */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-success rounded-full transition-all"
                style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
            <span className="text-muted-foreground font-medium">
              {completedCount}/{totalCount}
            </span>
          </div>

          {/* Check Entries */}
          {entries.length === 0 ? (
            <div className="card-elevated p-8 text-center">
              <Thermometer className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="font-medium">No locations configured for {shift.toUpperCase()}</p>
              <p className="text-sm text-muted-foreground">Click Customise to add check locations</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, idx) => {
                const zone = TEMP_ZONES[entry.locationType];
                return (
                  <div
                    key={entry.configId}
                    className={cn(
                      "card-elevated p-3 flex items-center gap-3 transition-all",
                      entry.saved && "opacity-75"
                    )}
                  >
                    {/* Location icon & name */}
                    <div className={cn(
                      "p-2 rounded-lg",
                      entry.status ? statusColors[entry.status].split(" ")[0] : "bg-muted"
                    )}>
                      {zone?.icon || <Thermometer className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{entry.locationName}</p>
                      <p className="text-xs text-muted-foreground">{zone?.label}</p>
                    </div>

                    {/* Temp input */}
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="°C"
                        value={entry.value}
                        onChange={(e) => handleTempChange(idx, e.target.value)}
                        disabled={entry.saved}
                        className="w-20 h-8 text-sm text-center"
                      />

                      {/* Snap button */}
                      {!entry.saved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={isSnapping !== null}
                          onClick={() => {
                            setSnapTargetIdx(idx);
                            snapRef.current?.click();
                          }}
                        >
                          {isSnapping === entry.configId ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Camera className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Status badge */}
                    {entry.status && (
                      <Badge variant="outline" className={cn("text-xs capitalize", statusColors[entry.status])}>
                        {entry.status}
                      </Badge>
                    )}

                    {entry.saved && (
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Save all button */}
          {hasUnsaved && hasEdit && (
            <Button onClick={handleSaveAll} disabled={saving} className="w-full gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save All {shift.toUpperCase()} Checks
            </Button>
          )}

          {completedCount === totalCount && totalCount > 0 && (
            <div className="card-elevated p-4 text-center bg-success/5 border-success/20">
              <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-1" />
              <p className="font-medium text-success">All {shift.toUpperCase()} checks complete ✓</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      )}

      {/* Hidden file input for camera snap */}
      <input ref={snapRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleSnapPhoto} />

      {/* ─── Settings Dialog ─── */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isHomeCook ? "Customise Your Checks" : "Customise Check Locations"}</DialogTitle>
            <DialogDescription>
              {isHomeCook
                ? "Add or remove fridges and freezers to check"
                : "Add or remove temperature check points for AM/PM rounds"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Add new */}
            <div className="space-y-2 p-3 rounded-lg bg-muted/50">
              <Label className="text-sm font-medium">
                {isHomeCook ? "Add a fridge or freezer" : "Add Location"}
              </Label>
              <Input
                placeholder={isHomeCook ? "e.g. Garage Freezer" : "e.g. Dessert Fridge"}
                value={newLocName}
                onChange={(e) => setNewLocName(e.target.value)}
              />
              <div className={cn("grid gap-2", isHomeCook ? "grid-cols-1" : "grid-cols-2")}>
                <Select value={newLocType} onValueChange={(v) => setNewLocType(v as LocationType)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(isHomeCook ? HOME_COOK_LOCATION_TYPES : Object.keys(TEMP_ZONES) as LocationType[]).map((k) => (
                      <SelectItem key={k} value={k}>{TEMP_ZONES[k].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!isHomeCook && (
                  <Select value={newLocShift} onValueChange={(v) => setNewLocShift(v as any)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Both AM & PM</SelectItem>
                      <SelectItem value="am">AM Only</SelectItem>
                      <SelectItem value="pm">PM Only</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <Button size="sm" onClick={handleAddLocation} disabled={!newLocName.trim()} className="w-full gap-1">
                <Plus className="w-4 h-4" /> Add
              </Button>
            </div>

            {/* Existing */}
            <div className="space-y-1">
              <Label className="text-sm font-medium">Current Locations</Label>
              {configs.filter(c => c.is_active).map(cfg => (
                <div key={cfg.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{cfg.location_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {TEMP_ZONES[cfg.location_type as LocationType]?.label || cfg.location_type}
                      {!isHomeCook && ` · ${cfg.shift.toUpperCase()}`}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleRemoveConfig(cfg.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Monthly Archive Dialog ─── */}
      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Monthly Temperature Sheet</DialogTitle>
            <DialogDescription>View and archive monthly temperature records</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Month picker */}
            <div className="flex items-center gap-3">
              <Input
                type="month"
                value={archiveMonth}
                onChange={(e) => {
                  setArchiveMonth(e.target.value);
                  fetchMonthlyLogs(e.target.value);
                }}
                className="w-48"
              />
              <Button variant="outline" size="sm" onClick={() => fetchMonthlyLogs(archiveMonth)}>
                Load
              </Button>
              <div className="flex-1" />
              <Button size="sm" onClick={handleArchiveMonth} disabled={monthlyLogs.length === 0} className="gap-1.5">
                <Archive className="w-4 h-4" /> Archive Month
              </Button>
            </div>

            {/* Stats bar */}
            {monthlyLogs.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-muted text-center">
                  <p className="text-xl font-bold">{monthlyLogs.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="p-3 rounded-lg bg-success/10 text-center">
                  <p className="text-xl font-bold text-success">{monthlyLogs.filter(l => l.status === "pass").length}</p>
                  <p className="text-xs text-muted-foreground">Pass</p>
                </div>
                <div className="p-3 rounded-lg bg-warning/10 text-center">
                  <p className="text-xl font-bold text-warning">{monthlyLogs.filter(l => l.status === "warning").length}</p>
                  <p className="text-xs text-muted-foreground">Warning</p>
                </div>
                <div className="p-3 rounded-lg bg-destructive/10 text-center">
                  <p className="text-xl font-bold text-destructive">{monthlyLogs.filter(l => l.status === "fail").length}</p>
                  <p className="text-xs text-muted-foreground">Fail</p>
                </div>
              </div>
            )}

            {/* Master sheet table */}
            {archiveLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : monthlyLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No temperature logs for {archiveMonth}
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2 font-medium">Date</th>
                      <th className="text-left p-2 font-medium">Time</th>
                      <th className="text-left p-2 font-medium">Shift</th>
                      <th className="text-left p-2 font-medium">Location</th>
                      <th className="text-center p-2 font-medium">Temp</th>
                      <th className="text-center p-2 font-medium">Status</th>
                      <th className="text-left p-2 font-medium">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyLogs.map((log: any) => {
                      const readings = log.readings as Record<string, any> | null;
                      return (
                        <tr key={log.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="p-2">{format(new Date(log.date), "dd MMM")}</td>
                          <td className="p-2 text-muted-foreground">{log.time?.slice(0, 5)}</td>
                          <td className="p-2">
                            <Badge variant="outline" className="text-xs">
                              {(log.shift || "—").toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-2">{log.location}</td>
                          <td className="p-2 text-center font-mono">
                            {readings?.value ? `${readings.value}°${readings.unit || "C"}` : "—"}
                          </td>
                          <td className="p-2 text-center">
                            <Badge variant="outline" className={cn("text-xs capitalize", statusColors[log.status as keyof typeof statusColors] || "")}>
                              {log.status || "—"}
                            </Badge>
                          </td>
                          <td className="p-2 text-muted-foreground">{log.recorded_by_name || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Past archives */}
            {archives.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Archived Months</Label>
                {archives.map(a => (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <Archive className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{a.month}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.total_checks} checks · {a.pass_count} pass · {a.warning_count} warn · {a.fail_count} fail
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(a.archived_at), "dd MMM yyyy")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DailyTempChecks;
