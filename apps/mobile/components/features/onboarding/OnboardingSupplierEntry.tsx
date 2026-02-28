import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { useOrg } from "../../../contexts/OrgProvider";
import { useAuth } from "../../../contexts/AuthProvider";
import { useTheme } from "../../../contexts/ThemeProvider";
import { useSuppliers } from "../../../hooks/useReceiving";
import { Input } from "../../ui/Input";
import { Badge } from "../../ui/Badge";
import {
  Building2,
  Plus,
  Check,
  Package,
  Sparkles,
} from "lucide-react-native";

// ── Pre-seeded common suppliers ─────────────────────────────────────

const COMMON_SUPPLIERS = [
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

interface OnboardingSupplierEntryProps {
  onComplete: () => void;
}

export function OnboardingSupplierEntry({ onComplete }: OnboardingSupplierEntryProps) {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const { user, isDevBypass } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();
  const { suppliers, refetch } = useSuppliers();

  const [tab, setTab] = useState<"import" | "manual">("import");
  const [selectedSeeds, setSelectedSeeds] = useState<Set<number>>(new Set());

  // Manual entry state
  const [manualName, setManualName] = useState("");
  const [manualProducts, setManualProducts] = useState("");
  const [manualContact, setManualContact] = useState("");

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async () => {
      if (!orgId || !user) throw new Error("Not ready");
      const rows = Array.from(selectedSeeds).map((idx) => ({
        org_id: orgId,
        supplier_name: COMMON_SUPPLIERS[idx].name,
        products_supplied: COMMON_SUPPLIERS[idx].products,
        is_approved: true,
        created_by: user.id,
      }));
      if (isDevBypass) {
        queryClient.setQueryData(["suppliers", orgId], (prev: any) => [
          ...(prev || []),
          ...rows.map((r, i) => ({ ...r, id: `dev-supplier-${Date.now()}-${i}` })),
        ]);
        return;
      }
      const { error } = await supabase.from("bcc_supplier_register").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
      setSelectedSeeds(new Set());
      Alert.alert("Imported", `${selectedSeeds.size} suppliers added`);
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  // Manual add mutation
  const addMutation = useMutation({
    mutationFn: async () => {
      if (!orgId || !user) throw new Error("Not ready");
      if (!manualName.trim()) throw new Error("Supplier name is required");
      const row = {
        org_id: orgId,
        supplier_name: manualName.trim(),
        products_supplied: manualProducts.trim() || null,
        contact_name: manualContact.trim() || null,
        is_approved: true,
        created_by: user.id,
      };
      if (isDevBypass) {
        queryClient.setQueryData(["suppliers", orgId], (prev: any) => [
          ...(prev || []),
          { ...row, id: `dev-supplier-${Date.now()}` },
        ]);
        return;
      }
      const { error } = await supabase.from("bcc_supplier_register").insert(row);
      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
      setManualName("");
      setManualProducts("");
      setManualContact("");
      Alert.alert("Added", "Supplier added successfully");
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const toggleSeed = (idx: number) => {
    setSelectedSeeds((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Current suppliers count */}
      {suppliers.length > 0 && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: "#10B981" + "15",
            borderRadius: 12,
            padding: 12,
            marginHorizontal: 16,
            marginBottom: 12,
          }}
        >
          <Check size={16} color="#10B981" strokeWidth={2} />
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#10B981" }}>
            {suppliers.length} approved supplier{suppliers.length !== 1 ? "s" : ""} added
          </Text>
        </View>
      )}

      {/* Tab toggle */}
      <View
        style={{
          flexDirection: "row",
          marginHorizontal: 16,
          marginBottom: 16,
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 4,
        }}
      >
        {([
          { key: "import" as const, label: "Import Common" },
          { key: "manual" as const, label: "Direct Entry" },
        ]).map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 10,
              alignItems: "center",
              backgroundColor: tab === t.key ? colors.card : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: tab === t.key ? colors.text : colors.textMuted,
              }}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {tab === "import" ? (
          <View style={{ gap: 8 }}>
            {COMMON_SUPPLIERS.map((s, idx) => {
              const isSelected = selectedSeeds.has(idx);
              return (
                <Pressable
                  key={idx}
                  onPress={() => toggleSeed(idx)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    backgroundColor: isSelected ? colors.accentBg : colors.card,
                    borderRadius: 12,
                    padding: 14,
                    borderWidth: 1.5,
                    borderColor: isSelected ? colors.accent : colors.border,
                  }}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: isSelected ? colors.accent : colors.border,
                      backgroundColor: isSelected ? colors.accent : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isSelected && <Check size={14} color="#FFF" strokeWidth={2.5} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                      {s.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                      {s.products}
                    </Text>
                  </View>
                </Pressable>
              );
            })}

            {selectedSeeds.size > 0 && (
              <Pressable
                onPress={() => importMutation.mutate()}
                disabled={importMutation.isPending}
                style={{
                  backgroundColor: colors.accent,
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: "center",
                  marginTop: 8,
                  opacity: importMutation.isPending ? 0.6 : 1,
                }}
              >
                {importMutation.isPending ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFF" }}>
                    Import {selectedSeeds.size} Supplier{selectedSeeds.size !== 1 ? "s" : ""}
                  </Text>
                )}
              </Pressable>
            )}
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            <Input
              label="Supplier Name"
              value={manualName}
              onChangeText={setManualName}
              placeholder="e.g. Local Produce Co"
              autoCapitalize="words"
            />
            <Input
              label="Products Supplied"
              value={manualProducts}
              onChangeText={setManualProducts}
              placeholder="e.g. Meat, Dairy, Produce"
              autoCapitalize="sentences"
            />
            <Input
              label="Contact Name (optional)"
              value={manualContact}
              onChangeText={setManualContact}
              placeholder="Sales rep name"
              autoCapitalize="words"
            />
            <Pressable
              onPress={() => addMutation.mutate()}
              disabled={addMutation.isPending || !manualName.trim()}
              style={{
                backgroundColor: colors.accent,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
                opacity: addMutation.isPending || !manualName.trim() ? 0.5 : 1,
              }}
            >
              {addMutation.isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFF" }}>
                  Add Supplier
                </Text>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
