import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useBetaTrack } from "@/hooks/useBetaTrack";
import {
  Plus, Calendar, CheckCircle2, Circle, Clock, User, Edit, Trash2,
  Loader2, Flag, MessageSquare, Share2, ClipboardList, X, Eye, Archive, Sparkles,
  FastForward, Pencil, Camera, Lightbulb
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { PrepListComments } from "@/components/prep/PrepListComments";
import { PrepTaskActions } from "@/components/prep/PrepTaskActions";
import NightlyStockCount from "@/components/prep/NightlyStockCount";
import { PrepDayCarousel } from "@/components/prep/PrepDayCarousel";
import { PrepDayHeader } from "@/components/prep/PrepDayHeader";
import { useSectionLeaderStatus } from "@/hooks/useSectionLeaderStatus";
import { SwipeableRow } from "@/components/mobile/SwipeableRow";
import { useIsMobile } from "@/hooks/use-mobile";
import ReportActions from "@/components/shared/ReportActions";
import { useOrgId } from "@/hooks/useOrgId";
import { FingerCanvas } from "@/components/prep/FingerCanvas";
import { usePrepSuggestions } from "@/hooks/usePrepSuggestions";
import { usePrepPatternDetection } from "@/hooks/usePrepPatternDetection";
import VenueSelector from "@/components/dashboard/VenueSelector";
import { WeeklyPrepView } from "@/components/prep/WeeklyPrepView";
import { PrepListTemplatesManager } from "@/components/prep/PrepListTemplatesManager";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DelegatedTasksBanner } from "@/components/prep/DelegatedTasksBanner";
import { ChefWishlistTab } from "@/components/prep/ChefWishlistTab";

type PrepViewTab = "day" | "week" | "templates" | "wishlist";
type UrgencyLevel = "priority" | "end_of_day" | "within_48h";

interface PrepItem {
  id: string;
  task: string;
  quantity: string;
  completed: boolean;
  urgency?: UrgencyLevel;
}

const URGENCY_CONFIG: Record<UrgencyLevel, { color: string; bgColor: string; label: string }> = {
  priority: { color: "text-red-600", bgColor: "bg-red-500", label: "Before Next Service" },
  end_of_day: { color: "text-yellow-600", bgColor: "bg-yellow-500", label: "End of Day" },
  within_48h: { color: "text-green-600", bgColor: "bg-green-500", label: "48 Hours" },
};

interface PrepList {
  id: string;
  name: string;
  date: string;
  items: PrepItem[];
  assigned_to: string | null;
  assigned_to_name: string | null;
  status: "pending" | "in_progress" | "completed";
  notes: string | null;
  section_id: string | null;
  created_by: string | null;
  is_auto_generated?: boolean;
  head_chef_reviewed?: boolean;
  head_chef_notes?: string | null;
  archived_at?: string | null;
}

const DAY_NAMES = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

/** Returns today, or tomorrow if past 9 PM */
const getDefaultDate = (): Date => {
  const now = new Date();
  if (now.getHours() >= 21) return addDays(now, 1);
  return now;
};

const PrepLists = () => {
  const { user, canEdit, profile, role } = useAuth();
  const { currentOrg, venues, membership } = useOrg();
  const betaTrack = useBetaTrack((currentOrg as any)?.app_variant || "chefos_au");
  useEffect(() => { betaTrack.pageView("prep-lists"); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const { canManageTemplates } = useSectionLeaderStatus();
  const reportRef = useRef<HTMLDivElement>(null);
  const orgId = useOrgId();

  // ─── Venue selector state ──────────────────────
  const defaultVenueId = (role === "owner" || role === "head_chef") ? null : (membership?.venue_id || null);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(defaultVenueId);
  const [activeTab, setActiveTab] = useState<PrepViewTab>("day");

  // ─── Day carousel state ─────────────────────────
  const [selectedDate, setSelectedDate] = useState<Date>(getDefaultDate);
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(getDefaultDate(), { weekStartsOn: 1 })
  );

  // ─── Prep list state ────────────────────────────
  const [prepLists, setPrepLists] = useState<PrepList[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<PrepList | null>(null);
  const [deletingList, setDeletingList] = useState<PrepList | null>(null);
  const [expandedListId, setExpandedListId] = useState<string | null>(null);
  const [autoCreating, setAutoCreating] = useState(false);
  const [canvasOpen, setCanvasOpen] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scannedTasks, setScannedTasks] = useState<{ task: string; quantity: string; urgency: UrgencyLevel; include: boolean }[]>([]);
  const [scanReviewOpen, setScanReviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks for suggestions & patterns
  const { data: suggestions } = usePrepSuggestions(selectedDate);
  const { suggestions: patternSuggestions, dismiss: dismissPattern } = usePrepPatternDetection();
  const [formData, setFormData] = useState({
    name: "",
    date: format(getDefaultDate(), "yyyy-MM-dd"),
    assigned_to_name: "",
    status: "pending" as "pending" | "in_progress" | "completed",
    notes: "",
    items: [] as PrepItem[],
  });

  const [newTask, setNewTask] = useState({ task: "", quantity: "", urgency: "within_48h" as UrgencyLevel });

  const isMobile = useIsMobile();
  const hasEditPermission = canEdit("prep");
  const isHeadChef = role === "head_chef" || role === "owner";

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");

  // ─── 9 PM rollover timer ────────────────────────
  useEffect(() => {
    const now = new Date();
    const tonight9pm = new Date(now);
    tonight9pm.setHours(21, 0, 0, 0);

    // If already past 9 PM, no timer needed (we already defaulted to tomorrow)
    if (now >= tonight9pm) return;

    const msUntil9pm = tonight9pm.getTime() - now.getTime();
    const timer = setTimeout(() => {
      const tomorrow = addDays(new Date(), 1);
      setSelectedDate(tomorrow);
      setWeekStart(startOfWeek(tomorrow, { weekStartsOn: 1 }));
      toast.info("Tomorrow's prep loaded", { icon: "🌙" });
    }, msUntil9pm);

    return () => clearTimeout(timer);
  }, []);

  // ─── Permissions ────────────────────────────────
  const canEditList = (list: PrepList) => {
    if (isHeadChef) return true;
    if (hasEditPermission) return true;
    if (list.assigned_to && list.assigned_to === user?.id) return true;
    if (list.assigned_to_name && profile?.full_name &&
      list.assigned_to_name.toLowerCase() === profile.full_name.toLowerCase()) return true;
    return false;
  };

  // ─── Fetch prep lists for selected date ─────────
  const fetchPrepLists = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("prep_lists")
      .select("*")
      .eq("date", selectedDateStr)
      .order("created_at", { ascending: true });

    if (selectedVenueId) {
      query = query.eq("venue_id", selectedVenueId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching prep lists:", error);
      toast.error("Failed to load prep lists");
    } else {
      const formattedData = (data || []).map(item => ({
        ...item,
        items: (Array.isArray(item.items) ? item.items : []) as unknown as PrepItem[],
        status: item.status as "pending" | "in_progress" | "completed",
      }));
      setPrepLists(formattedData);
    }
    setLoading(false);
  }, [selectedDateStr, selectedVenueId]);

  useEffect(() => {
    fetchPrepLists();

    const channel = supabase
      .channel('prep-lists-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prep_lists' }, () => fetchPrepLists())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPrepLists]);

  // ─── Auto-create from templates ─────────────────
  useEffect(() => {
    if (loading || autoCreating || !user || !currentOrg) return;
    // Only auto-create if there are zero lists for this date
    if (prepLists.length > 0) return;

    const dayIndex = selectedDate.getDay();
    const dayName = DAY_NAMES[dayIndex === 0 ? 6 : dayIndex - 1];

    const autoCreate = async () => {
      setAutoCreating(true);
      try {
        // Fetch matching templates
        const { data: templates, error: tplError } = await supabase
          .from("prep_list_templates")
          .select("*")
          .eq("is_active", true);

        if (tplError || !templates || templates.length === 0) {
          setAutoCreating(false);
          return;
        }

        const matchingTemplates = templates.filter(t => {
          if (t.schedule_type === "daily") return true;
          if (t.schedule_type === "weekly") {
            const days = t.schedule_days || [];
            return days.includes(dayName);
          }
          return false;
        });

        if (matchingTemplates.length === 0) {
          setAutoCreating(false);
          return;
        }

        const listsToCreate = matchingTemplates.map(t => ({
          name: t.name,
          date: selectedDateStr,
          items: JSON.parse(JSON.stringify(
            (Array.isArray(t.items) ? t.items : []).map((item: any) => ({
              ...item,
              id: item.id || crypto.randomUUID(),
              completed: false,
            }))
          )),
          section_id: t.section_id,
          template_id: t.id,
          assigned_to_name: t.default_assignee_name,
          created_by: user.id,
          org_id: currentOrg.id,
          status: "pending",
          is_auto_generated: true,
        }));

        const { error } = await supabase.from("prep_lists").insert(listsToCreate as any);
        if (!error) {
          toast.success(`Prep list loaded from ${format(selectedDate, "EEEE")} template`, { icon: "✨" });
          fetchPrepLists();
        }
      } catch (e) {
        console.error("Auto-create error:", e);
      }
      setAutoCreating(false);
    };

    autoCreate();
  }, [loading, prepLists.length, selectedDateStr, user, currentOrg]);

  // ─── CRUD handlers (unchanged logic) ────────────
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Prep list name is required");
      return;
    }

    if (editingList) {
      const { error } = await supabase
        .from("prep_lists")
        .update({
          name: formData.name,
          date: formData.date,
          assigned_to_name: formData.assigned_to_name || null,
          status: formData.status,
          notes: formData.notes || null,
          items: JSON.parse(JSON.stringify(formData.items)),
        })
        .eq("id", editingList.id);

      if (error) { toast.error("Failed to update prep list"); return; }
      toast.success("Prep list updated");
    } else {
      const { error } = await supabase.from("prep_lists").insert({
        name: formData.name,
        date: formData.date,
        assigned_to_name: formData.assigned_to_name || null,
        status: formData.status,
        notes: formData.notes || null,
        items: JSON.parse(JSON.stringify(formData.items)),
        created_by: user?.id,
        org_id: currentOrg?.id,
        venue_id: selectedVenueId || null,
      });

      if (error) { toast.error("Failed to create prep list"); return; }
      toast.success("Prep list created");
    }
    resetForm();
  };

  const handleDelete = async () => {
    if (!deletingList) return;
    const { error } = await supabase.from("prep_lists").delete().eq("id", deletingList.id);
    if (error) { toast.error("Failed to delete prep list"); return; }
    toast.success("Prep list deleted");
    setDeleteDialogOpen(false);
    setDeletingList(null);
  };

  const toggleTaskComplete = async (list: PrepList, taskId: string) => {
    if (!user) return;
    const updatedItems = list.items.map(item =>
      item.id === taskId ? { ...item, completed: !item.completed } : item
    );
    const allCompleted = updatedItems.every(item => item.completed);
    const anyInProgress = updatedItems.some(item => item.completed) && !allCompleted;

    setPrepLists(prev => prev.map(l =>
      l.id === list.id ? { ...l, items: updatedItems, status: allCompleted ? "completed" : anyInProgress ? "in_progress" : "pending" } : l
    ));

    const { error } = await supabase
      .from("prep_lists")
      .update({
        items: JSON.parse(JSON.stringify(updatedItems)),
        status: allCompleted ? "completed" : anyInProgress ? "in_progress" : "pending",
      })
      .eq("id", list.id);

    if (error) { toast.error("Failed to update task"); fetchPrepLists(); }
  };

  const updateListStatus = async (list: PrepList, newStatus: "pending" | "in_progress" | "completed") => {
    setPrepLists(prev => prev.map(l => l.id === list.id ? { ...l, status: newStatus } : l));
    const { error } = await supabase.from("prep_lists").update({ status: newStatus }).eq("id", list.id);
    if (error) { toast.error("Failed to update status"); fetchPrepLists(); }
    else toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
  };

  const postToWall = async (list: PrepList) => {
    if (!user) return;
    const completedCount = list.items.filter(i => i.completed).length;
    const content = `📋 Prep list "${list.name}" - ${completedCount}/${list.items.length} tasks done`;
    const { error } = await supabase.from("team_posts").insert({
      user_id: user.id,
      user_name: profile?.full_name || user.email?.split("@")[0],
      content,
      post_type: "prep_list_shared",
      linked_prep_list_id: list.id,
      org_id: currentOrg?.id || null,
    });
    if (error) { toast.error("Failed to post to wall"); return; }
    toast.success("Posted to Kitchen Wall!");
  };

  const addTaskToForm = () => {
    if (!newTask.task.trim()) return;
    setFormData({
      ...formData,
      items: [...formData.items, { id: crypto.randomUUID(), task: newTask.task, quantity: newTask.quantity, completed: false, urgency: newTask.urgency }],
    });
    setNewTask({ task: "", quantity: "", urgency: "within_48h" });
  };

  const removeTaskFromForm = (taskId: string) => {
    setFormData({ ...formData, items: formData.items.filter(item => item.id !== taskId) });
  };

  const openEditDialog = (list: PrepList) => {
    setEditingList(list);
    setFormData({
      name: list.name, date: list.date,
      assigned_to_name: list.assigned_to_name || "",
      status: list.status, notes: list.notes || "",
      items: list.items,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setDialogOpen(false);
    setEditingList(null);
    setFormData({ name: "", date: selectedDateStr, assigned_to_name: "", status: "pending", notes: "", items: [] });
    setNewTask({ task: "", quantity: "", urgency: "within_48h" });
  };

  const loadTomorrow = () => {
    const tomorrow = addDays(new Date(), 1);
    setSelectedDate(tomorrow);
    setWeekStart(startOfWeek(tomorrow, { weekStartsOn: 1 }));
    toast.info("Tomorrow's prep loaded", { icon: "🌙" });
  };

  // ─── Scan / Canvas handlers ─────────────────────
  const handleCanvasDone = async (base64: string) => {
    setScanLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("scan-prep-note", {
        body: { image_base64: base64, file_type: "image/png", mode: "canvas" },
      });
      if (error) throw error;
      const tasks = (data?.tasks || []).map((t: any) => ({ ...t, include: true }));
      setScannedTasks(tasks);
      setCanvasOpen(false);
      setScanReviewOpen(true);
    } catch (e: any) {
      toast.error(e?.message || "Failed to read handwriting");
    }
    setScanLoading(false);
  };

  const handlePhotoScan = async (file: File) => {
    setScanLoading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { data, error } = await supabase.functions.invoke("scan-prep-note", {
        body: { image_base64: base64, file_type: file.type, mode: "photo" },
      });
      if (error) throw error;
      const tasks = (data?.tasks || []).map((t: any) => ({ ...t, include: true }));
      setScannedTasks(tasks);
      setScanReviewOpen(true);
    } catch (e: any) {
      toast.error(e?.message || "Failed to scan photo");
    }
    setScanLoading(false);
  };

  const addScannedTasks = async () => {
    const tasksToAdd = scannedTasks.filter(t => t.include).map(t => ({
      id: crypto.randomUUID(),
      task: t.task,
      quantity: t.quantity,
      completed: false,
      urgency: t.urgency,
    }));
    if (tasksToAdd.length === 0) { toast.error("No tasks selected"); return; }

    // If there's an existing prep list for today, append; otherwise create
    if (prepLists.length > 0) {
      const target = prepLists[0];
      const updatedItems = [...target.items, ...tasksToAdd];
      const { error } = await supabase.from("prep_lists").update({
        items: JSON.parse(JSON.stringify(updatedItems)),
      }).eq("id", target.id);
      if (error) { toast.error("Failed to add tasks"); return; }
      toast.success(`${tasksToAdd.length} tasks added to "${target.name}"`);
    } else {
      const { error } = await supabase.from("prep_lists").insert({
        name: `Scanned Prep - ${format(selectedDate, "MMM d")}`,
        date: selectedDateStr,
        items: JSON.parse(JSON.stringify(tasksToAdd)),
        created_by: user?.id,
        org_id: currentOrg?.id,
        status: "pending",
      });
      if (error) { toast.error("Failed to create list"); return; }
      toast.success(`Prep list created with ${tasksToAdd.length} tasks`);
    }
    setScanReviewOpen(false);
    setScannedTasks([]);
    fetchPrepLists();
  };


  const totalTasks = prepLists.reduce((acc, list) => acc + list.items.length, 0);
  const completedTasks = prepLists.reduce((acc, list) => acc + list.items.filter(t => t.completed).length, 0);
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const statusConfig = {
    pending: { icon: Circle, color: "text-muted-foreground", bg: "bg-muted", label: "Pending" },
    in_progress: { icon: Clock, color: "text-warning", bg: "bg-warning/10", label: "In Progress" },
    completed: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", label: "Completed" },
  };

  return (
    <AppLayout>
      <div ref={reportRef} className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="page-title font-display">Prep Lists</h1>
            <p className="page-subtitle">Daily prep & stock counts</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <ReportActions title="Prep Lists Report" contentRef={reportRef} reportType="prep-lists" orgId={orgId} />
            {hasEditPermission && (
              <>
                <Button variant="outline" size="sm" onClick={() => setCanvasOpen(true)}>
                  <Pencil className="w-4 h-4 mr-1" /> Quick Note
                </Button>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={scanLoading}>
                  <Camera className="w-4 h-4 mr-1" /> Scan
                </Button>
                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoScan(f); e.target.value = ""; }} />
              </>
            )}
            <Button variant="outline" size="sm" onClick={loadTomorrow}>
              <FastForward className="w-4 h-4 mr-1" /> Tomorrow
            </Button>
            {hasEditPermission && (
              <Button size="sm" onClick={() => { setFormData({ ...formData, date: selectedDateStr }); setDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Create New
              </Button>
            )}
          </div>
        </motion.div>

        {/* View Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PrepViewTab)} className="w-full">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="day" className="flex-1 sm:flex-none">📋 Day</TabsTrigger>
            <TabsTrigger value="week" className="flex-1 sm:flex-none">📅 Week</TabsTrigger>
            <TabsTrigger value="templates" className="flex-1 sm:flex-none">📝 Templates</TabsTrigger>
            <TabsTrigger value="wishlist" className="flex-1 sm:flex-none">🛒 Wishlist</TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === "week" && <WeeklyPrepView />}
        {activeTab === "templates" && <PrepListTemplatesManager />}
        {activeTab === "wishlist" && <ChefWishlistTab />}

        {activeTab === "day" && (<>
        {/* Day Carousel */}
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="card-elevated p-3">
          <PrepDayCarousel
            selectedDate={selectedDate}
            onSelectDate={(d) => {
              setSelectedDate(d);
              setWeekStart(startOfWeek(d, { weekStartsOn: 1 }));
            }}
            weekStart={weekStart}
            onWeekChange={setWeekStart}
          />
        </motion.div>

        {/* Venue Selector (multi-venue orgs only) */}
        {venues.length > 1 && (
          <div className="flex justify-end">
            <VenueSelector selectedVenueId={selectedVenueId} onSelect={setSelectedVenueId} />
          </div>
        )}

        {/* Day Header */}
        <PrepDayHeader date={selectedDate} />

        {/* Delegated Tasks Banner */}
        <DelegatedTasksBanner dueDate={selectedDateStr} />

        {/* Stock Count - synced to selected date */}
        <NightlyStockCount externalDate={selectedDateStr} />

        {/* Progress Overview */}
        {totalTasks > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="card-elevated p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="section-header mb-0">Day's Progress</h2>
                <p className="text-sm text-muted-foreground">{completedTasks} of {totalTasks} tasks completed</p>
              </div>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }} className="h-full bg-primary rounded-full" />
            </div>
          </motion.div>
        )}

        {/* Pattern Suggestions Banner */}
        {patternSuggestions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            {patternSuggestions.map((ps, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <Lightbulb className="w-5 h-5 text-primary flex-shrink-0" />
                <p className="text-sm flex-1">
                  You prep <strong>"{ps.task}"</strong> every {ps.dayLabel}. Save to template?
                </p>
                <Button size="sm" variant="outline" onClick={() => dismissPattern(ps.task, ps.dayOfWeek)}>
                  Dismiss
                </Button>
                <Button size="sm" onClick={async () => {
                  // Auto-add to template logic
                  const dayNameLower = ps.dayLabel.toLowerCase();
                  const { data: existingTemplates } = await supabase
                    .from("prep_list_templates")
                    .select("*")
                    .eq("is_active", true);

                  const matchingTpl = existingTemplates?.find(t =>
                    t.schedule_type === "weekly" && (t.schedule_days || []).includes(dayNameLower)
                  );

                  if (matchingTpl) {
                    const existingItems = Array.isArray(matchingTpl.items) ? matchingTpl.items as any[] : [];
                    const alreadyExists = existingItems.some((it: any) => it.task?.toLowerCase() === ps.task.toLowerCase());
                    if (!alreadyExists) {
                      existingItems.push({ id: crypto.randomUUID(), task: ps.task, quantity: "", completed: false, urgency: "within_48h" });
                      await supabase.from("prep_list_templates").update({ items: JSON.parse(JSON.stringify(existingItems)) }).eq("id", matchingTpl.id);
                    }
                    toast.success(`Added "${ps.task}" to ${matchingTpl.name} template`);
                  } else {
                    await supabase.from("prep_list_templates").insert({
                      name: `${ps.dayLabel} Auto Template`,
                      schedule_type: "weekly",
                      schedule_days: [dayNameLower],
                      items: JSON.parse(JSON.stringify([{ id: crypto.randomUUID(), task: ps.task, quantity: "", completed: false, urgency: "within_48h" }])),
                      is_active: true,
                      org_id: currentOrg?.id,
                      created_by: user?.id,
                    } as any);
                    toast.success(`Created ${ps.dayLabel} template with "${ps.task}"`);
                  }
                  dismissPattern(ps.task, ps.dayOfWeek);
                }}>
                  Add to Template
                </Button>
              </div>
            ))}
          </motion.div>
        )}

        {/* Prep List Cards */}
        {loading || autoCreating ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {prepLists.map((list, listIndex) => {
              const sc = statusConfig[list.status];
              const StatusIcon = sc.icon;
              const isExpanded = expandedListId === list.id;
              const completedCount = list.items.filter(t => t.completed).length;
              const listProgress = list.items.length > 0 ? (completedCount / list.items.length) * 100 : 0;
              const editable = canEditList(list);

              return (
                <motion.div key={list.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + listIndex * 0.05 }}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    {/* Card Header */}
                    <div className="p-4 border-b border-border">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{list.name}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {list.assigned_to_name && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <User className="w-3 h-3" /> {list.assigned_to_name}
                              </Badge>
                            )}
                            {list.is_auto_generated && (
                              <Badge variant="secondary" className="text-xs gap-1 bg-primary/10 text-primary">
                                <Sparkles className="w-3 h-3" /> Auto
                              </Badge>
                            )}
                            {isHeadChef && !list.head_chef_reviewed && list.status === "pending" && (
                              <Badge variant="secondary" className="text-xs gap-1 bg-warning/10 text-warning">
                                <Eye className="w-3 h-3" /> Needs Review
                              </Badge>
                            )}
                          </div>
                        </div>

                        {editable ? (
                          <Select value={list.status}
                            onValueChange={(v: "pending" | "in_progress" | "completed") => updateListStatus(list, v)}>
                            <SelectTrigger className={cn("w-auto gap-1 h-8 text-xs border-0", sc.bg, sc.color)}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="secondary" className={cn("gap-1", sc.color)}>
                            <StatusIcon className="w-3 h-3" /> {sc.label}
                          </Badge>
                        )}
                      </div>

                      <div className="h-1.5 bg-muted rounded-full mt-3 overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${listProgress}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {completedCount}/{list.items.length} tasks
                      </p>
                    </div>

                    {/* Head Chef Notes */}
                    {list.head_chef_notes && (
                      <div className="mx-4 my-2 p-2.5 rounded-lg bg-warning/10 border border-warning/20">
                        <p className="text-xs font-medium text-warning flex items-center gap-1.5">
                          <Eye className="w-3 h-3" /> Head Chef Notes
                        </p>
                        <p className="text-xs text-foreground mt-1">{list.head_chef_notes}</p>
                      </div>
                    )}

                    {/* Task Items */}
                    <CardContent className="p-0">
                      <div className="divide-y divide-border">
                        {list.items.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">No tasks</div>
                        ) : (
                          list.items.map((task) => {
                            const urgency = task.urgency || "within_48h";
                            const taskContent = (
                              <div className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors group/task">
                                <button className="flex-shrink-0" onClick={() => toggleTaskComplete(list, task.id)}
                                  disabled={!user}>
                                  {task.completed ? (
                                    <CheckCircle2 className="w-5 h-5 text-success" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                                  )}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className={cn("text-sm font-medium truncate",
                                      task.completed && "line-through text-muted-foreground"
                                    )}>{task.task}</p>
                                    {!task.completed && (
                                      <Flag className={cn("w-3 h-3 flex-shrink-0", URGENCY_CONFIG[urgency].color)} />
                                    )}
                                  </div>
                                  {task.quantity && (
                                    <p className="text-xs text-muted-foreground">{task.quantity}</p>
                                  )}
                                </div>
                                {!task.completed && (
                                  <div className="opacity-0 group-hover/task:opacity-100 transition-opacity">
                                    <PrepTaskActions
                                      taskName={task.task}
                                      onPostToWall={() => postToWall(list)}
                                      onLogProduction={() => toast.success(`Production logged: ${task.task}`)}
                                    />
                                  </div>
                                )}
                              </div>
                            );

                            return isMobile && !task.completed ? (
                              <SwipeableRow key={task.id}
                                onSwipeRight={() => toggleTaskComplete(list, task.id)}
                                rightLabel="Done" disabled={!user}>
                                {taskContent}
                              </SwipeableRow>
                            ) : (
                              <div key={task.id}>{taskContent}</div>
                            );
                          })
                        )}
                      </div>
                    </CardContent>

                    {/* Card Actions */}
                    <div className="p-3 border-t border-border flex items-center justify-between">
                      <div className="flex gap-1">
                        <button onClick={() => postToWall(list)}
                          className="p-2 rounded-lg hover:bg-muted transition-colors" title="Share to Wall">
                          <Share2 className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button onClick={() => setExpandedListId(isExpanded ? null : list.id)}
                          className={cn("p-2 rounded-lg transition-colors",
                            isExpanded ? "bg-primary/10 text-primary" : "hover:bg-muted"
                          )} title="Comments">
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        {isHeadChef && !list.head_chef_reviewed && (
                          <button
                            onClick={async () => {
                              const { error } = await supabase.from("prep_lists")
                                .update({ head_chef_reviewed: true }).eq("id", list.id);
                              if (!error) toast.success("Marked as reviewed");
                              else toast.error("Failed to update");
                            }}
                            className="p-2 rounded-lg hover:bg-success/10 transition-colors" title="Mark as Reviewed">
                            <Eye className="w-4 h-4 text-success" />
                          </button>
                        )}
                        {editable && list.status === "completed" && !list.archived_at && (
                          <button
                            onClick={async () => {
                              const { error } = await supabase.from("prep_lists")
                                .update({ archived_at: new Date().toISOString() }).eq("id", list.id);
                              if (!error) toast.success("Archived");
                              else toast.error("Failed to archive");
                            }}
                            className="p-2 rounded-lg hover:bg-muted transition-colors" title="Archive">
                            <Archive className="w-4 h-4 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                      {editable && (
                        <div className="flex gap-1">
                          <button onClick={() => openEditDialog(list)}
                            className="p-2 rounded-lg hover:bg-muted transition-colors">
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button onClick={() => { setDeletingList(list); setDeleteDialogOpen(true); }}
                            className="p-2 rounded-lg hover:bg-destructive/10 transition-colors">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Comments */}
                    {isExpanded && (
                      <div className="p-4 bg-muted/30 border-t border-border">
                        <PrepListComments prepListId={list.id} />
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}

            {prepLists.length === 0 && !loading && !autoCreating && (
              <div className="md:col-span-2 card-elevated p-12 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No prep lists for {format(selectedDate, "EEEE, MMM d")}
                </p>
                {hasEditPermission && (
                  <Button variant="outline" className="mt-4" onClick={() => { setFormData({ ...formData, date: selectedDateStr }); setDialogOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" /> Create Prep List
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
        </>)}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={resetForm}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingList ? "Edit Prep List" : "New Prep List"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">List Name *</Label>
                <Input id="name" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., AM Prep, Lunch Prep" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assigned">Assigned To</Label>
                  <Input id="assigned" value={formData.assigned_to_name}
                    onChange={(e) => setFormData({ ...formData, assigned_to_name: e.target.value })}
                    placeholder="e.g., Maria" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status}
                  onValueChange={(value: "pending" | "in_progress" | "completed") => setFormData({ ...formData, status: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tasks */}
              <div className="space-y-2">
                <Label>Tasks</Label>
                <div className="space-y-2">
                  {formData.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                      <Flag className={cn("w-4 h-4 flex-shrink-0", URGENCY_CONFIG[item.urgency || "within_48h"].color)} />
                      <span className="flex-1 text-sm">{item.task}</span>
                      <span className="text-xs text-muted-foreground">{item.quantity}</span>
                      <button type="button" onClick={() => removeTaskFromForm(item.id)} className="p-1 rounded hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Input placeholder="Task name" className="flex-1 min-w-[150px]"
                    value={newTask.task} onChange={(e) => setNewTask({ ...newTask, task: e.target.value })} />
                  <Input placeholder="Qty" className="w-20"
                    value={newTask.quantity} onChange={(e) => setNewTask({ ...newTask, quantity: e.target.value })} />
                  <Select value={newTask.urgency} onValueChange={(value: UrgencyLevel) => setNewTask({ ...newTask, urgency: value })}>
                    <SelectTrigger className="w-[160px]">
                      <div className="flex items-center gap-2">
                        <Flag className={cn("w-3 h-3", URGENCY_CONFIG[newTask.urgency].color)} />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="priority"><div className="flex items-center gap-2"><Flag className="w-3 h-3 text-red-600" />Before Next Service</div></SelectItem>
                      <SelectItem value="end_of_day"><div className="flex items-center gap-2"><Flag className="w-3 h-3 text-yellow-600" />End of Day</div></SelectItem>
                      <SelectItem value="within_48h"><div className="flex items-center gap-2"><Flag className="w-3 h-3 text-green-600" />48 Hours</div></SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" onClick={addTaskToForm}><Plus className="w-4 h-4" /></Button>
                </div>
                {/* Smart Suggestions */}
                {suggestions && suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {suggestions
                      .filter(s => !newTask.task || s.task.toLowerCase().includes(newTask.task.toLowerCase()))
                      .slice(0, 5)
                      .map((s, i) => (
                        <button key={i} type="button"
                          onClick={() => setNewTask({ ...newTask, task: s.task, quantity: s.quantity || newTask.quantity })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-muted hover:bg-muted/80 text-foreground transition-colors">
                          {s.dayMatch && <Sparkles className="w-3 h-3 text-primary" />}
                          {s.task}
                          {s.quantity && <span className="text-muted-foreground">({s.quantity})</span>}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSubmit}>{editingList ? "Save Changes" : "Create List"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={deleteDialogOpen} onOpenChange={() => setDeleteDialogOpen(false)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Delete Prep List</DialogTitle></DialogHeader>
            <p className="text-muted-foreground">Are you sure you want to delete "{deletingList?.name}"? This action cannot be undone.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Scan Review Dialog */}
        <Dialog open={scanReviewOpen} onOpenChange={() => setScanReviewOpen(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Scanned Tasks</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Review and select which tasks to add:</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {scannedTasks.map((t, i) => (
                <label key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
                  <input type="checkbox" checked={t.include}
                    onChange={() => setScannedTasks(prev => prev.map((s, j) => j === i ? { ...s, include: !s.include } : s))}
                    className="rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.task}</p>
                    {t.quantity && <p className="text-xs text-muted-foreground">{t.quantity}</p>}
                  </div>
                  <Badge variant="outline" className="text-xs">{URGENCY_CONFIG[t.urgency]?.label || "48h"}</Badge>
                </label>
              ))}
              {scannedTasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No tasks found</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setScanReviewOpen(false)}>Cancel</Button>
              <Button onClick={addScannedTasks} disabled={!scannedTasks.some(t => t.include)}>
                Add {scannedTasks.filter(t => t.include).length} Tasks
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Finger Canvas Overlay */}
      <FingerCanvas open={canvasOpen} onClose={() => setCanvasOpen(false)} onDone={handleCanvasDone} loading={scanLoading} />

      {/* Global scan loading indicator */}
      {scanLoading && !canvasOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-lg">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm text-foreground">Reading image…</span>
        </div>
      )}
    </AppLayout>
  );
};

export default PrepLists;
