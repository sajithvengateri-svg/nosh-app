import { View, Text, Pressable, type ViewStyle } from "react-native";
import { type LucideIcon } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeProvider";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  backgroundColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function StatCard({
  label,
  value,
  icon: IconComponent,
  backgroundColor,
  onPress,
  style,
}: StatCardProps) {
  const { colors } = useTheme();
  const bg = backgroundColor || colors.surface;

  const content = (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: 16,
        padding: 16,
        ...style,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: "500" }}>
          {label}
        </Text>
        {IconComponent && (
          <IconComponent size={18} color={colors.textMuted} strokeWidth={1.5} />
        )}
      </View>
      <Text style={{ fontSize: 28, fontWeight: "800", color: colors.text }}>
        {value}
      </Text>
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }

  return content;
}
