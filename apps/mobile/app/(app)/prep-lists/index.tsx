import { useState, useMemo } from "react";
import { View, Text, FlatList, Pressable, RefreshControl, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ClipboardList, LayoutGrid, List as ListIcon } from "lucide-react-native";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { usePrepLists, useTogglePrepItem, useCreatePrepList, useUpdatePrepList, useDeletePrepList, type PrepList, type PrepItem } from "../../../hooks/usePrepLists";
import { Input } from "../../../components/ui/Input";
import { Badge } from "../../../components/ui/Badge";
import { TabBar } from "../../../components/ui/Tabs";
import { EmptyState } from "../../../components/ui/EmptyState";
import { SkeletonCard } from "../../../components/ui/Skeleton";
import { FAB } from "../../../components/ui/FAB";
import { FormSheet } from "../../../components/ui/FormSheet";
import { DatePicker } from "../../../components/ui/DatePicker";
import { useTheme } from "../../../contexts/ThemeProvider";
import { lightTap } from "../../../lib/haptics";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

type ViewMode = "list" | "kanban";

// ── Prep List Card (used in both views) ──

function PrepListCard({ list, onToggle, onLongPress, compact }: { list: PrepList; onToggle: (listId: string, items: PrepItem[]) => void; onLongPress: () => void; compact?: boolean }) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const completed = list.items?.filter((i) => i.completed).length || 0;
  const total = list.items?.length || 0;
  const pct = total > 0 ? (completed / total) * 100 : 0;
  const statusColor = list.status === "completed" ? colors.success : list.status === "in_progress" ? colors.accent : colors.warning;

  return (
    <Pressable onPress={() => setExpanded(!expanded)} onLongPress={onLongPress}
      style={{ backgroundColor: colors.card, borderRadius: compact ? 12 : 16, borderWidth: 1, borderColor: colors.cardBorder, padding: compact ? 12 : 16, marginBottom: compact ? 8 : 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: compact ? 14 : 16, fontWeight: "700", color: colors.text }} numberOfLines={1}>{list.name}</Text>
          <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
            {list.date}{list.assigned_to_name ? ` · ${list.assigned_to_name}` : ""}
          </Text>
        </View>
        <Badge variant={list.status === "completed" ? "success" : list.status === "in_progress" ? "default" : "warning"}>
          {list.status.replace("_", " ")}
        </Badge>
      </View>
      <View style={{ marginTop: 8 }}>
        <View style={{ height: 5, backgroundColor: colors.border, borderRadius: 3 }}>
          <View style={{ height: 5, borderRadius: 3, backgroundColor: statusColor, width: `${pct}%` }} />
        </View>
        <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 3 }}>{completed}/{total} tasks</Text>
      </View>
      {expanded && list.items && list.items.length > 0 && (
        <View style={{ marginTop: 10, gap: 4 }}>
          {list.items.map((item, idx) => (
            <Pressable key={item.id || idx}
              onPress={() => { const updated = list.items.map((i, j) => j === idx ? { ...i, completed: !i.completed } : i); onToggle(list.id, updated); }}
              style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 5 }}>
              <View style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: item.completed ? colors.success : colors.border, backgroundColor: item.completed ? colors.success : "transparent", alignItems: "center", justifyContent: "center" }}>
                {item.completed && <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "800" }}>✓</Text>}
              </View>
              <Text style={{ flex: 1, fontSize: 13, color: item.completed ? colors.textMuted : colors.text, textDecorationLine: item.completed ? "line-through" : "none" }} numberOfLines={1}>{item.task}</Text>
              {item.quantity ? <Text style={{ fontSize: 11, color: colors.textSecondary }}>{item.quantity}</Text> : null}
              {item.urgency === "priority" && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.destructive }} />}
            </Pressable>
          ))}
        </View>
      )}
    </Pressable>
  );
}

// ── Chef Kanban Column ──

function ChefColumn({ chef, lists, onToggle, onLongPress, colors }: {
  chef: string; lists: PrepList[];
  onToggle: (listId: string, items: PrepItem[]) => void;
  onLongPress: (list: PrepList) => void;
  colors: any;
}) {
  const totalTasks = lists.reduce((a, l) => a + (l.items?.length || 0), 0);
  const completedTasks = lists.reduce((a, l) => a + (l.items?.filter((i) => i.completed).length || 0), 0);
  const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <View style={{ width: 280, backgroundColor: colors.surface, borderRadius: 16, padding: 12, marginRight: 12 }}>
      {/* Column Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accent + "20", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 13, fontWeight: "800", color: colors.accent }}>{chef.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }} numberOfLines={1}>{chef}</Text>
            <Text style={{ fontSize: 10, color: colors.textMuted }}>{lists.length} list{lists.length !== 1 ? "s" : ""} · {pct}%</Text>
          </View>
        </View>
        <View style={{ backgroundColor: pct >= 100 ? colors.successBg : colors.accentBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: pct >= 100 ? colors.success : colors.accent }}>{completedTasks}/{totalTasks}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2, marginBottom: 10 }}>
        <View style={{ height: 4, borderRadius: 2, backgroundColor: pct >= 100 ? colors.success : colors.accent, width: `${Math.min(pct, 100)}%` }} />
      </View>

      {/* Prep List Cards */}
      <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
        {lists.map((list) => (
          <PrepListCard key={list.id} list={list} compact onToggle={onToggle} onLongPress={() => onLongPress(list)} />
        ))}
      </ScrollView>
    </View>
  );
}

// ── Main Page ──

export default function PrepLists() {
  const { colors } = useTheme();
  const { data: lists, isLoading, refetch, isRefetching } = usePrepLists();
  const toggleItem = useTogglePrepItem();
  const createList = useCreatePrepList();
  const updateList = useUpdatePrepList();
  const deleteList = useDeletePrepList();

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingList, setEditingList] = useState<PrepList | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [prepDate, setPrepDate] = useState<Date>(new Date());
  const [assignedTo, setAssignedTo] = useState("");
  const [notes, setNotes] = useState("");
  const [taskInput, setTaskInput] = useState("");
  const [tasks, setTasks] = useState<{ task: string; quantity: string }[]>([]);

  const filtered = useMemo(() => {
    if (!lists) return [];
    let result = lists;
    if (search.trim()) { const q = search.toLowerCase(); result = result.filter((l) => l.name.toLowerCase().includes(q) || (l.assigned_to_name || "").toLowerCase().includes(q)); }
    if (statusFilter !== "all") result = result.filter((l) => l.status === statusFilter);
    return result;
  }, [lists, search, statusFilter]);

  // Kanban: group by chef
  const chefColumns = useMemo(() => {
    const grouped = new Map<string, PrepList[]>();
    for (const list of filtered) {
      const chef = list.assigned_to_name || "Unassigned";
      if (!grouped.has(chef)) grouped.set(chef, []);
      grouped.get(chef)!.push(list);
    }
    return Array.from(grouped.entries()).map(([chef, chefLists]) => ({ chef, lists: chefLists }));
  }, [filtered]);

  // Progress overview stats
  const totalTasks = (lists || []).reduce((a, l) => a + (l.items?.length || 0), 0);
  const completedTasks = (lists || []).reduce((a, l) => a + (l.items?.filter((i) => i.completed).length || 0), 0);
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const inProgressCount = (lists || []).filter((l) => l.status === "in_progress").length;
  const pendingCount = (lists || []).filter((l) => l.status === "pending").length;

  const resetForm = () => { setName(""); setPrepDate(new Date()); setAssignedTo(""); setNotes(""); setTaskInput(""); setTasks([]); setEditingList(null); };
  const openCreate = () => { resetForm(); setShowForm(true); };
  const openEdit = (list: PrepList) => {
    setEditingList(list); setName(list.name || ""); setPrepDate(new Date(list.date || new Date()));
    setAssignedTo(list.assigned_to_name || "");
    setNotes(list.notes || ""); setTasks((list.items || []).map((i) => ({ task: i.task, quantity: i.quantity }))); setShowForm(true);
  };
  const addTask = () => { if (!taskInput.trim()) return; setTasks([...tasks, { task: taskInput.trim(), quantity: "" }]); setTaskInput(""); };
  const removeTask = (idx: number) => setTasks(tasks.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Error", "List name is required"); return; }
    setSaving(true);
    try {
      const items: PrepItem[] = tasks.map((t, i) => ({ id: `task-${Date.now()}-${i}`, task: t.task, quantity: t.quantity, completed: false }));
      const dateStr = prepDate.toISOString().split("T")[0];
      const payload = {
        name: name.trim(),
        date: dateStr,
        assigned_to_name: assignedTo.trim() || null,
        notes: notes.trim() || null,
        items,
      };
      if (editingList) await updateList.mutateAsync({ id: editingList.id, ...payload });
      else await createList.mutateAsync(payload);
      setShowForm(false); resetForm();
    } catch (e: any) { Alert.alert("Error", e.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleLongPress = (list: PrepList) => {
    Alert.alert(list.name, "What would you like to do?", [
      { text: "Edit", onPress: () => openEdit(list) },
      { text: "Delete", style: "destructive", onPress: () => Alert.alert("Delete", `Delete "${list.name}"?`, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => deleteList.mutateAsync(list.id).catch((e: any) => Alert.alert("Error", e.message)) }]) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleToggle = (listId: string, items: PrepItem[]) => {
    toggleItem.mutate({ prepListId: listId, items });
  };

  // View toggle buttons
  const viewToggle = (
    <View style={{ flexDirection: "row", backgroundColor: colors.surface, borderRadius: 10, padding: 2 }}>
      <Pressable onPress={() => { lightTap(); setViewMode("list"); }}
        style={{ padding: 6, borderRadius: 8, backgroundColor: viewMode === "list" ? colors.card : "transparent" }}>
        <ListIcon size={14} color={viewMode === "list" ? colors.accent : colors.textMuted} strokeWidth={1.5} />
      </Pressable>
      <Pressable onPress={() => { lightTap(); setViewMode("kanban"); }}
        style={{ padding: 6, borderRadius: 8, backgroundColor: viewMode === "kanban" ? colors.card : "transparent" }}>
        <LayoutGrid size={14} color={viewMode === "kanban" ? colors.accent : colors.textMuted} strokeWidth={1.5} />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Prep Lists" rightAction={viewToggle} />

      {/* Search + Filter */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 0 }}>
        <Input placeholder="Search lists or chefs..." value={search} onChangeText={setSearch} containerStyle={{ marginBottom: 12 }} />
        <TabBar tabs={STATUS_TABS} activeTab={statusFilter} onTabChange={setStatusFilter} accentColor={colors.accent} style={{ marginBottom: 8 }} />
      </View>

      {/* Progress Overview */}
      {!isLoading && totalTasks > 0 && (
        <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, padding: 16 }}>
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>Today's Progress</Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{completedTasks} of {totalTasks} tasks completed</Text>
          </View>
          <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: "hidden" }}>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.accent, width: `${progress}%` }} />
          </View>
          <View style={{ flexDirection: "row", gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 20, fontWeight: "800", color: colors.success }}>{completedTasks}</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>Completed</Text>
            </View>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 20, fontWeight: "800", color: colors.accent }}>{inProgressCount}</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>In Progress</Text>
            </View>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 20, fontWeight: "800", color: colors.textMuted }}>{pendingCount}</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>Pending</Text>
            </View>
          </View>
        </View>
      )}

      {/* ── List View ── */}
      {viewMode === "list" && (
        <>
          {isLoading ? (
            <View style={{ padding: 24, gap: 10 }}><SkeletonCard /><SkeletonCard /><SkeletonCard /></View>
          ) : filtered.length === 0 ? (
            <EmptyState icon={<ClipboardList size={48} color={colors.textMuted} strokeWidth={1.5} />} title="No prep lists" description="Tap + to create a prep list" />
          ) : (
            <FlatList data={filtered} keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 24, paddingTop: 8, paddingBottom: 100 }}
              refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
              renderItem={({ item }) => (
                <PrepListCard list={item} onToggle={handleToggle} onLongPress={() => handleLongPress(item)} />
              )}
            />
          )}
        </>
      )}

      {/* ── Kanban View (by Chef) ── */}
      {viewMode === "kanban" && (
        <>
          {isLoading ? (
            <View style={{ padding: 24, gap: 10 }}><SkeletonCard /><SkeletonCard /></View>
          ) : chefColumns.length === 0 ? (
            <EmptyState icon={<ClipboardList size={48} color={colors.textMuted} strokeWidth={1.5} />} title="No prep lists" description="Tap + to create a prep list" />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, paddingBottom: 100 }}
              refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
              {chefColumns.map(({ chef, lists: chefLists }) => (
                <ChefColumn key={chef} chef={chef} lists={chefLists} colors={colors}
                  onToggle={handleToggle} onLongPress={handleLongPress} />
              ))}
            </ScrollView>
          )}
        </>
      )}

      <FAB onPress={openCreate} />

      <FormSheet visible={showForm} onClose={() => { setShowForm(false); resetForm(); }} onSave={handleSave} title={editingList ? "Edit Prep List" : "New Prep List"} saving={saving}>
        <Input label="List Name" value={name} onChangeText={setName} placeholder="Morning Prep, Lunch Prep, etc." />
        <DatePicker label="Date" value={prepDate} onChange={setPrepDate} mode="date" />
        <Input label="Assigned To" value={assignedTo} onChangeText={setAssignedTo} placeholder="e.g., Maria" />
        <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional notes" multiline numberOfLines={2} style={{ minHeight: 60, textAlignVertical: "top" }} />
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginTop: 8 }}>Tasks</Text>
        {tasks.map((t, idx) => (
          <View key={idx} style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.surface, borderRadius: 8, padding: 10 }}>
            <Text style={{ flex: 1, fontSize: 14, color: colors.text }}>{t.task}</Text>
            <Pressable onPress={() => removeTask(idx)}><Text style={{ fontSize: 16, color: colors.destructive }}>✕</Text></Pressable>
          </View>
        ))}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1 }}><Input value={taskInput} onChangeText={setTaskInput} placeholder="Add a task..." containerStyle={{ marginBottom: 0 }} /></View>
          <Pressable onPress={addTask} style={{ backgroundColor: colors.accent, borderRadius: 12, paddingHorizontal: 16, justifyContent: "center", height: 48 }}>
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>Add</Text>
          </Pressable>
        </View>
      </FormSheet>
    </SafeAreaView>
  );
}
