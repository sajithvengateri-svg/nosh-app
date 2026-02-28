import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { TabBar } from "../../../components/ui/Tabs";
import { EmptyState } from "../../../components/ui/EmptyState";
import { FAB } from "../../../components/ui/FAB";
import { FormSheet } from "../../../components/ui/FormSheet";
import { Input } from "../../../components/ui/Input";
import { ImagePicker } from "../../../components/ui/ImagePicker";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { BCCChemicalSafety } from "../../../components/features/BCCChemicalSafety";
import { MobileCleaningChecklist } from "../../../components/features/MobileCleaningChecklist";
import { CleaningScheduleSetup } from "../../../components/features/CleaningScheduleSetup";
import {
  useCleaningLogs,
  useCreateCleaningLog,
  useUploadSafetyPhoto,
} from "../../../hooks/useFoodSafety";
import { SprayCan, FileText } from "lucide-react-native";

const TABS = [
  { key: "chemicals", label: "Chemicals" },
  { key: "logs", label: "Logs" },
  { key: "checklists", label: "Checklists" },
  { key: "sops", label: "SOPs" },
];

const CLEANING_AREAS = [
  "Kitchen",
  "Walk-in Fridge",
  "Freezer",
  "Prep Area",
  "Storage",
  "Bathrooms",
  "Dining Area",
  "Equipment",
];

export default function CleaningManagementPage() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState("chemicals");
  const [checklistView, setChecklistView] = useState<"checklist" | "setup">("checklist");

  // ── Cleaning logs state ──────────────────────────────────────
  const { data: cleaningLogs, isLoading: cleaningLoading, refetch: refetchCleaning, isRefetching } = useCleaningLogs();
  const createCleaningLog = useCreateCleaningLog();
  const uploadPhoto = useUploadSafetyPhoto();
  const [showCleanForm, setShowCleanForm] = useState(false);
  const [cleanArea, setCleanArea] = useState("Kitchen");
  const [cleanTask, setCleanTask] = useState("");
  const [cleanNotes, setCleanNotes] = useState("");
  const [cleanPhoto, setCleanPhoto] = useState<string | null>(null);
  const [cleanSaving, setCleanSaving] = useState(false);

  const handleLogCleaning = async () => {
    if (!cleanTask.trim()) {
      Alert.alert("Error", "Task description required");
      return;
    }
    setCleanSaving(true);
    try {
      let photoUrl: string | undefined;
      if (cleanPhoto) {
        photoUrl = await uploadPhoto.mutateAsync(cleanPhoto);
      }
      await createCleaningLog.mutateAsync({
        area: cleanArea,
        task: cleanTask.trim(),
        photo_url: photoUrl,
        notes: cleanNotes.trim() || undefined,
      });
      setShowCleanForm(false);
      setCleanTask("");
      setCleanNotes("");
      setCleanPhoto(null);
      Alert.alert("Logged", "Cleaning record saved");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setCleanSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Cleaning Management" />

      <TabBar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        style={{ marginHorizontal: 16, marginBottom: 8 }}
      />

      {/* ── Chemicals Tab ─────────────────────────────────────── */}
      {activeTab === "chemicals" && <BCCChemicalSafety />}

      {/* ── Logs Tab ──────────────────────────────────────────── */}
      {activeTab === "logs" && (
        <>
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetchCleaning} />}
          >
            <Button onPress={() => setShowCleanForm(true)} style={{ marginBottom: 16 }}>
              Log Cleaning Task
            </Button>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
              Today&apos;s Cleaning
            </Text>
            {cleaningLoading ? (
              <ActivityIndicator style={{ paddingVertical: 40 }} />
            ) : (cleaningLogs?.length || 0) === 0 ? (
              <EmptyState
                icon={<SprayCan size={40} color={colors.textMuted} strokeWidth={1.5} />}
                title="No cleaning logs"
                description="Log cleaning tasks to maintain hygiene records"
                style={{ paddingVertical: 40 }}
              />
            ) : (
              cleaningLogs?.map((log: any) => (
                <View
                  key={log.id}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 10,
                    gap: 4,
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{log.location}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>{log.time?.slice(0, 5)}</Text>
                  </View>
                  <Text style={{ fontSize: 14, color: colors.textSecondary }}>{log.readings?.task}</Text>
                  {log.recorded_by_name && (
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>
                      By: {log.recorded_by_name.split("@")[0]}
                    </Text>
                  )}
                </View>
              ))
            )}
          </ScrollView>

          <FormSheet
            visible={showCleanForm}
            onClose={() => setShowCleanForm(false)}
            onSave={handleLogCleaning}
            title="Log Cleaning"
            saving={cleanSaving}
          >
            <View style={{ gap: 8, marginBottom: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary }}>Area</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {CLEANING_AREAS.map((a) => (
                  <Pressable
                    key={a}
                    onPress={() => setCleanArea(a)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 20,
                      borderWidth: 1.5,
                      borderColor: cleanArea === a ? colors.accent : colors.border,
                      backgroundColor: cleanArea === a ? colors.accentBg : colors.card,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: cleanArea === a ? "700" : "500",
                        color: cleanArea === a ? colors.accent : colors.textSecondary,
                      }}
                    >
                      {a}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <Input label="Task" value={cleanTask} onChangeText={setCleanTask} placeholder="What was cleaned?" />
            <Input label="Notes" value={cleanNotes} onChangeText={setCleanNotes} placeholder="Any notes..." multiline />
            <ImagePicker onImageSelected={setCleanPhoto} label="Photo Evidence" buttonText="Attach Photo" />
          </FormSheet>
        </>
      )}

      {/* ── Checklists Tab ────────────────────────────────────── */}
      {activeTab === "checklists" && (
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, gap: 8 }}>
            <Pressable
              onPress={() => setChecklistView("checklist")}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 8,
                alignItems: "center",
                backgroundColor: checklistView === "checklist" ? colors.accent : colors.surface,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: checklistView === "checklist" ? "#fff" : colors.textSecondary }}>
                Checklist
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setChecklistView("setup")}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 8,
                alignItems: "center",
                backgroundColor: checklistView === "setup" ? colors.accent : colors.surface,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: checklistView === "setup" ? "#fff" : colors.textSecondary }}>
                Setup
              </Text>
            </Pressable>
          </View>
          {checklistView === "checklist" ? <MobileCleaningChecklist /> : <CleaningScheduleSetup />}
        </View>
      )}

      {/* ── SOPs Tab ──────────────────────────────────────────── */}
      {activeTab === "sops" && (
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 16 }}>
          <EmptyState
            icon={<FileText size={40} color={colors.textMuted} strokeWidth={1.5} />}
            title="Opening & Closing SOPs"
            description="Standard operating procedures for opening and closing cleaning routines will be available here."
          />
          <View style={{ alignItems: "center", marginTop: 12 }}>
            <Badge variant="secondary">Coming Soon</Badge>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
