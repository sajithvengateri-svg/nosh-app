import { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, Platform } from "react-native";
import { useTheme } from "../../contexts/ThemeProvider";
import { successNotification, errorNotification } from "../../lib/haptics";
import { X, ChefHat, CircleCheck, Info, AlertTriangle } from "lucide-react-native";

export interface ToastConfig {
  title: string;
  message?: string;
  type: "info" | "warning" | "success" | "error";
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

interface ToastProps extends ToastConfig {
  visible: boolean;
  onDismiss: () => void;
}

export function Toast({ visible, title, message, type, actionLabel, onAction, onDismiss, duration = 5000 }: ToastProps) {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const bgColors: Record<string, string> = {
    info: colors.accentBg,
    warning: colors.warningBg,
    success: colors.successBg,
    error: colors.destructiveBg,
  };

  const borderColors: Record<string, string> = {
    info: colors.accent,
    warning: colors.warning,
    success: colors.success,
    error: colors.destructive,
  };

  useEffect(() => {
    if (visible) {
      if (type === "success") successNotification();
      else if (type === "error") errorNotification();

      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        dismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -120, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss());
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: Platform.OS === "ios" ? 54 : 16,
        left: 16,
        right: 16,
        zIndex: 9999,
        transform: [{ translateY }],
        opacity,
      }}
    >
      <View
        style={{
          backgroundColor: bgColors[type],
          borderRadius: 14,
          borderWidth: 1,
          borderColor: borderColors[type] + "40",
          padding: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        {type === "error" && <ChefHat size={18} color={borderColors[type]} strokeWidth={2} />}
        {type === "success" && <CircleCheck size={18} color={borderColors[type]} strokeWidth={2} />}
        {type === "warning" && <AlertTriangle size={18} color={borderColors[type]} strokeWidth={2} />}
        {type === "info" && <Info size={18} color={borderColors[type]} strokeWidth={2} />}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
            {type === "error" ? "86'd" : title}
          </Text>
          {message && <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{message}</Text>}
        </View>
        {actionLabel && onAction && (
          <Pressable onPress={() => { onAction(); dismiss(); }} style={{ paddingHorizontal: 10, paddingVertical: 6, backgroundColor: borderColors[type], borderRadius: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#FFFFFF" }}>{actionLabel}</Text>
          </Pressable>
        )}
        <Pressable onPress={dismiss} hitSlop={8}>
          <X size={16} color={colors.textMuted} strokeWidth={1.5} />
        </Pressable>
      </View>
    </Animated.View>
  );
}
