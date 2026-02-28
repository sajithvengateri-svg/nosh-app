import { View, Text } from "react-native";
import { useTheme } from "../../../contexts/ThemeProvider";

interface PhaseHeaderProps {
  currentPhase: number;
  totalPhases: number;
  title: string;
  subtitle: string;
}

export function PhaseHeader({ currentPhase, totalPhases, title, subtitle }: PhaseHeaderProps) {
  const { colors } = useTheme();
  const progress = ((currentPhase + 1) / totalPhases) * 100;

  return (
    <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16 }}>
      {/* Phase dots */}
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 8 }}>
        {Array.from({ length: totalPhases }).map((_, i) => (
          <View
            key={i}
            style={{
              width: i === currentPhase ? 20 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i < currentPhase
                ? colors.success
                : i === currentPhase
                  ? colors.accent
                  : colors.border,
            }}
          />
        ))}
      </View>

      {/* Phase counter */}
      <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textMuted, textAlign: "center", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
        Step {currentPhase + 1} of {totalPhases}
      </Text>

      {/* Progress bar */}
      <View style={{ height: 3, borderRadius: 1.5, backgroundColor: colors.border, overflow: "hidden", marginBottom: 16 }}>
        <View style={{ height: 3, borderRadius: 1.5, width: `${progress}%` as any, backgroundColor: colors.accent }} />
      </View>

      {/* Title + subtitle */}
      <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text, textAlign: "center" }}>
        {title}
      </Text>
      <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: "center", marginTop: 4 }}>
        {subtitle}
      </Text>
    </View>
  );
}
