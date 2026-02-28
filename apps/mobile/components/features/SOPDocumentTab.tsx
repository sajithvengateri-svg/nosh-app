import { useState, useCallback, useMemo } from "react";
import { View, Text, ScrollView, Alert, RefreshControl, Pressable, Linking } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useOrg } from "../../contexts/OrgProvider";
import { useAuth } from "../../contexts/AuthProvider";
import { useTheme } from "../../contexts/ThemeProvider";
import { Badge } from "../ui/Badge";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { FormSheet } from "../ui/FormSheet";
import { EmptyState } from "../ui/EmptyState";
import { FAB } from "../ui/FAB";
import { SkeletonCard } from "../ui/Skeleton";
import { AuditBadge } from "../ui/AuditBadge";
import { useUploadSDSDocument } from "../../hooks/useFoodSafety";
import { FileText, ExternalLink } from "lucide-react-native";

const SOP_CATEGORIES = [
  { label: "Kitchen", value: "Kitchen" },
  { label: "FOH", value: "FOH" },
  { label: "Safety", value: "Safety" },
  { label: "Cleaning", value: "Cleaning" },
  { label: "Equipment", value: "Equipment" },
  { label: "Other", value: "Other" },
];

export function SOPDocumentTab() {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();
  const uploadDoc = useUploadSDSDocument();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [docUri, setDocUri] = useState<{ uri: string; mimeType: string; name?: string } | null>(null);
  const [notes, setNotes] = useState("");

  const { data: sops, isLoading, refetch, isRefetching } = useQuery<any[]>({
    queryKey: ["sop-documents", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("food_safety_logs")
        .select("*")
        .eq("org_id", orgId)
        .eq("log_type", "sop")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const resetForm = useCallback(() => {
    setShowForm(false);
    setTitle("");
    setCategory("");
    setDocUri(null);
    setNotes("");
  }, []);

  const handlePickDocument = async () => {
    try {
      const DocumentPicker = await import("expo-document-picker");
      const result = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"] });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setDocUri({ uri: asset.uri, mimeType: asset.mimeType || "application/pdf", name: asset.name });
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to pick document");
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No org selected");
      if (!title.trim()) throw new Error("Title is required");
      if (!category) throw new Error("Category is required");

      let documentUrl: string | null = null;
      if (docUri) {
        documentUrl = await uploadDoc.mutateAsync({ uri: docUri.uri, mimeType: docUri.mimeType });
      }

      const { error } = await supabase.from("food_safety_logs").insert({
        org_id: orgId,
        log_type: "sop",
        location: title.trim(),
        readings: { title: title.trim(), category, document_url: documentUrl },
        status: "pass",
        recorded_by: user?.id,
        recorded_by_name: user?.email,
        date: new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().split(" ")[0],
        notes: notes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sop-documents", orgId] });
      resetForm();
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 12 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {isLoading ? (
          <View style={{ gap: 12 }}><SkeletonCard /><SkeletonCard /></View>
        ) : !sops || sops.length === 0 ? (
          <EmptyState icon="📋" title="No SOPs" description="Tap + to upload your first Standard Operating Procedure." actionLabel="Add SOP" onAction={() => setShowForm(true)} />
        ) : (
          sops.map((sop: any) => {
            const r = sop.readings || {};
            const hasDoc = !!r.document_url;
            return (
              <View key={sop.id} style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border, gap: 8 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, flex: 1 }} numberOfLines={1}>
                    {r.title || sop.location || "Untitled SOP"}
                  </Text>
                  {r.category && <Badge variant="secondary">{r.category}</Badge>}
                </View>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>
                  Uploaded {new Date(sop.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                </Text>
                {sop.notes && <Text style={{ fontSize: 12, color: colors.textMuted }} numberOfLines={2}>{sop.notes}</Text>}
                {hasDoc && (
                  <Pressable
                    onPress={() => Linking.openURL(r.document_url)}
                    style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.accentBg, borderRadius: 10, padding: 10 }}
                  >
                    <FileText size={16} color={colors.accent} />
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.accent, flex: 1 }}>View Document</Text>
                    <ExternalLink size={14} color={colors.accent} />
                  </Pressable>
                )}
                <AuditBadge signedBy={sop.recorded_by_name || "Unknown"} signedAt={sop.created_at} size="sm" />
              </View>
            );
          })
        )}
      </ScrollView>

      <FAB onPress={() => { resetForm(); setShowForm(true); }} color={colors.accent} />

      <FormSheet visible={showForm} onClose={resetForm} onSave={() => saveMutation.mutate()} title="Upload SOP" saving={saveMutation.isPending}>
        <Input label="SOP Title" value={title} onChangeText={setTitle} placeholder="e.g. Kitchen Closing Procedure" />
        <Select label="Category" placeholder="Select category..." value={category} options={SOP_CATEGORIES} onValueChange={setCategory} />
        <Pressable
          onPress={handlePickDocument}
          style={{ backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
            {docUri ? `Selected: ${docUri.name || "Document"}` : "Upload Document / Photo"}
          </Text>
        </Pressable>
        <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Additional details..." multiline />
      </FormSheet>
    </View>
  );
}
