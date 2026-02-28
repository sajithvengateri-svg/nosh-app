import { View, Text, type ViewStyle } from "react-native";

type BadgeVariant = "default" | "secondary" | "success" | "warning" | "destructive" | "outline";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; border?: string }> = {
  default: { bg: "#6366F1", text: "#FFFFFF" },
  secondary: { bg: "#F3F4F6", text: "#374151" },
  success: { bg: "#DCFCE7", text: "#166534" },
  warning: { bg: "#FEF3C7", text: "#92400E" },
  destructive: { bg: "#FEE2E2", text: "#991B1B" },
  outline: { bg: "transparent", text: "#374151", border: "#D1D5DB" },
};

export function Badge({ children, variant = "default", style }: BadgeProps) {
  const v = variantStyles[variant];

  return (
    <View
      style={{
        backgroundColor: v.bg,
        borderRadius: 9999,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: "flex-start",
        borderWidth: v.border ? 1 : 0,
        borderColor: v.border,
        ...style,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "600", color: v.text }}>
        {children}
      </Text>
    </View>
  );
}
