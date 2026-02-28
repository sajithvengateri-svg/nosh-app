import { useState, useCallback } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator, TextInput, Platform } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Trash2 } from "lucide-react-native";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { Badge } from "../../../components/ui/Badge";
import { supabase } from "../../../lib/supabase";
import { useOrg } from "../../../contexts/OrgProvider";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ImagePicker } from "../../../components/ui/ImagePicker";
import { useScanner } from "../../../hooks/useScanner";

interface DocketItem {
  name: string;
  quantity?: number;
  unit?: string;
  temperature?: number;
}

interface DocketData {
  supplier?: string;
  date?: string;
  items?: DocketItem[];
  notes?: string;
}

function getDocketStatus(items?: DocketItem[]): "pass" | "fail" | "warning" {
  if (!items || items.length === 0) return "pass";
  const hasOutOfRange = items.some(
    (item) => item.temperature != null && item.temperature > 5
  );
  if (hasOutOfRange) return "fail";
  return "pass";
}

export default function ScanDocket() {
  const router = useRouter();
  const { currentOrg } = useOrg();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const { state, scan, results, error, reset } = useScanner<DocketData>("scan-docket");

  // Editable fields — initialized from scan results
  const [editSupplier, setEditSupplier] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editItems, setEditItems] = useState<DocketItem[]>([]);
  const [editNotes, setEditNotes] = useState("");

  const handleImage = (base64: string) => { scan(base64); };

  // Populate editable state when results arrive
  const populateFromResults = useCallback((data: DocketData) => {
    setEditSupplier(data.supplier || "");
    setEditDate(data.date || new Date().toISOString().split("T")[0]);
    setEditItems(data.items?.map((i) => ({ ...i })) || []);
    setEditNotes(data.notes || "");
  }, []);

  // Track if we've populated (since useScanner doesn't reset between scans cleanly)
  const [populated, setPopulated] = useState(false);
  if (state === "results" && results && !populated) {
    populateFromResults(results);
    setPopulated(true);
  }
  if (state !== "results" && populated) {
    setPopulated(false);
  }

  const updateItem = (index: number, field: keyof DocketItem, value: string) => {
    setEditItems((prev) => {
      const updated = [...prev];
      if (field === "quantity" || field === "temperature") {
        (updated[index] as any)[field] = value ? parseFloat(value) : undefined;
      } else {
        (updated[index] as any)[field] = value;
      }
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setEditItems((prev) => prev.filter((_, i) => i !== index));
  };

  const computedStatus = getDocketStatus(editItems);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!currentOrg?.id) throw new Error("No data");
      const finalData: DocketData = {
        supplier: editSupplier || undefined,
        date: editDate || undefined,
        items: editItems,
        notes: editNotes || undefined,
      };
      const { error } = await supabase.from("food_safety_logs").insert({
        log_type: "docket_scan",
        location: editSupplier || "Unknown Supplier",
        readings: finalData,
        status: computedStatus,
        date: editDate || new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().split(" ")[0],
        org_id: currentOrg.id,
        notes: `Scanned docket from ${editSupplier || "unknown"}. ${editItems.length} items.${computedStatus === "fail" ? " TEMP OUT OF RANGE." : ""}`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-safety-logs"] });
      Alert.alert("Saved", computedStatus === "fail"
        ? "Docket recorded with temperature alerts. Review corrective actions."
        : "Docket scan recorded");
      router.back();
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Scan Docket" />

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 24, gap: 20 }}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={Platform.OS === "ios" ? 20 : 80}
        enableAutomaticScroll
        enableResetScrollToCoords={false}
      >
        {state === "idle" && (
          <>
            <View style={{ backgroundColor: colors.accentBg, borderRadius: 12, padding: 14 }}>
              <Text style={{ fontSize: 14, color: colors.accent, lineHeight: 20 }}>Take a photo of the delivery docket to extract supplier info, items, and temperature readings.</Text>
            </View>
            <ImagePicker onImageSelected={handleImage} label="Delivery Docket" buttonText="Scan Docket" />
          </>
        )}
        {state === "processing" && (
          <View style={{ alignItems: "center", paddingVertical: 60, gap: 16 }}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={{ fontSize: 16, color: colors.textSecondary }}>Processing docket...</Text>
          </View>
        )}
        {state === "error" && (
          <View style={{ alignItems: "center", paddingVertical: 40, gap: 16 }}>
            <AlertTriangle size={40} color={colors.destructive} />
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.destructive }}>Scan Failed</Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center" }}>{error}</Text>
            <Pressable onPress={reset} style={{ backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 }}>
              <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Try Again</Text>
            </Pressable>
          </View>
        )}
        {state === "results" && results && (
          <>
            {/* Status banner */}
            {computedStatus === "fail" && (
              <View style={{ backgroundColor: colors.destructiveBg || "#FEE2E2", borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
                <AlertTriangle size={20} color={colors.destructive} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.destructive }}>Temperature Alert</Text>
                  <Text style={{ fontSize: 12, color: colors.destructive, marginTop: 2 }}>
                    One or more items received above 5°C. Check and correct below.
                  </Text>
                </View>
              </View>
            )}

            {/* Editable supplier + date */}
            <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, gap: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>Docket Details</Text>
                <Badge variant={computedStatus === "pass" ? "success" : "destructive"}>
                  {computedStatus.toUpperCase()}
                </Badge>
              </View>
              <View>
                <Text style={{ fontSize: 12, fontWeight: "500", color: colors.textMuted, marginBottom: 4 }}>Supplier</Text>
                <TextInput
                  value={editSupplier}
                  onChangeText={setEditSupplier}
                  placeholder="Supplier name"
                  placeholderTextColor={colors.textMuted}
                  style={{ backgroundColor: colors.card, borderRadius: 8, padding: 10, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border }}
                />
              </View>
              <View>
                <Text style={{ fontSize: 12, fontWeight: "500", color: colors.textMuted, marginBottom: 4 }}>Date</Text>
                <TextInput
                  value={editDate}
                  onChangeText={setEditDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  style={{ backgroundColor: colors.card, borderRadius: 8, padding: 10, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border }}
                />
              </View>
            </View>

            {/* Editable items */}
            {editItems.length > 0 && (
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary }}>{editItems.length} Items</Text>
                {editItems.map((item, idx) => {
                  const tempOutOfRange = item.temperature != null && item.temperature > 5;
                  return (
                    <View key={idx} style={{ backgroundColor: colors.surface, borderRadius: 10, padding: 12, gap: 8, borderWidth: tempOutOfRange ? 2 : 0, borderColor: tempOutOfRange ? colors.destructive : "transparent" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <TextInput
                          value={item.name}
                          onChangeText={(v) => updateItem(idx, "name", v)}
                          placeholder="Item name"
                          placeholderTextColor={colors.textMuted}
                          style={{ flex: 1, fontSize: 14, fontWeight: "600", color: colors.text, backgroundColor: colors.card, borderRadius: 6, padding: 8, borderWidth: 1, borderColor: colors.border }}
                        />
                        <Pressable onPress={() => removeItem(idx)} hitSlop={8}>
                          <Trash2 size={16} color={colors.textMuted} />
                        </Pressable>
                      </View>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>Qty</Text>
                          <TextInput
                            value={item.quantity != null ? String(item.quantity) : ""}
                            onChangeText={(v) => updateItem(idx, "quantity", v)}
                            keyboardType="decimal-pad"
                            placeholder="-"
                            placeholderTextColor={colors.textMuted}
                            style={{ fontSize: 13, color: colors.text, backgroundColor: colors.card, borderRadius: 6, padding: 6, borderWidth: 1, borderColor: colors.border, textAlign: "center" }}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>Unit</Text>
                          <TextInput
                            value={item.unit || ""}
                            onChangeText={(v) => updateItem(idx, "unit", v)}
                            placeholder="-"
                            placeholderTextColor={colors.textMuted}
                            style={{ fontSize: 13, color: colors.text, backgroundColor: colors.card, borderRadius: 6, padding: 6, borderWidth: 1, borderColor: colors.border, textAlign: "center" }}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 11, color: tempOutOfRange ? colors.destructive : colors.textMuted, fontWeight: tempOutOfRange ? "700" : "400", marginBottom: 2 }}>Temp °C</Text>
                          <TextInput
                            value={item.temperature != null ? String(item.temperature) : ""}
                            onChangeText={(v) => updateItem(idx, "temperature", v)}
                            keyboardType="decimal-pad"
                            placeholder="-"
                            placeholderTextColor={colors.textMuted}
                            style={{ fontSize: 13, color: tempOutOfRange ? colors.destructive : colors.text, fontWeight: tempOutOfRange ? "700" : "400", backgroundColor: tempOutOfRange ? (colors.destructiveBg || "#FEE2E2") : colors.card, borderRadius: 6, padding: 6, borderWidth: 1, borderColor: tempOutOfRange ? colors.destructive : colors.border, textAlign: "center" }}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Notes */}
            <View>
              <Text style={{ fontSize: 12, fontWeight: "500", color: colors.textMuted, marginBottom: 4 }}>Notes</Text>
              <TextInput
                value={editNotes}
                onChangeText={setEditNotes}
                placeholder="Additional notes..."
                placeholderTextColor={colors.textMuted}
                multiline
                style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 10, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.border, minHeight: 60, textAlignVertical: "top" }}
              />
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable onPress={() => { reset(); setPopulated(false); }} style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
                <Text style={{ fontWeight: "600", color: colors.textSecondary }}>Scan Again</Text>
              </Pressable>
              <Pressable onPress={() => saveMutation.mutate()} disabled={saveMutation.isPending} style={{ flex: 1, backgroundColor: computedStatus === "fail" ? colors.destructive : colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: "center", opacity: saveMutation.isPending ? 0.6 : 1 }}>
                {saveMutation.isPending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ fontWeight: "700", color: "#FFFFFF" }}>{computedStatus === "fail" ? "Save with Alert" : "Save Record"}</Text>}
              </Pressable>
            </View>
          </>
        )}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
