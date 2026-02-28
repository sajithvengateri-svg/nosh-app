import { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "../../contexts/ThemeProvider";
import { useOrg } from "../../contexts/OrgProvider";
import { useAuth } from "../../contexts/AuthProvider";
import { supabase } from "../../lib/supabase";
import { Card, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { ImagePicker } from "../ui/ImagePicker";
import {
  FlaskConical,
  Camera,
  Check,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react-native";

// ── Pre-filled common chemicals ─────────────────────────────────────
const DEFAULT_CHEMICALS = [
  { name: "Dish Detergent",    category: "Detergent" },
  { name: "Rinse Aid",         category: "Detergent" },
  { name: "Floor Cleaner",     category: "Floor Cleaner" },
  { name: "Sanitiser",         category: "Sanitiser" },
  { name: "Oven Cleaner",      category: "Oven Cleaner" },
  { name: "Hand Soap",         category: "General Cleaner" },
  { name: "Degreaser",         category: "Degreaser" },
  { name: "Glass Cleaner",     category: "Glass Cleaner" },
  { name: "Disinfectant",      category: "Disinfectant" },
  { name: "Surface Spray",     category: "General Cleaner" },
];

const CATEGORY_COLORS: Record<string, string> = {
  "General Cleaner": "#3B82F6",
  "Sanitiser":       "#10B981",
  "Degreaser":       "#F59E0B",
  "Detergent":       "#6366F1",
  "Disinfectant":    "#EF4444",
  "Floor Cleaner":   "#8B5CF6",
  "Glass Cleaner":   "#06B6D4",
  "Oven Cleaner":    "#F97316",
  "Other":           "#64748B",
};

// ── Row state ───────────────────────────────────────────────────────
interface ChemicalRow {
  id: string;
  name: string;
  category: string;
  location: string;
  quantity: string;
  unit: string;
  scanning: boolean;
  sdsUrl: string;
  isNew: boolean;
}

function makeRow(defaults?: Partial<ChemicalRow>): ChemicalRow {
  return {
    id: Math.random().toString(36).slice(2),
    name: "",
    category: "Other",
    location: "",
    quantity: "",
    unit: "litres",
    scanning: false,
    sdsUrl: "",
    isNew: true,
    ...defaults,
  };
}

// ── Component ───────────────────────────────────────────────────────
export function ChemicalGrid() {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const { isDevBypass } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();
  const queryKey = ["cleaning-inventory", orgId];

  // Fetch existing chemicals
  const { data: chemicals, isLoading, refetch } = useQuery<any[]>({
    queryKey,
    queryFn: async () => {
      if (!orgId) return [];
      if (isDevBypass) return queryClient.getQueryData<any[]>(queryKey) ?? [];
      const { data, error } = await supabase
        .from("cleaning_inventory")
        .select("*")
        .eq("org_id", orgId)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const [rows, setRows] = useState<ChemicalRow[]>([]);
  const [showSaved, setShowSaved] = useState(true);
  const [saving, setSaving] = useState(false);

  const updateRow = (id: string, field: keyof ChemicalRow, val: any) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const addRow = () => setRows((prev) => [...prev, makeRow()]);

  // Pre-fill missing chemicals from defaults
  const handlePreFill = () => {
    const existingNames = new Set([
      ...(chemicals ?? []).map((c: any) => c.name.toLowerCase()),
      ...rows.map((r) => r.name.toLowerCase()),
    ]);
    const missing = DEFAULT_CHEMICALS.filter(
      (d) => !existingNames.has(d.name.toLowerCase())
    );
    if (missing.length === 0) {
      Alert.alert("All Set", "All common chemicals are already in your inventory");
      return;
    }
    const newRows = missing.map((d) => makeRow({ name: d.name, category: d.category }));
    setRows((prev) => [...prev, ...newRows]);
  };

  // Camera scan — scan chemical label and extract name
  const handleScanLabel = async (rowId: string, base64: string) => {
    updateRow(rowId, "scanning", true);
    try {
      const { data, error } = await supabase.functions.invoke("scan-chemical-label", {
        body: { image_base64: base64, file_type: "image/jpeg" },
      });
      if (error) throw error;
      if (data?.product_name) {
        updateRow(rowId, "name", data.product_name);
      }
      if (data?.hazard_class) {
        // Map to nearest category
        const cat = data.hazard_class;
        if (CATEGORY_COLORS[cat]) updateRow(rowId, "category", cat);
      }
      if (data?.sds_url) {
        updateRow(rowId, "sdsUrl", data.sds_url);
      }
      if (!data?.product_name) {
        Alert.alert("No Result", "Could not read the label. Enter the name manually.");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to scan label");
    } finally {
      updateRow(rowId, "scanning", false);
    }
  };

  // Save all new rows
  const handleSaveAll = async () => {
    const filled = rows.filter((r) => r.name.trim());
    if (filled.length === 0) {
      Alert.alert("Nothing to Save", "Add at least one chemical name");
      return;
    }
    setSaving(true);
    try {
      const inserts = filled.map((r) => ({
        org_id: orgId,
        name: r.name.trim(),
        category: r.category || "Other",
        quantity: parseFloat(r.quantity) || 0,
        unit: r.unit || "each",
        location: r.location || "Storage",
        sds_url: r.sdsUrl || null,
        notes: null,
      }));

      if (isDevBypass) {
        queryClient.setQueryData<any[]>(queryKey, (prev) => [
          ...(prev ?? []),
          ...inserts.map((ins, i) => ({ ...ins, id: `dev-chem-${Date.now()}-${i}`, created_at: new Date().toISOString() })),
        ]);
      } else {
        const { error } = await supabase.from("cleaning_inventory").insert(inserts);
        if (error) throw error;
      }

      setRows([]);
      await queryClient.invalidateQueries({ queryKey });
      await refetch();
      Alert.alert("Saved", `${filled.length} chemical${filled.length > 1 ? "s" : ""} added`);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const savedCount = chemicals?.length ?? 0;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
      >
        {/* ── Inventory count ────────────────────────────────────── */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <FlaskConical size={16} color={colors.textSecondary} strokeWidth={1.5} />
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
              {savedCount} Chemical{savedCount !== 1 ? "s" : ""} Registered
            </Text>
          </View>
          <Pressable
            onPress={handlePreFill}
            style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: colors.accentBg }}
          >
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.accent }}>Pre-fill Defaults</Text>
          </Pressable>
        </View>

        {/* ── Saved chemicals (collapsible) ───────────────────── */}
        {savedCount > 0 && (
          <>
            <Pressable
              onPress={() => setShowSaved(!showSaved)}
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Inventory
              </Text>
              {showSaved ? (
                <ChevronUp size={16} color={colors.textMuted} strokeWidth={1.5} />
              ) : (
                <ChevronDown size={16} color={colors.textMuted} strokeWidth={1.5} />
              )}
            </Pressable>

            {showSaved && chemicals?.map((chem: any) => {
              const catColor = CATEGORY_COLORS[chem.category] ?? CATEGORY_COLORS.Other;
              const hasSds = !!chem.sds_url;
              return (
                <Card key={chem.id} style={{ marginBottom: 6 }}>
                  <CardContent style={{ paddingTop: 12, paddingBottom: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: catColor + "20", justifyContent: "center", alignItems: "center", marginRight: 10 }}>
                        <FlaskConical size={16} color={catColor} strokeWidth={1.5} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{chem.name}</Text>
                        <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
                          {chem.category}{chem.location ? ` · ${chem.location}` : ""}{chem.quantity ? ` · ${chem.quantity} ${chem.unit}` : ""}
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        {hasSds ? (
                          <Badge variant="success">SDS</Badge>
                        ) : (
                          <Badge variant="warning">No SDS</Badge>
                        )}
                      </View>
                    </View>
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}

        {/* ── Section divider ─────────────────────────────────── */}
        {(savedCount > 0 || rows.length > 0) && (
          <View style={{ marginTop: 12, marginBottom: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Add New
            </Text>
          </View>
        )}

        {/* ── Editable rows ──────────────────────────────────── */}
        {rows.map((row) => {
          const catColor = CATEGORY_COLORS[row.category] ?? CATEGORY_COLORS.Other;
          return (
            <Card key={row.id} style={{ marginBottom: 8, borderWidth: 1, borderColor: colors.accent + "30" }}>
              <CardContent style={{ paddingTop: 12, paddingBottom: 12, gap: 8 }}>
                {/* Row 1: Name + Camera scan */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: catColor + "20", justifyContent: "center", alignItems: "center" }}>
                    <FlaskConical size={16} color={catColor} strokeWidth={1.5} />
                  </View>
                  <TextInput
                    value={row.name}
                    onChangeText={(t) => updateRow(row.id, "name", t)}
                    placeholder="Chemical name"
                    placeholderTextColor={colors.textMuted}
                    style={{
                      flex: 1, fontSize: 14, fontWeight: "600", color: colors.text,
                      backgroundColor: colors.surface, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
                      borderWidth: 1, borderColor: colors.border,
                    }}
                  />
                  {/* Camera to scan label */}
                  {row.scanning ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <ImagePicker
                      onImageSelected={(b64) => handleScanLabel(row.id, b64)}
                      cameraOnly
                      compact
                      renderButton={({ onPress, loading }) => (
                        <Pressable
                          onPress={onPress}
                          disabled={loading}
                          style={{
                            width: 36, height: 36, borderRadius: 10,
                            backgroundColor: colors.accentBg, justifyContent: "center", alignItems: "center",
                            borderWidth: 1, borderColor: colors.accent + "30",
                          }}
                        >
                          {loading ? (
                            <ActivityIndicator size="small" color={colors.accent} />
                          ) : (
                            <Camera size={18} color={colors.accent} strokeWidth={2} />
                          )}
                        </Pressable>
                      )}
                    />
                  )}
                  <Pressable onPress={() => removeRow(row.id)} hitSlop={8} style={{ padding: 4 }}>
                    <Trash2 size={16} color={colors.textMuted} strokeWidth={1.5} />
                  </Pressable>
                </View>

                {/* Row 2: Category pills */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {Object.keys(CATEGORY_COLORS).map((cat) => {
                    const active = row.category === cat;
                    const cc = CATEGORY_COLORS[cat];
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => updateRow(row.id, "category", cat)}
                        style={{
                          paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
                          backgroundColor: active ? cc : colors.surface,
                          borderWidth: 1, borderColor: active ? cc : colors.border,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: "600", color: active ? "#FFFFFF" : colors.textSecondary }}>
                          {cat}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* Row 3: Location + Quantity */}
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TextInput
                    value={row.location}
                    onChangeText={(t) => updateRow(row.id, "location", t)}
                    placeholder="Location"
                    placeholderTextColor={colors.textMuted}
                    style={{
                      flex: 1, fontSize: 13, color: colors.text,
                      backgroundColor: colors.surface, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7,
                      borderWidth: 1, borderColor: colors.border,
                    }}
                  />
                  <TextInput
                    value={row.quantity}
                    onChangeText={(t) => updateRow(row.id, "quantity", t)}
                    placeholder="Qty"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    style={{
                      width: 60, fontSize: 13, color: colors.text, textAlign: "center",
                      backgroundColor: colors.surface, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 7,
                      borderWidth: 1, borderColor: colors.border,
                    }}
                  />
                  <TextInput
                    value={row.unit}
                    onChangeText={(t) => updateRow(row.id, "unit", t)}
                    placeholder="Unit"
                    placeholderTextColor={colors.textMuted}
                    style={{
                      width: 70, fontSize: 13, color: colors.text,
                      backgroundColor: colors.surface, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 7,
                      borderWidth: 1, borderColor: colors.border,
                    }}
                  />
                </View>
              </CardContent>
            </Card>
          );
        })}

        {/* Add row button */}
        <Pressable
          onPress={addRow}
          style={{
            flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
            paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderStyle: "dashed",
            borderColor: colors.accent + "50", marginBottom: 8,
          }}
        >
          <Plus size={16} color={colors.accent} strokeWidth={2} />
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.accent }}>Add Chemical</Text>
        </Pressable>

        {/* Save All */}
        {rows.some((r) => r.name.trim()) && (
          <Pressable
            onPress={handleSaveAll}
            disabled={saving}
            style={{
              flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
              paddingVertical: 14, borderRadius: 12, backgroundColor: colors.accent,
              opacity: saving ? 0.6 : 1, marginBottom: 8,
            }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Check size={18} color="#FFFFFF" strokeWidth={2} />
            )}
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>Save All</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
