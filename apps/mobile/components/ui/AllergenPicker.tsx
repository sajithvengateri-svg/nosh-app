import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../contexts/ThemeProvider";

const ALLERGENS = [
  { code: "celery", label: "Celery", icon: "🥬" },
  { code: "gluten", label: "Gluten", icon: "🌾" },
  { code: "crustaceans", label: "Crustaceans", icon: "🦐" },
  { code: "eggs", label: "Eggs", icon: "🥚" },
  { code: "fish", label: "Fish", icon: "🐟" },
  { code: "lupin", label: "Lupin", icon: "🌸" },
  { code: "milk", label: "Milk", icon: "🥛" },
  { code: "molluscs", label: "Molluscs", icon: "🐚" },
  { code: "mustard", label: "Mustard", icon: "🟡" },
  { code: "nuts", label: "Tree Nuts", icon: "🥜" },
  { code: "peanuts", label: "Peanuts", icon: "🫘" },
  { code: "sesame", label: "Sesame", icon: "🫘" },
  { code: "soybeans", label: "Soybeans", icon: "🫛" },
  { code: "sulphites", label: "Sulphites", icon: "🧪" },
];

interface AllergenPickerProps {
  value: string[];
  onChange: (allergens: string[]) => void;
  label?: string;
}

export function AllergenPicker({ value, onChange, label }: AllergenPickerProps) {
  const { colors } = useTheme();
  const toggle = (code: string) => {
    if (value.includes(code)) onChange(value.filter((a) => a !== code));
    else onChange([...value, code]);
  };

  return (
    <View style={{ gap: 8 }}>
      {label && <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary }}>{label}</Text>}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {ALLERGENS.map((a) => {
          const selected = value.includes(a.code);
          return (
            <Pressable
              key={a.code}
              onPress={() => toggle(a.code)}
              style={{
                flexDirection: "row", alignItems: "center", gap: 4,
                paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
                borderWidth: 1.5,
                borderColor: selected ? colors.accent : colors.border,
                backgroundColor: selected ? colors.accentBg : colors.card,
              }}
            >
              <Text style={{ fontSize: 14 }}>{a.icon}</Text>
              <Text style={{ fontSize: 12, fontWeight: selected ? "700" : "500", color: selected ? colors.accent : colors.textMuted }}>{a.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
