import { useState, useCallback } from "react";
import { View, ScrollView, Alert, RefreshControl } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useOrg } from "../../contexts/OrgProvider";
import { useAuth } from "../../contexts/AuthProvider";
import { useTheme } from "../../contexts/ThemeProvider";
import { Input } from "../ui/Input";
import { FormSheet } from "../ui/FormSheet";
import { EmptyState } from "../ui/EmptyState";
import { FAB } from "../ui/FAB";
import { SkeletonCard } from "../ui/Skeleton";
import { ServiceLogCard } from "../ui/ServiceLogCard";
import { AuditBadge } from "../ui/AuditBadge";
import { ImagePicker } from "../ui/ImagePicker";
import { useUploadSafetyPhoto } from "../../hooks/useFoodSafety";
import { useCalendarIntegration } from "../../hooks/useCalendarIntegration";

interface ServiceLogTabProps {
  serviceType: string; // "hood_cleaning" | "grease_trap" | "waste_disposal" | "tank_service"
  title: string;
}

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getLogStatus(nextDue: string | null): "completed" | "upcoming" | "overdue" {
  if (!nextDue) return "completed";
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(nextDue);
  due.setHours(0, 0, 0, 0);
  const diff = Math.ceil((due.getTime() - now.getTime()) / 86_400_000);
  if (diff < 0) return "overdue";
  if (diff <= 30) return "upcoming";
  return "completed";
}

export function ServiceLogTab({ serviceType, title }: ServiceLogTabProps) {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();
  const uploadPhoto = useUploadSafetyPhoto();
  const { createServiceReminder } = useCalendarIntegration();

  const [showForm, setShowForm] = useState(false);
  const [providerName, setProviderName] = useState("");
  const [serviceDate, setServiceDate] = useState(getTodayDate());
  const [cost, setCost] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  // Query service logs
  const { data: logs, isLoading, refetch, isRefetching } = useQuery<any[]>({
    queryKey: ["service-logs", serviceType, orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("service_logs")
        .select("*")
        .eq("org_id", orgId)
        .eq("service_type", serviceType)
        .order("service_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const resetForm = useCallback(() => {
    setShowForm(false);
    setProviderName("");
    setServiceDate(getTodayDate());
    setCost("");
    setNextDueDate("");
    setPhotoBase64(null);
    setNotes("");
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No organisation selected");
      if (!serviceDate.trim()) throw new Error("Service date is required");
      if (!providerName.trim()) throw new Error("Provider name is required");

      let invoiceUrl: string | null = null;
      if (photoBase64) invoiceUrl = await uploadPhoto.mutateAsync(photoBase64);

      const parsedCost = cost.trim() ? parseFloat(cost) : null;
      if (cost.trim() && isNaN(parsedCost!)) throw new Error("Invalid cost value");

      const { error } = await supabase.from("service_logs").insert({
        org_id: orgId,
        service_type: serviceType,
        provider_name: providerName.trim(),
        service_date: serviceDate.trim(),
        next_due_date: nextDueDate.trim() || null,
        cost: parsedCost,
        invoice_url: invoiceUrl,
        status: "completed",
        logged_by: user?.id,
        logged_by_name: user?.email,
        signature_name: user?.email,
        notes: notes.trim() || null,
      });
      if (error) throw error;

      // Create calendar reminder if next due date is set
      if (nextDueDate.trim()) {
        await createServiceReminder({
          title: `${title} - Service Due`,
          dueDate: nextDueDate.trim(),
          notes: `${title} service due. Provider: ${providerName.trim()}`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-logs", serviceType, orgId] });
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
          <View style={{ gap: 12 }}><SkeletonCard /><SkeletonCard /><SkeletonCard /></View>
        ) : !logs || logs.length === 0 ? (
          <EmptyState
            icon={null}
            title={`No ${title} Logs`}
            description="Tap + to log your first service entry."
          />
        ) : (
          logs.map((log: any) => (
            <View key={log.id} style={{ gap: 8 }}>
              <ServiceLogCard
                title={title}
                provider={log.provider_name}
                lastServiceDate={log.service_date}
                nextDueDate={log.next_due_date}
                invoiceUrl={log.invoice_url}
                cost={log.cost}
                notes={log.notes}
                status={getLogStatus(log.next_due_date)}
              />
              <AuditBadge
                signedBy={log.logged_by_name || log.signature_name || "Unknown"}
                signedAt={log.created_at || log.service_date}
                size="sm"
              />
            </View>
          ))
        )}
      </ScrollView>

      <FAB onPress={() => { resetForm(); setShowForm(true); }} color={colors.accent} />

      <FormSheet
        visible={showForm}
        onClose={resetForm}
        onSave={() => saveMutation.mutate()}
        title={`New ${title} Log`}
        saving={saveMutation.isPending}
      >
        <Input label="Provider Name" value={providerName} onChangeText={setProviderName} placeholder="e.g. CleanCo Services" />
        <Input label="Service Date (YYYY-MM-DD)" value={serviceDate} onChangeText={setServiceDate} placeholder="2026-02-24" />
        <Input label="Cost" value={cost} onChangeText={setCost} placeholder="0.00" keyboardType="decimal-pad" />
        <Input label="Next Due Date (YYYY-MM-DD)" value={nextDueDate} onChangeText={setNextDueDate} placeholder="e.g. 2026-05-24" />
        <ImagePicker label="Invoice / Photo" onImageSelected={(b64) => setPhotoBase64(b64)} buttonText="Upload Invoice" />
        <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Additional details..." multiline />
      </FormSheet>
    </View>
  );
}
