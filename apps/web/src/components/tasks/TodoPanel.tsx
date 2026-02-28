import { useState, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, ListChecks, ShoppingCart, Check, Trash2, Archive as ArchiveIcon,
  Circle, Loader2, Camera, Pencil, ClipboardList,
  LayoutGrid, List, Send, Search, Sparkles, BookmarkPlus, BookOpen,
  Calendar as CalendarIcon, Settings2, Repeat, X,
} from "lucide-react";
import { useTodoItems, AddTodoInput, TodoItem } from "@/hooks/useTodoItems";
import { useTodoTemplates, TodoTemplateItem } from "@/hooks/useTodoTemplates";
import { useDelegatedTasks } from "@/hooks/useDelegatedTasks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isSameDay, startOfWeek, addDays, parseISO } from "date-fns";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { PrepDayCarousel } from "@/components/prep/PrepDayCarousel";
import { PrepDayHeader } from "@/components/prep/PrepDayHeader";
import { FingerCanvas } from "@/components/prep/FingerCanvas";
import { SendToChefDialog } from "@/components/tasks/SendToChefDialog";
import { ChefOrdersReview } from "@/components/tasks/ChefOrdersReview";
import { TodoSettingsDrawer } from "@/components/tasks/TodoSettingsDrawer";
import { useAppSettings } from "@/hooks/useAppSettings";
import { isHomeCookMode } from "@/lib/shared/modeConfig";
import { supabase } from "@/integrations/supabase/client";
import TodoArchiveView from "@/components/tasks/TodoArchiveView";
import WorkflowRulesPanel from "@/components/tasks/WorkflowRulesPanel";
import TodoVoiceMic from "@/components/tasks/TodoVoiceMic";

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-destructive",
  medium: "bg-warning",
  low: "bg-success",
};

const getDefaultDate = (): Date => {
  const now = new Date();
  if (now.getHours() >= 21) return addDays(now, 1);
  return now;
};

type TodoTab = "tasks" | "shopping" | "orders" | "workflows";

interface TodoPanelProps {
  compact?: boolean;
}

const TodoPanel = ({ compact = false }: TodoPanelProps) => {
  const { todos, isLoading, pendingCount, addTodo, updateTodo, uploadPhoto, toggleComplete, deleteTodo, clearCompleted } = useTodoItems();
  const { templates, saveAsTemplate, loadTemplate, deleteTemplate } = useTodoTemplates();
  const { tasks: delegatedTasks } = useDelegatedTasks();
  const { role } = useAuth();
  const { storeMode } = useOrg();
  const { settings } = useAppSettings();
  const isHomeCook = isHomeCookMode(storeMode);
  const [tab, setTab] = useState<TodoTab>("tasks");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");
  const [addOpen, setAddOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [templateName, setTemplateName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoItemId, setPhotoItemId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(getDefaultDate);
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(getDefaultDate(), { weekStartsOn: 1 }));
  const [sendToChefOpen, setSendToChefOpen] = useState(false);
  const [sendToChefItem, setSendToChefItem] = useState<TodoItem | null>(null);
  const [canvasOpen, setCanvasOpen] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const scanFileRef = useRef<HTMLInputElement>(null);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Archive state
  const [archiveOpen, setArchiveOpen] = useState(false);

  // AI suggest state
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ title: string; priority: string; category: string }>>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");

  // Search across all todos
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return todos.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.assigned_to_name?.toLowerCase().includes(q)
    );
  }, [searchQuery, todos]);

  // Filter by date + category
  const filteredTodos = useMemo(() => {
    if (searchResults) return searchResults;
    return todos.filter(t => {
      if (tab === "shopping") return t.category === "shopping";
      if (tab === "orders" || tab === "workflows") return false;
      const matchesDate = t.due_date ? isSameDay(parseISO(t.due_date), selectedDate) : false;
      const noDate = !t.due_date;
      return t.category !== "shopping" && (matchesDate || noDate);
    });
  }, [todos, tab, selectedDate, searchResults]);

  const pendingItems = filteredTodos.filter(t => t.status === "pending" && !t.archived_at);
  const doneItems = filteredTodos.filter(t => t.status === "done" && !t.archived_at);
  const totalForTab = filteredTodos.filter(t => !t.archived_at).length;
  const doneForTab = doneItems.length;
  const progressPct = totalForTab > 0 ? (doneForTab / totalForTab) * 100 : 0;

  const delegatedForDate = delegatedTasks.filter(t => t.due_date === selectedDateStr);
  const delegatedPending = delegatedForDate.filter(t => t.status === "pending").length;

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    try {
      await addTodo.mutateAsync({
        title: newTitle.trim(),
        priority: newPriority,
        category: tab === "shopping" ? "shopping" : "general",
        due_date: newDueDate || selectedDateStr,
        description: newDescription || undefined,
      });
      setNewTitle(""); setNewDueDate(""); setNewDescription(""); setAddOpen(false);
      toast.success("Added!");
    } catch { toast.error("Failed to add"); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteTodo.mutateAsync(id); toast.success("Deleted"); }
    catch { toast.error("Failed to delete"); }
  };

  const handleArchive = async (id: string) => {
    try {
      await updateTodo.mutateAsync({ id, archived_at: new Date().toISOString() } as any);
      toast.success("Archived");
    } catch { toast.error("Failed to archive"); }
  };

  const handleKanbanMove = async (id: string, newStatus: string) => {
    try {
      if (newStatus === "done") await toggleComplete.mutateAsync(id);
      else await updateTodo.mutateAsync({ id, status: newStatus } as any);
    } catch { toast.error("Failed to update"); }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !photoItemId) return;
    try {
      const url = await uploadPhoto(file, photoItemId);
      await updateTodo.mutateAsync({ id: photoItemId, photo_url: url });
      toast.success("Photo added!");
    } catch { toast.error("Upload failed"); }
    setPhotoItemId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCanvasDone = async (base64: string) => {
    setScanLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("scan-prep-note", {
        body: { image_base64: base64, file_type: "image/png", mode: "canvas" },
      });
      if (error) throw error;
      const tasks = data?.tasks || [];
      for (const t of tasks) {
        await addTodo.mutateAsync({ title: t.task, priority: "medium", category: "general", due_date: selectedDateStr, description: t.quantity || undefined });
      }
      setCanvasOpen(false);
      toast.success(`${tasks.length} tasks added from handwriting`);
    } catch (e: any) { toast.error(e?.message || "Failed to read handwriting"); }
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
      const tasks = data?.tasks || [];
      for (const t of tasks) {
        await addTodo.mutateAsync({ title: t.task, priority: "medium", category: "general", due_date: selectedDateStr, description: t.quantity || undefined });
      }
      toast.success(`${tasks.length} tasks added from photo`);
    } catch (e: any) { toast.error(e?.message || "Failed to scan photo"); }
    setScanLoading(false);
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || pendingItems.length === 0) return;
    const items: TodoTemplateItem[] = pendingItems.map(i => ({
      title: i.title, category: i.category, priority: i.priority,
      quantity: i.quantity || undefined, unit: i.unit || undefined,
    }));
    try {
      await saveAsTemplate.mutateAsync({ name: templateName.trim(), items });
      setTemplateName(""); setTemplateOpen(false);
      toast.success("Template saved!");
    } catch { toast.error("Failed to save template"); }
  };

  const handleLoadTemplate = async (id: string) => {
    try {
      const count = await loadTemplate.mutateAsync(id);
      toast.success(`Loaded ${count} items`);
      setTemplateOpen(false);
    } catch { toast.error("Failed to load template"); }
  };

  // AI Suggest
  const handleAiSuggest = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-todo-tasks", {
        body: { selected_date: selectedDateStr },
      });
      if (error) throw error;
      setAiSuggestions(data?.suggestions || []);
    } catch (e: any) {
      toast.error(e?.message || "Could not get suggestions");
    }
    setAiLoading(false);
  };

  const handleAddSuggestion = async (s: { title: string; priority: string; category: string }) => {
    try {
      await addTodo.mutateAsync({ title: s.title, priority: s.priority, category: s.category, due_date: selectedDateStr });
      setAiSuggestions(prev => prev.filter(x => x.title !== s.title));
      toast.success("Added!");
    } catch { toast.error("Failed to add"); }
  };

  // Voice command callbacks
  const voiceCallbacks = useMemo(() => ({
    addTask: (title: string) => { setNewTitle(title); setAddOpen(true); },
    showKanban: () => setViewMode("kanban"),
    showList: () => setViewMode("list"),
    nextDay: () => setSelectedDate(d => addDays(d, 1)),
    prevDay: () => setSelectedDate(d => addDays(d, -1)),
    showSearch: () => setSearchOpen(true),
    showArchive: () => setArchiveOpen(true),
    showWorkflows: () => setTab("workflows"),
  }), []);

  const isHeadChefOrOwner = role === "head_chef" || role === "owner" || isHomeCook;

  const renderItem = (item: TodoItem) => (
    <motion.div key={item.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 200, transition: { duration: 0.2 } }}
      className="bg-card border border-border rounded-xl p-4 flex items-start gap-3"
    >
      <button onClick={() => toggleComplete.mutate(item.id)} className="shrink-0 mt-0.5">
        <Circle className="w-5 h-5 text-muted-foreground" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full shrink-0", PRIORITY_COLORS[item.priority])} />
          <span className="font-medium text-foreground truncate">{item.title}</span>
        </div>
        {(item.quantity || item.description) && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {item.quantity && `${item.quantity} ${item.unit || ""}`}
            {item.quantity && item.description && " · "}
            {item.description}
          </p>
        )}
        {item.due_date && <p className="text-xs text-muted-foreground mt-0.5">{format(parseISO(item.due_date), "EEE d MMM")}</p>}
        {item.photo_url && <div className="mt-2"><img src={item.photo_url} alt="Todo photo" className="w-16 h-16 rounded-lg object-cover" /></div>}
      </div>
      <div className="flex gap-1 shrink-0">
        {settings.todoDelegateEnabled && (
          <button onClick={() => { setSendToChefItem(item); setSendToChefOpen(true); }}
            className="p-1.5 rounded-lg hover:bg-primary/10 text-primary" title={isHomeCook ? "Share task" : "Send to Chef"}>
            <Send className="w-4 h-4" />
          </button>
        )}
        <button onClick={() => { setPhotoItemId(item.id); fileInputRef.current?.click(); }}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Camera className="w-4 h-4" /></button>
        <button onClick={() => handleDelete(item.id)}
          className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
      </div>
    </motion.div>
  );

  // Archive view
  if (archiveOpen) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{isHomeCook ? "Filed Away 📁" : "Archive"}</h2>
          <Button variant="ghost" size="sm" onClick={() => setArchiveOpen(false)}><X className="w-4 h-4 mr-1" /> Back</Button>
        </div>
        <TodoArchiveView />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
      <input ref={scanFileRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoScan(f); e.target.value = ""; }} />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-primary" />
            {isHomeCook ? "My Day" : "To Do Command Portal"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {isHomeCook ? `${pendingCount} things left` : `${pendingCount} tasks pending`}
          </p>
        </div>
        <div className="flex gap-1 items-center">
          {settings.todoSearchEnabled && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSearchOpen(!searchOpen)}>
              <Search className="w-4 h-4" />
            </Button>
          )}
          {settings.todoArchiveEnabled && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setArchiveOpen(true)}>
              <ArchiveIcon className="w-4 h-4" />
            </Button>
          )}
          {settings.todoAiSuggestEnabled && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleAiSuggest} disabled={aiLoading}>
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            </Button>
          )}
          {settings.todoVoiceEnabled && <TodoVoiceMic callbacks={voiceCallbacks} isHomeCook={isHomeCook} />}
          {settings.todoHandwriteEnabled && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCanvasOpen(true)}>
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          {settings.todoScanEnabled && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => scanFileRef.current?.click()} disabled={scanLoading}>
              <Camera className="w-4 h-4" />
            </Button>
          )}
          {settings.todoKanbanEnabled && (
            <div className="flex gap-0.5 p-0.5 rounded-lg bg-muted">
              <button onClick={() => setViewMode("list")}
                className={cn("p-1.5 rounded-md transition-all", viewMode === "list" ? "bg-background shadow-sm" : "text-muted-foreground")}>
                <List className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode("kanban")}
                className={cn("p-1.5 rounded-md transition-all", viewMode === "kanban" ? "bg-background shadow-sm" : "text-muted-foreground")}>
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          )}
          <TodoSettingsDrawer isHomeCook={isHomeCook} />
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
          <div className="flex gap-2">
            <Input placeholder="Search tasks..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus className="flex-1" />
            <Button variant="ghost" size="icon" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}><X className="w-4 h-4" /></Button>
          </div>
          {searchResults && <p className="text-xs text-muted-foreground mt-1">{searchResults.length} results</p>}
        </motion.div>
      )}

      {/* AI Suggestions */}
      {aiSuggestions.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2">
          {aiSuggestions.map((s, i) => (
            <button key={i} onClick={() => handleAddSuggestion(s)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
              <Plus className="w-3 h-3" /> {s.title}
            </button>
          ))}
          <button onClick={() => setAiSuggestions([])} className="text-xs text-muted-foreground hover:underline px-2">Dismiss</button>
        </motion.div>
      )}

      {/* Day Carousel */}
      {!searchOpen && settings.todoDayCarouselEnabled && (
        <div className="card-elevated p-3">
          <PrepDayCarousel selectedDate={selectedDate}
            onSelectDate={(d) => { setSelectedDate(d); setWeekStart(startOfWeek(d, { weekStartsOn: 1 })); }}
            weekStart={weekStart} onWeekChange={setWeekStart} />
        </div>
      )}

      {!searchOpen && <PrepDayHeader date={selectedDate} />}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as TodoTab)} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="tasks" className="flex-1 gap-1.5">
            <ListChecks className="w-4 h-4" /> {isHomeCook ? "To-Do" : "Tasks"}
          </TabsTrigger>
          {settings.todoShoppingTabEnabled && (
            <TabsTrigger value="shopping" className="flex-1 gap-1.5">
              <ShoppingCart className="w-4 h-4" /> Shopping
            </TabsTrigger>
          )}
          {settings.todoChefOrdersEnabled && (
            <TabsTrigger value="orders" className="flex-1 gap-1.5">
              <ClipboardList className="w-4 h-4" /> {isHomeCook ? "Requests" : "Orders"}
            </TabsTrigger>
          )}
          {settings.todoWorkflowsEnabled && (
            <TabsTrigger value="workflows" className="flex-1 gap-1.5">
              <Repeat className="w-4 h-4" /> {isHomeCook ? "Routines" : "Workflows"}
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>

      {/* Template buttons */}
      {settings.todoTemplatesEnabled && tab === "tasks" && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setTemplateOpen(true)}>
            <BookOpen className="w-4 h-4 mr-1" /> {isHomeCook ? "My Templates" : "Templates"}
          </Button>
        </div>
      )}

      {/* Delegated tasks indicator */}
      {tab === "tasks" && delegatedForDate.length > 0 && (
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
          <p className="text-sm text-foreground">
            <Send className="w-4 h-4 inline mr-1 text-primary" />
            <strong>{delegatedForDate.length}</strong> delegated
            {delegatedPending > 0 && <span className="text-primary ml-1">({delegatedPending} pending)</span>}
          </p>
        </div>
      )}

      {/* Tab content */}
      {tab === "orders" ? (
        <ChefOrdersReview />
      ) : tab === "workflows" ? (
        <WorkflowRulesPanel isHomeCook={isHomeCook} />
      ) : (
        <>
          {/* Progress bar */}
          {settings.todoProgressBarEnabled && totalForTab > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{doneForTab} of {totalForTab} done</span>
                <span>{progressPct.toFixed(0)}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }} animate={{ width: `${progressPct}%` }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }} />
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (settings.todoKanbanEnabled && viewMode === "kanban") ? (
            <KanbanBoard todos={filteredTodos} onMove={handleKanbanMove} onDelete={handleDelete}
              onArchive={handleArchive} onPhotoClick={(id) => { setPhotoItemId(id); fileInputRef.current?.click(); }}
              canDelete={isHeadChefOrOwner} category={tab} />
          ) : (
            <>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">{pendingItems.map(renderItem)}</AnimatePresence>
                {pendingItems.length === 0 && !isLoading && (
                  <div className="text-center py-12 text-muted-foreground">
                    <ListChecks className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">
                      {isHomeCook ? `Nothing for ${format(selectedDate, "EEEE")} — enjoy your day! 🌿` : `Nothing for ${format(selectedDate, "EEEE")} 🎉`}
                    </p>
                    <p className="text-sm mt-1">{isHomeCook ? "Tap + to jot something down" : "Tap + to add a task"}</p>
                  </div>
                )}
              </div>
              {doneItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Completed ({doneItems.length})</span>
                    <button onClick={() => { clearCompleted.mutate(tab === "shopping" ? "shopping" : undefined); toast.success("Cleared"); }}
                      className="text-xs text-destructive hover:underline">Clear</button>
                  </div>
                  {doneItems.map(item => (
                    <div key={item.id} className="bg-muted/50 border border-border/50 rounded-xl p-4 flex items-center gap-3 opacity-60">
                      <button onClick={() => toggleComplete.mutate(item.id)} className="shrink-0"><Check className="w-5 h-5 text-success" /></button>
                      <span className="text-sm line-through text-muted-foreground truncate flex-1">{item.title}</span>
                      <button onClick={() => handleDelete(item.id)} className="p-1 rounded hover:bg-destructive/10 text-destructive shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* FAB */}
      {tab !== "orders" && tab !== "workflows" && (
        <motion.button
          onClick={() => { setNewDueDate(selectedDateStr); setAddOpen(true); }}
          className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
          whileTap={{ scale: 0.9 }}
          style={{ boxShadow: "0 4px 14px 0 hsl(var(--primary) / 0.4)" }}
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      )}

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add {tab === "shopping" ? "Shopping Item" : "Task"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <Input placeholder={tab === "shopping" ? "e.g. 2kg Flour" : "e.g. Prep cookie dough"} value={newTitle}
              onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdd()} autoFocus />
            <Input placeholder="Description (optional)" value={newDescription} onChange={e => setNewDescription(e.target.value)} />
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              <Input type="date" value={newDueDate || selectedDateStr} onChange={e => setNewDueDate(e.target.value)} className="flex-1" />
            </div>
            {tab === "tasks" && (
              <div className="flex gap-2">
                {(["high", "medium", "low"] as const).map(p => (
                  <button key={p} onClick={() => setNewPriority(p)}
                    className={cn("flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all border",
                      newPriority === p ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border")}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleAdd} disabled={!newTitle.trim() || addTodo.isPending} className="w-full">
              {addTodo.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />} Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Templates</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {pendingItems.length > 0 && (
              <div className="space-y-2 p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground font-medium">Save current {pendingItems.length} pending items</p>
                <div className="flex gap-2">
                  <Input placeholder="Template name" value={templateName} onChange={e => setTemplateName(e.target.value)} className="flex-1" />
                  <Button size="sm" onClick={handleSaveTemplate} disabled={!templateName.trim() || saveAsTemplate.isPending}>
                    <BookmarkPlus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Saved Templates</p>
              {templates.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No templates yet</p>
              ) : templates.map(t => {
                const items = (typeof t.items === "string" ? JSON.parse(t.items) : t.items) as TodoTemplateItem[];
                return (
                  <div key={t.id} className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{items.length} items</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleLoadTemplate(t.id)} disabled={loadTemplate.isPending}>Load</Button>
                    <button onClick={() => deleteTemplate.mutate(t.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send to Chef Dialog */}
      <SendToChefDialog open={sendToChefOpen} onOpenChange={setSendToChefOpen}
        taskTitle={sendToChefItem?.title || ""} taskId={sendToChefItem?.id} quantity={sendToChefItem?.quantity || undefined} />

      {/* Scan loading */}
      {scanLoading && !canvasOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-lg">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm text-foreground">Reading…</span>
        </div>
      )}

      {/* Finger Canvas */}
      <FingerCanvas open={canvasOpen} onClose={() => setCanvasOpen(false)} onDone={handleCanvasDone} loading={scanLoading} />
    </div>
  );
};

export default TodoPanel;
