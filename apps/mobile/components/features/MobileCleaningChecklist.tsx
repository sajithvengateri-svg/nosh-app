import { useState, useMemo } from "react";
import { View, Text, ScrollView, Pressable, Alert, RefreshControl, ActivityIndicator } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useOrg } from "../../contexts/OrgProvider";
import { useAuth } from "../../contexts/AuthProvider";
import { useTheme } from "../../contexts/ThemeProvider";
import { Badge } from "../ui/Badge";
import { Input } from "../ui/Input";
import { ImagePicker } from "../ui/ImagePicker";
import { AuditBadge } from "../ui/AuditBadge";
import { EmptyState } from "../ui/EmptyState";
import { SkeletonCard } from "../ui/Skeleton";
import { useUploadSafetyPhoto } from "../../hooks/useFoodSafety";
import { CheckCircle2, Camera, Droplets, ShieldCheck, XCircle } from "lucide-react-native";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getTodayDay(): string {
  return DAYS[new Date().getDay()];
}

function isTaskDueToday(frequency: string): boolean {
  if (frequency === "daily") return true;
  if (frequency === "weekly") return true; // Show weekly on all days, complete once
  if (frequency === "monthly") return new Date().getDate() === 1; // First of month
  return true;
}

export function MobileCleaningChecklist() {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();
  const uploadPhoto = useUploadSafetyPhoto();

  const [ppmInput, setPpmInput] = useState<Record<string, string>>({});
  const [photoBase64, setPhotoBase64] = useState<Record<string, string>>({});

  // Fetch schedules
  const { data: schedules, isLoading: loadingSchedules } = useQuery<any[]>({
    queryKey: ["cleaning-schedules", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("bcc_cleaning_schedules")
        .select("*")
        .eq("org_id", orgId)
        .eq("is_active", true)
        .order("area");
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  // Fetch today's completions
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { data: completions, isLoading: loadingCompletions, refetch, isRefetching } = useQuery<any[]>({
    queryKey: ["cleaning-completions-today", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("bcc_cleaning_completions")
        .select("*")
        .eq("org_id", orgId)
        .gte("completed_at", todayStart.toISOString());
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  // Today's tasks
  const todayTasks = useMemo(() => {
    if (!schedules) return [];
    return schedules.filter((s: any) => isTaskDueToday(s.frequency));
  }, [schedules]);

  const completedIds = useMemo(() => {
    const set = new Set<string>();
    completions?.forEach((c: any) => set.add(c.schedule_id));
    return set;
  }, [completions]);

  const doneCount = todayTasks.filter((t: any) => completedIds.has(t.id)).length;
  const totalCount = todayTasks.length;
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

  const [verificationResults, setVerificationResults] = useState<Record<string, { status: string; confidence: number; notes: string } | null>>({});
  const [verifying, setVerifying] = useState<Record<string, boolean>>({});

  // Complete task mutation
  const completeMutation = useMutation({
    mutationFn: async (task: any) => {
      if (!orgId) throw new Error("No org");

      let photoUrl: string | null = null;
      const b64 = photoBase64[task.id];
      if (b64) photoUrl = await uploadPhoto.mutateAsync(b64);

      const ppm = ppmInput[task.id];

      const { error } = await supabase.from("bcc_cleaning_completions").insert({
        schedule_id: task.id,
        org_id: orgId,
        completed_by: user?.email,
        sanitiser_concentration_ppm: ppm ? parseFloat(ppm) : null,
        photo_url: photoUrl,
        signed_off_by: user?.email,
        signed_off_at: new Date().toISOString(),
      });
      if (error) throw error;

      // AI verification if photo provided and task has a reference image
      if (photoUrl && task.reference_photo_url) {
        setVerifying((prev) => ({ ...prev, [task.id]: true }));
        try {
          const { data: verifyData } = await supabase.functions.invoke("verify-cleaning", {
            body: {
              referenceImageUrl: task.reference_photo_url,
              verificationImageUrl: photoUrl,
              areaName: task.area || task.task_name,
            },
          });
          if (verifyData) {
            setVerificationResults((prev) => ({ ...prev, [task.id]: verifyData }));
          }
        } catch {
          // Non-critical — verification is optional
        } finally {
          setVerifying((prev) => ({ ...prev, [task.id]: false }));
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cleaning-completions-today", orgId] });
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const handleComplete = (task: any) => {
    if (task.sanitiser_required && !ppmInput[task.id]?.trim()) {
      Alert.alert("PPM Required", "Enter sanitiser concentration before completing this task.");
      return;
    }
    completeMutation.mutate(task);
  };

  const isLoading = loadingSchedules || loadingCompletions;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Progress bar */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>Today's Cleaning</Text>
          <Badge variant={doneCount === totalCount && totalCount > 0 ? "success" : "default"}>
            {doneCount}/{totalCount}
          </Badge>
        </View>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: "hidden" }}>
          <View style={{ height: 6, borderRadius: 3, width: `${progress}%` as any, backgroundColor: doneCount === totalCount && totalCount > 0 ? colors.success : "#FFD700" }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {isLoading ? (
          <View style={{ gap: 10 }}><SkeletonCard /><SkeletonCard /><SkeletonCard /></View>
        ) : todayTasks.length === 0 ? (
          <EmptyState icon="✨" title="All Clear" description="No cleaning tasks scheduled for today." />
        ) : (
          todayTasks.map((task: any) => {
            const isDone = completedIds.has(task.id);
            const completion = completions?.find((c: any) => c.schedule_id === task.id);

            return (
              <View
                key={task.id}
                style={{
                  backgroundColor: isDone ? colors.successBg : colors.card,
                  borderRadius: 14,
                  padding: 14,
                  borderWidth: 2,
                  borderColor: isDone ? colors.success : colors.border,
                  gap: 8,
                  opacity: isDone ? 0.85 : 1,
                }}
              >
                {/* Header row */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: isDone ? colors.success : colors.text }}>{task.task_name}</Text>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      <Badge variant="outline">{task.area}</Badge>
                      <Badge variant="secondary">{task.frequency}</Badge>
                    </View>
                  </View>
                  {isDone && <CheckCircle2 size={24} color={colors.success} fill={colors.success} />}
                </View>

                {/* Method */}
                {task.method && !isDone && (
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>{task.method}</Text>
                )}

                {/* PPM input for sanitiser */}
                {task.sanitiser_required && !isDone && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.surface, borderRadius: 10, padding: 10 }}>
                    <Droplets size={16} color={colors.accent} />
                    <Input
                      placeholder="Sanitiser PPM"
                      value={ppmInput[task.id] || ""}
                      onChangeText={(v) => setPpmInput((prev) => ({ ...prev, [task.id]: v }))}
                      keyboardType="decimal-pad"
                      style={{ flex: 1, marginBottom: 0 }}
                    />
                  </View>
                )}

                {/* Photo button */}
                {!isDone && (
                  <ImagePicker
                    onImageSelected={(b64) => setPhotoBase64((prev) => ({ ...prev, [task.id]: b64 }))}
                    buttonText={photoBase64[task.id] ? "Photo Taken ✓" : "Take Verification Photo"}
                    showPreview={false}
                  />
                )}

                {/* Complete button */}
                {!isDone && (
                  <Pressable
                    onPress={() => handleComplete(task)}
                    disabled={completeMutation.isPending}
                    style={{
                      backgroundColor: colors.success,
                      borderRadius: 10,
                      paddingVertical: 12,
                      alignItems: "center",
                      minHeight: 44,
                      justifyContent: "center",
                      opacity: completeMutation.isPending ? 0.6 : 1,
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>
                      {completeMutation.isPending ? "Saving..." : "Mark Complete"}
                    </Text>
                  </Pressable>
                )}

                {/* Completion audit */}
                {isDone && completion && (
                  <AuditBadge signedBy={completion.completed_by || "Unknown"} signedAt={completion.completed_at} size="sm" />
                )}

                {/* AI Verification Result */}
                {verifying[task.id] && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 }}>
                    <ActivityIndicator size="small" color={colors.accent} />
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>AI verifying cleanliness...</Text>
                  </View>
                )}
                {verificationResults[task.id] && (
                  <View style={{
                    flexDirection: "row", alignItems: "center", gap: 8,
                    paddingVertical: 8, paddingHorizontal: 10, marginTop: 6,
                    backgroundColor: verificationResults[task.id]!.status === "approved" ? colors.success + "12" : colors.destructive + "12",
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: verificationResults[task.id]!.status === "approved" ? colors.success + "30" : colors.destructive + "30",
                  }}>
                    {verificationResults[task.id]!.status === "approved" ? (
                      <ShieldCheck size={16} color={colors.success} strokeWidth={1.5} />
                    ) : (
                      <XCircle size={16} color={colors.destructive} strokeWidth={1.5} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontSize: 12, fontWeight: "700",
                        color: verificationResults[task.id]!.status === "approved" ? colors.success : colors.destructive,
                      }}>
                        AI: {verificationResults[task.id]!.status === "approved" ? "Approved" : "Needs Attention"} ({verificationResults[task.id]!.confidence}% confidence)
                      </Text>
                      {verificationResults[task.id]!.notes && (
                        <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                          {verificationResults[task.id]!.notes}
                        </Text>
                      )}
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
