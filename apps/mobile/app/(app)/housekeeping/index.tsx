import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import { supabase } from "../../../lib/supabase";
import { useOrg } from "../../../contexts/OrgProvider";
import { useTheme } from "../../../contexts/ThemeProvider";
import { useSystemHealth, type ModuleHealth } from "../../../hooks/useSystemHealth";
import { EmptyState } from "../../../components/ui/EmptyState";
import { SkeletonCard } from "../../../components/ui/Skeleton";
import { FAB } from "../../../components/ui/FAB";
import { FormSheet } from "../../../components/ui/FormSheet";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { TabBar } from "../../../components/ui/Tabs";
import { Badge } from "../../../components/ui/Badge";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { Home, Wrench, Activity, Bell, ChevronRight } from "lucide-react-native";
import { ServiceLogTab } from "../../../components/features/ServiceLogTab";
import { OilManagementTab } from "../../../components/features/OilManagementTab";
import { SOPDocumentTab } from "../../../components/features/SOPDocumentTab";
import { FirstAidLogCard } from "../../../components/features/FirstAidLogCard";
import { MaintenanceLogDialog } from "../../../components/features/MaintenanceLogDialog";
import { isHomeCook, isCompliance } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";

const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;
const IS_HOME_COOK = isHomeCook(APP_VARIANT);
const IS_COMPLIANCE = isCompliance(APP_VARIANT);

const AREAS = [
  { label: "Kitchen", value: "kitchen" },
  { label: "Dining", value: "dining" },
  { label: "Bathroom", value: "bathroom" },
  { label: "Storage", value: "storage" },
  { label: "Exterior", value: "exterior" },
  { label: "Office", value: "office" },
];

const FREQUENCIES = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

const ALL_TABS = [
  { key: "hood", label: "Hood" },
  { key: "grease", label: "Grease" },
  { key: "oil", label: "Oil" },
  { key: "waste", label: "Waste" },
  { key: "tanks", label: "Tanks" },
  { key: "firstAid", label: "First Aid" },
  { key: "sops", label: "SOPs" },
  { key: "cleaning", label: "Cleaning" },
  { key: "equipment", label: "Equipment" },
  { key: "dataHealth", label: "Health" },
];

// Home cook: Cleaning, Equipment, Health
// Compliance: Cleaning, Equipment, Health, SOPs
// Pro: All 10 tabs
const HOME_COOK_TABS = ["cleaning", "equipment", "dataHealth"];
const COMPLIANCE_TABS = ["cleaning", "equipment", "dataHealth", "sops"];

const TABS = IS_HOME_COOK
  ? ALL_TABS.filter((t) => HOME_COOK_TABS.includes(t.key))
  : IS_COMPLIANCE
  ? ALL_TABS.filter((t) => COMPLIANCE_TABS.includes(t.key))
  : ALL_TABS;

const REMINDER_PERIODS = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
  { key: "yearly", label: "Yearly" },
];

interface Reminder {
  title: string;
  description: string;
  module: string;
  route: string;
}

const REMINDERS: Record<string, Reminder[]> = {
  daily: [
    { title: "Complete prep lists", description: "Review and complete today's prep lists to stay ahead of service", module: "chefos", route: "/(app)/chefos/prep" },
    { title: "Log waste for service", description: "Record any food waste from today's service for tracking", module: "chefos", route: "/(app)/chefos/waste" },
    { title: "Check food safety temps", description: "Log fridge, freezer, and hot-hold temperatures", module: "chefos", route: "/(app)/chefos/food-safety" },
  ],
  weekly: [
    { title: "Update inventory counts", description: "Perform a weekly stocktake and reconcile against POS data", module: "chefos", route: "/(app)/chefos/inventory" },
    { title: "Review recipe costs", description: "Check recipe costings against current supplier prices", module: "chefos", route: "/(app)/chefos/recipes" },
    { title: "Review team roster", description: "Confirm next week's roster and flag any gaps", module: "labouros", route: "/(app)/labouros" },
  ],
  monthly: [
    { title: "Audit allergen declarations", description: "Verify all menu items have correct allergen info", module: "chefos", route: "/(app)/chefos/allergens" },
    { title: "Review staff training", description: "Check training records and schedule upcoming sessions", module: "labouros", route: "/(app)/labouros/training" },
    { title: "Equipment maintenance", description: "Review maintenance schedules and service any due equipment", module: "equipment", route: "/(app)/housekeeping" },
  ],
  quarterly: [
    { title: "Full equipment audit", description: "Comprehensive audit of all equipment condition and warranties", module: "equipment", route: "/(app)/housekeeping" },
    { title: "Menu engineering review", description: "Analyse menu item profitability and popularity", module: "restos", route: "/(app)/restos/menu-engineering" },
    { title: "Food safety self-assessment", description: "Complete an internal food safety audit against regulations", module: "chefos", route: "/(app)/chefos/food-safety" },
  ],
  yearly: [
    { title: "Supplier contract review", description: "Review and renegotiate supplier contracts for best pricing", module: "overheados", route: "/(app)/overheados/suppliers" },
    { title: "Full food safety audit", description: "Engage external auditor for a comprehensive food safety review", module: "chefos", route: "/(app)/chefos/food-safety" },
    { title: "Update team certifications", description: "Ensure all staff certifications are current and renew as needed", module: "labouros", route: "/(app)/labouros/training" },
  ],
};

const RESTAURANT_ROUTE_MAP: Record<string, string> = {
  chefos: "/(app)/chefos",
  bevos: "/(app)/bevos",
  restos: "/(app)/restos",
  overheados: "/(app)/overheados",
  labouros: "/(app)/labouros",
  reservationos: "/(app)/reservationos",
};

const HOME_COOK_ROUTE_MAP: Record<string, string> = {
  recipes: "/(app)/(tabs)/kitchen",
  ingredients: "/(app)/(tabs)/kitchen",
  food_safety: "/(app)/chefos/food-safety",
  prep_lists: "/(app)/(tabs)/kitchen",
  cleaning: "/(app)/housekeeping",
  waste: "/(app)/chefos/waste",
};

const MODULE_ROUTE_MAP = IS_HOME_COOK ? HOME_COOK_ROUTE_MAP : RESTAURANT_ROUTE_MAP;

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}

interface Equipment {
  id: string;
  name: string;
  status: string;
  location: string | null;
  next_maintenance: string | null;
  last_maintenance: string | null;
}

export default function Housekeeping() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { currentOrg } = useOrg();
  const { colors } = useTheme();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(
    params.tab && TABS.some((t) => t.key === params.tab) ? params.tab : (TABS[0]?.key ?? "cleaning")
  );

  // React to param changes when page is already mounted
  useEffect(() => {
    if (params.tab && TABS.some((t) => t.key === params.tab)) {
      setActiveTab(params.tab);
    }
  }, [params.tab]);
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [reminderPeriod, setReminderPeriod] = useState("daily");

  // System health query
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth, isRefetching: healthRefetching } = useSystemHealth();

  // Cleaning tasks query
  const { data: tasks, isLoading, refetch, isRefetching } = useQuery<any[]>({
    queryKey: ["housekeeping", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from("housekeeping_tasks").select("*").eq("org_id", orgId).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  // Equipment health query
  const { data: equipment, isLoading: equipLoading, refetch: refetchEquip, isRefetching: equipRefetching } = useQuery<Equipment[]>({
    queryKey: ["equipment-list", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from("equipment").select("*").eq("org_id", orgId).order("name");
      if (error) throw error;
      return (data as Equipment[]) || [];
    },
    enabled: !!orgId,
  });

  const [showForm, setShowForm] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [area, setArea] = useState("kitchen");
  const [frequency, setFrequency] = useState("daily");
  const [assignedTo, setAssignedTo] = useState("");
  const [notes, setNotes] = useState("");

  const createTask = useMutation({
    mutationFn: async () => {
      if (!taskName.trim()) throw new Error("Task name required");
      const { error } = await supabase.from("housekeeping_tasks").insert({
        task_name: taskName.trim(), area, frequency,
        assigned_to: assignedTo.trim() || null,
        notes: notes.trim() || null,
        status: "pending", org_id: orgId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["housekeeping"] });
      setShowForm(false);
      setTaskName(""); setAssignedTo(""); setNotes("");
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const completeTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("housekeeping_tasks").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["housekeeping"] }),
  });

  const markServiced = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("equipment").update({
        status: "operational",
        last_maintenance: new Date().toISOString().split("T")[0],
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment-list"] });
      queryClient.invalidateQueries({ queryKey: ["equipment-health"] });
    },
  });

  const pendingTasks = tasks?.filter((t) => t.status !== "completed") || [];
  const completedTasks = tasks?.filter((t) => t.status === "completed") || [];

  const operational = equipment?.filter((e) => e.status === "operational") || [];
  const needsMaintenance = equipment?.filter((e) => e.status === "needs_maintenance") || [];
  const outOfService = equipment?.filter((e) => e.status === "broken" || e.status === "out_of_service") || [];

  const today = new Date().toISOString().split("T")[0];
  const overdueEquipment = equipment?.filter((e) => e.next_maintenance && e.next_maintenance < today) || [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Housekeeping" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 44, marginHorizontal: 16, marginTop: 12, marginBottom: 8 }}>
        <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      </ScrollView>

      {activeTab === "hood" && <ServiceLogTab serviceType="hood_cleaning" title="Hood & Vent Cleaning" />}
      {activeTab === "grease" && <ServiceLogTab serviceType="grease_trap" title="Grease Trap Service" />}
      {activeTab === "oil" && <OilManagementTab />}
      {activeTab === "waste" && <ServiceLogTab serviceType="waste_disposal" title="Waste Disposal" />}
      {activeTab === "tanks" && <ServiceLogTab serviceType="tank_service" title="Tank Service" />}
      {activeTab === "firstAid" && <FirstAidLogCard />}
      {activeTab === "sops" && <SOPDocumentTab />}

      {activeTab === "cleaning" && (
        <>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
            {isLoading ? (
              <View style={{ gap: 10 }}><SkeletonCard /><SkeletonCard /></View>
            ) : (tasks?.length || 0) === 0 ? (
              <EmptyState icon={<View><Home size={24} color={colors.textMuted} /></View>} title="No housekeeping tasks" description="Tap + to create cleaning schedules" />
            ) : (
              <>
                {pendingTasks.length > 0 && (
                  <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 }}>Pending ({pendingTasks.length})</Text>
                    {pendingTasks.map((task) => (
                      <Pressable
                        key={task.id}
                        onPress={() => {
                          Alert.alert("Complete Task", `Mark "${task.task_name}" as done?`, [
                            { text: "Cancel", style: "cancel" },
                            { text: "Complete", onPress: () => completeTask.mutate(task.id) },
                          ]);
                        }}
                        style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 10, gap: 4 }}
                      >
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                          <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{task.task_name}</Text>
                          <View style={{ backgroundColor: colors.accentBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                            <Text style={{ fontSize: 11, color: colors.accent, fontWeight: "600" }}>{task.frequency}</Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 13, color: colors.textSecondary }}>{task.area}</Text>
                        {task.assigned_to && <Text style={{ fontSize: 12, color: colors.textMuted }}>Assigned: {task.assigned_to}</Text>}
                      </Pressable>
                    ))}
                  </View>
                )}
                {completedTasks.length > 0 && (
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 }}>Completed ({completedTasks.length})</Text>
                    {completedTasks.slice(0, 10).map((task) => (
                      <View key={task.id} style={{ backgroundColor: colors.successBg, borderRadius: 12, padding: 14, marginBottom: 10, gap: 4, opacity: 0.7 }}>
                        <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text, textDecorationLine: "line-through" }}>{task.task_name}</Text>
                        <Text style={{ fontSize: 13, color: colors.textSecondary }}>{task.area}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </ScrollView>
          <FAB onPress={() => { setTaskName(""); setArea("kitchen"); setFrequency("daily"); setAssignedTo(""); setNotes(""); setShowForm(true); }} />
        </>
      )}

      {activeTab === "equipment" && (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={equipRefetching} onRefresh={refetchEquip} />}>
          {equipLoading ? (
            <View style={{ gap: 10 }}><SkeletonCard /><SkeletonCard /></View>
          ) : !equipment || equipment.length === 0 ? (
            <EmptyState icon={<View><Wrench size={24} color={colors.textMuted} /></View>} title="No equipment tracked" description="Add equipment from the Equipment page to see system health" />
          ) : (
            <>
              {/* Traffic-light summary */}
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
                <View style={{ flex: 1, backgroundColor: colors.successBg, borderRadius: 14, padding: 14, alignItems: "center" }}>
                  <Text style={{ fontSize: 24, fontWeight: "800", color: colors.success }}>{operational.length}</Text>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: colors.success, marginTop: 2 }}>Operational</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: colors.warningBg, borderRadius: 14, padding: 14, alignItems: "center" }}>
                  <Text style={{ fontSize: 24, fontWeight: "800", color: colors.warning }}>{needsMaintenance.length}</Text>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: colors.warning, marginTop: 2 }}>Maintenance</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: colors.destructiveBg, borderRadius: 14, padding: 14, alignItems: "center" }}>
                  <Text style={{ fontSize: 24, fontWeight: "800", color: colors.destructive }}>{outOfService.length}</Text>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: colors.destructive, marginTop: 2 }}>Out of Service</Text>
                </View>
              </View>

              {/* Overdue maintenance alert */}
              {overdueEquipment.length > 0 && (
                <View style={{ backgroundColor: colors.destructiveBg, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.destructive }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.destructive }}>Overdue Maintenance ({overdueEquipment.length})</Text>
                  <Text style={{ fontSize: 12, color: colors.destructive, marginTop: 4 }}>
                    {overdueEquipment.map((e) => e.name).join(", ")}
                  </Text>
                </View>
              )}

              {/* Equipment needing attention */}
              {(needsMaintenance.length > 0 || outOfService.length > 0) && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 }}>Needs Attention</Text>
                  {[...outOfService, ...needsMaintenance].map((item) => (
                    <View key={item.id} style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 10, gap: 6 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{item.name}</Text>
                        <Badge variant={item.status === "needs_maintenance" ? "warning" : "destructive"}>
                          {item.status === "needs_maintenance" ? "Maintenance" : "Out of Service"}
                        </Badge>
                      </View>
                      {item.location && <Text style={{ fontSize: 13, color: colors.textSecondary }}>{item.location}</Text>}
                      {item.next_maintenance && (
                        <Text style={{ fontSize: 12, color: item.next_maintenance < today ? colors.destructive : colors.textMuted }}>
                          Next maintenance: {item.next_maintenance}{item.next_maintenance < today ? " (OVERDUE)" : ""}
                        </Text>
                      )}
                      <Pressable
                        onPress={() => {
                          Alert.alert("Mark as Serviced", `Set "${item.name}" to operational?`, [
                            { text: "Cancel", style: "cancel" },
                            { text: "Mark Serviced", onPress: () => markServiced.mutate(item.id) },
                          ]);
                        }}
                        style={{ backgroundColor: colors.success, borderRadius: 8, paddingVertical: 8, alignItems: "center", marginTop: 4 }}
                      >
                        <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 13 }}>Mark as Serviced</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              {/* All operational equipment */}
              {operational.length > 0 && (
                <View>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 }}>Operational ({operational.length})</Text>
                  {operational.map((item) => (
                    <View key={item.id} style={{ backgroundColor: colors.successBg, borderRadius: 12, padding: 14, marginBottom: 10, gap: 4 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{item.name}</Text>
                        <Badge variant="success">Operational</Badge>
                      </View>
                      {item.location && <Text style={{ fontSize: 13, color: colors.textSecondary }}>{item.location}</Text>}
                      {item.last_maintenance && <Text style={{ fontSize: 12, color: colors.textMuted }}>Last serviced: {item.last_maintenance}</Text>}
                      {item.next_maintenance && (
                        <Text style={{ fontSize: 12, color: item.next_maintenance < today ? colors.destructive : colors.textMuted }}>
                          Next: {item.next_maintenance}{item.next_maintenance < today ? " (OVERDUE)" : ""}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
      {activeTab === "equipment" && (
        <>
          <FAB onPress={() => setShowMaintenance(true)} color={colors.accent} />
          <MaintenanceLogDialog
            visible={showMaintenance}
            onClose={() => setShowMaintenance(false)}
            equipmentList={(equipment || []).map((e) => ({ id: e.id, name: e.name }))}
          />
        </>
      )}

      {activeTab === "dataHealth" && (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={healthRefetching} onRefresh={() => refetchHealth()} />}
        >
          {healthLoading ? (
            <View style={{ gap: 10 }}><SkeletonCard /><SkeletonCard /><SkeletonCard /></View>
          ) : !healthData || healthData.modules.length === 0 ? (
            <EmptyState
              icon={<View><Activity size={24} color={colors.textMuted} /></View>}
              title="No health data"
              description="Data health information will appear once your modules are connected"
            />
          ) : (
            <>
              {/* Overall health score ring */}
              <View style={{ alignItems: "center", marginBottom: 24 }}>
                <View
                  style={{
                    width: 140,
                    height: 140,
                    borderRadius: 70,
                    borderWidth: 10,
                    borderColor:
                      healthData.overallScore >= 75
                        ? colors.success
                        : healthData.overallScore >= 50
                        ? colors.warning
                        : colors.destructive,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.surface,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 36,
                      fontWeight: "900",
                      color:
                        healthData.overallScore >= 75
                          ? colors.success
                          : healthData.overallScore >= 50
                          ? colors.warning
                          : colors.destructive,
                    }}
                  >
                    {healthData.overallScore}
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted, marginTop: -2 }}>
                    Health Score
                  </Text>
                </View>
              </View>

              {/* Module health cards grid */}
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
                {IS_HOME_COOK ? "Usage Audit" : "Module Health"}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {healthData.modules.map((mod: ModuleHealth) => {
                  const statusLabel =
                    mod.status === "fresh"
                      ? "Fresh"
                      : mod.status === "recent"
                      ? "Recent"
                      : mod.status === "stale"
                      ? "Stale"
                      : mod.status === "very_stale"
                      ? "Very Stale"
                      : "No Data";

                  const badgeVariant: "success" | "warning" | "destructive" =
                    mod.status === "fresh"
                      ? "success"
                      : mod.status === "recent"
                      ? "warning"
                      : mod.status === "stale"
                      ? "warning"
                      : "destructive";

                  return (
                    <Pressable
                      key={mod.module}
                      onPress={() => {
                        const route = MODULE_ROUTE_MAP[mod.module];
                        if (route) router.push(route as any);
                      }}
                      style={{
                        width: "48%",
                        backgroundColor: colors.surface,
                        borderRadius: 14,
                        padding: 14,
                        borderWidth: 1,
                        borderColor: colors.cardBorder,
                        gap: 6,
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }} numberOfLines={1}>
                        {mod.label}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textMuted }}>
                        {formatRelativeTime(mod.lastDataAt)}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                        {mod.recordCount.toLocaleString()} records
                      </Text>
                      <Badge variant={badgeVariant} style={{ marginTop: 2 }}>
                        {statusLabel}
                      </Badge>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>
      )}

      {activeTab === "reminders" && (
        <View style={{ flex: 1 }}>
          {/* Period sub-tabs */}
          <TabBar
            tabs={REMINDER_PERIODS}
            activeTab={reminderPeriod}
            onTabChange={setReminderPeriod}
            style={{ marginHorizontal: 16, marginTop: 8, marginBottom: 8 }}
          />

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            {(REMINDERS[reminderPeriod] || []).length === 0 ? (
              <EmptyState
                icon={<View><Bell size={24} color={colors.textMuted} /></View>}
                title="No reminders"
                description="No reminders configured for this period"
              />
            ) : (
              <View style={{ gap: 10 }}>
                {(REMINDERS[reminderPeriod] || []).map((reminder, idx) => (
                  <Pressable
                    key={`${reminderPeriod}-${idx}`}
                    onPress={() => router.push(reminder.route as any)}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 14,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      gap: 6,
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, flex: 1 }} numberOfLines={1}>
                        {reminder.title}
                      </Text>
                      <ChevronRight size={18} color={colors.textMuted} />
                    </View>
                    <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
                      {reminder.description}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                      <View
                        style={{
                          backgroundColor: colors.accentBg,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: "600", color: colors.accent }}>
                          {reminder.module}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      )}

      <FormSheet visible={showForm} onClose={() => setShowForm(false)} onSave={() => createTask.mutate()} title="New Cleaning Task" saving={createTask.isPending}>
        <Input label="Task" value={taskName} onChangeText={setTaskName} placeholder="What needs to be cleaned?" />
        <Select label="Area" value={area} onValueChange={setArea} options={AREAS} />
        <Select label="Frequency" value={frequency} onValueChange={setFrequency} options={FREQUENCIES} />
        <Input label="Assigned To" value={assignedTo} onChangeText={setAssignedTo} placeholder="Staff member name" />
        <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Special instructions..." multiline />
      </FormSheet>
    </SafeAreaView>
  );
}
