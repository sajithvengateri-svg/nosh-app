import { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { supabase } from "../../../lib/supabase";
import { useOrg } from "../../../contexts/OrgProvider";
import { useAuth } from "../../../contexts/AuthProvider";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { TabBar } from "../../../components/ui/Tabs";
import { EmptyState } from "../../../components/ui/EmptyState";
import { FAB } from "../../../components/ui/FAB";
import { FormSheet } from "../../../components/ui/FormSheet";
import { Input } from "../../../components/ui/Input";
import { Badge } from "../../../components/ui/Badge";
import { SkeletonCard } from "../../../components/ui/Skeleton";
import { BCCAuditFolder } from "../../../components/features/BCCAuditFolder";
import { ImagePicker } from "../../../components/ui/ImagePicker";
import {
  FolderOpen,
  FileText,
  ShieldCheck,
  Award,
  BookOpen,
  ClipboardCheck,
  Upload,
  Trash2,
  Camera,
  ScanLine,
  HeartPulse,
  GraduationCap,
} from "lucide-react-native";

const TABS = [
  { key: "all", label: "All" },
  { key: "certificate", label: "Certificates" },
  { key: "manual", label: "Manuals" },
  { key: "self_audit", label: "Self-Audit" },
  { key: "licence", label: "Licences" },
];

const CATEGORIES = [
  { key: "certificate", label: "Certificate" },
  { key: "manual", label: "Manual" },
  { key: "self_audit", label: "Self-Audit Report" },
  { key: "report", label: "Report" },
  { key: "staff_health_cert", label: "Staff Health Certificate" },
  { key: "food_handler_cert", label: "Food Handler Certificate" },
  { key: "licence", label: "Business Licence" },
  { key: "inspection_report", label: "Inspection Report" },
  { key: "other", label: "Other" },
];

const CATEGORY_ICONS: Record<string, any> = {
  certificate: Award,
  manual: BookOpen,
  self_audit: ClipboardCheck,
  report: FileText,
  staff_health_cert: HeartPulse,
  food_handler_cert: GraduationCap,
  licence: ShieldCheck,
  inspection_report: ClipboardCheck,
  other: FolderOpen,
};

const CATEGORY_COLORS: Record<string, string> = {
  certificate: "#10B981",
  manual: "#3B82F6",
  self_audit: "#8B5CF6",
  report: "#F59E0B",
  staff_health_cert: "#EF4444",
  food_handler_cert: "#6366F1",
  licence: "#000080",
  inspection_report: "#DC2626",
  other: "#6B7280",
};

interface FoodSafetyDocument {
  id: string;
  org_id: string;
  user_id: string;
  title: string;
  category: string;
  file_url: string;
  file_type: string | null;
  file_size_bytes: number | null;
  notes: string | null;
  uploaded_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export default function FoodSafetyDocsPage() {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const orgId = currentOrg?.id;

  const [activeTab, setActiveTab] = useState("all");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docCategory, setDocCategory] = useState("certificate");
  const [docNotes, setDocNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string; mimeType: string; size: number } | null>(null);
  const [scannedImageBase64, setScannedImageBase64] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<"scan" | "file">("file");

  // ── Fetch documents ──────────────────────────────────────────
  const { data: docs, isLoading, refetch, isRefetching } = useQuery<FoodSafetyDocument[]>({
    queryKey: ["food-safety-documents", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("food_safety_documents")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as FoodSafetyDocument[]) || [];
    },
    enabled: !!orgId,
  });

  const filteredDocs = useMemo(() => {
    if (!docs) return [];
    if (activeTab === "all") return docs;
    return docs.filter((d) => d.category === activeTab);
  }, [docs, activeTab]);

  // ── Pick file ────────────────────────────────────────────────
  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/png"],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType || "application/octet-stream",
          size: asset.size || 0,
        });
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to pick document");
    }
  };

  // ── Upload document ──────────────────────────────────────────
  const handleUpload = async () => {
    if (!docTitle.trim()) {
      Alert.alert("Error", "Title is required");
      return;
    }
    if (!selectedFile && !scannedImageBase64) {
      Alert.alert("Error", "Please select a file or scan a document");
      return;
    }
    if (!orgId || !user?.id) {
      Alert.alert("Error", "Not authenticated");
      return;
    }

    setUploading(true);
    try {
      let fileUrl: string;
      let fileType: string;
      let fileSize: number;

      if (scannedImageBase64) {
        // Upload scanned image
        const fileName = `docs/${orgId}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("food-safety")
          .upload(fileName, Buffer.from(scannedImageBase64, "base64"), { contentType: "image/jpeg" });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("food-safety").getPublicUrl(fileName);
        fileUrl = urlData.publicUrl;
        fileType = "image/jpeg";
        fileSize = Math.round(scannedImageBase64.length * 0.75);
      } else if (selectedFile) {
        const ext = selectedFile.mimeType === "application/pdf" ? "pdf" : selectedFile.mimeType?.includes("png") ? "png" : "jpg";
        const fileName = `docs/${orgId}/${Date.now()}.${ext}`;
        const response = await fetch(selectedFile.uri);
        const blob = await response.blob();
        const arrayBuffer = await new Response(blob).arrayBuffer();
        const { error: uploadError } = await supabase.storage
          .from("food-safety")
          .upload(fileName, arrayBuffer, { contentType: selectedFile.mimeType });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("food-safety").getPublicUrl(fileName);
        fileUrl = urlData.publicUrl;
        fileType = selectedFile.mimeType;
        fileSize = selectedFile.size;
      } else {
        return;
      }

      const { error: insertError } = await supabase.from("food_safety_documents").insert({
        org_id: orgId,
        user_id: user.id,
        title: docTitle.trim(),
        category: docCategory,
        file_url: fileUrl,
        file_type: fileType,
        file_size_bytes: fileSize,
        notes: docNotes.trim() || null,
        uploaded_by_name: user.email || null,
      });
      if (insertError) throw insertError;

      queryClient.invalidateQueries({ queryKey: ["food-safety-documents"] });
      setShowUploadForm(false);
      resetForm();
      Alert.alert("Uploaded", "Document saved successfully");
    } catch (e: any) {
      Alert.alert("Upload Failed", e.message || "Something went wrong");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setDocTitle("");
    setDocCategory("certificate");
    setDocNotes("");
    setSelectedFile(null);
    setScannedImageBase64(null);
    setUploadMode("file");
  };

  // ── Delete document ──────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      const { error } = await supabase.from("food_safety_documents").delete().eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-safety-documents"] });
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const handleDelete = (doc: FoodSafetyDocument) => {
    Alert.alert("Delete Document", `Remove "${doc.title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(doc.id) },
    ]);
  };

  // ── Format helpers ───────────────────────────────────────────
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Food Safety Docs" />

      {/* ── Quick Actions ────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingVertical: 10 }}
      >
        <Pressable
          onPress={() => { resetForm(); setScannedImageBase64(null); setSelectedFile(null); setShowUploadForm(true); setUploadMode("scan"); }}
          style={({ pressed }) => ({
            flexDirection: "row", alignItems: "center", gap: 8,
            paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
            backgroundColor: "#8B5CF6" + (pressed ? "30" : "15"),
            borderWidth: 1, borderColor: "#8B5CF620",
          })}
        >
          <ScanLine size={18} color="#8B5CF6" strokeWidth={1.8} />
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#8B5CF6" }}>Scan Document</Text>
        </Pressable>
        <Pressable
          onPress={() => { resetForm(); setScannedImageBase64(null); setSelectedFile(null); setShowUploadForm(true); setUploadMode("file"); }}
          style={({ pressed }) => ({
            flexDirection: "row", alignItems: "center", gap: 8,
            paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
            backgroundColor: colors.accent + (pressed ? "30" : "15"),
            borderWidth: 1, borderColor: colors.accent + "20",
          })}
        >
          <Upload size={18} color={colors.accent} strokeWidth={1.8} />
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.accent }}>Upload File</Text>
        </Pressable>
      </ScrollView>

      <TabBar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        style={{ marginHorizontal: 16, marginBottom: 8 }}
      />

      {/* ── Self-Audit tab renders BCCAuditFolder ─────────── */}
      {activeTab === "self_audit" && (
        <View style={{ flex: 1 }}>
          <BCCAuditFolder />
        </View>
      )}

      {/* ── Document list (all, certificate, manual) ──────── */}
      {activeTab !== "self_audit" && (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        >
          {/* Table of Contents summary */}
          {activeTab === "all" && docs && docs.length > 0 && (
            <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 10 }}>
                Document Summary
              </Text>
              {CATEGORIES.map((cat) => {
                const count = docs.filter((d) => d.category === cat.key).length;
                if (count === 0) return null;
                const CatIcon = CATEGORY_ICONS[cat.key] || FolderOpen;
                const catColor = CATEGORY_COLORS[cat.key] || colors.textMuted;
                return (
                  <View key={cat.key} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 }}>
                    <CatIcon size={16} color={catColor} strokeWidth={1.5} />
                    <Text style={{ fontSize: 13, color: colors.text, flex: 1 }}>{cat.label}</Text>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: catColor }}>{count}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {isLoading ? (
            <View style={{ gap: 10 }}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : filteredDocs.length === 0 ? (
            <EmptyState
              icon={<FolderOpen size={40} color={colors.textMuted} strokeWidth={1.5} />}
              title="No documents"
              description="Upload certificates, manuals, and food safety documents to build your venue folder."
              style={{ paddingVertical: 40 }}
            />
          ) : (
            filteredDocs.map((doc) => {
              const DocIcon = CATEGORY_ICONS[doc.category] || FolderOpen;
              const docColor = CATEGORY_COLORS[doc.category] || colors.textMuted;
              const isPdf = doc.file_type?.includes("pdf");
              return (
                <Pressable
                  key={doc.id}
                  onPress={() => {
                    if (doc.file_url) Linking.openURL(doc.file_url);
                  }}
                  style={({ pressed }) => ({
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 10,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={{
                      width: 40, height: 40, borderRadius: 10,
                      backgroundColor: docColor + "15",
                      alignItems: "center", justifyContent: "center",
                    }}>
                      <DocIcon size={20} color={docColor} strokeWidth={1.5} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{doc.title}</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <Badge variant="secondary">
                          {CATEGORIES.find((c) => c.key === doc.category)?.label || doc.category}
                        </Badge>
                        {isPdf && (
                          <Text style={{ fontSize: 11, color: colors.textMuted }}>PDF</Text>
                        )}
                        {doc.file_size_bytes && (
                          <Text style={{ fontSize: 11, color: colors.textMuted }}>{formatSize(doc.file_size_bytes)}</Text>
                        )}
                      </View>
                      {doc.notes && (
                        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }} numberOfLines={2}>
                          {doc.notes}
                        </Text>
                      )}
                      <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>
                        {formatDate(doc.created_at)}
                        {doc.uploaded_by_name ? ` · ${doc.uploaded_by_name.split("@")[0]}` : ""}
                      </Text>
                    </View>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation?.();
                        handleDelete(doc);
                      }}
                      hitSlop={12}
                      style={{ padding: 4 }}
                    >
                      <Trash2 size={16} color={colors.textMuted} strokeWidth={1.5} />
                    </Pressable>
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ── FAB for upload ─────────────────────────────────── */}
      {activeTab !== "self_audit" && (
        <FAB onPress={() => { resetForm(); setShowUploadForm(true); }} />
      )}

      {/* ── Upload Form ────────────────────────────────────── */}
      <FormSheet
        visible={showUploadForm}
        onClose={() => setShowUploadForm(false)}
        onSave={handleUpload}
        title="Upload Document"
        saving={uploading}
      >
        <Input label="Title" value={docTitle} onChangeText={setDocTitle} placeholder="e.g. Food Safety Certificate 2026" />

        <View style={{ gap: 6, marginBottom: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary }}>Category</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.key}
                onPress={() => setDocCategory(cat.key)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: docCategory === cat.key ? colors.accent : colors.border,
                  backgroundColor: docCategory === cat.key ? colors.accentBg : colors.card,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: docCategory === cat.key ? "700" : "500",
                    color: docCategory === cat.key ? colors.accent : colors.textSecondary,
                  }}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* File source: Scan or Browse */}
        {scannedImageBase64 ? (
          <Pressable
            onPress={() => setScannedImageBase64(null)}
            style={{
              padding: 16, borderRadius: 12, borderWidth: 2, borderStyle: "dashed",
              borderColor: "#8B5CF6", backgroundColor: "#8B5CF615",
              alignItems: "center", gap: 8, marginBottom: 12,
            }}
          >
            <Camera size={24} color="#8B5CF6" strokeWidth={1.5} />
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#8B5CF6" }}>Scanned Image Ready</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Tap to remove and re-scan</Text>
          </Pressable>
        ) : selectedFile ? (
          <Pressable
            onPress={() => setSelectedFile(null)}
            style={{
              padding: 16, borderRadius: 12, borderWidth: 2, borderStyle: "dashed",
              borderColor: colors.accent, backgroundColor: colors.accentBg,
              alignItems: "center", gap: 8, marginBottom: 12,
            }}
          >
            <Upload size={24} color={colors.accent} strokeWidth={1.5} />
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.accent }}>{selectedFile.name}</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{formatSize(selectedFile.size)} · Tap to remove</Text>
          </Pressable>
        ) : (
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
            <ImagePicker
              onImageSelected={(base64) => setScannedImageBase64(base64)}
              renderButton={({ onPress, loading }) => (
                <Pressable
                  onPress={onPress}
                  disabled={loading}
                  style={({ pressed }) => ({
                    flex: 1, padding: 16, borderRadius: 12, borderWidth: 2, borderStyle: "dashed",
                    borderColor: uploadMode === "scan" ? "#8B5CF6" : colors.border,
                    backgroundColor: uploadMode === "scan" ? "#8B5CF615" : colors.surface,
                    alignItems: "center", gap: 8, opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Camera size={24} color={uploadMode === "scan" ? "#8B5CF6" : colors.textMuted} strokeWidth={1.5} />
                  <Text style={{ fontSize: 13, fontWeight: "600", color: uploadMode === "scan" ? "#8B5CF6" : colors.text }}>
                    Scan
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>Camera</Text>
                </Pressable>
              )}
            />
            <Pressable
              onPress={handlePickFile}
              style={({ pressed }) => ({
                flex: 1, padding: 16, borderRadius: 12, borderWidth: 2, borderStyle: "dashed",
                borderColor: uploadMode === "file" ? colors.accent : colors.border,
                backgroundColor: uploadMode === "file" ? colors.accentBg : colors.surface,
                alignItems: "center", gap: 8, opacity: pressed ? 0.8 : 1,
              })}
            >
              <Upload size={24} color={uploadMode === "file" ? colors.accent : colors.textMuted} strokeWidth={1.5} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: uploadMode === "file" ? colors.accent : colors.text }}>
                Browse
              </Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>PDF, JPG, PNG</Text>
            </Pressable>
          </View>
        )}

        <Input label="Notes" value={docNotes} onChangeText={setDocNotes} placeholder="Optional notes..." multiline />
      </FormSheet>
    </SafeAreaView>
  );
}
