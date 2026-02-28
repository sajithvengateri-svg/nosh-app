import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  RefreshControl,
  Pressable,
  Alert,
  TextInput,
  Linking,
  Platform,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useOrg } from "../../contexts/OrgProvider";
import { useTheme } from "../../contexts/ThemeProvider";
import {
  useUploadSafetyPhoto,
  useUploadSDSDocument,
} from "../../hooks/useFoodSafety";
import { Card, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { FAB } from "../ui/FAB";
import { FormSheet } from "../ui/FormSheet";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { ImagePicker } from "../ui/ImagePicker";
import { EmptyState } from "../ui/EmptyState";
import { SkeletonCard } from "../ui/Skeleton";
import { FileText, Upload, Search, X, QrCode, AlertTriangle } from "lucide-react-native";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_OPTIONS = [
  { label: "General Cleaner", value: "General Cleaner" },
  { label: "Sanitiser", value: "Sanitiser" },
  { label: "Degreaser", value: "Degreaser" },
  { label: "Detergent", value: "Detergent" },
  { label: "Disinfectant", value: "Disinfectant" },
  { label: "Floor Cleaner", value: "Floor Cleaner" },
  { label: "Glass Cleaner", value: "Glass Cleaner" },
  { label: "Oven Cleaner", value: "Oven Cleaner" },
  { label: "Other", value: "Other" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BCCChemicalSafety() {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  // ── Search state ─────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");

  // ── Form state (add chemical) ────────────────────────────────
  const [sheetOpen, setSheetOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formQuantity, setFormQuantity] = useState("");
  const [formUnit, setFormUnit] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formSupplier, setFormSupplier] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // ── Upload hooks ─────────────────────────────────────────────
  const uploadPhotoMutation = useUploadSafetyPhoto();
  const uploadDocMutation = useUploadSDSDocument();

  // ── Query — fetch chemicals from cleaning_inventory ──────────
  const {
    data: chemicals,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<any[]>({
    queryKey: ["cleaning-inventory", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("cleaning_inventory")
        .select("*")
        .eq("org_id", orgId)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!orgId,
  });

  // ── Filtered list ────────────────────────────────────────────
  const filteredChemicals = useMemo(() => {
    if (!chemicals) return [];
    if (!searchQuery.trim()) return chemicals;
    const q = searchQuery.toLowerCase().trim();
    return chemicals.filter(
      (item: any) =>
        item.name?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q)
    );
  }, [chemicals, searchQuery]);

  // ── Mutation — add new chemical ──────────────────────────────
  const addMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No organisation selected");
      if (!formName.trim()) throw new Error("Chemical name is required");
      if (!formCategory) throw new Error("Category is required");

      const qty = formQuantity.trim() ? parseFloat(formQuantity) : null;

      const { error } = await supabase.from("cleaning_inventory").insert({
        org_id: orgId,
        name: formName.trim(),
        category: formCategory,
        quantity: qty,
        unit: formUnit.trim() || null,
        location: formLocation.trim() || null,
        supplier: formSupplier.trim() || null,
        notes: formNotes.trim() || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cleaning-inventory", orgId],
      });
      resetForm();
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  // ── Mutation — update sds_url on a row ───────────────────────
  const updateSdsMutation = useMutation({
    mutationFn: async ({
      id,
      sdsUrl,
    }: {
      id: string;
      sdsUrl: string;
    }) => {
      const { error } = await supabase
        .from("cleaning_inventory")
        .update({ sds_url: sdsUrl } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cleaning-inventory", orgId],
      });
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  // ── Form helpers ─────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setSheetOpen(false);
    setFormName("");
    setFormCategory("");
    setFormQuantity("");
    setFormUnit("");
    setFormLocation("");
    setFormSupplier("");
    setFormNotes("");
  }, []);

  const handleSave = () => {
    addMutation.mutate();
  };

  // ── SDS upload flow ──────────────────────────────────────────
  const handleUploadSDS = (item: any) => {
    Alert.alert("Upload SDS", "Choose how to upload the Safety Data Sheet", [
      {
        text: "Take Photo",
        onPress: () => handlePhotoUpload(item.id),
      },
      {
        text: "Upload Document",
        onPress: () => handleDocumentUpload(item.id),
      },
      {
        text: "Scan QR/Barcode",
        onPress: () => handleQRScan(item.id),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  // ── QR/URL input state (cross-platform, no Alert.prompt) ────
  const [sdsUrlSheetOpen, setSdsUrlSheetOpen] = useState(false);
  const [sdsUrlInput, setSdsUrlInput] = useState("");
  const [sdsUrlChemicalId, setSdsUrlChemicalId] = useState<string | null>(null);

  const handleQRScan = (chemicalId: string) => {
    setSdsUrlChemicalId(chemicalId);
    setSdsUrlInput("");
    setSdsUrlSheetOpen(true);
  };

  const handleSaveSdsUrl = async () => {
    if (!sdsUrlInput.trim() || !sdsUrlChemicalId) return;
    try {
      await updateSdsMutation.mutateAsync({ id: sdsUrlChemicalId, sdsUrl: sdsUrlInput.trim() });
      Alert.alert("Success", "SDS URL saved.");
      setSdsUrlSheetOpen(false);
      setSdsUrlInput("");
      setSdsUrlChemicalId(null);
    } catch {
      // error handled by mutation onError
    }
  };

  const handleScanChemicalLabel = async (base64: string, chemicalId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("scan-chemical-label", {
        body: { image_base64: base64 },
      });
      if (error) throw error;
      if (data) {
        const info = [];
        if (data.hazard_class) info.push(`Hazard: ${data.hazard_class}`);
        if (data.dilution_ratio) info.push(`Dilution: ${data.dilution_ratio}`);
        if (data.warnings?.length) info.push(`Warnings: ${data.warnings.join(", ")}`);
        if (data.sds_url) {
          await updateSdsMutation.mutateAsync({ id: chemicalId, sdsUrl: data.sds_url });
          info.push(`SDS URL saved automatically`);
        }
        Alert.alert("Chemical Label Scanned", info.join("\n") || "No data extracted");
      }
    } catch (e: any) {
      Alert.alert("Scan Failed", e.message || "Could not read label");
    }
  };

  const handlePhotoUpload = async (chemicalId: string) => {
    try {
      const ExpoImagePicker = await import("expo-image-picker");

      const { status } =
        await ExpoImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant camera access in Settings."
        );
        return;
      }

      const result = await ExpoImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        base64: true,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]?.base64) {
        const base64 = result.assets[0].base64;
        const url = await uploadPhotoMutation.mutateAsync(base64);
        await updateSdsMutation.mutateAsync({
          id: chemicalId,
          sdsUrl: url,
        });
        Alert.alert("Success", "SDS photo uploaded. Scanning label...");
        // Also try to extract chemical info from the label
        handleScanChemicalLabel(base64, chemicalId);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to upload photo");
    }
  };

  const handleDocumentUpload = async (chemicalId: string) => {
    try {
      const DocumentPicker = await import("expo-document-picker");

      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const mimeType = asset.mimeType || "application/pdf";
        const url = await uploadDocMutation.mutateAsync({
          uri: asset.uri,
          mimeType,
        });
        await updateSdsMutation.mutateAsync({
          id: chemicalId,
          sdsUrl: url,
        });
        Alert.alert("Success", "SDS document uploaded successfully.");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to upload document");
    }
  };

  // ── Render ───────────────────────────────────────────────────
  const isUploading =
    uploadPhotoMutation.isPending ||
    uploadDocMutation.isPending ||
    updateSdsMutation.isPending;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Search bar */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 8,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 12,
            height: 44,
          }}
        >
          <Search size={18} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search chemicals by name or category..."
            placeholderTextColor={colors.textMuted}
            style={{
              flex: 1,
              fontSize: 15,
              color: colors.text,
              marginLeft: 8,
              paddingVertical: 0,
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
              <X size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* List */}
      <KeyboardAwareScrollView
        contentContainerStyle={{
          padding: 16,
          paddingTop: 4,
          paddingBottom: 100,
        }}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={Platform.OS === "ios" ? 20 : 80}
        enableAutomaticScroll
        enableResetScrollToCoords={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* Loading */}
        {isLoading && (
          <View style={{ gap: 12 }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        )}

        {/* Empty state */}
        {!isLoading && (!chemicals || chemicals.length === 0) && (
          <EmptyState
            icon="🧪"
            title="No Chemicals in Inventory"
            description="Tap + to add your first chemical and upload its Safety Data Sheet (SDS)."
            actionLabel="Add Chemical"
            onAction={() => setSheetOpen(true)}
          />
        )}

        {/* No search results */}
        {!isLoading &&
          chemicals &&
          chemicals.length > 0 &&
          filteredChemicals.length === 0 && (
            <EmptyState
              icon="🔍"
              title="No Results"
              description={`No chemicals matching "${searchQuery}". Try a different search term.`}
            />
          )}

        {/* Chemical list */}
        {!isLoading &&
          filteredChemicals.length > 0 &&
          filteredChemicals.map((item: any) => {
            const hasSDS = !!item.sds_url;

            return (
              <Card key={item.id} style={{ marginBottom: 12 }}>
                <CardContent style={{ paddingTop: 16 }}>
                  {/* Top row: name + category badge */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: colors.text,
                        flex: 1,
                        marginRight: 8,
                      }}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    {item.category && (
                      <Badge variant="secondary">{item.category}</Badge>
                    )}
                  </View>

                  {/* Location + Quantity */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    {item.location ? (
                      <Text
                        style={{
                          fontSize: 14,
                          color: colors.textSecondary,
                        }}
                        numberOfLines={1}
                      >
                        {item.location}
                      </Text>
                    ) : (
                      <Text
                        style={{
                          fontSize: 14,
                          color: colors.textMuted,
                          fontStyle: "italic",
                        }}
                      >
                        No location set
                      </Text>
                    )}
                    {item.quantity != null && (
                      <Text
                        style={{
                          fontSize: 14,
                          color: colors.textSecondary,
                          fontWeight: "500",
                        }}
                      >
                        {item.quantity}
                        {item.unit ? ` ${item.unit}` : ""}
                      </Text>
                    )}
                  </View>

                  {/* SDS status badge */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <Badge variant={hasSDS ? "success" : "destructive"}>
                      {hasSDS ? "SDS Uploaded" : "SDS Missing"}
                    </Badge>
                  </View>

                  {/* Action buttons */}
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 10,
                    }}
                  >
                    {hasSDS && (
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={() => Linking.openURL(item.sds_url)}
                        style={{ flex: 1 }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <FileText size={14} color={colors.text} />
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: "600",
                              color: colors.text,
                            }}
                          >
                            View SDS
                          </Text>
                        </View>
                      </Button>
                    )}
                    <Button
                      variant={hasSDS ? "ghost" : "default"}
                      size="sm"
                      onPress={() => handleUploadSDS(item)}
                      disabled={isUploading}
                      loading={isUploading}
                      style={{ flex: 1 }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Upload
                          size={14}
                          color={hasSDS ? colors.text : "#FFFFFF"}
                        />
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: hasSDS ? colors.text : "#FFFFFF",
                          }}
                        >
                          Upload SDS
                        </Text>
                      </View>
                    </Button>
                  </View>
                </CardContent>
              </Card>
            );
          })}
      </KeyboardAwareScrollView>

      {/* FAB */}
      <FAB onPress={() => setSheetOpen(true)} color={colors.accent} />

      {/* Form Sheet — SDS URL Entry (cross-platform, replaces Alert.prompt) */}
      <FormSheet
        visible={sdsUrlSheetOpen}
        onClose={() => { setSdsUrlSheetOpen(false); setSdsUrlInput(""); setSdsUrlChemicalId(null); }}
        onSave={handleSaveSdsUrl}
        title="Enter SDS URL"
        saving={updateSdsMutation.isPending}
      >
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 8 }}>
          Paste the SDS URL from the QR code on the chemical label.
        </Text>
        <Input
          label="SDS URL"
          value={sdsUrlInput}
          onChangeText={setSdsUrlInput}
          placeholder="https://..."
          autoCapitalize="none"
          keyboardType="url"
        />
      </FormSheet>

      {/* Form Sheet — Add Chemical */}
      <FormSheet
        visible={sheetOpen}
        onClose={resetForm}
        onSave={handleSave}
        title="Add Chemical to Inventory"
        saving={addMutation.isPending}
      >
        {/* Name */}
        <Input
          label="Chemical Name"
          value={formName}
          onChangeText={setFormName}
          placeholder="e.g. Chlor-Clean Sanitiser"
        />

        {/* Category */}
        <Select
          label="Category"
          placeholder="Select category..."
          value={formCategory}
          options={CATEGORY_OPTIONS}
          onValueChange={setFormCategory}
        />

        {/* Quantity */}
        <Input
          label="Quantity"
          value={formQuantity}
          onChangeText={setFormQuantity}
          placeholder="e.g. 10"
          keyboardType="numeric"
        />

        {/* Unit */}
        <Input
          label="Unit"
          value={formUnit}
          onChangeText={setFormUnit}
          placeholder="e.g. litres, kg, bottles"
        />

        {/* Location */}
        <Input
          label="Storage Location"
          value={formLocation}
          onChangeText={setFormLocation}
          placeholder="e.g. Chemical storage room"
        />

        {/* Supplier */}
        <Input
          label="Supplier"
          value={formSupplier}
          onChangeText={setFormSupplier}
          placeholder="e.g. CleanCo Supplies"
        />

        {/* Notes */}
        <Input
          label="Notes"
          value={formNotes}
          onChangeText={setFormNotes}
          placeholder="Any additional notes..."
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: "top" }}
        />
      </FormSheet>
    </View>
  );
}
