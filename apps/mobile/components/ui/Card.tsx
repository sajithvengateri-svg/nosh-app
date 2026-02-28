import { View, Text, type ViewStyle } from "react-native";
import { useTheme } from "../../contexts/ThemeProvider";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface CardTitleProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface CardDescriptionProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </View>
  );
}

export function CardHeader({ children, style }: CardHeaderProps) {
  return (
    <View style={{ padding: 20, paddingBottom: 8, ...style }}>
      {children}
    </View>
  );
}

export function CardContent({ children, style }: CardContentProps) {
  return (
    <View style={{ padding: 20, paddingTop: 0, ...style }}>
      {children}
    </View>
  );
}

export function CardTitle({ children, style }: CardTitleProps) {
  const { colors } = useTheme();
  return (
    <Text
      style={{
        fontSize: 18,
        fontWeight: "700",
        color: colors.text,
        ...style,
      }}
    >
      {children}
    </Text>
  );
}

export function CardDescription({ children, style }: CardDescriptionProps) {
  const { colors } = useTheme();
  return (
    <Text
      style={{
        fontSize: 14,
        color: colors.textMuted,
        marginTop: 4,
        ...style,
      }}
    >
      {children}
    </Text>
  );
}
