import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Switch,
  Alert,
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
import { FAB } from "../ui/FAB";
import { EmptyState } from "../ui/EmptyState";
import { SkeletonCard } from "../ui/Skeleton";
import { DatePicker } from "../ui/DatePicker";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EquipmentType = "thermometer" | "fridge" | "oven" | "other";
type CalibrationMethod = "ice_water" | "boiling" | "reference" | "professional";

const EQUIPMENT_TYPES: { key: EquipmentType; label: string }[] = [
  { key: "thermometer", label: "Thermometer" },
  { key: "fridge", label: "Fridge" },
  { key: "oven", label: "Oven" },
  { key: "other", label: "Other" },
];

const CALIBRATION_METHODS: { key: CalibrationMethod; label: string }[] = [
  { key: "ice_water", label: "Ice Water" },
  { key: "boiling", label: "Boiling" },
  { key: "reference", label: "Reference" },
  { key: "professional", label: "Professional" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDate(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getTypeLabel(type: EquipmentType): string {
  const found = EQUIPMENT_TYPES.find((t) => t.key === type);
  return found ? found.label : type;
}

function getMethodLabel(method: CalibrationMethod): string {
  const found = CALIBRATION_METHODS.find((m) => m.key === method);
  return found ? found.label : method;
}

function isOverdue(nextDueDate: string | null): boolean {
  if (!nextDueDate) return false;
  const today = getTodayDate();
  return nextDueDate < today;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BCCEquipmentCalibration() {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  // Form state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [equipmentName, setEquipmentName] = useState("");
  const [equipmentType, setEquipmentType] = useState<EquipmentType>("thermometer");
  const [calibrationMethod, setCalibrationMethod] = useState<CalibrationMethod>("ice_water");
  const [result, setResult] = useState("");
  const [passed, setPassed] = useState(true);
  const [nextDueDate, setNextDueDate] = useState("");

  // ---------------------------------------------------------------------------
  // Query
  // ---------------------------------------------------------------------------

  const {
    data: logs,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["bcc-equipment-calibration", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("bcc_equipment_calibration_logs")
        .select("*")
        .eq("org_id", orgId)
        .order("calibration_date", { ascending: false });
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!orgId,
  });

  // ---------------------------------------------------------------------------
  // Overdue check
  // ---------------------------------------------------------------------------

  const hasOverdue = useMemo(() => {
    if (!logs || logs.length === 0) return false;
    return logs.some((log: any) => isOverdue(log.next_due_date));
  }, [logs]);

  // ---------------------------------------------------------------------------
  // Mutation
  // ---------------------------------------------------------------------------

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No org selected");
      if (!equipmentName.trim()) throw new Error("Equipment name is required");

      const { error } = await supabase
        .from("bcc_equipment_calibration_logs")
        .insert({
          org_id: orgId,
          equipment_name: equipmentName.trim(),
          equipment_type: equipmentType,
          calibration_method: calibrationMethod,
          result: result.trim() || null,
          passed,
          next_due_date: nextDueDate.trim() || null,
          calibration_date: getTodayDate(),
          logged_by: user?.id || null,
          logged_by_name: user?.email || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bcc-equipment-calibration", orgId],
      });
      resetForm();
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const resetForm = useCallback(() => {
    setSheetOpen(false);
    setEquipmentName("");
    setEquipmentType("thermometer");
    setCalibrationMethod("ice_water");
    setResult("");
    setPassed(true);
    setNextDueDate("");
  }, []);

  const handleSave = () => {
    if (!equipmentName.trim()) {
      Alert.alert("Missing", "Please enter an equipment name");
      return;
    }
    saveMutation.mutate();
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Overdue banner */}
      {hasOverdue && (
        <View
          style={{
            backgroundColor: colors.warningBg,
            borderRadius: 10,
            padding: 12,
            marginHorizontal: 16,
            marginTop: 12,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.warning }}>
            Overdue Calibration
          </Text>
          <Text style={{ fontSize: 12, color: colors.warning, marginTop: 2 }}>
            One or more pieces of equipment have overdue calibration. Review and
            recalibrate as soon as possible.
          </Text>
        </View>
      )}

      {/* List */}
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 100,
          gap: 12,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : !logs || logs.length === 0 ? (
          <EmptyState
            icon="🔧"
            title="No Calibration Records"
            description="Tap + to log your first equipment calibration"
          />
        ) : (
          logs.map((log: any) => {
            const overdue = isOverdue(log.next_due_date);
            return (
              <View
                key={log.id}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 14,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: overdue ? colors.warning : colors.border,
                  gap: 8,
                }}
              >
                {/* Top row: date + equipment name */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: colors.text,
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {log.equipment_name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textMuted,
                      marginLeft: 8,
                    }}
                  >
                    {log.calibration_date ? formatDate(log.calibration_date) : "—"}
                  </Text>
                </View>

                {/* Badges row: type + passed/failed */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <Badge variant="secondary">
                    {getTypeLabel(log.equipment_type)}
                  </Badge>
                  <Badge variant={log.passed ? "success" : "destructive"}>
                    {log.passed ? "Passed" : "Failed"}
                  </Badge>
                  {overdue && <Badge variant="warning">Overdue</Badge>}
                </View>

                {/* Method + result */}
                <View style={{ gap: 2 }}>
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                    Method: {getMethodLabel(log.calibration_method)}
                  </Text>
                  {log.result ? (
                    <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                      Result: {log.result}
                    </Text>
                  ) : null}
                </View>

                {/* Next due date */}
                {log.next_due_date ? (
                  <Text
                    style={{
                      fontSize: 12,
                      color: overdue ? colors.warning : colors.textMuted,
                      fontWeight: overdue ? "600" : "400",
                    }}
                  >
                    Next due: {formatDate(log.next_due_date)}
                  </Text>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* FAB */}
      <FAB onPress={() => setSheetOpen(true)} />

      {/* FormSheet */}
      <FormSheet
        visible={sheetOpen}
        onClose={resetForm}
        onSave={handleSave}
        title="Log Calibration"
        saving={saveMutation.isPending}
      >
        {/* Equipment name */}
        <Input
          label="Equipment Name"
          value={equipmentName}
          onChangeText={setEquipmentName}
          placeholder="e.g. Walk-in fridge thermometer"
        />

        {/* Equipment type pills */}
        <View>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: colors.textSecondary,
              marginBottom: 8,
            }}
          >
            Equipment Type
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {EQUIPMENT_TYPES.map((t) => (
              <Pressable
                key={t.key}
                onPress={() => setEquipmentType(t.key)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: "center",
                  backgroundColor:
                    equipmentType === t.key ? colors.accentBg : colors.surface,
                  borderWidth: 2,
                  borderColor:
                    equipmentType === t.key ? colors.accent : colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color:
                      equipmentType === t.key
                        ? colors.accent
                        : colors.textSecondary,
                  }}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Calibration method pills */}
        <View>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: colors.textSecondary,
              marginBottom: 8,
            }}
          >
            Calibration Method
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {CALIBRATION_METHODS.map((m) => (
              <Pressable
                key={m.key}
                onPress={() => setCalibrationMethod(m.key)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: "center",
                  backgroundColor:
                    calibrationMethod === m.key
                      ? colors.accentBg
                      : colors.surface,
                  borderWidth: 2,
                  borderColor:
                    calibrationMethod === m.key ? colors.accent : colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color:
                      calibrationMethod === m.key
                        ? colors.accent
                        : colors.textSecondary,
                  }}
                >
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Result */}
        <Input
          label="Result"
          value={result}
          onChangeText={setResult}
          placeholder='e.g. 0.2°C deviation'
        />

        {/* Passed switch */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: colors.textSecondary,
            }}
          >
            Passed?
          </Text>
          <Switch
            value={passed}
            onValueChange={setPassed}
            trackColor={{
              false: colors.destructiveBg,
              true: colors.successBg,
            }}
            thumbColor={passed ? colors.success : colors.destructive}
          />
        </View>

        {/* Next due date */}
        <DatePicker
          label="Next Due Date"
          placeholder="Select next due date"
          value={nextDueDate ? new Date(nextDueDate + "T00:00:00") : new Date()}
          onChange={(date) => setNextDueDate(date.toISOString().split("T")[0])}
        />
      </FormSheet>
    </View>
  );
}
