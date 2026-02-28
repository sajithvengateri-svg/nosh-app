import { useState, useMemo } from "react";
import { View, Text, FlatList, RefreshControl, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { useOrg } from "../../../contexts/OrgProvider";
import { useTheme } from "../../../contexts/ThemeProvider";
import { Input } from "../../../components/ui/Input";
import { Badge } from "../../../components/ui/Badge";
import { TabBar } from "../../../components/ui/Tabs";
import { EmptyState } from "../../../components/ui/EmptyState";
import { SkeletonCard } from "../../../components/ui/Skeleton";
import { FAB } from "../../../components/ui/FAB";
import { FormSheet } from "../../../components/ui/FormSheet";
import { Select } from "../../../components/ui/Select";
import { DatePicker } from "../../../components/ui/DatePicker";
import { Recycle } from "lucide-react-native";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";

interface WasteEntry {
  id: string;
  item_name: string;
  quantity: number | null;
  unit: string | null;
  cost: number | null;
  reason: string | null;
  category: string | null;
  status: string;
  date: string;
  notes: string | null;
  org_id: string | null;
}

const REASONS = [
  { label: "Expired", value: "expired" }, { label: "Spoiled", value: "spoiled" },
  { label: "Over-production", value: "over_production" }, { label: "Damaged", value: "damaged" },
  { label: "Quality Issue", value: "quality" }, { label: "Other", value: "other" },
];

const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
];

export default function WasteLog() {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  const { data: entries, isLoading, refetch, isRefetching } = useQuery<WasteEntry[]>({
    queryKey: ["waste-log", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from("waste_logs").select("*").eq("org_id", orgId).order("date", { ascending: false }).limit(100);
      if (error) throw error;
      return (data as WasteEntry[]) || [];
    },
    enabled: !!orgId,
  });

  const createEntry = useMutation({
    mutationFn: async (entry: Partial<WasteEntry>) => {
      const { error } = await supabase.from("waste_logs").insert({ ...entry, org_id: orgId, status: "pending" });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["waste-log"] }),
  });

  const updateEntry = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WasteEntry> & { id: string }) => {
      const { error } = await supabase.from("waste_logs").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["waste-log"] }),
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("waste_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["waste-log"] }),
  });

  const [tab, setTab] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<WasteEntry | null>(null);
  const [saving, setSaving] = useState(false);

  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [cost, setCost] = useState("");
  const [reason, setReason] = useState("expired");
  const [notes, setNotes] = useState("");
  const [wasteDate, setWasteDate] = useState<Date>(new Date());

  const totalCost = useMemo(() => (entries || []).reduce((s, e) => s + (e.cost || 0), 0), [entries]);

  const filtered = useMemo(() => {
    if (!entries) return [];
    if (tab === "all") return entries;
    return entries.filter((e) => e.status === tab);
  }, [entries, tab]);

  const resetForm = () => { setItemName(""); setQuantity(""); setUnit(""); setCost(""); setReason("expired"); setNotes(""); setWasteDate(new Date()); setEditing(null); };
  const openCreate = () => { resetForm(); setShowForm(true); };
  const openEdit = (item: WasteEntry) => {
    setEditing(item); setItemName(item.item_name || ""); setQuantity(item.quantity?.toString() || "");
    setUnit(item.unit || ""); setCost(item.cost?.toString() || ""); setReason(item.reason || "expired");
    setNotes(item.notes || ""); setWasteDate(new Date(item.date)); setShowForm(true);
  };

  const handleSave = async () => {
    if (!itemName.trim()) { Alert.alert("Error", "Item name is required"); return; }
    setSaving(true);
    try {
      const data: any = { item_name: itemName.trim(), quantity: quantity ? Number(quantity) : null, unit: unit.trim() || null, cost: cost ? Number(cost) : null, reason, notes: notes.trim() || null, date: wasteDate.toISOString().split("T")[0] };
      if (editing) await updateEntry.mutateAsync({ id: editing.id, ...data });
      else await createEntry.mutateAsync(data);
      setShowForm(false); resetForm();
    } catch (e: any) { Alert.alert("Error", e.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleLongPress = (item: WasteEntry) => {
    Alert.alert(item.item_name, "What would you like to do?", [
      { text: "Edit", onPress: () => openEdit(item) },
      { text: "Delete", style: "destructive", onPress: () => Alert.alert("Delete", `Delete this entry?`, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => deleteEntry.mutate(item.id) }]) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Waste Log" />
      <View style={{ padding: 24, paddingTop: 0, paddingBottom: 0 }}>
        <View style={{ backgroundColor: colors.destructiveBg, borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>Total Waste Cost</Text>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.destructive }}>${totalCost.toFixed(2)}</Text>
        </View>
        <TabBar tabs={TABS} activeTab={tab} onTabChange={setTab} accentColor={colors.accent} style={{ marginBottom: 8 }} />
      </View>

      {isLoading ? <View style={{ padding: 24, gap: 10 }}><SkeletonCard /><SkeletonCard /></View> : filtered.length === 0 ? (
        <EmptyState icon={<Recycle size={40} color={colors.textMuted} strokeWidth={1.5} />} title="No waste entries" description="Tap + to log waste" />
      ) : (
        <FlatList data={filtered} keyExtractor={(i) => i.id} contentContainerStyle={{ paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          renderItem={({ item }) => (
            <Pressable onPress={() => openEdit(item)} onLongPress={() => handleLongPress(item)} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{item.item_name}</Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>{item.date}</Text>
                  {item.reason && <Text style={{ fontSize: 12, color: colors.textMuted }}>{item.reason.replace("_", " ")}</Text>}
                  {item.quantity != null && <Text style={{ fontSize: 12, color: colors.textMuted }}>{item.quantity} {item.unit}</Text>}
                </View>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                {item.cost != null && <Text style={{ fontSize: 14, fontWeight: "700", color: colors.destructive }}>${item.cost.toFixed(2)}</Text>}
                <Badge variant={item.status === "approved" ? "success" : item.status === "rejected" ? "destructive" : "warning"}>{item.status}</Badge>
              </View>
            </Pressable>
          )}
        />
      )}
      <FAB onPress={openCreate} />
      <FormSheet visible={showForm} onClose={() => { setShowForm(false); resetForm(); }} onSave={handleSave} title={editing ? "Edit Waste Entry" : "Log Waste"} saving={saving}>
        <Input label="Item Name" value={itemName} onChangeText={setItemName} placeholder="What was wasted?" />
        <DatePicker label="Date" value={wasteDate} onChange={setWasteDate} mode="date" />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}><Input label="Quantity" value={quantity} onChangeText={setQuantity} placeholder="0" keyboardType="decimal-pad" /></View>
          <View style={{ flex: 1 }}><Input label="Unit" value={unit} onChangeText={setUnit} placeholder="kg, ea, etc." /></View>
        </View>
        <Input label="Cost ($)" value={cost} onChangeText={setCost} placeholder="Estimated cost" keyboardType="decimal-pad" />
        <Select label="Reason" value={reason} onValueChange={setReason} options={REASONS} />
        <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Additional details" multiline numberOfLines={2} style={{ minHeight: 60, textAlignVertical: "top" }} />
      </FormSheet>
    </SafeAreaView>
  );
}
