import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
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
import { ImagePicker } from "../ui/ImagePicker";
import { useUploadSafetyPhoto } from "../../hooks/useFoodSafety";
import { DatePicker } from "../ui/DatePicker";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AREA_OPTIONS = ["Kitchen Hood", "Exhaust Filters", "Canopy", "Ductwork"];

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDisplayDate(dateString: string): string {
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
  return target.getTime() < now.getTime();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BCCHoodCleaning() {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();
  const uploadPhoto = useUploadSafetyPhoto();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [cleaningDate, setCleaningDate] = useState(getTodayDate());
  const [providerName, setProviderName] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [method, setMethod] = useState("");
  const [conditionNotes, setConditionNotes] = useState("");
  const [nextScheduledDate, setNextScheduledDate] = useState("");
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [certBase64, setCertBase64] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Query: fetch hood_cleaning logs
  // ---------------------------------------------------------------------------

  const {
    data: logs,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<any[]>({
    queryKey: ["hood-cleaning-logs", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("food_safety_logs")
        .select("*")
        .eq("org_id", orgId)
        .eq("log_type", "hood_cleaning")
        .order("log_date", { ascending: false });
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!orgId,
  });

  // Determine if the most recent log has an overdue next_scheduled_date
  const latestNextDate = useMemo(() => {
    if (!logs || logs.length === 0) return null;
    const latest = logs[0];
    return latest?.readings?.next_scheduled_date ?? null;
  }, [logs]);

  const showOverdueBanner = isOverdue(latestNextDate);

  // ---------------------------------------------------------------------------
  // Mutation: save hood cleaning log
  // ---------------------------------------------------------------------------

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No org selected");
      if (!providerName.trim()) throw new Error("Service provider is required");
      if (selectedAreas.length === 0)
        throw new Error("Select at least one area");

      let photoUrl: string | null = null;
      let certUrl: string | null = null;
      if (photoBase64) photoUrl = await uploadPhoto.mutateAsync(photoBase64);
      if (certBase64) certUrl = await uploadPhoto.mutateAsync(certBase64);

      const { error } = await supabase.from("food_safety_logs").insert({
        org_id: orgId,
        log_type: "hood_cleaning",
        log_date: cleaningDate,
        location: providerName.trim(),
        status: "pass",
        readings: {
          areas_cleaned: selectedAreas,
          method: method.trim(),
          condition_notes: conditionNotes.trim(),
          next_scheduled_date: nextScheduledDate || null,
          photo_url: photoUrl,
          certificate_url: certUrl,
        },
        recorded_by: user?.id,
        recorded_by_name: user?.email,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["hood-cleaning-logs", orgId],
      });
      resetForm();
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  // ---------------------------------------------------------------------------
  // Form helpers
  // ---------------------------------------------------------------------------

  const resetForm = useCallback(() => {
    setSheetOpen(false);
    setCleaningDate(getTodayDate());
    setProviderName("");
    setSelectedAreas([]);
    setMethod("");
    setConditionNotes("");
    setNextScheduledDate("");
    setPhotoBase64(null);
    setCertBase64(null);
  }, []);

  const toggleArea = useCallback((area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  }, []);

  const handleSave = () => {
    saveMutation.mutate();
  };

  // ---------------------------------------------------------------------------
  // Condition badge helper
  // ---------------------------------------------------------------------------

  function getConditionBadge(log: any) {
    const notes: string = log?.readings?.condition_notes || "";
    const lower = notes.toLowerCase();
    if (lower.includes("poor") || lower.includes("fail") || lower.includes("damage")) {
      return <Badge variant="destructive">Needs Attention</Badge>;
    }
    if (lower.includes("fair") || lower.includes("worn") || lower.includes("aging")) {
      return <Badge variant="warning">Fair</Badge>;
    }
    return <Badge variant="success">Good</Badge>;
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Overdue Banner */}
      {showOverdueBanner && (
        <View
          style={{
            backgroundColor: colors.warningBg,
            borderRadius: 10,
            padding: 12,
            marginHorizontal: 16,
            marginTop: 12,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: colors.warning,
            }}
          >
            Hood Cleaning Overdue
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: colors.warning,
              marginTop: 2,
            }}
          >
            Scheduled cleaning was due{" "}
            {latestNextDate ? formatDisplayDate(latestNextDate) : ""}. Arrange
            service immediately to maintain compliance.
          </Text>
        </View>
      )}

      {/* List */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 80,
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
            icon="🔧"
            title="No Hood Cleaning Logs"
            description="Tap + to record your first hood / canopy cleaning service."
          />
        ) : (
          <View style={{ gap: 12 }}>
            {logs.map((log: any) => {
              const areas: string[] = log?.readings?.areas_cleaned || [];
              const logMethod: string = log?.readings?.method || "";
              const nextDate: string | null =
                log?.readings?.next_scheduled_date || null;

              return (
                <View
                  key={log.id}
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 14,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    gap: 8,
                  }}
                >
                  {/* Top row: date + condition badge */}
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
                      {formatDisplayDate(log.log_date)}
                    </Text>
                    {getConditionBadge(log)}
                  </View>

                  {/* Provider */}
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: colors.textSecondary,
                    }}
                  >
                    {log.location || "Unknown Provider"}
                  </Text>

                  {/* Areas cleaned as tags */}
                  {areas.length > 0 && (
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 6,
                      }}
                    >
                      {areas.map((area: string) => (
                        <Badge key={area} variant="secondary">
                          {area}
                        </Badge>
                      ))}
                    </View>
                  )}

                  {/* Method */}
                  {logMethod ? (
                    <Text
                      style={{
                        fontSize: 13,
                        color: colors.textMuted,
                      }}
                    >
                      Method: {logMethod}
                    </Text>
                  ) : null}

                  {/* Next scheduled date */}
                  {nextDate && (
                    <Text
                      style={{
                        fontSize: 12,
                        color: isOverdue(nextDate)
                          ? colors.warning
                          : colors.textMuted,
                        fontWeight: isOverdue(nextDate) ? "600" : "400",
                      }}
                    >
                      Next service: {formatDisplayDate(nextDate)}
                      {isOverdue(nextDate) ? " (overdue)" : ""}
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
        icon="+"
        color={colors.accent}
      />

      {/* FormSheet */}
      <FormSheet
        visible={sheetOpen}
        onClose={resetForm}
        onSave={handleSave}
        title="Log Hood Cleaning"
        saving={saveMutation.isPending}
      >
        {/* Cleaning Date */}
        <DatePicker
          label="Cleaning Date"
          placeholder="Select cleaning date"
          value={cleaningDate ? new Date(cleaningDate + "T00:00:00") : new Date()}
          onChange={(date) => setCleaningDate(date.toISOString().split("T")[0])}
        />

        {/* Service Provider */}
        <Input
          label="Service Provider"
          value={providerName}
          onChangeText={setProviderName}
          placeholder="e.g. GreenClean Services"
        />

        {/* Areas Cleaned — Multi-select Chips */}
        <View>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: colors.textSecondary,
              marginBottom: 8,
            }}
          >
            Areas Cleaned
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {AREA_OPTIONS.map((area) => {
              const selected = selectedAreas.includes(area);
              return (
                <Pressable
                  key={area}
                  onPress={() => toggleArea(area)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: selected ? colors.accent : colors.border,
                    backgroundColor: selected
                      ? colors.accentBg
                      : colors.surface,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: selected ? colors.accent : colors.textSecondary,
                    }}
                  >
                    {area}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Method */}
        <Input
          label="Method"
          value={method}
          onChangeText={setMethod}
          placeholder='e.g. "Chemical wash", "Steam clean"'
        />

        {/* Condition Notes */}
        <Input
          label="Condition Notes"
          value={conditionNotes}
          onChangeText={setConditionNotes}
          placeholder="Describe the condition of hoods/canopies..."
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: "top" }}
        />

        {/* Next Scheduled Date */}
        <DatePicker
          label="Next Scheduled Date"
          placeholder="Select next scheduled date"
          value={nextScheduledDate ? new Date(nextScheduledDate + "T00:00:00") : new Date()}
          onChange={(date) => setNextScheduledDate(date.toISOString().split("T")[0])}
        />

        {/* Photo Evidence */}
        <ImagePicker
          onImageSelected={(base64) => setPhotoBase64(base64)}
          label="Photo Evidence"
          buttonText={photoBase64 ? "Retake Photo" : "Take Photo"}
        />

        {/* Certificate Upload */}
        <ImagePicker
          onImageSelected={(base64) => setCertBase64(base64)}
          label="Certificate Upload"
          buttonText={certBase64 ? "Replace Certificate" : "Upload Certificate"}
        />
      </FormSheet>
    </View>
  );
}
