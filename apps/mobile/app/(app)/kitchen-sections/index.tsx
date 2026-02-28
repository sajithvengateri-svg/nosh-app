import { useState, useMemo } from "react";
import { View, Text, FlatList, Pressable, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tag } from "lucide-react-native";
import { supabase } from "../../../lib/supabase";
import { useOrg } from "../../../contexts/OrgProvider";
import { useTheme } from "../../../contexts/ThemeProvider";
import { Input } from "../../../components/ui/Input";
import { EmptyState } from "../../../components/ui/EmptyState";
import { SkeletonCard } from "../../../components/ui/Skeleton";
import { FAB } from "../../../components/ui/FAB";
import { FormSheet } from "../../../components/ui/FormSheet";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";

interface Section {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  leader_name: string | null;
  recipe_count: number | null;
  staff_count: number | null;
  org_id: string | null;
}

// Color palette for section color selection - kept as-is
const COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#EC4899", "#8B5CF6", "#14B8A6"];

export default function KitchenSections() {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  const { data: sections, isLoading, refetch, isRefetching } = useQuery<Section[]>({
    queryKey: ["kitchen-sections", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from("kitchen_sections").select("*").eq("org_id", orgId).order("name");
      if (error) throw error;
      return (data as Section[]) || [];
    },
    enabled: !!orgId,
  });

  const createSection = useMutation({
    mutationFn: async (section: Partial<Section>) => {
      const { error } = await supabase.from("kitchen_sections").insert({ ...section, org_id: orgId });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["kitchen-sections"] }),
  });

  const updateSection = useMutation({
    mutationFn: async ({ id, ...u }: Partial<Section> & { id: string }) => {
      const { error } = await supabase.from("kitchen_sections").update(u).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["kitchen-sections"] }),
  });

  const deleteSection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kitchen_sections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["kitchen-sections"] }),
  });

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Section | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [leaderName, setLeaderName] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  const resetForm = () => { setName(""); setDescription(""); setLeaderName(""); setColor(COLORS[0]); setEditing(null); };
  const openCreate = () => { resetForm(); setShowForm(true); };
  const openEdit = (item: Section) => {
    setEditing(item); setName(item.name || ""); setDescription(item.description || "");
    setLeaderName(item.leader_name || ""); setColor(item.color || COLORS[0]); setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Error", "Section name is required"); return; }
    setSaving(true);
    try {
      const data: any = { name: name.trim(), description: description.trim() || null, leader_name: leaderName.trim() || null, color };
      if (editing) await updateSection.mutateAsync({ id: editing.id, ...data });
      else await createSection.mutateAsync(data);
      setShowForm(false); resetForm();
    } catch (e: any) { Alert.alert("Error", e.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleLongPress = (item: Section) => {
    Alert.alert(item.name, "What would you like to do?", [
      { text: "Edit", onPress: () => openEdit(item) },
      { text: "Delete", style: "destructive", onPress: () => Alert.alert("Delete Section", `Delete "${item.name}"?`, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => deleteSection.mutate(item.id) }]) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Kitchen Sections" />
      {isLoading ? <View style={{ padding: 24, gap: 10 }}><SkeletonCard /><SkeletonCard /></View> : !sections?.length ? (
        <EmptyState icon={<Tag size={32} color={colors.textMuted} />} title="No sections" description="Tap + to create a kitchen section" />
      ) : (
        <FlatList data={sections} keyExtractor={(i) => i.id} contentContainerStyle={{ padding: 16, paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          renderItem={({ item }) => (
            <Pressable onPress={() => openEdit(item)} onLongPress={() => handleLongPress(item)} style={{ backgroundColor: colors.background, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 10, overflow: "hidden", flexDirection: "row" }}>
              <View style={{ width: 6, backgroundColor: item.color || colors.accent }} />
              <View style={{ flex: 1, padding: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>{item.name}</Text>
                {item.description && <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }} numberOfLines={2}>{item.description}</Text>}
                <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
                  {item.leader_name && <Text style={{ fontSize: 12, color: colors.textSecondary }}>Lead: {item.leader_name}</Text>}
                  {item.recipe_count != null && <Text style={{ fontSize: 12, color: colors.textSecondary }}>{item.recipe_count} recipes</Text>}
                  {item.staff_count != null && <Text style={{ fontSize: 12, color: colors.textSecondary }}>{item.staff_count} staff</Text>}
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
      <FAB onPress={openCreate} />
      <FormSheet visible={showForm} onClose={() => { setShowForm(false); resetForm(); }} onSave={handleSave} title={editing ? "Edit Section" : "New Section"} saving={saving}>
        <Input label="Section Name" value={name} onChangeText={setName} placeholder="Pastry, Grill, Garde Manger, etc." />
        <Input label="Description" value={description} onChangeText={setDescription} placeholder="What this section handles" multiline numberOfLines={2} style={{ minHeight: 60, textAlignVertical: "top" }} />
        <Input label="Section Leader" value={leaderName} onChangeText={setLeaderName} placeholder="Who runs this section?" />
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary }}>Color</Text>
        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
          {COLORS.map((c) => (
            <Pressable key={c} onPress={() => setColor(c)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c, borderWidth: c === color ? 3 : 0, borderColor: colors.text }} />
          ))}
        </View>
      </FormSheet>
    </SafeAreaView>
  );
}
