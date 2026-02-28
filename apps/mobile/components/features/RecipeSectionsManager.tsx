import { useState } from "react";
import { View, Text, Pressable, Modal, TextInput, Alert, ScrollView } from "react-native";
import { X, Plus, ChevronUp, ChevronDown, Pencil, Trash2 } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeProvider";
import {
  useRecipeSections,
  useCreateRecipeSection,
  useUpdateRecipeSection,
  useDeleteRecipeSection,
  type RecipeSection,
} from "../../hooks/useRecipeSections";

const SECTION_COLORS = [
  "#6366F1", "#EC4899", "#F59E0B", "#10B981", "#3B82F6",
  "#EF4444", "#8B5CF6", "#14B8A6", "#F97316", "#06B6D4",
];

interface RecipeSectionsManagerProps {
  visible: boolean;
  onClose: () => void;
}

export function RecipeSectionsManager({ visible, onClose }: RecipeSectionsManagerProps) {
  const { colors } = useTheme();
  const { data: sections = [] } = useRecipeSections();
  const createSection = useCreateRecipeSection();
  const updateSection = useUpdateRecipeSection();
  const deleteSection = useDeleteRecipeSection();

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(SECTION_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      await createSection.mutateAsync({
        name: newName.trim(),
        color: newColor,
        sort_order: sections.length,
      });
      setNewName("");
      setNewColor(SECTION_COLORS[(sections.length + 1) % SECTION_COLORS.length]);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to create section");
    }
  };

  const handleDelete = (section: RecipeSection) => {
    Alert.alert("Delete Section", `Delete "${section.name}"? Recipes in this category will become uncategorized.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteSection.mutate(section.id),
      },
    ]);
  };

  const startEdit = (section: RecipeSection) => {
    setEditingId(section.id);
    setEditName(section.name);
    setEditColor(section.color);
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    try {
      await updateSection.mutateAsync({ id: editingId, name: editName.trim(), color: editColor });
      setEditingId(null);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update section");
    }
  };

  const moveSection = async (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const a = sections[idx];
    const b = sections[newIdx];
    await updateSection.mutateAsync({ id: a.id, sort_order: b.sort_order });
    await updateSection.mutateAsync({ id: b.id, sort_order: a.sort_order });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>Recipe Sections</Text>
          <Pressable onPress={onClose} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
            <X size={18} color={colors.text} strokeWidth={1.5} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          {/* Existing sections */}
          {sections.map((section, idx) => (
            <View key={section.id} style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 12, borderLeftWidth: 4, borderLeftColor: section.color }}>
              {editingId === section.id ? (
                <View style={{ gap: 10 }}>
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    style={{ backgroundColor: colors.background, borderRadius: 8, padding: 10, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.border }}
                    autoFocus
                  />
                  <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                    {SECTION_COLORS.map((c) => (
                      <Pressable
                        key={c}
                        onPress={() => setEditColor(c)}
                        style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c, borderWidth: editColor === c ? 3 : 0, borderColor: colors.text }}
                      />
                    ))}
                  </View>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Pressable onPress={saveEdit} style={{ flex: 1, backgroundColor: colors.accent, borderRadius: 8, paddingVertical: 8, alignItems: "center" }}>
                      <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 13 }}>Save</Text>
                    </Pressable>
                    <Pressable onPress={() => setEditingId(null)} style={{ flex: 1, backgroundColor: colors.border, borderRadius: 8, paddingVertical: 8, alignItems: "center" }}>
                      <Text style={{ color: colors.text, fontWeight: "600", fontSize: 13 }}>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ gap: 2 }}>
                    <Pressable onPress={() => moveSection(idx, -1)} disabled={idx === 0}>
                      <ChevronUp size={14} color={idx === 0 ? colors.border : colors.accent} strokeWidth={1.5} />
                    </Pressable>
                    <Pressable onPress={() => moveSection(idx, 1)} disabled={idx === sections.length - 1}>
                      <ChevronDown size={14} color={idx === sections.length - 1 ? colors.border : colors.accent} strokeWidth={1.5} />
                    </Pressable>
                  </View>
                  <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: section.color }} />
                  <Text style={{ flex: 1, fontSize: 15, fontWeight: "600", color: colors.text }}>{section.name}</Text>
                  <Pressable onPress={() => startEdit(section)} style={{ padding: 6 }}>
                    <Pencil size={16} color={colors.textSecondary} strokeWidth={1.5} />
                  </Pressable>
                  <Pressable onPress={() => handleDelete(section)} style={{ padding: 6 }}>
                    <Trash2 size={16} color={colors.destructive} strokeWidth={1.5} />
                  </Pressable>
                </View>
              )}
            </View>
          ))}

          {sections.length === 0 && (
            <View style={{ alignItems: "center", padding: 24 }}>
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>No sections yet. Add your first one below.</Text>
            </View>
          )}

          {/* Add new section */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 14, gap: 10, marginTop: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary }}>Add Section</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Section name..."
              placeholderTextColor={colors.textSecondary}
              style={{ backgroundColor: colors.background, borderRadius: 8, padding: 10, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.border }}
            />
            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
              {SECTION_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setNewColor(c)}
                  style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c, borderWidth: newColor === c ? 3 : 0, borderColor: colors.text }}
                />
              ))}
            </View>
            <Pressable
              onPress={handleAdd}
              style={{ flexDirection: "row", backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 10, alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <Plus size={16} color="#FFFFFF" strokeWidth={2} />
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>Add Section</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
