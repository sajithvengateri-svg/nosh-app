import { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  Wifi,
  Thermometer,
  Snowflake,
  Flame,
  Check,
  AlertTriangle,
} from "lucide-react-native";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { Badge } from "../../../components/ui/Badge";
import { ImagePicker } from "../../../components/ui/ImagePicker";
import { useTheme } from "../../../contexts/ThemeProvider";
import { useScanner } from "../../../hooks/useScanner";
import {
  useTempEquipment,
  useCreateTempCheckLog,
  getAutoStatus,
  type TempEquipmentConfig,
  type LocationType,
} from "../../../hooks/useTempEquipment";

// ── Types ───────────────────────────────────────────────────────
type Tab = "scan" | "wifi";

interface TempResult {
  temperature: number;
  unit: string;
  confidence: number;
}

const TYPE_ICONS: Record<LocationType, { icon: React.ComponentType<any>; color: string; label: string }> = {
  fridge:   { icon: Snowflake, color: "#3B82F6", label: "Fridge" },
  freezer:  { icon: Snowflake, color: "#8B5CF6", label: "Freezer" },
  hot_hold: { icon: Flame,     color: "#EF4444", label: "Hot Hold" },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pass:    { bg: "#10B98120", text: "#10B981" },
  warning: { bg: "#F59E0B20", text: "#F59E0B" },
  fail:    { bg: "#EF444420", text: "#EF4444" },
};

// ── Component ───────────────────────────────────────────────────
export default function TempScannerPage() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const { state, scan, results, error, reset, scanning } = useScanner<TempResult>("read-temp-display");
  const { configs, isLoading: configsLoading } = useTempEquipment();
  const createLog = useCreateTempCheckLog();

  const [activeTab, setActiveTab] = useState<Tab>("scan");
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const shift = new Date().getHours() < 12 ? "am" : "pm" as "am" | "pm";
  const [notes, setNotes] = useState("");
  const [populated, setPopulated] = useState(false);
  const [scannedTemp, setScannedTemp] = useState<number | null>(null);

  // Current shift configs only
  const shiftConfigs = useMemo(
    () => configs.filter((c) => c.shift === shift),
    [configs, shift],
  );

  // Selected config
  const selectedConfig = useMemo(
    () => shiftConfigs.find((c) => c.id === selectedConfigId) ?? null,
    [shiftConfigs, selectedConfigId],
  );

  // Temp status
  const tempStatus = useMemo(() => {
    if (scannedTemp == null || !selectedConfig) return null;
    return getAutoStatus(scannedTemp, selectedConfig);
  }, [scannedTemp, selectedConfig]);

  // Populate from scan results
  if (state === "results" && results && !populated) {
    setScannedTemp(results.temperature);
    setPopulated(true);
    // Auto-select first config if none selected
    if (!selectedConfigId && shiftConfigs.length > 0) {
      setSelectedConfigId(shiftConfigs[0].id);
    }
  }
  if (state !== "results" && populated) {
    setPopulated(false);
  }

  const handleImage = useCallback((base64: string) => {
    scan(base64);
  }, [scan]);

  const handleSave = useCallback(() => {
    if (scannedTemp == null) {
      Alert.alert("No Reading", "Please scan a thermometer first");
      return;
    }
    if (!selectedConfig) {
      Alert.alert("Select Equipment", "Please select which equipment this reading is for");
      return;
    }

    createLog.mutate(
      {
        config: selectedConfig,
        value: scannedTemp,
        shift,
        corrective_action: notes.trim() || undefined,
        source: "camera",
      },
      {
        onSuccess: () => {
          Alert.alert(
            "Saved",
            `${scannedTemp}°C logged for ${selectedConfig.location_name}`,
          );
          // Reset for next scan
          reset();
          setScannedTemp(null);
          setSelectedConfigId(null);
          setNotes("");
          setPopulated(false);
        },
        onError: (e: Error) => Alert.alert("Error", e.message),
      },
    );
  }, [scannedTemp, selectedConfig, shift, notes, createLog, reset]);

  const handleReset = useCallback(() => {
    reset();
    setScannedTemp(null);
    setSelectedConfigId(null);
    setNotes("");
    setPopulated(false);
  }, [reset]);

  // ── Tab pills ──────────────────────────────────────────────
  const TabPill = ({ tab, label, icon: Icon }: { tab: Tab; label: string; icon: React.ComponentType<any> }) => {
    const isActive = activeTab === tab;
    return (
      <Pressable
        onPress={() => setActiveTab(tab)}
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          paddingVertical: 10,
          borderRadius: 10,
          backgroundColor: isActive ? colors.accent : colors.surface,
        }}
      >
        <Icon size={16} color={isActive ? "#FFFFFF" : colors.textSecondary} />
        <Text style={{ fontSize: 14, fontWeight: "600", color: isActive ? "#FFFFFF" : colors.textSecondary }}>
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Temp Scanner" />

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 20, gap: 16 }}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={Platform.OS === "ios" ? 20 : 80}
        enableAutomaticScroll
        enableResetScrollToCoords={false}
      >
        {/* Tab pills */}
        <View style={{ flexDirection: "row", gap: 8, backgroundColor: colors.card, borderRadius: 12, padding: 4 }}>
          <TabPill tab="scan" label="Scan Photo" icon={Camera} />
          <TabPill tab="wifi" label="WiFi Probe" icon={Wifi} />
        </View>

        {/* ── SCAN TAB ───────────────────────────────────── */}
        {activeTab === "scan" && (
          <>
            {/* Idle: show info + camera */}
            {state === "idle" && (
              <>
                <View style={{ backgroundColor: colors.accentBg, borderRadius: 12, padding: 14 }}>
                  <Text style={{ fontSize: 14, color: colors.accent, lineHeight: 20 }}>
                    Take a photo of a thermometer display to auto-read the temperature. The reading will be saved to your temp sheet.
                  </Text>
                </View>
                <ImagePicker onImageSelected={handleImage} label="Thermometer Display" buttonText="Scan Thermometer" />
              </>
            )}

            {/* Processing */}
            {state === "processing" && (
              <View style={{ alignItems: "center", paddingVertical: 60, gap: 16 }}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={{ fontSize: 16, color: colors.textSecondary }}>Reading thermometer...</Text>
              </View>
            )}

            {/* Error */}
            {state === "error" && (
              <View style={{ alignItems: "center", paddingVertical: 40, gap: 16 }}>
                <AlertTriangle size={40} color={colors.destructive} />
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.destructive }}>Scan Failed</Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center" }}>{error}</Text>
                <Pressable onPress={handleReset} style={{ backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 }}>
                  <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Try Again</Text>
                </Pressable>
              </View>
            )}

            {/* Results */}
            {state === "results" && scannedTemp != null && (
              <>
                {/* Temperature result card */}
                <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 20, alignItems: "center", gap: 8 }}>
                  <Thermometer size={28} color={colors.accent} />
                  <Text style={{ fontSize: 40, fontWeight: "800", color: colors.text }}>
                    {scannedTemp}°{results?.unit || "C"}
                  </Text>
                  {results?.confidence != null && (
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>
                      Confidence: {Math.round(results.confidence * 100)}%
                    </Text>
                  )}
                  {tempStatus && (
                    <Badge variant={tempStatus === "pass" ? "success" : tempStatus === "warning" ? "warning" : "destructive"}>
                      {tempStatus.toUpperCase()}
                    </Badge>
                  )}
                </View>

                {/* Equipment picker */}
                <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, gap: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                    Select Equipment ({shift.toUpperCase()} shift)
                  </Text>

                  {configsLoading ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : shiftConfigs.length === 0 ? (
                    <Text style={{ fontSize: 13, color: colors.textMuted }}>
                      No equipment configured. Set up equipment in the Temp Grid page first.
                    </Text>
                  ) : (
                    <View style={{ gap: 6 }}>
                      {shiftConfigs.map((config) => {
                        const isSelected = selectedConfigId === config.id;
                        const typeInfo = TYPE_ICONS[config.location_type] ?? TYPE_ICONS.fridge;
                        const TypeIcon = typeInfo.icon;
                        const status = scannedTemp != null ? getAutoStatus(scannedTemp, config) : null;
                        const statusColor = status ? STATUS_COLORS[status] : null;

                        return (
                          <Pressable
                            key={config.id}
                            onPress={() => setSelectedConfigId(config.id)}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 10,
                              padding: 12,
                              borderRadius: 10,
                              borderWidth: 2,
                              borderColor: isSelected ? colors.accent : colors.border,
                              backgroundColor: isSelected ? `${colors.accent}10` : colors.card,
                            }}
                          >
                            <TypeIcon size={18} color={typeInfo.color} />
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                                {config.display_name || config.location_name}
                              </Text>
                              <Text style={{ fontSize: 11, color: colors.textMuted }}>
                                {typeInfo.label}
                              </Text>
                            </View>
                            {status && statusColor && (
                              <View style={{ backgroundColor: statusColor.bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                                <Text style={{ fontSize: 11, fontWeight: "700", color: statusColor.text }}>
                                  {status.toUpperCase()}
                                </Text>
                              </View>
                            )}
                            {isSelected && (
                              <Check size={18} color={colors.accent} />
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* Notes (optional) */}
                {tempStatus === "fail" && (
                  <View style={{ backgroundColor: colors.destructiveBg || "#FEE2E2", borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <AlertTriangle size={20} color={colors.destructive} />
                    <Text style={{ flex: 1, fontSize: 13, color: colors.destructive }}>
                      Out of range — add corrective action notes below.
                    </Text>
                  </View>
                )}

                <View>
                  <Text style={{ fontSize: 12, fontWeight: "500", color: colors.textMuted, marginBottom: 4 }}>
                    {tempStatus === "fail" ? "Corrective Action *" : "Notes (optional)"}
                  </Text>
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder={tempStatus === "fail" ? "Describe corrective action taken..." : "Additional notes..."}
                    placeholderTextColor={colors.textMuted}
                    multiline
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 8,
                      padding: 10,
                      fontSize: 14,
                      color: colors.text,
                      borderWidth: 1,
                      borderColor: tempStatus === "fail" ? colors.destructive : colors.border,
                      minHeight: 60,
                      textAlignVertical: "top",
                    }}
                  />
                </View>

                {/* Action buttons */}
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <Pressable
                    onPress={handleReset}
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 12,
                      paddingVertical: 14,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontWeight: "600", color: colors.textSecondary }}>Scan Again</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSave}
                    disabled={createLog.isPending || !selectedConfig}
                    style={{
                      flex: 1,
                      backgroundColor: !selectedConfig ? colors.textMuted : tempStatus === "fail" ? colors.destructive : colors.accent,
                      borderRadius: 12,
                      paddingVertical: 14,
                      alignItems: "center",
                      opacity: createLog.isPending || !selectedConfig ? 0.6 : 1,
                    }}
                  >
                    {createLog.isPending ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={{ fontWeight: "700", color: "#FFFFFF" }}>
                        Save to Temp Sheet
                      </Text>
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </>
        )}

        {/* ── WIFI TAB (placeholder) ─────────────────────── */}
        {activeTab === "wifi" && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 32, alignItems: "center", gap: 16 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: `${colors.accent}15`, alignItems: "center", justifyContent: "center" }}>
              <Wifi size={32} color={colors.accent} />
            </View>
            <Badge variant="default">Coming Soon</Badge>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, textAlign: "center" }}>
              WiFi Thermometer
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 20 }}>
              Connect WiFi-enabled probes and displays to auto-log temperatures directly to your temp sheet — no manual entry needed.
            </Text>
            <View style={{ backgroundColor: colors.card, borderRadius: 10, padding: 14, width: "100%", gap: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>
                Planned Features
              </Text>
              {["Auto-detect WiFi probes on network", "Real-time temperature streaming", "Alerts when out of range", "Works with Bluetooth probes too"].map((feat) => (
                <View key={feat} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent }} />
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>{feat}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
