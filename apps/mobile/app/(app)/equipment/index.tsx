import { useState, useMemo } from "react";
import { View, Text, FlatList, Pressable, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { useOrg } from "../../../contexts/OrgProvider";
import { useTheme } from "../../../contexts/ThemeProvider";
import { Input } from "../../../components/ui/Input";
import { Badge } from "../../../components/ui/Badge";
import { TabBar } from "../../../components/ui/Tabs";
import { EmptyState } from "../../../components/ui/EmptyState";
import { SkeletonCard } from "../../../components/ui/Skeleton";
import { FAB } from "../../../components/ui/FAB";
import { FormSheet } from "../../../components/ui/FormSheet";
import { Select } from "../../../components/ui/Select";
import { DatePicker } from "../../../components/ui/DatePicker";
import { Wrench, Camera, Edit3 } from "lucide-react-native";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";

interface Equipment {
  id: string;
  name: string;
  model: string | null;
  serial_number: string | null;
  location: string | null;
  status: string;
  purchase_date: string | null;
  last_maintenance: string | null;
  next_maintenance: string | null;
  notes: string | null;
  org_id: string | null;
  manufacturer: string | null;
  warranty_expiry: string | null;
  maintenance_schedule: string | null;
  tech_contacts: { name: string; phone: string | null; email: string | null }[] | null;
}

const STATUS_OPTIONS = [
  { label: "Operational", value: "operational" },
  { label: "Needs Maintenance", value: "needs_maintenance" },
  { label: "Out of Service", value: "out_of_service" },
  { label: "New", value: "new" },
];

const TABS = [
  { key: "all", label: "All" },
  { key: "operational", label: "Active" },
  { key: "needs_maintenance", label: "Needs Maintenance" },
  { key: "maintenance", label: "Due" },
];

const MAINTENANCE_OPTIONS = [
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Quarterly", value: "quarterly" },
  { label: "Annually", value: "annually" },
  { label: "As Needed", value: "as_needed" },
];

export default function EquipmentScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  const { data: equipment, isLoading, refetch, isRefetching } = useQuery<Equipment[]>({
    queryKey: ["equipment", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from("equipment").select("*").eq("org_id", orgId).order("name");
      if (error) throw error;
      return (data as Equipment[]) || [];
    },
    enabled: !!orgId,
  });

  const createEquipment = useMutation({
    mutationFn: async (item: Partial<Equipment>) => {
      const { error } = await supabase.from("equipment").insert({ ...item, org_id: orgId });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["equipment"] }),
  });

  const updateEquipment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Equipment> & { id: string }) => {
      const { error } = await supabase.from("equipment").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["equipment"] }),
  });

  const deleteEquipment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("equipment").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["equipment"] }),
  });

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("operational");
  const [notes, setNotes] = useState("");
  const [nextMaint, setNextMaint] = useState<Date | null>(null);
  const [manufacturer, setManufacturer] = useState("");
  const [warrantyExpiry, setWarrantyExpiry] = useState<Date | null>(null);
  const [maintenanceSchedule, setMaintenanceSchedule] = useState("monthly");
  const [techName, setTechName] = useState("");
  const [techPhone, setTechPhone] = useState("");
  const [techEmail, setTechEmail] = useState("");

  const isMaintenanceDue = (d: string | null) => d ? new Date(d).getTime() < Date.now() : false;

  const filtered = useMemo(() => {
    if (!equipment) return [];
    let list = equipment;
    if (search.trim()) list = list.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));
    if (tab === "operational") list = list.filter((e) => e.status === "operational");
    if (tab === "needs_maintenance") list = list.filter((e) => e.status === "needs_maintenance" || e.status === "out_of_service");
    if (tab === "maintenance") list = list.filter((e) => isMaintenanceDue(e.next_maintenance));
    return list;
  }, [equipment, search, tab]);

  const resetForm = () => { setName(""); setModel(""); setSerial(""); setLocation(""); setStatus("operational"); setNotes(""); setNextMaint(null); setManufacturer(""); setWarrantyExpiry(null); setMaintenanceSchedule("monthly"); setTechName(""); setTechPhone(""); setTechEmail(""); setEditing(null); };
  const openCreate = () => { resetForm(); setShowForm(true); };
  const openEdit = (item: Equipment) => {
    setEditing(item); setName(item.name || ""); setModel(item.model || ""); setSerial(item.serial_number || "");
    setLocation(item.location || ""); setStatus(item.status || "operational"); setNotes(item.notes || "");
    setNextMaint(item.next_maintenance ? new Date(item.next_maintenance) : null);
    setManufacturer(item.manufacturer || "");
    setWarrantyExpiry(item.warranty_expiry ? new Date(item.warranty_expiry) : null);
    setMaintenanceSchedule(item.maintenance_schedule || "monthly");
    setTechName(item.tech_contacts?.[0]?.name || "");
    setTechPhone(item.tech_contacts?.[0]?.phone || "");
    setTechEmail(item.tech_contacts?.[0]?.email || "");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Error", "Name is required"); return; }
    setSaving(true);
    try {
      const data: any = {
        name: name.trim(), model: model.trim() || null, serial_number: serial.trim() || null,
        location: location.trim() || null, status, notes: notes.trim() || null,
        next_maintenance: nextMaint ? nextMaint.toISOString().split("T")[0] : null,
        manufacturer: manufacturer.trim() || null,
        warranty_expiry: warrantyExpiry ? warrantyExpiry.toISOString().split("T")[0] : null,
        maintenance_schedule: maintenanceSchedule || null,
        tech_contacts: techName.trim() ? [{ name: techName.trim(), phone: techPhone.trim() || null, email: techEmail.trim() || null }] : null,
      };
      if (editing) await updateEquipment.mutateAsync({ id: editing.id, ...data });
      else await createEquipment.mutateAsync(data);
      setShowForm(false); resetForm();
    } catch (e: any) { Alert.alert("Error", e.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleLongPress = (item: Equipment) => {
    Alert.alert(item.name, "What would you like to do?", [
      { text: "Edit", onPress: () => openEdit(item) },
      { text: "Scan Label", onPress: () => router.push("/(app)/equipment/scan") },
      { text: "Delete", style: "destructive", onPress: () => Alert.alert("Delete", `Delete "${item.name}"?`, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => deleteEquipment.mutate(item.id) }]) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Equipment" />
      <View style={{ padding: 24, paddingTop: 0, paddingBottom: 0 }}>
        <Input placeholder="Search equipment..." value={search} onChangeText={setSearch} containerStyle={{ marginBottom: 12 }} />
        <TabBar tabs={TABS} activeTab={tab} onTabChange={setTab} accentColor={colors.accent} style={{ marginBottom: 8 }} />
      </View>
      {isLoading ? <View style={{ padding: 24, gap: 10 }}><SkeletonCard /><SkeletonCard /></View> : filtered.length === 0 ? (
        <EmptyState icon={<Wrench size={40} color={colors.textMuted} strokeWidth={1.5} />} title="No equipment" description="Tap + to add equipment" />
      ) : (
        <FlatList data={filtered} keyExtractor={(i) => i.id} contentContainerStyle={{ paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          renderItem={({ item }) => (
            <Pressable onPress={() => openEdit(item)} onLongPress={() => handleLongPress(item)} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{item.name}</Text>
                {item.manufacturer && <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>{item.manufacturer}</Text>}
                <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                  {item.location && <Text style={{ fontSize: 12, color: colors.textMuted }}>{item.location}</Text>}
                  {item.model && <Text style={{ fontSize: 12, color: colors.textMuted }}>{item.model}</Text>}
                </View>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <Badge variant={item.status === "operational" ? "success" : item.status === "needs_maintenance" ? "warning" : "destructive"}>{item.status.replace("_", " ")}</Badge>
                {isMaintenanceDue(item.next_maintenance) && <Text style={{ fontSize: 10, color: colors.destructive }}>Maintenance due</Text>}
                {item.warranty_expiry && new Date(item.warranty_expiry).getTime() < Date.now() && <Badge variant="destructive">Warranty Expired</Badge>}
              </View>
            </Pressable>
          )}
        />
      )}
      <FAB onPress={() => setShowAddDialog(true)} />

      {/* Add Equipment Dialog — Scan or Manual */}
      <FormSheet visible={showAddDialog} onClose={() => setShowAddDialog(false)} onSave={() => setShowAddDialog(false)} title="Add Equipment" saveLabel="">
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 8 }}>
          How would you like to add equipment?
        </Text>
        <Pressable
          onPress={() => { setShowAddDialog(false); router.push("/(app)/equipment/scan"); }}
          style={({ pressed }) => ({
            flexDirection: "row", alignItems: "center", gap: 14,
            backgroundColor: pressed ? colors.accentBg : colors.surface,
            borderRadius: 14, padding: 16, marginBottom: 10,
            borderWidth: 1, borderColor: colors.border,
          })}
        >
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.accentBg, alignItems: "center", justifyContent: "center" }}>
            <Camera size={22} color={colors.accent} strokeWidth={1.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>Scan Info Plate</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
              Take a photo of the equipment label to auto-detect details
            </Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => { setShowAddDialog(false); openCreate(); }}
          style={({ pressed }) => ({
            flexDirection: "row", alignItems: "center", gap: 14,
            backgroundColor: pressed ? colors.accentBg : colors.surface,
            borderRadius: 14, padding: 16,
            borderWidth: 1, borderColor: colors.border,
          })}
        >
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.warningBg, alignItems: "center", justifyContent: "center" }}>
            <Edit3 size={22} color={colors.warning} strokeWidth={1.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>Manual Entry</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
              Enter equipment details manually
            </Text>
          </View>
        </Pressable>
      </FormSheet>
      <FormSheet visible={showForm} onClose={() => { setShowForm(false); resetForm(); }} onSave={handleSave} title={editing ? "Edit Equipment" : "Add Equipment"} saving={saving}>
        <Input label="Name" value={name} onChangeText={setName} placeholder="Oven, Mixer, etc." />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}><Input label="Model" value={model} onChangeText={setModel} placeholder="Model number" /></View>
          <View style={{ flex: 1 }}><Input label="Serial #" value={serial} onChangeText={setSerial} placeholder="Serial number" /></View>
        </View>
        <Input label="Location" value={location} onChangeText={setLocation} placeholder="Kitchen, Bakery, etc." />
        <Select label="Status" value={status} onValueChange={setStatus} options={STATUS_OPTIONS} />
        <DatePicker label="Next Maintenance" value={nextMaint || new Date()} onChange={setNextMaint} mode="date" placeholder="Select date" />
        <Input label="Manufacturer" value={manufacturer} onChangeText={setManufacturer} placeholder="e.g. Rational, Hobart" />
        <DatePicker label="Warranty Expiry" value={warrantyExpiry || new Date()} onChange={setWarrantyExpiry} mode="date" placeholder="Select expiry date" />
        <Select label="Maintenance Schedule" value={maintenanceSchedule} onValueChange={setMaintenanceSchedule} options={MAINTENANCE_OPTIONS} />
        <View style={{ gap: 4, marginTop: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary }}>Tech Contact</Text>
          <Input value={techName} onChangeText={setTechName} placeholder="Contact name" />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}><Input value={techPhone} onChangeText={setTechPhone} placeholder="Phone" keyboardType="phone-pad" /></View>
            <View style={{ flex: 1 }}><Input value={techEmail} onChangeText={setTechEmail} placeholder="Email" keyboardType="email-address" /></View>
          </View>
        </View>
        <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional notes" multiline numberOfLines={2} style={{ minHeight: 60, textAlignVertical: "top" }} />
      </FormSheet>
    </SafeAreaView>
  );
}
