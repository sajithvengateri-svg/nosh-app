import { useState } from "react";
import { View, Text, FlatList, Pressable, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react-native";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { useOrg } from "../../../contexts/OrgProvider";
import { useTheme } from "../../../contexts/ThemeProvider";
import { supabase } from "../../../lib/supabase";
import { ImagePicker } from "../../../components/ui/ImagePicker";
import { Input } from "../../../components/ui/Input";
import { useScanner } from "../../../hooks/useScanner";
import { useIngredients } from "../../../hooks/useIngredients";

interface InvoiceLineItem {
  name: string;
  quantity: number | null;
  unit: string | null;
  price: number | null;
  matched_ingredient_id?: string | null;
  matched_ingredient_name?: string | null;
  confidence?: number;
}

export default function InvoiceScan() {
  const router = useRouter();
  const { currentOrg } = useOrg();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const { state, scan, results, error, reset, scanning } = useScanner<{ supplier?: string; date?: string; items?: InvoiceLineItem[]; total?: number }>("extract-invoice");
  const [editedItems, setEditedItems] = useState<InvoiceLineItem[]>([]);
  const { data: ingredients } = useIngredients();

  const handleImage = async (base64: string) => {
    const data = await scan(base64, { existing_ingredients: ingredients || [] });
    if (data?.items) setEditedItems(data.items);
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!currentOrg?.id) throw new Error("No org");
      const items = editedItems.filter((i) => i.name?.trim());
      if (items.length === 0) throw new Error("No items to import");
      const rows = items.map((item) => ({
        name: item.name.trim(),
        quantity: item.quantity,
        unit: item.unit || null,
        cost_per_unit: item.price,
        org_id: currentOrg.id,
      }));
      const { error } = await supabase.from("inventory").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      Alert.alert("Imported", `${editedItems.length} items added to inventory`);
      router.back();
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const updateItem = (idx: number, field: keyof InvoiceLineItem, value: string) => {
    setEditedItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: field === "quantity" || field === "price" ? (value ? Number(value) : null) : value } : item));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Scan Invoice" />

      {state === "idle" && (
        <View style={{ padding: 24, gap: 20 }}>
          <View style={{ backgroundColor: colors.accentBg, borderRadius: 12, padding: 14 }}>
            <Text style={{ fontSize: 14, color: colors.accent, lineHeight: 20 }}>Take a photo of your invoice or delivery docket. We'll extract the items, quantities, and prices automatically.</Text>
          </View>
          <ImagePicker onImageSelected={handleImage} label="Invoice Photo" buttonText="Scan Invoice" />
        </View>
      )}

      {state === "processing" && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={{ fontSize: 16, color: colors.textSecondary }}>Extracting invoice data...</Text>
        </View>
      )}

      {state === "error" && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 24 }}>
          <AlertTriangle size={40} color={colors.destructive} strokeWidth={1.5} />
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.destructive }}>Scan Failed</Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center" }}>{error}</Text>
          <Pressable onPress={reset} style={{ backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 }}>
            <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Try Again</Text>
          </Pressable>
        </View>
      )}

      {state === "results" && (
        <View style={{ flex: 1 }}>
          {results?.supplier && (
            <View style={{ padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>Supplier: <Text style={{ fontWeight: "600", color: colors.text }}>{results.supplier}</Text></Text>
              {results.date && <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>Date: {results.date}</Text>}
              {results.total != null && <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>Total: ${results.total.toFixed(2)}</Text>}
            </View>
          )}
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary, paddingHorizontal: 16, paddingTop: 12 }}>{editedItems.length} items found</Text>
          <FlatList
            data={editedItems}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 10 }}
            renderItem={({ item, index }) => (
              <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 12, gap: 8 }}>
                <Input value={item.name} onChangeText={(v) => updateItem(index, "name", v)} placeholder="Item name" />
                {item.matched_ingredient_id && (
                  <Text style={{ fontSize: 11, color: colors.success, fontWeight: "600", marginBottom: 4 }}>
                    Matched: {item.matched_ingredient_name || "Known ingredient"} ({Math.round((item.confidence || 0) * 100)}%)
                  </Text>
                )}
                {!item.matched_ingredient_id && item.name && (
                  <Text style={{ fontSize: 11, color: colors.warning, fontWeight: "600", marginBottom: 4 }}>
                    New ingredient — will be created on import
                  </Text>
                )}
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <View style={{ flex: 1 }}><Input value={item.quantity?.toString() || ""} onChangeText={(v) => updateItem(index, "quantity", v)} placeholder="Qty" keyboardType="decimal-pad" /></View>
                  <View style={{ flex: 1 }}><Input value={item.unit || ""} onChangeText={(v) => updateItem(index, "unit", v)} placeholder="Unit" /></View>
                  <View style={{ flex: 1 }}><Input value={item.price?.toString() || ""} onChangeText={(v) => updateItem(index, "price", v)} placeholder="Price" keyboardType="decimal-pad" /></View>
                </View>
              </View>
            )}
          />
          <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 34, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: "row", gap: 12 }}>
            <Pressable onPress={reset} style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
              <Text style={{ fontWeight: "600", color: colors.textSecondary }}>Scan Again</Text>
            </Pressable>
            <Pressable onPress={() => importMutation.mutate()} disabled={importMutation.isPending} style={{ flex: 1, backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: "center", opacity: importMutation.isPending ? 0.6 : 1 }}>
              {importMutation.isPending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ fontWeight: "700", color: "#FFFFFF" }}>Import All</Text>}
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
