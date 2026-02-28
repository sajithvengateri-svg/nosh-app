import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../contexts/ThemeProvider";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { lightTap } from "../../lib/haptics";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - 3);
  d.setHours(0, 0, 0, 0);
  return d;
}

interface PrepDayCarouselProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  weekStart: Date;
  onWeekChange: (newWeekStart: Date) => void;
}

export function PrepDayCarousel({ selectedDate, onSelectDate, weekStart, onWeekChange }: PrepDayCarouselProps) {
  const { colors } = useTheme();
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 2, paddingVertical: 4 }}>
      <Pressable
        onPress={() => { lightTap(); onWeekChange(addDays(weekStart, -7)); }}
        style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}
      >
        <ChevronLeft size={14} color={colors.textSecondary} strokeWidth={2} />
      </Pressable>

      <View style={{ flex: 1, flexDirection: "row" }}>
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, today);

          return (
            <Pressable
              key={day.toISOString()}
              onPress={() => { lightTap(); onSelectDate(day); }}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: 6,
                borderRadius: 12,
                backgroundColor: isSelected ? colors.accent : "transparent",
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "600", color: isSelected ? "#FFFFFF" : colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {DAY_NAMES[day.getDay()]}
              </Text>
              <Text style={{ fontSize: 18, fontWeight: "800", color: isSelected ? "#FFFFFF" : colors.text, marginTop: 2 }}>
                {day.getDate()}
              </Text>
              {isToday && (
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: isSelected ? "#FFFFFF" : colors.accent, marginTop: 2 }} />
              )}
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => { lightTap(); onWeekChange(addDays(weekStart, 7)); }}
        style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}
      >
        <ChevronRight size={14} color={colors.textSecondary} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

export { addDays, isSameDay, startOfWeek };
