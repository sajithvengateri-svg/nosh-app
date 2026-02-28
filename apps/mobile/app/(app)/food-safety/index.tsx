import { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { useTheme } from "../../../contexts/ThemeProvider";
import { useAuth } from "../../../contexts/AuthProvider";
import { useOrg } from "../../../contexts/OrgProvider";
import { ComplianceProvider, useComplianceContext } from "../../../contexts/ComplianceProvider";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { SetupWizard } from "../../../components/features/SetupWizard";
import { Badge } from "../../../components/ui/Badge";
import { useFoodSafetyTabOrder } from "../../../hooks/useFoodSafetyTabOrder";
import {
  ShieldCheck,
  Thermometer,
  Store,
  SprayCan,
  Zap,
  BarChart3,
  ClipboardCheck,
  Wrench,
  Bug,
  Droplets,
  Droplet,
  Wind,
  FlaskConical,
  FileText,
  GraduationCap,
  Cog,
  Users,
  FolderOpen,
  Settings,
  Package,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  HeartPulse,
  Flame,
  Snowflake,
  MonitorCheck,
  Truck,
  Sparkles,
  CheckCircle2,
} from "lucide-react-native";

// ── Tab metadata ────────────────────────────────────────────────────
const TAB_META: Record<string, { icon: any; label: string; route: string; description?: string }> = {
  burst:              { icon: Zap,            label: "Daily Burst",       route: "/(app)/food-safety/burst",             description: "Quick daily compliance check" },
  overview:           { icon: BarChart3,      label: "Overview",          route: "/(app)/food-safety/overview",          description: "Compliance score & readiness" },
  a1a40:              { icon: ClipboardCheck, label: "Assessment",        route: "/(app)/food-safety/assessment",        description: "Self-assessment checklist" },
  assessment:         { icon: ClipboardCheck, label: "Assessment",        route: "/(app)/food-safety/assessment",        description: "Self-assessment checklist" },
  actions:            { icon: ShieldCheck,    label: "Actions",           route: "/(app)/food-safety/actions",           description: "Corrective actions log" },
  equipment:          { icon: Wrench,         label: "Equipment",         route: "/(app)/food-safety/equipment",         description: "Equipment calibration records" },
  pest:               { icon: Bug,            label: "Pest Control",      route: "/(app)/food-safety/pest",              description: "Pest inspection records" },
  grease:             { icon: Droplet,        label: "Grease Trap",       route: "/(app)/food-safety/grease",            description: "Grease trap maintenance" },
  hood:               { icon: Wind,           label: "Hood Cleaning",     route: "/(app)/food-safety/hood",              description: "Hood & vent cleaning log" },
  chemical:           { icon: FlaskConical,   label: "Chemical",          route: "/(app)/food-safety/chemical",          description: "Chemical safety records" },
  haccp:              { icon: FileText,       label: "HACCP",             route: "/(app)/food-safety/haccp",             description: "HACCP plan & monitoring" },
  receiving:          { icon: Package,        label: "Receiving",         route: "/(app)/food-safety/receiving",         description: "Receiving logs & suppliers" },
  training:           { icon: GraduationCap,  label: "Training",          route: "/(app)/food-safety/training",          description: "Staff training register" },
  eq_training:        { icon: Cog,            label: "Eq Training",       route: "/(app)/food-safety/eq-training",       description: "Equipment training records" },
  cleaning_bcc:       { icon: SprayCan,       label: "Cleaning",          route: "/(app)/food-safety/cleaning-bcc",      description: "Cleaning schedules & checklists" },
  suppliers_bcc:      { icon: Users,          label: "Suppliers",         route: "/(app)/food-safety/suppliers",          description: "Supplier register" },
  audit:              { icon: FolderOpen,     label: "Audit",             route: "/(app)/food-safety/audit",             description: "Audit folder & documents" },
  sections:           { icon: Settings,       label: "Sections",          route: "/(app)/food-safety/sections",          description: "Toggle compliance sections" },
  temp_grid:          { icon: Thermometer,    label: "Temps",             route: "/(app)/temp-grid",                     description: "Temperature logging grid" },
  temp_setup:         { icon: Thermometer,    label: "Temp Setup",        route: "/(app)/food-safety/temp-setup",        description: "Configure temperature points" },
  receiving_setup:    { icon: Package,        label: "Recv Setup",        route: "/(app)/food-safety/receiving-setup",   description: "Receiving settings" },
  // New log pages
  staff_health:       { icon: HeartPulse,     label: "Staff Health",      route: "/(app)/food-safety/staff-health",      description: "Staff health & fitness checks" },
  cooking_log:        { icon: Flame,          label: "Cooking Log",       route: "/(app)/food-safety/cooking-log",       description: "Cooking temperature records" },
  cooling_log:        { icon: Snowflake,      label: "Cooling Log",       route: "/(app)/food-safety/cooling-log",       description: "Cooling process records" },
  reheating_log:      { icon: Flame,          label: "Reheating Log",     route: "/(app)/food-safety/reheating-log",     description: "Reheating temperature records" },
  display_monitoring: { icon: MonitorCheck,   label: "Temp Scanner",      route: "/(app)/food-safety/display-monitoring", description: "Scan thermometer displays or connect WiFi probes" },
  transport_log:      { icon: Truck,          label: "Transport Log",     route: "/(app)/food-safety/transport-log",     description: "Transport temperature records" },
  handwash_check:     { icon: Droplets,       label: "Handwash Check",    route: "/(app)/food-safety/handwash-check",    description: "Handwash station checks" },
  sanitiser_check:    { icon: SprayCan,       label: "Sanitiser Check",   route: "/(app)/food-safety/sanitiser-check",   description: "Sanitiser concentration checks" },
  kitchen_clean:      { icon: Sparkles,       label: "Kitchen Clean",     route: "/(app)/food-safety/kitchen-clean",     description: "Kitchen cleanliness checks" },
};

// ── Section-toggle gated tabs ───────────────────────────────────────
const SECTION_GATED_TABS: Record<string, string> = {
  a1a40: "self_assessment",
  assessment: "self_assessment",
  equipment: "equipment_calibration",
  pest: "pest_check",
  receiving: "receiving_logs",
  cleaning_bcc: "cleaning_schedules",
  suppliers_bcc: "supplier_register",
  grease: "grease_trap",
  hood: "hood_cleaning",
  chemical: "chemical_safety",
  haccp: "haccp",
  audit: "audit_docs",
  eq_training: "eq_training",
  staff_health: "staff_health",
  cooking_log: "cooking_logs",
  cooling_log: "cooling_logs",
  reheating_log: "reheating_logs",
  display_monitoring: "display_monitoring",
  transport_log: "transport_logs",
  handwash_check: "handwash_stations",
  sanitiser_check: "sanitiser_check",
  kitchen_clean: "kitchen_clean",
};

// ── Workflow stages ─────────────────────────────────────────────────
type WorkflowStage = "audit" | "enable" | "configure" | "shield" | "complete";

const WORKFLOW_STEPS: { key: WorkflowStage; label: string }[] = [
  { key: "audit", label: "Audit" },
  { key: "enable", label: "Enable" },
  { key: "configure", label: "Configure" },
  { key: "shield", label: "Green Shield" },
];

// ── Log type → daily_compliance_logs log_type mapping for status badges
const TAB_LOG_TYPES: Record<string, string> = {
  staff_health: "staff_health",
  cooking_log: "cooking",
  cooling_log: "cooling",
  reheating_log: "reheating",
  display_monitoring: "display_monitoring",
  transport_log: "transport",
  handwash_check: "handwash",
  sanitiser_check: "sanitiser",
  kitchen_clean: "kitchen_clean",
};

// ── Wrapper ─────────────────────────────────────────────────────────
export default function FoodSafety() {
  return (
    <ComplianceProvider>
      <FoodSafetyInner />
    </ComplianceProvider>
  );
}

// ── Inner component ─────────────────────────────────────────────────
function FoodSafetyInner() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isHeadChef, isDevBypass } = useAuth();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const canManageSetup = isHeadChef || isDevBypass;

  const compliance = useComplianceContext();
  const { config, profile, sectionToggles, complianceScore, latestAssessment, refetch } = compliance;
  const accentColor = config.labels.accentColor;
  const { getOrderedTabs, saveOrder } = useFoodSafetyTabOrder();

  const [complianceManuallyDisabled, setComplianceManuallyDisabled] = useState(false);
  const complianceEnabled = !!profile && !complianceManuallyDisabled;
  const [showWizard, setShowWizard] = useState(false);
  const [showReorder, setShowReorder] = useState(false);

  // ── Determine workflow stage ──────────────────────────────────
  const workflowStage: WorkflowStage = useMemo(() => {
    if (!latestAssessment) return "audit";
    if (!profile) return "enable";
    if (profile.green_shield_active) return "complete";
    const hasConfiguredSections = Object.keys(sectionToggles).length > 0;
    if (!hasConfiguredSections) return "configure";
    return "shield";
  }, [latestAssessment, profile, sectionToggles]);

  const stageIndex = WORKFLOW_STEPS.findIndex((s) => s.key === workflowStage);

  // ── Fetch today's log counts for status badges ────────────────
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const { data: todayLogCounts } = useQuery<Record<string, number>>({
    queryKey: ["today-log-counts", orgId, todayStr],
    queryFn: async () => {
      if (!orgId) return {};
      const { data, error } = await supabase
        .from("daily_compliance_logs")
        .select("log_type")
        .eq("org_id", orgId)
        .eq("log_date", todayStr);
      if (error) return {};
      const counts: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        counts[row.log_type] = (counts[row.log_type] || 0) + 1;
      });
      return counts;
    },
    enabled: !!orgId && complianceEnabled,
  });

  // ── Build available tab keys (gated) ────────────────────────────
  const availableTabKeys = useMemo(() => {
    const keys: string[] = [];
    const seen = new Set<string>();

    for (const tabKey of config.availableTabs) {
      if ((tabKey === "temp_setup" || tabKey === "receiving_setup") && !canManageSetup) continue;
      const sectionKey = SECTION_GATED_TABS[tabKey];
      if (sectionKey && sectionToggles[sectionKey] === false) continue;
      const meta = TAB_META[tabKey];
      if (!meta) continue;
      if (seen.has(meta.route)) continue;
      seen.add(meta.route);
      keys.push(tabKey);
    }
    return keys;
  }, [config.availableTabs, sectionToggles, canManageSetup]);

  // ── Order tabs ──────────────────────────────────────────────────
  const orderedTabs = useMemo(
    () => getOrderedTabs(availableTabKeys),
    [getOrderedTabs, availableTabKeys]
  );

  // ── Reorder state ───────────────────────────────────────────────
  const [reorderData, setReorderData] = useState<string[]>([]);

  const openReorder = () => {
    setReorderData([...orderedTabs]);
    setShowReorder(true);
  };

  const handleSaveOrder = () => {
    saveOrder(reorderData);
    setShowReorder(false);
  };

  // ── Quick action pills ────────────────────────────────────────
  const quickActions = [
    { label: "Temp",      icon: Thermometer, color: "#10B981", route: "/(app)/temp-grid" },
    { label: "Receiving", icon: Store,       color: "#F59E0B", route: "/(app)/food-safety/receiving" },
    { label: "Cleaning",  icon: SprayCan,    color: "#3B82F6", route: "/(app)/food-safety/cleaning-bcc" },
  ];

  // ── Reorder helpers ─────────────────────────────────────────
  const moveItem = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= reorderData.length) return;
    const newData = [...reorderData];
    [newData[index], newData[newIndex]] = [newData[newIndex], newData[index]];
    setReorderData(newData);
  };

  // ── Get log count badge for a tab ───────────────────────────
  const getLogCount = (tabKey: string): number | null => {
    const logType = TAB_LOG_TYPES[tabKey];
    if (!logType || !todayLogCounts) return null;
    return todayLogCounts[logType] ?? 0;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Food Safety" />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* ── Compliance header ──────────────────────────────────── */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <ShieldCheck
              size={16}
              color={
                complianceEnabled && profile?.green_shield_active
                  ? "#10B981"
                  : complianceEnabled
                    ? colors.success
                    : accentColor
              }
            />
            <Text style={{
              fontSize: 13,
              fontWeight: "600",
              color: complianceEnabled && profile?.green_shield_active
                ? "#10B981"
                : complianceEnabled
                  ? colors.success
                  : accentColor,
            }}>
              {config.labels.frameworkShort} Compliance
            </Text>
            {complianceEnabled && profile?.green_shield_active && (
              <Badge variant="success">Green Shield</Badge>
            )}
          </View>

          {complianceEnabled && complianceScore != null && complianceScore > 0 && (
            <View style={{ backgroundColor: accentColor + "15", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: accentColor }}>
                {config.scoring.model === "star_rating" ? `${complianceScore}\u2605` : `${complianceScore}%`}
              </Text>
            </View>
          )}

          {complianceEnabled && (
            <Pressable
              onPress={() => {
                Alert.alert(
                  `Disable ${config.labels.frameworkShort}?`,
                  "Switch back to basic food safety mode? Your compliance data is preserved.",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Disable", style: "destructive", onPress: () => setComplianceManuallyDisabled(true) },
                  ]
                );
              }}
              style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.successBg }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.success }}>Active</Text>
            </Pressable>
          )}
        </View>

        {/* ── Compliance Workflow Bar (when NOT enabled) ─────────── */}
        {!complianceEnabled && (
          <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
            {/* Step indicators */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              {WORKFLOW_STEPS.map((step, i) => {
                const isCompleted = i < stageIndex;
                const isCurrent = i === stageIndex;
                const isComplete = workflowStage === "complete";
                const stepColor = isComplete || isCompleted ? "#10B981" : isCurrent ? accentColor : colors.textMuted;

                return (
                  <View key={step.key} style={{ flex: 1, alignItems: "center" }}>
                    {i > 0 && (
                      <View style={{
                        position: "absolute", left: 0, right: "50%", top: 14, height: 2,
                        backgroundColor: isCompleted || isComplete ? "#10B981" : colors.border,
                      }} />
                    )}
                    {i < WORKFLOW_STEPS.length - 1 && (
                      <View style={{
                        position: "absolute", left: "50%", right: 0, top: 14, height: 2,
                        backgroundColor: isCompleted && !isCurrent ? "#10B981" : colors.border,
                      }} />
                    )}

                    <View style={{
                      width: 28, height: 28, borderRadius: 14, zIndex: 1,
                      backgroundColor: isComplete || isCompleted ? "#10B981" : isCurrent ? accentColor : colors.surface,
                      borderWidth: 2,
                      borderColor: isComplete || isCompleted ? "#10B981" : isCurrent ? accentColor : colors.border,
                      alignItems: "center", justifyContent: "center",
                    }}>
                      {isComplete || isCompleted ? (
                        <CheckCircle2 size={14} color="#FFFFFF" strokeWidth={2.5} />
                      ) : (
                        <Text style={{ fontSize: 12, fontWeight: "700", color: isCurrent ? "#FFFFFF" : colors.textMuted }}>
                          {i + 1}
                        </Text>
                      )}
                    </View>

                    <Text style={{ fontSize: 11, fontWeight: isCurrent ? "700" : "500", color: stepColor, marginTop: 4 }}>
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Current step action card */}
            <View style={{
              backgroundColor: colors.card, borderRadius: 14, padding: 16,
              borderWidth: 1, borderColor: colors.border,
            }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 4 }}>
                {workflowStage === "audit" && "Step 1: Run Self-Assessment"}
                {workflowStage === "enable" && "Step 2: Enable Compliance"}
                {workflowStage === "configure" && "Step 3: Configure Sections"}
                {workflowStage === "shield" && "Step 4: Activate Green Shield"}
                {workflowStage === "complete" && "Compliance Active"}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12 }}>
                {workflowStage === "audit" && `Complete the ${config.labels.assessmentTitle} to get your star rating and identify compliance gaps.`}
                {workflowStage === "enable" && `Great! You scored ${complianceScore != null ? (config.scoring.model === "star_rating" ? `${complianceScore}\u2605` : `${complianceScore}%`) : "\u2014"}. Now set up your compliance profile.`}
                {workflowStage === "configure" && "Choose which compliance logs and sections to maintain for your business."}
                {workflowStage === "shield" && "Upload remaining documents to activate your Green Shield badge."}
                {workflowStage === "complete" && "Your compliance is fully set up. Manage your functions below."}
              </Text>

              {workflowStage !== "complete" && (
                <Pressable
                  onPress={() => {
                    if (workflowStage === "audit") {
                      router.push("/(app)/food-safety/assessment" as any);
                    } else if (workflowStage === "enable") {
                      setShowWizard(true);
                    } else if (workflowStage === "configure") {
                      router.push("/(app)/food-safety/sections" as any);
                    } else if (workflowStage === "shield") {
                      router.push("/(app)/food-safety/overview" as any);
                    }
                  }}
                  style={({ pressed }) => ({
                    paddingVertical: 12, borderRadius: 10, alignItems: "center",
                    backgroundColor: accentColor, opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>
                    {workflowStage === "audit" && "Run Self-Assessment"}
                    {workflowStage === "enable" && "Enable Compliance"}
                    {workflowStage === "configure" && "Configure Sections"}
                    {workflowStage === "shield" && "Check Requirements"}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* ── Quick action pills ────────────────────────────────── */}
        <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 16 }}>
          {quickActions.map((action) => {
            const QIcon = action.icon;
            return (
              <Pressable
                key={action.label}
                onPress={() => router.push(action.route as any)}
                style={({ pressed }) => ({
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: action.color + "15",
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <QIcon size={16} color={action.color} strokeWidth={2} />
                <Text style={{ fontSize: 13, fontWeight: "600", color: action.color }}>{action.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Compliance function list with log status badges ────── */}
        {complianceEnabled && (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Functions
              </Text>
              <Pressable onPress={openReorder} hitSlop={8} style={{ padding: 4 }}>
                <SlidersHorizontal size={16} color={colors.textMuted} strokeWidth={1.5} />
              </Pressable>
            </View>

            {orderedTabs.map((tabKey) => {
              const meta = TAB_META[tabKey];
              if (!meta) return null;
              const TIcon = meta.icon;
              const logCount = getLogCount(tabKey);

              return (
                <Pressable
                  key={tabKey}
                  onPress={() => router.push(meta.route as any)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    marginHorizontal: 16,
                    marginBottom: 6,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderRadius: 14,
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: accentColor + "12", alignItems: "center", justifyContent: "center" }}>
                    <TIcon size={18} color={accentColor} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{meta.label}</Text>
                    {meta.description && (
                      <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }}>{meta.description}</Text>
                    )}
                  </View>
                  {logCount !== null && (
                    <Badge variant={logCount > 0 ? "success" : "secondary"}>
                      {logCount > 0 ? `${logCount} today` : "\u2014"}
                    </Badge>
                  )}
                  <ChevronRight size={16} color={colors.textMuted} strokeWidth={1.5} />
                </Pressable>
              );
            })}
          </>
        )}

        {/* ── Basic mode vertical list ───────────────────────────── */}
        {!complianceEnabled && (
          <>
            <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Functions
              </Text>
            </View>

            {[
              { key: "temps",    label: "Temps",      icon: Thermometer,  route: "/(app)/temp-grid",                    description: "Temperature logging grid" },
              { key: "cleaning", label: "Cleaning",    icon: SprayCan,     route: "/(app)/food-safety/cleaning-bcc",     description: "Cleaning schedules & checklists" },
              { key: "training", label: "Training",    icon: GraduationCap, route: "/(app)/food-safety/training",        description: "Staff training register" },
              { key: "suppliers", label: "Suppliers",  icon: Users,        route: "/(app)/food-safety/suppliers",         description: "Supplier register" },
              ...(canManageSetup ? [{ key: "temp_setup", label: "Temp Setup", icon: Thermometer, route: "/(app)/food-safety/temp-setup", description: "Configure temperature points" }] : []),
            ].map((item) => {
              const BIcon = item.icon;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => router.push(item.route as any)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    marginHorizontal: 16,
                    marginBottom: 6,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderRadius: 14,
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.accent + "12", alignItems: "center", justifyContent: "center" }}>
                    <BIcon size={18} color={colors.accent} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{item.label}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }}>{item.description}</Text>
                  </View>
                  <ChevronRight size={16} color={colors.textMuted} strokeWidth={1.5} />
                </Pressable>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* ── Setup Wizard ─────────────────────────────────────────── */}
      <SetupWizard
        visible={showWizard}
        onClose={() => setShowWizard(false)}
        onComplete={() => {
          setShowWizard(false);
          refetch();
        }}
      />

      {/* ── Reorder Modal ────────────────────────────────────────── */}
      <Modal visible={showReorder} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowReorder(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Pressable onPress={() => setShowReorder(false)}>
              <Text style={{ fontSize: 15, color: colors.textSecondary }}>Cancel</Text>
            </Pressable>
            <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>Reorder Tabs</Text>
            <Pressable onPress={handleSaveOrder}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.accent }}>Save</Text>
            </Pressable>
          </View>

          <Text style={{ fontSize: 13, color: colors.textMuted, paddingHorizontal: 16, paddingVertical: 10 }}>
            Tap arrows to reorder
          </Text>

          <FlatList
            data={reorderData}
            keyExtractor={(item) => item}
            renderItem={({ item, index }) => {
              const meta = TAB_META[item];
              if (!meta) return null;
              const RIcon = meta.icon;
              return (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <RIcon size={18} color={colors.textSecondary} strokeWidth={1.5} />
                  <Text style={{ fontSize: 15, fontWeight: "500", color: colors.text, flex: 1 }}>{meta.label}</Text>
                  <Pressable onPress={() => moveItem(index, -1)} disabled={index === 0} hitSlop={8}
                    style={{ padding: 6, opacity: index === 0 ? 0.25 : 1 }}>
                    <ChevronUp size={18} color={colors.textSecondary} strokeWidth={2} />
                  </Pressable>
                  <Pressable onPress={() => moveItem(index, 1)} disabled={index === reorderData.length - 1} hitSlop={8}
                    style={{ padding: 6, opacity: index === reorderData.length - 1 ? 0.25 : 1 }}>
                    <ChevronDown size={18} color={colors.textSecondary} strokeWidth={2} />
                  </Pressable>
                </View>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
