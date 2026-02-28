import { useState, useMemo } from "react";
import { View, Text, FlatList, Pressable, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useInventory, useCreateInventoryItem, useUpdateInventoryItem, useDeleteInventoryItem, type InventoryItem } from "../../../hooks/useInventory";
import { useTheme } from "../../../contexts/ThemeProvider";
import { Input } from "../../../components/ui/Input";
import { Badge } from "../../../components/ui/Badge";
import { TabBar } from "../../../components/ui/Tabs";
import { EmptyState } from "../../../components/ui/EmptyState";
import { SkeletonCard } from "../../../components/ui/Skeleton";
import { FAB } from "../../../components/ui/FAB";
import { FormSheet } from "../../../components/ui/FormSheet";
import { DatePicker } from "../../../components/ui/DatePicker";
import { Package, ClipboardList } from "lucide-react-native";

function isExpiringSoon(expiryDate: string | null): boolean {
  if (!expiryDate) return false;
  const diff = new Date(expiryDate).getTime() - Date.now();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

function isExpired(expiryDate: string | null): boolean {
  if (!expiryDate) return false;
  return new Date(expiryDate).getTime() < Date.now();
}

function InventoryRow({ item, onPress, onLongPress }: { item: InventoryItem; onPress: () => void; onLongPress: () => void }) {
  const { colors } = useTheme();
  const lowStock = item.min_stock != null && item.quantity != null && item.quantity < item.min_stock;
  const expired = isExpired(item.expiry_date);
  const expiring = isExpiringSoon(item.expiry_date);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={{
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
      }}
    >
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{item.name}</Text>
        <View style={{ flexDirection: "row", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
          {item.location && <Text style={{ fontSize: 12, color: colors.textMuted }}>{item.location}</Text>}
          {item.expiry_date && (
            <Text style={{ fontSize: 12, color: expired ? colors.destructive : expiring ? colors.warning : colors.textMuted }}>
              Exp: {item.expiry_date}
            </Text>
          )}
        </View>
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: lowStock ? colors.destructive : colors.text }}>
          {item.quantity ?? "\u2014"} {item.unit || ""}
        </Text>
        {lowStock && <Badge variant="destructive">Low</Badge>}
        {expired && <Badge variant="destructive">Expired</Badge>}
        {expiring && !expired && <Badge variant="warning">Expiring</Badge>}
      </View>
    </Pressable>
  );
}

export default function Inventory() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data: items, isLoading, refetch, isRefetching } = useInventory();
  const createItem = useCreateInventoryItem();
  const updateItem = useUpdateInventoryItem();
  const deleteItem = useDeleteInventoryItem();

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [stocktakeMode, setStocktakeMode] = useState(false);
  const [stocktakeCounts, setStocktakeCounts] = useState<Record<string, string>>({});
  const [stocktakeSaving, setStocktakeSaving] = useState(false);

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [location, setLocation] = useState("");
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [minStock, setMinStock] = useState("");
  const [batchNumber, setBatchNumber] = useState("");

  const locations = useMemo(() => {
    const locs = new Set((items || []).map((i) => i.location).filter(Boolean) as string[]);
    return [
      { key: "all", label: "All" },
      { key: "low_stock", label: "Low Stock" },
      { key: "expiring", label: "Expiring" },
      ...Array.from(locs).sort().slice(0, 4).map((l) => ({ key: l, label: l })),
    ];
  }, [items]);

  const filtered = useMemo(() => {
    if (!items) return [];
    let list = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q));
    }
    if (tab === "low_stock") {
      list = list.filter((i) => i.min_stock != null && i.quantity != null && i.quantity < i.min_stock);
    } else if (tab === "expiring") {
      list = list.filter((i) => isExpiringSoon(i.expiry_date) || isExpired(i.expiry_date));
    } else if (tab !== "all") {
      list = list.filter((i) => i.location === tab);
    }
    return list;
  }, [items, search, tab]);

  const resetForm = () => {
    setName(""); setQuantity(""); setUnit(""); setLocation("");
    setExpiryDate(null); setMinStock(""); setBatchNumber(""); setEditingItem(null);
  };

  const openCreate = () => { resetForm(); setShowForm(true); };

  const openEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setName(item.name || "");
    setQuantity(item.quantity?.toString() || "");
    setUnit(item.unit || "");
    setLocation(item.location || "");
    setExpiryDate(item.expiry_date ? new Date(item.expiry_date) : null);
    setMinStock(item.min_stock?.toString() || "");
    setBatchNumber(item.batch_number || "");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Error", "Name is required"); return; }
    setSaving(true);
    try {
      const data: any = {
        name: name.trim(),
        quantity: quantity ? Number(quantity) : null,
        unit: unit.trim() || null,
        location: location.trim() || null,
        expiry_date: expiryDate ? expiryDate.toISOString().split("T")[0] : null,
        min_stock: minStock ? Number(minStock) : null,
        batch_number: batchNumber.trim() || null,
      };
      if (editingItem) {
        await updateItem.mutateAsync({ id: editingItem.id, ...data });
      } else {
        await createItem.mutateAsync(data);
      }
      setShowForm(false); resetForm();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save");
    } finally { setSaving(false); }
  };

  const handleLongPress = (item: InventoryItem) => {
    Alert.alert(item.name, "What would you like to do?", [
      { text: "Edit", onPress: () => openEdit(item) },
      {
        text: "Delete", style: "destructive",
        onPress: () => {
          Alert.alert("Delete Item", `Delete "${item.name}"?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => deleteItem.mutateAsync(item.id).catch((e: any) => Alert.alert("Error", e.message)) },
          ]);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSaveStocktake = async () => {
    const entries = Object.entries(stocktakeCounts).filter(([_, v]) => v.trim() !== "");
    if (entries.length === 0) {
      Alert.alert("No Changes", "Enter at least one count to save");
      return;
    }
    setStocktakeSaving(true);
    try {
      for (const [id, countStr] of entries) {
        const quantity = parseFloat(countStr);
        if (!isNaN(quantity)) {
          await updateItem.mutateAsync({ id, quantity });
        }
      }
      Alert.alert("Stocktake Complete", `${entries.length} items updated`);
      setStocktakeMode(false);
      setStocktakeCounts({});
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save stocktake");
    } finally {
      setStocktakeSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {stocktakeMode && (
        <View style={{ backgroundColor: colors.accentBg, padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.accent }}>Stocktake Mode</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Enter counts for each item</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable onPress={() => { setStocktakeMode(false); setStocktakeCounts({}); }} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.surface }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary }}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleSaveStocktake} disabled={stocktakeSaving} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.accent, opacity: stocktakeSaving ? 0.6 : 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>{stocktakeSaving ? "Saving..." : "Save All"}</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={{ padding: 24, paddingBottom: 0 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Text style={{ fontSize: 28, fontWeight: "800", color: colors.text }}>Inventory</Text>
          <Pressable onPress={() => setStocktakeMode(true)} style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
            <ClipboardList size={14} color={colors.textSecondary} strokeWidth={1.5} />
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSecondary }}>Stocktake</Text>
          </Pressable>
        </View>
        <Input placeholder="Search inventory..." value={search} onChangeText={setSearch} containerStyle={{ marginBottom: 12 }} />
        <TabBar tabs={locations} activeTab={tab} onTabChange={setTab} style={{ marginBottom: 8 }} />
      </View>

      {isLoading ? (
        <View style={{ padding: 24, gap: 10 }}><SkeletonCard /><SkeletonCard /><SkeletonCard /></View>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Package size={40} color={colors.textMuted} strokeWidth={1.5} />} title={search || tab !== "all" ? "No items found" : "Inventory is empty"} description="Tap + to add inventory items" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          renderItem={({ item }) => (
            stocktakeMode ? (
              <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{item.name}</Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>Current: {item.quantity ?? "\u2014"} {item.unit || ""}</Text>
                </View>
                <View style={{ width: 80 }}>
                  <Input
                    value={stocktakeCounts[item.id] || ""}
                    onChangeText={(v) => setStocktakeCounts((prev) => ({ ...prev, [item.id]: v }))}
                    placeholder={item.quantity?.toString() || "0"}
                    keyboardType="decimal-pad"
                    containerStyle={{ marginBottom: 0 }}
                  />
                </View>
              </View>
            ) : (
              <InventoryRow item={item} onPress={() => openEdit(item)} onLongPress={() => handleLongPress(item)} />
            )
          )}
        />
      )}

      <FAB onPress={openCreate} />

      <FormSheet visible={showForm} onClose={() => { setShowForm(false); resetForm(); }} onSave={handleSave} title={editingItem ? "Edit Item" : "Add Inventory Item"} saving={saving}>
        <Input label="Name" value={name} onChangeText={setName} placeholder="Item name" />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}><Input label="Quantity" value={quantity} onChangeText={setQuantity} placeholder="10" keyboardType="decimal-pad" /></View>
          <View style={{ flex: 1 }}><Input label="Unit" value={unit} onChangeText={setUnit} placeholder="kg, L, ea" /></View>
        </View>
        <Input label="Location" value={location} onChangeText={setLocation} placeholder="Walk-in, Dry Store, etc." />
        <DatePicker label="Expiry Date" value={expiryDate || new Date()} onChange={setExpiryDate} mode="date" placeholder="Select expiry date" />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}><Input label="Min Stock" value={minStock} onChangeText={setMinStock} placeholder="5" keyboardType="numeric" /></View>
          <View style={{ flex: 1 }}><Input label="Batch #" value={batchNumber} onChangeText={setBatchNumber} placeholder="Optional" /></View>
        </View>
      </FormSheet>
    </SafeAreaView>
  );
}
