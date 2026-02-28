import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, FileText, Calendar, DollarSign, MessageSquare, Plus, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

const STAGES = ["LEAD", "ENQUIRY", "PROPOSAL_SENT", "NEGOTIATION", "CONFIRMED", "COMPLETED", "LOST"];
const NOTE_TYPES = ["NOTE", "CALL", "EMAIL", "MEETING", "FOLLOW_UP"];

const FunctionClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState("NOTE");

  const { data: client, isLoading } = useQuery({
    queryKey: ["res_function_client", id],
    queryFn: async () => {
      const { data } = await supabase.from("res_function_clients").select("*").eq("id", id!).single();
      return data;
    },
    enabled: !!id,
  });

  const { data: notes = [] } = useQuery({
    queryKey: ["res_function_notes", id],
    queryFn: async () => {
      const { data } = await supabase.from("res_function_notes").select("*").eq("client_id", id!).order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!id,
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ["res_function_proposals_client", id],
    queryFn: async () => {
      const { data } = await supabase.from("res_function_proposals").select("*").eq("client_id", id!).order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!id,
  });

  const { data: functions = [] } = useQuery({
    queryKey: ["res_functions_client", id],
    queryFn: async () => {
      const { data } = await supabase.from("res_functions").select("*").eq("client_id", id!).order("event_date", { ascending: false });
      return data ?? [];
    },
    enabled: !!id,
  });

  const updateStage = async (stage: string) => {
    const { error } = await supabase.from("res_function_clients").update({ pipeline_stage: stage } as any).eq("id", id!);
    if (error) { toast.error(error.message); return; }
    toast.success(`Moved to ${stage}`);
    qc.invalidateQueries({ queryKey: ["res_function_client", id] });
    qc.invalidateQueries({ queryKey: ["res_function_clients"] });
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    const { error } = await supabase.from("res_function_notes").insert({
      client_id: id,
      note: newNote,
      note_type: noteType,
    } as any);
    if (error) { toast.error(error.message); return; }
    setNewNote("");
    qc.invalidateQueries({ queryKey: ["res_function_notes", id] });
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!client) return <div className="p-6 text-center text-muted-foreground">Client not found</div>;

  const c = client as any;

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/reservation/functions/crm")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> CRM
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{c.contact_name}</CardTitle>
              {c.company_name && <p className="text-sm text-muted-foreground">{c.company_name}</p>}
            </div>
            <Select value={c.pipeline_stage} onValueChange={updateStage}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STAGES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-muted-foreground block">Email</span>{c.email || "—"}</div>
            <div><span className="text-muted-foreground block">Phone</span>{c.phone || "—"}</div>
            <div><span className="text-muted-foreground block">Total Events</span>{c.total_events || 0}</div>
            <div><span className="text-muted-foreground block">Total Spend</span>${Number(c.total_spend || 0).toLocaleString()}</div>
          </div>
          {c.source && <p className="text-xs text-muted-foreground mt-2">Source: {c.source}</p>}
        </CardContent>
      </Card>

      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity"><MessageSquare className="w-3 h-3 mr-1" /> Activity</TabsTrigger>
          <TabsTrigger value="proposals"><FileText className="w-3 h-3 mr-1" /> Proposals</TabsTrigger>
          <TabsTrigger value="events"><Calendar className="w-3 h-3 mr-1" /> Events</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-3 mt-3">
          {/* Add note */}
          <Card>
            <CardContent className="pt-4 space-y-2">
              <div className="flex gap-2">
                <Select value={noteType} onValueChange={setNoteType}>
                  <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NOTE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="Add a note..." value={newNote} onChange={e => setNewNote(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addNote()} className="flex-1" />
                <Button size="icon" onClick={addNote}><Send className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
          {notes.map((n: any) => (
            <div key={n.id} className="flex gap-3 p-3 rounded-lg border border-border">
              <Badge variant="outline" className="text-[10px] h-5 shrink-0">{n.note_type}</Badge>
              <div>
                <p className="text-sm">{n.note}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(n.created_at), "d MMM yyyy HH:mm")}</p>
              </div>
            </div>
          ))}
          {notes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>}
        </TabsContent>

        <TabsContent value="proposals" className="space-y-3 mt-3">
          <Button size="sm" onClick={() => navigate(`/reservation/functions/proposals/new?clientId=${id}`)}>
            <Plus className="w-4 h-4 mr-2" /> New Proposal
          </Button>
          {proposals.map((p: any) => (
            <Card key={p.id} className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate(`/reservation/functions/proposals/${p.id}`)}>
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{p.title} — #{p.proposal_number}</p>
                  <p className="text-xs text-muted-foreground">{p.event_date ? format(new Date(p.event_date), "d MMM yyyy") : "No date"} · {p.party_size} pax</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">${Number(p.total || 0).toLocaleString()}</span>
                  <Badge variant="secondary">{p.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {proposals.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No proposals yet</p>}
        </TabsContent>

        <TabsContent value="events" className="space-y-3 mt-3">
          {functions.map((f: any) => (
            <Card key={f.id} className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate(`/reservation/functions/${f.id}`)}>
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{f.event_type} — {f.party_size} pax</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(f.event_date), "d MMM yyyy")}</p>
                </div>
                <Badge variant="secondary">{f.status}</Badge>
              </CardContent>
            </Card>
          ))}
          {functions.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No events yet</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FunctionClientDetail;
