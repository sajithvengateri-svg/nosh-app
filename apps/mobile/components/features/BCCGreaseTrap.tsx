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
import { Badge } from "../ui/Badge";
import { Input } from "../ui/Input";
import { EmptyState } from "../ui/EmptyState";
import { SkeletonCard } from "../ui/Skeleton";
import { FormSheet } from "../ui/FormSheet";
import { FAB } from "../ui/FAB";
import { ImagePicker } from "../ui/ImagePicker";
import { useUploadSafetyPhoto } from "../../hooks/useFoodSafety";
import { DatePicker } from "../ui/DatePicker";

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

function isOverdue(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  const target = new Date(dateString);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return target < now;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BCCGreaseTrap() {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();
  const uploadPhoto = useUploadSafetyPhoto();

  // Form state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [serviceDate, setServiceDate] = useState(getTodayDate());
  const [providerName, setProviderName] = useState("");
  const [pumpOutPerformed, setPumpOutPerformed] = useState(false);
  const [greaseLevel, setGreaseLevel] = useState("");
  const [conditionNotes, setConditionNotes] = useState("");
  const [nextServiceDate, setNextServiceDate] = useState("");
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Query — fetch grease trap logs
  // ---------------------------------------------------------------------------

  const {
    data: logs,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<any[]>({
    queryKey: ["grease-trap-logs", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("food_safety_logs")
        .select("*")
        .eq("org_id", orgId)
        .eq("log_type", "grease_trap")
        .order("log_date", { ascending: false });
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!orgId,
  });

  // ---------------------------------------------------------------------------
  // Derived — check for overdue next service date
  // ---------------------------------------------------------------------------

  const latestNextServiceDate = useMemo(() => {
    if (!logs || logs.length === 0) return null;
    const latest = logs[0];
    return latest?.readings?.next_service_date || null;
  }, [logs]);

  const overdue = isOverdue(latestNextServiceDate);

  // ---------------------------------------------------------------------------
  // Mutation — save new grease trap log
  // ---------------------------------------------------------------------------

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No organisation selected");
      if (!serviceDate.trim()) throw new Error("Service date is required");
      if (!providerName.trim()) throw new Error("Service provider is required");

      let photoUrl: string | null = null;
      if (photoBase64) {
        photoUrl = await uploadPhoto.mutateAsync(photoBase64);
      }

      const greaseLevelNum = greaseLevel.trim()
        ? parseFloat(greaseLevel)
        : null;

      const { error } = await supabase.from("food_safety_logs").insert({
        org_id: orgId,
        log_type: "grease_trap",
        log_date: serviceDate,
        location: providerName.trim(),
        status: pumpOutPerformed ? "pass" : "pending",
        readings: {
          grease_level_pct: greaseLevelNum,
          pump_out: pumpOutPerformed,
          condition_notes: conditionNotes.trim() || null,
          next_service_date: nextServiceDate.trim() || null,
          photo_url: photoUrl,
        },
        recorded_by: user?.id,
        recorded_by_name: user?.email,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grease-trap-logs", orgId] });
      resetForm();
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  // ---------------------------------------------------------------------------
  // Form helpers
  // ---------------------------------------------------------------------------

  const resetForm = useCallback(() => {
    setSheetOpen(false);
    setServiceDate(getTodayDate());
    setProviderName("");
    setPumpOutPerformed(false);
    setGreaseLevel("");
    setConditionNotes("");
    setNextServiceDate("");
    setPhotoBase64(null);
  }, []);

  const handleSave = () => {
    saveMutation.mutate();
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Overdue banner */}
      {overdue && latestNextServiceDate && (
        <View
          style={{
            backgroundColor: colors.warningBg,
            paddingVertical: 10,
            paddingHorizontal: 16,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: colors.warning,
            }}
          >
            Grease Trap Service Overdue
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.warning,
              marginTop: 2,
            }}
          >
            Next service was due {formatDate(latestNextServiceDate)}. Schedule
            a service immediately.
          </Text>
        </View>
      )}

      {/* List */}
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 100,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {isLoading ? (
          <View style={{ gap: 12 }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : !logs || logs.length === 0 ? (
          <EmptyState
            icon="\uD83E\uDEE7"
            title="No Grease Trap Logs"
            description="Tap + to log your first grease trap service record."
          />
        ) : (
          <View style={{ gap: 12 }}>
            {logs.map((log: any) => {
              const readings = log.readings || {};
              const pumpOut = readings.pump_out === true;
              const greasePct = readings.grease_level_pct;
              const notes = readings.condition_notes;

              return (
                <View
                  key={log.id}
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 14,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                    gap: 8,
                  }}
                >
                  {/* Top row: date + pump-out badge */}
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
                      }}
                    >
                      {formatDate(log.log_date)}
                    </Text>
                    <Badge variant={pumpOut ? "success" : "warning"}>
                      {pumpOut ? "Pump-out: Yes" : "Pump-out: No"}
                    </Badge>
                  </View>

                  {/* Provider name */}
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.textSecondary,
                    }}
                  >
                    Provider: {log.location || "N/A"}
                  </Text>

                  {/* Grease level */}
                  {greasePct != null && (
                    <Text
                      style={{
                        fontSize: 13,
                        color: colors.textSecondary,
                      }}
                    >
                      Grease Level: {greasePct}%
                    </Text>
                  )}

                  {/* Condition notes preview */}
                  {notes && (
                    <Text
                      style={{
                        fontSize: 13,
                        color: colors.textMuted,
                      }}
                      numberOfLines={2}
                    >
                      {notes}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <FAB
        onPress={() => setSheetOpen(true)}
        color={colors.accent}
      />

      {/* FormSheet */}
      <FormSheet
        visible={sheetOpen}
        onClose={resetForm}
        onSave={handleSave}
        title="Log Grease Trap Service"
        saving={saveMutation.isPending}
      >
        {/* Service date */}
        <DatePicker
          label="Service Date"
          placeholder="Select service date"
          value={serviceDate ? new Date(serviceDate + "T00:00:00") : new Date()}
          onChange={(date) => setServiceDate(date.toISOString().split("T")[0])}
        />

        {/* Service provider */}
        <Input
          label="Service Provider"
          value={providerName}
          onChangeText={setProviderName}
          placeholder="e.g. GreasePro Services"
        />

        {/* Pump-out switch */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 4,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: colors.textSecondary,
            }}
          >
            Pump-out performed?
          </Text>
          <Switch
            value={pumpOutPerformed}
            onValueChange={setPumpOutPerformed}
            trackColor={{ false: colors.border, true: colors.success }}
          />
        </View>

        {/* Grease level */}
        <Input
          label="Grease Level %"
          value={greaseLevel}
          onChangeText={setGreaseLevel}
          placeholder="e.g. 45"
          keyboardType="numeric"
        />

        {/* Condition notes */}
        <Input
          label="Condition Notes"
          value={conditionNotes}
          onChangeText={setConditionNotes}
          placeholder="Describe the condition of the grease trap..."
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: "top" }}
        />

        {/* Next service date */}
        <DatePicker
          label="Next Service Date"
          placeholder="Select next service date"
          value={nextServiceDate ? new Date(nextServiceDate + "T00:00:00") : new Date()}
          onChange={(date) => setNextServiceDate(date.toISOString().split("T")[0])}
        />

        {/* Photo evidence */}
        <ImagePicker
          label="Photo Evidence"
          onImageSelected={(base64) => setPhotoBase64(base64)}
          buttonText="Add Photo"
        />
      </FormSheet>
    </View>
  );
}
