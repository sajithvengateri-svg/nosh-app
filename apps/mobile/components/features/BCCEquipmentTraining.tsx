import { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert,
  Linking,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useOrg } from "../../contexts/OrgProvider";
import { useAuth } from "../../contexts/AuthProvider";
import { useTheme } from "../../contexts/ThemeProvider";
import { Card, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { FAB } from "../ui/FAB";
import { FormSheet } from "../ui/FormSheet";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { EmptyState } from "../ui/EmptyState";
import { SkeletonCard } from "../ui/Skeleton";
import {
  Wrench,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  FileText,
} from "lucide-react-native";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  condition: string | null;
  location: string | null;
  notes: string | null;
}

interface TrainingReadings {
  equipment_id?: string;
  equipment_name: string;
  trainee_id: string;
  trainee_name: string;
  instructions: string;
  signed_off_by?: string | null;
  signed_off_at?: string | null;
}

interface TrainingLog {
  id: string;
  org_id: string;
  log_type: string;
  log_date: string;
  location: string;
  readings: TrainingReadings;
  status: string;
  recorded_by: string;
  recorded_by_name: string;
  created_at: string;
}

interface TeamMember {
  user_id: string;
  profiles: {
    full_name: string | null;
    email: string | null;
    position: string | null;
  } | null;
}

interface EquipmentGroup {
  equipment: EquipmentItem;
  trainingLogs: TrainingLog[];
}

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

function formatTimestamp(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getConditionColor(condition: string | null): "success" | "warning" | "destructive" | "secondary" {
  switch (condition?.toLowerCase()) {
    case "good":
    case "excellent":
      return "success";
    case "fair":
    case "needs_repair":
      return "warning";
    case "poor":
    case "broken":
      return "destructive";
    default:
      return "secondary";
  }
}

function formatCondition(condition: string | null): string {
  if (!condition) return "Unknown";
  return condition
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BCCEquipmentTraining() {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const { user, profile, isHeadChef } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  // Expand / collapse state
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [instructions, setInstructions] = useState("");

  // ---------------------------------------------------------------------------
  // Query: Equipment inventory
  // ---------------------------------------------------------------------------

  const {
    data: equipment,
    isLoading: equipmentLoading,
  } = useQuery({
    queryKey: ["equipment-inventory", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("equipment_inventory")
        .select("id, name, category, condition, location, notes")
        .eq("org_id", orgId)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!orgId,
  });

  // ---------------------------------------------------------------------------
  // Query: Training logs (food_safety_logs with log_type = equipment_training)
  // ---------------------------------------------------------------------------

  const {
    data: trainingLogs,
    isLoading: logsLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["equipment-training-logs", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("food_safety_logs")
        .select("*")
        .eq("org_id", orgId)
        .eq("log_type", "equipment_training")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!orgId,
  });

  // ---------------------------------------------------------------------------
  // Query: Team members
  // ---------------------------------------------------------------------------

  const {
    data: teamMembers,
  } = useQuery({
    queryKey: ["team-members", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("org_memberships")
        .select("user_id, profiles(full_name, email, position)")
        .eq("org_id", orgId)
        .eq("is_active", true);
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!orgId,
  });

  // ---------------------------------------------------------------------------
  // Derived: Group training logs by equipment
  // ---------------------------------------------------------------------------

  const equipmentGroups: EquipmentGroup[] = useMemo(() => {
    if (!equipment) return [];

    const logsByEquipment = new Map<string, TrainingLog[]>();

    // Index logs by equipment name (from readings.equipment_name or location)
    if (trainingLogs) {
      for (const log of trainingLogs as TrainingLog[]) {
        const key =
          log.readings?.equipment_name || log.location || "Unknown";
        const existing = logsByEquipment.get(key) || [];
        existing.push(log);
        logsByEquipment.set(key, existing);
      }
    }

    return (equipment as EquipmentItem[]).map((eq) => ({
      equipment: eq,
      trainingLogs: logsByEquipment.get(eq.name) || [],
    }));
  }, [equipment, trainingLogs]);

  // Count of pending sign-offs for the banner
  const pendingCount = useMemo(() => {
    if (!trainingLogs) return 0;
    return (trainingLogs as TrainingLog[]).filter(
      (log) => log.status !== "pass" && !log.readings?.signed_off_at
    ).length;
  }, [trainingLogs]);

  // ---------------------------------------------------------------------------
  // Select options
  // ---------------------------------------------------------------------------

  const equipmentOptions = useMemo(() => {
    if (!equipment) return [];
    return (equipment as EquipmentItem[]).map((eq) => ({
      label: `${eq.name}${eq.location ? ` (${eq.location})` : ""}`,
      value: eq.id,
    }));
  }, [equipment]);

  const memberOptions = useMemo(() => {
    if (!teamMembers) return [];
    return (teamMembers as TeamMember[])
      .map((m) => ({
        label:
          m.profiles?.full_name ||
          m.profiles?.email ||
          "Unknown Member",
        value: m.user_id,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [teamMembers]);

  // ---------------------------------------------------------------------------
  // Mutation: Save training record
  // ---------------------------------------------------------------------------

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No organisation selected");
      if (!selectedEquipmentId) throw new Error("Please select equipment");
      if (!selectedMemberId) throw new Error("Please select a team member");
      if (!instructions.trim()) throw new Error("Instructions are required");

      const selectedEq = (equipment as EquipmentItem[])?.find(
        (eq) => eq.id === selectedEquipmentId
      );
      const selectedMember = (teamMembers as TeamMember[])?.find(
        (m) => m.user_id === selectedMemberId
      );

      if (!selectedEq) throw new Error("Invalid equipment selection");
      if (!selectedMember) throw new Error("Invalid team member selection");

      const traineeName =
        selectedMember.profiles?.full_name ||
        selectedMember.profiles?.email ||
        "Unknown";

      const now = new Date();
      const readings: TrainingReadings = {
        equipment_id: selectedEq.id,
        equipment_name: selectedEq.name,
        trainee_id: selectedMemberId,
        trainee_name: traineeName,
        instructions: instructions.trim(),
        signed_off_by: null,
        signed_off_at: null,
      };

      const { error } = await supabase.from("food_safety_logs").insert({
        org_id: orgId,
        log_type: "equipment_training",
        log_date: getTodayDate(),
        location: selectedEq.name,
        status: "pending",
        readings,
        recorded_by: user?.id,
        recorded_by_name: user?.email,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["equipment-training-logs", orgId],
      });
      resetForm();
      Alert.alert("Saved", "Training record logged successfully.");
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  // ---------------------------------------------------------------------------
  // Mutation: Head chef sign-off
  // ---------------------------------------------------------------------------

  const signOffMutation = useMutation({
    mutationFn: async (logId: string) => {
      if (!orgId) throw new Error("No organisation selected");

      // Fetch the current log to get existing readings
      const { data: existing, error: fetchError } = await supabase
        .from("food_safety_logs")
        .select("*")
        .eq("id", logId)
        .single();
      if (fetchError) throw fetchError;
      if (!existing) throw new Error("Log not found");

      const currentReadings = (existing as any).readings || {};
      const updatedReadings = {
        ...currentReadings,
        signed_off_by: profile?.email || user?.email || "Head Chef",
        signed_off_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("food_safety_logs")
        .update({
          readings: updatedReadings,
          status: "pass",
        } as any)
        .eq("id", logId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["equipment-training-logs", orgId],
      });
      Alert.alert("Signed Off", "Training record has been signed off.");
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const resetForm = useCallback(() => {
    setSheetOpen(false);
    setSelectedEquipmentId("");
    setSelectedMemberId("");
    setInstructions("");
  }, []);

  const handleSave = () => {
    if (!selectedEquipmentId) {
      Alert.alert("Missing", "Please select equipment");
      return;
    }
    if (!selectedMemberId) {
      Alert.alert("Missing", "Please select a team member");
      return;
    }
    if (!instructions.trim()) {
      Alert.alert("Missing", "Please enter training instructions");
      return;
    }
    saveMutation.mutate();
  };

  const handleSignOff = (logId: string, traineeName: string) => {
    Alert.alert(
      "Sign Off Training",
      `Confirm that ${traineeName} has completed equipment training?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Off",
          style: "default",
          onPress: () => signOffMutation.mutate(logId),
        },
      ]
    );
  };

  const handleOpenManual = (url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "Could not open the manual URL")
    );
  };

  const isLoading = equipmentLoading || logsLoading;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Pending sign-offs banner */}
      {isHeadChef && pendingCount > 0 && (
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
            style={{ fontSize: 13, fontWeight: "600", color: colors.warning }}
          >
            Pending Sign-Offs
          </Text>
          <Text
            style={{ fontSize: 12, color: colors.warning, marginTop: 2 }}
          >
            {pendingCount} training record{pendingCount !== 1 ? "s" : ""}{" "}
            awaiting head chef sign-off.
          </Text>
        </View>
      )}

      {/* Equipment list */}
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
        ) : !equipmentGroups || equipmentGroups.length === 0 ? (
          <EmptyState
            icon={<Wrench size={48} color={colors.textMuted} />}
            title="No Equipment Found"
            description="Add equipment to your inventory first, then log training records here."
          />
        ) : (
          equipmentGroups.map((group) => {
            const { equipment: eq, trainingLogs: logs } = group;
            const isExpanded = expandedId === eq.id;
            const trainedCount = logs.filter(
              (l) => l.status === "pass" || l.readings?.signed_off_at
            ).length;
            const totalCount = logs.length;

            return (
              <Card key={eq.id} style={{ overflow: "hidden" }}>
                {/* Equipment header (tappable to expand) */}
                <Pressable
                  onPress={() => handleToggleExpand(eq.id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 14,
                    gap: 12,
                  }}
                >
                  {/* Icon */}
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: colors.accentBg,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Wrench size={20} color={colors.accent} />
                  </View>

                  {/* Equipment details */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "700",
                        color: colors.text,
                      }}
                      numberOfLines={1}
                    >
                      {eq.name}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 3,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.textSecondary,
                        }}
                        numberOfLines={1}
                      >
                        {eq.category}
                        {eq.location ? ` \u2022 ${eq.location}` : ""}
                      </Text>
                    </View>
                  </View>

                  {/* Badges + chevron */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {eq.condition && (
                      <Badge variant={getConditionColor(eq.condition)}>
                        {formatCondition(eq.condition)}
                      </Badge>
                    )}
                    {totalCount > 0 && (
                      <Badge
                        variant={
                          trainedCount === totalCount ? "success" : "secondary"
                        }
                      >
                        {trainedCount} trained
                      </Badge>
                    )}
                    {isExpanded ? (
                      <ChevronUp size={18} color={colors.textMuted} />
                    ) : (
                      <ChevronDown size={18} color={colors.textMuted} />
                    )}
                  </View>
                </Pressable>

                {/* Expanded body — training records */}
                {isExpanded && (
                  <CardContent style={{ paddingTop: 0, gap: 10 }}>
                    {/* View manual button */}
                    {eq.notes && eq.notes.startsWith("http") && (
                      <Pressable
                        onPress={() => handleOpenManual(eq.notes!)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          backgroundColor: colors.accentBg,
                          borderRadius: 10,
                          alignSelf: "flex-start",
                        }}
                      >
                        <FileText size={14} color={colors.accent} />
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: colors.accent,
                          }}
                        >
                          View Manual
                        </Text>
                      </Pressable>
                    )}

                    {logs.length === 0 ? (
                      <Text
                        style={{
                          fontSize: 13,
                          color: colors.textMuted,
                          fontStyle: "italic",
                          textAlign: "center",
                          paddingVertical: 12,
                        }}
                      >
                        No training records yet
                      </Text>
                    ) : (
                      logs.map((log) => {
                        const isSignedOff =
                          log.status === "pass" ||
                          !!log.readings?.signed_off_at;
                        const traineeName =
                          log.readings?.trainee_name || "Unknown";
                        const instructionsSummary =
                          log.readings?.instructions || "";

                        return (
                          <View
                            key={log.id}
                            style={{
                              backgroundColor: colors.surface,
                              borderRadius: 10,
                              padding: 12,
                              borderWidth: 1,
                              borderColor: isSignedOff
                                ? colors.border
                                : colors.warning
                                  ? colors.warning + "40"
                                  : colors.border,
                              gap: 6,
                            }}
                          >
                            {/* Trainee + date row */}
                            <View
                              style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 14,
                                  fontWeight: "600",
                                  color: colors.text,
                                  flex: 1,
                                }}
                                numberOfLines={1}
                              >
                                {traineeName}
                              </Text>
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: colors.textMuted,
                                  marginLeft: 8,
                                }}
                              >
                                {log.log_date
                                  ? formatDate(log.log_date)
                                  : log.created_at
                                    ? formatDate(log.created_at)
                                    : "\u2014"}
                              </Text>
                            </View>

                            {/* Instructions summary */}
                            {instructionsSummary ? (
                              <Text
                                style={{
                                  fontSize: 13,
                                  color: colors.textSecondary,
                                  lineHeight: 18,
                                }}
                                numberOfLines={3}
                              >
                                {instructionsSummary}
                              </Text>
                            ) : null}

                            {/* Sign-off status row */}
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginTop: 2,
                              }}
                            >
                              {isSignedOff ? (
                                <View
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  <CheckCircle2
                                    size={14}
                                    color={colors.success}
                                  />
                                  <Badge variant="success">
                                    Signed Off
                                  </Badge>
                                  {log.readings?.signed_off_at && (
                                    <Text
                                      style={{
                                        fontSize: 11,
                                        color: colors.textMuted,
                                      }}
                                    >
                                      {formatTimestamp(
                                        log.readings.signed_off_at
                                      )}
                                    </Text>
                                  )}
                                </View>
                              ) : (
                                <View
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  <Clock
                                    size={14}
                                    color={colors.warning}
                                  />
                                  <Badge variant="warning">
                                    Pending
                                  </Badge>
                                </View>
                              )}

                              {/* Sign-off button for head chef */}
                              {isHeadChef && !isSignedOff && (
                                <Button
                                  size="sm"
                                  onPress={() =>
                                    handleSignOff(log.id, traineeName)
                                  }
                                  disabled={signOffMutation.isPending}
                                  loading={signOffMutation.isPending}
                                >
                                  Sign Off
                                </Button>
                              )}
                            </View>

                            {/* Signed-off by info */}
                            {isSignedOff && log.readings?.signed_off_by && (
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: colors.textMuted,
                                  fontStyle: "italic",
                                }}
                              >
                                Signed off by {log.readings.signed_off_by}
                              </Text>
                            )}
                          </View>
                        );
                      })
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* FAB */}
      <FAB onPress={() => setSheetOpen(true)} />

      {/* Form Sheet — Add Training Record */}
      <FormSheet
        visible={sheetOpen}
        onClose={resetForm}
        onSave={handleSave}
        title="Log Equipment Training"
        saving={saveMutation.isPending}
      >
        {/* Equipment selector */}
        <Select
          label="Equipment"
          placeholder="Select equipment..."
          value={selectedEquipmentId}
          options={equipmentOptions}
          onValueChange={setSelectedEquipmentId}
        />

        {/* Team member selector */}
        <Select
          label="Team Member (Trainee)"
          placeholder="Select team member..."
          value={selectedMemberId}
          options={memberOptions}
          onValueChange={setSelectedMemberId}
        />

        {/* Instructions / notes */}
        <Input
          label="Training Instructions / Notes"
          value={instructions}
          onChangeText={setInstructions}
          placeholder="Describe what was covered in the training session..."
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          style={{ minHeight: 120, lineHeight: 22 }}
        />
      </FormSheet>
    </View>
  );
}
