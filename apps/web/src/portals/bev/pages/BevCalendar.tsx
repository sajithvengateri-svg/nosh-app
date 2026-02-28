import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import { format } from "date-fns";

const EVENT_TYPES = [
  { value: "stocktake", label: "Stocktake", color: "bg-blue-500" },
  { value: "line_cleaning", label: "Line Cleaning", color: "bg-emerald-500" },
  { value: "delivery", label: "Delivery", color: "bg-amber-500" },
  { value: "tasting", label: "Tasting Event", color: "bg-purple-500" },
  { value: "training", label: "Staff Training", color: "bg-pink-500" },
  { value: "promotion", label: "Promotion", color: "bg-red-500" },
];

const BevCalendar = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ title: "", date: new Date().toISOString().split("T")[0], event_type: "stocktake", description: "", time: "" });

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    const { data } = await supabase.from("calendar_events").select("*").eq("org_id", orgId).order("date", { ascending: false }).limit(50);
    setEvents(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [orgId]);

  const save = async () => {
    if (!orgId || !form.title.trim()) return;
    const { error } = await supabase.from("calendar_events").insert({
      org_id: orgId, title: form.title, date: form.date, event_type: form.event_type,
      description: form.description || null, time: form.time || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Event added!");
    setShowDialog(false);
    setForm({ title: "", date: new Date().toISOString().split("T")[0], event_type: "stocktake", description: "", time: "" });
    load();
  };

  const getColor = (type: string) => EVENT_TYPES.find(e => e.value === type)?.color || "bg-muted";

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Bar Calendar</h1>
          <p className="text-sm text-muted-foreground">Operations calendar for bar events and schedules</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Add Event</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Event</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
                <div><Label>Time</Label><Input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} /></div>
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.event_type} onValueChange={v => setForm({ ...form, event_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EVENT_TYPES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <Button onClick={save} className="w-full">Add Event</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="flex gap-3 flex-wrap">
        {EVENT_TYPES.map(e => (
          <span key={e.value} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-muted text-foreground">
            <span className={`w-2 h-2 rounded-full ${e.color}`} />{e.label}
          </span>
        ))}
      </div>

      {loading ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
      ) : events.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No events scheduled. Add your first bar event.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {events.map(ev => (
            <Card key={ev.id}>
              <CardContent className="pt-4 flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${getColor(ev.event_type)} shrink-0`} />
                <div className="flex-1">
                  <p className="font-medium text-sm">{ev.title}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(ev.date), "dd MMM yyyy")} {ev.time || ""} {ev.description ? `· ${ev.description}` : ""}</p>
                </div>
                <Badge variant="outline" className="capitalize">{ev.event_type?.replace("_", " ")}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BevCalendar;
