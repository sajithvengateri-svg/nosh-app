import { useState, useCallback } from "react";
import { View, Alert } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useOrg } from "../../contexts/OrgProvider";
import { useAuth } from "../../contexts/AuthProvider";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { FormSheet } from "../ui/FormSheet";
import { ImagePicker } from "../ui/ImagePicker";
import { useUploadSafetyPhoto } from "../../hooks/useFoodSafety";
import { useCalendarIntegration } from "../../hooks/useCalendarIntegration";

interface MaintenanceLogDialogProps {
  visible: boolean;
  onClose: () => void;
  equipmentList: Array<{ id: string; name: string; maintenance_schedule?: string }>;
}

const SERVICE_TYPES = [
  { label: "Maintenance", value: "maintenance" },
  { label: "Repair", value: "repair" },
  { label: "Calibration", value: "calibration" },
  { label: "Inspection", value: "inspection" },
];

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function calcNextDate(serviceDate: string, schedule?: string): string {
  const d = new Date(serviceDate);
  const s = (schedule || "").toLowerCase();
  if (s.includes("month")) d.setDate(d.getDate() + 30);
  else if (s.includes("quarter")) d.setDate(d.getDate() + 90);
  else if (s.includes("year") || s.includes("annual")) d.setDate(d.getDate() + 365);
  else if (s.includes("week")) d.setDate(d.getDate() + 7);
  else d.setDate(d.getDate() + 90); // default quarterly
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function MaintenanceLogDialog({ visible, onClose, equipmentList }: MaintenanceLogDialogProps) {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();
  const uploadPhoto = useUploadSafetyPhoto();
  const { createServiceReminder } = useCalendarIntegration();

  const [equipmentId, setEquipmentId] = useState("");
  const [serviceType, setServiceType] = useState("maintenance");
  const [provider, setProvider] = useState("");
  const [serviceDate, setServiceDate] = useState(getTodayDate());
  const [cost, setCost] = useState("");
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const equipmentOptions = equipmentList.map((e) => ({ label: e.name, value: e.id }));
  const selectedEquipment = equipmentList.find((e) => e.id === equipmentId);

  const resetForm = useCallback(() => {
    onClose();
    setEquipmentId("");
    setServiceType("maintenance");
    setProvider("");
    setServiceDate(getTodayDate());
    setCost("");
    setPhotoBase64(null);
    setNotes("");
  }, [onClose]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No org selected");
      if (!equipmentId) throw new Error("Select equipment");
      if (!serviceDate.trim()) throw new Error("Date is required");

      let invoiceUrl: string | null = null;
      if (photoBase64) invoiceUrl = await uploadPhoto.mutateAsync(photoBase64);

      const nextScheduled = calcNextDate(serviceDate, selectedEquipment?.maintenance_schedule);

      const { error } = await supabase.from("maintenance_logs").insert({
        org_id: orgId,
        equipment_id: equipmentId,
        equipment_name: selectedEquipment?.name || "Unknown",
        service_type: serviceType,
        service_date: serviceDate.trim(),
        provider: provider.trim() || null,
        invoice_url: invoiceUrl,
        cost: cost.trim() ? parseFloat(cost) : null,
        next_scheduled: nextScheduled,
        performed_by: user?.email,
        notes: notes.trim() || null,
      });
      if (error) throw error;

      // Calendar reminder
      await createServiceReminder({
        title: `${selectedEquipment?.name || "Equipment"} Maintenance Due`,
        dueDate: nextScheduled,
        notes: `Scheduled ${serviceType} for ${selectedEquipment?.name || "equipment"}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-logs"] });
      queryClient.invalidateQueries({ queryKey: ["equipment-list"] });
      resetForm();
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  return (
    <FormSheet
      visible={visible}
      onClose={resetForm}
      onSave={() => saveMutation.mutate()}
      title="Log Maintenance"
      saving={saveMutation.isPending}
    >
      <Select label="Equipment" placeholder="Select equipment..." value={equipmentId} options={equipmentOptions} onValueChange={setEquipmentId} />
      <Select label="Service Type" value={serviceType} options={SERVICE_TYPES} onValueChange={setServiceType} />
      <Input label="Provider" value={provider} onChangeText={setProvider} placeholder="e.g. ServiceTech Co" />
      <Input label="Service Date (YYYY-MM-DD)" value={serviceDate} onChangeText={setServiceDate} placeholder="2026-02-24" />
      <Input label="Cost" value={cost} onChangeText={setCost} placeholder="0.00" keyboardType="decimal-pad" />
      <ImagePicker label="Invoice / Photo" onImageSelected={(b64) => setPhotoBase64(b64)} buttonText="Upload Invoice" />
      <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Additional details..." multiline />
      {selectedEquipment?.maintenance_schedule && (
        <View style={{ padding: 10 }}>
          {/* Auto-calculated next date shown as info */}
        </View>
      )}
    </FormSheet>
  );
}
