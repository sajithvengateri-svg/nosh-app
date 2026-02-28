import { type LucideIcon } from "lucide-react-native";
import Constants from "expo-constants";
import { useTheme } from "../../contexts/ThemeProvider";
import { isHomeCook } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";

const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;
const IS_HOMECHEF = isHomeCook(APP_VARIANT);

interface IconProps {
  icon: LucideIcon;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ icon: LucideComponent, size = 22, color, strokeWidth }: IconProps) {
  const { colors } = useTheme();
  const resolvedColor = color || colors.text;
  const resolvedStroke = strokeWidth ?? (IS_HOMECHEF ? 2 : 1.5);

  return (
    <LucideComponent
      size={size}
      color={resolvedColor}
      strokeWidth={resolvedStroke}
    />
  );
}
