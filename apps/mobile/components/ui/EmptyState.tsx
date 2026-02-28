import { View, Text, type ViewStyle } from "react-native";
import { useTheme } from "../../contexts/ThemeProvider";
import { Button } from "./Button";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: string | ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
        ...style,
      }}
    >
      {icon && (
        typeof icon === "string"
          ? <Text style={{ fontSize: 48, marginBottom: 16 }}>{icon}</Text>
          : <View style={{ marginBottom: 16 }}>{icon}</View>
      )}
      <Text
        style={{
          fontSize: 18,
          fontWeight: "700",
          color: colors.text,
          marginBottom: 8,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      {description && (
        <Text
          style={{
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: "center",
            maxWidth: 280,
            marginBottom: actionLabel ? 24 : 0,
          }}
        >
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button onPress={onAction}>{actionLabel}</Button>
      )}
    </View>
  );
}
