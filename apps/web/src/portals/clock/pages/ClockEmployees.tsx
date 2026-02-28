import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Plus, MessageSquare, AlertTriangle } from "lucide-react";

const ClockEmployees = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [lifecycle, setLifecycle] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [absences, setAbsences] = useState<any[]>([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteForm, setNoteForm] = useState({ category: "GENERAL", note: "" });

  useEffect(() => {
    if (!orgId) return;
    const load = async () => {
      const { data } = await supabase.from("employee_profiles").select("*").eq("org_id", orgId).eq("is_active", true);
      if (data) {
        const userIds = data.map((e: any) => e.user_id);
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", userIds);
        setEmployees(data.map((e: any) => ({
          ...e,
          full_name: profiles?.find((p: any) => p.user_id === e.user_id)?.full_name || "Unknown",
          email: profiles?.find((p: any) => p.user_id === e.user_id)?.email || "",
        })));
      }
    };
    load();
  }, [orgId]);

  const loadEmployeeDetail = async (userId: string) => {
    setSelectedUser(userId);
    const [lcRes, notesRes, absRes] = await Promise.all([
      supabase.from("employee_lifecycle").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("employee_notes").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("absence_records").select("*").eq("user_id", userId).order("date", { ascending: false }),
    ]);
    setLifecycle(lcRes.data || []);
    setNotes(notesRes.data || []);
    setAbsences(absRes.data || []);
  };

  const addNote = async () => {
    if (!selectedUser || !orgId || !noteForm.note) return;
    await supabase.from("employee_notes").insert({
      org_id: orgId,
      user_id: selectedUser,
      category: noteForm.category,
      note: noteForm.note,
      created_by: user?.id,
    });
    toast({ title: "Note added" });
    setShowAddNote(false);
    setNoteForm({ category: "GENERAL", note: "" });
    loadEmployeeDetail(selectedUser);
  };

  const categoryColors: Record<string, string> = {
    POSITIVE: "text-green-600",
    CONCERN: "text-yellow-600",
    INCIDENT: "text-red-600",
    TRAINING: "text-blue-600",
    REVIEW: "text-purple-600",
    GENERAL: "text-muted-foreground",
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="w-6 h-6" /> Employee Lifecycle
        </h1>
        <p className="text-muted-foreground">Journey tracking, notes, and absence patterns</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {employees.map((e) => (
          <Card key={e.user_id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => loadEmployeeDetail(e.user_id)}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{e.full_name}</p>
                <p className="text-xs text-muted-foreground">{e.classification} · {e.employment_type}</p>
              </div>
              <Badge variant="outline">{format(new Date(e.start_date), "d MMM yyyy")}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedUser} onOpenChange={(o) => !o && setSelectedUser(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{employees.find(e => e.user_id === selectedUser)?.full_name}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="lifecycle">
            <TabsList><TabsTrigger value="lifecycle">Journey</TabsTrigger><TabsTrigger value="notes">Notes</TabsTrigger><TabsTrigger value="absences">Absences</TabsTrigger></TabsList>
            <TabsContent value="lifecycle" className="space-y-2 mt-3">
              {lifecycle.length === 0 ? <p className="text-sm text-muted-foreground">No lifecycle events recorded.</p> : lifecycle.map((lc) => (
                <div key={lc.id} className="p-3 border rounded-lg border-border">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{lc.event_type.replace(/_/g, " ")}</Badge>
                    <span className="text-xs text-muted-foreground">{format(new Date(lc.created_at), "d MMM yyyy")}</span>
                  </div>
                  {lc.notes && <p className="text-sm text-muted-foreground mt-1">{lc.notes}</p>}
                </div>
              ))}
            </TabsContent>
            <TabsContent value="notes" className="space-y-2 mt-3">
              <Button size="sm" onClick={() => setShowAddNote(true)}><Plus className="w-3 h-3 mr-1" /> Add Note</Button>
              {notes.length === 0 ? <p className="text-sm text-muted-foreground">No notes.</p> : notes.map((n) => (
                <div key={n.id} className="p-3 border rounded-lg border-border">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${categoryColors[n.category]}`}>{n.category}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(n.created_at), "d MMM yyyy")}</span>
                  </div>
                  <p className="text-sm text-foreground mt-1">{n.note}</p>
                </div>
              ))}
            </TabsContent>
            <TabsContent value="absences" className="space-y-2 mt-3">
              {absences.length === 0 ? <p className="text-sm text-muted-foreground">No absences recorded.</p> : absences.map((a) => (
                <div key={a.id} className="p-3 border rounded-lg border-border flex items-center justify-between">
                  <div>
                    <Badge variant="destructive" className="text-xs">{a.absence_type.replace(/_/g, " ")}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{a.reason || "No reason given"}</p>
                  </div>
                  <span className="text-sm text-foreground">{format(new Date(a.date), "d MMM yyyy")}</span>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddNote} onOpenChange={setShowAddNote}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Performance Note</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={noteForm.category} onValueChange={(v) => setNoteForm(f => ({ ...f, category: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["POSITIVE", "CONCERN", "INCIDENT", "TRAINING", "REVIEW", "GENERAL"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea placeholder="Note..." value={noteForm.note} onChange={(e) => setNoteForm(f => ({ ...f, note: e.target.value }))} />
            <Button className="w-full" onClick={addNote} disabled={!noteForm.note}>Save Note</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClockEmployees;
