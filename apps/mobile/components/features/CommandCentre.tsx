import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  ActivityIndicator, View, Text, Pressable, Alert, ScrollView, TextInput, Modal,
} from "react-native";
import Constants from "expo-constants";
import {
  usePrepLists, useTogglePrepItem, useCreatePrepList, useDeletePrepList, useUpdatePrepList,
  type PrepItem,
} from "../../hooks/usePrepLists";
import { useTheme } from "../../contexts/ThemeProvider";
import { supabase } from "../../lib/supabase";
import { ImagePicker } from "../ui/ImagePicker";
import { FingerCanvas } from "../ui/FingerCanvas";
import { SkeletonCard } from "../ui/Skeleton";
import { PrepDayCarousel, addDays, startOfWeek } from "./PrepDayCarousel";
import {
  ListChecks, Camera, Mic, MicOff, Keyboard, Pencil, Send, FileText, Archive,
  CheckCircle2, Thermometer, ScanLine, ClipboardList, Plus,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAppSettings } from "../../hooks/useAppSettings";
import { useAuth } from "../../contexts/AuthProvider";
import { useToast } from "../../contexts/ToastProvider";
import { lightTap, successNotification } from "../../lib/haptics";

import { isHomeCook } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";
const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;
const IS_HOMECHEF = isHomeCook(APP_VARIANT);

type NoteMode = null | "camera" | "dictate" | "type" | "draw";

function getDefaultDate(): Date {
  const now = new Date();
  if (now.getHours() >= 21) return addDays(now, 1);
  return now;
}
function formatDateStr(d: Date): string { return d.toISOString().split("T")[0]; }
function formatDayLabel(d: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[d.getDay()]}  ${d.getDate()}  ${months[d.getMonth()]}`;
}

interface CommandCentreProps {
  compact?: boolean;
}

export function CommandCentre({ compact = false }: CommandCentreProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { profile } = useAuth();
  const { settings: appSettings } = useAppSettings();
  const { data: lists, isLoading } = usePrepLists();
  const toggleItem = useTogglePrepItem();
  const createList = useCreatePrepList();
  const deleteList = useDeletePrepList();
  const updateList = useUpdatePrepList();
  const { showToast } = useToast();

  const [selectedDate, setSelectedDate] = useState<Date>(getDefaultDate);
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(getDefaultDate()));
  const snapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-snap back to today after 5s of inactivity when on a different day
  const selectDateWithSnap = useCallback((d: Date) => {
    setSelectedDate(d);
    if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
    const today = getDefaultDate();
    const isSame = d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
    if (!isSame) {
      snapTimerRef.current = setTimeout(() => {
        const now = getDefaultDate();
        setSelectedDate(now);
        setWeekStart(startOfWeek(now));
      }, 5000);
    }
  }, []);

  useEffect(() => { return () => { if (snapTimerRef.current) clearTimeout(snapTimerRef.current); }; }, []);

  const goToToday = useCallback(() => {
    const now = getDefaultDate();
    setSelectedDate(now);
    setWeekStart(startOfWeek(now));
    if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
  }, []);

  // Note input state
  const [noteMode, setNoteMode] = useState<NoteMode>(null);
  const [processing, setProcessing] = useState(false);
  const [typeText, setTypeText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const voiceRef = useRef<any>(null);

  const selectedDateStr = formatDateStr(selectedDate);

  // ── Data ──────────────────────────────────────────────────────
  const activeLists = useMemo(() => {
    if (!lists) return [];
    return lists.filter((l) => {
      if (l.status === "completed") return false;
      if (!l.items || l.items.length === 0) return false;
      if (l.date) {
        const listDate = l.date.split("T")[0];
        if (listDate !== selectedDateStr) return false;
      }
      return true;
    }).slice(0, 30);
  }, [lists, selectedDateStr]);

  const sections = useMemo(() =>
    activeLists.map((list) => ({
      title: list.name,
      listId: list.id,
      data: list.items || [],
      completed: (list.items || []).filter((i) => i.completed).length,
      total: (list.items || []).length,
      priority: (list as any).priority || "medium",
      status: list.status,
      notes: list.notes,
      createdBy: list.created_by,
      isOwn: list.created_by === profile?.id,
    })),
    [activeLists, profile?.id]
  );

  const totalTasks = sections.reduce((s, sec) => s + sec.total, 0);
  const totalCompleted = sections.reduce((s, sec) => s + sec.completed, 0);
  const progressPct = totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0;

  // ── Handlers ──────────────────────────────────────────────────
  const handleToggle = (listId: string, items: PrepItem[], idx: number) => {
    lightTap();
    const updated = items.map((item, i) => i === idx ? { ...item, completed: !item.completed } : item);
    toggleItem.mutate({ prepListId: listId, items: updated });
  };

  const handleDeleteItem = (listId: string, items: PrepItem[], idx: number) => {
    const updated = items.filter((_, i) => i !== idx);
    toggleItem.mutate({ prepListId: listId, items: updated });
  };

  const handleDeleteList = (listId: string, name: string) => {
    Alert.alert("Delete List", `Delete "${name}" and all its tasks?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteList.mutate(listId) },
    ]);
  };

  const handleFileAway = () => {
    const toFile = activeLists.filter((l) => l.status !== "completed");
    if (toFile.length === 0) {
      showToast({ title: "Nothing to file", message: "All lists are already filed", type: "info" });
      return;
    }
    Alert.alert("File Away", `Mark ${toFile.length} list(s) as completed and archive?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "File Away",
        onPress: async () => {
          for (const list of toFile) {
            const doneItems = (list.items || []).map((i) => ({ ...i, completed: true }));
            await updateList.mutateAsync({ id: list.id, items: doneItems, status: "completed" } as any);
          }
          successNotification();
          showToast({ title: "Filed", message: `${toFile.length} list(s) archived`, type: "success" });
        },
      },
    ]);
  };

  const processAndCreateList = useCallback(async (tasks: any[], source: string, rawNote?: string) => {
    if (tasks.length === 0) {
      showToast({ title: "No Tasks", message: "Could not detect tasks from the input", type: "info" });
      return;
    }
    const items = tasks.map((t: any, i: number) => ({
      id: `note-${Date.now()}-${i}`,
      task: t.task,
      quantity: t.quantity || "",
      completed: false,
      urgency: t.urgency === "priority" ? "priority" as const : undefined,
    }));
    await createList.mutateAsync({
      name: source,
      date: selectedDateStr,
      items,
      notes: rawNote || null,
    });
    successNotification();
    showToast({ title: "Imported", message: `${tasks.length} tasks added`, type: "success" });
  }, [createList, selectedDateStr, showToast]);

  // Helper to call scan-prep-note and extract error details
  const callScanNote = useCallback(async (body: Record<string, any>) => {
    // Check for a real auth session — dev bypass has no JWT
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // Fallback: parse text locally when no auth (dev bypass mode)
      if (body.text) {
        const lines = body.text.split(/[,\n]+/).map((l: string) => l.trim()).filter(Boolean);
        return { tasks: lines.map((l: string) => ({ task: l, quantity: "", urgency: "within_48h" })) };
      }
      throw new Error("Sign in required to scan images with AI");
    }
    const { data, error } = await supabase.functions.invoke("scan-prep-note", { body });
    if (error) {
      const msg = data?.error || error.message || "Edge function error";
      throw new Error(msg);
    }
    return data;
  }, []);

  // Camera: photo → scan-prep-note (photo mode)
  const handleCameraNote = useCallback(async (base64: string) => {
    setProcessing(true);
    try {
      const data = await callScanNote({ image_base64: base64, file_type: "image/jpeg", mode: "photo" });
      await processAndCreateList(data?.tasks || [], "Scanned Note", "[photo note]");
    } catch (e: any) {
      showToast({ title: "Error", message: e.message || "Failed to scan", type: "error" });
    } finally {
      setProcessing(false);
      setNoteMode(null);
    }
  }, [callScanNote, processAndCreateList, showToast]);

  // Type/Dictate: text → scan-prep-note (text mode)
  const handleTextNote = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setProcessing(true);
    try {
      const data = await callScanNote({ text: text.trim(), mode: "text" });
      await processAndCreateList(data?.tasks || [], "Quick Note", text.trim());
    } catch (e: any) {
      showToast({ title: "Error", message: e.message || "Failed to process", type: "error" });
    } finally {
      setProcessing(false);
      setTypeText("");
      setNoteMode(null);
    }
  }, [callScanNote, processAndCreateList, showToast]);

  // Draw: SVG base64 → scan-prep-note (canvas mode)
  const handleDrawNote = useCallback(async (base64: string) => {
    setProcessing(true);
    setShowCanvas(false);
    try {
      const data = await callScanNote({ image_base64: base64, file_type: "image/svg+xml", mode: "drawing" });
      await processAndCreateList(data?.tasks || [], "Drawn Note", "[drawn note]");
    } catch (e: any) {
      showToast({ title: "Error", message: e.message || "Failed to read drawing", type: "error" });
    } finally {
      setProcessing(false);
      setNoteMode(null);
    }
  }, [callScanNote, processAndCreateList, showToast]);

  // Dictate: start/stop speech recognition
  const handleDictateToggle = useCallback(async () => {
    if (isListening) {
      // Stop and process
      try {
        if (voiceRef.current) {
          const transcript = await voiceRef.current.stopListening();
          setIsListening(false);
          if (transcript.trim()) {
            await handleTextNote(transcript);
          } else {
            showToast({ title: "No Speech", message: "Didn't catch anything. Try again.", type: "info" });
            setNoteMode(null);
          }
        }
      } catch {
        setIsListening(false);
        setNoteMode(null);
      }
    } else {
      // Start listening
      try {
        const { createVoiceService } = await import("../../lib/companion/voiceService");
        voiceRef.current = createVoiceService("elevenlabs");
        await voiceRef.current.startListening();
        setIsListening(true);
      } catch (e: any) {
        showToast({ title: "Voice Error", message: e.message || "Microphone not available", type: "error" });
        setNoteMode(null);
      }
    }
  }, [isListening, handleTextNote, showToast]);

  const selectMode = (mode: NoteMode) => {
    lightTap();
    if (mode === noteMode) { setNoteMode(null); return; }
    setNoteMode(mode);
    if (mode === "draw") setShowCanvas(true);
    if (mode === "dictate") {
      // Will start listening on next render
      setTimeout(() => handleDictateToggle(), 100);
    }
  };

  const NOTE_MODES = [
    { key: "camera" as const, icon: Camera, label: "Photo", color: colors.accent },
    { key: "dictate" as const, icon: isListening ? MicOff : Mic, label: isListening ? "Stop" : "Dictate", color: colors.destructive },
    { key: "type" as const, icon: Keyboard, label: "Type", color: colors.success },
    { key: "draw" as const, icon: Pencil, label: "Draw", color: colors.warning },
  ];

  return (
    <View>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: compact ? 0 : 12, paddingBottom: 4, alignItems: "center" }}>
        <Pressable
          onPress={() => router.push(`/(app)/calendar?date=${formatDateStr(selectedDate)}&view=day` as any)}
          onLongPress={goToToday}
          style={({ pressed }) => ({
            flexDirection: "row", alignItems: "center", gap: 8,
            backgroundColor: colors.accent + "15", paddingHorizontal: 16, paddingVertical: 10,
            borderRadius: 20, opacity: pressed ? 0.8 : 1,
          })}
        >
          <ListChecks size={18} color={colors.accent} strokeWidth={2} />
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.accent, letterSpacing: 0.5 }}>
            {formatDayLabel(selectedDate)}
          </Text>
        </Pressable>
        <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 6 }}>
          {IS_HOMECHEF
            ? `${totalTasks - totalCompleted} things left`
            : `${totalTasks - totalCompleted} tasks pending`}
        </Text>
      </View>

      {/* Day Carousel */}
      {appSettings.todoDayCarouselEnabled && (
        <View style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
          <PrepDayCarousel selectedDate={selectedDate} onSelectDate={(d) => { selectDateWithSnap(d); setWeekStart(startOfWeek(d)); }} weekStart={weekStart} onWeekChange={setWeekStart} />
        </View>
      )}

      {/* Progress Bar */}
      {appSettings.todoProgressBarEnabled && totalTasks > 0 && (
        <View style={{ paddingHorizontal: 20, paddingVertical: 6 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>{totalCompleted} of {totalTasks} done</Text>
            <Text style={{ fontSize: 12, fontWeight: "700", color: progressPct >= 100 ? colors.success : colors.accent }}>{progressPct.toFixed(0)}%</Text>
          </View>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.surface, overflow: "hidden" }}>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: progressPct >= 100 ? colors.success : colors.accent, width: `${Math.min(progressPct, 100)}%` as any }} />
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 6 }}>
        {IS_HOMECHEF ? (
          <>
            <Pressable onPress={() => router.push({ pathname: "/(app)/recipe/edit", params: { id: "new" } })}
              style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.cardBorder, opacity: pressed ? 0.7 : 1 })}>
              <Plus size={16} color={colors.accent} strokeWidth={1.5} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>Add Recipe</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/(app)/ingredients")}
              style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.cardBorder, opacity: pressed ? 0.7 : 1 })}>
              <ScanLine size={16} color={colors.success} strokeWidth={1.5} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>Scan Item</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable onPress={() => router.push("/(app)/temp-grid" as any)}
              style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.cardBorder, opacity: pressed ? 0.7 : 1 })}>
              <Thermometer size={16} color={colors.destructive} strokeWidth={1.5} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>Log Temp</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/(app)/invoices/scan")}
              style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.cardBorder, opacity: pressed ? 0.7 : 1 })}>
              <ScanLine size={16} color={colors.accent} strokeWidth={1.5} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>Scan Invoice</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/(app)/prep-lists")}
              style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.cardBorder, opacity: pressed ? 0.7 : 1 })}>
              <ClipboardList size={16} color={colors.success} strokeWidth={1.5} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>Start Prep</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      {/* ── Take a Note ───────────────────────────────────── */}
      <View style={{ marginHorizontal: 20, marginTop: 8, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, overflow: "hidden" }}>
        {/* Mode selector */}
        <View style={{ flexDirection: "row", justifyContent: "space-around", paddingVertical: 12, paddingHorizontal: 8 }}>
          {NOTE_MODES.map(({ key, icon: Icon, label, color }) => {
            const active = noteMode === key;
            return (
              <Pressable key={key} onPress={() => selectMode(key)} disabled={processing}
                style={{ alignItems: "center", gap: 4, opacity: processing ? 0.5 : 1 }}>
                <View style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: active ? color + "20" : colors.surface,
                  borderWidth: active ? 2 : 0, borderColor: active ? color : "transparent",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={20} color={active ? color : colors.textSecondary} strokeWidth={1.5} />
                </View>
                <Text style={{ fontSize: 11, fontWeight: "600", color: active ? color : colors.textMuted }}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Processing indicator */}
        {processing && (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={{ fontSize: 14, color: colors.accent, fontWeight: "600" }}>Processing note...</Text>
          </View>
        )}

        {/* Camera mode */}
        {noteMode === "camera" && !processing && (
          <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: colors.border }}>
            <ImagePicker onImageSelected={(base64) => handleCameraNote(base64)} label="" buttonText="Take Photo of Prep Note" />
          </View>
        )}

        {/* Dictate mode */}
        {noteMode === "dictate" && !processing && (
          <View style={{ alignItems: "center", paddingVertical: 20, gap: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
            {isListening ? (
              <>
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.destructive + "20", alignItems: "center", justifyContent: "center" }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.destructive, alignItems: "center", justifyContent: "center" }}>
                    <MicOff size={20} color="#FFFFFF" strokeWidth={2} />
                  </View>
                </View>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>Listening...</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>Speak your prep tasks, then tap Stop</Text>
                <Pressable onPress={handleDictateToggle}
                  style={{ backgroundColor: colors.destructive, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>Stop & Process</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={{ fontSize: 13, color: colors.textMuted }}>Tap the mic above to start dictating</Text>
              </>
            )}
          </View>
        )}

        {/* Type mode */}
        {noteMode === "type" && !processing && (
          <View style={{ padding: 14, gap: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
            <TextInput
              value={typeText}
              onChangeText={setTypeText}
              placeholder="e.g. dice 5kg onions, make stock, prep veg urgent..."
              placeholderTextColor={colors.textMuted}
              multiline
              autoFocus
              style={{
                backgroundColor: colors.surface, borderRadius: 10, padding: 12, fontSize: 14,
                color: colors.text, minHeight: 60, textAlignVertical: "top",
                borderWidth: 1, borderColor: colors.border,
              }}
            />
            <Pressable onPress={() => handleTextNote(typeText)} disabled={!typeText.trim()}
              style={{
                flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                backgroundColor: typeText.trim() ? colors.accent : colors.surface,
                borderRadius: 10, paddingVertical: 10,
              }}>
              <Send size={16} color={typeText.trim() ? "#FFFFFF" : colors.textMuted} strokeWidth={1.5} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: typeText.trim() ? "#FFFFFF" : colors.textMuted }}>Process Note</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* ── Prep List Display — Card View ────────────────── */}
      {isLoading ? (
        <View style={{ padding: 20, gap: 10 }}><SkeletonCard /><SkeletonCard /></View>
      ) : sections.length === 0 ? (
        <View style={{ alignItems: "center", paddingVertical: 24 }}>
          <CheckCircle2 size={36} color={colors.success} strokeWidth={1.5} />
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 8 }}>
            {IS_HOMECHEF ? `Nothing for ${formatDayLabel(selectedDate)}` : "All clear!"}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>Prep lists from your team will appear here</Text>
        </View>
      ) : (
        <View style={{ marginTop: 8, paddingHorizontal: 16, gap: 12, paddingBottom: 16 }}>
          {sections.map((section) => {
            const cardBg = section.isOwn ? colors.warning + "12" : colors.card;
            const cardBorder = section.isOwn ? colors.warning : colors.cardBorder;
            const pct = section.total > 0 ? (section.completed / section.total) * 100 : 0;

            return (
              <Pressable key={section.listId}
                onLongPress={() => handleDeleteList(section.listId, section.title)}
                style={{
                  backgroundColor: cardBg, borderRadius: 14,
                  borderWidth: 1, borderColor: cardBorder,
                  overflow: "hidden",
                }}>
                {/* Card header */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                    {section.priority === "high" && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.destructive }} />}
                    <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }} numberOfLines={1}>{section.title}</Text>
                    {section.notes && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <FileText size={13} color={colors.textMuted} strokeWidth={1.5} />
                        <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accent }} />
                      </View>
                    )}
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    {section.isOwn && (
                      <View style={{ backgroundColor: colors.warning + "30", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ fontSize: 10, fontWeight: "700", color: colors.warning }}>MY NOTE</Text>
                      </View>
                    )}
                    {section.status === "completed" && (
                      <View style={{ backgroundColor: colors.successBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ fontSize: 10, fontWeight: "700", color: colors.success }}>DONE</Text>
                      </View>
                    )}
                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSecondary }}>{section.completed}/{section.total}</Text>
                  </View>
                </View>

                {/* Mini progress bar */}
                <View style={{ height: 3, marginHorizontal: 14, borderRadius: 2, backgroundColor: section.isOwn ? colors.warning + "30" : colors.surface, overflow: "hidden" }}>
                  <View style={{ height: 3, borderRadius: 2, backgroundColor: pct >= 100 ? colors.success : colors.accent, width: `${Math.min(pct, 100)}%` as any }} />
                </View>

                {/* Task items */}
                <View style={{ paddingTop: 6, paddingBottom: 4 }}>
                  {section.data.map((item, index) => (
                    <Pressable key={item.id || index}
                      onPress={() => { const list = activeLists.find((l) => l.id === section.listId); if (list) handleToggle(list.id, list.items, index); }}
                      onLongPress={() => {
                        Alert.alert(item.task, "Actions", [
                          { text: "Delete Task", style: "destructive", onPress: () => { const list = activeLists.find((l) => l.id === section.listId); if (list) handleDeleteItem(list.id, list.items, index); }},
                          { text: "Cancel", style: "cancel" },
                        ]);
                      }}
                      style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, paddingHorizontal: 14 }}>
                      <View style={{
                        width: 20, height: 20, borderRadius: 6,
                        borderWidth: 2, borderColor: item.completed ? colors.success : colors.border,
                        backgroundColor: item.completed ? colors.success : "transparent",
                        alignItems: "center", justifyContent: "center",
                      }}>
                        {item.completed && <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "800" }}>{"\u2713"}</Text>}
                      </View>
                      <Text style={{ flex: 1, fontSize: 14, color: item.completed ? colors.textMuted : colors.text, textDecorationLine: item.completed ? "line-through" : "none" }}>{item.task}</Text>
                      {item.quantity ? <Text style={{ fontSize: 11, color: colors.textSecondary, backgroundColor: colors.surface, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: "hidden" }}>{item.quantity}</Text> : null}
                      {item.urgency === "priority" && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.destructive }} />}
                    </Pressable>
                  ))}
                </View>
              </Pressable>
            );
          })}

          {/* File Away button */}
          {sections.some((s) => s.status !== "completed") && (
            <Pressable onPress={handleFileAway}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                paddingVertical: 14, borderRadius: 12,
                backgroundColor: pressed ? colors.surface : "transparent",
                borderWidth: 1, borderColor: colors.border, borderStyle: "dashed" as any,
              })}>
              <Archive size={16} color={colors.textMuted} strokeWidth={1.5} />
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textMuted }}>File Away All</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Full-screen Draw Canvas */}
      <Modal visible={showCanvas} animationType="slide" presentationStyle="fullScreen">
        <FingerCanvas
          onDone={handleDrawNote}
          onClose={() => { setShowCanvas(false); setNoteMode(null); }}
          loading={processing}
        />
      </Modal>
    </View>
  );
}
