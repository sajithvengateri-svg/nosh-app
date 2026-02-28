import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../contexts/ThemeProvider";
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react-native";
import { type ServiceType, useServiceDates, isOverdue } from "../../hooks/useServiceLogs";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface Props {
  serviceType: ServiceType;
}

export function ServiceYearlyCalendar({ serviceType }: Props) {
  const { colors } = useTheme();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());

  const { serviceDates, nextDueDate } = useServiceDates(serviceType, year);

  // Build month → has service map
  const serviceMonths = new Set<number>();
  serviceDates.forEach((d) => {
    if (d.getFullYear() === year) serviceMonths.add(d.getMonth());
  });

  // Next due month (if in this year)
  const dueMonth = nextDueDate && nextDueDate.getFullYear() === year ? nextDueDate.getMonth() : -1;
  const overdue = isOverdue(nextDueDate);
  const isCurrentYear = year === now.getFullYear();

  return (
    <View style={{ gap: 12 }}>
      {/* Year nav */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <Pressable onPress={() => setYear(year - 1)} hitSlop={8} style={{ padding: 4 }}>
          <ChevronLeft size={18} color={colors.textSecondary} strokeWidth={2} />
        </Pressable>
        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>{year}</Text>
        <Pressable
          onPress={() => setYear(year + 1)}
          hitSlop={8}
          disabled={year >= now.getFullYear() + 1}
          style={{ padding: 4, opacity: year >= now.getFullYear() + 1 ? 0.3 : 1 }}
        >
          <ChevronRight size={18} color={colors.textSecondary} strokeWidth={2} />
        </Pressable>
      </View>

      {/* Next due badge */}
      {nextDueDate && (
        <View style={{
          flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
          paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, alignSelf: "center",
          backgroundColor: overdue ? colors.destructive + "12" : colors.accent + "12",
        }}>
          {overdue && <AlertTriangle size={12} color={colors.destructive} strokeWidth={2} />}
          <Text style={{
            fontSize: 12, fontWeight: "600",
            color: overdue ? colors.destructive : colors.accent,
          }}>
            {overdue ? "Overdue — " : "Next due: "}
            {nextDueDate.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
          </Text>
        </View>
      )}

      {/* 12-month grid (3 × 4) */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
        {MONTHS.map((name, idx) => {
          const hasService = serviceMonths.has(idx);
          const isDue = idx === dueMonth;
          const isFuture = isCurrentYear && idx > now.getMonth();
          const isPast = isCurrentYear ? idx < now.getMonth() : year < now.getFullYear();
          const isCurrent = isCurrentYear && idx === now.getMonth();

          let bg = colors.surface;
          let borderCol = "transparent";
          let textColor = colors.textMuted;

          if (hasService) {
            bg = colors.success + "12";
            borderCol = colors.success + "30";
            textColor = colors.success;
          }
          if (isDue && !hasService) {
            bg = overdue ? colors.destructive + "10" : colors.warning + "10";
            borderCol = overdue ? colors.destructive + "30" : colors.warning + "30";
            textColor = overdue ? colors.destructive : colors.warning;
          }
          if (isCurrent && !hasService && !isDue) {
            borderCol = colors.accent + "40";
          }

          return (
            <View
              key={idx}
              style={{
                width: "22%",
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: bg,
                borderWidth: 1.5,
                borderColor: borderCol,
                alignItems: "center",
                opacity: isFuture ? 0.4 : 1,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: textColor }}>{name}</Text>
              {hasService && (
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success, marginTop: 4 }} />
              )}
              {isDue && !hasService && (
                <Text style={{ fontSize: 9, fontWeight: "700", color: textColor, marginTop: 2 }}>DUE</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
