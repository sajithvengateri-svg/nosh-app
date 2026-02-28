import { useState, useMemo } from "react";
import { View, Text, FlatList, Pressable, RefreshControl, Alert, ScrollView, LayoutAnimation, Platform, UIManager } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays, Link2, Camera, Paperclip, Plus, ChevronDown, ChevronUp, Wifi, Check,
} from "lucide-react-native";
import { supabase } from "../../../lib/supabase";
import { useOrg } from "../../../contexts/OrgProvider";
import { useTheme } from "../../../contexts/ThemeProvider";
import { useToast } from "../../../contexts/ToastProvider";
import { Input } from "../../../components/ui/Input";
import { Badge } from "../../../components/ui/Badge";
import { EmptyState } from "../../../components/ui/EmptyState";
import { SkeletonCard } from "../../../components/ui/Skeleton";
import { FAB } from "../../../components/ui/FAB";
import { FormSheet } from "../../../components/ui/FormSheet";
import { Select } from "../../../components/ui/Select";
import { DatePicker } from "../../../components/ui/DatePicker";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { ImagePicker } from "../../../components/ui/ImagePicker";
import { lightTap } from "../../../lib/haptics";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Shift {
  id: string;
  staff_name: string | null;
  role: string | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  org_id: string | null;
}

const ROLE_OPTIONS = [
  { label: "Head Chef", value: "Head Chef" }, { label: "Sous Chef", value: "Sous Chef" },
  { label: "Chef de Partie", value: "Chef de Partie" }, { label: "Commis", value: "Commis" },
  { label: "Kitchen Porter", value: "Kitchen Porter" }, { label: "FOH", value: "FOH" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const ROSTER_PROVIDERS = [
  { key: "deputy", label: "Deputy", color: "#0066FF" },
  { key: "employment_hero", label: "Employment Hero", color: "#FF6B35" },
  { key: "tanda", label: "Tanda", color: "#00C2A8" },
  { key: "square", label: "Square", color: "#1A1A1A" },
  { key: "other", label: "Other", color: "#6B7280" },
];

function getWeekDates(offset: number = 0) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + 1 + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

export default function Roster() {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split("T")[0]);

  // Integration state
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [connectProvider, setConnectProvider] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [showScanPicker, setShowScanPicker] = useState(false);
  const [scanning, setScanning] = useState(false);

  const { data: shifts, isLoading, refetch, isRefetching } = useQuery<Shift[]>({
    queryKey: ["roster", orgId, weekDates[0], weekDates[6]],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from("shifts").select("*").eq("org_id", orgId).gte("date", weekDates[0]).lte("date", weekDates[6]).order("start_time");
      if (error) throw error;
      return (data as Shift[]) || [];
    },
    enabled: !!orgId,
  });

  const createShift = useMutation({
    mutationFn: async (shift: Partial<Shift>) => {
      const { error } = await supabase.from("shifts").insert({ ...shift, org_id: orgId });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roster"] }),
  });

  const updateShift = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Shift> & { id: string }) => {
      const { error } = await supabase.from("shifts").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roster"] }),
  });

  const deleteShift = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shifts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roster"] }),
  });

  const dayShifts = useMemo(() => (shifts || []).filter((s) => s.date === selectedDay), [shifts, selectedDay]);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);
  const [saving, setSaving] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [role, setRole] = useState("Commis");
  const [startTime, setStartTime] = useState<Date>(new Date(2000, 0, 1, 9, 0));
  const [endTime, setEndTime] = useState<Date>(new Date(2000, 0, 1, 17, 0));
  const [notes, setNotes] = useState("");

  const parseTime = (t: string | null) => {
    if (!t) return new Date(2000, 0, 1, 9, 0);
    const [h, m] = t.split(":").map(Number);
    return new Date(2000, 0, 1, h || 0, m || 0);
  };
  const formatTime = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  const resetForm = () => { setStaffName(""); setRole("Commis"); setStartTime(new Date(2000, 0, 1, 9, 0)); setEndTime(new Date(2000, 0, 1, 17, 0)); setNotes(""); setEditing(null); };
  const openCreate = () => { resetForm(); setShowForm(true); };
  const openEdit = (s: Shift) => {
    setEditing(s); setStaffName(s.staff_name || ""); setRole(s.role || "Commis");
    setStartTime(parseTime(s.start_time)); setEndTime(parseTime(s.end_time)); setNotes(s.notes || "");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!staffName.trim()) { Alert.alert("Error", "Staff name is required"); return; }
    setSaving(true);
    try {
      const data: any = { staff_name: staffName.trim(), role, date: selectedDay, start_time: formatTime(startTime), end_time: formatTime(endTime), notes: notes.trim() || null };
      if (editing) await updateShift.mutateAsync({ id: editing.id, ...data });
      else await createShift.mutateAsync(data);
      setShowForm(false); resetForm();
    } catch (e: any) { Alert.alert("Error", e.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleLongPress = (item: Shift) => {
    Alert.alert(item.staff_name || "Shift", "What would you like to do?", [
      { text: "Edit", onPress: () => openEdit(item) },
      { text: "Delete", style: "destructive", onPress: () => Alert.alert("Delete Shift", "Delete this shift?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => deleteShift.mutate(item.id) }]) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleConnect = (providerKey: string) => {
    lightTap();
    setConnectProvider(providerKey);
    setApiKey("");
    setApiUrl("");
    setShowConnectForm(true);
  };

  const handleSaveConnection = () => {
    if (!apiKey.trim()) { Alert.alert("Error", "API Key is required"); return; }
    const provider = ROSTER_PROVIDERS.find((p) => p.key === connectProvider);
    showToast({ title: "Coming Soon", message: `${provider?.label || "Provider"} integration will be available in a future update.`, type: "info" });
    setShowConnectForm(false);
  };

  const handleScanRoster = async (base64: string) => {
    setScanning(true);
    setShowScanPicker(false);
    try {
      showToast({ title: "Coming Soon", message: "Roster scanning will be available in a future update.", type: "info" });
    } finally {
      setScanning(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Roster" />

      {/* ── Integration Banner ── */}
      <Pressable
        onPress={() => { lightTap(); LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setShowIntegrations(!showIntegrations); }}
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 16, marginBottom: 8, backgroundColor: colors.accentBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Link2 size={16} color={colors.accent} strokeWidth={1.5} />
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.accent }}>Connect Rostering Software</Text>
        </View>
        {showIntegrations ? <ChevronUp size={16} color={colors.accent} strokeWidth={1.5} /> : <ChevronDown size={16} color={colors.accent} strokeWidth={1.5} />}
      </Pressable>

      {showIntegrations && (
        <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
          {/* Provider Cards */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
            {ROSTER_PROVIDERS.map((provider) => (
              <Pressable key={provider.key} onPress={() => handleConnect(provider.key)}
                style={({ pressed }) => ({
                  width: 120, backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder,
                  padding: 14, alignItems: "center", gap: 8, opacity: pressed ? 0.7 : 1,
                })}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: provider.color + "15", alignItems: "center", justifyContent: "center" }}>
                  <Wifi size={18} color={provider.color} strokeWidth={1.5} />
                </View>
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text, textAlign: "center" }} numberOfLines={1}>{provider.label}</Text>
                <View style={{ backgroundColor: colors.accentBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: colors.accent }}>Connect</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>

          {/* Alternative Input Methods */}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
            <Pressable onPress={() => { lightTap(); setShowScanPicker(!showScanPicker); }}
              style={({ pressed }) => ({ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: colors.surface, borderRadius: 10, paddingVertical: 10, opacity: pressed ? 0.7 : 1 })}>
              <Camera size={14} color={colors.textSecondary} strokeWidth={1.5} />
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSecondary }}>Scan Roster</Text>
            </Pressable>
            <Pressable onPress={() => { lightTap(); showToast({ title: "Coming Soon", message: "File upload will be available in a future update.", type: "info" }); }}
              style={({ pressed }) => ({ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: colors.surface, borderRadius: 10, paddingVertical: 10, opacity: pressed ? 0.7 : 1 })}>
              <Paperclip size={14} color={colors.textSecondary} strokeWidth={1.5} />
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSecondary }}>Attach File</Text>
            </Pressable>
            <Pressable onPress={() => { lightTap(); openCreate(); }}
              style={({ pressed }) => ({ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: colors.surface, borderRadius: 10, paddingVertical: 10, opacity: pressed ? 0.7 : 1 })}>
              <Plus size={14} color={colors.textSecondary} strokeWidth={1.5} />
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSecondary }}>Manual</Text>
            </Pressable>
          </View>

          {/* Scan Picker */}
          {showScanPicker && (
            <View style={{ marginTop: 8 }}>
              <ImagePicker onImageSelected={handleScanRoster} label="" buttonText="Take Photo of Roster" />
            </View>
          )}
        </View>
      )}

      {/* ── Week Navigation ── */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 0 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Pressable onPress={() => setWeekOffset(weekOffset - 1)}><Text style={{ fontSize: 20, color: colors.accent }}>&#x2039;</Text></Pressable>
          <Pressable onPress={() => { lightTap(); setWeekOffset(0); }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary }}>{weekDates[0]} — {weekDates[6]}</Text>
          </Pressable>
          <Pressable onPress={() => setWeekOffset(weekOffset + 1)}><Text style={{ fontSize: 20, color: colors.accent }}>&#x203A;</Text></Pressable>
        </View>
        <View style={{ flexDirection: "row", gap: 4, marginBottom: 12 }}>
          {weekDates.map((d, i) => (
            <Pressable key={d} onPress={() => setSelectedDay(d)} style={{ flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 8, backgroundColor: d === selectedDay ? colors.accent : colors.surface }}>
              <Text style={{ fontSize: 10, fontWeight: "600", color: d === selectedDay ? "#FFFFFF" : colors.textMuted }}>{DAYS[i]}</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: d === selectedDay ? "#FFFFFF" : colors.text, marginTop: 2 }}>{d.slice(-2)}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 8 }}>{dayShifts.length} shift{dayShifts.length !== 1 ? "s" : ""}</Text>
      </View>

      {/* ── Shift List ── */}
      {isLoading ? <View style={{ padding: 24, gap: 10 }}><SkeletonCard /><SkeletonCard /></View> : dayShifts.length === 0 ? (
        <EmptyState icon={<CalendarDays size={32} color={colors.textMuted} />} title="No shifts" description="Tap + to add a shift" />
      ) : (
        <FlatList data={dayShifts} keyExtractor={(i) => i.id} contentContainerStyle={{ paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          renderItem={({ item }) => (
            <Pressable onPress={() => openEdit(item)} onLongPress={() => handleLongPress(item)} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{item.staff_name}</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{item.start_time} — {item.end_time}</Text>
              </View>
              <Badge variant="secondary">{item.role}</Badge>
            </Pressable>
          )}
        />
      )}

      <FAB onPress={openCreate} />

      {/* Shift Form */}
      <FormSheet visible={showForm} onClose={() => { setShowForm(false); resetForm(); }} onSave={handleSave} title={editing ? "Edit Shift" : "Add Shift"} saving={saving}>
        <Input label="Staff Name" value={staffName} onChangeText={setStaffName} placeholder="Who's working?" />
        <Select label="Role" value={role} onValueChange={setRole} options={ROLE_OPTIONS} />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}><DatePicker label="Start Time" value={startTime} onChange={setStartTime} mode="time" /></View>
          <View style={{ flex: 1 }}><DatePicker label="End Time" value={endTime} onChange={setEndTime} mode="time" /></View>
        </View>
        <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional notes" />
      </FormSheet>

      {/* Connect Provider Form */}
      <FormSheet visible={showConnectForm} onClose={() => setShowConnectForm(false)} onSave={handleSaveConnection}
        title={`Connect ${ROSTER_PROVIDERS.find((p) => p.key === connectProvider)?.label || ""}`} saveLabel="Connect">
        <Input label="API Key" value={apiKey} onChangeText={setApiKey} placeholder="Enter your API key" secureTextEntry />
        <Input label="API URL (optional)" value={apiUrl} onChangeText={setApiUrl} placeholder="https://api.example.com" />
        <View style={{ backgroundColor: colors.surface, borderRadius: 10, padding: 12 }}>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>
            Find your API key in your rostering software settings. This connection will allow automatic sync of shifts and rosters.
          </Text>
        </View>
      </FormSheet>
    </SafeAreaView>
  );
}
