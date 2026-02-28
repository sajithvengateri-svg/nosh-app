import { useState } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useOrg } from "../../contexts/OrgProvider";
import { useAuth } from "../../contexts/AuthProvider";
import { useTheme } from "../../contexts/ThemeProvider";
import { Badge } from "../ui/Badge";
import { X, Check, CheckCircle2, Sparkles } from "lucide-react-native";

interface ApprovedSupplierSeedProps {
  visible: boolean;
  onClose: () => void;
}

const AU_SUPPLIERS = [
  { name: "Bidfood", products: "Broad range, Frozen, Dry goods" },
  { name: "PFD Food Services", products: "Meat, Dairy, Produce, Dry goods" },
  { name: "Countrywide Food Service", products: "Smallgoods, Dairy, Dry goods" },
  { name: "Caterlink / Entice", products: "Full range foodservice" },
  { name: "Riviana Foods", products: "Rice, Pasta, Grains" },
  { name: "Simplot (Birds Eye, Edgell)", products: "Frozen vegetables, Chips" },
  { name: "Peters Ice Cream", products: "Ice cream, Frozen desserts" },
  { name: "Tip Top Bakeries", products: "Bread, Buns, Bakery" },
  { name: "Andrews Meat Industries", products: "Meat, Smallgoods" },
  { name: "Primo Foods", products: "Smallgoods, Ham, Deli meats" },
  { name: "Fonterra (Mainland)", products: "Dairy, Cheese, Butter" },
  { name: "Bega Cheese", products: "Cheese, Dairy spreads" },
];

export function ApprovedSupplierSeed({ visible, onClose }: ApprovedSupplierSeedProps) {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(AU_SUPPLIERS.map((_, i) => i)));
  const clearAll = () => setSelected(new Set());

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No org");
      const toInsert = AU_SUPPLIERS.filter((_, i) => selected.has(i)).map((s) => ({
        org_id: orgId,
        supplier_name: s.name,
        products_supplied: s.products,
        is_approved: true,
        created_by: user?.id,
      }));
      if (toInsert.length === 0) throw new Error("Select at least one supplier");
      const { error } = await supabase.from("bcc_supplier_register").insert(toInsert);
      if (error) throw error;

      // Trigger async enrichment for each (non-blocking)
      for (const s of AU_SUPPLIERS.filter((_, i) => selected.has(i))) {
        supabase.functions.invoke("enrich-supplier", {
          body: { supplier_name: s.name },
        }).catch(() => {});
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bcc-supplier-register"] });
      Alert.alert("Imported", `${selected.size} suppliers imported. AI enrichment running in background.`);
      setSelected(new Set());
      onClose();
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>Import Common Suppliers</Text>
          <Pressable onPress={onClose} hitSlop={12}><X size={22} color={colors.textMuted} /></Pressable>
        </View>

        {/* Select/Clear bar */}
        <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, gap: 12 }}>
          <Pressable onPress={selectAll} style={{ backgroundColor: colors.accentBg, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.accent }}>Select All</Text>
          </Pressable>
          <Pressable onPress={clearAll} style={{ backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary }}>Clear</Text>
          </Pressable>
          <View style={{ flex: 1 }} />
          <Badge variant="default">{selected.size} selected</Badge>
        </View>

        {/* Supplier list */}
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 8 }}>
          {AU_SUPPLIERS.map((s, idx) => {
            const isSelected = selected.has(idx);
            return (
              <Pressable
                key={idx}
                onPress={() => toggle(idx)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isSelected ? colors.successBg : colors.card,
                  borderRadius: 12,
                  padding: 14,
                  borderWidth: 2,
                  borderColor: isSelected ? colors.success : colors.border,
                  gap: 12,
                }}
              >
                <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: isSelected ? colors.success : colors.border, backgroundColor: isSelected ? colors.success : "transparent", alignItems: "center", justifyContent: "center" }}>
                  {isSelected && <Check size={14} color="#fff" strokeWidth={3} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{s.name}</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{s.products}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Import button */}
        <View style={{ padding: 16, borderTopWidth: 1, borderColor: colors.border }}>
          <Pressable
            onPress={() => importMutation.mutate()}
            disabled={selected.size === 0 || importMutation.isPending}
            style={{
              backgroundColor: selected.size > 0 ? colors.accent : colors.surface,
              borderRadius: 12,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: importMutation.isPending ? 0.6 : 1,
            }}
          >
            {importMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Sparkles size={18} color={selected.size > 0 ? "#fff" : colors.textMuted} />
            )}
            <Text style={{ fontSize: 16, fontWeight: "700", color: selected.size > 0 ? "#fff" : colors.textMuted }}>
              {importMutation.isPending ? "Importing..." : `Import ${selected.size} Supplier${selected.size !== 1 ? "s" : ""}`}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
