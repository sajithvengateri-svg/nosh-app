import { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  RefreshControl,
  Switch,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useOrg } from "../../contexts/OrgProvider";
import { useAuth } from "../../contexts/AuthProvider";
import { useTheme } from "../../contexts/ThemeProvider";
import { Card, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import { SkeletonCard } from "../ui/Skeleton";
import { DatePicker } from "../ui/DatePicker";
import { ImagePicker } from "../ui/ImagePicker";
import { Input } from "../ui/Input";
import {
  Check,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  History,
  Search,
  Plus,
  Save,
  Camera,
  Upload,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

// ── Types ─────────────────────────────────────────────────────────────

export interface LogItemConfig {
  key: string;
  label: string;
  type: "boolean" | "temperature" | "text" | "ppm" | "select";
  placeholder?: string;
  options?: string[];
  thresholds?: {
    pass: (v: number) => boolean;
    warn?: (v: number) => boolean;
  };
}

export interface LogPageConfig {
  logType: string;
  title: string;
  icon: LucideIcon;
  color: string;
  items: LogItemConfig[];
  hasPhoto?: boolean;
  hasDocUpload?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

interface ComplianceLog {
  id: string;
  org_id: string;
  log_type: string;
  log_date: string;
  shift: string;
  temperature_reading: number | null;
  sanitiser_concentration_ppm: number | null;
  is_within_safe_zone: boolean | null;
  visual_check_passed: boolean | null;
  requires_corrective_action: boolean;
  corrective_action_notes: string | null;
  notes: string | null;
  photo_url: string | null;
  staff_name: string | null;
  staff_fit_to_work: boolean | null;
  staff_illness_details: string | null;
  created_at: string;
  created_by_name: string | null;
}

interface RowState {
  values: Record<string, string>;
  passed: boolean;
  correctiveAction: string;
  notes: string;
  photoBase64: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pass: { bg: "#10B98120", text: "#10B981", label: "Pass" },
  warning: { bg: "#F59E0B20", text: "#F59E0B", label: "Warning" },
  fail: { bg: "#EF444420", text: "#EF4444", label: "Fail" },
};

// ── Component ────────────────────────────────────────────────────────

export function ComplianceLogPage({ config }: { config: LogPageConfig }) {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const orgId = currentOrg?.id;

  const todayStr = getTodayDate();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const isToday = selectedDate === todayStr;
  const [shift, setShift] = useState<"AM" | "PM">(new Date().getHours() < 12 ? "AM" : "PM");
  const [showHistory, setShowHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Row state for new entry
  const emptyRow: RowState = {
    values: {},
    passed: true,
    correctiveAction: "",
    notes: "",
    photoBase64: null,
  };
  const [rowState, setRowState] = useState<RowState>(emptyRow);

  const setField = (key: string, val: string) => {
    setRowState((prev) => ({
      ...prev,
      values: { ...prev.values, [key]: val },
    }));
  };

  const stepDate = useCallback((direction: -1 | 1) => {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + direction);
    const newDate = d.toISOString().split("T")[0];
    if (newDate <= todayStr) setSelectedDate(newDate);
  }, [selectedDate, todayStr]);

  // ── Fetch today's logs ─────────────────────────────────────────
  const { data: logs, isLoading, refetch, isRefetching } = useQuery<ComplianceLog[]>({
    queryKey: ["compliance-log", config.logType, orgId, selectedDate, shift],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("daily_compliance_logs")
        .select("*")
        .eq("org_id", orgId)
        .eq("log_type", config.logType)
        .eq("log_date", selectedDate)
        .eq("shift", shift)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as ComplianceLog[]) || [];
    },
    enabled: !!orgId,
  });

  // ── Fetch history (last 7 days) ────────────────────────────────
  const sevenDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  }, []);

  const { data: historyLogs, isLoading: historyLoading } = useQuery<ComplianceLog[]>({
    queryKey: ["compliance-log-history", config.logType, orgId, sevenDaysAgo],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("daily_compliance_logs")
        .select("*")
        .eq("org_id", orgId)
        .eq("log_type", config.logType)
        .gte("log_date", sevenDaysAgo)
        .lte("log_date", todayStr)
        .order("log_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data as unknown as ComplianceLog[]) || [];
    },
    enabled: !!orgId && showHistory,
  });

  // Group history by date
  const historyByDate = useMemo(() => {
    if (!historyLogs) return [];
    const filtered = historySearch
      ? historyLogs.filter((l) =>
          (l.staff_name || l.notes || l.created_by_name || "")
            .toLowerCase()
            .includes(historySearch.toLowerCase())
        )
      : historyLogs;
    const map: Record<string, ComplianceLog[]> = {};
    filtered.forEach((l) => {
      if (!map[l.log_date]) map[l.log_date] = [];
      map[l.log_date].push(l);
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [historyLogs, historySearch]);

  // ── Compute auto status ─────────────────────────────────────────
  const computeStatus = useCallback((item: LogItemConfig, value: string): "pass" | "warning" | "fail" | null => {
    if (item.type === "boolean") return null;
    if (!item.thresholds) return null;
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    if (item.thresholds.pass(num)) return "pass";
    if (item.thresholds.warn?.(num)) return "warning";
    return "fail";
  }, []);

  // Overall row status
  const overallStatus = useMemo(() => {
    const hasTemp = config.items.some((i) => i.type === "temperature" || i.type === "ppm");
    if (!hasTemp) return rowState.passed ? "pass" : "fail";

    let worst: "pass" | "warning" | "fail" = "pass";
    for (const item of config.items) {
      if (item.type !== "temperature" && item.type !== "ppm") continue;
      const val = rowState.values[item.key];
      if (!val) continue;
      const status = computeStatus(item, val);
      if (status === "fail") return "fail";
      if (status === "warning") worst = "warning";
    }
    return worst;
  }, [config.items, rowState, computeStatus]);

  // ── Save handler ────────────────────────────────────────────────
  const handleSave = async () => {
    if (!orgId || !user?.id) {
      Alert.alert("Error", "Not authenticated");
      return;
    }

    // Validate: at least one value filled
    const hasValues = config.items.some((item) => {
      const val = rowState.values[item.key];
      return val && val.trim() !== "";
    });
    if (!hasValues && !rowState.notes.trim()) {
      Alert.alert("Missing Data", "Fill in at least one field before saving");
      return;
    }

    const needsCorrective = overallStatus === "fail";
    if (needsCorrective && !rowState.correctiveAction.trim()) {
      Alert.alert(
        "Corrective Action Required",
        "This check failed. Add a corrective action or save anyway?",
        [
          { text: "Go Back", style: "cancel" },
          { text: "Save Anyway", onPress: () => doSave(false) },
        ]
      );
      return;
    }
    await doSave(needsCorrective);
  };

  const doSave = async (needsCorrective: boolean) => {
    setSaving(true);
    try {
      // Upload photo if present
      let photoUrl: string | null = null;
      if (rowState.photoBase64) {
        const fileName = `compliance/${orgId}/${config.logType}_${Date.now()}.jpg`;
        const { error: uploadErr } = await supabase.storage
          .from("food-safety")
          .upload(fileName, Buffer.from(rowState.photoBase64, "base64"), {
            contentType: "image/jpeg",
          });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from("food-safety").getPublicUrl(fileName);
          photoUrl = urlData.publicUrl;
        }
      }

      // Extract primary temp/ppm value
      let tempReading: number | null = null;
      let ppmReading: number | null = null;
      for (const item of config.items) {
        const val = rowState.values[item.key];
        if (!val) continue;
        if (item.type === "temperature") tempReading = parseFloat(val) || null;
        if (item.type === "ppm") ppmReading = parseFloat(val) || null;
      }

      // Build notes from all text/select values
      const notesParts: string[] = [];
      for (const item of config.items) {
        const val = rowState.values[item.key];
        if (!val || item.type === "temperature" || item.type === "ppm") continue;
        notesParts.push(`${item.label}: ${val}`);
      }
      if (rowState.notes.trim()) notesParts.push(rowState.notes.trim());

      const isPass = overallStatus === "pass" || overallStatus === "warning";

      const insertData: any = {
        org_id: orgId,
        log_type: config.logType,
        log_date: selectedDate,
        shift,
        temperature_reading: tempReading,
        sanitiser_concentration_ppm: ppmReading,
        is_within_safe_zone: isPass,
        visual_check_passed: tempReading === null ? rowState.passed : null,
        requires_corrective_action: needsCorrective,
        corrective_action_notes: needsCorrective ? rowState.correctiveAction.trim() : null,
        notes: notesParts.length > 0 ? notesParts.join(" | ") : null,
        photo_url: photoUrl,
        staff_name: rowState.values["staff_name"] || null,
        staff_fit_to_work: rowState.values["fit_to_work"] === "Yes" ? true : rowState.values["fit_to_work"] === "No" ? false : null,
        staff_illness_details: rowState.values["illness_details"] || null,
      };

      const { error } = await supabase.from("daily_compliance_logs").insert(insertData);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["compliance-log", config.logType] });
      queryClient.invalidateQueries({ queryKey: ["daily-compliance-logs"] });
      setRowState(emptyRow);
      setShowForm(false);
      await refetch();
      Alert.alert("Saved", `${config.title} log recorded`);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save log");
    } finally {
      setSaving(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────

  const Icon = config.icon;
  const logCount = logs?.length ?? 0;

  return (
    <View style={{ flex: 1 }}>
      {/* Date navigation */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 16, paddingTop: 10, paddingBottom: 2, gap: 8 }}>
        <Pressable onPress={() => stepDate(-1)} style={{ padding: 6 }}>
          <ChevronLeft size={20} color={colors.textSecondary} strokeWidth={2} />
        </Pressable>
        <DatePicker
          value={new Date(selectedDate + "T12:00:00")}
          onChange={(d) => setSelectedDate(d.toISOString().split("T")[0])}
          mode="date"
        />
        <Pressable onPress={() => stepDate(1)} style={{ padding: 6, opacity: isToday ? 0.3 : 1 }} disabled={isToday}>
          <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
        </Pressable>
        {!isToday && (
          <Pressable onPress={() => setSelectedDate(todayStr)} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: colors.accentBg }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.accent }}>Today</Text>
          </Pressable>
        )}
      </View>

      {/* Shift toggle + progress */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {(["AM", "PM"] as const).map((s) => (
            <Pressable
              key={s}
              onPress={() => setShift(s)}
              style={{ paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, backgroundColor: shift === s ? colors.accent : colors.surface }}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: shift === s ? "#FFFFFF" : colors.textSecondary }}>
                {s}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Badge variant={logCount > 0 ? "success" : "secondary"}>
            {logCount} {logCount === 1 ? "entry" : "entries"}
          </Badge>
          <Pressable onPress={() => setShowHistory(!showHistory)} style={{ padding: 6 }}>
            <History size={18} color={showHistory ? colors.accent : colors.textMuted} strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {isLoading ? (
          <View style={{ gap: 10 }}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : (
          <>
            {/* ── New Entry Form ─────────────────────────────────── */}
            {showForm && isToday && (
              <Card style={{ marginBottom: 16 }}>
                <CardContent style={{ paddingTop: 16, gap: 14 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <Icon size={18} color={config.color} strokeWidth={2} />
                    <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
                      New {config.title} Entry
                    </Text>
                  </View>

                  {config.items.map((item) => {
                    const val = rowState.values[item.key] || "";
                    const status = computeStatus(item, val);

                    if (item.type === "boolean") {
                      return (
                        <View key={item.key} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                          <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text }}>{item.label}</Text>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            {(item.options || ["Yes", "No"]).map((opt) => (
                              <Pressable
                                key={opt}
                                onPress={() => setField(item.key, opt)}
                                style={{
                                  paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8,
                                  backgroundColor: val === opt ? (opt === "Yes" ? "#10B98120" : "#EF444420") : colors.surface,
                                  borderWidth: 1,
                                  borderColor: val === opt ? (opt === "Yes" ? "#10B981" : "#EF4444") : colors.border,
                                }}
                              >
                                <Text style={{ fontSize: 13, fontWeight: "600", color: val === opt ? (opt === "Yes" ? "#10B981" : "#EF4444") : colors.textSecondary }}>
                                  {opt}
                                </Text>
                              </Pressable>
                            ))}
                          </View>
                        </View>
                      );
                    }

                    if (item.type === "select") {
                      return (
                        <View key={item.key} style={{ gap: 6 }}>
                          <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text }}>{item.label}</Text>
                          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                            {(item.options || []).map((opt) => (
                              <Pressable
                                key={opt}
                                onPress={() => setField(item.key, opt)}
                                style={{
                                  paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
                                  backgroundColor: val === opt ? colors.accentBg : colors.surface,
                                  borderWidth: 1,
                                  borderColor: val === opt ? colors.accent : colors.border,
                                }}
                              >
                                <Text style={{ fontSize: 13, fontWeight: val === opt ? "600" : "400", color: val === opt ? colors.accent : colors.textSecondary }}>
                                  {opt}
                                </Text>
                              </Pressable>
                            ))}
                          </View>
                        </View>
                      );
                    }

                    // temperature, ppm, or text
                    return (
                      <View key={item.key} style={{ gap: 4 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                          <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text }}>{item.label}</Text>
                          {status && (
                            <Badge variant={status === "pass" ? "success" : status === "warning" ? "warning" : "destructive"}>
                              {STATUS_COLORS[status].label}
                            </Badge>
                          )}
                        </View>
                        <TextInput
                          value={val}
                          onChangeText={(v) => setField(item.key, v)}
                          placeholder={item.placeholder || item.label}
                          placeholderTextColor={colors.textMuted}
                          keyboardType={item.type === "temperature" || item.type === "ppm" ? "decimal-pad" : "default"}
                          style={{
                            backgroundColor: colors.surface,
                            borderRadius: 10,
                            paddingHorizontal: 14,
                            paddingVertical: 12,
                            fontSize: 15,
                            color: colors.text,
                            borderWidth: 1,
                            borderColor: status === "fail" ? "#EF4444" : status === "warning" ? "#F59E0B" : colors.border,
                          }}
                        />
                      </View>
                    );
                  })}

                  {/* Visual check pass/fail for non-temp logs */}
                  {!config.items.some((i) => i.type === "temperature" || i.type === "ppm") && (
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text }}>Check Passed</Text>
                      <Switch
                        value={rowState.passed}
                        onValueChange={(v) => setRowState((prev) => ({ ...prev, passed: v }))}
                        trackColor={{ false: "#EF4444", true: "#10B981" }}
                      />
                    </View>
                  )}

                  {/* Corrective action (shown when fail) */}
                  {overallStatus === "fail" && (
                    <View style={{ gap: 4 }}>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: "#EF4444" }}>Corrective Action</Text>
                      <TextInput
                        value={rowState.correctiveAction}
                        onChangeText={(v) => setRowState((prev) => ({ ...prev, correctiveAction: v }))}
                        placeholder="Describe corrective action taken..."
                        placeholderTextColor={colors.textMuted}
                        multiline
                        style={{
                          backgroundColor: "#EF444410",
                          borderRadius: 10,
                          paddingHorizontal: 14,
                          paddingVertical: 12,
                          fontSize: 14,
                          color: colors.text,
                          borderWidth: 1,
                          borderColor: "#EF4444",
                          minHeight: 60,
                        }}
                      />
                    </View>
                  )}

                  {/* Notes */}
                  <TextInput
                    value={rowState.notes}
                    onChangeText={(v) => setRowState((prev) => ({ ...prev, notes: v }))}
                    placeholder="Additional notes (optional)"
                    placeholderTextColor={colors.textMuted}
                    multiline
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      fontSize: 14,
                      color: colors.text,
                      borderWidth: 1,
                      borderColor: colors.border,
                      minHeight: 50,
                    }}
                  />

                  {/* Photo evidence */}
                  {config.hasPhoto && (
                    <ImagePicker
                      onImageSelected={(base64) => setRowState((prev) => ({ ...prev, photoBase64: base64 }))}
                      label={rowState.photoBase64 ? "Photo attached" : "Add photo evidence"}
                    />
                  )}

                  {/* Doc upload for staff health */}
                  {config.hasDocUpload && (
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <Pressable
                        onPress={() => {
                          // Placeholder — in future would use DocumentPicker
                          Alert.alert("Upload", "Document upload will be available from the Food Safety Docs page");
                        }}
                        style={({ pressed }) => ({
                          flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                          paddingVertical: 10, borderRadius: 10, backgroundColor: colors.surface,
                          borderWidth: 1, borderColor: colors.border, borderStyle: "dashed",
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <Upload size={16} color={colors.textMuted} strokeWidth={2} />
                        <Text style={{ fontSize: 13, fontWeight: "500", color: colors.textSecondary }}>Upload Cert</Text>
                      </Pressable>
                    </View>
                  )}

                  {/* Save / Cancel */}
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                    <Pressable
                      onPress={() => { setShowForm(false); setRowState(emptyRow); }}
                      style={({ pressed }) => ({
                        flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center",
                        backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary }}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleSave}
                      disabled={saving}
                      style={({ pressed }) => ({
                        flex: 2, paddingVertical: 12, borderRadius: 10, alignItems: "center",
                        flexDirection: "row", justifyContent: "center", gap: 6,
                        backgroundColor: config.color, opacity: pressed ? 0.85 : saving ? 0.6 : 1,
                      })}
                    >
                      <Save size={16} color="#FFFFFF" strokeWidth={2} />
                      <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>
                        {saving ? "Saving..." : "Save Entry"}
                      </Text>
                    </Pressable>
                  </View>
                </CardContent>
              </Card>
            )}

            {/* ── Add button ────────────────────────────────────── */}
            {!showForm && isToday && (
              <Pressable
                onPress={() => setShowForm(true)}
                style={({ pressed }) => ({
                  flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                  paddingVertical: 14, borderRadius: 12, marginBottom: 16,
                  backgroundColor: config.color + "15", borderWidth: 1.5, borderColor: config.color + "30",
                  borderStyle: "dashed", opacity: pressed ? 0.7 : 1,
                })}
              >
                <Plus size={18} color={config.color} strokeWidth={2} />
                <Text style={{ fontSize: 15, fontWeight: "600", color: config.color }}>
                  Add {config.title} Entry
                </Text>
              </Pressable>
            )}

            {/* ── Today's logs ──────────────────────────────────── */}
            {logs && logs.length > 0 && (
              <>
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                  {isToday ? "Today's Entries" : formatDisplayDate(selectedDate)}
                </Text>
                {logs.map((log) => (
                  <LogEntryCard key={log.id} log={log} config={config} colors={colors} />
                ))}
              </>
            )}

            {logs && logs.length === 0 && !showForm && (
              <EmptyState
                icon={<Icon size={40} color={colors.textMuted} strokeWidth={1.5} />}
                title={config.emptyTitle || `No ${config.title} Entries`}
                description={config.emptyDescription || `Tap the button above to log a ${config.title.toLowerCase()} check`}
                style={{ paddingVertical: 40 }}
              />
            )}

            {/* ── History section ────────────────────────────────── */}
            {showHistory && (
              <View style={{ marginTop: 20 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <History size={16} color={colors.textMuted} strokeWidth={2} />
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, flex: 1 }}>
                    7-Day History
                  </Text>
                </View>

                <View style={{
                  flexDirection: "row", alignItems: "center", backgroundColor: colors.surface,
                  borderRadius: 10, paddingHorizontal: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border,
                }}>
                  <Search size={16} color={colors.textMuted} strokeWidth={2} />
                  <TextInput
                    value={historySearch}
                    onChangeText={setHistorySearch}
                    placeholder="Search by name or notes..."
                    placeholderTextColor={colors.textMuted}
                    style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 14, color: colors.text }}
                  />
                </View>

                {historyLoading ? (
                  <SkeletonCard />
                ) : historyByDate.length === 0 ? (
                  <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center", paddingVertical: 20 }}>
                    No history found
                  </Text>
                ) : (
                  historyByDate.map(([date, dateLogs]) => (
                    <View key={date} style={{ marginBottom: 14 }}>
                      <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted, marginBottom: 6 }}>
                        {formatDisplayDate(date)}
                      </Text>
                      {dateLogs.map((log) => (
                        <LogEntryCard key={log.id} log={log} config={config} colors={colors} compact />
                      ))}
                    </View>
                  ))
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ── Log Entry Card ────────────────────────────────────────────────────

function LogEntryCard({
  log,
  config,
  colors,
  compact,
}: {
  log: ComplianceLog;
  config: LogPageConfig;
  colors: any;
  compact?: boolean;
}) {
  const isPass = log.is_within_safe_zone || log.visual_check_passed;
  const StatusIcon = isPass ? Check : log.requires_corrective_action ? X : AlertTriangle;
  const statusColor = isPass ? "#10B981" : log.requires_corrective_action ? "#EF4444" : "#F59E0B";

  const time = new Date(log.created_at).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: compact ? 8 : 12,
        paddingHorizontal: 12,
        backgroundColor: colors.surface,
        borderRadius: 10,
        marginBottom: 6,
        borderLeftWidth: 3,
        borderLeftColor: statusColor,
      }}
    >
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: statusColor + "20", alignItems: "center", justifyContent: "center" }}>
        <StatusIcon size={14} color={statusColor} strokeWidth={2.5} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {log.temperature_reading != null && (
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>{log.temperature_reading}°C</Text>
          )}
          {log.sanitiser_concentration_ppm != null && (
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>{log.sanitiser_concentration_ppm} ppm</Text>
          )}
          {log.staff_name && (
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{log.staff_name}</Text>
          )}
          <Text style={{ fontSize: 12, color: colors.textMuted }}>{log.shift} · {time}</Text>
        </View>
        {log.notes && !compact && (
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }} numberOfLines={2}>
            {log.notes}
          </Text>
        )}
        {log.corrective_action_notes && (
          <Text style={{ fontSize: 12, color: "#EF4444", marginTop: 2 }} numberOfLines={1}>
            Action: {log.corrective_action_notes}
          </Text>
        )}
      </View>
    </View>
  );
}
