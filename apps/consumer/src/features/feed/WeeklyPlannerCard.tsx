import { View, Text, Pressable, StyleSheet } from "react-native";
import { CalendarDays, Plus, ChevronRight } from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { lightTap } from "../../lib/haptics";

export interface WeeklyPlannerData {
  id: string;
  week_label: string;
  days: {
    day: string;
    date: string;
    recipe?: string;
    isToday?: boolean;
  }[];
}

export function WeeklyPlannerCard({ data, onOpenOverlay }: { data: WeeklyPlannerData; onOpenOverlay?: (key: string) => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <CalendarDays size={18} color={Colors.text.primary} strokeWidth={1.5} />
        <Text style={styles.title}>{data.week_label}</Text>
        <Pressable
          onPress={() => { lightTap(); onOpenOverlay?.("meal_plan"); }}
          style={styles.editPill}
        >
          <Text style={styles.editText}>Edit</Text>
          <ChevronRight size={14} color={Colors.text.secondary} strokeWidth={1.5} />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {data.days.map((day, i) => (
          <View key={i} style={[styles.dayRow, day.isToday && styles.todayRow]}>
            <View style={styles.dayLabel}>
              <Text style={[styles.dayText, day.isToday && styles.todayText]}>{day.day}</Text>
              <Text style={styles.dateText}>{day.date}</Text>
            </View>
            {day.recipe ? (
              <Text style={styles.recipeText} numberOfLines={1}>{day.recipe}</Text>
            ) : (
              <View style={styles.emptySlot}>
                <Plus size={14} color={Colors.text.muted} strokeWidth={1.5} />
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 18,
    shadowColor: "rgba(217, 72, 120, 0.08)",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    shadowOpacity: 1,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  editPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 10,
    gap: 2,
  },
  editText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: "500",
  },
  grid: {
    gap: 2,
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  todayRow: {
    backgroundColor: "rgba(217, 72, 120, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(217, 72, 120, 0.12)",
  },
  dayLabel: {
    width: 56,
  },
  dayText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.secondary,
  },
  todayText: {
    color: Colors.primary,
    fontWeight: "700",
  },
  dateText: {
    fontSize: 10,
    color: Colors.text.muted,
  },
  recipeText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: "500",
  },
  emptySlot: {
    flex: 1,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.divider,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
});
