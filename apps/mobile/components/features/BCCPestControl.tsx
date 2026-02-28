import { useState, useCallback } from "react";
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
import { Card, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Input } from "../ui/Input";
import { FormSheet } from "../ui/FormSheet";
import { EmptyState } from "../ui/EmptyState";
import { FAB } from "../ui/FAB";
import { SkeletonCard } from "../ui/Skeleton";
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BCCPestControl() {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();
  const uploadPhoto = useUploadSafetyPhoto();

  // ── Form state ──────────────────────────────────────────────
  const [sheetOpen, setSheetOpen] = useState(false);
  const [logType, setLogType] = useState<"self_inspection" | "professional">(
    "self_inspection"
  );
  const [providerName, setProviderName] = useState("");
  const [technicianName, setTechnicianName] = useState("");
  const [pestsFound, setPestsFound] = useState(false);
  const [findings, setFindings] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [nextServiceDate, setNextServiceDate] = useState("");
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  // ── Query ───────────────────────────────────────────────────
  const {
    data: logs,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<any[]>({
    queryKey: ["bcc-pest-control-logs", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("bcc_pest_control_logs")
        .select("*")
        .eq("org_id", orgId)
        .order("log_date", { ascending: false });
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!orgId,
  });

  // ── Mutation ────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No org selected");

      if (logType === "professional" && !providerName.trim()) {
        throw new Error("Provider name is required for professional services");
      }

      if (pestsFound && !findings.trim()) {
        throw new Error("Please describe the findings when pests are found");
      }

      if (pestsFound && !correctiveAction.trim()) {
        throw new Error(
          "Corrective action is required when pests are found"
        );
      }

      let reportUrl: string | null = null;
      if (photoBase64) reportUrl = await uploadPhoto.mutateAsync(photoBase64);

      const { error } = await supabase.from("bcc_pest_control_logs").insert({
        org_id: orgId,
        log_date: getTodayDate(),
        log_type: logType,
        provider_name:
          logType === "professional" ? providerName.trim() || null : null,
        technician_name:
          logType === "professional" ? technicianName.trim() || null : null,
        pests_found: pestsFound,
        findings: pestsFound ? findings.trim() || null : null,
        corrective_action: pestsFound ? correctiveAction.trim() || null : null,
        next_service_date: nextServiceDate.trim() || null,
        report_document_url: reportUrl,
        logged_by: user?.id || null,
        logged_by_name: user?.email || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bcc-pest-control-logs", orgId],
      });
      resetForm();
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const resetForm = useCallback(() => {
    setSheetOpen(false);
    setLogType("self_inspection");
    setProviderName("");
    setTechnicianName("");
    setPestsFound(false);
    setFindings("");
    setCorrectiveAction("");
    setNextServiceDate("");
    setPhotoBase64(null);
  }, []);

  const handleSave = () => {
    saveMutation.mutate();
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 100,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* Header */}
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: colors.text,
            marginBottom: 16,
          }}
        >
          Pest Control Logs
        </Text>

        {/* Loading */}
        {isLoading && (
          <View style={{ gap: 12 }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        )}

        {/* Empty */}
        {!isLoading && (!logs || logs.length === 0) && (
          <EmptyState
            icon="🪲"
            title="No Pest Control Logs"
            description="Start logging weekly self-inspections and professional pest service visits to stay BCC compliant."
            actionLabel="Add First Log"
            onAction={() => setSheetOpen(true)}
          />
        )}

        {/* Log list */}
        {!isLoading &&
          logs &&
          logs.length > 0 &&
          logs.map((log: any) => (
            <Card key={log.id} style={{ marginBottom: 12 }}>
              <CardContent style={{ paddingTop: 16 }}>
                {/* Top row: date + type badge */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: colors.text,
                    }}
                  >
                    {formatDate(log.log_date)}
                  </Text>
                  <Badge
                    variant={
                      log.log_type === "professional" ? "default" : "secondary"
                    }
                  >
                    {log.log_type === "professional"
                      ? "Professional"
                      : "Self-Inspection"}
                  </Badge>
                </View>

                {/* Provider name for professional visits */}
                {log.log_type === "professional" && log.provider_name && (
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.textSecondary,
                      marginBottom: 4,
                    }}
                  >
                    Provider: {log.provider_name}
                    {log.technician_name
                      ? ` (${log.technician_name})`
                      : ""}
                  </Text>
                )}

                {/* Pests found indicator */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: log.pests_found ? 8 : 0,
                  }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: log.pests_found
                        ? colors.destructive
                        : colors.success,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: log.pests_found
                        ? colors.destructive
                        : colors.success,
                    }}
                  >
                    {log.pests_found ? "Pests Found" : "No Pests Found"}
                  </Text>
                </View>

                {/* Findings summary */}
                {log.pests_found && log.findings && (
                  <View
                    style={{
                      backgroundColor: colors.destructiveBg,
                      borderRadius: 10,
                      padding: 10,
                      marginBottom: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: colors.destructive,
                        marginBottom: 2,
                      }}
                    >
                      Findings
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: colors.destructive,
                      }}
                    >
                      {log.findings}
                    </Text>
                  </View>
                )}

                {/* Corrective action */}
                {log.pests_found && log.corrective_action && (
                  <View
                    style={{
                      backgroundColor: colors.warningBg,
                      borderRadius: 10,
                      padding: 10,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: colors.warning,
                        marginBottom: 2,
                      }}
                    >
                      Corrective Action
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: colors.warning,
                      }}
                    >
                      {log.corrective_action}
                    </Text>
                  </View>
                )}

                {/* Next service date */}
                {log.next_service_date && (
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textMuted,
                      marginTop: 8,
                    }}
                  >
                    Next service: {log.next_service_date}
                  </Text>
                )}
              </CardContent>
            </Card>
          ))}
      </ScrollView>

      {/* FAB */}
      <FAB onPress={() => setSheetOpen(true)} color={colors.accent} />

      {/* Form Sheet */}
      <FormSheet
        visible={sheetOpen}
        onClose={resetForm}
        onSave={handleSave}
        title="Log Pest Control"
        saving={saveMutation.isPending}
      >
        {/* Log type selector — pill buttons */}
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: colors.textSecondary,
            marginBottom: 8,
          }}
        >
          Log Type
        </Text>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 4 }}>
          <Pressable
            onPress={() => setLogType("self_inspection")}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 9999,
              alignItems: "center",
              backgroundColor:
                logType === "self_inspection"
                  ? colors.accentBg
                  : colors.surface,
              borderWidth: 2,
              borderColor:
                logType === "self_inspection" ? colors.accent : colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color:
                  logType === "self_inspection"
                    ? colors.accent
                    : colors.textSecondary,
              }}
            >
              Weekly Self-Inspection
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setLogType("professional")}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 9999,
              alignItems: "center",
              backgroundColor:
                logType === "professional" ? colors.accentBg : colors.surface,
              borderWidth: 2,
              borderColor:
                logType === "professional" ? colors.accent : colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color:
                  logType === "professional"
                    ? colors.accent
                    : colors.textSecondary,
              }}
            >
              Professional Service
            </Text>
          </Pressable>
        </View>

        {/* Professional-only fields */}
        {logType === "professional" && (
          <>
            <Input
              label="Provider Name"
              value={providerName}
              onChangeText={setProviderName}
              placeholder="e.g. Rentokil, Flick Anticimex"
            />
            <Input
              label="Technician Name"
              value={technicianName}
              onChangeText={setTechnicianName}
              placeholder="Technician name (optional)"
            />
          </>
        )}

        {/* Pests found switch */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 8,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: colors.text,
            }}
          >
            Pests found?
          </Text>
          <Switch
            value={pestsFound}
            onValueChange={setPestsFound}
            trackColor={{
              false: colors.border,
              true: colors.destructive,
            }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Findings + corrective action — only when pests found */}
        {pestsFound && (
          <>
            <Input
              label="Findings"
              value={findings}
              onChangeText={setFindings}
              placeholder="Describe what was found, where, and type of pest..."
              multiline
              style={{ minHeight: 80, textAlignVertical: "top" }}
            />
            <Input
              label="Corrective Action"
              value={correctiveAction}
              onChangeText={setCorrectiveAction}
              placeholder="What action was taken or is planned?"
              multiline
              style={{ minHeight: 80, textAlignVertical: "top" }}
            />
          </>
        )}

        {/* Next service date */}
        <DatePicker
          label="Next Service Date"
          placeholder="Select next service date"
          value={nextServiceDate ? new Date(nextServiceDate + "T00:00:00") : new Date()}
          onChange={(date) => setNextServiceDate(date.toISOString().split("T")[0])}
        />

        {/* Photo evidence */}
        <ImagePicker
          onImageSelected={setPhotoBase64}
          label="Report Photo"
          buttonText={photoBase64 ? "Replace Photo" : "Add Photo Evidence"}
        />
      </FormSheet>
    </View>
  );
}
