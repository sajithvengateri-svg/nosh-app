import { useState } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import { supabase } from "../../../lib/supabase";
import { useOrg } from "../../../contexts/OrgProvider";
import { useAuth } from "../../../contexts/AuthProvider";
import { Badge } from "../../../components/ui/Badge";
import { Card, CardContent } from "../../../components/ui/Card";
import { SkeletonCard } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { FAB } from "../../../components/ui/FAB";
import { FormSheet } from "../../../components/ui/FormSheet";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { DatePicker } from "../../../components/ui/DatePicker";
import { TabBar } from "../../../components/ui/Tabs";
import { Button } from "../../../components/ui/Button";
import { GraduationCap, Lightbulb, MessageCircle, Bell } from "lucide-react-native";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { useTheme } from "../../../contexts/ThemeProvider";
import { isHomeCook } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";

const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;
const IS_HOME_COOK = isHomeCook(APP_VARIANT);

// ── Training record config ──────────────────────────────────────────

const STATUS_OPTIONS = [
  { label: "Not Started", value: "not_started" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
];

const CATEGORY_OPTIONS = [
  { label: "Safety", value: "Safety" },
  { label: "Hygiene", value: "Hygiene" },
  { label: "Technical", value: "Technical" },
  { label: "Compliance", value: "Compliance" },
  { label: "Other", value: "Other" },
];

const statusConfig: Record<string, { variant: "secondary" | "default" | "success"; label: string }> = {
  not_started: { variant: "secondary", label: "Not Started" },
  in_progress: { variant: "default", label: "In Progress" },
  completed: { variant: "success", label: "Completed" },
};

// ── Curated tips content ────────────────────────────────────────────

interface Tip {
  id: string;
  title: string;
  body: string;
  category: string;
}

const HOMECHEF_TIPS: Tip[] = [
  { id: "h1", title: "The 2-Hour Rule", body: "Never leave perishable food at room temperature for more than 2 hours. In hot weather (above 32\u00B0C), reduce this to 1 hour. When in doubt, throw it out.", category: "Safety" },
  { id: "h2", title: "Safe Thawing Methods", body: "Thaw frozen food in the fridge (safest), under cold running water, or in the microwave. Never thaw on the counter — bacteria multiply rapidly at room temperature.", category: "Safety" },
  { id: "h3", title: "Knife Safety Basics", body: "Always cut away from your body. Keep knives sharp — dull knives slip more easily. Use the right knife for the job: chef's knife for chopping, paring knife for small work.", category: "Technical" },
  { id: "h4", title: "Prevent Cross-Contamination", body: "Use separate cutting boards for raw meat and ready-to-eat food. Wash hands for 20 seconds after handling raw meat, poultry, or eggs.", category: "Hygiene" },
  { id: "h5", title: "Store Food at the Right Temp", body: "Fridge should be at 0\u20135\u00B0C, freezer at -18\u00B0C or below. Store raw meat on the bottom shelf to prevent drips. Label and date leftovers.", category: "Safety" },
  { id: "h6", title: "Clean as You Go", body: "Wipe down surfaces between tasks. Wash chopping boards after each use. A tidy workspace is a safe workspace — and makes cooking more enjoyable.", category: "Hygiene" },
  { id: "h7", title: "Internal Cooking Temperatures", body: "Chicken: 75\u00B0C throughout. Beef mince: 71\u00B0C. Pork: 71\u00B0C. Fish: 63\u00B0C. Use a food thermometer — don't guess.", category: "Safety" },
  { id: "h8", title: "Organise Your Pantry", body: "First in, first out: use older items before newer ones. Keep dry goods sealed. Check expiry dates regularly. A well-organised pantry reduces waste and saves money.", category: "Technical" },
];

const PRO_TIPS: Tip[] = [
  { id: "p1", title: "Mise en Place", body: "Prepare and organise all ingredients before you start cooking. Read the recipe twice. Measure everything. This single habit separates amateurs from professionals.", category: "Technical" },
  { id: "p2", title: "Service Flow Management", body: "During service: communicate clearly (\"Yes, Chef!\"), keep your station clean, prep backup pars, and never run. A calm kitchen produces better food.", category: "Technical" },
  { id: "p3", title: "HACCP in 60 Seconds", body: "Identify hazards, find critical control points (CCPs), set limits, monitor, take corrective action, verify, and keep records. That's the 7 principles — master them.", category: "Compliance" },
  { id: "p4", title: "Allergen Awareness", body: "Know the 14 major allergens. Always check labels when receiving stock. Never guess — one mistake can be life-threatening. Train every team member.", category: "Safety" },
  { id: "p5", title: "Temperature Danger Zone", body: "5\u00B0C to 60\u00B0C is where bacteria thrive. Cool hot food to fridge temp within 2 hours (divide into smaller portions). Reheat to 75\u00B0C core temp.", category: "Safety" },
  { id: "p6", title: "Stock Rotation (FIFO)", body: "First In, First Out. New deliveries go behind existing stock. Label everything with dates. Do a daily walk-through of fridges and dry stores. Waste costs money.", category: "Compliance" },
  { id: "p7", title: "Effective Cleaning Schedule", body: "Clean and sanitise are different. Clean removes visible dirt. Sanitise kills bacteria. Use the right concentration of sanitiser. Log everything — if it's not recorded, it didn't happen.", category: "Hygiene" },
  { id: "p8", title: "Receiving Deliveries Right", body: "Check temperatures on arrival. Inspect packaging for damage. Verify quantities against the invoice. Reject anything that doesn't meet standards — your reputation depends on it.", category: "Compliance" },
  { id: "p9", title: "Sharp Knife Technique", body: "Pinch grip on the blade, guide hand in claw position. Let the weight of the knife do the work. Sharpen weekly, hone daily. A sharp knife is a safe knife.", category: "Technical" },
  { id: "p10", title: "Taste Everything", body: "Season in stages, taste at each step. Acid (lemon, vinegar) brightens flavours. Salt enhances, fat carries, heat transforms. Your palate is your best tool.", category: "Technical" },
];

// ── Tabs ─────────────────────────────────────────────────────────────

const TRAINING_TABS = [
  { key: "records", label: "Records" },
  { key: "tips", label: "Tips" },
  { key: "ask_pro", label: "Ask a Pro" },
];

export default function Training() {
  const router = useRouter();
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("records");

  // ── Records query ───────────────────────────────────────────────
  const { data: records, isLoading, refetch, isRefetching } = useQuery<any[]>({
    queryKey: ["training", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from("training_records").select("*").eq("org_id", orgId).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [staffMember, setStaffMember] = useState("");
  const [category, setCategory] = useState("Safety");
  const [status, setStatus] = useState("not_started");
  const [completedDate, setCompletedDate] = useState(new Date());
  const [notes, setNotes] = useState("");

  const createRecord = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Title required");
      const { error } = await supabase.from("training_records").insert({
        title: title.trim(), staff_member: staffMember.trim() || null,
        category, status,
        completed_date: status === "completed" ? completedDate.toISOString().split("T")[0] : null,
        notes: notes.trim() || null, org_id: orgId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training"] });
      setShowForm(false);
      setTitle(""); setStaffMember(""); setNotes(""); setStatus("not_started");
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const updates: any = { status: newStatus };
      if (newStatus === "completed") updates.completed_date = new Date().toISOString().split("T")[0];
      const { error } = await supabase.from("training_records").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["training"] }),
  });

  const deleteRecord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("training_records").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["training"] }),
  });

  const completed = records?.filter((r) => r.status === "completed").length || 0;
  const total = records?.length || 0;

  const handleLongPress = (record: any) => {
    const options: any[] = [];
    if (record.status === "not_started") options.push({ text: "Start", onPress: () => updateStatus.mutate({ id: record.id, newStatus: "in_progress" }) });
    if (record.status === "in_progress") options.push({ text: "Complete", onPress: () => updateStatus.mutate({ id: record.id, newStatus: "completed" }) });
    options.push({ text: "Delete", style: "destructive", onPress: () => {
      Alert.alert("Delete", `Delete "${record.title}"?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteRecord.mutate(record.id) },
      ]);
    }});
    options.push({ text: "Cancel", style: "cancel" });
    Alert.alert(record.title, "What would you like to do?", options);
  };

  // ── Ask a Pro interest ──────────────────────────────────────────
  const [notifySubmitting, setNotifySubmitting] = useState(false);
  const handleAskProInterest = async () => {
    setNotifySubmitting(true);
    try {
      const { error } = await supabase
        .from("feature_interest")
        .upsert(
          {
            user_id: user?.id,
            org_id: user?.user_metadata?.org_id ?? null,
            feature_key: "ask_a_pro",
            expressed_at: new Date().toISOString(),
          },
          { onConflict: "user_id,feature_key" }
        );
      if (error) throw error;
      Alert.alert("You're on the list!", "We'll notify you when Ask a Pro is available.");
    } catch {
      Alert.alert("Thanks!", "We've noted your interest. We'll be in touch when Ask a Pro is ready.");
    } finally {
      setNotifySubmitting(false);
    }
  };

  // ── Tips filter ─────────────────────────────────────────────────
  const tips = IS_HOME_COOK ? HOMECHEF_TIPS : PRO_TIPS;
  const [tipFilter, setTipFilter] = useState<string | null>(null);
  const filteredTips = tipFilter ? tips.filter((t) => t.category === tipFilter) : tips;
  const tipCategories = [...new Set(tips.map((t) => t.category))];

  // ── Render ──────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Training" />

      <TabBar
        tabs={TRAINING_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        accentColor={colors.accent}
        style={{ paddingHorizontal: 12, paddingBottom: 8 }}
      />

      {/* ── Records Tab ──────────────────────────────────────────── */}
      {activeTab === "records" && (
        <>
          <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
            {total > 0 && (
              <Card style={{ marginBottom: 16, backgroundColor: colors.accentBg }}>
                <CardContent style={{ paddingTop: 16, alignItems: "center" }}>
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>Completed</Text>
                  <Text style={{ fontSize: 28, fontWeight: "800", color: colors.accent }}>{completed}/{total}</Text>
                  <View style={{ width: "100%", height: 6, backgroundColor: colors.border, borderRadius: 3, marginTop: 8 }}>
                    <View style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` as any, height: 6, backgroundColor: colors.accent, borderRadius: 3 }} />
                  </View>
                </CardContent>
              </Card>
            )}

            {isLoading ? (
              <View style={{ gap: 10 }}><SkeletonCard /><SkeletonCard /></View>
            ) : total === 0 ? (
              <EmptyState icon={<GraduationCap size={40} color={colors.textMuted} strokeWidth={1.5} />} title="No training records" description="Tap + to add training records for your team" />
            ) : (
              records?.map((record) => {
                const sc = statusConfig[record.status] || statusConfig.not_started;
                return (
                  <Pressable
                    key={record.id}
                    onPress={() => {
                      if (record.status === "not_started") updateStatus.mutate({ id: record.id, newStatus: "in_progress" });
                      else if (record.status === "in_progress") updateStatus.mutate({ id: record.id, newStatus: "completed" });
                    }}
                    onLongPress={() => handleLongPress(record)}
                    style={({ pressed }) => ({
                      backgroundColor: colors.background, borderRadius: 14, borderWidth: 1,
                      borderColor: record.status === "completed" ? colors.successBg : colors.border,
                      padding: 16, marginBottom: 10, opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: record.status === "completed" ? colors.success : colors.text }}>{record.title}</Text>
                        {record.staff_member && <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>{record.staff_member}</Text>}
                        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                          {record.category && <Badge variant="secondary">{record.category}</Badge>}
                          {record.completed_date && <Badge variant="secondary">{record.completed_date}</Badge>}
                        </View>
                      </View>
                      <Badge variant={sc.variant}>{sc.label}</Badge>
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          <FAB onPress={() => { setTitle(""); setStaffMember(""); setCategory("Safety"); setStatus("not_started"); setNotes(""); setShowForm(true); }} />

          <FormSheet visible={showForm} onClose={() => setShowForm(false)} onSave={() => createRecord.mutate()} title="New Training Record" saving={createRecord.isPending}>
            <Input label="Topic / Course" value={title} onChangeText={setTitle} placeholder="Training topic" />
            <Input label="Staff Member" value={staffMember} onChangeText={setStaffMember} placeholder="Who is being trained?" />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}><Select label="Category" value={category} onValueChange={setCategory} options={CATEGORY_OPTIONS} /></View>
              <View style={{ flex: 1 }}><Select label="Status" value={status} onValueChange={setStatus} options={STATUS_OPTIONS} /></View>
            </View>
            {status === "completed" && <DatePicker label="Completed Date" value={completedDate} onChange={setCompletedDate} mode="date" />}
            <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Notes..." multiline />
          </FormSheet>
        </>
      )}

      {/* ── Tips Tab ─────────────────────────────────────────────── */}
      {activeTab === "tips" && (
        <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }}>
          <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 12 }}>
            {IS_HOME_COOK ? "Essential tips for safe, confident home cooking." : "Pro tips to sharpen your skills and run a tighter kitchen."}
          </Text>

          {/* Category filter pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }} contentContainerStyle={{ gap: 6 }}>
            <Pressable
              onPress={() => setTipFilter(null)}
              style={{
                paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                backgroundColor: tipFilter === null ? colors.accent : colors.surfaceHover,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: tipFilter === null ? "#fff" : colors.textSecondary }}>All</Text>
            </Pressable>
            {tipCategories.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setTipFilter(tipFilter === cat ? null : cat)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                  backgroundColor: tipFilter === cat ? colors.accent : colors.surfaceHover,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: tipFilter === cat ? "#fff" : colors.textSecondary }}>{cat}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {filteredTips.map((tip) => (
            <Card key={tip.id} style={{ marginBottom: 10 }}>
              <CardContent style={{ paddingTop: 14, paddingBottom: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <Lightbulb size={16} color={colors.warning} strokeWidth={2} />
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, flex: 1 }}>{tip.title}</Text>
                  <Badge variant="secondary">{tip.category}</Badge>
                </View>
                <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 20 }}>{tip.body}</Text>
              </CardContent>
            </Card>
          ))}
        </ScrollView>
      )}

      {/* ── Ask a Pro Tab ────────────────────────────────────────── */}
      {activeTab === "ask_pro" && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: colors.accentBg,
            alignItems: "center", justifyContent: "center", marginBottom: 20,
          }}>
            <MessageCircle size={36} color={colors.accent} strokeWidth={1.5} />
          </View>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text, textAlign: "center", marginBottom: 8 }}>
            Ask a Pro
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 22, marginBottom: 6 }}>
            Coming Soon
          </Text>
          <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center", lineHeight: 20, marginBottom: 28, maxWidth: 280 }}>
            {IS_HOME_COOK
              ? "Get personalised advice from professional chefs. Ask about techniques, substitutions, food safety, and more."
              : "Connect with industry mentors and specialists. Get expert guidance on compliance, menu development, kitchen management, and career growth."}
          </Text>
          <Button
            onPress={handleAskProInterest}
            loading={notifySubmitting}
            style={{ flexDirection: "row", gap: 8 }}
          >
            <Bell size={16} color="#fff" strokeWidth={2} />
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Notify Me</Text>
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}
