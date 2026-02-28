import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useOrg } from "../../contexts/OrgProvider";
import { useAuth } from "../../contexts/AuthProvider";
import { useTheme } from "../../contexts/ThemeProvider";
import { FormSheet } from "../ui/FormSheet";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { ImagePicker } from "../ui/ImagePicker";
import {
  Snowflake,
  HeartPulse,
  Droplets,
  SprayCan,
  Sparkles,
  Bug,
  Package,
  Flame,
  Wind,
  MonitorCheck,
  Truck,
  Droplet,
  Fan,
  ClipboardCheck,
  CheckCircle2,
} from "lucide-react-native";
import {
  useTempEquipment,
  useTempCheckLogs,
} from "../../hooks/useTempEquipment";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BurstCard {
  key: string;
  label: string;
  icon: React.ComponentType<any>;
  requiresTemp: boolean;
  toggleKey?: string; // if gated by a sectionToggle
  thresholds?: {
    pass: (v: number) => boolean;
    warn: (v: number) => boolean;
  };
}

interface DailyComplianceBurstProps {
  sectionToggles: Record<string, boolean>;
}

interface ComplianceLog {
  id: string;
  log_type: string;
  log_date: string;
  shift: string;
  temperature_reading: number | null;
  is_within_safe_zone: boolean | null;
  visual_check_passed: boolean | null;
  requires_corrective_action: boolean;
  corrective_action_notes: string | null;
  notes: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BURST_CARDS: BurstCard[] = [
  {
    key: "fridge",
    label: "Fridge",
    icon: Snowflake,
    requiresTemp: true,
    toggleKey: "fridge_temps",
    thresholds: {
      pass: (v) => v >= 0 && v <= 5,
      warn: (v) => v > 5 && v <= 8,
    },
  },
  {
    key: "freezer",
    label: "Freezer",
    icon: Snowflake,
    requiresTemp: true,
    toggleKey: "freezer_temps",
    thresholds: {
      pass: (v) => v <= -18,
      warn: (v) => v > -18 && v <= -15,
    },
  },
  {
    key: "staff_health",
    label: "Staff Health",
    icon: HeartPulse,
    requiresTemp: false,
    toggleKey: "staff_health",
  },
  {
    key: "handwash",
    label: "Handwash",
    icon: Droplets,
    requiresTemp: false,
    toggleKey: "handwash_stations",
  },
  {
    key: "sanitiser",
    label: "Sanitiser",
    icon: SprayCan,
    requiresTemp: false,
    toggleKey: "sanitiser_check",
  },
  {
    key: "kitchen_clean",
    label: "Kitchen",
    icon: Sparkles,
    requiresTemp: false,
    toggleKey: "kitchen_clean",
  },
  {
    key: "pest",
    label: "Pest Check",
    icon: Bug,
    requiresTemp: false,
    toggleKey: "pest_check",
  },
  {
    key: "receiving",
    label: "Receiving",
    icon: Package,
    requiresTemp: false,
    toggleKey: "receiving_logs",
  },
  {
    key: "cooking",
    label: "Cooking",
    icon: Flame,
    requiresTemp: true,
    toggleKey: "cooking_logs",
    thresholds: {
      pass: (v) => v >= 75,
      warn: (v) => v >= 60 && v < 75,
    },
  },
  {
    key: "cooling",
    label: "Cooling",
    icon: Wind,
    requiresTemp: true,
    toggleKey: "cooling_logs",
    thresholds: {
      // BCC: food must cool from 60°C to 21°C within 2hrs, then 21°C to 5°C within 4hrs
      // A single reading ≤21°C within the 2hr window = pass
      pass: (v) => v <= 21,
      warn: (v) => v > 21 && v <= 25,
    },
  },
  {
    key: "reheating",
    label: "Reheating",
    icon: Flame,
    requiresTemp: true,
    toggleKey: "reheating_logs",
    thresholds: {
      pass: (v) => v >= 75,
      warn: (v) => v >= 60 && v < 75,
    },
  },
  {
    key: "display",
    label: "Display",
    icon: MonitorCheck,
    requiresTemp: true,
    toggleKey: "display_monitoring",
    thresholds: {
      // BCC: hot display ≥60°C, cold display ≤5°C
      // We check hot display here (≥60°C pass), cold uses fridge thresholds
      pass: (v) => v >= 60 || v <= 5,
      warn: (v) => (v >= 55 && v < 60) || (v > 5 && v <= 8),
    },
  },
  {
    key: "transport",
    label: "Transport",
    icon: Truck,
    requiresTemp: true,
    toggleKey: "transport_logs",
    thresholds: {
      // BCC: cold transport ≤5°C, hot transport ≥60°C (same as display)
      pass: (v) => v >= 60 || v <= 5,
      warn: (v) => (v >= 55 && v < 60) || (v > 5 && v <= 8),
    },
  },
  {
    key: "grease_trap",
    label: "Grease Trap",
    icon: Droplet,
    requiresTemp: false,
    toggleKey: "grease_trap",
  },
  {
    key: "hood_cleaning",
    label: "Hood/Canopy",
    icon: Fan,
    requiresTemp: false,
    toggleKey: "hood_cleaning",
  },
  {
    key: "haccp",
    label: "HACCP",
    icon: ClipboardCheck,
    requiresTemp: false,
    toggleKey: "haccp_plan",
  },
];

function getShift(): "AM" | "PM" {
  return new Date().getHours() < 12 ? "AM" : "PM";
}

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getTempStatus(
  card: BurstCard,
  value: number
): "pass" | "warning" | "fail" {
  if (!card.thresholds) return "pass"; // no thresholds = input-only
  if (card.thresholds.pass(value)) return "pass";
  if (card.thresholds.warn(value)) return "warning";
  return "fail";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DailyComplianceBurst({
  sectionToggles,
}: DailyComplianceBurstProps) {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  const shift = getShift();
  const today = getTodayDate();
  const shiftLower = shift.toLowerCase() as "am" | "pm";

  // Temp equipment config integration — check fridge/freezer completion from config data
  const { configs: tempConfigs } = useTempEquipment();
  const { logs: tempConfigLogs } = useTempCheckLogs(undefined, shiftLower);

  // Map config_id → log for the current shift
  const tempLogByConfigId = useMemo(() => {
    const map: Record<string, boolean> = {};
    tempConfigLogs.forEach((l) => {
      const cid = (l.readings as any)?.config_id;
      if (cid) map[cid] = true;
    });
    return map;
  }, [tempConfigLogs]);

  // Check if all configs of a given type have logs
  const isTempTypeComplete = useCallback(
    (locationType: string): boolean => {
      const typeConfigs = tempConfigs.filter(
        (c) => c.location_type === locationType && c.shift === shiftLower
      );
      if (typeConfigs.length === 0) return false; // no configs = not complete
      return typeConfigs.every((c) => !!tempLogByConfigId[c.id]);
    },
    [tempConfigs, shiftLower, tempLogByConfigId]
  );

  // Active card being filled
  const [activeCard, setActiveCard] = useState<BurstCard | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [passed, setPassed] = useState(true);
  const [notes, setNotes] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [scanningTemp, setScanningTemp] = useState(false);

  // Filter cards by section toggles
  const visibleCards = useMemo(
    () =>
      BURST_CARDS.filter((c) => {
        if (!c.toggleKey) return true;
        return sectionToggles[c.toggleKey] !== false;
      }),
    [sectionToggles]
  );

  // Fetch today's logs for this shift
  const {
    data: todayLogs,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<ComplianceLog[]>({
    queryKey: ["daily-compliance-logs", orgId, today, shift],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("daily_compliance_logs")
        .select("*")
        .eq("org_id", orgId)
        .eq("log_date", today)
        .eq("shift", shift);
      if (error) throw error;
      return (data as unknown as ComplianceLog[]) || [];
    },
    enabled: !!orgId,
  });

  const completedKeys = useMemo(() => {
    const set = new Set<string>();
    todayLogs?.forEach((l) => set.add(l.log_type));
    // Override fridge/freezer completion from temp config system
    if (isTempTypeComplete("fridge")) set.add("fridge");
    if (isTempTypeComplete("freezer")) set.add("freezer");
    return set;
  }, [todayLogs, isTempTypeComplete]);

  const doneCount = visibleCards.filter((c) => completedKeys.has(c.key)).length;
  const totalCount = visibleCards.length;
  const progressPct = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

  // Save log mutation (with duplicate guard)
  const saveMutation = useMutation({
    mutationFn: async (card: BurstCard) => {
      if (!orgId) throw new Error("No org selected");

      // Guard against duplicate entries for same card/shift/day
      if (completedKeys.has(card.key)) {
        throw new Error(`${card.label} has already been logged for this ${shift} shift`);
      }

      const tempVal = card.requiresTemp ? parseFloat(tempValue) : null;
      const tempStatus =
        card.requiresTemp && tempVal !== null && !isNaN(tempVal)
          ? getTempStatus(card, tempVal)
          : null;

      const isPass = card.requiresTemp
        ? tempStatus === "pass" || tempStatus === "warning"
        : passed;

      const needsCorrective = !isPass;

      if (needsCorrective && !correctiveAction.trim()) {
        throw new Error("Corrective action is required for non-passing checks");
      }

      const { error } = await supabase.from("daily_compliance_logs").insert({
        org_id: orgId,
        log_type: card.key,
        log_date: today,
        shift,
        temperature_reading: tempVal,
        is_within_safe_zone: isPass,
        visual_check_passed: card.requiresTemp ? null : passed,
        requires_corrective_action: needsCorrective,
        corrective_action_notes: needsCorrective
          ? correctiveAction.trim()
          : null,
        notes: notes.trim() || null,
        logged_by: user?.id || null,
        logged_by_name: user?.email || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["daily-compliance-logs", orgId, today, shift],
      });
      resetForm();
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const resetForm = useCallback(() => {
    setActiveCard(null);
    setTempValue("");
    setPassed(true);
    setNotes("");
    setCorrectiveAction("");
  }, []);

  const handleSave = () => {
    if (!activeCard) return;
    if (activeCard.requiresTemp && !tempValue.trim()) {
      Alert.alert("Missing", "Please enter a temperature reading");
      return;
    }
    saveMutation.mutate(activeCard);
  };

  const handleScanTemp = async (base64: string) => {
    setScanningTemp(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "read-temp-display",
        { body: { image_base64: base64, file_type: "image/jpeg" } }
      );
      if (error) throw error;
      if (data?.temperature !== undefined) {
        setTempValue(String(data.temperature));
      } else {
        Alert.alert("No Reading", "Could not detect temperature from image");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to read temperature");
    } finally {
      setScanningTemp(false);
    }
  };

  // Current temp status for live badge
  const liveTempStatus = useMemo(() => {
    if (!activeCard?.requiresTemp) return null;
    const val = parseFloat(tempValue);
    if (isNaN(val)) return null;
    return getTempStatus(activeCard, val);
  }, [activeCard, tempValue]);

  const needsCorrective = useMemo(() => {
    if (!activeCard) return false;
    if (activeCard.requiresTemp) {
      return liveTempStatus === "fail";
    }
    return !passed;
  }, [activeCard, liveTempStatus, passed]);

  return (
    <View style={{ flex: 1 }}>
      {/* Progress header */}
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: colors.text,
            }}
          >
            {shift} Compliance Burst
          </Text>
          <Badge variant={doneCount === totalCount && totalCount > 0 ? "success" : "default"}>
            {doneCount}/{totalCount}
          </Badge>
        </View>
        {/* Progress bar */}
        <View
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.border,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: 6,
              borderRadius: 3,
              width: `${progressPct}%` as any,
              backgroundColor:
                doneCount === totalCount && totalCount > 0
                  ? colors.success
                  : "#FFD700",
            }}
          />
        </View>
      </View>

      {/* Card grid */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingBottom: 40,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {isLoading ? (
          <View
            style={{
              padding: 40,
              alignItems: "center",
            }}
          >
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            {visibleCards.map((card) => {
              const done = completedKeys.has(card.key);
              const Icon = card.icon;
              const log = todayLogs?.find((l) => l.log_type === card.key);
              // For config-based temp cards (fridge/freezer), check if any readings failed
              const isConfigBased = (card.key === "fridge" || card.key === "freezer") && isTempTypeComplete(card.key);
              const configHasFailure = isConfigBased && tempConfigLogs.some((l) => {
                const cid = (l.readings as any)?.config_id;
                const config = tempConfigs.find((c) => c.id === cid);
                return config?.location_type === card.key && (l.status === "fail" || l.status === "warning");
              });
              const logFailed = isConfigBased
                ? configHasFailure
                : log && (log.is_within_safe_zone === false || log.visual_check_passed === false);

              return (
                <Pressable
                  key={card.key}
                  onPress={() => {
                    if (done) return; // already completed
                    setActiveCard(card);
                    setTempValue("");
                    setPassed(true);
                    setNotes("");
                    setCorrectiveAction("");
                  }}
                  style={{
                    width: "31%",
                    minHeight: 88,
                    borderRadius: 14,
                    padding: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    backgroundColor: done
                      ? logFailed
                        ? colors.destructiveBg || "#FEE2E2"
                        : colors.successBg || "#DCFCE7"
                      : colors.surface,
                    borderWidth: done ? 2 : 1,
                    borderColor: done
                      ? logFailed
                        ? colors.destructive
                        : colors.success
                      : colors.border,
                    opacity: done ? 0.85 : 1,
                  }}
                >
                  {done && (
                    <View
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                      }}
                    >
                      <CheckCircle2
                        size={14}
                        color={logFailed ? colors.destructive : colors.success}
                        fill={logFailed ? colors.destructive : colors.success}
                      />
                    </View>
                  )}
                  <Icon
                    size={22}
                    color={done ? (logFailed ? colors.destructive : colors.success) : colors.textSecondary}
                    strokeWidth={1.5}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: done ? (logFailed ? colors.destructive : colors.success) : colors.text,
                      textAlign: "center",
                    }}
                    numberOfLines={2}
                  >
                    {card.label}
                  </Text>
                  {done && log?.temperature_reading != null && (
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "700",
                        color: logFailed ? colors.destructive : colors.success,
                      }}
                    >
                      {log.temperature_reading}°C
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Input FormSheet */}
      <FormSheet
        visible={!!activeCard}
        onClose={resetForm}
        onSave={handleSave}
        title={activeCard?.label || "Log Check"}
        saving={saveMutation.isPending}
      >
        {activeCard?.requiresTemp ? (
          <>
            {/* Temperature input */}
            <Input
              label="Temperature (°C)"
              value={tempValue}
              onChangeText={setTempValue}
              keyboardType="decimal-pad"
              placeholder="Enter reading..."
            />

            {/* AI thermometer snap */}
            <View style={{ marginTop: 4 }}>
              <ImagePicker
                onImageSelected={handleScanTemp}
                label=""
                buttonText={scanningTemp ? "Reading..." : "Scan Thermometer"}
              />
            </View>

            {/* Live status badge */}
            {liveTempStatus && (
              <View
                style={{
                  alignItems: "center",
                  marginTop: 8,
                }}
              >
                <Badge
                  variant={
                    liveTempStatus === "pass"
                      ? "success"
                      : liveTempStatus === "warning"
                      ? "warning"
                      : "destructive"
                  }
                  style={{ paddingHorizontal: 16, paddingVertical: 6 }}
                >
                  {liveTempStatus === "pass"
                    ? "PASS"
                    : liveTempStatus === "warning"
                    ? "WARNING"
                    : "FAIL"}
                </Badge>
              </View>
            )}
          </>
        ) : (
          <>
            {/* Pass / Fail toggle */}
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.textSecondary,
                marginBottom: 8,
              }}
            >
              Result
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => setPassed(true)}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: passed ? colors.successBg || "#DCFCE7" : colors.surface,
                  borderWidth: 2,
                  borderColor: passed ? colors.success : colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: passed ? colors.success : colors.textSecondary,
                  }}
                >
                  PASS
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setPassed(false)}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: !passed ? colors.destructiveBg || "#FEE2E2" : colors.surface,
                  borderWidth: 2,
                  borderColor: !passed ? colors.destructive : colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: !passed ? colors.destructive : colors.textSecondary,
                  }}
                >
                  FAIL
                </Text>
              </Pressable>
            </View>
          </>
        )}

        {/* Corrective action — required on fail */}
        {needsCorrective && (
          <View style={{ marginTop: 12 }}>
            <Input
              label="Corrective Action (Required)"
              value={correctiveAction}
              onChangeText={setCorrectiveAction}
              placeholder="What action was taken to resolve this?"
              multiline
            />
          </View>
        )}

        {/* Optional notes */}
        <View style={{ marginTop: 8 }}>
          <Input
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional notes..."
            multiline
          />
        </View>
      </FormSheet>
    </View>
  );
}
