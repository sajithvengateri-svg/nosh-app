import { useState, useMemo } from "react";
import { View, Text, FlatList, Pressable, RefreshControl, Alert, ActivityIndicator, ScrollView, LayoutAnimation, Platform, UIManager } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3, Sparkles, Camera, Paperclip, Mail, Wifi, ChevronDown, ChevronUp,
  PenLine, Archive, CheckCircle, FileText, Plus, ShoppingCart, TrendingUp, MessageSquare, Calculator,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../../lib/supabase";
import { useOrg } from "../../../contexts/OrgProvider";
import { useAuth } from "../../../contexts/AuthProvider";
import { useTheme } from "../../../contexts/ThemeProvider";
import { useToast } from "../../../contexts/ToastProvider";
import { Input } from "../../../components/ui/Input";
import { Badge } from "../../../components/ui/Badge";
import { TabBar } from "../../../components/ui/Tabs";
import { EmptyState } from "../../../components/ui/EmptyState";
import { SkeletonCard } from "../../../components/ui/Skeleton";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { FAB } from "../../../components/ui/FAB";
import { FormSheet } from "../../../components/ui/FormSheet";
import { Select } from "../../../components/ui/Select";
import { ImagePicker } from "../../../components/ui/ImagePicker";
import { useSalesContribution } from "../../../hooks/useSalesContribution";
import { lightTap, successNotification } from "../../../lib/haptics";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Menu {
  id: string;
  name: string;
  status: string;
  version: number | null;
  description: string | null;
  org_id: string | null;
  workflow_stage: string | null;
  archive_notes: string | null;
  remedial_notes: RemedialNote[] | null;
}

interface RemedialNote {
  id: string;
  text: string;
  author: string;
  date: string;
  item_id?: string;
  item_name?: string;
}

interface MenuItem {
  id: string;
  menu_id: string;
  name: string;
  price: number | null;
  cost: number | null;
  category: string | null;
  org_id: string | null;
  sales_contribution_pct: number | null;
  sales_contribution_forced: boolean;
  sales_contribution_override: number | null;
  created_at?: string;
}

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "draft", label: "Draft" },
  { key: "archived", label: "Archived" },
];

const STATUS_OPTIONS = [
  { label: "Draft", value: "draft" },
  { label: "Active", value: "active" },
  { label: "Archived", value: "archived" },
];

const WORKFLOW_STAGES = [
  { key: "input", label: "Input", icon: Plus },
  { key: "saved", label: "Save", icon: FileText },
  { key: "approved", label: "Approve", icon: CheckCircle },
  { key: "sales_added", label: "Sales", icon: ShoppingCart },
  { key: "analysed", label: "Analyse", icon: TrendingUp },
  { key: "acted", label: "Act", icon: PenLine },
  { key: "archived", label: "Archive", icon: Archive },
];

function classify(cost: number | null, price: number | null): { label: string; color: string } {
  if (!cost || !price || price === 0) return { label: "\u2014", color: "#9CA3AF" };
  const pct = (cost / price) * 100;
  if (pct <= 25) return { label: "Star", color: "#10B981" };
  if (pct <= 35) return { label: "Plow Horse", color: "#3B82F6" };
  if (pct <= 50) return { label: "Puzzle", color: "#F59E0B" };
  return { label: "Dog", color: "#EF4444" };
}

function getStageIndex(stage: string | null): number {
  const idx = WORKFLOW_STAGES.findIndex((s) => s.key === stage);
  return idx >= 0 ? idx : 0;
}

// ── Workflow Progress Bar ──
function WorkflowBar({ stage, colors }: { stage: string | null; colors: any }) {
  const activeIdx = getStageIndex(stage);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 4, paddingVertical: 6 }}>
      {WORKFLOW_STAGES.map((s, i) => {
        const Icon = s.icon;
        const isActive = i <= activeIdx;
        const isCurrent = i === activeIdx;
        return (
          <View key={s.key} style={{ flex: 1, alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", width: "100%" }}>
              {i > 0 && <View style={{ flex: 1, height: 2, backgroundColor: i <= activeIdx ? colors.accent : colors.border }} />}
              <View style={{
                width: isCurrent ? 24 : 18, height: isCurrent ? 24 : 18, borderRadius: 12,
                backgroundColor: isActive ? colors.accent : colors.surface,
                borderWidth: isCurrent ? 2 : 0, borderColor: colors.accent + "50",
                alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={isCurrent ? 11 : 9} color={isActive ? "#FFFFFF" : colors.textMuted} strokeWidth={2} />
              </View>
              {i < WORKFLOW_STAGES.length - 1 && <View style={{ flex: 1, height: 2, backgroundColor: i < activeIdx ? colors.accent : colors.border }} />}
            </View>
            <Text style={{ fontSize: 8, fontWeight: isCurrent ? "700" : "500", color: isActive ? colors.accent : colors.textMuted, marginTop: 3 }}>
              {s.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function MenuEngineering() {
  const { colors } = useTheme();
  const router = useRouter();
  const { currentOrg } = useOrg();
  const { profile } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: menus, isLoading, refetch, isRefetching } = useQuery<Menu[]>({
    queryKey: ["menus", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from("menus").select("*").eq("org_id", orgId).order("created_at", { ascending: false });
      if (error) throw error;
      return (data as Menu[]) || [];
    },
    enabled: !!orgId,
  });

  const createMenu = useMutation({
    mutationFn: async (menu: Partial<Menu>) => {
      const { error } = await supabase.from("menus").insert({ ...menu, org_id: orgId });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menus"] }),
  });

  const updateMenu = useMutation({
    mutationFn: async ({ id, ...u }: Partial<Menu> & { id: string }) => {
      const { error } = await supabase.from("menus").update(u).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menus"] }),
  });

  const deleteMenu = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("menus").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menus"] }),
  });

  const forceContribution = useMutation({
    mutationFn: async ({ itemId, value }: { itemId: string; value: number }) => {
      const { error } = await supabase.from("menu_items").update({
        sales_contribution_override: value,
        sales_contribution_forced: true,
        sales_contribution_pct: value,
      }).eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu-items"] }),
  });

  // Menu items for expanded view
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data: menuItems } = useQuery<MenuItem[]>({
    queryKey: ["menu-items", expandedId],
    queryFn: async () => {
      if (!expandedId) return [];
      const { data, error } = await supabase.from("menu_items").select("id, menu_id, name, price, cost, category, org_id, sales_contribution_pct, sales_contribution_forced, sales_contribution_override, created_at").eq("menu_id", expandedId).order("name");
      if (error) throw error;
      return (data as MenuItem[]) || [];
    },
    enabled: !!expandedId,
  });

  const { syncSales, isSyncing } = useSalesContribution();
  const [showContribForm, setShowContribForm] = useState(false);
  const [contribItem, setContribItem] = useState<MenuItem | null>(null);
  const [contribValue, setContribValue] = useState("");

  const [tab, setTab] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Menu | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("draft");

  // Notes state
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteMenuId, setNoteMenuId] = useState<string | null>(null);
  const [noteItemId, setNoteItemId] = useState<string | null>(null);
  const [noteItemName, setNoteItemName] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState<Set<string>>(new Set());

  // Archive state
  const [showArchiveForm, setShowArchiveForm] = useState(false);
  const [archiveMenuId, setArchiveMenuId] = useState<string | null>(null);
  const [archiveNotes, setArchiveNotes] = useState("");

  // Scan state
  const [showScanPicker, setShowScanPicker] = useState(false);

  const filtered = useMemo(() => {
    if (!menus) return [];
    if (tab === "all") return menus;
    return menus.filter((m) => m.status === tab);
  }, [menus, tab]);

  const resetForm = () => { setName(""); setDescription(""); setStatus("draft"); setEditing(null); };
  const openCreate = () => { resetForm(); setShowForm(true); };
  const openEdit = (menu: Menu) => {
    setEditing(menu); setName(menu.name || ""); setDescription(menu.description || ""); setStatus(menu.status || "draft"); setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Error", "Menu name is required"); return; }
    setSaving(true);
    try {
      if (editing) await updateMenu.mutateAsync({ id: editing.id, name: name.trim(), description: description.trim() || null, status });
      else await createMenu.mutateAsync({ name: name.trim(), description: description.trim() || null, status, workflow_stage: "input" } as any);
      setShowForm(false); resetForm();
    } catch (e: any) { Alert.alert("Error", e.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleLongPress = (menu: Menu) => {
    const actions: any[] = [
      { text: "Edit", onPress: () => openEdit(menu) },
      { text: "Add Note", onPress: () => { setNoteMenuId(menu.id); setNoteItemId(null); setNoteItemName(null); setNoteText(""); setShowNoteForm(true); } },
    ];
    if (menu.status !== "archived") {
      actions.push({ text: "Archive", onPress: () => { setArchiveMenuId(menu.id); setArchiveNotes(""); setShowArchiveForm(true); } });
    }
    actions.push(
      { text: "Delete", style: "destructive", onPress: () => Alert.alert("Delete Menu", `Delete "${menu.name}"?`, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => deleteMenu.mutate(menu.id) }]) },
      { text: "Cancel", style: "cancel" },
    );
    Alert.alert(menu.name, "What would you like to do?", actions);
  };

  const handleSyncSales = async () => {
    try {
      await syncSales("90d");
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      showToast({ title: "Sales Synced", message: "Contribution data updated from POS", type: "success" });
    } catch (e: any) {
      showToast({ title: "Error", message: e.message || "Failed to sync", type: "error" });
    }
  };

  const handleSaveContrib = async () => {
    if (!contribItem || !contribValue) return;
    try {
      await forceContribution.mutateAsync({ itemId: contribItem.id, value: parseFloat(contribValue) });
      setShowContribForm(false);
      successNotification();
    } catch (e: any) { Alert.alert("Error", e.message || "Failed to save"); }
  };

  const handleSaveNote = async () => {
    if (!noteText.trim() || !noteMenuId) return;
    const menu = menus?.find((m) => m.id === noteMenuId);
    if (!menu) return;
    const newNote: RemedialNote = {
      id: `note-${Date.now()}`,
      text: noteText.trim(),
      author: profile?.display_name || "Chef",
      date: new Date().toISOString().split("T")[0],
      item_id: noteItemId || undefined,
      item_name: noteItemName || undefined,
    };
    const existing: RemedialNote[] = Array.isArray(menu.remedial_notes) ? menu.remedial_notes : [];
    try {
      await updateMenu.mutateAsync({ id: noteMenuId, remedial_notes: [...existing, newNote] as any });
      setShowNoteForm(false);
      successNotification();
      showToast({ title: "Note Saved", message: "Remedial note added for future reference", type: "success" });
    } catch (e: any) { Alert.alert("Error", e.message || "Failed to save note"); }
  };

  const handleArchive = async () => {
    if (!archiveMenuId) return;
    try {
      await updateMenu.mutateAsync({ id: archiveMenuId, status: "archived", archive_notes: archiveNotes.trim() || null, workflow_stage: "archived" } as any);
      setShowArchiveForm(false);
      successNotification();
      showToast({ title: "Menu Archived", message: "Menu has been archived with notes", type: "success" });
    } catch (e: any) { Alert.alert("Error", e.message || "Failed to archive"); }
  };

  const handleScanMenu = async (base64: string) => {
    setShowScanPicker(false);
    try {
      const { data, error } = await supabase.functions.invoke("extract-menu", { body: { image_base64: base64, file_type: "image/jpeg" } });
      if (error) throw error;
      showToast({ title: "Menu Scanned", message: `${data?.items?.length || 0} items extracted`, type: "success" });
      queryClient.invalidateQueries({ queryKey: ["menus"] });
    } catch (e: any) {
      showToast({ title: "Scan Failed", message: e.message || "Could not extract menu", type: "error" });
    }
  };

  const toggleNotes = (menuId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowNotes((prev) => {
      const next = new Set(prev);
      if (next.has(menuId)) next.delete(menuId);
      else next.add(menuId);
      return next;
    });
  };

  // Compute average cost per menu
  const avgCost = useMemo(() => {
    if (!menuItems || !expandedId) return null;
    const withCost = menuItems.filter((mi) => mi.cost != null && mi.price != null && mi.price > 0);
    if (withCost.length === 0) return null;
    const avg = withCost.reduce((a, mi) => a + ((mi.cost! / mi.price!) * 100), 0) / withCost.length;
    return avg;
  }, [menuItems, expandedId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Menu Engineering" rightAction={
        <Pressable onPress={() => { lightTap(); router.push("/(app)/costing"); }}
          style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
          <Calculator size={18} color={colors.success} strokeWidth={1.5} />
        </Pressable>
      } />

      {/* ── Quick Actions ── */}
      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 6 }}>
        <Pressable onPress={() => { lightTap(); setShowScanPicker(!showScanPicker); }}
          style={({ pressed }) => ({
            flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
            backgroundColor: colors.accent + "15", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 8,
            borderWidth: 1, borderColor: colors.accent + "30", opacity: pressed ? 0.8 : 1,
          })}>
          <Camera size={15} color={colors.accent} strokeWidth={1.5} />
          <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: "700", color: colors.accent }}>Scan</Text>
        </Pressable>
        <Pressable onPress={() => { lightTap(); showToast({ title: "Coming Soon", message: "File upload will be available soon", type: "info" }); }}
          style={({ pressed }) => ({
            flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
            backgroundColor: colors.success + "15", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 8,
            borderWidth: 1, borderColor: colors.success + "30", opacity: pressed ? 0.8 : 1,
          })}>
          <Paperclip size={15} color={colors.success} strokeWidth={1.5} />
          <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: "700", color: colors.success }}>File</Text>
        </Pressable>
        <Pressable onPress={() => { lightTap(); showToast({ title: "Email Import", message: "Send menus to import@queitos.app (coming soon)", type: "info" }); }}
          style={({ pressed }) => ({
            flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
            backgroundColor: colors.warning + "15", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 8,
            borderWidth: 1, borderColor: colors.warning + "30", opacity: pressed ? 0.8 : 1,
          })}>
          <Mail size={15} color={colors.warning} strokeWidth={1.5} />
          <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: "700", color: colors.warning }}>Email</Text>
        </Pressable>
        <Pressable onPress={handleSyncSales} disabled={isSyncing}
          style={({ pressed }) => ({
            flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
            backgroundColor: colors.accent + "15", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 8,
            borderWidth: 1, borderColor: colors.accent + "30", opacity: pressed || isSyncing ? 0.8 : 1,
          })}>
          {isSyncing ? <ActivityIndicator size="small" color={colors.accent} /> : <Wifi size={15} color={colors.accent} strokeWidth={1.5} />}
          <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: "700", color: colors.accent }}>Sync</Text>
        </Pressable>
      </View>

      {/* Scan Picker */}
      {showScanPicker && (
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <ImagePicker onImageSelected={handleScanMenu} label="" buttonText="Take Photo of Menu" />
        </View>
      )}

      {/* Status Tabs */}
      <View style={{ paddingHorizontal: 24 }}>
        <TabBar tabs={STATUS_TABS} activeTab={tab} onTabChange={setTab} accentColor={colors.accent} style={{ marginBottom: 8 }} />
      </View>

      {/* Menu List */}
      {isLoading ? <View style={{ padding: 24, gap: 10 }}><SkeletonCard /><SkeletonCard /></View> : filtered.length === 0 ? (
        <EmptyState icon={<BarChart3 size={32} color={colors.textMuted} />} title="No menus" description="Tap + to create a menu" />
      ) : (
        <FlatList data={filtered} keyExtractor={(i) => i.id} contentContainerStyle={{ padding: 16, paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          renderItem={({ item: menu }) => {
            const isExpanded = expandedId === menu.id;
            const notes: RemedialNote[] = Array.isArray(menu.remedial_notes) ? menu.remedial_notes : [];
            const notesVisible = showNotes.has(menu.id);

            return (
              <View style={{ backgroundColor: colors.background, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 10, overflow: "hidden" }}>
                {/* Menu Header */}
                <Pressable onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setExpandedId(isExpanded ? null : menu.id); }} onLongPress={() => handleLongPress(menu)} style={{ padding: 16 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>{menu.name}</Text>
                      {menu.description && <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }} numberOfLines={1}>{menu.description}</Text>}
                    </View>
                    <Badge variant={menu.status === "active" ? "success" : menu.status === "draft" ? "warning" : "secondary"}>{menu.status}</Badge>
                  </View>

                  {/* Workflow Progress */}
                  <View style={{ marginTop: 10 }}>
                    <WorkflowBar stage={menu.workflow_stage} colors={colors} />
                  </View>
                </Pressable>

                {/* Expanded: Menu Items Table */}
                {isExpanded && menuItems && (
                  <View style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                    {/* Table Header */}
                    <View style={{ flexDirection: "row", paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.surface }}>
                      <Text style={{ flex: 2, fontSize: 10, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase" }}>Item</Text>
                      <Text style={{ width: 50, fontSize: 10, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", textAlign: "right" }}>Cost %</Text>
                      <Text style={{ width: 50, fontSize: 10, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", textAlign: "right" }}>Sales %</Text>
                      <Text style={{ width: 65, fontSize: 10, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", textAlign: "right" }}>Status</Text>
                    </View>

                    {menuItems.length === 0 ? (
                      <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center", paddingVertical: 12 }}>No items in this menu</Text>
                    ) : menuItems.map((mi) => {
                      const cls = classify(mi.cost, mi.price);
                      const costPct = mi.cost && mi.price && mi.price > 0 ? ((mi.cost / mi.price) * 100) : null;
                      const contribPct = mi.sales_contribution_forced ? mi.sales_contribution_override : mi.sales_contribution_pct;
                      return (
                        <Pressable key={mi.id}
                          onPress={() => { setNoteMenuId(menu.id); setNoteItemId(mi.id); setNoteItemName(mi.name); setNoteText(""); setShowNoteForm(true); }}
                          onLongPress={() => { setContribItem(mi); setContribValue(String(mi.sales_contribution_pct || "")); setShowContribForm(true); }}
                          style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.surface }}>
                          <View style={{ flex: 2 }}>
                            <Text style={{ fontSize: 13, fontWeight: "500", color: colors.text }} numberOfLines={1}>{mi.name}</Text>
                            {mi.category && <Text style={{ fontSize: 10, color: colors.textMuted }}>{mi.category}</Text>}
                          </View>
                          <Text style={{ width: 50, fontSize: 12, fontWeight: "600", color: costPct != null ? (costPct <= 30 ? colors.success : costPct <= 45 ? colors.warning : colors.destructive) : colors.textMuted, textAlign: "right" }}>
                            {costPct != null ? `${costPct.toFixed(0)}%` : "—"}
                          </Text>
                          <View style={{ width: 50, alignItems: "flex-end" }}>
                            <Text style={{ fontSize: 12, fontWeight: "600", color: contribPct != null && contribPct > 0 ? colors.accent : colors.textMuted, textAlign: "right" }}>
                              {contribPct != null && contribPct > 0 ? `${contribPct.toFixed(1)}%` : "—"}
                            </Text>
                            {mi.sales_contribution_forced && <Text style={{ fontSize: 7, color: colors.textMuted }}>manual</Text>}
                          </View>
                          <View style={{ width: 65, alignItems: "flex-end" }}>
                            <View style={{ backgroundColor: cls.color + "20", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                              <Text style={{ fontSize: 10, fontWeight: "700", color: cls.color }}>{cls.label}</Text>
                            </View>
                          </View>
                        </Pressable>
                      );
                    })}

                    {/* Average Cost Row */}
                    {avgCost != null && (
                      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.surface }}>
                        <Text style={{ flex: 2, fontSize: 12, fontWeight: "700", color: colors.text }}>Average</Text>
                        <Text style={{ width: 50, fontSize: 12, fontWeight: "800", color: avgCost <= 30 ? colors.success : avgCost <= 45 ? colors.warning : colors.destructive, textAlign: "right" }}>
                          {avgCost.toFixed(0)}%
                        </Text>
                        <View style={{ width: 50 }} />
                        <View style={{ width: 65 }} />
                      </View>
                    )}

                    {/* Action Buttons */}
                    <View style={{ flexDirection: "row", gap: 8, padding: 12 }}>
                      <Pressable onPress={() => { lightTap(); setNoteMenuId(menu.id); setNoteItemId(null); setNoteItemName(null); setNoteText(""); setShowNoteForm(true); }}
                        style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: colors.accentBg, paddingVertical: 8, borderRadius: 8 }}>
                        <MessageSquare size={12} color={colors.accent} strokeWidth={1.5} />
                        <Text style={{ fontSize: 11, fontWeight: "600", color: colors.accent }}>Add Note</Text>
                      </Pressable>
                      {notes.length > 0 && (
                        <Pressable onPress={() => toggleNotes(menu.id)}
                          style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: colors.surface, paddingVertical: 8, borderRadius: 8 }}>
                          <FileText size={12} color={colors.textSecondary} strokeWidth={1.5} />
                          <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textSecondary }}>Notes ({notes.length})</Text>
                        </Pressable>
                      )}
                    </View>

                    {/* Notes Section */}
                    {notesVisible && notes.length > 0 && (
                      <View style={{ padding: 12, gap: 6, backgroundColor: colors.surface }}>
                        {notes.map((note) => (
                          <View key={note.id} style={{ backgroundColor: colors.card, borderRadius: 10, padding: 10 }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.accent }}>{note.author}</Text>
                              <Text style={{ fontSize: 10, color: colors.textMuted }}>{note.date}</Text>
                            </View>
                            {note.item_name && <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>Re: {note.item_name}</Text>}
                            <Text style={{ fontSize: 12, color: colors.text, marginTop: 4 }}>{note.text}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Archive Notes (for archived menus) */}
                    {menu.status === "archived" && menu.archive_notes && (
                      <View style={{ padding: 12, backgroundColor: colors.warningBg }}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: colors.warning }}>Archive Notes</Text>
                        <Text style={{ fontSize: 12, color: colors.text, marginTop: 4 }}>{menu.archive_notes}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          }}
        />
      )}

      <FAB onPress={openCreate} />

      {/* Create/Edit Menu Form */}
      <FormSheet visible={showForm} onClose={() => { setShowForm(false); resetForm(); }} onSave={handleSave} title={editing ? "Edit Menu" : "New Menu"} saving={saving}>
        <Input label="Menu Name" value={name} onChangeText={setName} placeholder="Spring Menu, Prix Fixe, etc." />
        <Select label="Status" value={status} onValueChange={setStatus} options={STATUS_OPTIONS} />
        <Input label="Description" value={description} onChangeText={setDescription} placeholder="Optional description" multiline numberOfLines={2} style={{ minHeight: 60, textAlignVertical: "top" }} />
      </FormSheet>

      {/* Sales Contribution Override */}
      <FormSheet visible={showContribForm} onClose={() => setShowContribForm(false)} onSave={handleSaveContrib} title="Set Sales Contribution %" saving={forceContribution.isPending}>
        {contribItem && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 14 }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{contribItem.name}</Text>
            <Text style={{ fontSize: 13, color: colors.textMuted }}>Current: {contribItem.sales_contribution_pct?.toFixed(1) || "\u2014"}%</Text>
          </View>
        )}
        <Input label="Contribution %" value={contribValue} onChangeText={setContribValue} placeholder="e.g. 12.5" keyboardType="decimal-pad" />
      </FormSheet>

      {/* Add Note Form */}
      <FormSheet visible={showNoteForm} onClose={() => setShowNoteForm(false)} onSave={handleSaveNote} title="Add Remedial Note" saveLabel="Save Note">
        {noteItemName && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 10, padding: 12 }}>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>For item: <Text style={{ fontWeight: "600", color: colors.text }}>{noteItemName}</Text></Text>
          </View>
        )}
        <Input label="Note" value={noteText} onChangeText={setNoteText} placeholder="What action was taken or needs to be taken?" multiline numberOfLines={3} style={{ minHeight: 80, textAlignVertical: "top" }} />
        <View style={{ backgroundColor: colors.accentBg, borderRadius: 10, padding: 12 }}>
          <Text style={{ fontSize: 11, color: colors.accent }}>Notes are saved for future AI analysis and chef reference.</Text>
        </View>
      </FormSheet>

      {/* Archive Form */}
      <FormSheet visible={showArchiveForm} onClose={() => setShowArchiveForm(false)} onSave={handleArchive} title="Archive Menu" saveLabel="Archive">
        <Input label="Archive Notes" value={archiveNotes} onChangeText={setArchiveNotes} placeholder="What worked? What didn't? Key learnings..." multiline numberOfLines={4} style={{ minHeight: 100, textAlignVertical: "top" }} />
        <View style={{ backgroundColor: colors.warningBg, borderRadius: 10, padding: 12 }}>
          <Text style={{ fontSize: 11, color: colors.warning }}>Archived menus are kept for reference. Notes help future menu planning.</Text>
        </View>
      </FormSheet>
    </SafeAreaView>
  );
}
