import { View, Platform, type ViewStyle, type StyleProp } from "react-native";
import { Glass } from "../constants/colors";

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  dark?: boolean;
  accent?: boolean;
}

export function GlassCard({
  children,
  style,
  dark,
  accent,
}: GlassCardProps) {
  const bg = dark
    ? Glass.surfaceDark
    : accent
      ? Glass.surfaceAccent
      : Glass.surface;

  const shadowStyle: any =
    Platform.OS === "web"
      ? { boxShadow: `0px 4px 12px ${Glass.shadowLight.color}` }
      : {
          shadowColor: Glass.shadowLight.color,
          shadowOffset: Glass.shadowLight.offset,
          shadowRadius: Glass.shadowLight.radius,
          shadowOpacity: 1,
        };

  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: Glass.borderLight,
          borderRadius: 16,
        },
        shadowStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
}
