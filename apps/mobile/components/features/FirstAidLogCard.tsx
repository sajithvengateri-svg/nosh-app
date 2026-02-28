import { useState, useCallback } from "react";
import { View, Text, ScrollView, Alert, RefreshControl } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useOrg } from "../../contexts/OrgProvider";
import { useAuth } from "../../contexts/AuthProvider";
import { useTheme } from "../../contexts/ThemeProvider";
import { Badge } from "../ui/Badge";
import { Input } from "../ui/Input";
import { EmptyState } from "../ui/EmptyState";
import { SkeletonCard } from "../ui/Skeleton";
import { FormSheet } from "../ui/FormSheet";
import { FAB } from "../ui/FAB";
import { ImagePicker } from "../ui/ImagePicker";
import { AuditBadge } from "../ui/AuditBadge";
import { useUploadSafetyPhoto } from "../../hooks/useFoodSafety";

// -- Helpers ------------------------------------------------------------------

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const t = new Date(dateStr);
  const n = new Date();
  t.setHours(0, 0, 0, 0);
  n.setHours(0, 0, 0, 0);
  return Math.ceil((t.getTime() - n.getTime()) / 86_400_000);
}

function dueBadge(days: number | null): "success" | "warning" | "destructive" {
  if (days === null || days < 7) return "destructive";
  return days <= 30 ? "warning" : "success";
}

function dueLabel(days: number | null, dateStr: string): string {
  if (days === null) return formatDate(dateStr);
  if (days < 0) return `Overdue by ${Math.abs(days)}d`;
  if (days === 0) return "Due today";
  return `Due in ${days}d`;
}

const BADGE_COLORS = (c: any) => ({
  success: { bg: c.successBg, fg: c.success },
  warning: { bg: c.warningBg, fg: c.warning },
  destructive: { bg: c.destructiveBg, fg: c.destructive },
});

// -- Component ----------------------------------------------------------------

export function FirstAidLogCard() {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();
  const uploadPhoto = useUploadSafetyPhoto();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [checkDate, setCheckDate] = useState(getTodayDate());
  const [providerName, setProviderName] = useState("");
  const [itemsChecked, setItemsChecked] = useState("");
  const [itemsReplenished, setItemsReplenished] = useState("");
  const [nextCheckDate, setNextCheckDate] = useState("");
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  // -- Query ------------------------------------------------------------------

  const { data: logs, isLoading, refetch, isRefetching } = useQuery<any[]>({
    queryKey: ["first-aid-logs", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("service_logs")
        .select("*")
        .eq("org_id", orgId)
        .eq("service_type", "first_aid")
        .order("service_date", { ascending: false });
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!orgId,
  });

  // -- Mutation ---------------------------------------------------------------

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No organisation selected");
      if (!checkDate.trim()) throw new Error("Check date is required");
      if (!providerName.trim()) throw new Error("Provider / checked by is required");

      let photoUrl: string | null = null;
      if (photoBase64) photoUrl = await uploadPhoto.mutateAsync(photoBase64);

      const { error } = await supabase.from("service_logs").insert({
        org_id: orgId,
        service_type: "first_aid",
        provider_name: providerName.trim(),
        service_date: checkDate,
        next_due_date: nextCheckDate.trim() || null,
        invoice_url: photoUrl,
        status: "completed",
        logged_by: user?.id,
        logged_by_name: user?.email,
        signature_name: user?.email,
        metadata: {
          items_checked: itemsChecked.trim() || null,
          items_replenished: itemsReplenished.trim() || null,
        },
        notes: notes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["first-aid-logs", orgId] });
      resetForm();
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const resetForm = useCallback(() => {
    setSheetOpen(false);
    setCheckDate(getTodayDate());
    setProviderName("");
    setItemsChecked("");
    setItemsReplenished("");
    setNextCheckDate("");
    setPhotoBase64(null);
    setNotes("");
  }, []);

  // -- Render -----------------------------------------------------------------

  const bcMap = BADGE_COLORS(colors);
  const multiStyle = { minHeight: 80, textAlignVertical: "top" as const };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {isLoading ? (
          <View style={{ gap: 12 }}>
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </View>
        ) : !logs || logs.length === 0 ? (
          <EmptyState
            icon="\u26D1\uFE0F"
            title="No First Aid Checks"
            description="Tap + to log your first first aid box inspection."
          />
        ) : (
          <View style={{ gap: 12 }}>
            {logs.map((log: any) => {
              const meta = log.metadata || {};
              const days = daysUntil(log.next_due_date);
              const bc = bcMap[dueBadge(days)];
              return (
                <View
                  key={log.id}
                  style={{
                    backgroundColor: colors.card, borderRadius: 14, padding: 14,
                    borderWidth: 1, borderColor: colors.cardBorder, gap: 8,
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
                      {formatDate(log.service_date)}
                    </Text>
                    {log.next_due_date && (
                      <View style={{ backgroundColor: bc.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                        <Text style={{ fontSize: 12, fontWeight: "700", color: bc.fg }}>
                          {dueLabel(days, log.next_due_date)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                    Checked by: {log.provider_name || "N/A"}
                  </Text>
                  {meta.items_checked && (
                    <Text style={{ fontSize: 13, color: colors.textSecondary }} numberOfLines={2}>
                      Items checked: {meta.items_checked}
                    </Text>
                  )}
                  {meta.items_replenished && (
                    <Text style={{ fontSize: 13, color: colors.textSecondary }} numberOfLines={2}>
                      Replenished: {meta.items_replenished}
                    </Text>
                  )}
                  {log.invoice_url && <Badge variant="default">Photo attached</Badge>}
                  {log.notes && (
                    <Text style={{ fontSize: 13, color: colors.textSecondary }} numberOfLines={2}>
                      {log.notes}
                    </Text>
                  )}
                  <AuditBadge
                    signedBy={log.logged_by_name || log.signature_name || "Unknown"}
                    signedAt={log.created_at || log.service_date}
                    size="sm"
                  />
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <FAB onPress={() => setSheetOpen(true)} color={colors.accent} />

      <FormSheet
        visible={sheetOpen}
        onClose={resetForm}
        onSave={() => saveMutation.mutate()}
        title="Log First Aid Check"
        saving={saveMutation.isPending}
      >
        <Input label="Check Date (YYYY-MM-DD)" value={checkDate} onChangeText={setCheckDate} placeholder="2026-02-24" />
        <Input label="Provider / Checked By" value={providerName} onChangeText={setProviderName} placeholder="e.g. Jane Smith" />
        <Input label="Items Checked" value={itemsChecked} onChangeText={setItemsChecked}
          placeholder="List items inspected..." multiline numberOfLines={3} style={multiStyle} />
        <Input label="Items Replenished" value={itemsReplenished} onChangeText={setItemsReplenished}
          placeholder="List items restocked..." multiline numberOfLines={3} style={multiStyle} />
        <Input label="Next Check Date (YYYY-MM-DD)" value={nextCheckDate} onChangeText={setNextCheckDate} placeholder="e.g. 2026-03-24" />
        <ImagePicker label="Photo Evidence" onImageSelected={(b64) => setPhotoBase64(b64)} buttonText="Add Photo" />
        <Input label="Notes" value={notes} onChangeText={setNotes}
          placeholder="Additional observations..." multiline numberOfLines={3} style={multiStyle} />
      </FormSheet>
    </View>
  );
}
