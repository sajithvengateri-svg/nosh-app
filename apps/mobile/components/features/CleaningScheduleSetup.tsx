import { useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Alert, RefreshControl, Switch } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useOrg } from "../../contexts/OrgProvider";
import { useTheme } from "../../contexts/ThemeProvider";
import { Badge } from "../ui/Badge";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { FormSheet } from "../ui/FormSheet";
import { ImagePicker } from "../ui/ImagePicker";
import { EmptyState } from "../ui/EmptyState";
import { FAB } from "../ui/FAB";
import { SkeletonCard } from "../ui/Skeleton";
import { useUploadSafetyPhoto } from "../../hooks/useFoodSafety";
import { Trash2, Edit3, Camera } from "lucide-react-native";

const FREQUENCIES = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

const AREAS = [
  { label: "Kitchen", value: "Kitchen" },
  { label: "Cool Room", value: "Cool Room" },
  { label: "Dry Store", value: "Dry Store" },
  { label: "Dish Pit", value: "Dish Pit" },
  { label: "FOH", value: "FOH" },
  { label: "Bathroom", value: "Bathroom" },
  { label: "Bins", value: "Bins" },
  { label: "Floors", value: "Floors" },
  { label: "Equipment", value: "Equipment" },
  { label: "Other", value: "Other" },
];

const ROLES = [
  { label: "Any Staff", value: "any" },
  { label: "Chef", value: "chef" },
  { label: "Kitchen Hand", value: "kitchen_hand" },
  { label: "FOH Staff", value: "foh" },
  { label: "Cleaner", value: "cleaner" },
];

export function CleaningScheduleSetup() {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [area, setArea] = useState("Kitchen");
  const [frequency, setFrequency] = useState("daily");
  const [method, setMethod] = useState("");
  const [sanitiserRequired, setSanitiserRequired] = useState(false);
  const [responsibleRole, setResponsibleRole] = useState("any");
  const [referencePhotoBase64, setReferencePhotoBase64] = useState("");
  const uploadPhoto = useUploadSafetyPhoto();

  const { data: schedules, isLoading, refetch, isRefetching } = useQuery<any[]>({
    queryKey: ["cleaning-schedules", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("bcc_cleaning_schedules")
        .select("*")
        .eq("org_id", orgId)
        .order("area")
        .order("task_name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const resetForm = useCallback(() => {
    setShowForm(false);
    setTaskName("");
    setArea("Kitchen");
    setFrequency("daily");
    setMethod("");
    setSanitiserRequired(false);
    setResponsibleRole("any");
    setReferencePhotoBase64("");
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No org");
      if (!taskName.trim()) throw new Error("Task name required");

      let referencePhotoUrl: string | null = null;
      if (referencePhotoBase64) {
        referencePhotoUrl = await uploadPhoto.mutateAsync(referencePhotoBase64);
      }

      const { error } = await supabase.from("bcc_cleaning_schedules").insert({
        org_id: orgId,
        task_name: taskName.trim(),
        area,
        frequency,
        method: method.trim() || null,
        sanitiser_required: sanitiserRequired,
        responsible_role: responsibleRole,
        is_active: true,
        reference_photo_url: referencePhotoUrl,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cleaning-schedules", orgId] });
      resetForm();
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("bcc_cleaning_schedules").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cleaning-schedules", orgId] }),
  });

  const deleteSchedule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bcc_cleaning_schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cleaning-schedules", orgId] }),
  });

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Delete Schedule", `Remove "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteSchedule.mutate(id) },
    ]);
  };

  const activeCount = schedules?.filter((s: any) => s.is_active).length || 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 10 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>Cleaning Schedules</Text>
          <Badge variant="default">{activeCount} active</Badge>
        </View>

        {isLoading ? (
          <View style={{ gap: 10 }}><SkeletonCard /><SkeletonCard /></View>
        ) : !schedules || schedules.length === 0 ? (
          <EmptyState icon="🧹" title="No Schedules" description="Set up your cleaning schedules to track daily, weekly, and monthly tasks." actionLabel="Add Schedule" onAction={() => setShowForm(true)} />
        ) : (
          schedules.map((s: any) => (
            <View key={s.id} style={{ backgroundColor: colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: s.is_active ? colors.border : colors.destructiveBg, gap: 6, opacity: s.is_active ? 1 : 0.6 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text, flex: 1 }} numberOfLines={1}>{s.task_name}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Badge variant="secondary">{s.frequency}</Badge>
                  <Switch value={s.is_active} onValueChange={(v) => toggleActive.mutate({ id: s.id, active: v })} trackColor={{ false: colors.border, true: colors.success }} />
                </View>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Badge variant="outline">{s.area}</Badge>
                {s.sanitiser_required && <Badge variant="warning">Sanitiser</Badge>}
                {s.responsible_role && s.responsible_role !== "any" && <Badge variant="secondary">{s.responsible_role}</Badge>}
              </View>
              {s.method && <Text style={{ fontSize: 12, color: colors.textMuted }} numberOfLines={2}>{s.method}</Text>}
              <Pressable onPress={() => handleDelete(s.id, s.task_name)} style={{ alignSelf: "flex-end" }}>
                <Trash2 size={16} color={colors.destructive} />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      <FAB onPress={() => { resetForm(); setShowForm(true); }} color={colors.accent} />

      <FormSheet visible={showForm} onClose={resetForm} onSave={() => saveMutation.mutate()} title="Add Cleaning Schedule" saving={saveMutation.isPending}>
        <Input label="Task Name" value={taskName} onChangeText={setTaskName} placeholder="e.g. Clean grills and hotplate" />
        <Select label="Area" value={area} options={AREAS} onValueChange={setArea} />
        <Select label="Frequency" value={frequency} options={FREQUENCIES} onValueChange={setFrequency} />
        <Input label="Method / Instructions" value={method} onChangeText={setMethod} placeholder="How to clean..." multiline />
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 }}>
          <Text style={{ fontSize: 14, fontWeight: "500", color: colors.textSecondary }}>Sanitiser required?</Text>
          <Switch value={sanitiserRequired} onValueChange={setSanitiserRequired} trackColor={{ false: colors.border, true: colors.success }} />
        </View>
        <Select label="Responsible Role" value={responsibleRole} options={ROLES} onValueChange={setResponsibleRole} />

        {/* Reference photo for AI verification */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary }}>
            Reference Photo (optional)
          </Text>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>
            Take a photo of the expected clean state. AI will compare staff photos against this.
          </Text>
          <ImagePicker
            onImageSelected={setReferencePhotoBase64}
            buttonText={referencePhotoBase64 ? "Reference Photo Set" : "Set Reference Photo"}
            showPreview={!!referencePhotoBase64}
          />
        </View>
      </FormSheet>
    </View>
  );
}
