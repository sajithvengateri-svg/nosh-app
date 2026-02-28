import { useState, useCallback } from "react";
import { View, Text, ScrollView, Alert, RefreshControl, Pressable } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useOrg } from "../../contexts/OrgProvider";
import { useAuth } from "../../contexts/AuthProvider";
import { useTheme } from "../../contexts/ThemeProvider";
import { Badge } from "../ui/Badge";
import { Input } from "../ui/Input";
import { FormSheet } from "../ui/FormSheet";
import { EmptyState } from "../ui/EmptyState";
import { FAB } from "../ui/FAB";
import { SkeletonCard } from "../ui/Skeleton";
import { AuditBadge } from "../ui/AuditBadge";
import { useUploadSafetyPhoto } from "../../hooks/useFoodSafety";

const SUB_TYPES = [
  { key: "oil_collection", label: "Dirty Oil Pickup" },
  { key: "oil_delivery", label: "Clean Oil Delivery" },
  { key: "oil_quality", label: "Oil Quality Test" },
] as const;

type OilSubType = (typeof SUB_TYPES)[number]["key"];

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export function OilManagementTab() {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  const [subType, setSubType] = useState<OilSubType>("oil_collection");
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [serviceDate, setServiceDate] = useState(getTodayDate());
  const [providerName, setProviderName] = useState("");
  const [volume, setVolume] = useState("");
  const [cost, setCost] = useState("");
  const [testReading, setTestReading] = useState("");
  const [testResult, setTestResult] = useState<"pass" | "fail">("pass");
  const [notes, setNotes] = useState("");

  const { data: logs, isLoading, refetch, isRefetching } = useQuery<any[]>({
    queryKey: ["service-logs", subType, orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("service_logs")
        .select("*")
        .eq("org_id", orgId)
        .eq("service_type", subType)
        .order("service_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const resetForm = useCallback(() => {
    setShowForm(false);
    setServiceDate(getTodayDate());
    setProviderName("");
    setVolume("");
    setCost("");
    setTestReading("");
    setTestResult("pass");
    setNotes("");
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No org selected");
      if (!serviceDate.trim()) throw new Error("Date is required");

      const metadata: Record<string, any> = {};
      if (volume.trim()) metadata.volume = volume.trim();
      if (subType === "oil_quality") {
        metadata.reading = testReading.trim();
        metadata.result = testResult;
      }

      const { error } = await supabase.from("service_logs").insert({
        org_id: orgId,
        service_type: subType,
        provider_name: providerName.trim() || null,
        service_date: serviceDate.trim(),
        cost: cost.trim() ? parseFloat(cost) : null,
        status: subType === "oil_quality" ? testResult : "completed",
        logged_by: user?.id,
        logged_by_name: user?.email,
        signature_name: user?.email,
        metadata,
        notes: notes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-logs", subType, orgId] });
      resetForm();
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Sub-type pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}>
        {SUB_TYPES.map((st) => (
          <Pressable
            key={st.key}
            onPress={() => setSubType(st.key)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: subType === st.key ? colors.accent : colors.surface,
              borderWidth: 1,
              borderColor: subType === st.key ? colors.accent : colors.border,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: subType === st.key ? "#fff" : colors.textSecondary }}>
              {st.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 12 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {isLoading ? (
          <View style={{ gap: 12 }}><SkeletonCard /><SkeletonCard /></View>
        ) : !logs || logs.length === 0 ? (
          <EmptyState icon={null} title="No Records" description={`Tap + to log a ${SUB_TYPES.find((s) => s.key === subType)?.label?.toLowerCase() || "record"}.`} />
        ) : (
          logs.map((log: any) => (
            <View key={log.id} style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border, gap: 8 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>{formatDate(log.service_date)}</Text>
                {subType === "oil_quality" ? (
                  <Badge variant={log.status === "pass" ? "success" : "destructive"}>
                    {log.status === "pass" ? "PASS" : "FAIL"}
                  </Badge>
                ) : (
                  <Badge variant="success">Completed</Badge>
                )}
              </View>
              {log.provider_name && <Text style={{ fontSize: 13, color: colors.textSecondary }}>Provider: {log.provider_name}</Text>}
              {log.metadata?.volume && <Text style={{ fontSize: 13, color: colors.textSecondary }}>Volume: {log.metadata.volume}L</Text>}
              {log.metadata?.reading && <Text style={{ fontSize: 13, color: colors.textSecondary }}>Reading: {log.metadata.reading}</Text>}
              {log.cost != null && <Text style={{ fontSize: 13, color: colors.textSecondary }}>Cost: ${Number(log.cost).toFixed(2)}</Text>}
              {log.notes && <Text style={{ fontSize: 12, color: colors.textMuted }} numberOfLines={2}>{log.notes}</Text>}
              <AuditBadge signedBy={log.logged_by_name || "Unknown"} signedAt={log.created_at} size="sm" />
            </View>
          ))
        )}
      </ScrollView>

      <FAB onPress={() => { resetForm(); setShowForm(true); }} color={colors.accent} />

      <FormSheet visible={showForm} onClose={resetForm} onSave={() => saveMutation.mutate()} title={`Log ${SUB_TYPES.find((s) => s.key === subType)?.label}`} saving={saveMutation.isPending}>
        <Input label="Date (YYYY-MM-DD)" value={serviceDate} onChangeText={setServiceDate} placeholder="2026-02-24" />
        <Input label="Provider" value={providerName} onChangeText={setProviderName} placeholder="e.g. Oil Corp" />
        {subType !== "oil_quality" && (
          <Input label="Volume (Litres)" value={volume} onChangeText={setVolume} placeholder="e.g. 50" keyboardType="decimal-pad" />
        )}
        {subType === "oil_quality" && (
          <>
            <Input label="Reading Value" value={testReading} onChangeText={setTestReading} placeholder="e.g. 24% TPM" />
            <View style={{ flexDirection: "row", gap: 10 }}>
              {(["pass", "fail"] as const).map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setTestResult(r)}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: "center",
                    backgroundColor: testResult === r ? (r === "pass" ? colors.successBg : colors.destructiveBg) : colors.surface,
                    borderWidth: 2,
                    borderColor: testResult === r ? (r === "pass" ? colors.success : colors.destructive) : colors.border,
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: "700", color: testResult === r ? (r === "pass" ? colors.success : colors.destructive) : colors.textSecondary }}>
                    {r.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
        <Input label="Cost" value={cost} onChangeText={setCost} placeholder="0.00" keyboardType="decimal-pad" />
        <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Additional details..." multiline />
      </FormSheet>
    </View>
  );
}
