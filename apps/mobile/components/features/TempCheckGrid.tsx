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
import { supabase } from "../../lib/supabase";
import { Card, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Input } from "../ui/Input";
import { ImagePicker } from "../ui/ImagePicker";
import { EmptyState } from "../ui/EmptyState";
import { SkeletonCard } from "../ui/Skeleton";
import { DatePicker } from "../ui/DatePicker";
import {
  Thermometer,
  Snowflake,
  Flame,
  Camera,
  Wifi,
  Check,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  History,
} from "lucide-react-native";
import {
  useTempEquipment,
  useTempCheckLogs,
  useCreateTempCheckLog,
  useTempCheckHistory,
  getAutoStatus,
  getThresholds,
  type TempEquipmentConfig,
  type TempCheckLog,
  type LocationType,
} from "../../hooks/useTempEquipment";

const TYPE_ICONS: Record<LocationType, { icon: React.ComponentType<any>; color: string }> = {
  fridge:   { icon: Snowflake, color: "#3B82F6" },
  freezer:  { icon: Snowflake, color: "#8B5CF6" },
  hot_hold: { icon: Flame, color: "#EF4444" },
};

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: React.ComponentType<any> }> = {
  pass:    { bg: "#10B98120", text: "#10B981", icon: Check },
  warning: { bg: "#F59E0B20", text: "#F59E0B", icon: AlertTriangle },
  fail:    { bg: "#EF444420", text: "#EF4444", icon: X },
};

interface RowState {
  value: string;
  corrective: string;
  scanning: boolean;
}

export function TempCheckGrid() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const isToday = selectedDate === todayStr;
  const [shift, setShift] = useState<"am" | "pm">(new Date().getHours() < 12 ? "am" : "pm");
  const { configs, isLoading: configsLoading } = useTempEquipment();
  const { logs, isLoading: logsLoading, refetch, date } = useTempCheckLogs(selectedDate, shift);
  const createLog = useCreateTempCheckLog();
  const [savingAll, setSavingAll] = useState(false);

  // History section state
  const [showHistory, setShowHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const sevenDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  }, []);
  const { logs: historyLogs, isLoading: historyLoading } = useTempCheckHistory(
    showHistory ? { dateFrom: sevenDaysAgo, dateTo: todayStr, userName: historySearch || undefined } : {}
  );

  const stepDate = useCallback((direction: -1 | 1) => {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + direction);
    const newDate = d.toISOString().split("T")[0];
    if (newDate <= todayStr) setSelectedDate(newDate);
  }, [selectedDate, todayStr]);

  // Group history logs by date
  const historyByDate = useMemo(() => {
    const map: Record<string, TempCheckLog[]> = {};
    historyLogs.forEach((l) => {
      const d = l.date;
      if (!map[d]) map[d] = [];
      map[d].push(l);
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [historyLogs]);

  // Only show configs for the selected shift
  const shiftConfigs = useMemo(
    () => configs.filter((c) => c.shift === shift),
    [configs, shift]
  );

  // Map config_id → log
  const logByConfigId = useMemo(() => {
    const map: Record<string, any> = {};
    logs.forEach((l) => {
      const cid = (l.readings as any)?.config_id;
      if (cid) map[cid] = l;
    });
    return map;
  }, [logs]);

  // Local state for unsaved rows
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});

  const getRowState = (configId: string): RowState =>
    rowStates[configId] ?? { value: "", corrective: "", scanning: false };

  const setRowField = (configId: string, field: keyof RowState, val: any) => {
    setRowStates((prev) => ({
      ...prev,
      [configId]: { ...getRowState(configId), [field]: val },
    }));
  };

  // Camera scan handler per row
  const handleScanTemp = async (configId: string, base64: string, metadata?: { capturedAt: string }) => {
    setRowField(configId, "scanning", true);
    try {
      const { data, error } = await supabase.functions.invoke("read-temp-display", {
        body: {
          image_base64: base64,
          file_type: "image/jpeg",
          captured_at: metadata?.capturedAt || new Date().toISOString(),
        },
      });
      if (error) throw error;
      if (data?.temperature !== undefined) {
        setRowField(configId, "value", String(data.temperature));
      } else {
        Alert.alert("No Reading", "Could not detect temperature from the image");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to read temperature");
    } finally {
      setRowField(configId, "scanning", false);
    }
  };

  // "Notify Me" for wireless thermometers — stores interest flag
  const handleWirelessInterest = async () => {
    try {
      const { error } = await supabase
        .from("feature_interest")
        .upsert(
          {
            user_id: user?.id,
            org_id: user?.user_metadata?.org_id ?? null,
            feature_key: "wireless_thermometers",
            expressed_at: new Date().toISOString(),
          },
          { onConflict: "user_id,feature_key" }
        );
      if (error) throw error;
      Alert.alert(
        "You're on the list!",
        "We'll notify you when wireless thermometer integration is available."
      );
    } catch {
      Alert.alert(
        "Thanks!",
        "We've noted your interest. We'll be in touch when wireless thermometers are ready."
      );
    }
  };

  // Save all unsaved readings
  const handleSaveAll = async () => {
    const unsaved = shiftConfigs.filter((c) => {
      const existing = logByConfigId[c.id];
      const row = getRowState(c.id);
      return !existing && row.value.trim() !== "";
    });

    if (unsaved.length === 0) {
      Alert.alert("Nothing to Save", "Enter at least one temperature reading");
      return;
    }

    // Check for out-of-range without corrective actions
    const needsAction = unsaved.filter((c) => {
      const row = getRowState(c.id);
      const val = parseFloat(row.value);
      if (isNaN(val)) return false;
      const status = getAutoStatus(val, c);
      return status !== "pass" && !row.corrective.trim();
    });

    if (needsAction.length > 0) {
      const names = needsAction.map((c) => c.location_name).join(", ");
      Alert.alert(
        "Missing Corrective Actions",
        `${names} — out of range. Add corrective actions or save anyway?`,
        [
          { text: "Go Back", style: "cancel" },
          { text: "Save Anyway", onPress: () => doSaveAll(unsaved) },
        ]
      );
      return;
    }

    await doSaveAll(unsaved);
  };

  const doSaveAll = async (configs: TempEquipmentConfig[]) => {
    setSavingAll(true);
    try {
      for (const config of configs) {
        const row = getRowState(config.id);
        const val = parseFloat(row.value);
        if (isNaN(val)) continue;
        await createLog.mutateAsync({
          config,
          value: val,
          shift,
          corrective_action: row.corrective.trim() || undefined,
          source: "manual",
        });
      }
      // Clear saved rows from local state
      setRowStates((prev) => {
        const next = { ...prev };
        configs.forEach((c) => delete next[c.id]);
        return next;
      });
      await refetch();
      Alert.alert("Saved", `${configs.length} reading${configs.length > 1 ? "s" : ""} logged`);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSavingAll(false);
    }
  };

  const isLoading = configsLoading || logsLoading;
  const doneCount = shiftConfigs.filter((c) => !!logByConfigId[c.id]).length;
  const totalCount = shiftConfigs.length;
  const allDone = totalCount > 0 && doneCount === totalCount;

  if (isLoading) {
    return <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}><SkeletonCard /><SkeletonCard /><SkeletonCard /></ScrollView>;
  }

  if (configs.length === 0) {
    return (
      <EmptyState
        icon={<Thermometer size={48} color={colors.textMuted} strokeWidth={1.5} />}
        title="No Equipment Configured"
        description="Go to Setup tab to add your fridges, freezers, and hot holds"
        style={{ paddingVertical: 60 }}
      />
    );
  }

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
        <Pressable
          onPress={() => stepDate(1)}
          style={{ padding: 6, opacity: isToday ? 0.3 : 1 }}
          disabled={isToday}
        >
          <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
        </Pressable>
        {!isToday && (
          <Pressable
            onPress={() => setSelectedDate(todayStr)}
            style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: colors.accentBg }}
          >
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.accent }}>Today</Text>
          </Pressable>
        )}
      </View>

      {/* Shift toggle + progress */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {(["am", "pm"] as const).map((s) => (
            <Pressable
              key={s}
              onPress={() => setShift(s)}
              style={{
                paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8,
                backgroundColor: shift === s ? colors.accent : colors.surface,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: shift === s ? "#FFFFFF" : colors.textSecondary }}>
                {s.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {allDone && <Check size={16} color={colors.success} strokeWidth={2} />}
          <Text style={{ fontSize: 13, fontWeight: "600", color: allDone ? colors.success : colors.textMuted }}>
            {doneCount}/{totalCount}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
      >
        {shiftConfigs.map((config) => {
          const existingLog = logByConfigId[config.id];
          const row = getRowState(config.id);
          const typeInfo = TYPE_ICONS[config.location_type] ?? TYPE_ICONS.fridge;
          const Icon = typeInfo.icon;
          const thresholds = getThresholds(config);

          if (existingLog) {
            // Saved row — read only
            const val = parseFloat((existingLog.readings as any)?.value ?? "0");
            const status = existingLog.status || "pass";
            const sc = STATUS_COLORS[status] ?? STATUS_COLORS.pass;
            const StatusIcon = sc.icon;
            return (
              <Card key={config.id} style={{ marginBottom: 10 }}>
                <CardContent style={{ paddingTop: 14, paddingBottom: 14 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: typeInfo.color + "20", justifyContent: "center", alignItems: "center", marginRight: 10 }}>
                      <Icon size={16} color={typeInfo.color} strokeWidth={1.5} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{config.location_name}</Text>
                      <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
                        {existingLog.time?.slice(0, 5)} · {(existingLog.recorded_by_name || "").split("@")[0]}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ fontSize: 18, fontWeight: "800", color: sc.text }}>{val}°C</Text>
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: sc.bg, justifyContent: "center", alignItems: "center" }}>
                        <StatusIcon size={14} color={sc.text} strokeWidth={2} />
                      </View>
                    </View>
                  </View>
                  {existingLog.notes && (
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 6, marginLeft: 42 }}>
                      Action: {existingLog.notes}
                    </Text>
                  )}
                </CardContent>
              </Card>
            );
          }

          // Unsaved row
          if (!isToday) {
            // Past date — show "Not recorded" card
            return (
              <Card key={config.id} style={{ marginBottom: 10, opacity: 0.6 }}>
                <CardContent style={{ paddingTop: 14, paddingBottom: 14 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: typeInfo.color + "20", justifyContent: "center", alignItems: "center", marginRight: 10 }}>
                      <Icon size={16} color={typeInfo.color} strokeWidth={1.5} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{config.location_name}</Text>
                    </View>
                    <Text style={{ fontSize: 13, color: colors.textMuted, fontStyle: "italic" }}>Not recorded</Text>
                  </View>
                </CardContent>
              </Card>
            );
          }

          // Today — editable
          const val = parseFloat(row.value);
          const previewStatus = !isNaN(val) ? getAutoStatus(val, config) : null;
          const showCorrective = previewStatus && previewStatus !== "pass";

          return (
            <Card key={config.id} style={{ marginBottom: 10, borderWidth: 1, borderColor: previewStatus ? (STATUS_COLORS[previewStatus]?.text + "40") : colors.border }}>
              <CardContent style={{ paddingTop: 14, paddingBottom: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: typeInfo.color + "20", justifyContent: "center", alignItems: "center", marginRight: 10 }}>
                    <Icon size={16} color={typeInfo.color} strokeWidth={1.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{config.location_name}</Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
                      {`Pass: ${thresholds.pass[0]}\u2013${thresholds.pass[1]}\u00B0C`}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    {/* Temperature input */}
                    <TextInput
                      value={row.value}
                      onChangeText={(t) => setRowField(config.id, "value", t)}
                      placeholder={`__\u00B0C`}
                      placeholderTextColor={colors.textMuted}
                      keyboardType="decimal-pad"
                      style={{
                        width: 70, textAlign: "center", fontSize: 16, fontWeight: "700",
                        color: previewStatus ? STATUS_COLORS[previewStatus]?.text : colors.text,
                        backgroundColor: colors.surface, borderRadius: 8, paddingVertical: 6,
                        borderWidth: 1, borderColor: previewStatus ? (STATUS_COLORS[previewStatus]?.text + "40") : colors.border,
                      }}
                    />
                    {/* Camera button */}
                    {row.scanning ? (
                      <ActivityIndicator size="small" color={colors.accent} />
                    ) : (
                      <ImagePicker
                        onImageSelected={(b64, meta) => handleScanTemp(config.id, b64, meta)}
                        cameraOnly
                        compact
                        renderButton={({ onPress, loading }) => (
                          <Pressable onPress={onPress} disabled={loading} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.accentBg, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: colors.accent + "30" }}>
                            {loading ? <ActivityIndicator size="small" color={colors.accent} /> : <Camera size={18} color={colors.accent} strokeWidth={2} />}
                          </Pressable>
                        )}
                      />
                    )}
                    {/* Wireless thermometer — coming soon */}
                    <Pressable
                      onPress={() => {
                        Alert.alert(
                          "Wireless Thermometers",
                          "Automated temperature logging is coming soon!\n\n" +
                          "Connect wireless thermometers to your fridges, freezers, and hot-holds \u2014 " +
                          "readings will sync automatically, no manual entry needed.\n\n" +
                          "Interested? Tap 'Notify Me' and we'll let you know when it's available.",
                          [
                            { text: "Dismiss", style: "cancel" },
                            { text: "Notify Me", onPress: handleWirelessInterest },
                          ]
                        );
                      }}
                      style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center", opacity: 0.6 }}
                    >
                      <Wifi size={16} color={colors.accent} strokeWidth={1.5} />
                    </Pressable>
                  </View>
                </View>

                {/* Corrective action for out-of-range */}
                {showCorrective && (
                  <View style={{ marginTop: 8, marginLeft: 42 }}>
                    <TextInput
                      value={row.corrective}
                      onChangeText={(t) => setRowField(config.id, "corrective", t)}
                      placeholder="Corrective action taken..."
                      placeholderTextColor={colors.textMuted}
                      style={{
                        fontSize: 13, color: colors.text, backgroundColor: colors.surface,
                        borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
                        borderWidth: 1, borderColor: STATUS_COLORS[previewStatus]?.text + "40",
                      }}
                    />
                  </View>
                )}

                {/* Preview status badge */}
                {previewStatus && (
                  <View style={{ marginTop: 6, marginLeft: 42 }}>
                    <Badge variant={previewStatus === "pass" ? "success" : previewStatus === "warning" ? "warning" : "destructive"}>
                      {previewStatus.toUpperCase()}
                    </Badge>
                  </View>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Save All button — only on today */}
        {isToday && shiftConfigs.some((c) => !logByConfigId[c.id] && getRowState(c.id).value.trim()) && (
          <Button onPress={handleSaveAll} loading={savingAll} style={{ marginTop: 8 }}>
            Save All Readings
          </Button>
        )}

        {/* History section */}
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
            {/* Search by user */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Search size={14} color={colors.textMuted} strokeWidth={1.5} />
              <TextInput
                value={historySearch}
                onChangeText={setHistorySearch}
                placeholder="Search by user..."
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
                {dayLogs.map((log) => {
                  const val = parseFloat((log.readings as any)?.value ?? "0");
                  const status = log.status || "pass";
                  const sc = STATUS_COLORS[status] ?? STATUS_COLORS.pass;
                  return (
                    <View
                      key={log.id}
                      style={{
                        flexDirection: "row", alignItems: "center", paddingVertical: 6,
                        paddingHorizontal: 8, borderRadius: 8, marginBottom: 2,
                      }}
                    >
                      <Text style={{ flex: 1, fontSize: 13, color: colors.text }} numberOfLines={1}>
                        {log.location}
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: sc.text, marginRight: 8 }}>
                        {`${val}\u00B0C`}
                      </Text>
                      <Badge variant={status === "pass" ? "success" : status === "warning" ? "warning" : "destructive"} style={{ marginRight: 8 }}>
                        {status.toUpperCase()}
                      </Badge>
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>
                        {log.time?.slice(0, 5)} {(log.recorded_by_name || "").split("@")[0]}
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
