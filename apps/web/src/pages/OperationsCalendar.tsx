import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Plus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Wrench,
  FileText,
  Shield,
  List,
  Grid3X3
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, isBefore, addDays, getMonth, getYear, isSameMonth } from "date-fns";
import YearView from "@/components/calendar/YearView";
import EventList from "@/components/calendar/EventList";
import AlertBanner from "@/components/calendar/AlertBanner";

interface CalendarEvent {
  id: string;
  title: string;
  event_type: string;
  date: string;
  time: string | null;
  description: string | null;
  location: string | null;
  status: string | null;
}

const eventTypes = [
  { value: "maintenance", label: "Maintenance", icon: Wrench, color: "text-primary" },
  { value: "license", label: "License Renewal", icon: FileText, color: "text-warning" },
  { value: "inspection", label: "Inspection", icon: Shield, color: "text-destructive" },
  { value: "training", label: "Training", icon: Calendar, color: "text-success" },
  { value: "other", label: "Other", icon: Calendar, color: "text-muted-foreground" },
];

const OperationsCalendar = () => {
  const { user, profile, canEdit } = useAuth();
  const { currentOrg } = useOrg();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<CalendarEvent | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  
  // View state
  const [viewMode, setViewMode] = useState<"year" | "list">("year");
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    event_type: "maintenance",
    date: new Date().toISOString().split("T")[0],
    time: "",
    description: "",
    location: "",
    status: "upcoming",
  });

  const hasEditPermission = canEdit("calendar");
  const alertsPostedRef = useRef(false);

  // Post calendar alerts to the Kitchen Wall
  const postAlertsToWall = async (alertEvents: CalendarEvent[]) => {
    if (!user?.id || !currentOrg?.id || alertEvents.length === 0) return;

    // Check which events have already been posted today to avoid duplicates
    const today = new Date().toISOString().split("T")[0];
    const { data: existingPosts } = await supabase
      .from("team_posts")
      .select("content")
      .eq("org_id", currentOrg.id)
      .eq("post_type", "maintenance_request")
      .gte("created_at", `${today}T00:00:00Z`);

    const postedTitles = new Set(
      (existingPosts || []).map(p => p.content).filter(Boolean)
    );

    const typeLabels: Record<string, string> = {
      maintenance: "🔧 Maintenance",
      license: "📄 License Renewal",
      inspection: "🛡️ Inspection",
      training: "📅 Training",
      other: "📌 Calendar",
    };

    for (const event of alertEvents) {
      const alertContent = `${typeLabels[event.event_type] || "📌 Calendar"} Alert: ${event.title} — ${event.status === "overdue" ? "⚠️ OVERDUE" : "⏰ Due Soon"} (${format(new Date(event.date), "dd MMM yyyy")})${event.location ? ` • ${event.location}` : ""}`;
      
      if (postedTitles.has(alertContent)) continue;

      await supabase.from("team_posts").insert({
        user_id: user.id,
        user_name: profile?.full_name || "System",
        content: alertContent,
        post_type: "maintenance_request",
        org_id: currentOrg.id,
      });
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load calendar events");
    } else {
      const today = new Date();
      const updatedEvents = (data || []).map(event => {
        const eventDate = new Date(event.date);
        let status = event.status;
        if (event.status !== "completed") {
          if (isBefore(eventDate, today)) {
            status = "overdue";
          } else if (isBefore(eventDate, addDays(today, 7))) {
            status = "due";
          } else {
            status = "upcoming";
          }
        }
        return { ...event, status } as CalendarEvent;
      });
      setEvents(updatedEvents);

      // Auto-post overdue/due-soon alerts to the Kitchen Wall (once per session)
      if (!alertsPostedRef.current) {
        alertsPostedRef.current = true;
        const alertEvents = updatedEvents.filter(
          e => e.status === "overdue" || e.status === "due"
        );
        if (alertEvents.length > 0) {
          postAlertsToWall(alertEvents);
        }
      }
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Event title is required");
      return;
    }

    if (editingEvent) {
      const { error } = await supabase
        .from("calendar_events")
        .update({
          title: formData.title,
          event_type: formData.event_type,
          date: formData.date,
          time: formData.time || null,
          description: formData.description || null,
          location: formData.location || null,
          status: formData.status,
        })
        .eq("id", editingEvent.id);

      if (error) {
        toast.error("Failed to update event");
        console.error(error);
        return;
      }
      toast.success("Event updated");
    } else {
      const { error } = await supabase.from("calendar_events").insert({
        title: formData.title,
        event_type: formData.event_type,
        date: formData.date,
        time: formData.time || null,
        description: formData.description || null,
        location: formData.location || null,
        status: formData.status,
        created_by: user?.id,
        org_id: currentOrg?.id,
      });

      if (error) {
        toast.error("Failed to create event");
        console.error(error);
        return;
      }
      toast.success("Event created");

      // Post new event to Kitchen Wall
      if (user?.id && currentOrg?.id) {
        const typeLabels: Record<string, string> = {
          maintenance: "🔧 Maintenance",
          license: "📄 License Renewal",
          inspection: "🛡️ Inspection",
          training: "📅 Training",
          other: "📌 Calendar",
        };
        const label = typeLabels[formData.event_type] || "📌 Calendar";
        const wallContent = `${label}: ${formData.title} scheduled for ${format(new Date(formData.date), "dd MMM yyyy")}${formData.location ? ` • ${formData.location}` : ""}`;
        
        await supabase.from("team_posts").insert({
          user_id: user.id,
          user_name: profile?.full_name || "System",
          content: wallContent,
          post_type: "maintenance_request",
          org_id: currentOrg.id,
        });
      }
    }

    resetForm();
    fetchEvents();
  };

  const handleDelete = async () => {
    if (!deletingEvent) return;

    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", deletingEvent.id);

    if (error) {
      toast.error("Failed to delete event");
      console.error(error);
      return;
    }

    toast.success("Event deleted");
    setDeleteDialogOpen(false);
    setDeletingEvent(null);
    fetchEvents();
  };

  const markComplete = async (event: CalendarEvent) => {
    const { error } = await supabase
      .from("calendar_events")
      .update({ status: "completed" })
      .eq("id", event.id);

    if (error) {
      toast.error("Failed to update event");
      return;
    }

    toast.success("Marked as complete");
    fetchEvents();
  };

  const openEditDialog = (event: CalendarEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      event_type: event.event_type,
      date: event.date,
      time: event.time || "",
      description: event.description || "",
      location: event.location || "",
      status: event.status || "upcoming",
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setDialogOpen(false);
    setEditingEvent(null);
    setFormData({
      title: "",
      event_type: "maintenance",
      date: new Date().toISOString().split("T")[0],
      time: "",
      description: "",
      location: "",
      status: "upcoming",
    });
  };

  // Filter events based on selected month and type
  const getFilteredEvents = () => {
    let filtered = events;
    
    if (filterType !== "all") {
      filtered = filtered.filter(e => e.event_type === filterType);
    }
    
    if (selectedMonth) {
      filtered = filtered.filter(e => {
        const eventDate = new Date(e.date);
        return getMonth(eventDate) === getMonth(selectedMonth) && 
               getYear(eventDate) === getYear(selectedMonth);
      });
    } else {
      // Show current year events when no month selected
      filtered = filtered.filter(e => {
        const eventDate = new Date(e.date);
        return getYear(eventDate) === currentYear;
      });
    }
    
    return filtered;
  };

  const filteredEvents = getFilteredEvents();
  const overdueCount = events.filter(e => e.status === "overdue").length;
  const dueCount = events.filter(e => e.status === "due").length;

  const handleMonthSelect = (date: Date) => {
    if (selectedMonth && isSameMonth(date, selectedMonth)) {
      setSelectedMonth(null); // Deselect if clicking same month
    } else {
      setSelectedMonth(date);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="page-title font-display">Operations Calendar</h1>
            <p className="page-subtitle">Track maintenance, inspections, and important dates</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted rounded-lg p-1">
              <button
                onClick={() => setViewMode("year")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  viewMode === "year" 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  viewMode === "list" 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            {hasEditPermission && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            )}
          </div>
        </motion.div>

        {/* Alert Banner */}
        <AlertBanner overdueCount={overdueCount} dueCount={dueCount} />

        {/* Year Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center justify-between"
        >
          <button
            onClick={() => {
              setCurrentYear(y => y - 1);
              setSelectedMonth(null);
            }}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-2xl font-bold">{currentYear}</h2>
            {selectedMonth && (
              <button 
                onClick={() => setSelectedMonth(null)}
                className="text-sm text-primary hover:underline"
              >
                Showing {format(selectedMonth, "MMMM")} • Click to show all
              </button>
            )}
          </div>
          <button
            onClick={() => {
              setCurrentYear(y => y + 1);
              setSelectedMonth(null);
            }}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Filter Pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 overflow-x-auto pb-2"
        >
          <button
            onClick={() => setFilterType("all")}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              filterType === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-secondary"
            )}
          >
            All
          </button>
          {eventTypes.map(type => (
            <button
              key={type.value}
              onClick={() => setFilterType(type.value)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2",
                filterType === type.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-secondary"
              )}
            >
              <type.icon className="w-4 h-4" />
              {type.label}
            </button>
          ))}
        </motion.div>

        {/* Main Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="space-y-6"
          >
            {viewMode === "year" && (
              <YearView
                events={events.filter(e => filterType === "all" || e.event_type === filterType)}
                selectedMonth={selectedMonth}
                onMonthSelect={handleMonthSelect}
                year={currentYear}
              />
            )}

            {/* Event List */}
            <div>
              <h3 className="text-lg font-semibold mb-3">
                {selectedMonth 
                  ? `Events in ${format(selectedMonth, "MMMM yyyy")}` 
                  : `All Events in ${currentYear}`}
              </h3>
              <EventList
                events={filteredEvents}
                hasEditPermission={hasEditPermission}
                onMarkComplete={markComplete}
                onEdit={openEditDialog}
                onDelete={(event) => {
                  setDeletingEvent(event);
                  setDeleteDialogOpen(true);
                }}
                onAddNew={() => setDialogOpen(true)}
              />
            </div>
          </motion.div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={resetForm}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingEvent ? "Edit Event" : "New Event"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Hood Cleaning"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Event Type</Label>
                  <Select
                    value={formData.event_type}
                    onValueChange={(value) => setFormData({ ...formData, event_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="due">Due Soon</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Main Kitchen"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional details..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSubmit}>
                {editingEvent ? "Save Changes" : "Create Event"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={() => setDeleteDialogOpen(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Event</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              Are you sure you want to delete "{deletingEvent?.title}"? This action cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default OperationsCalendar;
