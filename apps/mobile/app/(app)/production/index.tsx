import { useState, useMemo } from "react";
import { View, Text, FlatList, Pressable, RefreshControl, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { useOrg } from "../../../contexts/OrgProvider";
import { Badge } from "../../../components/ui/Badge";
import { TabBar } from "../../../components/ui/Tabs";
import { EmptyState } from "../../../components/ui/EmptyState";
import { SkeletonCard } from "../../../components/ui/Skeleton";
import { FAB } from "../../../components/ui/FAB";
import { FormSheet } from "../../../components/ui/FormSheet";
import { Input } from "../../../components/ui/Input";
import { DatePicker } from "../../../components/ui/DatePicker";
import { useCreateBatch, useUpdateBatch, useDeleteBatch } from "../../../hooks/useProductionMutations";
import { Factory } from "lucide-react-native";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { useTheme } from "../../../contexts/ThemeProvider";

interface ProductionBatch {
  id: string;
  recipe_id: string | null;
  recipe_name: string | null;
  batch_size: number;
  unit: string | null;
  status: "planned" | "in-progress" | "completed" | "cancelled";
  scheduled_date: string | null;
  completed_at: string | null;
  yield_amount: number | null;
  yield_unit: string | null;
  notes: string | null;
  created_at: string;
}

const STATUS_BADGES: Record<string, "default" | "success" | "warning" | "secondary" | "destructive"> = {
  planned: "secondary",
  "in-progress": "default",
  completed: "success",
  cancelled: "destructive",
};

export default function Production() {
  const router = useRouter();
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const [tab, setTab] = useState("active");

  const createBatch = useCreateBatch();
  const updateBatch = useUpdateBatch();
  const deleteBatch = useDeleteBatch();

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recipeName, setRecipeName] = useState("");
  const [batchSize, setBatchSize] = useState("");
  const [unit, setUnit] = useState("units");
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [notes, setNotes] = useState("");

  // Yield form
  const [showYield, setShowYield] = useState(false);
  const [yieldBatchId, setYieldBatchId] = useState("");
  const [yieldAmount, setYieldAmount] = useState("");
  const [yieldUnit, setYieldUnit] = useState("");
  const [yieldNotes, setYieldNotes] = useState("");

  const { data: batches, isLoading, refetch, isRefetching } = useQuery<ProductionBatch[]>({
    queryKey: ["production-batches", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("production_batches")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as ProductionBatch[]) || [];
    },
    enabled: !!orgId,
  });

  const filtered = useMemo(() => {
    if (!batches) return [];
    if (tab === "active") return batches.filter((b) => b.status === "planned" || b.status === "in-progress");
    if (tab === "completed") return batches.filter((b) => b.status === "completed");
    return batches;
  }, [batches, tab]);

  const stats = useMemo(() => {
    if (!batches) return { planned: 0, inProgress: 0, completed: 0 };
    return {
      planned: batches.filter((b) => b.status === "planned").length,
      inProgress: batches.filter((b) => b.status === "in-progress").length,
      completed: batches.filter((b) => b.status === "completed").length,
    };
  }, [batches]);

  const handleCreate = async () => {
    if (!recipeName.trim()) { Alert.alert("Error", "Recipe name required"); return; }
    if (!batchSize || isNaN(Number(batchSize))) { Alert.alert("Error", "Valid batch size required"); return; }
    setSaving(true);
    try {
      await createBatch.mutateAsync({
        recipe_name: recipeName.trim(),
        batch_size: Number(batchSize),
        unit: unit.trim() || "units",
        scheduled_date: scheduledDate.toISOString().split("T")[0],
        notes: notes.trim() || undefined,
      });
      setShowForm(false);
      setRecipeName(""); setBatchSize(""); setUnit("units"); setNotes("");
      Alert.alert("Created", "Production batch planned");
    } catch (e: any) { Alert.alert("Error", e.message); }
    finally { setSaving(false); }
  };

  const handleStatusChange = (batch: ProductionBatch, newStatus: string) => {
    if (newStatus === "completed") {
      setYieldBatchId(batch.id);
      setYieldAmount(batch.batch_size.toString());
      setYieldUnit(batch.unit || "units");
      setYieldNotes("");
      setShowYield(true);
    } else {
      updateBatch.mutate({ id: batch.id, status: newStatus });
    }
  };

  const handleRecordYield = async () => {
    setSaving(true);
    try {
      await updateBatch.mutateAsync({
        id: yieldBatchId,
        status: "completed",
        yield_amount: yieldAmount ? Number(yieldAmount) : undefined,
        yield_unit: yieldUnit || undefined,
        notes: yieldNotes.trim() || undefined,
        completed_at: new Date().toISOString(),
      });
      setShowYield(false);
      Alert.alert("Completed", "Batch marked as completed");
    } catch (e: any) { Alert.alert("Error", e.message); }
    finally { setSaving(false); }
  };

  const handleLongPress = (batch: ProductionBatch) => {
    const options: { text: string; onPress?: () => void; style?: "destructive" | "cancel" }[] = [];
    if (batch.status === "planned") {
      options.push({ text: "Start Production", onPress: () => handleStatusChange(batch, "in-progress") });
    }
    if (batch.status === "in-progress") {
      options.push({ text: "Complete & Record Yield", onPress: () => handleStatusChange(batch, "completed") });
    }
    if (batch.status !== "cancelled" && batch.status !== "completed") {
      options.push({ text: "Cancel Batch", style: "destructive", onPress: () => updateBatch.mutate({ id: batch.id, status: "cancelled" }) });
    }
    options.push({ text: "Delete", style: "destructive", onPress: () => {
      Alert.alert("Delete Batch", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteBatch.mutate(batch.id) },
      ]);
    }});
    options.push({ text: "Cancel", style: "cancel" });
    Alert.alert(batch.recipe_name || "Batch", "What would you like to do?", options);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Production" />

      <View style={{ flexDirection: "row", paddingHorizontal: 16, gap: 10, marginBottom: 12 }}>
        <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 14, alignItems: "center" }}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>{stats.planned}</Text>
          <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Planned</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.accentBg, borderRadius: 12, padding: 14, alignItems: "center" }}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.accent }}>{stats.inProgress}</Text>
          <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>In Progress</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.successBg, borderRadius: 12, padding: 14, alignItems: "center" }}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.success }}>{stats.completed}</Text>
          <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Completed</Text>
        </View>
      </View>

      <TabBar
        tabs={[{ key: "active", label: "Active" }, { key: "completed", label: "Completed" }, { key: "all", label: "All" }]}
        activeTab={tab} onTabChange={setTab} style={{ marginHorizontal: 16, marginBottom: 12 }}
      />

      {isLoading ? (
        <View style={{ padding: 16, gap: 10 }}><SkeletonCard /><SkeletonCard /><SkeletonCard /></View>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Factory size={32} color={colors.textMuted} />} title="No production batches" description="Tap + to create a production batch" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                if (item.status === "planned") handleStatusChange(item, "in-progress");
                else if (item.status === "in-progress") handleStatusChange(item, "completed");
              }}
              onLongPress={() => handleLongPress(item)}
              style={{ paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{item.recipe_name || "Unnamed Batch"}</Text>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>{item.batch_size} {item.unit || "units"}</Text>
                    {item.scheduled_date && <Text style={{ fontSize: 12, color: colors.textMuted }}>• {item.scheduled_date}</Text>}
                  </View>
                </View>
                <Badge variant={STATUS_BADGES[item.status] || "secondary"}>{item.status.replace("-", " ")}</Badge>
              </View>
              {item.yield_amount != null && (
                <Text style={{ fontSize: 12, color: colors.success, fontWeight: "600", marginTop: 8 }}>Yield: {item.yield_amount} {item.yield_unit || ""}</Text>
              )}
              {item.notes && <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 6 }}>{item.notes}</Text>}
            </Pressable>
          )}
        />
      )}

      <FAB onPress={() => { setRecipeName(""); setBatchSize(""); setUnit("units"); setScheduledDate(new Date()); setNotes(""); setShowForm(true); }} />

      <FormSheet visible={showForm} onClose={() => setShowForm(false)} onSave={handleCreate} title="New Production Batch" saving={saving}>
        <Input label="Recipe Name" value={recipeName} onChangeText={setRecipeName} placeholder="What are you making?" />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}><Input label="Batch Size" value={batchSize} onChangeText={setBatchSize} placeholder="10" keyboardType="numeric" /></View>
          <View style={{ flex: 1 }}><Input label="Unit" value={unit} onChangeText={setUnit} placeholder="kg, L, units" /></View>
        </View>
        <DatePicker label="Scheduled Date" value={scheduledDate} onChange={setScheduledDate} mode="date" />
        <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Any notes..." multiline />
      </FormSheet>

      <FormSheet visible={showYield} onClose={() => setShowYield(false)} onSave={handleRecordYield} title="Record Yield" saving={saving}>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}><Input label="Yield Amount" value={yieldAmount} onChangeText={setYieldAmount} placeholder="10" keyboardType="numeric" /></View>
          <View style={{ flex: 1 }}><Input label="Unit" value={yieldUnit} onChangeText={setYieldUnit} placeholder="kg, L, units" /></View>
        </View>
        <Input label="Notes" value={yieldNotes} onChangeText={setYieldNotes} placeholder="Completion notes..." multiline />
      </FormSheet>
    </SafeAreaView>
  );
}
