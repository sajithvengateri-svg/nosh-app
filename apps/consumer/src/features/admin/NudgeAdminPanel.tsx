import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  StyleSheet,
} from "react-native";
import { Plus, Trash2, ChevronLeft } from "lucide-react-native";
import { Colors, Glass } from "../../constants/colors";
import { lightTap, mediumTap } from "../../lib/haptics";
import { supabase } from "../../lib/supabase";
import type { NudgeConfigItem } from "../../hooks/useNudgeConfig";

const MODE_OPTIONS = ["voice", "text", "more"] as const;

export function NudgeAdminPanel({ onBack }: { onBack: () => void }) {
  const [nudges, setNudges] = useState<NudgeConfigItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNudges = useCallback(async () => {
    const { data } = await supabase
      .from("ds_nudge_config")
      .select("*")
      .order("sort_order");
    if (data) setNudges(data as NudgeConfigItem[]);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchNudges(); }, [fetchNudges]);

  const toggleEnabled = async (nudge: NudgeConfigItem) => {
    lightTap();
    await supabase
      .from("ds_nudge_config")
      .update({ enabled: !nudge.enabled })
      .eq("id", nudge.id);
    fetchNudges();
  };

  const updateField = async (id: string, field: string, value: any) => {
    await supabase.from("ds_nudge_config").update({ [field]: value }).eq("id", id);
    fetchNudges();
  };

  const addNudge = async () => {
    mediumTap();
    const maxSort = nudges.reduce((m, n) => Math.max(m, n.sort_order), 0);
    await supabase.from("ds_nudge_config").insert({
      key: `nudge_${Date.now()}`,
      label: "New Nudge",
      pill_text: "New nudge text",
      voice_prompt: "say: new nudge",
      icon_name: "Sparkles",
      variant: "pill",
      pastel_color: "#E8F5E9",
      sort_order: maxSort + 1,
    });
    fetchNudges();
  };

  const deleteNudge = (nudge: NudgeConfigItem) => {
    Alert.alert("Delete Nudge", `Remove "${nudge.label}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          mediumTap();
          await supabase.from("ds_nudge_config").delete().eq("id", nudge.id);
          fetchNudges();
        },
      },
    ]);
  };

  const editing = editingId ? nudges.find((n) => n.id === editingId) : null;

  if (editing) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Pressable onPress={() => { lightTap(); setEditingId(null); }} style={styles.backRow}>
          <ChevronLeft size={18} color={Colors.accent} />
          <Text style={styles.backText}>Back to list</Text>
        </Pressable>

        <Text style={styles.editTitle}>Edit: {editing.label}</Text>

        <Text style={styles.fieldLabel}>Key</Text>
        <Text style={styles.fieldValue}>{editing.key}</Text>

        <Text style={styles.fieldLabel}>Label</Text>
        <TextInput
          style={styles.input}
          value={editing.label}
          onChangeText={(v) => updateField(editing.id, "label", v)}
          placeholder="Label"
        />

        <Text style={styles.fieldLabel}>Pill Text</Text>
        <TextInput
          style={styles.input}
          value={editing.pill_text ?? ""}
          onChangeText={(v) => updateField(editing.id, "pill_text", v)}
          placeholder="Pill text"
        />

        <Text style={styles.fieldLabel}>Voice Prompt</Text>
        <TextInput
          style={styles.input}
          value={editing.voice_prompt ?? ""}
          onChangeText={(v) => updateField(editing.id, "voice_prompt", v)}
          placeholder="say: ..."
        />

        <Text style={styles.fieldLabel}>Icon Name</Text>
        <TextInput
          style={styles.input}
          value={editing.icon_name}
          onChangeText={(v) => updateField(editing.id, "icon_name", v)}
          placeholder="Lucide icon name"
        />

        <Text style={styles.fieldLabel}>Variant</Text>
        <View style={styles.segmentRow}>
          {(["bubble", "pill"] as const).map((v) => (
            <Pressable
              key={v}
              onPress={() => { lightTap(); updateField(editing.id, "variant", v); }}
              style={[styles.segment, editing.variant === v && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, editing.variant === v && styles.segmentTextActive]}>
                {v}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Pastel Color</Text>
        <TextInput
          style={styles.input}
          value={editing.pastel_color}
          onChangeText={(v) => updateField(editing.id, "pastel_color", v)}
          placeholder="#E8F5E9"
        />
        <View style={[styles.colorPreview, { backgroundColor: editing.pastel_color }]} />

        <Text style={styles.fieldLabel}>Modes</Text>
        <View style={styles.segmentRow}>
          {MODE_OPTIONS.map((m) => {
            const active = editing.modes.includes(m);
            return (
              <Pressable
                key={m}
                onPress={() => {
                  lightTap();
                  const next = active
                    ? editing.modes.filter((x) => x !== m)
                    : [...editing.modes, m];
                  updateField(editing.id, "modes", next);
                }}
                style={[styles.segment, active && styles.segmentActive]}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{m}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.fieldLabel}>Camera Relevant</Text>
          <Switch
            value={editing.cam_relevant}
            onValueChange={(v) => { lightTap(); updateField(editing.id, "cam_relevant", v); }}
            trackColor={{ false: Colors.divider, true: Colors.primary + "66" }}
            thumbColor={editing.cam_relevant ? Colors.primary : "#f4f3f4"}
          />
        </View>

        <Text style={styles.fieldLabel}>Sort Order</Text>
        <TextInput
          style={styles.input}
          value={String(editing.sort_order)}
          onChangeText={(v) => {
            const num = parseInt(v, 10);
            if (!isNaN(num)) updateField(editing.id, "sort_order", num);
          }}
          keyboardType="numeric"
        />

        <Pressable onPress={() => deleteNudge(editing)} style={styles.deleteBtn}>
          <Trash2 size={16} color="#E53935" />
          <Text style={styles.deleteText}>Delete this nudge</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ── List view: 3-column grid ──
  const rows: NudgeConfigItem[][] = [];
  for (let i = 0; i < nudges.length; i += 3) {
    rows.push(nudges.slice(i, i + 3));
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Pressable onPress={() => { lightTap(); onBack(); }} style={styles.backRow}>
        <ChevronLeft size={18} color={Colors.accent} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>Nudge Config</Text>
      <Text style={styles.subtitle}>{nudges.length} nudges configured</Text>

      {rows.map((row, ri) => (
        <View key={ri} style={styles.gridRow}>
          {row.map((nudge) => (
            <Pressable
              key={nudge.id}
              onPress={() => { lightTap(); setEditingId(nudge.id); }}
              style={[
                styles.gridItem,
                { backgroundColor: nudge.pastel_color + "40" },
                !nudge.enabled && { opacity: 0.4 },
              ]}
            >
              <View style={styles.gridItemHeader}>
                <View style={[styles.variantDot, { backgroundColor: nudge.variant === "pill" ? Colors.primary : Colors.accent }]} />
                <Switch
                  value={nudge.enabled}
                  onValueChange={() => toggleEnabled(nudge)}
                  style={{ transform: [{ scale: 0.7 }] }}
                  trackColor={{ false: Colors.divider, true: Colors.primary + "66" }}
                  thumbColor={nudge.enabled ? Colors.primary : "#f4f3f4"}
                />
              </View>
              <Text style={styles.gridItemLabel} numberOfLines={1}>{nudge.label}</Text>
              <Text style={styles.gridItemSub} numberOfLines={1}>{nudge.key}</Text>
            </Pressable>
          ))}
          {/* Fill empty cells */}
          {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.gridItemEmpty} />
          ))}
        </View>
      ))}

      <Pressable onPress={addNudge} style={styles.addBtn}>
        <Plus size={18} color={Colors.primary} />
        <Text style={styles.addText}>Add Nudge</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  backRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 16 },
  backText: { fontSize: 14, color: Colors.accent },
  title: { fontSize: 20, fontWeight: "700", color: Colors.secondary, marginBottom: 4 },
  subtitle: { fontSize: 13, color: Colors.accent, marginBottom: 20 },

  // Grid
  gridRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  gridItem: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    minHeight: 80,
  },
  gridItemEmpty: { flex: 1 },
  gridItemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  variantDot: { width: 8, height: 8, borderRadius: 4 },
  gridItemLabel: { fontSize: 13, fontWeight: "600", color: Colors.secondary },
  gridItemSub: { fontSize: 10, color: Colors.accent, marginTop: 2 },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
    borderStyle: "dashed",
    marginTop: 10,
  },
  addText: { fontSize: 14, fontWeight: "600", color: Colors.primary },

  // Edit form
  editTitle: { fontSize: 18, fontWeight: "700", color: Colors.secondary, marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: Colors.accent, marginBottom: 4, marginTop: 12 },
  fieldValue: { fontSize: 14, color: Colors.secondary, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: Colors.secondary,
    backgroundColor: Colors.card,
  },
  segmentRow: { flexDirection: "row", gap: 8 },
  segment: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  segmentActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  segmentText: { fontSize: 13, color: Colors.accent },
  segmentTextActive: { color: "#fff", fontWeight: "600" },
  colorPreview: { width: 40, height: 20, borderRadius: 4, marginTop: 6, borderWidth: 1, borderColor: Colors.divider },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    marginTop: 30,
    borderRadius: 12,
    backgroundColor: "#FFEBEE",
  },
  deleteText: { fontSize: 14, fontWeight: "600", color: "#E53935" },
});
