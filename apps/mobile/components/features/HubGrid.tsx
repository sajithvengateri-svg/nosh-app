import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthProvider";
import { useTheme } from "../../contexts/ThemeProvider";
import { ChevronRight, type LucideIcon } from "lucide-react-native";

export interface HubItem {
  icon: LucideIcon;
  label: string;
  route: string;
  badge?: string | number;
  module?: string;
}

interface HubGridProps {
  items: HubItem[];
  columns?: 2 | 3;
  viewMode?: "tiles" | "list" | "strip";
}

export function HubGrid({ items, columns = 3, viewMode = "tiles" }: HubGridProps) {
  const router = useRouter();
  const { canView } = useAuth();
  const { colors } = useTheme();

  const visible = items.filter((item) => !item.module || canView(item.module));

  if (visible.length === 0) return null;

  if (viewMode === "strip") {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingVertical: 8 }}
      >
        {visible.map((item) => (
          <Pressable
            key={item.route}
            onPress={() => router.push(item.route as any)}
            style={({ pressed }) => ({
              backgroundColor: pressed ? colors.accentBg : colors.surface,
              borderRadius: 14,
              padding: 12,
              alignItems: "center",
              width: 80,
              gap: 4,
            })}
          >
            <item.icon size={24} color={colors.textSecondary} strokeWidth={1.5} />
            <Text style={{ fontSize: 11, fontWeight: "600", color: colors.text, textAlign: "center" }}>{item.label}</Text>
            {item.badge != null && (
              <View style={{ backgroundColor: colors.accentBg, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 }}>
                <Text style={{ fontSize: 9, fontWeight: "700", color: colors.accent }}>{item.badge}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>
    );
  }

  if (viewMode === "list") {
    return (
      <View style={{ marginHorizontal: 16, borderRadius: 16, overflow: "hidden", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}>
        {visible.map((item, i) => (
          <Pressable
            key={item.route}
            onPress={() => router.push(item.route as any)}
            style={({ pressed }) => ({
              flexDirection: "row", alignItems: "center",
              paddingVertical: 14, paddingHorizontal: 16,
              backgroundColor: pressed ? colors.surface : "transparent",
              borderBottomWidth: i < visible.length - 1 ? 1 : 0,
              borderBottomColor: colors.cardBorder,
            })}
          >
            <View style={{ marginRight: 14 }}>
              <item.icon size={20} color={colors.textSecondary} strokeWidth={1.5} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: "500", color: colors.text, flex: 1 }}>{item.label}</Text>
            {item.badge != null && (
              <View style={{ backgroundColor: colors.accentBg, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.accent }}>{item.badge}</Text>
              </View>
            )}
            <ChevronRight size={16} color={colors.textMuted} strokeWidth={1.5} />
          </Pressable>
        ))}
      </View>
    );
  }

  // Tiles mode (default)
  const rows: HubItem[][] = [];
  for (let i = 0; i < visible.length; i += columns) {
    rows.push(visible.slice(i, i + columns));
  }

  return (
    <View style={{ paddingHorizontal: 16, gap: 10 }}>
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: "row", gap: 10 }}>
          {row.map((item) => (
            <Pressable
              key={item.route}
              onPress={() => router.push(item.route as any)}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: pressed ? colors.accentBg : colors.surface,
                borderRadius: 16,
                padding: 16,
                alignItems: "center",
                gap: 6,
                borderWidth: 1,
                borderColor: pressed ? colors.accent + "40" : colors.cardBorder,
              })}
            >
              <item.icon size={28} color={colors.textSecondary} strokeWidth={1.5} />
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text, textAlign: "center" }}>{item.label}</Text>
              {item.badge != null && (
                <View style={{ backgroundColor: colors.accentBg, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: colors.accent }}>{item.badge}</Text>
                </View>
              )}
            </Pressable>
          ))}
          {/* Fill empty cells */}
          {row.length < columns && Array.from({ length: columns - row.length }).map((_, fi) => (
            <View key={`fill-${fi}`} style={{ flex: 1 }} />
          ))}
        </View>
      ))}
    </View>
  );
}
