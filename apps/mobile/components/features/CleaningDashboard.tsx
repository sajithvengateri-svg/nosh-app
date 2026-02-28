import { useState, useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../../contexts/ThemeProvider";
import { useAuth } from "../../contexts/AuthProvider";
import { Card, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { ImagePicker } from "../ui/ImagePicker";
import { useUploadSafetyPhoto } from "../../hooks/useFoodSafety";
import {
  useCleaningTasks,
  useCleaningCompletions,
  useAutoTickSources,
  useCompleteCleaningTask,
  useSignOffCleaning,
  useSeedCleaningTasks,
  isTaskDueOnDate,
  getShiftLabel,
  getShiftTime,
  type Shift,
  type CleaningTask,
} from "../../hooks/useCleaningSchedule";
import {
  Check,
  CheckCircle2,
  Camera,
  Clock,
  Sparkles,
  ShieldCheck,
  Sunrise,
  Sun,
  Moon,
  CircleDot,
  AlertTriangle,
} from "lucide-react-native";

const SHIFT_ICONS: Record<Shift, any> = {
  opening: Sunrise,
  midday: Sun,
  closing: Moon,
};

export function CleaningDashboard() {
  const { colors } = useTheme();
  const { user, isHeadChef, isDevBypass } = useAuth();
  const canSignOff = isHeadChef || isDevBypass;

  const [shift, setShift] = useState<Shift>(() => {
    const h = new Date().getHours();
    if (h < 14) return "opening";
    if (h < 18) return "midday";
    return "closing";
  });

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const { tasks, isLoading: tasksLoading, refetch: refetchTasks } = useCleaningTasks();
  const { completions, isLoading: compLoading, refetch: refetchComp } = useCleaningCompletions(todayStr);
  const { activeSources } = useAutoTickSources(todayStr);
  const completeTask = useCompleteCleaningTask();
  const signOff = useSignOffCleaning();
  const seedTasks = useSeedCleaningTasks();
  const uploadPhoto = useUploadSafetyPhoto();

  // Filter tasks for today + selected shift
  const shiftTasks = useMemo(() => {
    return tasks
      .filter((t) => t.shift === shift && isTaskDueOnDate(t, today))
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [tasks, shift, today]);

  // Completion lookup: schedule_id → completion
  const completionMap = useMemo(() => {
    const map: Record<string, any> = {};
    completions.forEach((c) => { map[c.schedule_id] = c; });
    return map;
  }, [completions]);

  // Auto-tick: tasks with auto_tick_source that match today's activity
  const autoTickedIds = useMemo(() => {
    const ids = new Set<string>();
    shiftTasks.forEach((t) => {
      if (t.auto_tick_source && activeSources.has(t.auto_tick_source)) {
        ids.add(t.id);
      }
    });
    return ids;
  }, [shiftTasks, activeSources]);

  // Split into completed vs outstanding
  const { completedTasks, outstandingTasks } = useMemo(() => {
    const completed: (CleaningTask & { autoTicked: boolean })[] = [];
    const outstanding: CleaningTask[] = [];

    shiftTasks.forEach((t) => {
      const isCompleted = !!completionMap[t.id];
      const isAutoTicked = autoTickedIds.has(t.id) && !isCompleted;

      if (isCompleted || isAutoTicked) {
        completed.push({ ...t, autoTicked: isAutoTicked });
      } else {
        outstanding.push(t);
      }
    });

    return { completedTasks: completed, outstandingTasks: outstanding };
  }, [shiftTasks, completionMap, autoTickedIds]);

  const totalCount = shiftTasks.length;
  const doneCount = completedTasks.length;
  const allDone = totalCount > 0 && doneCount === totalCount;

  // Auto-complete auto-ticked tasks that aren't saved yet
  const handleAutoComplete = async () => {
    for (const t of completedTasks) {
      if (t.autoTicked && !completionMap[t.id]) {
        await completeTask.mutateAsync({ scheduleId: t.id, isAuto: true, notes: "Auto-completed from activity" });
      }
    }
    await refetchComp();
  };

  // Complete a single task
  const handleComplete = async (task: CleaningTask, photoUrl?: string) => {
    try {
      await completeTask.mutateAsync({
        scheduleId: task.id,
        photoUrl,
        notes: undefined,
        isAuto: false,
      });
      await refetchComp();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  // Manager sign-off
  const handleSignOff = async () => {
    const unsignedIds = completions
      .filter((c) => !c.signed_off_by)
      .map((c) => c.id);
    if (unsignedIds.length === 0) {
      Alert.alert("Nothing to Sign Off", "All completed tasks are already signed off");
      return;
    }
    try {
      await signOff.mutateAsync(unsignedIds);
      Alert.alert("Signed Off", `${unsignedIds.length} task${unsignedIds.length > 1 ? "s" : ""} signed off`);
      await refetchComp();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const refetchAll = async () => {
    await Promise.all([refetchTasks(), refetchComp()]);
  };

  const isLoading = tasksLoading || compLoading;

  // Auto-complete any pending auto-ticks (hook must be before early returns)
  const autoCompleteRunning = useRef(false);
  useEffect(() => {
    if (isLoading || tasks.length === 0) return;
    const hasPending = completedTasks.some((t) => t.autoTicked && !completionMap[t.id]);
    if (hasPending && !autoCompleteRunning.current) {
      autoCompleteRunning.current = true;
      handleAutoComplete().finally(() => { autoCompleteRunning.current = false; });
    }
  }, [completedTasks, completionMap, isLoading, tasks.length]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 40 }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (tasks.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 40 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 8 }}>No Cleaning Tasks</Text>
        <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: "center", marginBottom: 16 }}>
          Set up your cleaning schedule with default tasks
        </Text>
        <Pressable
          onPress={() => seedTasks.mutate()}
          style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.accent }}
        >
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>
            {seedTasks.isPending ? "Loading..." : "Load Default Tasks"}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Shift tabs */}
      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
        {(["opening", "midday", "closing"] as Shift[]).map((s) => {
          const active = shift === s;
          const Icon = SHIFT_ICONS[s];
          return (
            <Pressable
              key={s}
              onPress={() => setShift(s)}
              style={{
                flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                paddingVertical: 10, borderRadius: 12,
                backgroundColor: active ? colors.accent : colors.surface,
              }}
            >
              <Icon size={14} color={active ? "#FFFFFF" : colors.textSecondary} strokeWidth={2} />
              <Text style={{ fontSize: 13, fontWeight: "700", color: active ? "#FFFFFF" : colors.textSecondary }}>
                {getShiftLabel(s)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Progress bar */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            {allDone ? (
              <CheckCircle2 size={16} color={colors.success} strokeWidth={2} />
            ) : (
              <Clock size={16} color={colors.textMuted} strokeWidth={1.5} />
            )}
            <Text style={{ fontSize: 14, fontWeight: "700", color: allDone ? colors.success : colors.text }}>
              {doneCount}/{totalCount} completed
            </Text>
          </View>
          {autoTickedIds.size > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Sparkles size={12} color={colors.accent} strokeWidth={2} />
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.accent }}>
                {autoTickedIds.size} auto
              </Text>
            </View>
          )}
        </View>
        {/* Progress bar visual */}
        <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.surface, overflow: "hidden" }}>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: allDone ? colors.success : colors.accent, width: totalCount > 0 ? `${(doneCount / totalCount) * 100}%` : "0%" }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetchAll} />}
      >
        {/* Completed tasks */}
        {completedTasks.length > 0 && (
          <>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
              Completed
            </Text>
            {completedTasks.map((task) => {
              const comp = completionMap[task.id];
              return (
                <View
                  key={task.id}
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 10,
                    paddingVertical: 8, paddingHorizontal: 12, marginBottom: 4,
                    borderRadius: 10, backgroundColor: colors.success + "08",
                  }}
                >
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.success + "20", justifyContent: "center", alignItems: "center" }}>
                    <Check size={14} color={colors.success} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, color: colors.textSecondary, textDecorationLine: "line-through" }}>
                      {task.task_name}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      {task.autoTicked ? "Auto-completed" : comp ? (comp.completed_by?.split("@")[0] ?? "") : ""}
                      {comp?.signed_off_by ? " · Signed off" : ""}
                    </Text>
                  </View>
                  {task.autoTicked && (
                    <Sparkles size={14} color={colors.accent} strokeWidth={1.5} />
                  )}
                </View>
              );
            })}
          </>
        )}

        {/* Outstanding tasks */}
        {outstandingTasks.length > 0 && (
          <>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 12, marginBottom: 6 }}>
              Needs Attention
            </Text>
            {outstandingTasks.map((task) => (
              <Card key={task.id} style={{ marginBottom: 6, borderWidth: 1, borderColor: colors.border }}>
                <CardContent style={{ paddingTop: 10, paddingBottom: 10 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Pressable
                      onPress={() => handleComplete(task)}
                      style={{
                        width: 28, height: 28, borderRadius: 14,
                        borderWidth: 2, borderColor: colors.border,
                        justifyContent: "center", alignItems: "center",
                      }}
                    >
                      <CircleDot size={14} color={colors.textMuted} strokeWidth={1.5} />
                    </Pressable>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                        {task.task_name}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>
                        {task.area}{task.scheduled_time ? ` · ${task.scheduled_time}` : ""}{task.frequency !== "daily" ? ` · ${task.frequency}` : ""}
                      </Text>
                    </View>
                    {task.sanitiser_required && (
                      <Badge variant="secondary" style={{ marginRight: 4 }}>PPM</Badge>
                    )}
                    <ImagePicker
                      onImageSelected={async (b64) => {
                        const url = await uploadPhoto.mutateAsync(b64);
                        handleComplete(task, url);
                      }}
                      cameraOnly
                      compact
                      renderButton={({ onPress, loading }) => (
                        <Pressable onPress={onPress} disabled={loading} style={{ padding: 6 }}>
                          <Camera size={18} color={colors.accent} strokeWidth={1.5} />
                        </Pressable>
                      )}
                    />
                  </View>
                  {task.method && (
                    <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4, marginLeft: 38 }}>
                      {task.method}
                    </Text>
                  )}
                </CardContent>
              </Card>
            ))}
          </>
        )}

        {/* All done message */}
        {allDone && totalCount > 0 && (
          <View style={{ alignItems: "center", paddingVertical: 20 }}>
            <CheckCircle2 size={40} color={colors.success} strokeWidth={1.5} />
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.success, marginTop: 8 }}>
              All {getShiftLabel(shift)} Tasks Complete
            </Text>
          </View>
        )}

        {totalCount === 0 && (
          <View style={{ alignItems: "center", paddingVertical: 30 }}>
            <Text style={{ fontSize: 14, color: colors.textMuted }}>No tasks for this shift today</Text>
          </View>
        )}

        {/* Manager sign-off button */}
        {canSignOff && doneCount > 0 && (
          <Pressable
            onPress={handleSignOff}
            disabled={signOff.isPending}
            style={{
              flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
              paddingVertical: 14, borderRadius: 12, backgroundColor: colors.success,
              opacity: signOff.isPending ? 0.6 : 1, marginTop: 16,
            }}
          >
            {signOff.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <ShieldCheck size={18} color="#FFFFFF" strokeWidth={2} />
            )}
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>
              Sign Off {getShiftLabel(shift)}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
