import { View, Text, Pressable } from "react-native";
import { UtensilsCrossed, Puzzle, Soup, Beef, type LucideIcon } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeProvider";

export type RecipeType = "dish" | "component" | "batch_prep" | "portion_prep";

interface RecipeTypeSelectorProps {
  value: RecipeType;
  onChange: (type: RecipeType) => void;
  compact?: boolean;
}

const TYPES: { value: RecipeType; label: string; icon: LucideIcon; description: string }[] = [
  { value: "dish", label: "Dish", icon: UtensilsCrossed, description: "Menu item served to customers" },
  { value: "component", label: "Component", icon: Puzzle, description: "Building block for dishes" },
  { value: "batch_prep", label: "Batch Prep", icon: Soup, description: "Stocks, sauces, bases in bulk" },
  { value: "portion_prep", label: "Portion Prep", icon: Beef, description: "Proteins with yield loss" },
];

export function RecipeTypeSelector({ value, onChange, compact }: RecipeTypeSelectorProps) {
  const { colors } = useTheme();

  if (compact) {
    return (
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {TYPES.map((t) => {
          const selected = value === t.value;
          const IconComp = t.icon;
          return (
            <Pressable
              key={t.value}
              onPress={() => onChange(t.value)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: selected ? colors.accentBg : colors.surface,
                borderWidth: 1,
                borderColor: selected ? colors.accent : colors.border,
              }}
            >
              <IconComp size={14} color={selected ? colors.accent : colors.textSecondary} strokeWidth={1.5} />
              <Text style={{ fontSize: 13, fontWeight: selected ? "700" : "500", color: selected ? colors.accent : colors.textSecondary }}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary }}>Recipe Type</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {TYPES.map((t) => {
          const selected = value === t.value;
          const IconComp = t.icon;
          return (
            <Pressable
              key={t.value}
              onPress={() => onChange(t.value)}
              style={{
                width: "48%",
                backgroundColor: selected ? colors.accentBg : colors.surface,
                borderRadius: 14,
                padding: 14,
                borderWidth: 2,
                borderColor: selected ? colors.accent : colors.border,
                gap: 4,
              }}
            >
              <IconComp size={24} color={selected ? colors.accent : colors.textSecondary} strokeWidth={1.5} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: selected ? colors.accent : colors.text, marginTop: 2 }}>
                {t.label}
              </Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 16 }}>{t.description}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
