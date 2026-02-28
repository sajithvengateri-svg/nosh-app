import { useState, useMemo } from "react";
import { View, Text, FlatList, Pressable, RefreshControl, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { useOrg } from "../../../contexts/OrgProvider";
import { useTheme } from "../../../contexts/ThemeProvider";
import { useCreateIngredient, useUpdateIngredient, useDeleteIngredient } from "../../../hooks/useIngredientMutations";
import { useScanner } from "../../../hooks/useScanner";
import { Input } from "../../../components/ui/Input";
import { Badge } from "../../../components/ui/Badge";
import { TabBar } from "../../../components/ui/Tabs";
import { EmptyState } from "../../../components/ui/EmptyState";
import { SkeletonCard } from "../../../components/ui/Skeleton";
import { FAB } from "../../../components/ui/FAB";
import { FormSheet } from "../../../components/ui/FormSheet";
import { ImagePicker } from "../../../components/ui/ImagePicker";
import { Select } from "../../../components/ui/Select";
import { Carrot } from "lucide-react-native";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";

interface Ingredient {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
  cost_per_unit: number | null;
  supplier: string | null;
  par_level: number | null;
  current_stock: number | null;
  allergens: string[] | null;
  org_id: string | null;
}

const CATEGORIES = [
  { label: "All", value: "all" },
  { label: "Meat", value: "Meat" },
  { label: "Seafood", value: "Seafood" },
  { label: "Dairy", value: "Dairy" },
  { label: "Produce", value: "Produce" },
  { label: "Dry Goods", value: "Dry Goods" },
  { label: "Spices", value: "Spices" },
  { label: "Other", value: "Other" },
];

const UNITS = [
  { label: "kg", value: "kg" }, { label: "g", value: "g" },
  { label: "L", value: "L" }, { label: "mL", value: "mL" },
  { label: "ea", value: "ea" }, { label: "bunch", value: "bunch" },
  { label: "lb", value: "lb" }, { label: "oz", value: "oz" },
];

export default function Ingredients() {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const createIngredient = useCreateIngredient();
  const updateIngredient = useUpdateIngredient();
  const deleteIngredient = useDeleteIngredient();

  const { data: ingredients, isLoading, refetch, isRefetching } = useQuery<Ingredient[]>({
    queryKey: ["ingredients", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("ingredients")
        .select("*")
        .eq("org_id", orgId)
        .order("name");
      if (error) throw error;
      return (data as Ingredient[]) || [];
    },
    enabled: !!orgId,
  });

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Ingredient | null>(null);
  const [saving, setSaving] = useState(false);

  // Batch import state
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [batchItems, setBatchItems] = useState<{ name: string; unit: string; category: string }[]>([]);
  const [batchSaving, setBatchSaving] = useState(false);
  const docketScanner = useScanner<{ items?: { name: string; quantity?: number; unit?: string }[] }>("extract-ingredients-list");

  // Price update state
  const [priceItem, setPriceItem] = useState<any>(null);
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [newPrice, setNewPrice] = useState("");
  const [priceNote, setPriceNote] = useState("");
  const [priceSaving, setPriceSaving] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Other");
  const [unit, setUnit] = useState("kg");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [supplier, setSupplier] = useState("");
  const [parLevel, setParLevel] = useState("");
  const [currentStock, setCurrentStock] = useState("");

  const categories = useMemo(() => {
    const cats = new Set((ingredients || []).map((i) => i.category).filter(Boolean) as string[]);
    return [
      { key: "all", label: "All" },
      { key: "low_stock", label: "Low Stock" },
      ...Array.from(cats).sort().map((c) => ({ key: c, label: c })),
    ];
  }, [ingredients]);

  const filtered = useMemo(() => {
    if (!ingredients) return [];
    let list = ingredients;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q) || (i.supplier && i.supplier.toLowerCase().includes(q)));
    }
    if (catFilter === "low_stock") {
      list = list.filter((i) => i.par_level != null && i.current_stock != null && i.current_stock < i.par_level);
    } else if (catFilter !== "all") {
      list = list.filter((i) => i.category === catFilter);
    }
    return list;
  }, [ingredients, search, catFilter]);

  const resetForm = () => {
    setName(""); setCategory("Other"); setUnit("kg"); setCostPerUnit("");
    setSupplier(""); setParLevel(""); setCurrentStock(""); setEditingItem(null);
  };

  const openCreate = () => { resetForm(); setShowForm(true); };

  const openEdit = (item: Ingredient) => {
    setEditingItem(item);
    setName(item.name || "");
    setCategory(item.category || "Other");
    setUnit(item.unit || "kg");
    setCostPerUnit(item.cost_per_unit?.toString() || "");
    setSupplier(item.supplier || "");
    setParLevel(item.par_level?.toString() || "");
    setCurrentStock(item.current_stock?.toString() || "");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Error", "Name is required"); return; }
    setSaving(true);
    try {
      const data: any = {
        name: name.trim(), category, unit,
        cost_per_unit: costPerUnit ? Number(costPerUnit) : null,
        supplier: supplier.trim() || null,
        par_level: parLevel ? Number(parLevel) : null,
        current_stock: currentStock ? Number(currentStock) : null,
      };
      if (editingItem) {
        await updateIngredient.mutateAsync({ id: editingItem.id, ...data });
      } else {
        await createIngredient.mutateAsync(data);
      }
      setShowForm(false); resetForm();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save");
    } finally { setSaving(false); }
  };

  const handleLongPress = (item: Ingredient) => {
    Alert.alert(item.name, "What would you like to do?", [
      { text: "Edit", onPress: () => openEdit(item) },
      {
        text: "Update Price",
        onPress: () => openPriceUpdate(item),
      },
      {
        text: "Delete", style: "destructive",
        onPress: () => Alert.alert("Delete", `Delete "${item.name}"?`, [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => deleteIngredient.mutateAsync(item.id).catch((e: any) => Alert.alert("Error", e.message)) },
        ]),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const openPriceUpdate = (item: any) => {
    setPriceItem(item);
    setNewPrice(item.cost_per_unit?.toString() || "");
    setPriceNote("");
    setShowPriceForm(true);
  };

  const handlePriceUpdate = async () => {
    if (!newPrice || !priceItem) return;
    setPriceSaving(true);
    try {
      const price = parseFloat(newPrice);
      if (isNaN(price)) throw new Error("Invalid price");

      // Update the ingredient
      await updateIngredient.mutateAsync({
        id: priceItem.id,
        cost_per_unit: price,
      });

      // Log to price history
      await supabase.from("ingredient_price_history").insert({
        ingredient_id: priceItem.id,
        price,
        note: priceNote.trim() || null,
        org_id: orgId,
      });

      setShowPriceForm(false);
      Alert.alert("Updated", `Price updated to $${price.toFixed(2)}`);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update price");
    } finally {
      setPriceSaving(false);
    }
  };

  const handleDocketScan = async (base64: string) => {
    try {
      const data = await docketScanner.scan(base64);
      if (data?.items && data.items.length > 0) {
        setBatchItems(data.items.map((i: any) => ({ name: i.name || "", unit: i.unit || "", category: i.category || "" })));
      } else {
        Alert.alert("No Items", "Could not extract ingredients from the image");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Scan failed");
    }
  };

  const handleBatchSave = async () => {
    const valid = batchItems.filter((i) => i.name.trim());
    if (valid.length === 0) { Alert.alert("Error", "No valid items to import"); return; }
    setBatchSaving(true);
    try {
      for (const item of valid) {
        await createIngredient.mutateAsync({
          name: item.name.trim(),
          unit: item.unit.trim() || null,
          category: item.category.trim() || null,
        });
      }
      Alert.alert("Imported", `${valid.length} ingredients added`);
      setShowBatchImport(false);
      setBatchItems([]);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to import");
    } finally {
      setBatchSaving(false);
    }
  };

  const lowStock = (i: Ingredient) => i.par_level != null && i.current_stock != null && i.current_stock < i.par_level;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Ingredients" rightAction={
        <Pressable onPress={() => setShowBatchImport(true)} style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSecondary }}>Import</Text>
        </Pressable>
      } />
      <View style={{ padding: 24, paddingTop: 0, paddingBottom: 0 }}>
        <Input placeholder="Search ingredients..." value={search} onChangeText={setSearch} containerStyle={{ marginBottom: 12 }} />
        <TabBar tabs={categories} activeTab={catFilter} onTabChange={setCatFilter} accentColor={colors.accent} style={{ marginBottom: 8 }} />
      </View>

      {isLoading ? (
        <View style={{ padding: 24, gap: 10 }}><SkeletonCard /><SkeletonCard /><SkeletonCard /></View>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Carrot size={40} color={colors.textMuted} strokeWidth={1.5} />} title="No ingredients found" description="Tap + to add your first ingredient" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          renderItem={({ item }) => (
            <Pressable
              onLongPress={() => handleLongPress(item)}
              onPress={() => openEdit(item)}
              style={{
                flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
              }}
            >
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{item.name}</Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                  {item.category && <Text style={{ fontSize: 12, color: colors.textMuted }}>{item.category}</Text>}
                  {item.supplier && <Text style={{ fontSize: 12, color: colors.textMuted }}>{item.supplier}</Text>}
                  {item.cost_per_unit != null && (
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>${item.cost_per_unit.toFixed(2)}/{item.unit}</Text>
                  )}
                </View>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                {item.current_stock != null && (
                  <Text style={{ fontSize: 14, fontWeight: "600", color: lowStock(item) ? colors.destructive : colors.text }}>
                    {item.current_stock} {item.unit}
                  </Text>
                )}
                {lowStock(item) && <Badge variant="destructive">Low</Badge>}
              </View>
            </Pressable>
          )}
        />
      )}

      <FAB onPress={openCreate} />

      <FormSheet visible={showForm} onClose={() => { setShowForm(false); resetForm(); }} onSave={handleSave} title={editingItem ? "Edit Ingredient" : "Add Ingredient"} saving={saving}>
        <Input label="Name" value={name} onChangeText={setName} placeholder="Ingredient name" />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Select label="Category" value={category} onValueChange={setCategory} options={CATEGORIES.filter(c => c.value !== "all")} />
          </View>
          <View style={{ flex: 1 }}>
            <Select label="Unit" value={unit} onValueChange={setUnit} options={UNITS} />
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}><Input label="Cost per Unit ($)" value={costPerUnit} onChangeText={setCostPerUnit} placeholder="5.50" keyboardType="decimal-pad" /></View>
          <View style={{ flex: 1 }}><Input label="Par Level" value={parLevel} onChangeText={setParLevel} placeholder="10" keyboardType="numeric" /></View>
        </View>
        <Input label="Current Stock" value={currentStock} onChangeText={setCurrentStock} placeholder="Current quantity" keyboardType="decimal-pad" />
        <Input label="Supplier" value={supplier} onChangeText={setSupplier} placeholder="Supplier name" />
      </FormSheet>

      <FormSheet visible={showPriceForm} onClose={() => setShowPriceForm(false)} onSave={handlePriceUpdate} title="Update Price" saving={priceSaving}>
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 8 }}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{priceItem?.name}</Text>
          {priceItem?.cost_per_unit != null && (
            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>Current: ${priceItem.cost_per_unit.toFixed(2)} / {priceItem.unit || "unit"}</Text>
          )}
        </View>
        <Input label="New Price" value={newPrice} onChangeText={setNewPrice} placeholder="0.00" keyboardType="decimal-pad" />
        <Input label="Note (optional)" value={priceNote} onChangeText={setPriceNote} placeholder="e.g. New supplier, bulk discount" />
      </FormSheet>

      <FormSheet visible={showBatchImport} onClose={() => { setShowBatchImport(false); setBatchItems([]); docketScanner.reset(); }} onSave={handleBatchSave} title="Batch Import" saving={batchSaving}>
        {docketScanner.state === "idle" && batchItems.length === 0 && (
          <ImagePicker onImageSelected={handleDocketScan} label="Ingredient List Photo" buttonText="Scan List" />
        )}
        {docketScanner.scanning && (
          <View style={{ alignItems: "center", paddingVertical: 30 }}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 8 }}>Extracting ingredients...</Text>
          </View>
        )}
        {batchItems.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary }}>{batchItems.length} items found</Text>
            {batchItems.map((item, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 8 }}>
                <View style={{ flex: 2 }}>
                  <Input value={item.name} onChangeText={(v) => setBatchItems((prev) => prev.map((p, j) => j === i ? { ...p, name: v } : p))} placeholder="Name" />
                </View>
                <View style={{ flex: 1 }}>
                  <Input value={item.unit} onChangeText={(v) => setBatchItems((prev) => prev.map((p, j) => j === i ? { ...p, unit: v } : p))} placeholder="Unit" />
                </View>
              </View>
            ))}
          </View>
        )}
      </FormSheet>
    </SafeAreaView>
  );
}
