import { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  RefreshControl,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useOrg } from "../../contexts/OrgProvider";
import { useAuth } from "../../contexts/AuthProvider";
import { useTheme } from "../../contexts/ThemeProvider";
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  SprayCan,
} from "lucide-react-native";

// ── Default items (user can add more) ────────────────────────────────
const DEFAULT_ITEMS = [
  "Bench / Countertops",
  "Fridge",
  "Sink",
  "Stove / Cooktop",
  "Microwave",
  "Floor",
];

// ── Helpers ──────────────────────────────────────────────────────────
function fmtDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function displayDate(d: Date): string {
  const todayStr = fmtDate(new Date());
  const dateStr = fmtDate(d);
  if (dateStr === todayStr) return "Today";
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (dateStr === fmtDate(y)) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

// ── Component ────────────────────────────────────────────────────────
export function HomeCleaningChecklist() {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const { user, isDevBypass } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  // ── Date nav ─────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = fmtDate(selectedDate);
  const isToday = dateStr === fmtDate(new Date());

  const stepDate = (dir: -1 | 1) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + dir);
    if (next > new Date()) return;
    setSelectedDate(next);
  };

  // ── Custom items (persisted per org) ─────────────────────────────
  const { data: customItems } = useQuery<string[]>({
    queryKey: ["home-cleaning-items", orgId],
    queryFn: async () => {
      if (!orgId) return DEFAULT_ITEMS;
      if (isDevBypass) return queryClient.getQueryData(["home-cleaning-items", orgId]) ?? DEFAULT_ITEMS;
      const { data } = await supabase
        .from("bcc_cleaning_schedules")
        .select("task_name")
        .eq("org_id", orgId)
        .eq("shift", "opening")
        .like("area", "Home")
        .eq("is_active", true)
        .order("sort_order");
      if (!data || data.length === 0) return DEFAULT_ITEMS;
      return data.map((d: any) => d.task_name as string);
    },
    enabled: !!orgId,
  });

  const items = customItems ?? DEFAULT_ITEMS;

  // ── Completions for selected date ────────────────────────────────
  const { data: completions, refetch } = useQuery<Set<string>>({
    queryKey: ["home-cleaning", orgId, dateStr],
    queryFn: async () => {
      if (!orgId) return new Set();
      if (isDevBypass) return queryClient.getQueryData(["home-cleaning", orgId, dateStr]) ?? new Set();
      const { data, error } = await supabase
        .from("bcc_cleaning_completions")
        .select("notes")
        .eq("org_id", orgId)
        .gte("completed_at", `${dateStr}T00:00:00`)
        .lte("completed_at", `${dateStr}T23:59:59`)
        .like("notes", "home:%");
      if (error) return new Set();
      const set = new Set<string>();
      data?.forEach((d: any) => set.add((d.notes as string).replace("home:", "")));
      return set;
    },
    enabled: !!orgId,
  });

  const doneKeys = completions ?? new Set<string>();
  const doneCount = items.filter((i) => doneKeys.has(slugify(i))).length;
  const totalCount = items.length;
  const allDone = totalCount > 0 && doneCount === totalCount;

  // ── Complete a task ──────────────────────────────────────────────
  const completeMutation = useMutation({
    mutationFn: async (key: string) => {
      if (!orgId || !user) throw new Error("Not authenticated");
      if (isDevBypass) {
        queryClient.setQueryData<Set<string>>(
          ["home-cleaning", orgId, dateStr],
          (prev) => new Set([...(prev ?? []), key])
        );
        return;
      }
      const { error } = await supabase.from("bcc_cleaning_completions").insert({
        schedule_id: `home-${key}`,
        org_id: orgId,
        completed_by: user.email,
        notes: `home:${key}`,
        is_auto: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-cleaning", orgId, dateStr] });
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const handleTick = useCallback((label: string) => {
    const key = slugify(label);
    if (doneKeys.has(key) || !isToday) return;
    completeMutation.mutate(key);
  }, [doneKeys, isToday, completeMutation]);

  // ── Add new item ─────────────────────────────────────────────────
  const [newItem, setNewItem] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const addItemMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!orgId) throw new Error("No org");
      if (isDevBypass) {
        queryClient.setQueryData<string[]>(
          ["home-cleaning-items", orgId],
          (prev) => [...(prev ?? DEFAULT_ITEMS), name]
        );
        return;
      }
      const nextOrder = items.length + 1;
      const { error } = await supabase.from("bcc_cleaning_schedules").insert({
        org_id: orgId,
        task_name: name,
        area: "Home",
        frequency: "daily",
        shift: "opening",
        sort_order: nextOrder,
        is_active: true,
        sanitiser_required: false,
        responsible_role: "any",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-cleaning-items"] });
      setNewItem("");
      setShowAdd(false);
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const handleAddItem = () => {
    const name = newItem.trim();
    if (!name) return;
    if (items.some((i) => i.toLowerCase() === name.toLowerCase())) {
      Alert.alert("Already exists", "This cleaning area is already in your list.");
      return;
    }
    addItemMutation.mutate(name);
  };

  // ── Remove custom item ──────────────────────────────────────────
  const removeItemMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!orgId) throw new Error("No org");
      if (isDevBypass) {
        queryClient.setQueryData<string[]>(
          ["home-cleaning-items", orgId],
          (prev) => (prev ?? []).filter((i) => i !== name)
        );
        return;
      }
      const { error } = await supabase
        .from("bcc_cleaning_schedules")
        .delete()
        .eq("org_id", orgId)
        .eq("task_name", name)
        .eq("area", "Home");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-cleaning-items"] });
    },
  });

  const handleRemove = (name: string) => {
    Alert.alert("Remove", `Remove "${name}" from your list?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeItemMutation.mutate(name) },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* ── Date navigator ──────────────────────────────────────── */}
      <View style={{
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        paddingVertical: 12, gap: 20,
        borderBottomWidth: 1, borderBottomColor: colors.border,
      }}>
        <Pressable onPress={() => stepDate(-1)} hitSlop={10} style={{ padding: 6 }}>
          <ChevronLeft size={22} color={colors.textSecondary} strokeWidth={2} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "700", color: isToday ? colors.accent : colors.text, minWidth: 120, textAlign: "center" }}>
          {displayDate(selectedDate)}
        </Text>
        <Pressable
          onPress={() => stepDate(1)}
          hitSlop={10}
          disabled={isToday}
          style={{ padding: 6, opacity: isToday ? 0.25 : 1 }}
        >
          <ChevronRight size={22} color={colors.textSecondary} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => refetch()} />}
      >
        {/* ── Progress ──────────────────────────────────────────── */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: colors.textMuted }}>
            {doneCount}/{totalCount} completed
          </Text>
          {allDone && (
            <View style={{
              flexDirection: "row", alignItems: "center", gap: 4,
              backgroundColor: colors.success + "12", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
            }}>
              <CheckCircle2 size={12} color={colors.success} strokeWidth={2} />
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.success }}>All done</Text>
            </View>
          )}
        </View>

        {/* ── Progress bar ──────────────────────────────────────── */}
        <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.surface, overflow: "hidden", marginBottom: 24 }}>
          <View style={{
            height: 6, borderRadius: 3,
            backgroundColor: allDone ? colors.success : colors.accent,
            width: totalCount > 0 ? `${(doneCount / totalCount) * 100}%` : "0%",
          }} />
        </View>

        {/* ── Tick boxes ────────────────────────────────────────── */}
        {items.map((label, idx) => {
          const key = slugify(label);
          const done = doneKeys.has(key);
          const canTick = isToday && !done;
          const isDefault = DEFAULT_ITEMS.includes(label);

          return (
            <Pressable
              key={key + idx}
              onPress={() => handleTick(label)}
              disabled={!canTick}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                paddingVertical: 16,
                paddingHorizontal: 16,
                marginBottom: 10,
                borderRadius: 14,
                backgroundColor: done ? colors.success + "06" : colors.card,
                borderWidth: 1,
                borderColor: done ? colors.success + "20" : colors.border,
                opacity: pressed && canTick ? 0.7 : (!isToday && !done ? 0.45 : 1),
              })}
            >
              {/* Checkbox */}
              <View style={{
                width: 28, height: 28, borderRadius: 8,
                borderWidth: done ? 0 : 2,
                borderColor: colors.border,
                backgroundColor: done ? colors.success : "transparent",
                alignItems: "center", justifyContent: "center",
              }}>
                {done && <Check size={16} color="#FFFFFF" strokeWidth={2.5} />}
              </View>

              {/* Label */}
              <Text style={{
                flex: 1, fontSize: 16, fontWeight: "500",
                color: done ? colors.textMuted : colors.text,
                textDecorationLine: done ? "line-through" : "none",
              }}>
                {label}
              </Text>

              {/* Remove button (custom items only, today only) */}
              {!isDefault && isToday && !done && (
                <Pressable onPress={() => handleRemove(label)} hitSlop={8} style={{ padding: 4 }}>
                  <Trash2 size={14} color={colors.textMuted} strokeWidth={1.5} />
                </Pressable>
              )}
            </Pressable>
          );
        })}

        {/* ── Add new item ──────────────────────────────────────── */}
        {isToday && (
          <>
            {showAdd ? (
              <View style={{
                flexDirection: "row", alignItems: "center", gap: 10,
                marginTop: 4, marginBottom: 10,
              }}>
                <TextInput
                  value={newItem}
                  onChangeText={setNewItem}
                  placeholder="e.g. Dishwasher, Pantry, Windows..."
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                  onSubmitEditing={handleAddItem}
                  returnKeyType="done"
                  style={{
                    flex: 1, fontSize: 15, color: colors.text,
                    paddingVertical: 14, paddingHorizontal: 16,
                    borderRadius: 14, backgroundColor: colors.card,
                    borderWidth: 1, borderColor: colors.border,
                  }}
                />
                <Pressable
                  onPress={handleAddItem}
                  disabled={!newItem.trim()}
                  style={{
                    paddingVertical: 14, paddingHorizontal: 16,
                    borderRadius: 14, backgroundColor: newItem.trim() ? colors.accent : colors.surface,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "700", color: newItem.trim() ? "#FFFFFF" : colors.textMuted }}>
                    Add
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => setShowAdd(true)}
                style={{
                  flexDirection: "row", alignItems: "center", justifyContent: "center",
                  gap: 6, marginTop: 4, marginBottom: 10,
                  paddingVertical: 14, borderRadius: 14,
                  borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.border,
                }}
              >
                <Plus size={16} color={colors.textMuted} strokeWidth={2} />
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textMuted }}>
                  Add cleaning area
                </Text>
              </Pressable>
            )}
          </>
        )}

        {/* ── Daily report (all done) ───────────────────────────── */}
        {allDone && isToday && (
          <View style={{
            marginTop: 20, padding: 20, borderRadius: 16,
            backgroundColor: colors.success + "06",
            borderWidth: 1, borderColor: colors.success + "18",
            alignItems: "center", gap: 8,
          }}>
            <CheckCircle2 size={32} color={colors.success} strokeWidth={1.5} />
            <Text style={{ fontSize: 17, fontWeight: "700", color: colors.success }}>
              Daily Report Complete
            </Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center" }}>
              All areas cleaned — {new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}
            </Text>
          </View>
        )}

        {/* ── Past day note ─────────────────────────────────────── */}
        {!isToday && (
          <View style={{
            marginTop: 16, paddingVertical: 12, paddingHorizontal: 16,
            borderRadius: 12, backgroundColor: colors.surface,
            alignItems: "center",
          }}>
            <Text style={{ fontSize: 13, color: colors.textMuted }}>
              {allDone ? "All areas were cleaned" : `${doneCount} of ${totalCount} areas cleaned`}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
