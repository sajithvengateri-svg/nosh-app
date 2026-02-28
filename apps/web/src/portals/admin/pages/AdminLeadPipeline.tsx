import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, GripVertical, Clock, User, Mail, Phone, DollarSign } from "lucide-react";
import { format } from "date-fns";

const STAGES = [
  { key: "lead", label: "Lead", color: "bg-slate-100 dark:bg-slate-800" },
  { key: "demo_booked", label: "Demo Booked", color: "bg-blue-50 dark:bg-blue-900/20" },
  { key: "trial_active", label: "Trial Active", color: "bg-amber-50 dark:bg-amber-900/20" },
  { key: "negotiation", label: "Negotiation", color: "bg-violet-50 dark:bg-violet-900/20" },
  { key: "closed_won", label: "Closed Won", color: "bg-emerald-50 dark:bg-emerald-900/20" },
  { key: "closed_lost", label: "Closed Lost", color: "bg-red-50 dark:bg-red-900/20" },
];

const sourceColors: Record<string, string> = {
  organic: "bg-slate-200 text-slate-800",
  referral: "bg-violet-200 text-violet-800",
  partner: "bg-blue-200 text-blue-800",
  inbound: "bg-emerald-200 text-emerald-800",
  outbound: "bg-amber-200 text-amber-800",
  eatsafe_upgrade: "bg-navy-200 text-navy-800 bg-indigo-200 text-indigo-800",
};

const AdminLeadPipeline = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLead, setNewLead] = useState({ venue_name: "", contact_name: "", email: "", phone: "", source: "organic", deal_value: "", notes: "" });
  const [noteText, setNoteText] = useState("");

  const fetchData = async () => {
    const [leadsRes, actsRes] = await Promise.all([
      supabase.from("leads").select("*").order("created_at", { ascending: false }),
      supabase.from("lead_activities").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    setLeads(leadsRes.data || []);
    setActivities(actsRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const moveStage = async (leadId: string, stage: string) => {
    await supabase.from("leads").update({ stage, stage_entered_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", leadId);
    await supabase.from("lead_activities").insert({ lead_id: leadId, activity_type: "stage_change", content: `Moved to ${stage.replace(/_/g, " ")}` });
    toast.success(`Moved to ${stage.replace(/_/g, " ")}`);
    fetchData();
  };

  const addLead = async () => {
    if (!newLead.venue_name) { toast.error("Venue name required"); return; }
    const { error } = await supabase.from("leads").insert({
      venue_name: newLead.venue_name,
      contact_name: newLead.contact_name || null,
      email: newLead.email || null,
      phone: newLead.phone || null,
      source: newLead.source,
      deal_value: newLead.deal_value ? Number(newLead.deal_value) : null,
      notes: newLead.notes || null,
    });
    if (error) toast.error("Failed to add lead");
    else {
      toast.success("Lead added");
      setNewLead({ venue_name: "", contact_name: "", email: "", phone: "", source: "organic", deal_value: "", notes: "" });
      setShowAddForm(false);
      fetchData();
    }
  };

  const addNote = async () => {
    if (!selectedLead || !noteText.trim()) return;
    await supabase.from("lead_activities").insert({ lead_id: selectedLead.id, activity_type: "note", content: noteText });
    setNoteText("");
    toast.success("Note added");
    fetchData();
  };

  const daysInStage = (lead: any) => {
    if (!lead.stage_entered_at) return 0;
    return Math.floor((Date.now() - new Date(lead.stage_entered_at).getTime()) / 86400000);
  };

  const leadActivities = selectedLead ? activities.filter((a: any) => a.lead_id === selectedLead.id) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lead Pipeline</h1>
          <p className="text-sm text-muted-foreground">Drag leads through your sales funnel.</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}><Plus className="w-4 h-4 mr-1" /> Add Lead</Button>
      </div>

      {/* Add Lead Form */}
      {showAddForm && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold text-foreground">New Lead</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Venue Name *</Label><Input value={newLead.venue_name} onChange={e => setNewLead(p => ({ ...p, venue_name: e.target.value }))} /></div>
              <div><Label>Contact Name</Label><Input value={newLead.contact_name} onChange={e => setNewLead(p => ({ ...p, contact_name: e.target.value }))} /></div>
              <div><Label>Email</Label><Input type="email" value={newLead.email} onChange={e => setNewLead(p => ({ ...p, email: e.target.value }))} /></div>
              <div><Label>Phone</Label><Input value={newLead.phone} onChange={e => setNewLead(p => ({ ...p, phone: e.target.value }))} /></div>
              <div><Label>Source</Label>
                <Select value={newLead.source} onValueChange={v => setNewLead(p => ({ ...p, source: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organic">Organic</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                    <SelectItem value="inbound">Inbound</SelectItem>
                    <SelectItem value="outbound">Outbound</SelectItem>
                    <SelectItem value="eatsafe_upgrade">EatSafe Upgrade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Deal Value ($)</Label><Input type="number" value={newLead.deal_value} onChange={e => setNewLead(p => ({ ...p, deal_value: e.target.value }))} /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={newLead.notes} onChange={e => setNewLead(p => ({ ...p, notes: e.target.value }))} /></div>
            <div className="flex gap-2">
              <Button onClick={addLead}>Add Lead</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kanban Board */}
      {loading ? (
        <div className="animate-pulse h-60 bg-muted rounded-lg" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {STAGES.map(stage => {
            const stageLeads = leads.filter(l => l.stage === stage.key);
            return (
              <div key={stage.key} className={`rounded-lg p-3 min-h-[200px] ${stage.color}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">{stage.label}</h3>
                  <Badge variant="secondary" className="text-[10px]">{stageLeads.length}</Badge>
                </div>
                <div className="space-y-2">
                  {stageLeads.map(lead => {
                    const days = daysInStage(lead);
                    return (
                      <Card key={lead.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedLead(lead)}>
                        <CardContent className="p-3 space-y-1.5">
                          <p className="text-sm font-medium text-foreground truncate">{lead.venue_name}</p>
                          {lead.contact_name && <p className="text-xs text-muted-foreground truncate">{lead.contact_name}</p>}
                          <div className="flex items-center justify-between">
                            <Badge className={`text-[9px] ${sourceColors[lead.source] || ""}`}>{lead.source}</Badge>
                            {days > 7 && <span className="text-[10px] text-red-500 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{days}d</span>}
                          </div>
                          {lead.deal_value && <p className="text-xs font-medium text-emerald-600">${Number(lead.deal_value).toLocaleString()}/mo</p>}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lead Detail Sheet */}
      <Sheet open={!!selectedLead} onOpenChange={open => !open && setSelectedLead(null)}>
        <SheetContent className="w-[400px] sm:w-[500px] overflow-y-auto">
          {selectedLead && (
            <div className="space-y-5 mt-4">
              <SheetHeader>
                <SheetTitle>{selectedLead.venue_name}</SheetTitle>
              </SheetHeader>

              <div className="space-y-2 text-sm">
                {selectedLead.contact_name && <div className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" />{selectedLead.contact_name}</div>}
                {selectedLead.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" />{selectedLead.email}</div>}
                {selectedLead.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" />{selectedLead.phone}</div>}
                {selectedLead.deal_value && <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-muted-foreground" />${Number(selectedLead.deal_value).toLocaleString()}/mo</div>}
              </div>

              <div>
                <Label className="text-xs">Move to Stage</Label>
                <Select value={selectedLead.stage} onValueChange={v => { moveStage(selectedLead.id, v); setSelectedLead({ ...selectedLead, stage: v }); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {selectedLead.notes && (
                <div>
                  <Label className="text-xs">Notes</Label>
                  <p className="text-sm text-muted-foreground">{selectedLead.notes}</p>
                </div>
              )}

              {/* Add Note */}
              <div className="space-y-2">
                <Label className="text-xs">Add Note</Label>
                <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note..." rows={2} />
                <Button size="sm" onClick={addNote} disabled={!noteText.trim()}>Save Note</Button>
              </div>

              {/* Activity Log */}
              <div>
                <Label className="text-xs">Activity</Label>
                {leadActivities.length === 0 ? (
                  <p className="text-sm text-muted-foreground mt-1">No activity yet.</p>
                ) : (
                  <div className="space-y-2 mt-2 max-h-[200px] overflow-y-auto">
                    {leadActivities.map((a: any) => (
                      <div key={a.id} className="flex gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <div>
                          <p className="text-foreground">{a.content}</p>
                          <p className="text-[10px] text-muted-foreground">{format(new Date(a.created_at), "dd MMM HH:mm")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdminLeadPipeline;
