import { useState } from "react";
import { View, Text, Pressable, Modal, FlatList } from "react-native";
import { useTheme } from "../../contexts/ThemeProvider";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  value: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
}

export function Select({ label, placeholder = "Select...", value, options, onValueChange }: SelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const { colors } = useTheme();

  return (
    <View>
      {label && <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}>{label}</Text>}
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          height: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
          backgroundColor: colors.surface, paddingHorizontal: 14, justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 15, color: selected ? colors.text : colors.textMuted }}>
          {selected?.label || placeholder}
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }} onPress={() => setOpen(false)}>
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "60%" }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>{label || "Select"}</Text>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => { onValueChange(item.value); setOpen(false); }}
                  style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.surface, backgroundColor: item.value === value ? colors.accentBg : "transparent" }}
                >
                  <Text style={{ fontSize: 16, color: item.value === value ? colors.accent : colors.text, fontWeight: item.value === value ? "600" : "400" }}>
                    {item.label}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
