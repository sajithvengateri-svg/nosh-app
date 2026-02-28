import { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../../contexts/ThemeProvider";
import { useAuth } from "../../contexts/AuthProvider";
import { useOrg } from "../../contexts/OrgProvider";
import { supabase } from "../../lib/supabase";
import { Card, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { ImagePicker } from "../ui/ImagePicker";
import { DatePicker } from "../ui/DatePicker";
import {
  Package,
  Camera,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  History,
  Search,
} from "lucide-react-native";
import {
  useSuppliers,
  useReceivingSettings,
  useReceivingLogs,
  useReceivingHistory,
  getReceivingTempStatus,
  PRODUCT_CATEGORY_LABELS,
  type ReceivingSetting,
  type ProductCategory,
} from "../../hooks/useReceiving";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// ── Status colours ──────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; text: string; icon: React.ComponentType<any> }> = {
  pass: { bg: "#10B98120", text: "#10B981", icon: Check },
  fail: { bg: "#EF444420", text: "#EF4444", icon: X },
};

// ── Row state ───────────────────────────────────────────────────────
interface RowState {
  id: string;
  supplier: string;
  item: string;
  category: ProductCategory | "";
  tempValue: string;
  scanning: boolean;
  photoBase64: string;
  saved: boolean;
}

function emptyRow(): RowState {
  return {
    id: Math.random().toString(36).slice(2),
    supplier: "",
    item: "",
    category: "",
    tempValue: "",
    scanning: false,
    photoBase64: "",
    saved: false,
  };
}

// ── Component ───────────────────────────────────────────────────────
export function ReceivingGrid() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const isToday = selectedDate === todayStr;
  const [shift, setShift] = useState<"am" | "pm">(new Date().getHours() < 12 ? "am" : "pm");

  const { suppliers } = useSuppliers();
  const { settings } = useReceivingSettings();
  const { logs, isLoading, refetch, queryKey } = useReceivingLogs(selectedDate);
  const [savingAll, setSavingAll] = useState(false);

  // History
  const [showHistory, setShowHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const sevenDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  }, []);
  const { logs: historyLogs, isLoading: historyLoading } = useReceivingHistory(
    showHistory ? { dateFrom: sevenDaysAgo, dateTo: todayStr, searchItem: historySearch || undefined } : {}
  );

  // Editable rows for today
  const [rows, setRows] = useState<RowState[]>([emptyRow()]);

  const stepDate = useCallback(
    (direction: -1 | 1) => {
      const d = new Date(selectedDate + "T12:00:00");
      d.setDate(d.getDate() + direction);
      const newDate = d.toISOString().split("T")[0];
      if (newDate <= todayStr) setSelectedDate(newDate);
    },
    [selectedDate, todayStr]
  );

  // Settings lookup
  const settingsByCategory = useMemo(() => {
    const map: Record<string, ReceivingSetting> = {};
    settings.forEach((s) => {
      map[s.product_category] = s;
    });
    return map;
  }, [settings]);

  const updateRow = (id: string, field: keyof RowState, val: any) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  };

  const removeRow = (id: string) => {
    setRows((prev) => {
      const next = prev.filter((r) => r.id !== id);
      return next.length === 0 ? [emptyRow()] : next;
    });
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  // Camera scan handler
  const handleScanTemp = async (rowId: string, base64: string) => {
    updateRow(rowId, "scanning", true);
    try {
      const { data, error } = await supabase.functions.invoke("read-temp-display", {
        body: { image_base64: base64, file_type: "image/jpeg", captured_at: new Date().toISOString() },
      });
      if (error) throw error;
      if (data?.temperature !== undefined) {
        updateRow(rowId, "tempValue", String(data.temperature));
      } else {
        Alert.alert("No Reading", "Could not detect temperature from the image");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to read temperature");
    } finally {
      updateRow(rowId, "scanning", false);
    }
  };

  // Save all filled rows
  const handleSaveAll = async () => {
    const filled = rows.filter((r) => r.supplier.trim() && r.item.trim() && !r.saved);
    if (filled.length === 0) {
      Alert.alert("Nothing to Save", "Fill in at least supplier and item");
      return;
    }
    setSavingAll(true);
    try {
      for (const row of filled) {
        const tempVal = parseFloat(row.tempValue);
        const hasTempReading = !isNaN(tempVal);
        const setting = row.category ? settingsByCategory[row.category] : undefined;
        const tempStatus =
          hasTempReading && setting ? getReceivingTempStatus(tempVal, setting) : "no_check";

        const notes = JSON.stringify({
          item_name: row.item,
          supplier: row.supplier,
          quantity: "",
          best_before: "",
          notes: "",
        });

        const matchedSupplier = suppliers.find(
          (s) => s.supplier_name.toLowerCase() === row.supplier.toLowerCase()
        );

        await supabase.from("daily_compliance_logs").insert({
          org_id: orgId,
          log_type: "receiving",
          log_date: selectedDate,
          shift,
          temperature_reading: hasTempReading ? tempVal : null,
          is_within_safe_zone: tempStatus === "pass" || tempStatus === "no_check",
          visual_check_passed: true,
          requires_corrective_action: tempStatus === "fail",
          corrective_action_type: null,
          supplier_id: matchedSupplier?.id ?? null,
          product_category: row.category || null,
          notes,
          logged_by: user?.email ?? "unknown",
          logged_by_name: user?.email ?? "unknown",
        });
      }

      // Mark rows saved
      setRows((prev) =>
        prev.map((r) =>
          filled.some((f) => f.id === r.id) ? { ...r, saved: true } : r
        )
      );
      // Add a new empty row
      setRows((prev) => [...prev, emptyRow()]);
      await queryClient.invalidateQueries({ queryKey });
      await refetch();
      Alert.alert("Saved", `${filled.length} receiving log${filled.length > 1 ? "s" : ""} saved`);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSavingAll(false);
    }
  };

  // Filter logs by shift
  const shiftLogs = useMemo(() => logs.filter((l) => l.shift === shift), [logs, shift]);

  // Group history by date
  const historyByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    historyLogs.forEach((l) => {
      const d = l.log_date;
      if (!map[d]) map[d] = [];
      map[d].push(l);
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [historyLogs]);

  // Parse notes helper
  const parseNotes = (log: any) => {
    try {
      return typeof log.notes === "string" ? JSON.parse(log.notes) : log.notes ?? {};
    } catch {
      return {};
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Date navigation bar */}
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

      {/* Shift toggle + count */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {(["am", "pm"] as const).map((s) => (
            <Pressable
              key={s}
              onPress={() => setShift(s)}
              style={{ paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, backgroundColor: shift === s ? colors.accent : colors.surface }}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: shift === s ? "#FFFFFF" : colors.textSecondary }}>
                {s.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Package size={14} color={colors.textMuted} strokeWidth={1.5} />
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textMuted }}>
            {shiftLogs.length} logged
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
      >
        {/* ── Saved rows for this shift ────────────────────────── */}
        {shiftLogs.map((log) => {
          const parsed = parseNotes(log);
          const hasTempReading = log.temperature_reading != null;
          const tempOk = log.is_within_safe_zone;
          const sc = !hasTempReading ? null : tempOk ? STATUS_COLORS.pass : STATUS_COLORS.fail;
          const StatusIcon = sc?.icon ?? Check;
          return (
            <Card key={log.id} style={{ marginBottom: 8 }}>
              <CardContent style={{ paddingTop: 12, paddingBottom: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "#F59E0B20", justifyContent: "center", alignItems: "center", marginRight: 10 }}>
                    <Package size={16} color="#F59E0B" strokeWidth={1.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }} numberOfLines={1}>
                      {parsed.item_name || "Item"}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }} numberOfLines={1}>
                      {parsed.supplier || "—"}{log.product_category ? ` · ${PRODUCT_CATEGORY_LABELS[log.product_category as ProductCategory] ?? log.product_category}` : ""}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    {hasTempReading && (
                      <>
                        <Text style={{ fontSize: 16, fontWeight: "800", color: sc?.text ?? colors.text }}>
                          {log.temperature_reading}°C
                        </Text>
                        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: sc?.bg, justifyContent: "center", alignItems: "center" }}>
                          <StatusIcon size={12} color={sc?.text} strokeWidth={2} />
                        </View>
                      </>
                    )}
                    {!hasTempReading && (
                      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "#10B98120", justifyContent: "center", alignItems: "center" }}>
                        <Check size={12} color="#10B981" strokeWidth={2} />
                      </View>
                    )}
                  </View>
                </View>
                <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4, marginLeft: 42 }}>
                  {new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {(log.logged_by_name || "").split("@")[0]}
                </Text>
              </CardContent>
            </Card>
          );
        })}

        {/* ── Editable rows (today only) ──────────────────────── */}
        {isToday && (
          <>
            {rows.filter((r) => !r.saved).map((row) => {
              const tempVal = parseFloat(row.tempValue);
              const hasTempReading = !isNaN(tempVal);
              const setting = row.category ? settingsByCategory[row.category] : undefined;
              const tempStatus = hasTempReading && setting ? getReceivingTempStatus(tempVal, setting) : null;
              const sc = tempStatus ? STATUS_COLORS[tempStatus] ?? null : null;
              const benchmarkLabel =
                setting && setting.temp_min != null && setting.temp_max != null
                  ? `${setting.temp_min}–${setting.temp_max}°C`
                  : null;

              return (
                <Card key={row.id} style={{ marginBottom: 8, borderWidth: 1, borderColor: sc ? sc.text + "40" : colors.accent + "30" }}>
                  <CardContent style={{ paddingTop: 12, paddingBottom: 12, gap: 8 }}>
                    {/* Row 1: Supplier + Item */}
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TextInput
                        value={row.supplier}
                        onChangeText={(t) => updateRow(row.id, "supplier", t)}
                        placeholder="Supplier"
                        placeholderTextColor={colors.textMuted}
                        style={{
                          flex: 1, fontSize: 14, fontWeight: "600", color: colors.text,
                          backgroundColor: colors.surface, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
                          borderWidth: 1, borderColor: colors.border,
                        }}
                      />
                      <TextInput
                        value={row.item}
                        onChangeText={(t) => updateRow(row.id, "item", t)}
                        placeholder="Item name"
                        placeholderTextColor={colors.textMuted}
                        style={{
                          flex: 1, fontSize: 14, fontWeight: "600", color: colors.text,
                          backgroundColor: colors.surface, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
                          borderWidth: 1, borderColor: colors.border,
                        }}
                      />
                    </View>

                    {/* Row 2: Category pills (scroll) */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                      {Object.entries(PRODUCT_CATEGORY_LABELS).map(([key, label]) => {
                        const active = row.category === key;
                        return (
                          <Pressable
                            key={key}
                            onPress={() => updateRow(row.id, "category", active ? "" : key)}
                            style={{
                              paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
                              backgroundColor: active ? colors.accent : colors.surface,
                              borderWidth: 1, borderColor: active ? colors.accent : colors.border,
                            }}
                          >
                            <Text style={{ fontSize: 11, fontWeight: "600", color: active ? "#FFFFFF" : colors.textSecondary }}>
                              {label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>

                    {/* Row 3: Temp + Camera + Actions */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      {/* Temp input */}
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <TextInput
                          value={row.tempValue}
                          onChangeText={(t) => updateRow(row.id, "tempValue", t)}
                          placeholder="__°C"
                          placeholderTextColor={colors.textMuted}
                          keyboardType="decimal-pad"
                          style={{
                            width: 68, textAlign: "center", fontSize: 16, fontWeight: "700",
                            color: sc ? sc.text : colors.text,
                            backgroundColor: colors.surface, borderRadius: 8, paddingVertical: 6,
                            borderWidth: 1, borderColor: sc ? sc.text + "40" : colors.border,
                          }}
                        />
                        {benchmarkLabel && (
                          <Text style={{ fontSize: 10, color: colors.textMuted }}>{benchmarkLabel}</Text>
                        )}
                      </View>

                      {/* Camera scan */}
                      {row.scanning ? (
                        <ActivityIndicator size="small" color={colors.accent} />
                      ) : (
                        <ImagePicker
                          onImageSelected={(b64) => handleScanTemp(row.id, b64)}
                          cameraOnly
                          compact
                          renderButton={({ onPress, loading }) => (
                            <Pressable
                              onPress={onPress}
                              disabled={loading}
                              style={{
                                width: 36, height: 36, borderRadius: 10,
                                backgroundColor: colors.accentBg, justifyContent: "center", alignItems: "center",
                                borderWidth: 1, borderColor: colors.accent + "30",
                              }}
                            >
                              {loading ? (
                                <ActivityIndicator size="small" color={colors.accent} />
                              ) : (
                                <Camera size={18} color={colors.accent} strokeWidth={2} />
                              )}
                            </Pressable>
                          )}
                        />
                      )}

                      {/* Status badge */}
                      {tempStatus && (
                        <Badge variant={tempStatus === "pass" ? "success" : "destructive"}>
                          {tempStatus.toUpperCase()}
                        </Badge>
                      )}

                      <View style={{ flex: 1 }} />

                      {/* Delete row */}
                      <Pressable onPress={() => removeRow(row.id)} hitSlop={8} style={{ padding: 4 }}>
                        <Trash2 size={16} color={colors.textMuted} strokeWidth={1.5} />
                      </Pressable>
                    </View>
                  </CardContent>
                </Card>
              );
            })}

            {/* Add row button */}
            <Pressable
              onPress={addRow}
              style={{
                flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderStyle: "dashed",
                borderColor: colors.accent + "50", marginBottom: 8,
              }}
            >
              <Plus size={16} color={colors.accent} strokeWidth={2} />
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.accent }}>Add Item</Text>
            </Pressable>

            {/* Save All */}
            {rows.some((r) => !r.saved && r.supplier.trim() && r.item.trim()) && (
              <Pressable
                onPress={handleSaveAll}
                disabled={savingAll}
                style={{
                  flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                  paddingVertical: 14, borderRadius: 12, backgroundColor: colors.accent,
                  opacity: savingAll ? 0.6 : 1, marginBottom: 8,
                }}
              >
                {savingAll ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Check size={18} color="#FFFFFF" strokeWidth={2} />
                )}
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>
                  Save All
                </Text>
              </Pressable>
            )}
          </>
        )}

        {/* ── Past date: no editable rows ─────────────────────── */}
        {!isToday && shiftLogs.length === 0 && (
          <Card style={{ marginBottom: 10, opacity: 0.6 }}>
            <CardContent style={{ paddingVertical: 20, alignItems: "center" }}>
              <Text style={{ fontSize: 14, color: colors.textMuted, fontStyle: "italic" }}>No receiving logs for this shift</Text>
            </CardContent>
          </Card>
        )}

        {/* ── History section ─────────────────────────────────── */}
        <Pressable
          onPress={() => setShowHistory(!showHistory)}
          style={{
            flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            marginTop: 20, paddingVertical: 10, paddingHorizontal: 4,
            borderTopWidth: 1, borderTopColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <History size={16} color={colors.textSecondary} strokeWidth={1.5} />
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.textSecondary }}>History</Text>
          </View>
          <Text style={{ fontSize: 13, color: colors.textMuted }}>{showHistory ? "Hide" : "Show"}</Text>
        </Pressable>

        {showHistory && (
          <View style={{ marginTop: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Search size={14} color={colors.textMuted} strokeWidth={1.5} />
              <TextInput
                value={historySearch}
                onChangeText={setHistorySearch}
                placeholder="Search by item..."
                placeholderTextColor={colors.textMuted}
                style={{
                  flex: 1, fontSize: 14, color: colors.text, backgroundColor: colors.surface,
                  borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
                  borderWidth: 1, borderColor: colors.border,
                }}
              />
            </View>

            {historyLoading && <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 12 }} />}

            {historyByDate.map(([dateKey, dayLogs]) => (
              <View key={dateKey} style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary, marginBottom: 6 }}>
                  {new Date(dateKey + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
                </Text>
                {dayLogs.map((log: any) => {
                  const parsed = parseNotes(log);
                  const hasTempReading = log.temperature_reading != null;
                  const tempOk = log.is_within_safe_zone;
                  return (
                    <View
                      key={log.id}
                      style={{ flexDirection: "row", alignItems: "center", paddingVertical: 5, paddingHorizontal: 8, borderRadius: 8, marginBottom: 2 }}
                    >
                      <Text style={{ flex: 1, fontSize: 13, color: colors.text }} numberOfLines={1}>
                        {parsed.item_name || "Item"}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textMuted, marginRight: 8 }} numberOfLines={1}>
                        {parsed.supplier || "—"}
                      </Text>
                      {hasTempReading && (
                        <Text style={{ fontSize: 13, fontWeight: "700", color: tempOk ? "#10B981" : "#EF4444", marginRight: 8 }}>
                          {log.temperature_reading}°C
                        </Text>
                      )}
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>
                        {log.shift?.toUpperCase()}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}

            {!historyLoading && historyByDate.length === 0 && (
              <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center", paddingVertical: 16 }}>
                No history found for the past 7 days
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
