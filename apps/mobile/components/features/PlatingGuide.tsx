import { useState } from "react";
import { View, Text, Pressable, Image } from "react-native";
import { ChevronUp, ChevronDown, X, Plus, Image as ImageIcon } from "lucide-react-native";
import { Input } from "../ui/Input";
import { useTheme } from "../../contexts/ThemeProvider";

export interface PlatingStepLocal {
  instruction: string;
  image_url?: string | null;
}

interface PlatingGuideProps {
  steps: PlatingStepLocal[];
  onChange: (steps: PlatingStepLocal[]) => void;
}

export function PlatingGuide({ steps, onChange }: PlatingGuideProps) {
  const { colors } = useTheme();
  const [stepText, setStepText] = useState("");

  const addStep = () => {
    if (!stepText.trim()) return;
    onChange([...steps, { instruction: stepText.trim(), image_url: null }]);
    setStepText("");
  };

  const removeStep = (idx: number) => {
    onChange(steps.filter((_, i) => i !== idx));
  };

  const moveStep = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= steps.length) return;
    const updated = [...steps];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    onChange(updated);
  };

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary }}>Plating ({steps.length} steps)</Text>

      {steps.map((step, idx) => (
        <View key={idx} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: colors.surface, borderRadius: 10, padding: 10 }}>
          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "700" }}>{idx + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, color: colors.text }}>{step.instruction}</Text>
            {step.image_url ? (
              <Image source={{ uri: step.image_url }} style={{ width: 48, height: 48, borderRadius: 6, marginTop: 6 }} />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                <ImageIcon size={12} color={colors.textSecondary} strokeWidth={1.5} />
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>No image</Text>
              </View>
            )}
          </View>
          <View style={{ gap: 4 }}>
            <Pressable onPress={() => moveStep(idx, -1)} disabled={idx === 0}>
              <ChevronUp size={16} color={idx === 0 ? colors.border : colors.accent} strokeWidth={1.5} />
            </Pressable>
            <Pressable onPress={() => moveStep(idx, 1)} disabled={idx === steps.length - 1}>
              <ChevronDown size={16} color={idx === steps.length - 1 ? colors.border : colors.accent} strokeWidth={1.5} />
            </Pressable>
          </View>
          <Pressable onPress={() => removeStep(idx)}>
            <X size={18} color={colors.destructive} strokeWidth={1.5} />
          </Pressable>
        </View>
      ))}

      <View style={{ gap: 8 }}>
        <Input value={stepText} onChangeText={setStepText} placeholder="Describe plating step..." multiline numberOfLines={2} style={{ minHeight: 50, textAlignVertical: "top" }} containerStyle={{ marginBottom: 0 }} />
        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
          <Pressable onPress={addStep} style={{ flexDirection: "row", backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, justifyContent: "center", alignItems: "center", gap: 6 }}>
            <Plus size={16} color="#FFFFFF" strokeWidth={2} />
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>Add Step</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
