import { View, Text, type ViewStyle } from "react-native";
import { Image } from "expo-image";

type AvatarSize = "sm" | "default" | "lg" | "xl";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: AvatarSize;
  style?: ViewStyle;
}

const sizes: Record<AvatarSize, { dimension: number; fontSize: number }> = {
  sm: { dimension: 32, fontSize: 12 },
  default: { dimension: 40, fontSize: 14 },
  lg: { dimension: 56, fontSize: 20 },
  xl: { dimension: 72, fontSize: 28 },
};

function getInitials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const COLORS = ["#6366F1", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EF4444"];

function getColor(name?: string): string {
  if (!name) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function Avatar({ src, name, size = "default", style }: AvatarProps) {
  const s = sizes[size];

  if (src) {
    return (
      <Image
        source={{ uri: src }}
        style={[
          {
            width: s.dimension,
            height: s.dimension,
            borderRadius: s.dimension / 2,
          },
          style as any,
        ]}
        contentFit="cover"
        transition={200}
      />
    );
  }

  return (
    <View
      style={{
        width: s.dimension,
        height: s.dimension,
        borderRadius: s.dimension / 2,
        backgroundColor: getColor(name),
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: s.fontSize,
          fontWeight: "700",
        }}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
}
