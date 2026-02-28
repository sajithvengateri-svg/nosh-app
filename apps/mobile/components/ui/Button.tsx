import { Pressable, Text, ActivityIndicator, type ViewStyle, type TextStyle } from "react-native";
import { lightTap } from "../../lib/haptics";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "sm" | "default" | "lg";

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  default: { bg: "#6366F1", text: "#FFFFFF" },
  secondary: { bg: "#F3F4F6", text: "#374151" },
  outline: { bg: "transparent", text: "#374151", border: "#D1D5DB" },
  ghost: { bg: "transparent", text: "#374151" },
  destructive: { bg: "#DC2626", text: "#FFFFFF" },
};

const sizeStyles: Record<ButtonSize, { paddingH: number; paddingV: number; fontSize: number; radius: number }> = {
  sm: { paddingH: 12, paddingV: 8, fontSize: 13, radius: 8 },
  default: { paddingH: 20, paddingV: 12, fontSize: 15, radius: 12 },
  lg: { paddingH: 24, paddingV: 16, fontSize: 17, radius: 14 },
};

export function Button({
  children,
  onPress,
  variant = "default",
  size = "default",
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <Pressable
      onPress={() => {
        lightTap();
        onPress?.();
      }}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        backgroundColor: v.bg,
        borderWidth: v.border ? 1 : 0,
        borderColor: v.border,
        borderRadius: s.radius,
        paddingHorizontal: s.paddingH,
        paddingVertical: s.paddingV,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        flexDirection: "row" as const,
        opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
        ...style,
      })}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={v.text}
          style={{ marginRight: typeof children === "string" ? 8 : 0 }}
        />
      ) : null}
      {typeof children === "string" ? (
        <Text
          style={{
            color: v.text,
            fontSize: s.fontSize,
            fontWeight: "600",
            ...textStyle,
          }}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
