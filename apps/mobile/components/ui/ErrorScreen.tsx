import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../contexts/ThemeProvider";

interface ErrorScreenProps {
  emoji?: string;
  title: string;
  subtitle: string;
  onRetry?: () => void;
  onGoHome?: () => void;
}

export function ErrorScreen({
  emoji = "🍳",
  title,
  subtitle,
  onRetry,
  onGoHome,
}: ErrorScreenProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
        backgroundColor: colors.background,
      }}
    >
      <Text style={{ fontSize: 64, marginBottom: 20 }}>{emoji}</Text>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          color: colors.text,
          marginBottom: 8,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 15,
          color: colors.textSecondary,
          textAlign: "center",
          marginBottom: 32,
          maxWidth: 280,
          lineHeight: 22,
        }}
      >
        {subtitle}
      </Text>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {onRetry && (
          <Pressable
            onPress={onRetry}
            style={{
              backgroundColor: colors.accent,
              paddingHorizontal: 28,
              paddingVertical: 14,
              borderRadius: 14,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 15 }}>
              Try Again
            </Text>
          </Pressable>
        )}
        {onGoHome && (
          <Pressable
            onPress={onGoHome}
            style={{
              backgroundColor: colors.surface,
              paddingHorizontal: 28,
              paddingVertical: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontWeight: "600",
                fontSize: 15,
              }}
            >
              Go Home
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
