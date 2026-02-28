import { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../../contexts/ThemeProvider";
import {
  useCleaningTasks,
  useCleaningMonthCompletions,
  isTaskDueOnDate,
} from "../../hooks/useCleaningSchedule";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react-native";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

const CELL_W = 32;
const TASK_COL_W = 140;

export function CleaningMonthlyGrid() {
  const { colors } = useTheme();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-based

  const { tasks, isLoading: tasksLoading } = useCleaningTasks();
  const { completions, isLoading: compLoading } = useCleaningMonthCompletions(year, month);

  const daysInMonth = getDaysInMonth(year, month);
  const todayDay = now.getFullYear() === year && now.getMonth() + 1 === month ? now.getDate() : -1;

  // Build completion lookup: schedule_id → Set<dayOfMonth>
  const completionsByTask = useMemo(() => {
    const map: Record<string, Set<number>> = {};
    completions.forEach((c) => {
      const d = new Date(c.completed_at).getDate();
      if (!map[c.schedule_id]) map[c.schedule_id] = new Set();
      map[c.schedule_id].add(d);
    });
    return map;
  }, [completions]);

  // Filter to active tasks, sorted
  const sortedTasks = useMemo(() => {
    return tasks.sort((a, b) => a.sort_order - b.sort_order);
  }, [tasks]);

  // Summary: count compliant days
  const complianceSummary = useMemo(() => {
    let compliantDays = 0;
    for (let day = 1; day <= Math.min(daysInMonth, todayDay > 0 ? todayDay : daysInMonth); day++) {
      const date = new Date(year, month - 1, day);
      if (date > now) break;
      const dueTasks = sortedTasks.filter((t) => isTaskDueOnDate(t, date));
      if (dueTasks.length === 0) { compliantDays++; continue; }
      const allDone = dueTasks.every((t) => completionsByTask[t.id]?.has(day));
      if (allDone) compliantDays++;
    }
    const totalDays = todayDay > 0 ? todayDay : daysInMonth;
    return { compliantDays, totalDays };
  }, [sortedTasks, completionsByTask, daysInMonth, todayDay, year, month]);

  const stepMonth = (dir: -1 | 1) => {
    let m = month + dir;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    // Don't go past current month
    if (y > now.getFullYear() || (y === now.getFullYear() && m > now.getMonth() + 1)) return;
    setMonth(m);
    setYear(y);
  };

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  if (tasksLoading || compLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 40 }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Month navigation */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, gap: 12 }}>
        <Pressable onPress={() => stepMonth(-1)} style={{ padding: 6 }}>
          <ChevronLeft size={20} color={colors.textSecondary} strokeWidth={2} />
        </Pressable>
        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
          {MONTH_NAMES[month - 1]} {year}
        </Text>
        <Pressable onPress={() => stepMonth(1)} style={{ padding: 6, opacity: isCurrentMonth ? 0.3 : 1 }} disabled={isCurrentMonth}>
          <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
        </Pressable>
      </View>

      {/* Compliance summary */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingBottom: 8, gap: 8 }}>
        <View style={{
          paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8,
          backgroundColor: complianceSummary.compliantDays === complianceSummary.totalDays ? colors.success + "15" : colors.warning + "15",
        }}>
          <Text style={{
            fontSize: 13, fontWeight: "700",
            color: complianceSummary.compliantDays === complianceSummary.totalDays ? colors.success : "#F59E0B",
          }}>
            {complianceSummary.compliantDays}/{complianceSummary.totalDays} days compliant
          </Text>
        </View>
      </View>

      {/* Grid */}
      <ScrollView style={{ flex: 1 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Header row — day numbers */}
            <View style={{ flexDirection: "row" }}>
              <View style={{ width: TASK_COL_W, paddingHorizontal: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.background }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textMuted }}>TASK</Text>
              </View>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const isToday = day === todayDay;
                return (
                  <View
                    key={day}
                    style={{
                      width: CELL_W, alignItems: "center", justifyContent: "center",
                      paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border,
                      backgroundColor: isToday ? colors.accent + "15" : colors.background,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: isToday ? "800" : "600", color: isToday ? colors.accent : colors.textMuted }}>
                      {day}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Task rows */}
            {sortedTasks.map((task, idx) => {
              const taskCompletions = completionsByTask[task.id] ?? new Set();
              return (
                <View key={task.id} style={{ flexDirection: "row", backgroundColor: idx % 2 === 0 ? colors.background : colors.surface + "40" }}>
                  {/* Task name (sticky feel via scroll) */}
                  <View style={{
                    width: TASK_COL_W, paddingHorizontal: 8, paddingVertical: 6,
                    justifyContent: "center", borderBottomWidth: 0.5, borderBottomColor: colors.border,
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: "500", color: colors.text }} numberOfLines={2}>
                      {task.task_name}
                    </Text>
                    <Text style={{ fontSize: 9, color: colors.textMuted }}>
                      {task.frequency}{task.shift ? ` · ${task.shift}` : ""}
                    </Text>
                  </View>

                  {/* Day cells */}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                    const date = new Date(year, month - 1, day);
                    const isFuture = date > now;
                    const isDue = isTaskDueOnDate(task, date);
                    const isCompleted = taskCompletions.has(day);
                    const isToday = day === todayDay;
                    const isMissed = isDue && !isCompleted && !isFuture;

                    let bgColor = "transparent";
                    let content = null;

                    if (isFuture) {
                      // Future — grey
                      bgColor = "transparent";
                    } else if (!isDue) {
                      // Not due — dash
                      bgColor = "transparent";
                      content = <Text style={{ fontSize: 9, color: colors.textMuted }}>—</Text>;
                    } else if (isCompleted) {
                      // Completed — green
                      bgColor = "#10B98118";
                      content = <Check size={12} color="#10B981" strokeWidth={2.5} />;
                    } else if (isMissed) {
                      // Missed — red
                      bgColor = "#EF444418";
                      content = <X size={12} color="#EF4444" strokeWidth={2} />;
                    }

                    return (
                      <View
                        key={day}
                        style={{
                          width: CELL_W, height: 32, alignItems: "center", justifyContent: "center",
                          backgroundColor: isToday ? colors.accent + "08" : bgColor,
                          borderBottomWidth: 0.5, borderBottomColor: colors.border,
                          borderLeftWidth: isToday ? 1 : 0, borderLeftColor: colors.accent + "30",
                          borderRightWidth: isToday ? 1 : 0, borderRightColor: colors.accent + "30",
                        }}
                      >
                        {content}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}
